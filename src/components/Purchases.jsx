import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderLifecycle from "./OrderLifecycle";
import { api } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const cash = (minor) => formatCurrency(Number(minor || 0) / 100);
const when = (value) => (value ? new Date(value).toLocaleString() : "—");
const label = (value) => String(value || "unknown").replaceAll("_", " ");
const key = () => crypto.randomUUID();
const toLocalDateTime = (date) => {
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
const closeDefault = () => toLocalDateTime(new Date(Date.now() + 86400000));
const closeMaximum = (days) =>
  toLocalDateTime(new Date(Date.now() + Number(days || 7) * 86400000));

function useData(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loader());
      setError("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    const timer = window.setTimeout(reload, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);
  return { data, loading, error, reload, setError };
}

export function ListingPurchaseActions({
  listing,
  context,
  groupOnly = false,
}) {
  const [quantity, setQuantity] = useState("");
  const [groupTarget, setGroupTarget] = useState("");
  const [shareSizes, setShareSizes] = useState(["", "", ""]);
  const [groupDeadline, setGroupDeadline] = useState(closeDefault);
  const [fulfilmentPriority, setFulfilmentPriority] = useState("standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const groups = useData(
    useCallback(
      () => api("/listings/" + listing.id + "/purchase-groups?limit=50"),
      [listing.id],
    ),
  );
  async function direct(event) {
    event.preventDefault();
    const priority =
      !directEnabled && urgentEnabled ? "expedited" : fulfilmentPriority;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const order = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          listingId: listing.id,
          quantity,
          requestKey: key(),
          fulfilmentPriority: priority,
        }),
      });
      setNotice(
        order.fulfilment_priority === "expedited"
          ? `Urgent order placed at ${cash(order.unit_price_minor)} per ${order.unit}. Seller response is due ${when(order.seller_response_due_at)}. The ${order.fulfilment_lead_time_days}-day fulfillment clock starts after payment is verified.`
          : "Order placed. Seller response is due " +
              when(order.seller_response_due_at) +
              ".",
      );
      setQuantity("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function join(groupId, share) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const order = await api(
        "/purchase-groups/" + groupId + "/contributions",
        {
          method: "POST",
          body: JSON.stringify({ quantity: share, requestKey: key() }),
        },
      );
      setNotice(
        "Group share joined. Locked total: " +
          cash(order.total_minor) +
          ". Seller confirmation comes before payment.",
      );
      await groups.reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function createGroup(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/listings/" + listing.id + "/purchase-groups", {
        method: "POST",
        body: JSON.stringify({
          targetQuantity: groupTarget,
          shareOptions: shareSizes.filter(Boolean),
          closesAt: new Date(groupDeadline).toISOString(),
          requestKey: key(),
        }),
      });
      setNotice(
        "Your group is open. Buyers can join using one of your share sizes.",
      );
      setGroupTarget("");
      setShareSizes(["", "", ""]);
      await groups.reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const directEnabled =
    !groupOnly && ["direct", "both"].includes(listing.purchase_mode);
  const urgentEnabled =
    !groupOnly && Boolean(listing.expedited_price_per_unit_minor);
  const urgentOrderSelected =
    fulfilmentPriority === "expedited" || (!directEnabled && urgentEnabled);
  let orderButtonLabel = "Request direct purchase";
  if (urgentOrderSelected) orderButtonLabel = "Request urgent order";
  if (busy) orderButtonLabel = "Placing order…";
  const groupEnabled = ["group", "both"].includes(listing.purchase_mode);
  return (
    <section
      className={`purchase-actions${groupOnly ? " purchase-actions--compact" : ""}`}
    >
      {!groupOnly && <p className="eyebrow">Buying options</p>}
      <h2>{groupOnly ? "Open group orders" : "Purchase this material"}</h2>
      {!context && <p>Sign in as a Buyer to place an order or join a group.</p>}
      {context && (directEnabled || urgentEnabled) && (
        <form className="purchase-form" onSubmit={direct}>
          {directEnabled && urgentEnabled && (
            <label className="field">
              <span>Order speed</span>
              <select
                value={fulfilmentPriority}
                onChange={(event) => setFulfilmentPriority(event.target.value)}
              >
                <option value="standard">Standard price and timing</option>
                <option value="expedited">
                  Urgent · {cash(listing.expedited_price_per_unit_minor)} per{" "}
                  {listing.unit} · {listing.expedited_lead_time_days} days
                </option>
              </select>
            </label>
          )}
          {!directEnabled && urgentEnabled && (
            <p className="notice">
              Urgent order · {cash(listing.expedited_price_per_unit_minor)} per{" "}
              {listing.unit} · Seller's {listing.expedited_lead_time_days}-day
              fulfillment turnaround starts after verified payment.
            </p>
          )}
          <label className="field">
            <span>
              Quantity ({listing.unit}) · minimum{" "}
              {(!directEnabled && urgentEnabled) ||
              fulfilmentPriority === "expedited"
                ? listing.expedited_min_order_quantity ||
                  listing.min_order_quantity
                : listing.min_order_quantity}
            </span>
            <input
              type="number"
              min="0.001"
              step="0.001"
              max={listing.quantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </label>
          <button className="button" disabled={busy}>
            {orderButtonLabel}
          </button>
          <small>
            Seller confirms first. If confirmed, you have 48 hours to pay.
          </small>
        </form>
      )}
      {groupEnabled && (
        <div className="purchase-list">
          {!groupOnly && <h3>Open group orders</h3>}
          {context && !groupOnly && (
            <form
              className="purchase-form purchase-create-group-form"
              onSubmit={createGroup}
            >
              <h3>Start a group order</h3>
              <p>
                Set the total target (at least the listing MOQ) and three or
                four share sizes. Individual shares may be smaller than the
                listing MOQ; the total group quantity must meet it.
              </p>
              <label className="field">
                <span>
                  Total group target ({listing.unit}) · listing MOQ{" "}
                  {listing.min_order_quantity}
                </span>
                <input
                  type="number"
                  min={listing.min_order_quantity}
                  max={listing.quantity}
                  step="0.001"
                  value={groupTarget}
                  onChange={(event) => setGroupTarget(event.target.value)}
                  required
                />
              </label>
              {shareSizes.map((size, index) => (
                <label className="field" key={index}>
                  <span>
                    Share option {index + 1} ({listing.unit})
                  </span>
                  <input
                    type="number"
                    min="0.001"
                    max={groupTarget || listing.quantity}
                    step="0.001"
                    value={size}
                    onChange={(event) =>
                      setShareSizes((current) =>
                        current.map((value, i) =>
                          i === index ? event.target.value : value,
                        ),
                      )
                    }
                    required
                  />
                </label>
              ))}
              {shareSizes.length < 4 && (
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => setShareSizes((current) => [...current, ""])}
                >
                  Add another share size
                </button>
              )}
              <label className="field">
                <span>
                  Join period ends (Seller maximum:{" "}
                  {listing.max_group_join_days || 7} days)
                </span>
                <input
                  type="datetime-local"
                  min={closeDefault()}
                  max={closeMaximum(listing.max_group_join_days)}
                  value={groupDeadline}
                  onChange={(event) => setGroupDeadline(event.target.value)}
                  required
                />
              </label>
              <small>
                A share equal to the exact remaining quantity is also accepted.
              </small>
              <button className="button" disabled={busy}>
                {busy ? "Starting group…" : "Start group"}
              </button>
            </form>
          )}
          {groups.error && (
            <div className="notice notice--error" role="alert">
              {groups.error}
            </div>
          )}
          {groups.loading && <p>Loading groups…</p>}
          {!groups.loading && !(groups.data?.items || []).length && (
            <p className="group-empty-state">
              <strong>No group orders are open right now.</strong>
              <span>
                No Buyer has started a group for this material yet. You can
                start one above.
              </span>
            </p>
          )}
          {(groups.data?.items || []).map((group) => (
            <BuyerGroup
              key={group.id}
              group={group}
              signedIn={Boolean(context)}
              busy={busy}
              onJoin={join}
            />
          ))}
        </div>
      )}
      {error && (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice notice--success" role="status">
          {notice}
        </div>
      )}
      {!context && (
        <Link className="button" to="/login">
          Sign in to buy
        </Link>
      )}
    </section>
  );
}

function BuyerGroup({ group, signedIn, busy, onJoin }) {
  const [share, setShare] = useState("");
  const joined = Number(group.joined_quantity || 0);
  const remaining = Math.max(0, Number(group.target_quantity) - joined);
  const options = (group.share_options || [])
    .map(Number)
    .filter((value) => value > 0 && value <= remaining);
  if (remaining > 0 && !options.some((value) => value === remaining))
    options.push(remaining);
  const canJoin = group.status === "open";
  return (
    <article className="purchase-card">
      <div className="purchase-card-heading">
        <div>
          <strong>{group.organization_name}</strong>
          <span>{label(group.status)}</span>
        </div>
        <small>
          Joining closes {when(group.closes_at)}; joined shares stay reserved
          while the group resolves.
        </small>
      </div>
      <p>
        {joined} / {group.target_quantity} {group.unit} joined · {remaining}{" "}
        {group.unit} to target
      </p>
      <progress
        max={Number(group.target_quantity) || 1}
        value={Math.min(joined, Number(group.target_quantity))}
        aria-label="Group progress"
      />
      {signedIn && remaining > 0 && canJoin && (
        <form
          className="purchase-form purchase-form--inline"
          onSubmit={(event) => {
            event.preventDefault();
            onJoin(group.id, share);
            setShare("");
          }}
        >
          <label className="field">
            <span>Your share ({group.unit})</span>
            <select
              value={share}
              onChange={(event) => setShare(event.target.value)}
              required
            >
              <option value="">Choose a share</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value} {group.unit}
                  {value === remaining ? " · exact remainder" : ""}
                </option>
              ))}
            </select>
          </label>
          <button className="button" disabled={busy}>
            Join group
          </button>
        </form>
      )}
      {!signedIn && (
        <Link className="text-action" to="/login">
          Sign in to join
        </Link>
      )}
      {group.status === "deadline_choices" && (
        <p>
          Group target was not reached. Current participants can extend once,
          switch an eligible share to urgent direct purchase, or leave from My
          purchases.
        </p>
      )}
    </article>
  );
}

export function BuyerPurchases() {
  const loader = useCallback(() => api("/orders/mine?limit=50"), []);
  const orders = useData(loader);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  async function leave(order) {
    if (!window.confirm("Leave this group and release your reserved share?"))
      return;
    setBusy(order.id);
    orders.setError("");
    setNotice("");
    try {
      await api(
        "/purchase-groups/" +
          order.group_id +
          "/contributions/" +
          order.id +
          "/leave",
        { method: "POST", body: JSON.stringify({}) },
      );
      setNotice("You left the group and your reserved share was released.");
      await orders.reload();
    } catch (failure) {
      orders.setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  async function groupAction(order, action) {
    if (action === "direct") {
      const total =
        Number(order.quantity) * Number(order.expedited_price_per_unit_minor);
      const accepted = window.confirm(
        `Switch ${order.quantity} ${order.unit} to a separate urgent order?\n\nUrgent price: ${cash(order.expedited_price_per_unit_minor)} per ${order.unit}\nTotal: ${cash(total)} PKR\nSeller turnaround: ${order.expedited_lead_time_days} days\nSeller confirmation: within 48 hours`,
      );
      if (!accepted) return;
    }
    setBusy(order.id);
    orders.setError("");
    setNotice("");
    try {
      if (action === "extend") {
        await api(`/purchase-groups/${order.group_id}/extend`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        setNotice("The group was extended once for 48 hours.");
      } else {
        const direct = await api(
          `/purchase-groups/${order.group_id}/contributions/${order.id}/switch-to-direct`,
          {
            method: "POST",
            body: JSON.stringify({ requestKey: key() }),
          },
        );
        setNotice(
          `Your share became a separate urgent order at ${cash(direct.unit_price_minor)} per ${direct.unit}. The Seller must confirm it within 48 hours.`,
        );
      }
      await orders.reload();
    } catch (failure) {
      orders.setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  const items = orders.data?.items || [];
  return (
    <section className="purchase-panel">
      <p className="eyebrow">Buyer workspace</p>
      <h2>My purchases</h2>
      <p>Track Seller decisions, group shares, and payment deadlines.</p>
      {notice && (
        <div className="notice notice--success" role="status">
          {notice}
        </div>
      )}
      {orders.error && (
        <div className="notice notice--error" role="alert">
          {orders.error}
        </div>
      )}
      {orders.loading && <p>Loading purchases…</p>}
      {!orders.loading && !items.length && (
        <p>You have no orders yet. Explore materials to get started.</p>
      )}
      <div className="purchase-list">
        {items.map((order) => (
          <article className="purchase-card" key={order.id}>
            <div className="purchase-card-heading">
              <div>
                <strong>{order.listing_title}</strong>
                <span>{label(order.status)}</span>
              </div>
              <small>Placed {when(order.created_at)}</small>
            </div>
            <p>
              {order.quantity} {order.unit} · {cash(order.total_minor)}
            </p>
            {order.fulfilment_priority === "expedited" && (
              <p className="notice">
                Urgent order · Seller turnaround:{" "}
                {order.fulfilment_lead_time_days} days
                {order.fulfilment_due_at
                  ? ` · fulfillment due ${when(order.fulfilment_due_at)}`
                  : " · clock starts after verified payment"}
              </p>
            )}
            <OrderLifecycle order={order} onChanged={orders.reload} />
            {order.group_id && <p>Group status: {label(order.group_status)}</p>}
            {order.status === "pending_seller_confirmation" && (
              <p>Seller response due {when(order.seller_response_due_at)}.</p>
            )}
            {order.status === "pending_payment" && (
              <div className="checkout-box">
                <p className="form-hint">
                  Payment due {when(order.payment_due_at)}. Checkout is secured
                  by RapidGateway.
                </p>
                <CheckoutAction order={order} />
              </div>
            )}
            {order.status === "group_open" && (
              <>
                <p>
                  Your share price is locked. Payment starts after Seller
                  confirmation.
                </p>
                {order.group_status === "open" && (
                  <p>Group join deadline: {when(order.group_closes_at)}.</p>
                )}
                {order.group_status === "deadline_choices" && (
                  <p>
                    Group target was missed. Choose an option by{" "}
                    {when(order.group_choice_deadline_at)}.
                  </p>
                )}
                {order.group_status === "open" &&
                  Number(order.group_extension_count) === 1 && (
                    <p>
                      The group is in its final 48-hour extension, until{" "}
                      {when(order.group_closes_at)}. You may stay, leave, or
                      choose an eligible urgent order.
                    </p>
                  )}
                <button
                  className="button button--quiet"
                  type="button"
                  disabled={busy === order.id}
                  onClick={() => leave(order)}
                >
                  {busy === order.id ? "Leaving…" : "Leave group"}
                </button>
                {order.group_status === "deadline_choices" &&
                  Number(order.group_extension_count) === 0 && (
                    <button
                      className="button button--quiet"
                      type="button"
                      disabled={busy === order.id}
                      onClick={() => groupAction(order, "extend")}
                    >
                      Extend group once by 48 hours
                    </button>
                  )}
                {(order.group_status === "deadline_choices" ||
                  (order.group_status === "open" &&
                    Number(order.group_extension_count) === 1 &&
                    new Date(order.group_closes_at) > new Date())) &&
                  order.expedited_price_per_unit_minor &&
                  Number(order.quantity) >=
                    Number(
                      order.expedited_min_order_quantity ||
                        order.min_order_quantity ||
                        0,
                    ) && (
                    <button
                      className="button"
                      type="button"
                      disabled={busy === order.id}
                      onClick={() => groupAction(order, "direct")}
                    >
                      Switch to urgent direct ·{" "}
                      {cash(order.expedited_price_per_unit_minor)}/{order.unit}
                    </button>
                  )}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function CheckoutAction({ order }) {
  const [mobile, setMobile] = useState("");
  const [testScenario, setTestScenario] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const attempt = await api(`/orders/${order.id}/checkout`, {
        method: "POST",
        body: JSON.stringify({
          requestKey: key(),
          mobile,
          ...(testScenario ? { testScenario } : {}),
        }),
      });
      window.location.assign(attempt.checkoutUrl);
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  return (
    <form className="checkout-form" onSubmit={start}>
      <label className="field">
        <span>Pakistan mobile number</span>
        <input
          type="tel"
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
          placeholder="03001234567"
          pattern="03[0-9]{9}"
          maxLength="11"
          autoComplete="tel"
          required
        />
      </label>
      {import.meta.env.DEV && (
        <label className="field">
          <span>Sandbox outcome</span>
          <select
            value={testScenario}
            onChange={(event) => setTestScenario(event.target.value)}
          >
            <option value="">Automatic (use amount)</option>
            {[
              "SUCCESS",
              "FAILED",
              "PENDING",
              "EXPIRED",
              "INSUFFICIENT_BALANCE",
              "INVALID_OTP",
              "TIMEOUT",
              "DUPLICATE",
            ].map((scenario) => (
              <option key={scenario} value={scenario}>
                {scenario.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={busy}>
        {busy
          ? "Preparing secure checkout…"
          : `Pay ${cash(order.total_minor)} PKR`}
      </button>
    </form>
  );
}

export function SellerOrders({ membership }) {
  const orgId = membership.organization_id;
  const orders = useData(
    useCallback(
      () => api("/organizations/" + orgId + "/orders?limit=50"),
      [orgId],
    ),
  );
  const groups = useData(
    useCallback(
      () => api("/organizations/" + orgId + "/purchase-groups?limit=50"),
      [orgId],
    ),
  );
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const mayDecide =
    membership.role === "owner" ||
    (membership.role === "manager" &&
      membership.permissions?.includes("orders.confirm"));
  async function act(path, body, message) {
    setBusy(path);
    setError("");
    setNotice("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setNotice(message);
      await Promise.all([orders.reload(), groups.reload()]);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy("");
    }
  }
  const directOrders = orders.data?.items || [];
  const groupItems = groups.data?.items || [];
  return (
    <section className="purchase-panel">
      <p className="eyebrow">Seller workspace</p>
      <h2>Orders and group purchases</h2>
      <p>Confirm direct orders and groups. Buyers then have 48 hours to pay.</p>
      {notice && (
        <div className="notice notice--success" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      )}
      {!mayDecide && (
        <div className="notice">
          You can view orders, but only the Owner or a Manager with order
          confirmation access can decide them.
        </div>
      )}
      <div className="purchase-section">
        <h3>Individual orders and group contributions</h3>
        {orders.loading && <p>Loading orders…</p>}
        {orders.error && (
          <div className="notice notice--error">{orders.error}</div>
        )}
        {!orders.loading && !directOrders.length && (
          <p>No direct orders yet.</p>
        )}
        {directOrders.map((order) => (
          <article className="purchase-card" key={order.id}>
            <div className="purchase-card-heading">
              <div>
                <strong>{order.listing_title}</strong>
                <span>{label(order.status)}</span>
              </div>
              <small>Placed {when(order.created_at)}</small>
            </div>
            <p>
              {order.quantity} {order.unit} · {cash(order.total_minor)}
            </p>
            {mayDecide && (
              <OrderLifecycle
                order={order}
                organizationId={orgId}
                onChanged={orders.reload}
              />
            )}
            {order.status === "pending_seller_confirmation" && (
              <p>Respond by {when(order.seller_response_due_at)}.</p>
            )}
            {order.status === "pending_payment" && (
              <p>Buyer payment due {when(order.payment_due_at)}.</p>
            )}
            {order.fulfilment_priority === "expedited" && (
              <p>
                Urgent fulfillment · {order.fulfilment_lead_time_days} days
                {order.fulfilment_due_at
                  ? ` · due ${when(order.fulfilment_due_at)}`
                  : " · clock starts after verified payment"}
              </p>
            )}
            {mayDecide && order.status === "pending_seller_confirmation" && (
              <div className="purchase-actions-row">
                <button
                  className="button"
                  disabled={busy.endsWith(order.id)}
                  onClick={() =>
                    act(
                      "/organizations/" +
                        orgId +
                        "/orders/" +
                        order.id +
                        "/decision",
                      { decision: "confirm" },
                      "Order confirmed. Buyer has 48 hours to pay.",
                    )
                  }
                >
                  Confirm order
                </button>
                <button
                  className="button button--quiet"
                  disabled={busy.endsWith(order.id)}
                  onClick={() =>
                    act(
                      "/organizations/" +
                        orgId +
                        "/orders/" +
                        order.id +
                        "/decision",
                      { decision: "reject" },
                      "Order rejected and its stock reservation released.",
                    )
                  }
                >
                  Reject order
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="purchase-section">
        <h3>Group orders</h3>
        {groups.loading && <p>Loading groups…</p>}
        {groups.error && (
          <div className="notice notice--error">{groups.error}</div>
        )}
        {!groups.loading && !groupItems.length && <p>No group orders yet.</p>}
        {groupItems.map((group) => {
          const joined = Number(group.joined_quantity || 0);
          const target = Number(group.target_quantity || 0);
          const reached = joined >= target;
          const canDecide = [
            "ready_for_confirmation",
            "reconfirmation_required",
          ].includes(group.status);
          return (
            <article className="purchase-card" key={group.id}>
              <div className="purchase-card-heading">
                <div>
                  <strong>{group.listing_title}</strong>
                  <span>{label(group.status)}</span>
                </div>
                <small>Closes {when(group.closes_at)}</small>
              </div>
              <p>
                {joined} / {target} {group.unit} joined
              </p>
              <progress max={target || 1} value={Math.min(joined, target)} />
              {group.status === "ready_for_confirmation" && (
                <p>
                  Target met. Review and confirm or reject by{" "}
                  {when(group.seller_response_due_at)}.
                </p>
              )}
              {group.status === "reconfirmation_required" && (
                <p>
                  Respond by {when(group.seller_response_due_at)}. A participant
                  missed payment. Review the remaining shares; already-paid
                  shares remain paid.
                </p>
              )}
              {group.status === "deadline_choices" && (
                <p>
                  Waiting for participants to extend, switch eligible shares to
                  urgent direct orders, or leave. Seller confirmation is not
                  available yet.
                </p>
              )}
              {mayDecide && canDecide && (
                <div className="purchase-actions-row">
                  <button
                    className="button"
                    disabled={
                      busy.endsWith(group.id) ||
                      (!reached && group.status !== "reconfirmation_required")
                    }
                    onClick={() =>
                      act(
                        "/organizations/" +
                          orgId +
                          "/purchase-groups/" +
                          group.id +
                          "/decision",
                        { decision: "confirm" },
                        "Group revision confirmed. Remaining unpaid Buyers have 48 hours to pay.",
                      )
                    }
                  >
                    {reached ? "Confirm group" : "Confirm revised group"}
                  </button>
                  <button
                    className="button button--quiet"
                    disabled={busy.endsWith(group.id)}
                    onClick={() =>
                      act(
                        "/organizations/" +
                          orgId +
                          "/purchase-groups/" +
                          group.id +
                          "/decision",
                        { decision: "reject" },
                        "Group rejected. Unpaid reservations were released; paid shares remain unchanged.",
                      )
                    }
                  >
                    Reject group
                  </button>
                </div>
              )}
              {group.status === "payment_open" && (
                <p>Buyer payments are due within 48 hours of confirmation.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

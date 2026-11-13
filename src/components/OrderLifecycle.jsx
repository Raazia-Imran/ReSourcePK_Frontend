import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function OrderLifecycle({ order, organizationId, onChanged }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const state = order.fulfilment_status;
  const base = organizationId
    ? `/organizations/${organizationId}/orders/${order.id}`
    : `/orders/${order.id}`;
  const shortReason = reason.trim().length > 0 && reason.trim().length < 3;
  const next = organizationId
    ? { paid: "processing", processing: "ready", ready: "dispatched" }[state]
    : null;
  const canCancel = ["pending_payment", "paid", "processing", "ready"].includes(
    state,
  );
  const canDispute = [
    "paid",
    "processing",
    "ready",
    "dispatched",
    "delivered",
    "completed",
  ].includes(state);
  async function act(action, toStatus) {
    if (
      action === "confirm-receipt" &&
      !window.confirm(
        "Confirm you received this material? This completes the order and creates its immutable passport.",
      )
    )
      return;
    if (
      action === "cancel" &&
      !window.confirm(
        "Cancel this order? Cancellation does not send a payment-provider refund.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`${base}/${action}`, {
        method: "POST",
        body: JSON.stringify({
          ...(toStatus ? { toStatus } : {}),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      setReason("");
      setNotice("Order updated.");
      await onChanged();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="order-lifecycle">
      <p>
        <strong>Fulfilment:</strong>{" "}
        {(state || "Awaiting confirmed payment").replaceAll("_", " ")}
      </p>
      {(canCancel || canDispute || next) && (
        <label className="field">
          <span>
            Reason or update note{" "}
            {canDispute ? "(required for a dispute)" : "(optional)"}
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={2}
          />
        </label>
      )}
      <div className="purchase-actions-row">
        {next && (
          <button
            className="button"
            disabled={busy || shortReason}
            onClick={() => act("fulfilment", next)}
          >
            Mark {next}
          </button>
        )}
        {!organizationId && state === "dispatched" && (
          <button
            className="button"
            disabled={busy || shortReason}
            onClick={() => act("confirm-receipt")}
          >
            Confirm material received
          </button>
        )}
        {canCancel && (
          <button
            className="button button--quiet"
            disabled={
              busy || (reason.trim().length > 0 && reason.trim().length < 3)
            }
            onClick={() => act("cancel")}
          >
            Cancel order
          </button>
        )}
        {canDispute && (
          <button
            className="button button--quiet"
            disabled={busy || reason.trim().length < 3}
            onClick={() => act("dispute")}
          >
            Raise dispute
          </button>
        )}
        {order.passport_id && (
          <Link
            className="button button--quiet"
            to={`/verify/${order.passport_id}`}
          >
            Verify passport
          </Link>
        )}
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

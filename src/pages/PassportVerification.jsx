import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Clock3 } from "lucide-react";
import Header from "../components/Header";
import { api } from "../services/api";

const validId = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value || "",
  );
export default function PassportVerification() {
  const { passportId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(passportId || "");
  const [record, setRecord] = useState(null);
  const [failure, setFailure] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!validId(passportId)) return undefined;
    let active = true;
    api(`/public/passports/${passportId}/verification`)
      .then((data) => active && setRecord({ id: passportId, revision, data }))
      .catch(
        (error) =>
          active &&
          setFailure({
            id: passportId,
            revision,
            message:
              error.status === 404
                ? "No passport exists with this ID."
                : error.message,
          }),
      );
    return () => {
      active = false;
    };
  }, [passportId, revision]);
  const data =
    record?.id === passportId && record.revision === revision
      ? record.data
      : null;
  const error =
    failure?.id === passportId && failure.revision === revision
      ? failure.message
      : "";
  const invalid = passportId && !validId(passportId);
  return (
    <>
      <Header />
      <main className="passport-page">
        <p className="eyebrow">Material transparency</p>
        <h1>Verify a material passport</h1>
        <p>
          Check whether a completed order’s saved passport matches its
          blockchain record. Anyone with the passport ID can check without
          signing in.
        </p>
        <form
          className="purchase-form"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/verify/${input.trim()}`);
          }}
        >
          <label className="field">
            <span>Passport ID</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              required
              maxLength={36}
              placeholder="Paste the passport ID"
            />
          </label>
          <button
            type="submit"
            className="button"
            disabled={!validId(input.trim())}
          >
            Check passport
          </button>
        </form>
        {invalid && (
          <p className="notice notice--error" role="alert">
            Enter a valid passport ID.
          </p>
        )}
        {passportId && !invalid && !data && !error && (
          <output>Checking the passport…</output>
        )}
        {error && (
          <div className="notice notice--error" role="alert">
            <p>{error}</p>
            <button
              className="button button--quiet"
              onClick={() => setRevision((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}
        {data && (
          <VerificationResult
            data={data}
            onRefresh={() => setRevision((value) => value + 1)}
          />
        )}
        <aside className="notice">
          <strong>What this check means</strong>
          <p>
            A matching hash proves record consistency. It does not independently
            certify material quality, origin, delivery or environmental savings.
            Polygon Amoy is a test network.
          </p>
        </aside>
        <Link className="text-action" to="/marketplace">
          Browse materials
        </Link>
      </main>
    </>
  );
}

function verificationMessage(data) {
  if (data.status === "anchored" && data.matches === true)
    return {
      Icon: ShieldCheck,
      title: "Passport matches the blockchain record",
      detail:
        "The recomputed passport hash matches the stored hash and the on-chain hash.",
    };
  if (data.matches === false)
    return {
      Icon: ShieldAlert,
      title: "Passport integrity mismatch",
      detail:
        "The records do not match. Ask the platform to investigate before relying on this passport.",
    };
  return {
    Icon: Clock3,
    title:
      data.status === "failed" ? "Anchoring failed" : "Anchoring is pending",
    detail:
      "This passport has no confirmed matching blockchain anchor yet. Check again later.",
  };
}
function VerificationResult({ data, onRefresh }) {
  const message = verificationMessage(data);
  const Icon = message.Icon;
  return (
    <section className="data-panel passport-result" aria-live="polite">
      <Icon size={36} aria-hidden="true" />
      <p className="eyebrow">Polygon Amoy testnet</p>
      <h2>{message.title}</h2>
      <p>{message.detail}</p>
      <dl>
        <dt>Passport ID</dt>
        <dd>{data.passportId}</dd>
        <dt>Version</dt>
        <dd>{data.version}</dd>
        <dt>Snapshot hash (SHA-256)</dt>
        <dd>{data.snapshotHash}</dd>
        <dt>Transaction</dt>
        <dd>
          {/^0x[0-9a-f]{64}$/i.test(data.transactionId || "") ? (
            <a
              href={`https://amoy.polygonscan.com/tx/${data.transactionId}`}
              target="_blank"
              rel="noreferrer"
            >
              View testnet transaction
            </a>
          ) : (
            "No transaction recorded"
          )}
        </dd>
        <dt>Anchored</dt>
        <dd>
          {data.anchoredAt
            ? new Date(data.anchoredAt).toLocaleString()
            : "Not confirmed"}
        </dd>
      </dl>
      <button className="button button--quiet" onClick={onRefresh}>
        Check again
      </button>
    </section>
  );
}

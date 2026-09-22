import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import FormField from "../components/FormField";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { context, refresh } = useAuth();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [state, setState] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    let active = true;
    api(`/invitations/details?token=${encodeURIComponent(token)}`)
      .then((invitation) => {
        if (active) setDetails(invitation);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function submit(e) {
    e.preventDefault();
    try {
      if (context)
        await api("/invitations/accept", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
      else
        await api("/invitations/accept-new", {
          method: "POST",
          body: JSON.stringify({
            token,
            fullName: state.fullName,
            password: state.password,
          }),
        });
      if (context) await refresh();
      navigate(context ? "/workspace" : "/login");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <AuthShell
      eyebrow="Organization invitation"
      title={
        details
          ? `Join ${details.organization_name}.`
          : "Review your invitation."
      }
      intro={
        details
          ? `You were invited as ${details.role.replace("_", " ")}.`
          : "Secure invitation details are loading."
      }
    >
      <form className="auth-form" onSubmit={submit}>
        {!context && Boolean(details) && (
          <>
            <FormField
              label="Full name"
              value={state.fullName || ""}
              onChange={(e) => setState({ ...state, fullName: e.target.value })}
              required
            />
            <FormField
              label="Create password"
              type="password"
              value={state.password || ""}
              onChange={(e) => setState({ ...state, password: e.target.value })}
              minLength="10"
              required
            />
          </>
        )}
        {Boolean(error) && <div className="notice notice--error">{error}</div>}
        {Boolean(details) && (
          <button type="submit" className="button button--wide">
            Accept invitation
          </button>
        )}
      </form>
    </AuthShell>
  );
}

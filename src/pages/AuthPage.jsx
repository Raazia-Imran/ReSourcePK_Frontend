import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import FormField from "../components/FormField";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accountType, setAccountType] = useState("buyer");
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const isSignup = mode === "signup",
    isForgot = mode === "forgot";
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ email: state.email, password: state.password });
        navigate("/workspace");
      } else if (isForgot) {
        await api("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: state.email }),
        });
        setDone("If the account exists, a secure reset link is on its way.");
      } else {
        const data = await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ ...state, accountType }),
        });
        setDone(
          data.emailDelivery === "sent"
            ? "Check your inbox to verify your email."
            : "Your account was created. Email delivery is pending; use resend verification after SMTP is configured.",
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const update = (e) => setState({ ...state, [e.target.name]: e.target.value });
  return (
    <AuthShell
      eyebrow={
        isSignup
          ? "Create an account"
          : isForgot
            ? "Account recovery"
            : "Welcome back"
      }
      title={
        isSignup
          ? "Choose your place in the loop."
          : isForgot
            ? "Reset access securely."
            : "Continue your work."
      }
      intro={
        isSignup
          ? "Buy surplus material or open a verified seller organization."
          : isForgot
            ? "We will email a one-hour reset link if the account exists."
            : "Sign in to your role-aware workspace."
      }
    >
      {done ? (
        <div className="notice notice--success">{done}</div>
      ) : (
        <form onSubmit={submit} className="auth-form">
          {isSignup && (
            <div className="segmented" role="group" aria-label="Account type">
              <button
                type="button"
                className={accountType === "buyer" ? "active" : ""}
                onClick={() => setAccountType("buyer")}
              >
                Buyer
              </button>
              <button
                type="button"
                className={accountType === "seller" ? "active" : ""}
                onClick={() => setAccountType("seller")}
              >
                Seller
              </button>
            </div>
          )}
          {isSignup && (
            <FormField
              label="Full name"
              name="fullName"
              value={state.fullName || ""}
              onChange={update}
              autoComplete="name"
              required
            />
          )}
          {isSignup && accountType === "seller" && (
            <FormField
              label="Organization name"
              name="organizationName"
              value={state.organizationName || ""}
              onChange={update}
              required
            />
          )}
          <FormField
            label="Email address"
            name="email"
            type="email"
            value={state.email || ""}
            onChange={update}
            autoComplete="email"
            required
          />
          {!isForgot && (
            <FormField
              label="Password"
              name="password"
              type="password"
              value={state.password || ""}
              onChange={update}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength="10"
              required
            />
          )}
          {isSignup && (
            <p className="form-hint">
              Use 10+ characters with uppercase, lowercase and a number.
            </p>
          )}
          {error && (
            <div className="notice notice--error" role="alert">
              {error}
            </div>
          )}
          <button className="button button--wide" disabled={busy}>
            {busy
              ? "Working…"
              : isSignup
                ? "Create account"
                : isForgot
                  ? "Send reset link"
                  : "Sign in"}
          </button>
        </form>
      )}
      <div className="auth-links">
        {mode === "login" && (
          <>
            <Link to="/forgot-password">Forgot password?</Link>
            <span>
              New here? <Link to="/signup">Create account</Link>
            </span>
          </>
        )}
        {isSignup && (
          <span>
            Already registered? <Link to="/login">Sign in</Link>
          </span>
        )}
        {isForgot && <Link to="/login">Return to sign in</Link>}
      </div>
    </AuthShell>
  );
}

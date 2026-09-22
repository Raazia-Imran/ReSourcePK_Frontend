import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { api } from "../services/api";
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Verifying your secure link…");
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("This verification link is incomplete.");
      return;
    }
    api("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setOk(true);
        setStatus("Your email is verified. Your workspace is ready.");
      })
      .catch((e) => setStatus(e.message));
  }, [params]);
  return (
    <AuthShell
      eyebrow="Email verification"
      title={status}
      intro="Verification links are single-use and expire after 24 hours."
    >
      {ok && (
        <Link className="button" to="/login">
          Continue to sign in
        </Link>
      )}
    </AuthShell>
  );
}

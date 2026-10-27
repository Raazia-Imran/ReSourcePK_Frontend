import {
  Mail,
  ShieldCheck,
  UserRound,
  KeyRound,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AccountProfile() {
  const { context } = useAuth();
  const { user, memberships, platformRoles } = context;
  return (
    <section className="data-page account-profile">
      <div className="profile-cover">
        <span className="profile-avatar" aria-hidden="true">
          {user.full_name
            ?.split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <p className="eyebrow">Your ReThread account</p>
          <h2>{user.full_name}</h2>
          <p>One account. Every workspace.</p>
        </div>
      </div>
      <div className="profile-grid">
        <section className="data-panel">
          <h3>
            <UserRound size={20} /> Personal details
          </h3>
          <div className="settings-readonly">
            <span>Full name</span>
            <strong>{user.full_name}</strong>
          </div>
          <div className="settings-readonly">
            <span>
              <Mail size={16} /> Email address
            </span>
            <strong>{user.email}</strong>
          </div>
          <p className="form-hint">
            Personal name, email and photo editing are not currently available
            for this account.
          </p>
        </section>
        <section className="data-panel">
          <h3>
            <ShieldCheck size={20} /> Account security
          </h3>
          <p>Use the secure email reset process to update your password.</p>
          <Link className="button button--quiet" to="/forgot-password">
            <KeyRound size={18} /> Reset password
          </Link>
          {platformRoles.length > 0 && (
            <p className="form-hint">
              Platform access:{" "}
              {platformRoles
                .map((role) => role.replaceAll("_", " "))
                .join(", ")}
            </p>
          )}
        </section>
      </div>
      {memberships.length > 0 && (
        <section className="data-panel">
          <h3>
            <Building2 size={20} /> Your organizations
          </h3>
          <div className="profile-organizations">
            {memberships.map((member) => (
              <div
                className="profile-organization"
                key={member.organization_id}
              >
                <div>
                  <strong>{member.organization_name}</strong>
                  <p>{member.role}</p>
                </div>
                <Link
                  className="button button--quiet"
                  to={`/org/${member.slug}/${member.role === "owner" ? "settings" : "overview"}`}
                >
                  {member.role === "owner"
                    ? "Edit organization"
                    : "Open workspace"}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

import {
  Mail,
  ShieldCheck,
  UserRound,
  KeyRound,
  Building2,
} from "lucide-react";
import { useState } from "react";
import useProfileAppearance from "../hooks/useProfileAppearance";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AccountProfile() {
  const { context } = useAuth();
  const { user, memberships, platformRoles } = context;
  const { appearance, save } = useProfileAppearance(user.id);
  const [name, setName] = useState(appearance.name || "");
  const [photo, setPhoto] = useState(appearance.photo || "");
  const [message, setMessage] = useState("");
  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 500000
    ) {
      setMessage("Choose a PNG, JPEG or WebP image smaller than 500 KB.");
      return;
    }
    try {
      const result = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPhoto(result);
      setMessage("Photo selected. Save to apply it on this browser.");
    } catch {
      setMessage("Could not read that image. Please try another file.");
    }
  }
  function submit(event) {
    event.preventDefault();
    try {
      save({ name: name.trim(), photo });
      setMessage("Appearance saved on this browser.");
    } catch {
      setMessage(
        "Your browser could not save this. Free some storage or allow site storage and try again.",
      );
    }
  }
  return (
    <section className="data-page account-profile">
      <div className="profile-cover">
        <span className="profile-avatar" aria-hidden="true">
          {appearance.photo ? (
            <img src={appearance.photo} alt="" />
          ) : (
            user.full_name
              ?.split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
          )}
        </span>
        <div>
          <p className="eyebrow">Your ReThread account</p>
          <h2>{appearance.name || user.full_name}</h2>
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
          <form
            className="settings-form profile-appearance-form"
            onSubmit={submit}
          >
            <h3>Personalize your view</h3>
            <p>
              Saved only on this browser for your account. These preferences
              appear in all your portals here; they do not change your
              registered account or sync to other devices.
            </p>
            <label className="field">
              <span>Display name</span>
              <input
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder={user.full_name}
                autoComplete="nickname"
              />
            </label>
            <label className="field">
              <span>Profile picture</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={choosePhoto}
              />
              <small>PNG, JPEG or WebP, up to 500 KB.</small>
            </label>
            {photo && (
              <div className="profile-photo-preview">
                <img src={photo} alt="Selected profile" />
                <button
                  className="button button--quiet"
                  type="button"
                  onClick={() => setPhoto("")}
                >
                  Remove picture
                </button>
              </div>
            )}
            <button className="button" type="submit">
              Save on this browser
            </button>
            <button
              className="button button--quiet"
              type="button"
              onClick={() => {
                try {
                  save({});
                  setName("");
                  setPhoto("");
                  setMessage("Browser appearance reset.");
                } catch {
                  setMessage("Could not reset browser appearance.");
                }
              }}
            >
              Reset appearance
            </button>
            {message && <p role="status">{message}</p>}
          </form>
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

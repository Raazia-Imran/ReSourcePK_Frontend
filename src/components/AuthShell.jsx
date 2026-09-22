import Brand from "./Brand";
import { Link } from "react-router-dom";
export default function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  asideTitle = "Materials deserve another chapter.",
}) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Brand />
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-intro">{intro}</p>
          {children}
        </div>
        <Link className="back-home" to="/">
          ← Back to the marketplace story
        </Link>
      </section>
      <aside className="auth-aside">
        <div className="auth-weave">
          <i />
          <i />
          <i />
        </div>
        <p>RE / CIRCULATE</p>
        <h2>{asideTitle}</h2>
        <span>Secure access · Role-aware workspaces · Traceable activity</span>
      </aside>
    </main>
  );
}

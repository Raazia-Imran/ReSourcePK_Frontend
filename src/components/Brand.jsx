import { Link } from "react-router-dom";
export default function Brand({ light = false }) {
  return (
    <Link
      className={`brand ${light ? "brand--light" : ""}`}
      to="/"
      aria-label="ReThread home"
    >
      <img className="brand__logo" src="/rethread-logo.png" alt="" />
      <span>
        Re<em>Thread</em>
      </span>
    </Link>
  );
}

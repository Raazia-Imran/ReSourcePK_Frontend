export default function MaterialLoom() {
  return (
    <div
      className="loom"
      aria-label="Abstract three-dimensional woven textile loop"
    >
      <div className="loom__halo" />
      <div className="loom__ring loom__ring--one" />
      <div className="loom__ring loom__ring--two" />
      <div className="loom__ring loom__ring--three" />
      <div className="loom__core">
        <span>Deadstock</span>
        <strong>→ value</strong>
      </div>
      <div className="loom__tag">
        Circular supply
        <br />
        in motion
      </div>
    </div>
  );
}

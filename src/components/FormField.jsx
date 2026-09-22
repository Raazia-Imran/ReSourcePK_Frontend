export default function FormField({ label, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {error && <small>{error}</small>}
    </label>
  );
}

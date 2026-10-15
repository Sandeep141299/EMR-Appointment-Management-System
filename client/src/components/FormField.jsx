export default function FormField({ label, error, hint, children, ...inputProps }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...inputProps} aria-invalid={Boolean(error)} />}
      {hint && <small className="field-help">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

/** Inline form error message (red text). Use for validation/API errors inside forms. */
export default function FormError({ message, className = "" }) {
  if (!message) return null;
  return (
    <p role="alert" className={`text-sm text-red-400 ${className}`.trim()}>
      {message}
    </p>
  );
}

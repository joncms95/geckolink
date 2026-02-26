export default function LoadingSkeleton({
  className = "",
  children = "Loading…",
}) {
  return (
    <div
      className={`flex items-center justify-center text-gecko-slate text-sm animate-pulse ${className}`}
    >
      {children}
    </div>
  );
}

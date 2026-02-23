const base =
  "px-4 py-3 rounded-xl border border-gecko-dark-border bg-gecko-dark-card text-white placeholder-gecko-slate focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none disabled:opacity-60 min-h-[48px] touch-manipulation text-base"

export default function Input({ className = "", ...props }) {
  return <input className={`${base} ${className}`} {...props} />
}

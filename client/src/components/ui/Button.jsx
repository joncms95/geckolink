const base =
  "rounded-lg font-medium min-h-[44px] touch-manipulation disabled:opacity-60 transition-colors focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark px-4 py-3 sm:py-2.5"

const variants = {
  primary:
    "bg-gecko-green text-gecko-dark hover:bg-gecko-green-light",
  secondary:
    "border border-gecko-dark-border text-gecko-slate hover:bg-gecko-dark-border hover:text-white",
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

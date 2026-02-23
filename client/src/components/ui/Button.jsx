const base =
  "rounded-lg font-medium min-h-[44px] touch-manipulation disabled:opacity-60 transition-colors focus:ring-2 focus:ring-gecko-green focus:ring-offset-2 focus:ring-offset-gecko-dark"

const variants = {
  primary:
    "bg-gecko-green text-gecko-dark hover:bg-gecko-green-light",
  secondary:
    "border border-gecko-dark-border text-gecko-slate hover:bg-gecko-dark-border hover:text-white",
}

const sizes = {
  md: "px-4 py-3 sm:py-2.5",
  lg: "px-6 sm:px-8 py-3.5 sm:py-4",
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}

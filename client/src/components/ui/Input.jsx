import { forwardRef } from "react";

const base =
  "px-4 py-3 border border-gecko-dark-border text-white placeholder-gecko-slate focus:border-gecko-green focus:ring-2 focus:ring-gecko-green/30 outline-none disabled:opacity-60 min-h-[48px] touch-manipulation text-base";

const variants = {
  default: "rounded-xl bg-gecko-dark-card",
  modal: "rounded-lg bg-gecko-dark",
};

const Input = forwardRef(function Input(
  { className = "", variant = "default", ...props },
  ref,
) {
  const variantClass = variants[variant] ?? variants.default;
  return (
    <input
      ref={ref}
      className={`${base} ${variantClass} ${className}`.trim()}
      {...props}
    />
  );
});

export default Input;

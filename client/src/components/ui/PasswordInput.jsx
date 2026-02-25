import { useState } from "react"
import Input from "./Input"

export default function PasswordInput({ className = "", ...rest }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Input
        {...rest}
        type={show ? "text" : "password"}
        className={`w-full pr-12 ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gecko-slate hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gecko-green focus-visible:ring-offset-2 focus-visible:ring-offset-gecko-dark rounded"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <i className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"}`} aria-hidden />
      </button>
    </div>
  )
}

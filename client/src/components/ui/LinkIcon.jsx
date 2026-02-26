import { useState } from "react";

export default function LinkIcon({ src, className = "" }) {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt=""
        className={`w-10 h-10 rounded-lg shrink-0 object-contain bg-gecko-dark-border ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-lg shrink-0 bg-gecko-dark-border flex items-center justify-center ${className}`}
      aria-hidden
    >
      <i className="fa-solid fa-link text-xl text-gecko-slate" aria-hidden />
    </div>
  );
}

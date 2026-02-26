import { useEffect, useRef } from "react";
import { TOAST_DISMISS_MS } from "../constants";

export default function Toast({
  message,
  onDismiss,
  visible,
  autoDismissMs = TOAST_DISMISS_MS,
}) {
  const toastRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onDismissRef.current?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [visible, autoDismissMs]);

  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e) => {
      if (toastRef.current && !toastRef.current.contains(e.target)) {
        onDismissRef.current?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={toastRef}
      role="status"
      className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 flex items-center gap-3 rounded-xl border border-gecko-dark-border bg-gecko-dark-card px-4 py-3 shadow-lg animate-slide-up"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gecko-green/20 text-gecko-green shrink-0">
        <i className="fa-solid fa-check text-xl" aria-hidden />
      </span>
      <p className="text-sm font-medium text-white">{message}</p>
    </div>
  );
}

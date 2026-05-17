import { useEffect, useRef } from "react";

export default function useKeepAlive(options = {}) {
  const intervalRef = useRef(null);
  useEffect(() => {
    const envUrl = typeof import.meta !== "undefined" ? import.meta.env.VITE_KEEP_ALIVE_URL : undefined;
    const envInterval = typeof import.meta !== "undefined" ? import.meta.env.VITE_KEEP_ALIVE_INTERVAL_MS : undefined;
    const keepAliveUrl = options.url || envUrl;
    const intervalMs = Number(options.intervalMs ?? envInterval ?? 10 * 60 * 1000);

    // Only run in production builds and when a URL is configured
    if (typeof import.meta !== "undefined" && !import.meta.env.PROD) return;
    if (!keepAliveUrl) return;

    const ping = async () => {
      try {
        // best-effort ping; some backends may not respond to no-cors
        await fetch(keepAliveUrl, { cache: "no-store", mode: "no-cors" });
      } catch (e) {
        // swallow errors - this is a keep-alive mechanism only
      }
    };

    // initial ping
    ping();
    intervalRef.current = setInterval(ping, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [options.url, options.intervalMs]);
}

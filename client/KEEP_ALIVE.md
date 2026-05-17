Keep-alive configuration for Vercel frontend

Add these environment variables in your Vercel project settings to enable the frontend to poll your Render backend and keep it awake:

- `VITE_KEEP_ALIVE_URL`: The full URL to ping, e.g. `https://your-backend.onrender.com/health`.
- `VITE_KEEP_ALIVE_INTERVAL_MS` (optional): Polling interval in milliseconds. Defaults to `600000` (10 minutes).

Notes:
- The hook runs only in production builds (`import.meta.env.PROD`) and does a best-effort `fetch` with `mode: "no-cors"` so it won't fail visibly if CORS isn't fully open.
- Ensure your backend has a lightweight health endpoint that responds to GET requests.

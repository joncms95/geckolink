/** Parses API time key (ISO8601) to timestamp for chart. */
function parseTimeKey(k) {
  if (k == null || k === "") return NaN;
  return new Date(String(k).trim()).getTime();
}

export default function ClicksOverTimeChart({ byHour }) {
  const raw =
    byHour != null && typeof byHour === "object" && !Array.isArray(byHour)
      ? byHour
      : {};
  const entries = Object.entries(raw)
    .map(([k, v]) => {
      const t = parseTimeKey(k);
      return Number.isNaN(t) ? null : [t, Number(v) || 0];
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0])
    .slice(-24);

  const width = 400;
  const height = 160;
  const padding = { top: 12, right: 12, bottom: 44, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-[180px] text-gecko-slate text-sm"
        role="img"
        aria-label="No click data yet"
      >
        <i
          className="fa-solid fa-chart-line text-4xl mb-2 opacity-50"
          aria-hidden
        />
        <p>No click data yet</p>
      </div>
    );
  }

  const minT = entries[0][0];
  const maxT = entries[entries.length - 1][0];
  const rangeT = Math.max(maxT - minT, 1);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const yTickValues = [
    ...new Set([0, 1, 2, 3, 4].map((i) => Math.round((max * i) / 4))),
  ].sort((a, b) => a - b);
  const plotEntries =
    entries.length === 1
      ? [entries[0], [entries[0][0] + rangeT, entries[0][1]]]
      : entries;

  const points = plotEntries
    .map(([t, v]) => {
      const x = padding.left + (innerWidth * (t - minT)) / rangeT;
      const y = padding.top + innerHeight - (innerHeight * v) / max;
      return `${x},${y}`;
    })
    .join(" ");

  const maxXLabels = 6;
  const rawAxisLabels =
    entries.length <= maxXLabels
      ? entries
      : [
          entries[0],
          ...Array.from({ length: maxXLabels - 2 }, (_, i) => {
            const idx = Math.round(
              ((i + 1) / (maxXLabels - 1)) * (entries.length - 1),
            );
            return entries[idx];
          }),
          entries[entries.length - 1],
        ];
  const seenDates = new Set();
  const axisLabels = rawAxisLabels.filter((e) => {
    const dateKey = new Date(e[0]).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    if (seenDates.has(dateKey)) return false;
    seenDates.add(dateKey);
    return true;
  });

  const xLabelY = height - 12;

  return (
    <div
      className="w-full overflow-x-auto"
      role="img"
      aria-label="Clicks over time chart"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-h-[180px]"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {axisLabels.map(([t], i) => {
          const x = padding.left + (innerWidth * (t - minT)) / rangeT;
          const label = new Date(t).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <text
              key={`${t}-${i}`}
              x={x}
              y={xLabelY}
              className="fill-gecko-slate text-[10px]"
              textAnchor="middle"
              transform={`rotate(-45 ${x} ${xLabelY})`}
            >
              {label}
            </text>
          );
        })}
        {yTickValues.map((val) => {
          const y = padding.top + innerHeight - (innerHeight * val) / max;
          return (
            <text
              key={val}
              x={padding.left - 6}
              y={y + 4}
              className="fill-gecko-slate text-[10px]"
              textAnchor="end"
            >
              {val}
            </text>
          );
        })}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-gecko-green"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

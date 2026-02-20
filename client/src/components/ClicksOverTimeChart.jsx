export default function ClicksOverTimeChart({ byHour }) {
  const entries = Object.entries(byHour || {})
    .map(([k, v]) => [new Date(k).getTime(), v])
    .sort((a, b) => a[0] - b[0])
    .slice(-24)

  const max = Math.max(1, ...entries.map(([, v]) => v))
  const width = 400
  const height = 160
  const padding = { top: 12, right: 12, bottom: 24, left: 36 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-gecko-slate text-sm">
        <i className="fa-solid fa-chart-line text-4xl mb-2 opacity-50" aria-hidden />
        <p>No click data yet</p>
      </div>
    )
  }

  const minT = entries[0][0]
  const maxT = entries[entries.length - 1][0] || minT + 1
  const rangeT = maxT - minT || 1

  const points = entries
    .map(([t, v], i) => {
      const x = padding.left + (innerWidth * (t - minT)) / rangeT
      const y = padding.top + innerHeight - (innerHeight * v) / max
      return `${x},${y}`
    })
    .join(" ")

  const axisLabels = entries.length <= 7
    ? entries
    : entries.filter((_, i) => i % Math.ceil(entries.length / 6) === 0)

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-h-[180px]" preserveAspectRatio="xMidYMid meet">
        {axisLabels.map(([t], i) => {
          const x = padding.left + (innerWidth * (t - minT)) / rangeT
          const label = new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          return (
            <text
              key={i}
              x={x}
              y={height - 6}
              className="fill-gecko-slate text-[10px]"
              textAnchor="middle"
            >
              {label}
            </text>
          )
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = padding.top + innerHeight - (innerHeight * i) / 4
          const val = Math.round((max * i) / 4)
          return (
            <text key={i} x={padding.left - 6} y={y + 4} className="fill-gecko-slate text-[10px]" textAnchor="end">
              {val}
            </text>
          )
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
  )
}

/** Renders a count as paper-ledger tally marks: 4 strokes + a diagonal strike for each bundle of 5. */
export default function TallyMarks({ count, color = 'currentColor', size = 'md' }) {
  const groups = Math.floor(count / 5)
  const remainder = count % 5
  const h = size === 'lg' ? 24 : 18
  const w = size === 'lg' ? 5.5 : 4.5
  const gap = size === 'lg' ? 3.5 : 2.5
  const bundleWidth = w * 4 + gap * 3

  if (count === 0) {
    return <span className="text-ink-faint text-sm">—</span>
  }

  return (
    <span className="inline-flex items-end gap-2" aria-hidden="true">
      {Array.from({ length: groups }).map((_, gi) => (
        <svg
          key={gi}
          width={bundleWidth}
          height={h}
          viewBox={`0 0 ${bundleWidth} ${h}`}
          style={{ color }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <rect key={i} x={i * (w + gap)} y={0} width={w * 0.55} height={h} rx={1} fill="currentColor" />
          ))}
          <rect
            x={-2}
            y={h / 2 - w * 0.55}
            width={bundleWidth + 4}
            height={w * 0.55}
            rx={1}
            fill="currentColor"
            transform={`rotate(-28 ${bundleWidth / 2} ${h / 2})`}
          />
        </svg>
      ))}
      {remainder > 0 && (
        <svg
          width={remainder * (w + gap)}
          height={h}
          viewBox={`0 0 ${remainder * (w + gap)} ${h}`}
          style={{ color }}
        >
          {Array.from({ length: remainder }).map((_, i) => (
            <rect key={i} x={i * (w + gap)} y={0} width={w * 0.55} height={h} rx={1} fill="currentColor" />
          ))}
        </svg>
      )}
    </span>
  )
}

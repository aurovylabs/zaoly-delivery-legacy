type ZaolyLogoMarkProps = {
  size?: number
  className?: string
  title?: string
}

/**
 * Zaoly product seal 造 — cobalt tile + cream glyph (CD).
 * MUST NOT use the suite MSQDX five-square geometry.
 */
export function ZaolyLogoMark({ size = 28, className, title = 'Zaoly' }: ZaolyLogoMarkProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: '#1F44FF',
        color: '#F3EEE4',
        fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", "Songti SC", serif',
        fontSize: Math.round(size * 0.68),
        fontWeight: 600,
        lineHeight: 1,
      }}
      role="img"
      aria-label={title}
    >
      <span aria-hidden="true">造</span>
    </span>
  )
}

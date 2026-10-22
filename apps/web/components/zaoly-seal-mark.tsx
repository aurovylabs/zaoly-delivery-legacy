/** Product seal 造 — Zaoly CD (cobalt tile + cream glyph). */
export function ZaolySealMark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="zaoly-seal-mark"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.68) }}
      aria-hidden="true"
    >
      造
    </span>
  )
}

/**
 * Shared vector draft model for SiteSvg Phase 4 deep-edit (and SiteShape reuse).
 * Spec: specs/domain/site-svg.md Phase 4 · knowledge/site-svg.md
 */

export type VectorPoint = { x: number; y: number }

export type VectorMoveCommand = { type: 'M'; x: number; y: number }
export type VectorLineCommand = { type: 'L'; x: number; y: number }
export type VectorCubicCommand = {
  type: 'C'
  x1: number
  y1: number
  x2: number
  y2: number
  x: number
  y: number
}
export type VectorCloseCommand = { type: 'Z' }

export type VectorCommand =
  | VectorMoveCommand
  | VectorLineCommand
  | VectorCubicCommand
  | VectorCloseCommand

export type VectorPath = {
  commands: VectorCommand[]
  fill?: string
  stroke?: string
  strokeWidth?: string
}

export type VectorDraft = {
  paths: VectorPath[]
  viewBox?: string
}

export const DEFAULT_VECTOR_VIEWBOX = '0 0 48 48'

const PATH_TOKEN_RE =
  /[MmLlCcZz]|[+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?/g

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 1000) / 1000
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

function readNumbers(tokens: string[], start: number, count: number): number[] | null {
  const out: number[] = []
  for (let i = 0; i < count; i += 1) {
    const raw = tokens[start + i]
    if (raw == null || /[MmLlCcZz]/.test(raw)) return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    out.push(n)
  }
  return out
}

/** Best-effort absolute M/L/C/Z parser (relative m/l/c/z converted). */
export function parsePathD(d: string): VectorCommand[] | null {
  const trimmed = d.trim()
  if (!trimmed) return null
  const tokens = trimmed.match(PATH_TOKEN_RE)
  if (!tokens || tokens.length === 0) return null

  const commands: VectorCommand[] = []
  let i = 0
  let cx = 0
  let cy = 0
  let started = false

    while (i < tokens.length) {
      const token = tokens[i]
      if (!token) break

      if (!/[MmLlCcZz]/.test(token)) {
        return null
      }

    const type = token
    i += 1

    if (type === 'Z' || type === 'z') {
      commands.push({ type: 'Z' })
      continue
    }

    if (type === 'M' || type === 'm') {
      const nums = readNumbers(tokens, i, 2)
      if (!nums) return null
      i += 2
      const abs = type === 'M'
      cx = abs ? nums[0]! : cx + nums[0]!
      cy = abs ? nums[1]! : cy + nums[1]!
      commands.push({ type: 'M', x: cx, y: cy })
      started = true
      // Extra pairs after M become L (SVG rules).
      while (true) {
        const more = readNumbers(tokens, i, 2)
        if (!more) break
        i += 2
        cx = abs ? more[0]! : cx + more[0]!
        cy = abs ? more[1]! : cy + more[1]!
        commands.push({ type: 'L', x: cx, y: cy })
      }
      continue
    }

    if (type === 'L' || type === 'l') {
      if (!started) return null
      const nums = readNumbers(tokens, i, 2)
      if (!nums) return null
      i += 2
      const abs = type === 'L'
      cx = abs ? nums[0]! : cx + nums[0]!
      cy = abs ? nums[1]! : cy + nums[1]!
      commands.push({ type: 'L', x: cx, y: cy })
      while (true) {
        const more = readNumbers(tokens, i, 2)
        if (!more) break
        i += 2
        cx = abs ? more[0]! : cx + more[0]!
        cy = abs ? more[1]! : cy + more[1]!
        commands.push({ type: 'L', x: cx, y: cy })
      }
      continue
    }

    if (type === 'C' || type === 'c') {
      if (!started) return null
      const nums = readNumbers(tokens, i, 6)
      if (!nums) return null
      i += 6
      const abs = type === 'C'
      const x1 = abs ? nums[0]! : cx + nums[0]!
      const y1 = abs ? nums[1]! : cy + nums[1]!
      const x2 = abs ? nums[2]! : cx + nums[2]!
      const y2 = abs ? nums[3]! : cy + nums[3]!
      const x = abs ? nums[4]! : cx + nums[4]!
      const y = abs ? nums[5]! : cy + nums[5]!
      commands.push({ type: 'C', x1, y1, x2, y2, x, y })
      cx = x
      cy = y
      while (true) {
        const more = readNumbers(tokens, i, 6)
        if (!more) break
        i += 6
        const nx1 = abs ? more[0]! : cx + more[0]!
        const ny1 = abs ? more[1]! : cy + more[1]!
        const nx2 = abs ? more[2]! : cx + more[2]!
        const ny2 = abs ? more[3]! : cy + more[3]!
        const nx = abs ? more[4]! : cx + more[4]!
        const ny = abs ? more[5]! : cy + more[5]!
        commands.push({ type: 'C', x1: nx1, y1: ny1, x2: nx2, y2: ny2, x: nx, y: ny })
        cx = nx
        cy = ny
      }
      continue
    }

    // Unsupported command (H/V/Q/…): fail whole path so Markup craft is not truncated.
    return null
  }

  return commands.length > 0 ? commands : null
}

function attrValue(attrs: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i')
  const m = attrs.match(re)
  return m?.[2]
}

/**
 * Best-effort extract of path-bearing elements from SVG markup.
 * Returns null when markup has no usable M/L/C/Z paths (caller keeps Markup mode).
 */
export function parsePathsFromSvgMarkup(markup: string): VectorDraft | null {
  const raw = markup.trim()
  if (!raw) return null

  const viewBoxMatch = raw.match(/\bviewBox\s*=\s*(["'])([\s\S]*?)\1/i)
  const viewBox = viewBoxMatch?.[2]?.trim() || undefined

  const paths: VectorPath[] = []
  const pathTagRe = /<path\b([^>]*)\/?>/gi
  let match: RegExpExecArray | null
  while ((match = pathTagRe.exec(raw)) !== null) {
    const attrs = match[1] ?? ''
    const d = attrValue(attrs, 'd')
    if (!d) continue
    const commands = parsePathD(d)
    if (!commands || commands.length === 0) continue
    const path: VectorPath = { commands }
    const fill = attrValue(attrs, 'fill')
    const stroke = attrValue(attrs, 'stroke')
    const strokeWidth = attrValue(attrs, 'stroke-width') ?? attrValue(attrs, 'strokeWidth')
    if (fill != null) path.fill = fill
    if (stroke != null) path.stroke = stroke
    if (strokeWidth != null) path.strokeWidth = strokeWidth
    paths.push(path)
  }

  if (paths.length === 0) return null
  return { paths, viewBox }
}

export function serializeCommandsToPathD(commands: VectorCommand[]): string {
  const parts: string[] = []
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      parts.push(`M${formatNum(cmd.x)} ${formatNum(cmd.y)}`)
    } else if (cmd.type === 'L') {
      parts.push(`L${formatNum(cmd.x)} ${formatNum(cmd.y)}`)
    } else if (cmd.type === 'C') {
      parts.push(
        `C${formatNum(cmd.x1)} ${formatNum(cmd.y1)} ${formatNum(cmd.x2)} ${formatNum(cmd.y2)} ${formatNum(cmd.x)} ${formatNum(cmd.y)}`,
      )
    } else {
      parts.push('Z')
    }
  }
  return parts.join(' ')
}

/** Flatten draft paths into a single path `d` (SiteShape reuse). */
export function serializeDraftToPathD(draft: VectorDraft): string {
  return draft.paths
    .map((p) => serializeCommandsToPathD(p.commands))
    .filter(Boolean)
    .join(' ')
}

export function serializeDraftToSvgMarkup(
  draft: VectorDraft,
  viewBox: string = draft.viewBox ?? DEFAULT_VECTOR_VIEWBOX,
): string {
  const vb = viewBox.trim() || DEFAULT_VECTOR_VIEWBOX
  const body =
    draft.paths.length === 0
      ? ''
      : draft.paths
          .map((path) => {
            const d = serializeCommandsToPathD(path.commands)
            if (!d) return ''
            const fill = path.fill ?? 'currentColor'
            const stroke = path.stroke
            const strokeWidth = path.strokeWidth
            const attrs = [
              `d="${d}"`,
              `fill="${fill}"`,
              stroke != null ? `stroke="${stroke}"` : null,
              strokeWidth != null ? `stroke-width="${strokeWidth}"` : null,
            ]
              .filter(Boolean)
              .join(' ')
            return `<path ${attrs}/>`
          })
          .filter(Boolean)
          .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-hidden="true">${body}</svg>`
}

export function emptyVectorDraft(viewBox: string = DEFAULT_VECTOR_VIEWBOX): VectorDraft {
  return { paths: [], viewBox }
}

export function draftHasCommands(draft: VectorDraft | null | undefined): boolean {
  return Boolean(draft?.paths.some((p) => p.commands.length > 0))
}

/** Append a line point: first point → M, later → L on the active (last open) path. */
export function appendLinePoint(draft: VectorDraft, point: VectorPoint): VectorDraft {
  const paths = draft.paths.map((p) => ({ ...p, commands: [...p.commands] }))
  let active = paths[paths.length - 1]
  const closed = active?.commands.some((c) => c.type === 'Z')

  if (!active || closed) {
    active = { commands: [{ type: 'M', x: point.x, y: point.y }], fill: 'currentColor' }
    paths.push(active)
  } else if (active.commands.length === 0) {
    active.commands.push({ type: 'M', x: point.x, y: point.y })
  } else {
    active.commands.push({ type: 'L', x: point.x, y: point.y })
  }

  return { ...draft, paths }
}

/** Close the active path with Z when it has at least a move + one segment. */
export function closeActivePath(draft: VectorDraft): VectorDraft {
  const paths = draft.paths.map((p) => ({ ...p, commands: [...p.commands] }))
  const active = paths[paths.length - 1]
  if (!active) return draft
  if (active.commands.some((c) => c.type === 'Z')) return draft
  const hasMove = active.commands.some((c) => c.type === 'M')
  const hasSegment = active.commands.some((c) => c.type === 'L' || c.type === 'C')
  if (!hasMove || !hasSegment) return draft
  active.commands.push({ type: 'Z' })
  return { ...draft, paths }
}

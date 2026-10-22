/**
 * Curated SiteSvg marks (Phase 2). Spec: specs/domain/site-svg.md
 * All paints use currentColor so Inspect color / tokens recolor the mark.
 */

export type SiteSvgMarkId =
  | 'triangle'
  | 'seal'
  | 'check'
  | 'arrow'
  | 'star'
  | 'plus'
  | 'diamond'
  | 'custom'

export type SiteSvgMark = {
  id: Exclude<SiteSvgMarkId, 'custom'>
  label: string
  alt: string
  viewBox: string
  markup: string
}

function svg(viewBox: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-hidden="true">${body}</svg>`
}

export const SITE_SVG_MARKS: readonly SiteSvgMark[] = [
  {
    id: 'triangle',
    label: 'Triangle',
    alt: 'Graphic',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.18"/><path d="M16 30 L24 14 L32 30 Z" fill="currentColor"/>',
    ),
  },
  {
    id: 'seal',
    label: 'Seal',
    alt: 'Seal',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="24" cy="24" r="8" fill="currentColor"/>',
    ),
  },
  {
    id: 'check',
    label: 'Check',
    alt: 'Check',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<path d="M12 24 L20 32 L36 14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    alt: 'Arrow',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<path d="M10 24 H32 M24 14 L34 24 L24 34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'star',
    label: 'Star',
    alt: 'Star',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<path d="M24 8 L28.5 19.5 L40 20.5 L31.5 28.5 L34 40 L24 33.5 L14 40 L16.5 28.5 L8 20.5 L19.5 19.5 Z" fill="currentColor"/>',
    ),
  },
  {
    id: 'plus',
    label: 'Plus',
    alt: 'Plus',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<path d="M24 12 V36 M12 24 H36" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
    ),
  },
  {
    id: 'diamond',
    label: 'Diamond',
    alt: 'Diamond',
    viewBox: '0 0 48 48',
    markup: svg(
      '0 0 48 48',
      '<path d="M24 8 L40 24 L24 40 L8 24 Z" fill="currentColor"/>',
    ),
  },
] as const

export const SITE_SVG_DEFAULT_MARK_ID: Exclude<SiteSvgMarkId, 'custom'> = 'triangle'

export function siteSvgMark(id: string | undefined | null): SiteSvgMark | undefined {
  if (!id || id === 'custom') return undefined
  return SITE_SVG_MARKS.find((m) => m.id === id)
}

export function siteSvgMarkOptions(): Array<{ value: SiteSvgMarkId; label: string }> {
  return [
    ...SITE_SVG_MARKS.map((m) => ({ value: m.id as SiteSvgMarkId, label: m.label })),
    { value: 'custom', label: 'Custom' },
  ]
}

/**
 * Complete Zaoly starter token pack — fixture baseline for Kit / Inspect / Mag.
 * Spec: `specs/domain/zaoly-starter-token-pack.md`
 * Knowledge: `knowledge/zaoly-starter-token-pack.md` · CD: `knowledge/corporate-design.md`
 */
import type { InspectTokenOption, TokenGroupId } from '../inspect/token-catalog'
import { paths } from '../paths'

export type StarterPackLeafDef = {
  path: string
  type: string
  value: unknown
}

const GEIST = 'Geist'
const GEIST_MONO = 'Geist Mono'
const SPECTRAL = 'Spectral'

/** CD light foundations (9a). */
export const ZAOLY_CD = {
  paper: '#f3eee4',
  elevated: '#fbf6ec',
  canvas: '#e1d6c2',
  warmGray: '#2e2a24',
  warmGrayFg: '#f3eee4',
  ink: '#1e1b17',
  inkSecondary: '#57554c',
  inkMuted: '#8c8578',
  line: '#c9bca1',
  primary: '#1f44ff',
  primaryDark: '#3e63ff',
  primaryFg: '#f3eee4',
  live: '#c6f24a',
  liveFg: '#1e1b17',
  danger: '#c4372b',
  dangerDark: '#ff7062',
  ok: '#3d7a45',
  warn: '#c47a1a',
  info: '#2a6fdb',
  white: '#ffffff',
  black: '#000000',
} as const

/** CD dark foundations (9a dark column). */
export const ZAOLY_CD_DARK = {
  paper: '#201c17',
  elevated: '#24201a',
  canvas: '#15120f',
  warmGray: '#24201a',
  warmGrayFg: '#ede6d8',
  ink: '#ede6d8',
  inkSecondary: '#b7ae9b',
  inkMuted: '#8a8171',
  line: '#3a342c',
  lineStrong: '#4a4238',
  primary: '#3e63ff',
  primaryHover: '#5b7cff',
  primaryActive: '#8096ff',
  primaryDisabled: '#3a342c',
  primaryDisabledFg: '#8a8171',
  primaryFg: '#ede6d8',
  live: '#c6f24a',
  liveFg: '#1e1b17',
  danger: '#ff7062',
  ok: '#5a9a62',
  warn: '#d4923a',
  info: '#4d8aef',
  mutedWash: '#2a251f',
  overlay: 'rgba(0, 0, 0, 0.65)',
  white: '#ffffff',
  black: '#000000',
} as const

export type StarterPackTheme = 'light' | 'dark'

/**
 * Role path → digital hex for dark mode (same path set as light).
 * Spec: `zaoly-starter-token-pack.md` Modes · CD foundations 9a dark.
 */
export const ZAOLY_STARTER_DARK_COLOR_OVERRIDES: Readonly<Record<string, string>> = {
  'color.background': ZAOLY_CD_DARK.paper,
  'color.surface.base': ZAOLY_CD_DARK.paper,
  'color.surface.elevated': ZAOLY_CD_DARK.elevated,
  'color.surface.canvas': ZAOLY_CD_DARK.canvas,
  'color.surface.field': ZAOLY_CD_DARK.elevated,
  'color.surface.muted': ZAOLY_CD_DARK.mutedWash,
  'color.surface.inverse': ZAOLY_CD_DARK.ink,
  'color.surface.inverseForeground': ZAOLY_CD_DARK.paper,
  'color.ink': ZAOLY_CD_DARK.ink,
  'color.inkSecondary': ZAOLY_CD_DARK.inkSecondary,
  'color.inkMuted': ZAOLY_CD_DARK.inkMuted,
  'color.inkInverse': ZAOLY_CD_DARK.paper,
  'color.line': ZAOLY_CD_DARK.line,
  'color.lineStrong': ZAOLY_CD_DARK.lineStrong,
  'color.lineFocus': ZAOLY_CD_DARK.primary,
  'color.overlay': ZAOLY_CD_DARK.overlay,
  'color.neutral.100': ZAOLY_CD_DARK.elevated,
  'color.neutral.700': ZAOLY_CD_DARK.ink,
  'color.action.primary': ZAOLY_CD_DARK.primary,
  'color.action.primaryForeground': ZAOLY_CD_DARK.primaryFg,
  'color.action.primaryHover': ZAOLY_CD_DARK.primaryHover,
  'color.action.primaryActive': ZAOLY_CD_DARK.primaryActive,
  'color.action.primaryDisabled': ZAOLY_CD_DARK.primaryDisabled,
  'color.action.primaryDisabledForeground': ZAOLY_CD_DARK.primaryDisabledFg,
  'color.action.secondary': ZAOLY_CD_DARK.ink,
  'color.action.secondaryForeground': ZAOLY_CD_DARK.paper,
  'color.action.secondaryHover': ZAOLY_CD_DARK.inkSecondary,
  'color.action.accent': ZAOLY_CD_DARK.live,
  'color.action.accentForeground': ZAOLY_CD_DARK.liveFg,
  'color.action.live': ZAOLY_CD_DARK.live,
  'color.action.liveForeground': ZAOLY_CD_DARK.liveFg,
  'color.action.destructive': ZAOLY_CD_DARK.danger,
  'color.action.destructiveForeground': ZAOLY_CD_DARK.black,
  'color.action.link': ZAOLY_CD_DARK.primary,
  'color.action.linkHover': ZAOLY_CD_DARK.primaryHover,
  'color.action.linkVisited': ZAOLY_CD_DARK.primaryActive,
  'color.brand.primary': ZAOLY_CD_DARK.primary,
  'color.brand.warmGray': ZAOLY_CD_DARK.warmGray,
  'color.status.ok': ZAOLY_CD_DARK.ok,
  'color.status.warn': ZAOLY_CD_DARK.warn,
  'color.status.danger': ZAOLY_CD_DARK.danger,
  'color.status.info': ZAOLY_CD_DARK.info,
  'color.chart.1': ZAOLY_CD_DARK.primary,
  'color.chart.2': ZAOLY_CD_DARK.live,
  'color.chart.3': ZAOLY_CD_DARK.inkSecondary,
  'color.chart.4': ZAOLY_CD_DARK.ok,
  'color.chart.5': ZAOLY_CD_DARK.warn,
  'color.ring': ZAOLY_CD_DARK.primary,
  'color.ringOffset': ZAOLY_CD_DARK.paper,
}

function colorHex(hex: string, print?: { pantone?: string; cmyk?: string } | true) {
  if (!print) return { digital: { hex } }
  if (print === true) return { digital: { hex }, print: { hex } }
  return { digital: { hex }, print: { hex, ...print } }
}

function spacing(digital: string, print?: string) {
  return print !== undefined ? { digital, print } : { digital }
}

function radius(digital: string, print?: string) {
  return print !== undefined ? { digital, print } : { digital }
}

function opacity(digital: string) {
  return { digital }
}

function typeRole(
  family: string,
  weight: string,
  digital: { size: string; lineHeight: string; letterSpacing?: string },
  print?: { size: string; lineHeight: string; letterSpacing?: string },
) {
  return {
    family,
    weight,
    digital,
    ...(print ? { print } : {}),
  }
}

function shadow(
  digital: {
    offsetX: string
    offsetY: string
    blur: string
    spread: string
    color: string
  },
  print?: Record<string, string>,
) {
  return print ? { digital, print } : { digital }
}

function glow(digital: { color: string; blur: string; spread: string }) {
  return { digital }
}

function effect(kind: string, amount: string) {
  return { digital: { kind, amount } }
}

function motion(duration: string, easing: string) {
  return { digital: { duration, easing } }
}

function sizeLeaf(digital: Record<string, string>, print?: Record<string, string>) {
  return print ? { digital, print } : { digital }
}

/** Cobalt-ish ladder around brand primary. */
const COBALT: Record<string, string> = {
  '50': '#eef1ff',
  '100': '#d9e0ff',
  '200': '#b3c1ff',
  '300': '#8096ff',
  '400': '#4d6bff',
  '500': '#1f44ff',
  '600': '#1836cc',
  '700': '#122899',
  '800': '#0c1b66',
  '900': '#070f3d',
}

const CREAM: Record<string, string> = {
  '50': '#fbf8f2',
  '100': '#f3eee4',
  '200': '#e8dfd0',
  '300': '#e1d6c2',
  '400': '#c9bca1',
  '500': '#a8987c',
  '600': '#8c8578',
  '700': '#57554c',
  '800': '#2e2a24',
  '900': '#1e1b17',
}

const WARM: Record<string, string> = {
  '50': '#f3eee4',
  '100': '#e8e2d6',
  '200': '#c9bca1',
  '300': '#8c8578',
  '400': '#57554c',
  '500': '#3a3630',
  '600': '#2e2a24',
  '700': '#24201a',
  '800': '#201c17',
  '900': '#15120f',
}

const LIME: Record<string, string> = {
  '50': '#f7fde8',
  '100': '#eef9c8',
  '200': '#ddf392',
  '300': '#c6f24a',
  '400': '#a8d12e',
  '500': '#86a81a',
  '600': '#667f12',
  '700': '#4a5c0d',
  '800': '#323e09',
  '900': '#1e2605',
}

const DANGER: Record<string, string> = {
  '50': '#fceceb',
  '100': '#f5c9c5',
  '200': '#e9948c',
  '300': '#dc5e52',
  '400': '#c4372b',
  '500': '#a02c23',
  '600': '#7a211a',
  '700': '#541712',
  '800': '#360e0b',
  '900': '#1c0706',
}

const OK: Record<string, string> = {
  '50': '#eaf4eb',
  '100': '#c8e3cb',
  '200': '#92c799',
  '300': '#5faa68',
  '400': '#3d7a45',
  '500': '#316238',
  '600': '#254a2a',
  '700': '#1a331d',
  '800': '#102113',
  '900': '#08110a',
}

const WARN: Record<string, string> = {
  '50': '#fdf4e7',
  '100': '#f8e0b8',
  '200': '#f0c06e',
  '300': '#e09a2e',
  '400': '#c47a1a',
  '500': '#9c6114',
  '600': '#75490f',
  '700': '#4f310a',
  '800': '#2f1d06',
  '900': '#181003',
}

function paletteLeaves(
  name: string,
  steps: Record<string, string>,
): StarterPackLeafDef[] {
  return Object.entries(steps).map(([step, hex]) => ({
    path: `color.palette.${name}.${step}`,
    type: 'color',
    value: colorHex(hex),
  }))
}

const STATIC_SPACE: [string, string, string?][] = [
  ['0', '0', '0'],
  ['1', '0.25rem', '1mm'],
  ['2', '0.5rem', '2mm'],
  ['3', '0.75rem', '3mm'],
  ['4', '1rem', '4mm'],
  ['5', '1.5rem', '6mm'],
  ['6', '2rem', '8mm'],
  ['7', '3rem', '12mm'],
  ['8', '4rem', '16mm'],
]

/**
 * Complete starter inventory (Studio-editable types).
 * Local Inspect-only blur/rotate/gradient live in token-catalog.
 */
export const ZAOLY_STARTER_PACK_LEAVES: StarterPackLeafDef[] = [
  // A · palette primitives
  ...paletteLeaves('cobalt', COBALT),
  ...paletteLeaves('cream', CREAM),
  ...paletteLeaves('warmGray', WARM),
  ...paletteLeaves('lime', LIME),
  ...paletteLeaves('danger', DANGER),
  ...paletteLeaves('ok', OK),
  ...paletteLeaves('warn', WARN),
  { path: 'color.white', type: 'color', value: colorHex(ZAOLY_CD.white) },
  { path: 'color.black', type: 'color', value: colorHex(ZAOLY_CD.black) },

  // B · surfaces & ink (Mag-critical → print hex)
  {
    path: 'color.background',
    type: 'color',
    value: colorHex(ZAOLY_CD.paper, { pantone: 'Warm Gray 1 C' }),
  },
  { path: 'color.surface.base', type: 'color', value: colorHex(ZAOLY_CD.paper, true) },
  { path: 'color.surface.elevated', type: 'color', value: colorHex(ZAOLY_CD.elevated, true) },
  { path: 'color.surface.canvas', type: 'color', value: colorHex(ZAOLY_CD.canvas, true) },
  { path: 'color.surface.field', type: 'color', value: colorHex(ZAOLY_CD.elevated, true) },
  { path: 'color.surface.muted', type: 'color', value: colorHex(CREAM['200']!, true) },
  { path: 'color.surface.inverse', type: 'color', value: colorHex(ZAOLY_CD.warmGray, true) },
  {
    path: 'color.surface.inverseForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.warmGrayFg, true),
  },
  {
    path: 'color.ink',
    type: 'color',
    value: colorHex(ZAOLY_CD.ink, { pantone: 'Black C', cmyk: '0 0 0 100' }),
  },
  { path: 'color.inkSecondary', type: 'color', value: colorHex(ZAOLY_CD.inkSecondary, true) },
  { path: 'color.inkMuted', type: 'color', value: colorHex(ZAOLY_CD.inkMuted, true) },
  { path: 'color.inkInverse', type: 'color', value: colorHex(ZAOLY_CD.warmGrayFg, true) },
  { path: 'color.line', type: 'color', value: colorHex(ZAOLY_CD.line, true) },
  { path: 'color.lineStrong', type: 'color', value: colorHex(WARM['400']!, true) },
  { path: 'color.lineFocus', type: 'color', value: colorHex(ZAOLY_CD.primary, true) },
  { path: 'color.overlay', type: 'color', value: colorHex('rgba(30, 27, 23, 0.55)') },

  // Compat aliases
  { path: 'color.neutral.100', type: 'color', value: colorHex(CREAM['100']!, true) },
  {
    path: 'color.neutral.700',
    type: 'color',
    value: colorHex(ZAOLY_CD.ink, { pantone: 'Cool Gray 11 C' }),
  },

  // C · action + interactive
  {
    path: 'color.action.primary',
    type: 'color',
    value: colorHex(ZAOLY_CD.primary, { pantone: 'PMS 2728 C', cmyk: '88 68 0 0' }),
  },
  {
    path: 'color.action.primaryForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.primaryFg, true),
  },
  { path: 'color.action.primaryHover', type: 'color', value: colorHex(COBALT['600']!) },
  { path: 'color.action.primaryActive', type: 'color', value: colorHex(COBALT['700']!) },
  { path: 'color.action.primaryDisabled', type: 'color', value: colorHex(COBALT['200']!) },
  {
    path: 'color.action.primaryDisabledForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.inkMuted),
  },
  {
    path: 'color.action.secondary',
    type: 'color',
    value: colorHex(ZAOLY_CD.ink, { pantone: 'Black C', cmyk: '0 0 0 100' }),
  },
  {
    path: 'color.action.secondaryForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.primaryFg, true),
  },
  { path: 'color.action.secondaryHover', type: 'color', value: colorHex(WARM['500']!) },
  {
    path: 'color.action.accent',
    type: 'color',
    value: colorHex(ZAOLY_CD.live, { pantone: 'PMS 375 C' }),
  },
  {
    path: 'color.action.accentForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.liveFg, true),
  },
  { path: 'color.action.live', type: 'color', value: colorHex(ZAOLY_CD.live, true) },
  { path: 'color.action.liveForeground', type: 'color', value: colorHex(ZAOLY_CD.liveFg, true) },
  { path: 'color.action.destructive', type: 'color', value: colorHex(ZAOLY_CD.danger, true) },
  {
    path: 'color.action.destructiveForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.white, true),
  },
  { path: 'color.action.link', type: 'color', value: colorHex(ZAOLY_CD.primary, true) },
  { path: 'color.action.linkHover', type: 'color', value: colorHex(COBALT['600']!) },
  { path: 'color.action.linkVisited', type: 'color', value: colorHex(COBALT['700']!) },
  {
    path: 'color.brand.primary',
    type: 'color',
    value: colorHex(ZAOLY_CD.primary, { pantone: 'PMS 2728 C', cmyk: '88 68 0 0' }),
  },
  {
    path: 'color.brand.warmGray',
    type: 'color',
    value: colorHex(ZAOLY_CD.warmGray, { pantone: 'Black 5 C', cmyk: '0 8 18 82' }),
  },

  // D · status / chart / ring
  { path: 'color.status.ok', type: 'color', value: colorHex(ZAOLY_CD.ok, true) },
  { path: 'color.status.okForeground', type: 'color', value: colorHex(ZAOLY_CD.white, true) },
  { path: 'color.status.okSubtle', type: 'color', value: colorHex(OK['50']!) },
  { path: 'color.status.okBorder', type: 'color', value: colorHex(OK['300']!) },
  { path: 'color.status.warn', type: 'color', value: colorHex(ZAOLY_CD.warn, true) },
  { path: 'color.status.warnForeground', type: 'color', value: colorHex(ZAOLY_CD.white, true) },
  { path: 'color.status.warnSubtle', type: 'color', value: colorHex(WARN['50']!) },
  { path: 'color.status.warnBorder', type: 'color', value: colorHex(WARN['300']!) },
  { path: 'color.status.danger', type: 'color', value: colorHex(ZAOLY_CD.danger, true) },
  {
    path: 'color.status.dangerForeground',
    type: 'color',
    value: colorHex(ZAOLY_CD.white, true),
  },
  { path: 'color.status.dangerSubtle', type: 'color', value: colorHex(DANGER['50']!) },
  { path: 'color.status.dangerBorder', type: 'color', value: colorHex(DANGER['300']!) },
  { path: 'color.status.info', type: 'color', value: colorHex(ZAOLY_CD.info, true) },
  { path: 'color.status.infoForeground', type: 'color', value: colorHex(ZAOLY_CD.white, true) },
  { path: 'color.status.infoSubtle', type: 'color', value: colorHex(COBALT['50']!) },
  { path: 'color.status.infoBorder', type: 'color', value: colorHex(COBALT['300']!) },
  { path: 'color.chart.1', type: 'color', value: colorHex(ZAOLY_CD.primary) },
  { path: 'color.chart.2', type: 'color', value: colorHex(ZAOLY_CD.live) },
  { path: 'color.chart.3', type: 'color', value: colorHex(ZAOLY_CD.warmGray) },
  { path: 'color.chart.4', type: 'color', value: colorHex(ZAOLY_CD.ok) },
  { path: 'color.chart.5', type: 'color', value: colorHex(ZAOLY_CD.warn) },
  { path: 'color.ring', type: 'color', value: colorHex(ZAOLY_CD.primary) },
  { path: 'color.ringOffset', type: 'color', value: colorHex(ZAOLY_CD.paper) },

  // E · spacing
  ...STATIC_SPACE.map(([step, dig, print]) => ({
    path: `spacing.static.${step}`,
    type: 'spacing',
    value: spacing(dig!, print),
  })),
  { path: 'spacing.static.small', type: 'spacing', value: spacing('0.5rem', '2mm') },
  { path: 'spacing.static.medium', type: 'spacing', value: spacing('1rem', '4mm') },
  { path: 'spacing.static.large', type: 'spacing', value: spacing('2rem', '8mm') },
  { path: 'spacing.gap.none', type: 'spacing', value: spacing('0', '0') },
  { path: 'spacing.gap.tight', type: 'spacing', value: spacing('0.5rem', '2mm') },
  { path: 'spacing.gap.modules', type: 'spacing', value: spacing('1rem', '4mm') },
  { path: 'spacing.gap.section', type: 'spacing', value: spacing('2rem', '8mm') },
  { path: 'spacing.gap.page', type: 'spacing', value: spacing('3rem', '12mm') },
  { path: 'spacing.padding.none', type: 'spacing', value: spacing('0', '0') },
  { path: 'spacing.padding.xs', type: 'spacing', value: spacing('0.25rem', '1mm') },
  { path: 'spacing.padding.sm', type: 'spacing', value: spacing('0.5rem', '2mm') },
  { path: 'spacing.padding.md', type: 'spacing', value: spacing('0.75rem', '3mm') },
  { path: 'spacing.padding.lg', type: 'spacing', value: spacing('1rem', '4mm') },
  { path: 'spacing.padding.xl', type: 'spacing', value: spacing('1.5rem', '6mm') },
  { path: 'spacing.padding.control', type: 'spacing', value: spacing('0.75rem 1rem', '3mm 4mm') },
  { path: 'spacing.padding.page', type: 'spacing', value: spacing('2rem', '8mm') },
  { path: 'spacing.margin.sm', type: 'spacing', value: spacing('0.5rem', '2mm') },
  { path: 'spacing.margin.md', type: 'spacing', value: spacing('1rem', '4mm') },
  { path: 'spacing.margin.lg', type: 'spacing', value: spacing('1.5rem', '6mm') },
  { path: 'spacing.margin.page', type: 'spacing', value: spacing('2rem', '8mm') },
  { path: 'spacing.margin.section', type: 'spacing', value: spacing('3rem', '12mm') },
  {
    path: 'spacing.fluid.sm',
    type: 'spacing',
    value: spacing('clamp(0.5rem, 1.5vw, 0.75rem)'),
  },
  {
    path: 'spacing.fluid.md',
    type: 'spacing',
    value: spacing('clamp(1rem, 2vw, 1.5rem)'),
  },
  {
    path: 'spacing.fluid.lg',
    type: 'spacing',
    value: spacing('clamp(1.5rem, 3vw, 2.5rem)'),
  },

  // F · radius (CD brand default = 0; Mag print = 0)
  { path: 'radius.none', type: 'radius', value: radius('0', '0') },
  { path: 'radius.control.xs', type: 'radius', value: radius('0', '0') },
  { path: 'radius.control.sm', type: 'radius', value: radius('0', '0') },
  { path: 'radius.control.md', type: 'radius', value: radius('0', '0') },
  { path: 'radius.control.lg', type: 'radius', value: radius('0', '0') },
  { path: 'radius.control.pill', type: 'radius', value: radius('999px') },
  { path: 'radius.surface', type: 'radius', value: radius('0', '0') },
  { path: 'radius.surface.lg', type: 'radius', value: radius('0', '0') },
  { path: 'radius.field', type: 'radius', value: radius('0', '0') },

  // G · opacity
  { path: 'opacity.full', type: 'opacity', value: opacity('1') },
  { path: 'opacity.subtle', type: 'opacity', value: opacity('0.85') },
  { path: 'opacity.muted', type: 'opacity', value: opacity('0.64') },
  { path: 'opacity.disabled', type: 'opacity', value: opacity('0.4') },
  { path: 'opacity.overlay', type: 'opacity', value: opacity('0.55') },
  { path: 'opacity.ghost', type: 'opacity', value: opacity('0.12') },

  // H · size
  {
    path: 'size.touch.target',
    type: 'size',
    value: sizeLeaf(
      { min: '44px', preferred: '48px', max: '64px' },
      { min: '12mm', preferred: '14mm' },
    ),
  },
  { path: 'size.control.sm', type: 'size', value: sizeLeaf({ min: '28px' }, { min: '8mm' }) },
  { path: 'size.control.md', type: 'size', value: sizeLeaf({ min: '36px' }, { min: '10mm' }) },
  { path: 'size.control.lg', type: 'size', value: sizeLeaf({ min: '44px' }, { min: '12mm' }) },
  { path: 'size.icon.sm', type: 'size', value: sizeLeaf({ min: '16px' }) },
  { path: 'size.icon.md', type: 'size', value: sizeLeaf({ min: '20px' }) },
  { path: 'size.icon.lg', type: 'size', value: sizeLeaf({ min: '24px' }) },
  {
    path: 'size.logo.min',
    type: 'size',
    value: sizeLeaf({ min: '24px' }, { min: '8mm' }),
  },
  { path: 'size.logo.preferred', type: 'size', value: sizeLeaf({ preferred: '120px' }) },
  { path: 'size.container.sm', type: 'size', value: sizeLeaf({ max: '40rem' }) },
  { path: 'size.container.md', type: 'size', value: sizeLeaf({ max: '56rem' }) },
  { path: 'size.container.lg', type: 'size', value: sizeLeaf({ max: '72rem' }) },
  { path: 'size.container.max', type: 'size', value: sizeLeaf({ max: '90rem' }) },
  { path: 'size.border.hairline', type: 'size', value: sizeLeaf({ min: '1px' }) },
  { path: 'size.border.thin', type: 'size', value: sizeLeaf({ min: '1px' }) },
  { path: 'size.border.thick', type: 'size', value: sizeLeaf({ min: '2px' }) },
  { path: 'size.block.hero', type: 'size', value: sizeLeaf({ min: '70vh' }) },
  { path: 'size.media.sm', type: 'size', value: sizeLeaf({ min: '9rem' }) },
  { path: 'size.media.md', type: 'size', value: sizeLeaf({ min: '16rem' }) },
  { path: 'size.media.lg', type: 'size', value: sizeLeaf({ min: '18rem' }) },
  { path: 'size.media.lgMax', type: 'size', value: sizeLeaf({ max: '22rem' }) },

  // I · typography
  {
    path: 'typography.display',
    type: 'typography',
    value: typeRole(
      SPECTRAL,
      '600',
      {
        size: '3rem',
        lineHeight: '1.1',
        letterSpacing: '-0.02em',
      },
      { size: '36pt', lineHeight: '40pt', letterSpacing: '-0.02em' },
    ),
  },
  {
    path: 'typography.heading.h1',
    type: 'typography',
    value: typeRole(
      GEIST,
      '600',
      { size: '2rem', lineHeight: '1.2', letterSpacing: '-0.01em' },
      { size: '28pt', lineHeight: '32pt', letterSpacing: '0' },
    ),
  },
  {
    path: 'typography.heading.h2',
    type: 'typography',
    value: typeRole(
      GEIST,
      '600',
      { size: '1.5rem', lineHeight: '1.25' },
      { size: '18pt', lineHeight: '22pt' },
    ),
  },
  {
    path: 'typography.heading.h3',
    type: 'typography',
    value: typeRole(
      GEIST,
      '600',
      { size: '1.25rem', lineHeight: '1.3' },
      { size: '14pt', lineHeight: '18pt' },
    ),
  },
  {
    path: 'typography.heading.h4',
    type: 'typography',
    value: typeRole(
      GEIST,
      '600',
      { size: '1.125rem', lineHeight: '1.35' },
      { size: '12pt', lineHeight: '16pt' },
    ),
  },
  {
    path: 'typography.body',
    type: 'typography',
    value: typeRole(
      GEIST,
      '400',
      { size: '1rem', lineHeight: '1.5' },
      { size: '10pt', lineHeight: '14pt' },
    ),
  },
  {
    path: 'typography.body.family',
    type: 'typography',
    value: typeRole(
      GEIST,
      '400',
      { size: '1rem', lineHeight: '1.5' },
      { size: '10pt', lineHeight: '14pt' },
    ),
  },
  {
    path: 'typography.body.strong',
    type: 'typography',
    value: typeRole(
      GEIST,
      '600',
      { size: '1rem', lineHeight: '1.5' },
      { size: '10pt', lineHeight: '14pt' },
    ),
  },
  {
    path: 'typography.label',
    type: 'typography',
    value: typeRole(
      GEIST,
      '500',
      { size: '0.875rem', lineHeight: '1.3' },
      { size: '9pt', lineHeight: '12pt' },
    ),
  },
  {
    path: 'typography.label.sm',
    type: 'typography',
    value: typeRole(
      GEIST,
      '500',
      { size: '0.75rem', lineHeight: '1.3' },
      { size: '8pt', lineHeight: '11pt' },
    ),
  },
  {
    path: 'typography.caption',
    type: 'typography',
    value: typeRole(
      GEIST,
      '400',
      { size: '0.75rem', lineHeight: '1.4' },
      { size: '8pt', lineHeight: '11pt' },
    ),
  },
  {
    path: 'typography.overline',
    type: 'typography',
    value: typeRole(
      GEIST,
      '600',
      {
        size: '0.6875rem',
        lineHeight: '1.2',
        letterSpacing: '0.06em',
      },
      { size: '7pt', lineHeight: '10pt', letterSpacing: '0.06em' },
    ),
  },
  {
    path: 'typography.code',
    type: 'typography',
    value: typeRole(
      GEIST_MONO,
      '400',
      { size: '0.875rem', lineHeight: '1.4' },
      { size: '9pt', lineHeight: '12pt' },
    ),
  },
  {
    path: 'typography.family.mono',
    type: 'typography',
    value: typeRole(
      GEIST_MONO,
      '400',
      { size: '0.72rem', lineHeight: '1.4' },
      { size: '8pt', lineHeight: '11pt' },
    ),
  },
  {
    path: 'typography.quote',
    type: 'typography',
    value: typeRole(
      SPECTRAL,
      '400',
      { size: '1.25rem', lineHeight: '1.45' },
      { size: '14pt', lineHeight: '20pt' },
    ),
  },

  // J · shadow / glow / effect / motion
  {
    path: 'shadow.none',
    type: 'shadow',
    value: shadow({
      offsetX: '0',
      offsetY: '0',
      blur: '0',
      spread: '0',
      color: 'transparent',
    }),
  },
  {
    path: 'shadow.elevation.sm',
    type: 'shadow',
    value: shadow(
      {
        offsetX: '0',
        offsetY: '1px',
        blur: '3px',
        spread: '0',
        color: 'rgba(0, 0, 0, 0.1)',
      },
      {
        offsetX: '0',
        offsetY: '0.3mm',
        blur: '0.8mm',
        spread: '0',
        color: 'rgba(0, 0, 0, 0.1)',
      },
    ),
  },
  {
    path: 'shadow.elevation.md',
    type: 'shadow',
    value: shadow(
      {
        offsetX: '0',
        offsetY: '4px',
        blur: '12px',
        spread: '0',
        color: 'rgba(0, 0, 0, 0.15)',
      },
      {
        offsetX: '0',
        offsetY: '1mm',
        blur: '2mm',
        spread: '0',
        color: 'rgba(0, 0, 0, 0.15)',
      },
    ),
  },
  {
    path: 'shadow.elevation.lg',
    type: 'shadow',
    value: shadow({
      offsetX: '0',
      offsetY: '12px',
      blur: '28px',
      spread: '-4px',
      color: 'rgba(0, 0, 0, 0.2)',
    }),
  },
  {
    path: 'shadow.elevation.overlay',
    type: 'shadow',
    value: shadow({
      offsetX: '0',
      offsetY: '22px',
      blur: '44px',
      spread: '-20px',
      color: 'rgba(0, 0, 0, 0.55)',
    }),
  },
  {
    path: 'shadow.focus',
    type: 'shadow',
    value: shadow({
      offsetX: '0',
      offsetY: '0',
      blur: '0',
      spread: '3px',
      color: 'rgba(31, 68, 255, 0.35)',
    }),
  },
  {
    path: 'glow.accent',
    type: 'glow',
    value: glow({ color: 'rgba(31, 68, 255, 0.85)', blur: '24px', spread: '2px' }),
  },
  {
    path: 'glow.live',
    type: 'glow',
    value: glow({ color: 'rgba(198, 242, 74, 0.8)', blur: '20px', spread: '0' }),
  },
  {
    path: 'glow.danger',
    type: 'glow',
    value: glow({ color: 'rgba(196, 55, 43, 0.75)', blur: '18px', spread: '0' }),
  },
  { path: 'effect.blur.sm', type: 'effect', value: effect('blur', '4px') },
  { path: 'effect.blur.md', type: 'effect', value: effect('blur', '8px') },
  { path: 'effect.blur.lg', type: 'effect', value: effect('blur', '16px') },
  { path: 'effect.saturate.punch', type: 'effect', value: effect('saturate', '1.6') },
  {
    path: 'motion.instant',
    type: 'motion',
    value: motion('0ms', 'linear'),
  },
  {
    path: 'motion.fast',
    type: 'motion',
    value: motion('120ms', 'cubic-bezier(0.2, 0, 0, 1)'),
  },
  {
    path: 'motion.base',
    type: 'motion',
    value: motion('240ms', 'cubic-bezier(0.2, 0, 0, 1)'),
  },
  {
    path: 'motion.emphasized',
    type: 'motion',
    value: motion('400ms', 'cubic-bezier(0.34, 1.3, 0.64, 1)'),
  },
  {
    path: 'motion.exit',
    type: 'motion',
    value: motion('180ms', 'cubic-bezier(0.3, 0, 1, 1)'),
  },
  {
    path: 'motion.easing.standard',
    type: 'motion',
    value: motion('240ms', 'cubic-bezier(0.2, 0, 0, 1)'),
  },
  {
    path: 'motion.easing.emphasized',
    type: 'motion',
    value: motion('400ms', 'cubic-bezier(0.34, 1.3, 0.64, 1)'),
  },
  {
    path: 'motion.easing.linear',
    type: 'motion',
    value: motion('240ms', 'linear'),
  },

  // L · assets (placeholders)
  {
    path: 'logo.mark',
    type: 'asset',
    value: { digital: { kind: 'image', src: paths.brandAssets.mark, alt: 'Zaoly' } },
  },
  {
    path: 'logo.wordmark',
    type: 'asset',
    value: { digital: { kind: 'image', src: paths.brandAssets.wordmark, alt: 'Zaoly' } },
  },
]

/** Every starter path (for presence tests). */
export const ZAOLY_STARTER_PACK_PATHS: readonly string[] = ZAOLY_STARTER_PACK_LEAVES.map(
  (l) => l.path,
)

function patchColorDigitalHex(value: unknown, hex: string): unknown {
  if (!value || typeof value !== 'object') return { digital: { hex } }
  const record = value as { digital?: unknown; print?: unknown }
  if (record.digital && typeof record.digital === 'object') {
    return {
      ...record,
      digital: { ...(record.digital as Record<string, unknown>), hex },
    }
  }
  return { ...record, digital: { hex } }
}

/**
 * Same starter paths; dark theme swaps role digital hexes (CD 9a dark column).
 * Light = seed SSOT used by INSPECT_TOKEN_CATALOG.
 */
export function starterPackLeavesForTheme(theme: StarterPackTheme): StarterPackLeafDef[] {
  if (theme === 'light') return [...ZAOLY_STARTER_PACK_LEAVES]
  return ZAOLY_STARTER_PACK_LEAVES.map((leaf) => {
    const hex = ZAOLY_STARTER_DARK_COLOR_OVERRIDES[leaf.path]
    if (!hex || leaf.type !== 'color') return leaf
    return { ...leaf, value: patchColorDigitalHex(leaf.value, hex) }
  })
}

const TYPE_GROUPS = new Set<TokenGroupId>([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
])

function groupForType(type: string, path: string): TokenGroupId | null {
  if (type === 'color' || path.startsWith('color.')) return 'color'
  if (type === 'spacing' || path.startsWith('spacing.')) return 'space'
  if (type === 'radius' || path.startsWith('radius.')) return 'radius'
  if (type === 'opacity' || path.startsWith('opacity.')) return 'opacity'
  if (type === 'shadow' || path.startsWith('shadow.')) return 'shadow'
  if (type === 'glow' || path.startsWith('glow.')) return 'glow'
  if (type === 'effect' || path.startsWith('effect.')) return 'effect'
  if (type === 'motion' || path.startsWith('motion.')) return 'motion'
  if (type === 'size' || path.startsWith('size.')) return 'size'
  if (type === 'typography' || path.startsWith('typography.')) return 'fontFamily'
  if (type === 'asset') return null
  return null
}

/**
 * Build inspect catalog rows from starter leaves (skips asset until picker supports it).
 * Callers pass `packCatalogToken` from token-catalog to avoid circular imports of CSS helpers.
 */
export function buildStarterInspectCatalog(
  packCatalogToken: (
    path: string,
    group: TokenGroupId,
    type: string,
    value: unknown,
  ) => InspectTokenOption,
): InspectTokenOption[] {
  const out: InspectTokenOption[] = []
  for (const leaf of ZAOLY_STARTER_PACK_LEAVES) {
    const group = groupForType(leaf.type, leaf.path)
    if (!group) continue
    out.push(packCatalogToken(leaf.path, group, leaf.type, leaf.value))
  }
  return out
}

/** Studio types that must appear at least once in the seed. */
export const ZAOLY_STARTER_REQUIRED_TYPES = [
  'color',
  'spacing',
  'radius',
  'opacity',
  'size',
  'typography',
  'shadow',
  'glow',
  'effect',
  'motion',
  'asset',
] as const

/** Paths Site Kit default bindings must resolve after the bind pass. */
export const ZAOLY_STARTER_SITE_KIT_REQUIRED_PATHS = [
  'color.action.primary',
  'color.action.primaryForeground',
  'color.action.primaryHover',
  'color.action.primaryActive',
  'color.action.primaryDisabled',
  'color.action.primaryDisabledForeground',
  'color.action.link',
  'color.action.linkHover',
  'color.action.accent',
  'color.action.accentForeground',
  'color.ink',
  'color.inkMuted',
  'color.background',
  'color.surface.field',
  'color.surface.elevated',
  'color.surface.muted',
  'color.surface.canvas',
  'color.line',
  'color.lineStrong',
  'color.ring',
  'color.black',
  'color.neutral.100',
  'color.neutral.700',
  'color.status.ok',
  'color.status.warn',
  'color.status.danger',
  'color.chart.1',
  'color.chart.2',
  'color.chart.3',
  'color.chart.4',
  'color.chart.5',
  'spacing.static.medium',
  'spacing.gap.modules',
  'spacing.padding.control',
  'radius.control.sm',
  'radius.control.md',
  'radius.surface',
  'size.block.hero',
  'size.media.sm',
  'size.media.md',
  'size.media.lg',
  'size.media.lgMax',
  'typography.body.family',
  'typography.label',
  'typography.heading.h1',
] as const

/**
 * Mag-critical paths that MUST expose a CSS-paintable print facet
 * (`printCssForLeaf` → mm / pt / #hex). Spec wave 5.
 */
export const ZAOLY_STARTER_MAG_PRINT_REQUIRED_PATHS = [
  'color.background',
  'color.ink',
  'color.inkMuted',
  'color.line',
  'color.neutral.100',
  'color.neutral.700',
  'color.action.primary',
  'color.action.accent',
  'color.action.secondary',
  'color.brand.primary',
  'color.surface.elevated',
  'color.status.ok',
  'color.status.warn',
  'color.status.danger',
  'spacing.static.medium',
  'spacing.gap.modules',
  'spacing.padding.control',
  'spacing.padding.md',
  'spacing.margin.md',
  'radius.control.md',
  'radius.surface',
  'typography.display',
  'typography.heading.h1',
  'typography.heading.h2',
  'typography.body',
  'typography.body.family',
  'typography.label',
  'typography.caption',
  'typography.quote',
  'shadow.elevation.md',
  'size.control.md',
] as const

export function assertStarterPackComplete(): {
  ok: boolean
  missingTypes: string[]
  duplicatePaths: string[]
} {
  const types = new Set(ZAOLY_STARTER_PACK_LEAVES.map((l) => l.type))
  const missingTypes = ZAOLY_STARTER_REQUIRED_TYPES.filter((t) => !types.has(t))
  const seen = new Set<string>()
  const duplicatePaths: string[] = []
  for (const leaf of ZAOLY_STARTER_PACK_LEAVES) {
    if (seen.has(leaf.path)) duplicatePaths.push(leaf.path)
    seen.add(leaf.path)
  }
  return { ok: missingTypes.length === 0 && duplicatePaths.length === 0, missingTypes, duplicatePaths }
}

// silence unused — TYPE_GROUPS reserved for future facet helpers
void TYPE_GROUPS

import { zaolyBrand } from './brand'
import { zaolyRoles, zaolyRolesDark } from './roles'

export type ChartTokens = {
  muted: string
  accent: string
  ok: string
  ink: string
  grid: string
  tipBg: string
  tipBorder: string
  tipFg: string
}

export type SemanticTheme = {
  bg0: string
  bg1: string
  ink: string
  muted: string
  accent: string
  line: string
  danger: string
  ok: string
  warn: string
  surface: string
  surface2: string
  chart: ChartTokens
  roles: typeof zaolyRoles | typeof zaolyRolesDark
}

/** Trial light (legacy theme id `zaoly`) */
export const zaolyLight: SemanticTheme = {
  bg0: zaolyBrand.neutral,
  bg1: '#ffffff',
  ink: '#0f172a',
  muted: '#475569',
  accent: zaolyBrand.orange,
  line: 'rgba(0, 0, 0, 0.12)',
  danger: '#ef4444',
  ok: zaolyBrand.green,
  warn: zaolyBrand.yellow,
  surface: 'rgba(255, 255, 255, 0.92)',
  surface2: '#ffffff',
  chart: {
    muted: '#64748b',
    accent: zaolyBrand.orange,
    ok: zaolyBrand.green,
    ink: '#0f172a',
    grid: 'rgba(15, 23, 42, 0.12)',
    tipBg: '#ffffff',
    tipBorder: 'rgba(0, 0, 0, 0.12)',
    tipFg: '#0f172a',
  },
  roles: zaolyRoles,
}

/** Trial dark (legacy `zaoly-dark`) */
export const zaolyDark: SemanticTheme = {
  bg0: '#0f0f0f',
  bg1: '#1a1a1a',
  ink: '#ffffff',
  muted: '#a3a3a3',
  accent: zaolyBrand.orange,
  line: 'rgba(255, 255, 255, 0.12)',
  danger: '#f87171',
  ok: zaolyBrand.green,
  warn: zaolyBrand.yellow,
  surface: 'rgba(26, 26, 26, 0.92)',
  surface2: '#262626',
  chart: {
    muted: '#a3a3a3',
    accent: zaolyBrand.orange,
    ok: zaolyBrand.green,
    ink: '#ffffff',
    grid: 'rgba(255, 255, 255, 0.12)',
    tipBg: '#1a1a1a',
    tipBorder: 'rgba(255, 255, 255, 0.16)',
    tipFg: '#ffffff',
  },
  roles: zaolyRolesDark,
}

/**
 * zaoly-ui light — same brand, clearer surfaces + soft panel radius via CSS.
 */
export const zaolyV2Light: SemanticTheme = {
  ...zaolyLight,
  bg0: '#f6f4ee',
  bg1: '#ffffff',
  surface: 'rgba(255, 255, 255, 0.96)',
  surface2: '#faf9f6',
}

/**
 * zaoly-ui dark — slightly clearer elevated surfaces than trial dark.
 */
export const zaolyV2Dark: SemanticTheme = {
  ...zaolyDark,
  bg0: '#0c0c0c',
  bg1: '#161616',
  surface: 'rgba(22, 22, 22, 0.96)',
  surface2: '#222222',
  chart: {
    ...zaolyDark.chart,
    tipBg: '#161616',
  },
}

export const forestChart: ChartTokens = {
  muted: '#9aab9e',
  accent: '#c4a35a',
  ok: '#6a9b7a',
  ink: '#e8efe9',
  grid: 'rgba(232, 239, 233, 0.16)',
  tipBg: '#1a221e',
  tipBorder: 'rgba(232, 239, 233, 0.12)',
  tipFg: '#e8efe9',
}

/**
 * Breakpoint widths — Layer 0 web-system.
 * Aligns with zaoly-ui responsive ladder + ultra-wide entry.
 */
export const breakpoints = {
  sm: '640px',
  md: '900px',
  lg: '1200px',
  xl: '1600px',
  '2xl': '1920px',
} as const

export type BreakpointToken = keyof typeof breakpoints

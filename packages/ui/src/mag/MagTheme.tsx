import type { ReactNode } from 'react'
import {
  mergeMagazineColors,
  type MagazineColorOverrides,
  type MagazineColors,
} from '../magazine/colors'
import { createMagStyles, magColors, magStyles } from './tokens'

export type MagThemeValue = {
  colors: MagazineColors
  styles: ReturnType<typeof createMagStyles>
}

const defaultTheme: MagThemeValue = {
  colors: magColors,
  styles: magStyles,
}

/**
 * Module-scoped Mag theme for sync react-pdf renders.
 * Avoids React.createContext so Next.js API routes can import `@zaoly/ui/mag`
 * without a Client Component boundary.
 */
let activeTheme: MagThemeValue = defaultTheme

/** Apply color overrides (or reset to DS defaults when null/undefined). */
export function applyMagTheme(
  colorOverrides?: MagazineColorOverrides | MagazineColors | null,
): MagThemeValue {
  if (!colorOverrides) {
    activeTheme = defaultTheme
    return activeTheme
  }
  const colors = mergeMagazineColors(colorOverrides)
  activeTheme = { colors, styles: createMagStyles(colors) }
  return activeTheme
}

export function getMagTheme(): MagThemeValue {
  return activeTheme
}

/** @deprecated Prefer getMagTheme — kept as alias for call-site clarity. */
export function useMagTheme(): MagThemeValue {
  return activeTheme
}

/**
 * Applies Mag color overrides for the wrapped subtree during sync PDF render.
 * Callers that use `renderToBuffer` SHOULD `applyMagTheme(null)` in a `finally`
 * (creation `renderMagazinePdf` does this). Concurrent PDF jobs on one isolate
 * are not supported.
 */
export function MagThemeProvider({
  colors: colorOverrides,
  children,
}: {
  colors?: MagazineColorOverrides | MagazineColors | null
  children: ReactNode
}) {
  applyMagTheme(colorOverrides)
  return <>{children}</>
}

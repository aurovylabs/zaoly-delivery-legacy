/**
 * Email-safe palette — hex only (clients do not resolve CSS variables).
 * SSOT mirrors `zaolyBrand` + light semantic theme.
 */
import { zaolyBrand } from '../tokens/brand'
import { zaolyLight } from '../tokens/colors'

export const zaolyEmailPalette = {
  /** Outer page wash */
  canvas: zaolyBrand.neutral,
  /** Card surface */
  card: zaolyBrand.white,
  ink: zaolyLight.ink,
  muted: zaolyLight.muted,
  accent: zaolyBrand.orange,
  accentContrast: zaolyBrand.white,
  /** Soft rule */
  line: '#e8e4db',
  /** Stronger hairline under header */
  lineStrong: '#d9d4c8',
  /** Code / OTP well */
  codeSurface: '#fff5f0',
  codeBorder: '#ffd4c4',
  /** Subtle header wash behind logo lockup */
  headerWash: '#fbfaf7',
  ok: zaolyBrand.green,
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
} as const

export type ZaolyEmailPalette = typeof zaolyEmailPalette

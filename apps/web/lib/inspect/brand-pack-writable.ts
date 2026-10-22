/**
 * When Inspect / Smart HUD / Tokens rail may write the local pack.
 * Spec: `specs/domain/zaoly-token-studio.md`
 */
import type { BrandTokenPackResponse } from './token-catalog'

/** Local pack with admin (or auth-bypass) write. */
export function isLocalPackWritable(pack: BrandTokenPackResponse | null | undefined): boolean {
  return Boolean(pack?.source === 'local' && pack.canWrite)
}

/** Upstream live pack writes — out of scope; always false on Zaoly. */
export function isLiveUpstreamPackWritable(_pack: BrandTokenPackResponse | null | undefined): boolean {
  return false
}

/** @deprecated Session overlay promote — unused; local pack persists via `/api/tokens`. */
export function isLocalPromotePreview(_pack: BrandTokenPackResponse | null | undefined): boolean {
  return false
}

/** Plus / Tok affordance + rail edit. */
export function isBrandPackPromoteWritable(pack: BrandTokenPackResponse | null | undefined): boolean {
  return isLocalPackWritable(pack)
}

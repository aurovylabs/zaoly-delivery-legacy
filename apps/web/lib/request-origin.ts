/**
 * Lightweight Origin allowlist for cookie-authenticated mutating `/api/*` calls.
 * Missing Origin is allowed (same-origin navigation / non-browser clients).
 * Present Origin must match creation public URL, localhost, or staging allowlist.
 */

import { paths } from './paths'
import { zaolyPublicUrl } from './runtime-config'

function originFromUrl(raw: string | null | undefined): string | null {
  const v = raw?.trim()
  if (!v) return null
  try {
    return new URL(v).origin
  } catch {
    return null
  }
}

/** Canonical browser origins that may mutate CREATION with session cookies. */
export function allowedMutatingApiOrigins(): string[] {
  const set = new Set<string>()
  const pub = originFromUrl(zaolyPublicUrl())
  if (pub) set.add(pub)
  set.add(`http://localhost:${paths.devPort}`)
  set.add(`http://127.0.0.1:${paths.devPort}`)
  const staging = originFromUrl(paths.ecosystemStagingZaoly)
  if (staging) set.add(staging)
  return [...set]
}

export function isMutatingApiMethod(method: string): boolean {
  const m = method.toUpperCase()
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE'
}

/**
 * Returns false when Origin is present and not allowlisted.
 * No Origin → true (curl, same-site without Origin, machine).
 */
export function isAllowedMutatingApiOrigin(originHeader: string | null): boolean {
  const origin = originHeader?.trim()
  if (!origin) return true
  return allowedMutatingApiOrigins().includes(origin)
}

/**
 * Collection-scoped Storybook Live credentials (SK-S1).
 * Spec: specs/domain/site-kit-collection-scope.md · specs/api/site-kit-write.md
 *
 * Reusable HMAC until exp (not one-time) so Live/Catalog can poll.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { getAuthSecret } from '../auth-secret'
import { paths } from '../paths'

export type SiteKitViewClaims = {
  platformProjectId: string
  exp: number
  userId?: string
}

function signingSecret(): string {
  const dedicated = process.env[paths.envLaunchTokenSecret]?.trim()
  if (dedicated && dedicated.length >= 32) return dedicated
  return getAuthSecret()
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf
  return b.toString('base64url')
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', signingSecret()).update(payloadB64).digest('base64url')
}

export function mintSiteKitViewToken(input: {
  platformProjectId: string
  userId?: string | null
  ttlSeconds?: number
}): { viewToken: string; expiresAt: string; claims: SiteKitViewClaims } {
  const platformProjectId = input.platformProjectId.trim()
  if (!platformProjectId) {
    throw new Error('platform_project_required')
  }
  const ttl = input.ttlSeconds ?? paths.siteKitViewTokenTtlSeconds
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, Math.floor(ttl))
  const claims: SiteKitViewClaims = {
    platformProjectId,
    exp,
    ...(input.userId?.trim() ? { userId: input.userId.trim() } : {}),
  }
  const payloadB64 = b64url(JSON.stringify(claims))
  const sig = signPayload(payloadB64)
  return {
    viewToken: `${payloadB64}.${sig}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    claims,
  }
}

export function verifySiteKitViewToken(token: string | null | undefined): SiteKitViewClaims | null {
  const raw = token?.trim()
  if (!raw) return null
  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null
  const payloadB64 = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  if (!payloadB64 || !sig) return null
  const expected = signPayload(payloadB64)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  let claims: SiteKitViewClaims
  try {
    claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as SiteKitViewClaims
  } catch {
    return null
  }
  if (!claims?.platformProjectId?.trim() || typeof claims.exp !== 'number') return null
  if (claims.exp * 1000 <= Date.now()) return null
  return {
    platformProjectId: claims.platformProjectId.trim(),
    exp: claims.exp,
    ...(claims.userId?.trim() ? { userId: claims.userId.trim() } : {}),
  }
}

/** Read view token from header or query (Storybook deep-link). */
export function extractSiteKitViewToken(request: Request): string | null {
  const header = request.headers.get(paths.siteKitViewTokenHeader)?.trim()
  if (header) return header
  try {
    const url = new URL(request.url)
    return url.searchParams.get(paths.siteKitViewTokenQueryParam)?.trim() || null
  } catch {
    return null
  }
}

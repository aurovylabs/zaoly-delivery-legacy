/**
 * Read-only impersonation — mutating `/api/*` blocked except stop.
 * Spec: `knowledge/zaoly-admin-hardening.md` P2 · domain EARS read-only view-as.
 */
import { paths } from '../paths'
import { isMutatingApiMethod } from '../request-origin'
import { decodeImpersonationCookie } from './impersonation-cookie'

/** Paths that remain writable while view-as is active. */
export function isImpersonationWriteAllowed(pathname: string, method: string): boolean {
  if (!isMutatingApiMethod(method)) return true
  return pathname === paths.routes.apiAdminImpersonateStop
}

/**
 * Returns a JSON error body when a mutating API call should be blocked.
 * Pure helper for proxy + tests (no Response allocation).
 */
export function impersonationWriteBlockReason(
  method: string,
  pathname: string,
  cookieValue: string | undefined | null,
): 'impersonating' | null {
  if (!pathname.startsWith('/api/')) return null
  if (isImpersonationWriteAllowed(pathname, method)) return null
  if (!decodeImpersonationCookie(cookieValue)) return null
  return 'impersonating'
}

/** Shared public access gate for Client Page Share routes (P1–P3). */
import { cookies } from 'next/headers'
import { auth } from '../../auth'
import { paths } from '../paths'
import { isServiceAuthConfigured } from '../runtime-config'
import { viewerCanAccessPlatformProjectId } from '../require-scene-collection-access'
import { emailOnAllowlist } from './email'
import { verifyClientShareUnlockToken } from './unlock'
import type { ClientPageShareRecord } from './store'

export type ClientShareGateResult =
  | { ok: true; via: 'link' | 'cookie' | 'sso' }
  | { ok: false; code: 'password_required' | 'email_required' }

/**
 * SSO: signed-in Collection viewer, or session email on allowlist.
 */
export async function trySsoClientShareAccess(
  record: ClientPageShareRecord,
): Promise<boolean> {
  if (!isServiceAuthConfigured()) return false
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return false
    if (await viewerCanAccessPlatformProjectId(record.platformProjectId, userId)) {
      return true
    }
    const email = session?.user?.email
    if (
      record.accessMode === 'email_allowlist' &&
      typeof email === 'string' &&
      emailOnAllowlist(email, record.emailAllowlist)
    ) {
      return true
    }
  } catch {
    return false
  }
  return false
}

export async function gateClientShareAccess(
  record: ClientPageShareRecord,
): Promise<ClientShareGateResult> {
  if (record.accessMode === 'link') return { ok: true, via: 'link' }

  const jar = await cookies()
  const unlock = jar.get(paths.clientPageShareUnlockCookie)?.value
  if (verifyClientShareUnlockToken(record.id, unlock)) {
    return { ok: true, via: 'cookie' }
  }

  if (await trySsoClientShareAccess(record)) {
    return { ok: true, via: 'sso' }
  }

  if (record.accessMode === 'email_allowlist') {
    return { ok: false, code: 'email_required' }
  }
  return { ok: false, code: 'password_required' }
}

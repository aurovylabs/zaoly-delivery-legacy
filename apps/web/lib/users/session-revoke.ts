import 'server-only'
import type { JWT } from 'next-auth/jwt'
import { isZaolyDatabaseConfigured } from '../runtime-config'
import { getUserById, isStaffRole, isZaolyUserStoreAvailable } from './user-store'

/**
 * Invalidate JWT when the effective user (or impersonation actor) is disabled.
 * Spec: `zaoly-admin-hardening.md` P1 · domain EARS 13–14.
 */
export async function enforceActiveJwt(token: JWT): Promise<JWT | null> {
  if (!isZaolyDatabaseConfigured() || !isZaolyUserStoreAvailable()) return token
  const sub = typeof token.sub === 'string' ? token.sub : null
  if (!sub) return token

  const effective = await getUserById(sub)
  if (!effective || effective.disabled) return null

  if (token.impersonating) {
    const actorId =
      typeof token.actorSub === 'string' ? token.actorSub : null
    if (!actorId) return null
    const actor = await getUserById(actorId)
    if (!actor || actor.disabled || !isStaffRole(actor.role)) return null
    return token
  }

  token.email = effective.email
  token.name = effective.name
  token.role = effective.role
  return token
}

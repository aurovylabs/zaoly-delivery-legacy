import 'server-only'
import { redirect } from 'next/navigation'
import { paths } from '../paths'
import { isMfaEnabledForUser } from './mfa-store'
import { isMfaEnvRequired } from './mfa-totp'
import { isPlatformAdminRole, type AppRole } from './user-store'

/** When MFA is required env-on, platform_admin without enroll → `/admin/security`. */
export async function redirectIfMfaEnrollmentRequired(
  user: { id: string; role: AppRole },
): Promise<void> {
  if (!isMfaEnvRequired()) return
  if (!isPlatformAdminRole(user.role)) return
  if (await isMfaEnabledForUser(user.id)) return
  redirect(paths.routes.adminSecurity)
}

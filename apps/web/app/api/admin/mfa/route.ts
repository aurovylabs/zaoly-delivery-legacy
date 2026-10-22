import { NextResponse } from 'next/server'
import { isMfaEnvRequired } from '../../../../lib/users/mfa-totp'
import { isMfaEnabledForUser } from '../../../../lib/users/mfa-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../lib/users/require-admin'


export async function GET() {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  const enabled = await isMfaEnabledForUser(admin.user.id)
  return NextResponse.json({
    enabled,
    required: isMfaEnvRequired(),
  })
}

import { NextResponse } from 'next/server'
import { isSmtpManagedByHost } from '../../../../lib/mail/smtp-config'
import { getSmtpStatus } from '../../../../lib/mail/system-mail'
import { isPublicSignupEnabled } from '../../../../lib/runtime-config'
import { sceneStoreBackend } from '../../../../lib/scene/scene-store'
import { isImpersonationEnabled } from '../../../../lib/users/impersonation'
import { isAdminUser, requireAdminUser } from '../../../../lib/users/require-admin'
import {
  countUsersBreakdown,
  isZaolyUserStoreAvailable,
} from '../../../../lib/users/user-store'


export async function GET() {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const [userCounts, smtp] = await Promise.all([countUsersBreakdown(), getSmtpStatus()])
  return NextResponse.json({
    userCounts,
    publicSignup: isPublicSignupEnabled(),
    smtp: {
      configured: smtp.configured,
      managed: isSmtpManagedByHost() || smtp.managed,
    },
    sceneStore: sceneStoreBackend(),
    impersonationEnabled: isImpersonationEnabled(),
  })
}

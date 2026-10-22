import { NextResponse } from 'next/server'
import { listWebAuthnCredentials } from '../../../../../lib/users/webauthn-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../lib/users/require-admin'


export async function GET() {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  const items = await listWebAuthnCredentials(admin.user.id)
  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      credentialId: c.credentialId,
      deviceType: c.deviceType,
      backedUp: c.backedUp,
      createdAt: c.createdAt,
    })),
  })
}

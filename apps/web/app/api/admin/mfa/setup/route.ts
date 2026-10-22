import { NextResponse } from 'next/server'
import { beginMfaSetup } from '../../../../../lib/users/mfa-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../lib/users/require-admin'


export async function POST() {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  try {
    const started = await beginMfaSetup(admin.user.id, admin.user.email)
    return NextResponse.json(started)
  } catch (e) {
    if (e instanceof Error && e.message === 'mfa_already_enabled') {
      return NextResponse.json({ error: 'mfa_already_enabled' }, { status: 400 })
    }
    return NextResponse.json({ error: 'mfa_setup_failed' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { voidRecordAdminAudit } from '../../../../../../lib/users/admin-audit'
import { webauthnRelyingParty } from '../../../../../../lib/users/webauthn-config'
import {
  registrationChallengeKey,
  takeWebAuthnChallenge,
} from '../../../../../../lib/users/webauthn-challenge'
import { insertWebAuthnCredential } from '../../../../../../lib/users/webauthn-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../../lib/users/require-admin'


export async function POST(req: Request) {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  let body: RegistrationResponseJSON
  try {
    body = (await req.json()) as RegistrationResponseJSON
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const expected = takeWebAuthnChallenge(registrationChallengeKey(admin.user.id))
  if (!expected) {
    return NextResponse.json({ error: 'challenge_expired' }, { status: 400 })
  }
  const { rpID, origin } = webauthnRelyingParty()
  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: expected.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    })
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'verification_failed' }, { status: 400 })
    }
    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo
    const saved = await insertWebAuthnCredential({
      userId: admin.user.id,
      credentialId: credential.id,
      publicKey: new Uint8Array(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports as
        | import('@simplewebauthn/server').AuthenticatorTransport[]
        | undefined,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    })
    voidRecordAdminAudit({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: 'user.webauthn_register',
      targetUserId: admin.user.id,
      meta: { credentialId: saved.credentialId },
    })
    return NextResponse.json({ ok: true, credentialId: saved.credentialId, id: saved.id })
  } catch {
    return NextResponse.json({ error: 'verification_failed' }, { status: 400 })
  }
}

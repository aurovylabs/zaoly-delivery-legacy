import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { webauthnRelyingParty } from '../../../../../../lib/users/webauthn-config'
import {
  putWebAuthnChallenge,
  registrationChallengeKey,
} from '../../../../../../lib/users/webauthn-challenge'
import { listWebAuthnCredentials } from '../../../../../../lib/users/webauthn-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../../lib/users/require-admin'


export async function POST() {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  const { rpID, rpName } = webauthnRelyingParty()
  const existing = await listWebAuthnCredentials(admin.user.id)
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: admin.user.email,
    userDisplayName: admin.user.name ?? admin.user.email,
    userID: new TextEncoder().encode(admin.user.id),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  })
  putWebAuthnChallenge(
    registrationChallengeKey(admin.user.id),
    options.challenge,
    admin.user.id,
  )
  return NextResponse.json(options)
}

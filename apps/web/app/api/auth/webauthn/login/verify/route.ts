import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { paths } from '../../../../../../lib/paths'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  takeRateLimit,
} from '../../../../../../lib/rate-limit'
import { isZaolyDatabaseConfigured } from '../../../../../../lib/runtime-config'
import { webauthnRelyingParty } from '../../../../../../lib/users/webauthn-config'
import {
  loginChallengeKey,
  mintWebAuthnTicket,
  takeWebAuthnChallenge,
} from '../../../../../../lib/users/webauthn-challenge'
import {
  getWebAuthnCredentialByCredentialId,
  updateWebAuthnCounter,
} from '../../../../../../lib/users/webauthn-store'
import {
  getUserById,
  isZaolyUserStoreAvailable,
} from '../../../../../../lib/users/user-store'


export async function POST(req: Request) {
  const limited = takeRateLimit(
    `login:${clientIpFromHeaders(req.headers)}`,
    paths.rateLimitAuthLoginMax,
    paths.rateLimitAuthLoginWindowMs,
  )
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  if (!isZaolyDatabaseConfigured() || !isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }

  let body: { email?: unknown; response?: AuthenticationResponseJSON }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !body.response) return NextResponse.json({ ok: false })

  const expected = takeWebAuthnChallenge(loginChallengeKey(email))
  if (!expected) return NextResponse.json({ ok: false })

  const cred = await getWebAuthnCredentialByCredentialId(body.response.id)
  if (!cred || cred.userId !== expected.userId) return NextResponse.json({ ok: false })

  const { rpID, origin } = webauthnRelyingParty()
  try {
    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: expected.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credentialId,
        publicKey: new Uint8Array(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports,
      },
      requireUserVerification: false,
    })
    if (!verification.verified) return NextResponse.json({ ok: false })
    const newCounter = verification.authenticationInfo.newCounter
    // Authenticators without signature counters always report 0 — allow that.
    if (cred.counter > 0 && newCounter <= cred.counter) {
      return NextResponse.json({ ok: false })
    }
    await updateWebAuthnCounter(cred.credentialId, newCounter)
    const user = await getUserById(cred.userId)
    if (!user || user.disabled) return NextResponse.json({ ok: false })
    return NextResponse.json({
      ok: true,
      webauthnTicket: mintWebAuthnTicket(user.id),
    })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

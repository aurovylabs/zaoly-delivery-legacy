import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
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
  putWebAuthnChallenge,
} from '../../../../../../lib/users/webauthn-challenge'
import { listWebAuthnCredentials } from '../../../../../../lib/users/webauthn-store'
import {
  getUserByEmail,
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

  let body: { email?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) return NextResponse.json({ ok: false })

  const user = await getUserByEmail(email)
  if (!user || user.disabled) return NextResponse.json({ ok: false })
  const creds = await listWebAuthnCredentials(user.id)
  if (!creds.length) return NextResponse.json({ ok: false })

  const { rpID } = webauthnRelyingParty()
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: creds.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    })),
    userVerification: 'preferred',
  })
  putWebAuthnChallenge(loginChallengeKey(email), options.challenge, user.id)
  return NextResponse.json({ ok: true, options })
}

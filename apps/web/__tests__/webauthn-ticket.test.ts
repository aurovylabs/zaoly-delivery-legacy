import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/auth-secret', () => ({
  getAuthSecret: () => 'test-secret-at-least-32-characters!!',
}))

describe('webauthn ticket + challenge', () => {
  beforeEach(async () => {
    const { resetWebAuthnChallengeStoreForTests } = await import(
      '../lib/users/webauthn-challenge'
    )
    resetWebAuthnChallengeStoreForTests()
  })

  it('round-trips a one-time ticket', async () => {
    const { mintWebAuthnTicket, consumeWebAuthnTicket } = await import(
      '../lib/users/webauthn-challenge'
    )
    const ticket = mintWebAuthnTicket('user-1')
    expect(consumeWebAuthnTicket(ticket)).toBe('user-1')
    expect(consumeWebAuthnTicket(ticket)).toBeNull()
  })

  it('stores and consumes challenges', async () => {
    const {
      putWebAuthnChallenge,
      takeWebAuthnChallenge,
      registrationChallengeKey,
    } = await import('../lib/users/webauthn-challenge')
    const key = registrationChallengeKey('u1')
    putWebAuthnChallenge(key, 'chal-abc', 'u1')
    expect(takeWebAuthnChallenge(key)).toEqual({
      challenge: 'chal-abc',
      userId: 'u1',
    })
    expect(takeWebAuthnChallenge(key)).toBeNull()
  })

  it('exposes webauthn paths', async () => {
    const { paths } = await import('../lib/paths')
    expect(paths.routes.apiAdminWebAuthnRegisterOptions).toBe(
      '/api/admin/webauthn/register/options',
    )
    expect(paths.routes.apiAuthWebAuthnLoginVerify).toBe(
      '/api/auth/webauthn/login/verify',
    )
    expect(paths.webauthnTicketTtlSeconds).toBeGreaterThan(0)
  })
})

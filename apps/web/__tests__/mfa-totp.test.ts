import { describe, expect, it, vi } from 'vitest'
import * as OTPAuth from 'otpauth'

vi.mock('../lib/auth-secret', () => ({
  getAuthSecret: () => 'test-secret-at-least-32-characters!!',
}))

describe('mfa totp + crypto', () => {
  it('round-trips sealed secrets', async () => {
    const { sealMfaSecret, openMfaSecret } = await import('../lib/users/mfa-crypto')
    const sealed = sealMfaSecret('BASE32SECRETTESTVALUE')
    expect(sealed.startsWith('v1.')).toBe(true)
    expect(openMfaSecret(sealed)).toBe('BASE32SECRETTESTVALUE')
    expect(openMfaSecret('tampered')).toBeNull()
  })

  it('verifies a live TOTP code', async () => {
    const {
      generateTotpSecret,
      verifyTotpCode,
      buildOtpauthUrl,
      generateRecoveryCodes,
      hashRecoveryCodes,
      consumeRecoveryCode,
    } = await import('../lib/users/mfa-totp')
    const secret = generateTotpSecret()
    const url = buildOtpauthUrl(secret, 'admin@zaoly.app')
    expect(url).toContain('otpauth://totp/')
    expect(url).toContain('Zaoly')
    const token = OTPAuth.TOTP.generate({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
    expect(verifyTotpCode(secret, token)).toBe(true)
    expect(verifyTotpCode(secret, '000000')).toBe(false)

    const codes = generateRecoveryCodes(4)
    expect(codes).toHaveLength(4)
    const hashes = hashRecoveryCodes(codes)
    const first = consumeRecoveryCode(codes[0]!, hashes)
    expect(first.ok).toBe(true)
    if (first.ok) {
      expect(first.remaining).toHaveLength(3)
      expect(consumeRecoveryCode(codes[0]!, first.remaining).ok).toBe(false)
    }
  })

  it('exposes MFA paths + env key', async () => {
    const { paths } = await import('../lib/paths')
    expect(paths.routes.adminSecurity).toBe('/admin/security')
    expect(paths.routes.apiAuthMfaPrepare).toBe('/api/auth/mfa/prepare')
    expect(paths.routes.apiAdminMfaSetup).toBe('/api/admin/mfa/setup')
    expect(paths.envZaolyPlatformAdminMfaRequired).toBe(
      'ZAOLY_PLATFORM_ADMIN_MFA_REQUIRED',
    )
  })
})

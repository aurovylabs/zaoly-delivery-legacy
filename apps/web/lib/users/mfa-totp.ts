import * as OTPAuth from 'otpauth'
import { randomBytes } from 'node:crypto'
import { envGet } from '../env-resolve'
import { paths } from '../paths'
import { hashPassword, verifyPassword } from './password'

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32
}

export function buildOtpauthUrl(secretBase32: string, accountEmail: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: paths.mfaIssuer,
    label: accountEmail,
    algorithm: 'SHA1',
    digits: paths.mfaTotpDigits,
    period: paths.mfaTotpPeriodSec,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
  return totp.toString()
}

export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const trimmed = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(trimmed)) return false
  const delta = OTPAuth.TOTP.validate({
    token: trimmed,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
    algorithm: 'SHA1',
    digits: paths.mfaTotpDigits,
    period: paths.mfaTotpPeriodSec,
    window: 1,
  })
  return delta !== null
}

export function generateRecoveryCodes(count: number = paths.mfaRecoveryCodeCount): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i += 1) {
    codes.push(randomBytes(5).toString('hex'))
  }
  return codes
}

export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map((c) => hashPassword(c.toLowerCase()))
}

export function consumeRecoveryCode(
  code: string,
  hashes: string[],
): { ok: true; remaining: string[] } | { ok: false } {
  const needle = code.trim().toLowerCase()
  if (!needle) return { ok: false }
  for (let i = 0; i < hashes.length; i += 1) {
    if (verifyPassword(needle, hashes[i])) {
      return { ok: true, remaining: hashes.filter((_, j) => j !== i) }
    }
  }
  return { ok: false }
}

export function isMfaEnvRequired(): boolean {
  const raw = envGet(paths.envZaolyPlatformAdminMfaRequired)?.trim().toLowerCase() ?? ''
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

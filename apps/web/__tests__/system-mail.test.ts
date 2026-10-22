import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { encryptSmtpSecret, decryptSmtpSecret, smtpSecretFingerprint } from '../lib/mail/smtp-crypto'
import {
  isSmtpManagedByHost,
  resolveSmtpConfig,
  smtpConfigFromEnv,
  toSmtpPublicStatus,
} from '../lib/mail/smtp-config'
import {
  accountDisabledMailContent,
  accountEnabledMailContent,
  commentNewMailContent,
  commentReplyMailContent,
  emailVerifyMailContent,
  inviteMailContent,
  passwordChangedMailContent,
  passwordResetMailContent,
  roleChangedMailContent,
  sceneSharedMailContent,
  smtpTestMailContent,
  welcomeMailContent,
} from '../lib/mail/mail-templates'
import { resolveMailLocale } from '../lib/mail/mail-locale'
import { mailBrand } from '../lib/mail/mail-brand'
import type { SmtpDbSettings } from '../lib/mail/smtp-types'
import { paths } from '../lib/paths'
import { isPublicPath } from '../lib/middleware-public-paths'

describe('smtp crypto', () => {
  it('round-trips secrets', () => {
    const plain = 's3cret-pass'
    const cipher = encryptSmtpSecret(plain)
    expect(cipher.startsWith('zaoly-smtp-v1.')).toBe(true)
    expect(decryptSmtpSecret(cipher)).toBe(plain)
    expect(smtpSecretFingerprint(plain)).toHaveLength(12)
  })
})

describe('smtp config resolve', () => {
  const keys = [
    paths.envZaolySmtpHost,
    paths.envZaolySmtpPort,
    paths.envZaolySmtpUser,
    paths.envZaolySmtpPass,
    paths.envZaolySmtpFrom,
    paths.envZaolySmtpFromName,
    paths.envZaolySmtpTls,
    paths.envZaolySmtpManaged,
  ]

  beforeEach(() => {
    for (const k of keys) delete process.env[k]
  })

  afterEach(() => {
    for (const k of keys) delete process.env[k]
  })

  it('reads env when host + from are set', () => {
    process.env[paths.envZaolySmtpHost] = paths.hostedSmtpHost
    process.env[paths.envZaolySmtpFrom] = paths.hostedSmtpFromDefault
    process.env[paths.envZaolySmtpUser] = paths.hostedSmtpFromDefault
    process.env[paths.envZaolySmtpPass] = 'x'
    process.env[paths.envZaolySmtpPort] = '587'
    const cfg = smtpConfigFromEnv()
    expect(cfg).toMatchObject({
      host: 'mail.zaoly.app',
      from: 'noreply@zaoly.app',
      port: 587,
      tls: 'starttls',
    })
  })

  it('prefers enabled DB settings over env when unmanaged (self-host)', () => {
    process.env[paths.envZaolySmtpHost] = 'env.example'
    process.env[paths.envZaolySmtpFrom] = 'env@example.com'
    const db: SmtpDbSettings = {
      enabled: true,
      host: 'smtp.db.local',
      port: 465,
      user: 'u',
      passCipher: encryptSmtpSecret('db-pass'),
      from: 'noreply@zaoly.app',
      fromName: 'Zaoly DB',
      tls: 'tls',
    }
    const resolved = resolveSmtpConfig(db)
    expect(resolved.source).toBe('db')
    expect(resolved.config?.host).toBe('smtp.db.local')
    expect(resolved.config?.pass).toBe('db-pass')
    const status = toSmtpPublicStatus(db, resolved)
    expect(status.configured).toBe(true)
    expect(status.managed).toBe(false)
    expect(status.passwordSet).toBe(true)
    expect(status).not.toHaveProperty('pass')
  })

  it('falls back to env when DB override is off', () => {
    process.env[paths.envZaolySmtpHost] = paths.hostedSmtpHost
    process.env[paths.envZaolySmtpFrom] = paths.hostedSmtpFromDefault
    const db: SmtpDbSettings = {
      enabled: false,
      host: 'ignored',
      port: 587,
      user: '',
      passCipher: '',
      from: 'ignored@x.com',
      fromName: 'X',
      tls: 'starttls',
    }
    expect(resolveSmtpConfig(db).source).toBe('env')
  })

  it('managed host uses env and ignores DB override', () => {
    process.env[paths.envZaolySmtpManaged] = '1'
    process.env[paths.envZaolySmtpHost] = paths.hostedSmtpHost
    process.env[paths.envZaolySmtpFrom] = paths.hostedSmtpFromDefault
    process.env[paths.envZaolySmtpPass] = 'host-pass'
    expect(isSmtpManagedByHost()).toBe(true)
    const db: SmtpDbSettings = {
      enabled: true,
      host: 'smtp.db.local',
      port: 465,
      user: 'u',
      passCipher: encryptSmtpSecret('db-pass'),
      from: 'override@zaoly.app',
      fromName: 'Override',
      tls: 'tls',
    }
    const resolved = resolveSmtpConfig(db)
    expect(resolved.source).toBe('env')
    expect(resolved.config?.host).toBe('mail.zaoly.app')
    expect(resolved.config?.from).toBe('noreply@zaoly.app')
    const status = toSmtpPublicStatus(db, resolved)
    expect(status.managed).toBe(true)
  })
})

describe('mail locale', () => {
  it('defaults to en and accepts de', () => {
    expect(resolveMailLocale(undefined)).toBe('en')
    expect(resolveMailLocale('de-DE')).toBe('de')
    expect(resolveMailLocale('fr')).toBe('en')
  })
})

describe('branded mail templates', () => {
  const kinds = [
    () =>
      inviteMailContent({
        inviteUrl: 'https://zaoly.app/invite/tok',
        role: 'member',
      }),
    () => welcomeMailContent({ editorUrl: 'https://zaoly.app/editor', name: 'Ada' }),
    () => smtpTestMailContent('en'),
    () =>
      sceneSharedMailContent({
        sceneName: 'Pitch',
        role: 'editor',
        editorUrl: 'https://zaoly.app/editor?sceneId=s1',
      }),
    () =>
      commentNewMailContent({
        sceneName: 'Pitch',
        authorName: 'Client',
        excerpt: 'Look here',
        openUrl: 'https://zaoly.app/editor?sceneId=s1',
      }),
    () =>
      commentReplyMailContent({
        sceneName: 'Pitch',
        replyAuthor: 'Designer',
        excerpt: 'Fixed',
        shareUrl: 'https://zaoly.app/share/p/crs_x',
      }),
    () => accountDisabledMailContent({}),
    () => accountEnabledMailContent({ loginUrl: 'https://zaoly.app/login' }),
    () => roleChangedMailContent({ role: 'admin' }),
    () => passwordResetMailContent({ resetUrl: 'https://zaoly.app/reset-password?token=t' }),
    () => passwordChangedMailContent({ loginUrl: 'https://zaoly.app/login' }),
    () => emailVerifyMailContent({ verifyUrl: 'https://zaoly.app/verify-email?token=t' }),
  ]

  it('ships HTML + text with Zaoly brand chrome for every kind', () => {
    for (const build of kinds) {
      const mail = build()
      expect(mail.subject.length).toBeGreaterThan(3)
      expect(mail.html).toContain(mailBrand.cobalt)
      expect(mail.html).toContain(mailBrand.seal)
      expect(mail.html).toContain('Zaoly')
      expect(mail.html).toMatch(/role="presentation"/)
      expect(mail.text.length).toBeGreaterThan(10)
    }
  })

  it('localizes invite and password reset to German', () => {
    const invite = inviteMailContent({
      inviteUrl: 'https://zaoly.app/invite/tok',
      role: 'admin',
      locale: 'de',
    })
    expect(invite.subject).toMatch(/Einladung/)
    expect(invite.html).toContain('Einladung öffnen')
    const reset = passwordResetMailContent({
      resetUrl: 'https://zaoly.app/reset-password?token=t',
      locale: 'de',
    })
    expect(reset.subject).toMatch(/Passwort/)
    expect(reset.html).toContain('Neues Passwort setzen')
  })

  it('includes actionable URLs in both parts', () => {
    const en = inviteMailContent({
      inviteUrl: 'https://zaoly.app/invite/tok',
      role: 'member',
    })
    expect(en.text).toContain('https://zaoly.app/invite/tok')
    expect(en.html).toContain('https://zaoly.app/invite/tok')
  })
})

describe('password reset public paths', () => {
  it('allows forgot/reset pages and APIs without a session', () => {
    expect(isPublicPath(paths.routes.forgotPassword, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.resetPassword, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthForgotPassword, 'POST')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthResetPassword, 'POST')).toBe(true)
    expect(paths.passwordResetTtlSeconds).toBe(3600)
  })
})

describe('soft email verify', () => {
  it('allows verify page + API and keeps 48h TTL', () => {
    expect(isPublicPath(paths.routes.verifyEmail, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthVerifyEmail, 'POST')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthVerifyEmailResend, 'POST')).toBe(true)
    expect(paths.emailVerifyTtlSeconds).toBe(48 * 60 * 60)
    const mail = emailVerifyMailContent({
      verifyUrl: 'https://zaoly.app/verify-email?token=t',
      locale: 'de',
    })
    expect(mail.subject).toMatch(/E-Mail/)
    expect(mail.html).toContain('E-Mail bestätigen')
  })
})

describe('hosted mail identity', () => {
  it('canonical hosted SMTP host is mail.zaoly.app', () => {
    expect(paths.hostedSmtpHost).toBe('mail.zaoly.app')
    expect(paths.hostedSmtpFromDefault).toBe('noreply@zaoly.app')
  })
})

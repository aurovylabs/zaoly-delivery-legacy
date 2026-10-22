/**
 * High-level system mail helpers (resolve config + send).
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import 'server-only'
import { editorHref } from '../editor-launch'
import { zaolyPublicUrl } from '../runtime-config'
import { paths } from '../paths'
import { resolveSmtpConfig } from './smtp-config'
import { loadSmtpDbSettings } from './smtp-store'
import { sendSystemMail, type SendSystemMailResult } from './send-mail'
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
  type MailLocale,
} from './mail-templates'
import type { SmtpConfig } from './smtp-types'
import { toSmtpPublicStatus } from './smtp-config'
import type { SmtpPublicStatus } from './smtp-types'

async function withSmtp(
  send: (config: SmtpConfig) => Promise<SendSystemMailResult>,
): Promise<SendSystemMailResult> {
  const db = await loadSmtpDbSettings()
  const { config } = resolveSmtpConfig(db)
  if (!config) return { ok: false, error: 'smtp_not_configured' }
  return send(config)
}

function publicUrl(route: string): string {
  return `${zaolyPublicUrl().replace(/\/$/, '')}${route}`
}

export async function getSmtpStatus(): Promise<SmtpPublicStatus> {
  const db = await loadSmtpDbSettings()
  return toSmtpPublicStatus(db, resolveSmtpConfig(db))
}

/** Never throws — for fire-and-forget call sites. */
export function voidSystemMail(promise: Promise<SendSystemMailResult>): void {
  void promise.catch(() => undefined)
}

export async function sendInviteEmail(input: {
  to: string
  inviteUrl: string
  role: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = inviteMailContent(input)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendWelcomeEmail(input: {
  to: string
  name?: string | null
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = welcomeMailContent({
      editorUrl: publicUrl(paths.routes.editor),
      name: input.name,
      locale: input.locale,
    })
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendSmtpTestEmail(input: {
  to: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = smtpTestMailContent(input.locale)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendSceneSharedEmail(input: {
  to: string
  sceneId: string
  sceneName: string
  role: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = sceneSharedMailContent({
      sceneName: input.sceneName,
      role: input.role,
      editorUrl: publicUrl(editorHref({ sceneId: input.sceneId })),
      locale: input.locale,
    })
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendCommentNewEmail(input: {
  to: string
  sceneId: string
  sceneName: string
  authorName: string
  excerpt: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = commentNewMailContent({
      sceneName: input.sceneName,
      authorName: input.authorName,
      excerpt: input.excerpt,
      openUrl: publicUrl(editorHref({ sceneId: input.sceneId })),
      locale: input.locale,
    })
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendCommentReplyEmail(input: {
  to: string
  sceneName: string
  replyAuthor: string
  excerpt: string
  shareUrl: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = commentReplyMailContent(input)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendAccountDisabledEmail(input: {
  to: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = accountDisabledMailContent(input)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendAccountEnabledEmail(input: {
  to: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = accountEnabledMailContent({
      loginUrl: publicUrl(paths.routes.login),
      locale: input.locale,
    })
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendRoleChangedEmail(input: {
  to: string
  role: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = roleChangedMailContent(input)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendPasswordResetEmail(input: {
  to: string
  resetUrl: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = passwordResetMailContent(input)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendPasswordChangedEmail(input: {
  to: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = passwordChangedMailContent({
      loginUrl: publicUrl(paths.routes.login),
      locale: input.locale,
    })
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

export async function sendEmailVerifyEmail(input: {
  to: string
  verifyUrl: string
  locale?: MailLocale
}): Promise<SendSystemMailResult> {
  return withSmtp(async (config) => {
    const body = emailVerifyMailContent(input)
    return sendSystemMail(config, { to: input.to, ...body })
  })
}

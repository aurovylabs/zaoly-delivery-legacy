/**
 * Nodemailer transport for Zaoly system mail.
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import 'server-only'
import nodemailer from 'nodemailer'
import type { SmtpConfig } from './smtp-types'

export type SendSystemMailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

export type SendSystemMailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string }

export async function sendSystemMail(
  config: SmtpConfig,
  input: SendSystemMailInput,
): Promise<SendSystemMailResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.tls === 'tls',
      requireTLS: config.tls === 'starttls',
      ...(config.user
        ? { auth: { user: config.user, pass: config.pass ?? '' } }
        : {}),
    })
    const info = await transporter.sendMail({
      from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    })
    return { ok: true, messageId: typeof info.messageId === 'string' ? info.messageId : undefined }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'smtp_send_failed'
    return { ok: false, error: msg }
  }
}

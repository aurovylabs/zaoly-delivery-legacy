/**
 * Branded HTML shell for Zaoly system mail (table + inline CSS).
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import { zaolyPublicUrl } from '../runtime-config'
import { paths } from '../paths'
import { escapeAttr, escapeHtml, mailBrand } from './mail-brand'
import type { MailLocale } from './mail-locale'

export type MailLayoutInput = {
  locale: MailLocale
  preheader: string
  eyebrow: string
  title: string
  paragraphs: string[]
  /** Optional meta rows (label → value). */
  meta?: Array<{ label: string; value: string }>
  cta?: { label: string; href: string }
  footnote?: string
}

function siteOrigin(): string {
  return zaolyPublicUrl().replace(/\/$/, '') || paths.publicSiteOrigin
}

export function renderMailHtml(input: MailLayoutInput): string {
  const b = mailBrand
  const origin = siteOrigin()
  const lang = input.locale === 'de' ? 'de' : 'en'
  const metaRows = (input.meta ?? [])
    .map(
      (row) => `
                  <tr>
                    <td style="padding:8px 0;font-family:${b.fontSans};font-size:13px;line-height:1.4;color:${b.muted};text-transform:uppercase;letter-spacing:0.08em;width:36%;vertical-align:top;">${escapeHtml(row.label)}</td>
                    <td style="padding:8px 0;font-family:${b.fontSans};font-size:15px;line-height:1.45;color:${b.ink};vertical-align:top;"><strong style="font-weight:600;">${escapeHtml(row.value)}</strong></td>
                  </tr>`,
    )
    .join('')

  const paragraphs = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${b.fontSans};font-size:16px;line-height:1.55;color:${b.ink};">${escapeHtml(p)}</p>`,
    )
    .join('\n')

  const cta = input.cta
    ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
                  <tr>
                    <td bgcolor="${b.cobalt}" style="background-color:${b.cobalt};">
                      <a href="${escapeAttr(input.cta.href)}" style="display:inline-block;padding:14px 28px;font-family:${b.fontSans};font-size:15px;font-weight:600;line-height:1;color:${b.white};text-decoration:none;">${escapeHtml(input.cta.label)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;font-family:${b.fontSans};font-size:12px;line-height:1.5;color:${b.muted};word-break:break-all;">${escapeHtml(input.cta.href)}</p>`
    : ''

  const footnote = input.footnote
    ? `<p style="margin:0;font-family:${b.fontSans};font-size:13px;line-height:1.5;color:${b.muted};">${escapeHtml(input.footnote)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${b.paper};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${b.paper};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="${b.contentWidthPx}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${b.contentWidthPx}px;background-color:${b.light};border:1px solid ${b.line};">
          <tr>
            <td bgcolor="${b.charcoal}" style="background-color:${b.charcoal};padding:20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${b.cobalt}" width="36" height="36" align="center" valign="middle" style="background-color:${b.cobalt};width:36px;height:36px;font-family:${b.fontSerif};font-size:18px;line-height:36px;color:${b.white};">${b.seal}</td>
                  <td style="padding-left:12px;font-family:${b.fontSerif};font-size:28px;line-height:1;letter-spacing:-0.04em;color:${b.charcoalFg};">${escapeHtml(b.product)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="${b.acid}" height="4" style="background-color:${b.acid};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 28px 28px;">
              <p style="margin:0 0 10px;font-family:${b.fontSans};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${b.muted};">${escapeHtml(input.eyebrow)}</p>
              <h1 style="margin:0 0 20px;font-family:${b.fontSerif};font-size:32px;font-weight:400;line-height:1.05;letter-spacing:-0.04em;color:${b.ink};">${escapeHtml(input.title)}</h1>
              ${paragraphs}
              ${
                metaRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px solid ${b.line};border-bottom:1px solid ${b.line};">${metaRows}</table>`
                  : ''
              }
              ${cta}
              ${footnote}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid ${b.line};background-color:${b.paper};">
              <p style="margin:0;font-family:${b.fontSans};font-size:12px;line-height:1.5;color:${b.muted};">
                <a href="${escapeAttr(origin)}" style="color:${b.cobalt};text-decoration:none;">${escapeHtml(b.product)}</a>
                · ${escapeHtml(origin.replace(/^https?:\/\//, ''))}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function renderMailText(input: {
  title: string
  paragraphs: string[]
  meta?: Array<{ label: string; value: string }>
  cta?: { label: string; href: string }
  footnote?: string
}): string {
  const lines: string[] = [mailBrand.product, '', input.title, '']
  for (const p of input.paragraphs) lines.push(p, '')
  for (const row of input.meta ?? []) {
    lines.push(`${row.label}: ${row.value}`)
  }
  if (input.meta?.length) lines.push('')
  if (input.cta) {
    lines.push(input.cta.label + ':', input.cta.href, '')
  }
  if (input.footnote) lines.push(input.footnote, '')
  lines.push(siteOrigin())
  return lines.join('\n').trim() + '\n'
}

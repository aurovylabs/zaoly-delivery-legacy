import { zaolyEmailPalette as p } from './palette'

function esc(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Body paragraph (plain text → escaped HTML). */
export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-family:${p.font};font-size:16px;line-height:1.6;color:${p.ink};">${esc(text)}</p>`
}

/** Large code / OTP panel (no links). */
export function emailCodePanel(code: string, caption?: string): string {
  const cap = caption
    ? `<p style="margin:0 0 10px 0;font-family:${p.font};font-size:12px;line-height:1.4;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;color:${p.muted};">${esc(caption)}</p>`
    : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px 0;border-collapse:collapse;">
  <tr>
    <td bgcolor="${p.codeSurface}" style="background-color:${p.codeSurface};border:1px solid ${p.codeBorder};border-left:5px solid ${p.accent};border-radius:10px;padding:18px 20px;">
      ${cap}
      <p style="margin:0;font-family:${p.mono};font-size:22px;line-height:1.35;letter-spacing:0.06em;font-weight:700;color:${p.ink};word-break:break-all;">${esc(code)}</p>
    </td>
  </tr>
</table>`
}

/** Primary CTA — omit when deliverability policy forbids the href domain. */
export function emailButton(label: string, href: string): string {
  const safeHref = esc(href)
  const safeLabel = esc(label)
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 24px 0;border-collapse:collapse;">
  <tr>
    <td bgcolor="${p.accent}" style="background-color:${p.accent};border-radius:10px;mso-padding-alt:14px 26px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" stroke="f" fillcolor="${p.accent}">
        <w:anchorlock/>
        <center style="color:${p.accentContrast};font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${safeHref}" style="display:inline-block;padding:14px 26px;font-family:${p.font};font-size:15px;font-weight:700;line-height:1.2;color:${p.accentContrast};text-decoration:none;border-radius:10px;">${safeLabel}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`
}

export function emailMetaRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${p.line};font-family:${p.font};font-size:12px;line-height:1.4;letter-spacing:0.04em;text-transform:uppercase;font-weight:700;color:${p.muted};width:34%;vertical-align:top;">${esc(label)}</td>
  <td style="padding:10px 0;border-bottom:1px solid ${p.line};font-family:${p.font};font-size:15px;line-height:1.45;color:${p.ink};vertical-align:top;">${esc(value)}</td>
</tr>`
}

export function emailMetaTable(rows: Array<{ label: string; value: string }>): string {
  if (!rows.length) return ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;border-collapse:collapse;">
  ${rows.map((r) => emailMetaRow(r.label, r.value)).join('')}
</table>`
}

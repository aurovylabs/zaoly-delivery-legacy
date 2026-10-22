/**
 * Zaoly transactional HTML email document (table + inline CSS).
 * Spec: specs/domain/zaoly-ui-email.md
 */

import { zaolyEmailPalette as p } from './palette'
import { ZAOLY_EMAIL_LOGO_MARK_URL } from './urls'

export type ZaolyEmailDocumentInput = {
  /** Product wordmark in the header, e.g. PLEXON */
  productLabel: string
  /** Visible H1 inside the card */
  title: string
  /** Inbox preview line (hidden in many clients below fold) */
  preheader?: string
  /** Already-built HTML blocks (paragraphs, code panel, button, …) */
  bodyHtml: string
  footerNote?: string
  /** Optional eyebrow above the title */
  eyebrow?: string
  /**
   * Absolute HTTPS logo URL (PNG preferred). Defaults to the shared Zaoly mark.
   * Pass empty string only to suppress (not recommended — Mimecast-safe hosts only; never *.plygrnd.tech).
   */
  logoSrc?: string
  /** Alt text for the logo image */
  logoAlt?: string
  /** Brand lockup label next to the mark (default Zaoly) */
  brandLabel?: string
}

function esc(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function logoBlock(src: string, alt: string, size: number): string {
  const safeSrc = esc(src)
  const safeAlt = esc(alt)
  return `<img src="${safeSrc}" width="${size}" height="${size}" alt="${safeAlt}" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;text-decoration:none;" />`
}

export function renderZaolyEmailDocument(input: ZaolyEmailDocumentInput): string {
  const product = esc(input.productLabel)
  const title = esc(input.title)
  const preheader = esc(input.preheader ?? '')
  const brand = esc(input.brandLabel ?? 'Zaoly')
  const footer = esc(input.footerNote ?? `${input.productLabel} · Zaoly`)
  const logoSrc =
    input.logoSrc === undefined ? ZAOLY_EMAIL_LOGO_MARK_URL : input.logoSrc.trim()
  const logoAlt = input.logoAlt ?? 'Zaoly'
  const showLogo = Boolean(logoSrc)

  const eyebrow = input.eyebrow
    ? `<p style="margin:0 0 10px 0;font-family:${p.font};font-size:11px;line-height:1.3;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:${p.accent};">${esc(input.eyebrow)}</p>`
    : ''

  const headerLogo = showLogo
    ? `<td width="48" valign="middle" style="width:48px;padding:0 14px 0 0;vertical-align:middle;">
              ${logoBlock(logoSrc, logoAlt, 40)}
            </td>`
    : ''

  const footerLogo = showLogo
    ? `<td width="28" valign="middle" style="width:28px;padding:0 10px 0 0;vertical-align:middle;">
              ${logoBlock(logoSrc, logoAlt, 22)}
            </td>`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
  <!--[if mso]><style type="text/css">table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${p.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${p.canvas}" style="border-collapse:collapse;background-color:${p.canvas};">
    <tr>
      <td align="center" style="padding:36px 16px 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background-color:${p.card};border:1px solid ${p.lineStrong};border-radius:16px;overflow:hidden;">
          <tr>
            <td bgcolor="${p.accent}" style="background-color:${p.accent};height:5px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td bgcolor="${p.headerWash}" style="background-color:${p.headerWash};padding:26px 28px 22px 28px;border-bottom:1px solid ${p.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  ${headerLogo}
                  <td valign="middle" style="vertical-align:middle;">
                    <p style="margin:0 0 2px 0;font-family:${p.font};font-size:13px;line-height:1.2;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${p.ink};">${brand}</p>
                    <p style="margin:0;font-family:${p.font};font-size:12px;line-height:1.3;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${p.muted};">${product}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              ${eyebrow}
              <h1 style="margin:0 0 8px 0;font-family:${p.font};font-size:26px;line-height:1.22;font-weight:700;color:${p.ink};">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 12px 28px;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 26px 28px;border-top:1px solid ${p.line};background-color:${p.headerWash};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  ${footerLogo}
                  <td valign="middle" style="vertical-align:middle;">
                    <p style="margin:0;font-family:${p.font};font-size:12px;line-height:1.5;color:${p.muted};">${footer}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

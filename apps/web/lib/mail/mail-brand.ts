/**
 * Zaoly CD tokens for HTML system mail (inline CSS only).
 * Spec: `specs/domain/zaoly-system-mail.md` · `zaoly-corporate-design.md`
 */
import { paths } from '../paths'

export const mailBrand = {
  paper: '#F3EEE4',
  light: '#FBF6EC',
  ink: '#1E1B17',
  muted: '#57554C',
  line: '#C9BCA1',
  cobalt: paths.brandPrimaryHex,
  acid: '#C6F24A',
  charcoal: paths.brandWarmGrayHex,
  charcoalFg: paths.brandWarmGrayContrastHex,
  white: '#FFFFFF',
  seal: '造',
  product: paths.brandLabel,
  fontSans: "Arial, Helvetica, 'Helvetica Neue', sans-serif",
  fontSerif: "Georgia, 'Times New Roman', Times, serif",
  contentWidthPx: 600,
} as const

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;')
}

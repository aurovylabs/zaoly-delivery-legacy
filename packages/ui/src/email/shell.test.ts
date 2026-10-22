import { describe, expect, it } from 'vitest'
import {
  emailButton,
  emailCodePanel,
  emailParagraph,
  zaolyEmailPalette,
  ZAOLY_EMAIL_LOGO_MARK_URL,
  renderZaolyEmailDocument,
} from './index'

describe('zaoly email shell', () => {
  it('uses brand orange accent and neutral canvas', () => {
    expect(zaolyEmailPalette.accent).toBe('#ff6a3b')
    expect(zaolyEmailPalette.canvas).toBe('#f8f6f0')
    expect(zaolyEmailPalette.card).toBe('#ffffff')
  })

  it('always embeds the Zaoly logo by default (non-plygrnd host)', () => {
    expect(ZAOLY_EMAIL_LOGO_MARK_URL).toMatch(/^https:\/\//)
    expect(ZAOLY_EMAIL_LOGO_MARK_URL).not.toMatch(/plygrnd\.tech/)
    expect(ZAOLY_EMAIL_LOGO_MARK_URL).toContain('zaoly-mark.png')
    // Public delivery only — private Origin trees are not CDN-reachable
    expect(ZAOLY_EMAIL_LOGO_MARK_URL).toContain('aurovylabs/zaoly-delivery')
    expect(ZAOLY_EMAIL_LOGO_MARK_URL).toMatch(/aurovylabs\/zaoly-delivery/)

    const html = renderZaolyEmailDocument({
      productLabel: 'PLEXON',
      title: 'Code für dein Konto',
      preheader: 'Dein Code lautet ABC',
      bodyHtml: [emailParagraph('Hallo,'), emailCodePanel('tok_abc', 'Code')].join(''),
      footerNote: 'PLEXON · Zaoly',
    })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('role="presentation"')
    expect(html).toContain('PLEXON')
    expect(html).toContain('Zaoly')
    expect(html).toContain('Code für dein Konto')
    expect(html).toContain('tok_abc')
    expect(html).toContain(zaolyEmailPalette.accent)
    expect(html).toContain(zaolyEmailPalette.canvas)
    expect(html).toContain(`src="${ZAOLY_EMAIL_LOGO_MARK_URL}"`)
    // Header + footer logos
    expect(html.split(`src="${ZAOLY_EMAIL_LOGO_MARK_URL}"`).length - 1).toBe(2)
    expect(html).not.toMatch(/plygrnd\.tech/)
  })

  it('allows suppressing or overriding the logo URL', () => {
    const none = renderZaolyEmailDocument({
      productLabel: 'PLEXON',
      title: 'T',
      bodyHtml: emailParagraph('x'),
      logoSrc: '',
    })
    expect(none).not.toContain('<img ')

    const custom = renderZaolyEmailDocument({
      productLabel: 'PLEXON',
      title: 'T',
      bodyHtml: emailParagraph('x'),
      logoSrc: 'https://cdn.example.com/mark.png',
    })
    expect(custom).toContain('src="https://cdn.example.com/mark.png"')
  })

  it('escapes user text and button hrefs', () => {
    expect(emailParagraph('A <B> & "C"')).toContain('A &lt;B&gt; &amp; &quot;C&quot;')
    expect(emailButton('Go', 'https://example.com/?a=1&b=2')).toContain(
      'href="https://example.com/?a=1&amp;b=2"'
    )
  })
})

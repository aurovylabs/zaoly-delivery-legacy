import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { aiveGotNewsPaths } from '../lib/fixtures/html-import/aive-got-news/paths'

/** Paths in `aiveGotNewsPaths` are repo-relative from creation-v3 root. */
const creationRoot = resolve(__dirname, '../../..')

function readFixture(rel: string) {
  return readFileSync(resolve(creationRoot, rel), 'utf8')
}

describe('AI\'ve Got News fixtures', () => {
  it('exposes brand + Listmonk path SSOT', () => {
    expect(aiveGotNewsPaths.brand.paper).toBe('#f8f6f0')
    expect(aiveGotNewsPaths.brand.ink).toBe('#0f172a')
    expect(aiveGotNewsPaths.brand.accent).toBe('#1f44ff')
    expect(aiveGotNewsPaths.listmonk.contentSlot).toContain('template "content"')
    expect(aiveGotNewsPaths.listmonk.messageUrlTag).toBe('{{ MessageURL }}')
    expect(aiveGotNewsPaths.listmonk.unsubscribeUrlTag).toBe('{{ UnsubscribeURL }}')
  })

  it('issue-01 is Zaoly magazine craft (sharp, type-mass, no card kit)', () => {
    const html = readFixture(aiveGotNewsPaths.issue01CreationHtml)
    expect(html).toContain('AI\'ve Got')
    expect(html).toContain('#f8f6f0')
    expect(html).toContain('#141414')
    expect(html).toContain('#1f44ff')
    expect(html).toContain('Noto Sans')
    expect(html).toContain('align-items:stretch')
    expect(html).toContain('font-size:72px')
    expect(html).toContain('font-size:132px')
    expect(html).toContain('cover-ghost')
    expect(html).toContain('band-invert')
    expect(html).toContain('pull-bar')
    expect(html).toContain('accent-rule')
    expect(html).toContain('id="human-side"')
    expect(html).toContain('id="how-everyone-uses-ai"')
    expect(html).toContain('id="always-here"')
    expect(html).toContain('Testing Claude as a CMS assistant')
    expect(html).toContain('Claude als CMS-Assistent')
    expect(html).toContain('class="lang">EN')
    expect(html).toContain('class="lang">DE')
    expect(html).toContain('id="graphic-debate"')
    expect(html).toContain('id="graphic-pipeline"')
    expect(html).toContain('viewBox="0 0 740 160"')
    expect(html).toContain('viewBox="0 0 740 110"')
    expect(html).toContain('style="width:100%;height:auto;display:block')
    expect(html).not.toContain('flex: 0 0 260px')
    expect(html).toContain('cap_1350292d44c14ed8b7278e325030e78b')
    expect(html).toContain('grid-template-columns:1fr 1fr')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('band-ghost')
    expect(html).not.toContain('border-radius:18px')
    expect(html).not.toContain('border-radius:999px')
    expect(html).not.toContain('padding: 24px 12px 64px')
    expect(html).not.toContain('align-items: center;\n      padding: 24px')
    expect(html).toContain('EU-SED-033')
    expect(html).toContain('EU-SED-035')
    expect(html).toContain('EU-SED-036')
  })

  it('listmonk template has required merge tags and one content slot', () => {
    const html = readFixture(aiveGotNewsPaths.listmonkTemplate)
    expect(html).toContain('{{ template "content" . }}')
    expect(html).toContain('{{ MessageURL }}')
    expect(html).toContain('{{ UnsubscribeURL }}')
    expect(html).toContain('{{ TrackView }}')
    expect(html.match(/\{\{\s*template "content"/g)?.length).toBe(1)
    expect(html).toContain('Always here')
    expect(html).toContain('color-scheme')
    expect(html).toContain('stack-column')
    expect(html).not.toMatch(/\{\{\s*[A-Z_]+_URL\s*\}\}/)
  })

  it('listmonk body issue-01 covers all six sections in EN+DE', () => {
    const html = readFixture(aiveGotNewsPaths.listmonkBodyIssue01)
    for (const heading of [
      'The human side',
      "What everyone's talking about",
      'Now available',
      'In the pipeline',
      'How everyone uses AI',
      'Worth reading',
    ]) {
      expect(html).toContain(heading)
    }
    expect(html).toContain('lang-label">EN')
    expect(html).toContain('lang-label">DE')
    expect(html).toContain('paste-zone')
    expect(html).toContain('What was the goal?')
    expect(html).toContain('Was war das Ziel?')
  })

  it('section pattern documents paste zones', () => {
    const html = readFixture(aiveGotNewsPaths.sectionPattern)
    expect(html).toContain('paste-zone')
    expect(html).toContain('EN')
    expect(html).toContain('DE')
    expect(html).toContain('Section heading')
  })
})

#!/usr/bin/env node
/**
 * Verify Zaoly public mail DNS (MX / SPF / DKIM / DMARC).
 * Knowledge: knowledge/zaoly-mail-dns.md
 */
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const DOMAIN = 'zaoly.app'
const VPS = '169.58.1.11'

function dig(...args) {
  try {
    return execFileSync('dig', ['+short', ...args], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function digTxt(name) {
  return dig('TXT', name)
    .split('\n')
    .map((l) => l.replace(/^"|"$/g, '').replace(/" "/g, ''))
    .filter(Boolean)
}

describe('Zaoly mail DNS', () => {
  it('A mail points at VPS', () => {
    const a = dig('A', `mail.${DOMAIN}`)
    assert.equal(a, VPS, `mail.${DOMAIN} A must be ${VPS}, got ${a || '(empty)'}`)
  })

  it('MX targets mail.zaoly.app for human inbound', () => {
    const mx = dig('MX', DOMAIN)
    assert.match(
      mx,
      /mail\.zaoly\.app\.?/i,
      `MX ${DOMAIN} must be mail.zaoly.app (IONOS cutover) — got ${mx || '(empty)'}. See knowledge/zaoly-mail-dns.md`,
    )
    assert.doesNotMatch(mx, /ionos\.de/i, 'IONOS MX leftovers must be removed')
  })

  it('SPF authorizes product MTA', () => {
    const txt = digTxt(DOMAIN).join(' ')
    assert.match(txt, /v=spf1/i)
    assert.match(txt, /a:mail\.zaoly\.app/i, `SPF must include a:mail.zaoly.app, got ${txt}`)
  })

  it('DKIM selector mail is published', () => {
    const txt = digTxt(`mail._domainkey.${DOMAIN}`).join(' ')
    assert.match(txt, /v=DKIM1/i, `DKIM missing for mail._domainkey.${DOMAIN}`)
  })

  it('DMARC is published (p=none or stronger)', () => {
    const txt = digTxt(`_dmarc.${DOMAIN}`).join(' ')
    assert.match(txt, /v=DMARC1/i, `Add TXT _dmarc.${DOMAIN} — see knowledge/zaoly-mail-dns.md`)
    assert.match(txt, /p=(none|quarantine|reject)/i)
  })
})

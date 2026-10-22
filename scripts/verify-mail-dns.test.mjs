/**
 * Smoke: verify-mail-dns script ships and documents MX + DMARC cutover.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('verify-mail-dns script', () => {
  it('exists and requires mail.zaoly.app MX + DMARC', () => {
    const p = join(root, 'scripts/verify-mail-dns.mjs')
    assert.equal(existsSync(p), true)
    const src = readFileSync(p, 'utf8')
    assert.match(src, /zaoly\.app/)
    assert.match(src, /mail\.zaoly\.app/)
    assert.match(src, /_dmarc/)
  })

  it('knowledge lists MX + DMARC to add in IONOS', () => {
    const md = readFileSync(join(root, 'knowledge/zaoly-mail-dns.md'), 'utf8')
    assert.match(md, /mail\.zaoly\.app/)
    assert.match(md, /v=DMARC1/)
    assert.match(md, /hey@zaoly\.app/)
  })
})

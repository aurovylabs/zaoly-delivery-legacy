import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../../..')

describe('client page share specs', () => {
  it('domain + api + eval separate client share from collection invite', () => {
    const domain = path.join(repoRoot, 'specs/domain/client-page-share.md')
    const api = path.join(repoRoot, 'specs/api/client-page-share.md')
    const evalDoc = path.join(repoRoot, 'knowledge/client-page-share-eval.md')
    const invite = path.join(repoRoot, 'specs/domain/editor-share-invite.md')

    expect(existsSync(domain)).toBe(true)
    expect(existsSync(api)).toBe(true)
    expect(existsSync(evalDoc)).toBe(true)

    const domainText = readFileSync(domain, 'utf8')
    expect(domainText).toContain('view-only')
    expect(domainText).toContain('crs_')
    expect(domainText).toContain('pinned_revision')
    expect(domainText).toContain('Collection-owned')

    const inviteText = readFileSync(invite, 'utf8')
    expect(inviteText).toContain('client-page-share.md')

    const evalText = readFileSync(evalDoc, 'utf8')
    expect(evalText).toContain('Figma')
    expect(evalText).toContain('Framer')
    expect(evalText).toContain('Adobe XD')
  })

  it('paths.md lists public share routes', () => {
    const paths = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(paths).toContain('/share/p/:token')
    expect(paths).toContain('client-shares')
    expect(paths).toContain('client-page-share-eval.md')
    expect(paths).toContain('api/platform/provisioning/collections')
  })

  it('P4 knowledge documents Collection panel fan-out', () => {
    const p4 = path.join(repoRoot, 'knowledge/client-page-share-p4.md')
    expect(existsSync(p4)).toBe(true)
    const text = readFileSync(p4, 'utf8')
    expect(text).toContain('P4')
    expect(text).toContain('fan-out')
  })

  it('P5 knowledge documents audit export', () => {
    const p5 = path.join(repoRoot, 'knowledge/client-page-share-p5.md')
    expect(existsSync(p5)).toBe(true)
    expect(readFileSync(p5, 'utf8')).toContain('CSV')
  })

  it('P8 knowledge documents guest→scene comment projection', () => {
    const p8 = path.join(repoRoot, 'knowledge/client-page-share-p8-scene-comments.md')
    expect(existsSync(p8)).toBe(true)
    const text = readFileSync(p8, 'utf8')
    expect(text).toContain('cmt_crs_')
    expect(text).toContain('CompositionScene.comments')
  })

  it('P9 knowledge documents designer replies on share', () => {
    const p9 = path.join(repoRoot, 'knowledge/client-page-share-p9-designer-replies.md')
    expect(existsSync(p9)).toBe(true)
    const text = readFileSync(p9, 'utf8')
    expect(text).toContain('enrichGuestCommentsFromScene')
    expect(text).toContain('mirrorProjectedThreadToShares')
    expect(text).toContain('client-share-thread')
  })
})

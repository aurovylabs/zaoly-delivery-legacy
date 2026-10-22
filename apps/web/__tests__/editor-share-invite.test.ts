/**
 * Editor share — Zaoly local members.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')

describe('editor share invite', () => {
  it('spec exists for local members', () => {
    const spec = path.join(repoRoot, 'specs/domain/editor-share-invite.md')
    expect(existsSync(spec)).toBe(true)
    const text = readFileSync(spec, 'utf8')
    expect(text).toContain('scene_members')
    expect(text).toContain('zaoly-scene-share')
  })

  it('paths expose scene members API', () => {
    expect(paths.routes.apiSceneMembers('scene-1')).toBe('/api/scenes/scene-1/members')
    expect(paths.routes.apiSceneMember('scene-1', 'u1')).toBe(
      '/api/scenes/scene-1/members/u1',
    )
    expect(paths.routes.apiSceneShareInvite('scene-1')).toBe('/api/scenes/scene-1/share-invite')
  })

  it('locales include share invite strings', () => {
    const en = readFileSync(path.join(repoRoot, 'apps/web/locales/en.json'), 'utf8')
    const de = readFileSync(path.join(repoRoot, 'apps/web/locales/de.json'), 'utf8')
    expect(en).toContain('shareInvite')
    expect(de).toContain('shareInvite')
  })
})

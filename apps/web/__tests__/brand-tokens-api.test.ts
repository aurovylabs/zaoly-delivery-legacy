import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { paths } from '../lib/paths'
import { GET, PATCH } from '../app/api/brand-tokens/route'

describe('Zaoly brand-tokens route (retired)', () => {
  it('GET returns 410 upstream_pack_out_of_scope and points at /api/tokens', async () => {
    const res = await GET()
    expect(res.status).toBe(410)
    const body = (await res.json()) as { error?: string; use?: string }
    expect(body.error).toBe('upstream_pack_out_of_scope')
    expect(body.use).toBe('/api/tokens')
  })

  it('PATCH returns 410 upstream_pack_out_of_scope', async () => {
    const res = await PATCH()
    expect(res.status).toBe(410)
    const body = (await res.json()) as { error?: string; use?: string }
    expect(body.error).toBe('upstream_pack_out_of_scope')
    expect(body.use).toBe('/api/tokens')
  })

  it('route source does not call upstream pack helpers', () => {
    const src = readFileSync(path.join(__dirname, '../app/api/brand-tokens/route.ts'), 'utf8')
    expect(src).toContain('upstreamPackOutOfScopeResponse')
    expect(src).not.toContain('resolveBrandTokenPack')
    expect(src).not.toContain('patchUpstreamToken')
  })

  it('editor workspace does not fetch brand-tokens', () => {
    const sceneState = readFileSync(
      path.join(__dirname, '../components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    const shell = readFileSync(path.join(__dirname, '../components/editor-workspace.tsx'), 'utf8')
    expect(sceneState).toContain('apiTokens')
    expect(sceneState).not.toContain('editorBrandTokensUrl')
    expect(sceneState).not.toMatch(/brandTokensUrl\(/)
    expect(shell).toContain('EditorTokenStudio')
    expect(shell).not.toContain('CollectionPicker')
    expect(shell).not.toContain('collectionBind')
  })

  it('keeps service secret env keys out of client editor modules', () => {
    const root = path.join(__dirname, '..')
    const clientFiles = [
      'components/editor-workspace.tsx',
      'components/editor/use-editor-scene-state.ts',
      'components/editor-token-studio.tsx',
      'components/editor-inspector.tsx',
    ]
    for (const rel of clientFiles) {
      const src = readFileSync(path.join(root, rel), 'utf8')
      expect(src).not.toMatch(/ZAOLY_SERVICE_SECRET/)
      expect(src).not.toMatch(/ZAOLY_SERVICE_SECRET/)
      expect(src).not.toMatch(/getServiceSecret/)
    }
  })
})

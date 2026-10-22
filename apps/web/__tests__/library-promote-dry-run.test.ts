import { describe, expect, it, vi } from 'vitest'

vi.mock('../auth', () => ({
  auth: vi.fn(async () => ({ user: { id: 'test-user' } })),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  }
})

import { EDITOR_PALETTE_GROUP_TYPES, type CompositionScene, type SceneNode } from '@zaoly/contracts'
import { dryRunLibraryPromote } from '../lib/library/promote-dry-run'
import { POST as promotePost } from '../app/api/library/promote/dry-run/route'
import { GET as healthGet } from '../app/api/health/route'
import { paths } from '../lib/paths'
import { resolveZaolyUiSource } from '../lib/runtime-config'

function sceneWith(nodes: SceneNode[]): CompositionScene {
  return {
    id: 'scene-promote',
    name: 'Promote',
    version: 1,
    platformProjectId: 'plx-collection-1',
    root: { id: 'root', type: 'Stack', children: nodes },
    updatedAt: new Date().toISOString(),
  }
}

describe('print palette ⊆ catalog ids', () => {
  it('every CREATION Print palette type is a Print* catalog id (not PrintQuickCheck)', () => {
    const print = EDITOR_PALETTE_GROUP_TYPES.print
    expect(print).toContain('PrintPage')
    expect(print).toContain('PrintChipRow')
    expect(print).toContain('PrintPersonaCard')
    expect(print).not.toContain('PrintQuickCheck')
    for (const type of print) {
      expect(type.startsWith('Print')).toBe(true)
    }
  })
})

describe('Coolify operator paths', () => {
  it('keeps the staging API base and app uuid in paths.ts', () => {
    expect(paths.coolifyApiBase).toBe('https://coolify.plygrnd.tech/api/v1')
    expect(paths.coolifyAppUuid).toBe('uk1t9tnsqo65vlpzo2vwq0u2')
    expect(paths.coolifyStorybookUuid).toBe('rtxcfh4gtxi6yba5l70fu177')
    expect(paths.creationGithubRepo).toBe('aurovylabs/zaoly-delivery')
  })
})

describe('resolveZaolyUiSource', () => {
  it('defaults to paths.zaolyUiSourceDefault matching Dockerfile pin', () => {
    const prev = process.env[paths.envZaolyUiSource]
    delete process.env[paths.envZaolyUiSource]
    expect(resolveZaolyUiSource()).toBe(paths.zaolyUiSourceDefault)
    expect(paths.zaolyUiSourceDefault).toBe('in-repo')
    if (prev != null) process.env[paths.envZaolyUiSource] = prev
  })
})

describe('GET /api/health zaolyUiSource', () => {
  it('returns the resolved library pin', async () => {
    const res = await healthGet()
    expect(res.status).toBe(200)
    const body = (await res.json()) as { zaolyUiSource?: string }
    expect(body.zaolyUiSource).toBe(resolveZaolyUiSource())
  })
})

describe('library promote dry-run', () => {
  it('P3 always rejects as dev-track and never writes git', () => {
    const result = dryRunLibraryPromote({
      kind: 'P3',
      scene: sceneWith([{ id: 'cover', type: 'PrintCover', props: { title: 'A' } }]),
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.code).toBe('dev-track')
  })

  it('P1 emits args-shaped file ops for layout props only', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'cover',
      scene: sceneWith([
        {
          id: 'cover',
          type: 'PrintCover',
          props: {
            title: 'Quick Check',
            eyebrow: 'Zaoly',
            dataSlot: 'eqc.cover',
            rows: [['secret', 1]],
          },
        },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.writesGit).toBe(false)
    expect(result.proposal.files[0]?.kind).toBe('args')
    expect(result.proposal.files[0]?.path).toBe(
      'packages/ui/src/print/PrintCover.promoted.stories.tsx',
    )
    expect(result.proposal.files[0]?.contents).toContain('export const Promoted')
    expect(result.proposal.files[0]?.args).toMatchObject({
      title: 'Quick Check',
      eyebrow: 'Zaoly',
      dataSlot: 'eqc.cover',
    })
    expect(result.proposal.files[0]?.args).not.toHaveProperty('rows')
  })

  it('P1 rejects missing node and raw hex', () => {
    const missing = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'nope',
      scene: sceneWith([{ id: 'cover', type: 'PrintCover' }]),
    })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.issues[0]?.code).toBe('missing-node')

    const hex = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'cover',
      scene: sceneWith([
        { id: 'cover', type: 'PrintCover', props: { title: 'A', color: '#1122aa' } },
      ]),
    })
    expect(hex.ok).toBe(false)
    if (!hex.ok) expect(hex.issues[0]?.code).toBe('collection-branding')
  })

  it('P1 rejects unknown types as dev-track', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'x',
      scene: sceneWith([{ id: 'x', type: 'AlienWidget' }]),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]?.code).toBe('dev-track')
  })

  it('P2 sanitizes Collection ids, live URLs, and payloads', () => {
    const result = dryRunLibraryPromote({
      kind: 'P2',
      scene: sceneWith([
        {
          id: 'page',
          type: 'PrintPage',
          props: { folioTitle: 'Deck', url: 'https://example.internal/report' },
          children: [
            {
              id: 'table',
              type: 'PrintTable',
              props: { dataSlot: 'eqc.domain.issues', rows: [['Live', 9]] },
            },
          ],
        },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.writesGit).toBe(false)
    const sanitized = result.proposal.files[0]?.sanitizedScene as CompositionScene
    expect(sanitized.platformProjectId).toBeNull()
    const page = sanitized.root.children?.[0]
    expect(page?.props).not.toHaveProperty('url')
    expect(page?.children?.[0]?.props?.dataSlot).toBe('eqc.domain.issues')
    expect(page?.children?.[0]?.props?.rows).toBeNull()
    expect(result.proposal.files[0]?.path).toBe(
      'packages/ui/src/print/PrintPromotedTemplate.stories.tsx',
    )
    expect(result.proposal.files[0]?.contents).toContain('sanitizedScene')
    expect(result.proposal.files[0]?.contents).not.toContain('plx-collection-1')
  })

  it('POST empty JSON body type-parses and rejects invalid-kind (Coolify next build)', async () => {
    const res = await promotePost(
      new Request(`http://localhost${paths.routes.apiLibraryPromoteDryRun}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { ok: boolean; issues: Array<{ code: string }> }
    expect(body.ok).toBe(false)
    expect(body.issues[0]?.code).toBe('invalid-kind')
  })

  it('POST /api/library/promote/dry-run matches paths helper', async () => {
    expect(paths.routes.apiLibraryPromoteDryRun).toBe('/api/library/promote/dry-run')
    const res = await promotePost(
      new Request(`http://localhost${paths.routes.apiLibraryPromoteDryRun}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'P1',
          nodeId: 'cover',
          scene: sceneWith([{ id: 'cover', type: 'PrintCover', props: { title: 'A' } }]),
        }),
      }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; proposal: { writesGit: boolean } }
    expect(body.ok).toBe(true)
    expect(body.proposal.writesGit).toBe(false)
  })

  it('P1 Text textAlign stays P1 because the prop is already contracted', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'copy',
      scene: sceneWith([{ id: 'copy', type: 'Text', props: { textAlign: 'right' } }]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.kind).toBe('P1')
    expect(result.proposal.files.every((f) => f.kind !== 'extend-api')).toBe(true)
    expect(result.proposal.files[0]?.args).toMatchObject({ textAlign: 'right' })
  })

  it('P1 ChatBlockPanel textAlign auto-upgrades to P4 and does not drop the field', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'panel',
      scene: sceneWith([
        { id: 'panel', type: 'ChatBlockPanel', props: { textAlign: 'right', title: 'Box' } },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.kind).toBe('P4')
    expect(result.proposal.writesGit).toBe(false)
    expect(result.proposal.files.some((f) => f.kind === 'extend-api')).toBe(true)
    expect(result.proposal.files.some((f) => f.kind === 'extend-test')).toBe(true)
    const args = result.proposal.files.find((f) => f.kind === 'args')
    expect(args?.args).toMatchObject({ textAlign: 'right', title: 'Box' })
    expect(args?.contents).toContain('"textAlign": "right"')
  })

  it('P1 ChatBlockPanel radius auto-upgrades to P4', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'panel',
      scene: sceneWith([
        { id: 'panel', type: 'ChatBlockPanel', props: { radius: '12px', title: 'Box' } },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.kind).toBe('P4')
    expect(result.proposal.files.some((f) => f.kind === 'extend-api')).toBe(true)
    const args = result.proposal.files.find((f) => f.kind === 'args')
    expect(args?.args).toMatchObject({ radius: '12px', title: 'Box' })
  })

  it('P1 clipboard ChatBlockPanel fill + pipeline stroke auto-upgrades to P4', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'chatblockpanel-msxjrkb7-1',
      scene: sceneWith([
        {
          id: 'chatblockpanel-msxjrkb7-1',
          type: 'ChatBlockPanel',
          props: {
            background: '',
            borderColor: '',
            borderWidth: '',
            borderStyle: 'dashed',
          },
          tokenBindings: {
            background: 'color.action.primary',
            borderColor: 'color.status.pipeline.category_queued',
            borderWidth: 'spacing.static.large',
          },
        },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.kind).toBe('P4')
    expect(result.proposal.files.some((f) => f.kind === 'extend-api')).toBe(true)
    const args = result.proposal.files.find((f) => f.kind === 'args')
    expect(args?.args).toMatchObject({
      background: 'var(--accent)',
      borderColor: 'var(--status-category-queued)',
      borderWidth: 'var(--space-6)',
      borderStyle: 'dashed',
    })
    expect(args?.args).not.toHaveProperty('background', '')
    expect(args?.contents).toContain('"background": "var(--accent)"')
    expect(args?.contents).toContain('"borderColor": "var(--status-category-queued)"')
    expect(args?.contents).toContain('color.status.pipeline.category_queued')
  })

  it('P1 ChatBlockPanel token fill auto-upgrades to P4 with library CSS var', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'panel',
      scene: sceneWith([
        {
          id: 'panel',
          type: 'ChatBlockPanel',
          props: { background: '', title: 'Findings' },
          tokenBindings: { background: 'color.action.accent' },
        },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.kind).toBe('P4')
    expect(result.proposal.files.some((f) => f.kind === 'extend-api')).toBe(true)
    const args = result.proposal.files.find((f) => f.kind === 'args')
    expect(args?.args).toMatchObject({ background: 'var(--accent)', title: 'Findings' })
    expect(args?.args).not.toHaveProperty('background', '')
    expect(args?.contents).toContain('"background": "var(--accent)"')
    expect(args?.contents).toContain('color.action.accent')
  })

  it('P1 ChatBlockPanel raw hex fill rejects collection-branding', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'panel',
      scene: sceneWith([
        { id: 'panel', type: 'ChatBlockPanel', props: { background: '#b8e70d' } },
      ]),
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.code).toBe('collection-branding')
  })

  it('P1 ChatBlockPanel unmapped token path rejects extend-unrepresentable', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'panel',
      scene: sceneWith([
        {
          id: 'panel',
          type: 'ChatBlockPanel',
          tokenBindings: { background: 'color.unknown.leaf' },
        },
      ]),
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.code).toBe('extend-unrepresentable')
    expect(result.issues[0]?.message).toContain('color.unknown.leaf')
  })

  it('P4 Print types reject as extend-unrepresentable', () => {
    const result = dryRunLibraryPromote({
      kind: 'P4',
      nodeId: 'donut',
      scene: sceneWith([{ id: 'donut', type: 'PrintDonut', props: { textAlign: 'right' } }]),
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.code).toBe('extend-unrepresentable')
  })
})

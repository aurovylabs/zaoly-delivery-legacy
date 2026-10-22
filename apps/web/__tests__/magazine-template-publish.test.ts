import { beforeEach, describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK } from '@zaoly/contracts'
import {
  __resetMagazineTemplateStoreForTests,
  assertPublishedImmutable,
  createMagazineTemplateDraft,
  extractSlotSchema,
  findPublishedMagazineTemplate,
  getMagazineTemplateVersion,
  publishMagazineTemplate,
  validateMagazineTemplateScene,
} from '../lib/magazine-template'
import { GET as listGet, POST as createPost } from '../app/api/magazine-templates/route'
import { POST as publishPost } from '../app/api/magazine-templates/[templateId]/publish/route'
import { GET as versionGet } from '../app/api/magazine-templates/[templateId]/versions/[version]/route'

function printableScene(partial?: Partial<CompositionScene>): CompositionScene {
  const cover: SceneNode = {
    id: 'cover',
    type: 'PrintCover',
    props: { dataSlot: 'eqc.cover' },
    children: [
      { id: 't', type: 'Text', props: { slot: 'title', children: 'Cover' } },
      {
        id: 'kpi',
        type: 'Lede',
        children: [
          { id: 'kl', type: 'Text', props: { slot: 'label', children: 'GEO' } },
          { id: 'kv', type: 'Text', props: { slot: 'value', children: '72' } },
        ],
      },
    ],
  }
  const table: SceneNode = {
    id: 'issues',
    type: 'PrintTable',
    props: {
      dataSlot: 'eqc.domain.issues',
      columns: ['Issue', 'Count'],
      rows: [['Demo', 1]],
    },
  }
  const ranked: SceneNode = {
    id: 'ranked',
    type: 'PrintRankedList',
    props: { dataSlot: 'eqc.geo.competitors' },
    children: [
      {
        id: 'row1',
        type: 'RankedRow',
        children: [{ id: 'rl', type: 'Text', props: { slot: 'label', children: 'A' } }],
      },
    ],
  }
  const personas: SceneNode = {
    id: 'personas',
    type: 'PrintPersonaGrid',
    props: { dataSlot: 'eqc.personas' },
    children: [
      {
        id: 'p1',
        type: 'PrintPersonaCard',
        children: [{ id: 'pn', type: 'Text', props: { slot: 'title', children: 'Pat' } }],
      },
    ],
  }
  const page: SceneNode = {
    id: 'page-1',
    type: 'PrintPage',
    children: [cover, table, ranked, personas],
  }
  return {
    id: 'scene-mtpl',
    name: 'EQC Mag',
    version: 1,
    platformProjectId: 'plx-collection-1',
    root: { id: 'root', type: 'Stack', children: [page] },
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

beforeEach(() => {
  __resetMagazineTemplateStoreForTests({ durable: false, wipeDisk: true })
})

describe('extractSlotSchema', () => {
  it('collects dataSlot only (not layout slot)', () => {
    const schema = extractSlotSchema(printableScene())
    expect(schema.map((s) => s.dataSlot).sort()).toEqual([
      'eqc.cover',
      'eqc.domain.issues',
      'eqc.geo.competitors',
      'eqc.personas',
    ])
    expect(schema.every((s) => s.nodeId && s.nodeType)).toBe(true)
  })
})

describe('validateMagazineTemplateScene', () => {
  it('rejects missing platformProjectId and empty print', () => {
    const missing = validateMagazineTemplateScene(
      printableScene({ platformProjectId: null }),
    )
    expect(missing.ok).toBe(false)
    if (missing.ok) return
    expect(missing.issues.some((i) => i.code === 'missing_platform_project')).toBe(true)

    const empty = validateMagazineTemplateScene(
      printableScene({
        root: { id: 'root', type: 'Stack', children: [{ id: 'b', type: 'Button' }] },
      }),
    )
    expect(empty.ok).toBe(false)
  })

  it('accepts printable Collection-scoped scene', () => {
    const ok = validateMagazineTemplateScene(printableScene())
    expect(ok.ok).toBe(true)
  })
})

describe('publish immutability', () => {
  it('publishes versions that do not change on re-read', () => {
    const draft = createMagazineTemplateDraft({
      scene: printableScene(),
      role: MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK,
    })
    const pub = publishMagazineTemplate(draft.templateId)
    expect(pub.ok).toBe(true)
    if (!pub.ok) return

    const frozen = assertPublishedImmutable(pub.template.templateId, pub.template.version)
    expect(frozen.ok).toBe(true)

    const v1 = getMagazineTemplateVersion(pub.template.templateId, 1)
    expect(v1?.sceneSnapshot.root.children?.[0]?.children?.[0]?.props?.dataSlot).toBe(
      'eqc.cover',
    )
    expect(pub.template.zaolyUiSource).toBeTruthy()

    // Second publish creates v2; v1 unchanged
    const pub2 = publishMagazineTemplate(draft.templateId, {
      scene: printableScene({ name: 'EQC Mag v2' }),
    })
    expect(pub2.ok).toBe(true)
    if (!pub2.ok) return
    expect(pub2.template.version).toBe(2)
    const stillV1 = getMagazineTemplateVersion(pub.template.templateId, 1)
    expect(stillV1?.sceneSnapshot.name).toBe('EQC Mag')
    expect(stillV1?.version).toBe(1)
  })

  it('consumer discovery returns published only', () => {
    const draft = createMagazineTemplateDraft({
      scene: printableScene(),
      role: MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK,
    })
    expect(
      findPublishedMagazineTemplate({
        platformProjectId: 'plx-collection-1',
        role: MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK,
      }),
    ).toBeNull()

    publishMagazineTemplate(draft.templateId)
    const found = findPublishedMagazineTemplate({
      platformProjectId: 'plx-collection-1',
      role: MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK,
    })
    expect(found?.status).toBe('published')
    expect(found?.version).toBe(1)
  })
})

describe('magazine-templates API', () => {
  it('returns 410 print_out_of_scope on Zaoly', async () => {
    const createRes = await createPost()
    expect(createRes.status).toBe(410)
    const pubRes = await publishPost()
    expect(pubRes.status).toBe(410)
    const verRes = await versionGet()
    expect(verRes.status).toBe(410)
    const listRes = await listGet()
    expect(listRes.status).toBe(410)
  })
})

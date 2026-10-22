import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { cloneScene, cloneSceneNodeWithNewIds } from '../lib/scene/scene-clone'
import {
  applySiteTableStructureOp,
  defaultChildForType,
  seedInsertChildTree,
} from '../lib/scene/scene-insert-defaults'
import {
  dropEdgeFromPoint,
  planPaletteDrop,
} from '../lib/scene/scene-drop-plan'
import {
  EDITOR_CLIPBOARD_KIND,
  parseEditorClipboard,
  planPasteInsert,
  serializeEditorClipboard,
} from '../lib/scene/scene-clipboard'
import {
  boxStyleFromMap,
  normalizeFlexAxis,
} from '../lib/scene/html-css-parse'
import {
  __resetSceneNodeIdSeqForTests,
  createSceneNodeId,
  findNode,
  findParent,
  findSceneNode,
  findSceneParent,
  hasAncestorType,
  isNodeOrAncestorLocked,
} from '../lib/scene/scene-tree'
import {
  defaultChildForType as defaultChildFromOps,
  parseEditorClipboard as parseClipboardFromOps,
  planPaletteDrop as planPaletteDropFromOps,
} from '../lib/scene/ops'
import { normalizeFlexAxis as normalizeFlexFromHtml } from '../lib/scene/html-to-scene'

describe('scene-tree (W5a)', () => {
  const tree: SceneNode = {
    id: 'root',
    type: 'Stack',
    children: [
      {
        id: 'a',
        type: 'Stack',
        locked: true,
        children: [{ id: 'a1', type: 'Text', props: { children: 'Hi' } }],
      },
      { id: 'b', type: 'PrintPage', children: [{ id: 'b1', type: 'PrintChip' }] },
    ],
  }

  it('finds nodes and parents', () => {
    expect(findNode(tree, 'a1')?.type).toBe('Text')
    expect(findParent(tree, 'a1')).toEqual({ parent: tree.children![0], index: 0 })
    expect(findParent(tree, 'missing')).toBeNull()
  })

  it('detects lock ancestry and PrintPage ancestry', () => {
    expect(isNodeOrAncestorLocked(tree, 'a1')).toBe(true)
    expect(isNodeOrAncestorLocked(tree, 'b1')).toBe(false)
    expect(hasAncestorType(tree, 'b1', 'PrintPage')).toBe(true)
    expect(hasAncestorType(tree, 'a1', 'PrintPage')).toBe(false)
  })

  it('mints unique ids and scene-scoped finds', () => {
    __resetSceneNodeIdSeqForTests()
    const id1 = createSceneNodeId('n')
    const id2 = createSceneNodeId('n')
    expect(id1).not.toBe(id2)
    const scene: CompositionScene = {
      id: 's1',
      name: 'S',
      version: 1,
      root: tree,
      updatedAt: '2026-09-12T00:00:00.000Z',
    }
    expect(findSceneNode(scene, 'b')?.type).toBe('PrintPage')
    expect(findSceneParent(scene, 'b1')?.index).toBe(0)
    expect(findSceneParent(scene, 'root')).toBeNull()
  })
})

describe('scene-clone (W5a)', () => {
  it('cloneScene deep-copies without sharing nested refs', () => {
    const scene: CompositionScene = {
      id: 's',
      name: 'Orig',
      version: 1,
      root: { id: 'root', type: 'Stack', props: { gap: '8px' }, children: [] },
      updatedAt: '2026-09-12T00:00:00.000Z',
    }
    const copy = cloneScene(scene)
    expect(copy).toEqual(scene)
    expect(copy).not.toBe(scene)
    expect(copy.root).not.toBe(scene.root)
    copy.name = 'Mut'
    copy.root.props = { gap: '16px' }
    expect(scene.name).toBe('Orig')
    expect(scene.root.props?.gap).toBe('8px')
  })

  it('cloneSceneNodeWithNewIds regenerates ids and preserves type/props', () => {
    __resetSceneNodeIdSeqForTests()
    const node: SceneNode = {
      id: 'old',
      type: 'Button',
      props: { variant: 'primary' },
      children: [{ id: 'old-label', type: 'Text', props: { children: 'Go' } }],
    }
    const clone = cloneSceneNodeWithNewIds(node)
    expect(clone.type).toBe('Button')
    expect(clone.id).not.toBe('old')
    expect(clone.children?.[0]?.id).not.toBe('old-label')
    expect(clone.props?.variant).toBe('primary')
    expect(clone.children?.[0]?.props?.children).toBe('Go')
  })
})

describe('scene-insert-defaults (W5b)', () => {
  it('defaultChildForType seeds Button and SiteTable trees', () => {
    __resetSceneNodeIdSeqForTests()
    const button = defaultChildForType('Button')
    expect(button.type).toBe('Button')
    expect(button.props?.variant).toBe('primary')
    expect(button.children?.[0]?.type).toBe('Text')

    const table = defaultChildForType('SiteTable')
    expect(table.type).toBe('SiteTable')
    const rows = (table.children ?? []).filter((c) => c.type === 'SiteTableRow')
    expect(rows.length).toBeGreaterThanOrEqual(2)
  })

  it('seedInsertChildTree keeps caller id and merges props', () => {
    __resetSceneNodeIdSeqForTests()
    const seeded = seedInsertChildTree({
      id: 'keep-me',
      type: 'Button',
      props: { variant: 'secondary' },
    })
    expect(seeded.id).toBe('keep-me')
    expect(seeded.type).toBe('Button')
    expect(seeded.props?.variant).toBe('secondary')
    expect(seeded.children?.[0]?.type).toBe('Text')
  })

  it('applySiteTableStructureOp adds a row', () => {
    __resetSceneNodeIdSeqForTests()
    const table = defaultChildForType('SiteTable')
    const before = (table.children ?? []).filter((c) => c.type === 'SiteTableRow').length
    const result = applySiteTableStructureOp(table, 'table_add_row')
    expect(result.ok).toBe(true)
    expect((table.children ?? []).filter((c) => c.type === 'SiteTableRow').length).toBe(before + 1)
  })

  it('ops re-exports defaultChildForType', () => {
    expect(defaultChildFromOps).toBe(defaultChildForType)
  })
})

describe('scene-drop-plan + clipboard (W5c)', () => {
  it('dropEdgeFromPoint and planPaletteDrop stay reachable via modules', () => {
    expect(dropEdgeFromPoint(true, 50, 0, 100)).toBe('into')
    const scene: CompositionScene = {
      id: 's',
      name: 'S',
      version: 1,
      root: {
        id: 'root',
        type: 'Stack',
        children: [{ id: 't', type: 'Text', props: { children: 'Hi' } }],
      },
      updatedAt: '2026-09-12T00:00:00.000Z',
    }
    const into = planPaletteDrop(scene, 'root', 'into')
    expect(into).toEqual({ ok: true, parentId: 'root', index: 1 })
  })

  it('clipboard serialize round-trips through paths kind', () => {
    const nodes = [{ id: 'n1', type: 'Text', props: { children: 'A' } }]
    const raw = serializeEditorClipboard(nodes)
    expect(raw).toContain(EDITOR_CLIPBOARD_KIND)
    expect(parseEditorClipboard(raw)?.[0]?.id).toBe('n1')
    expect(planPasteInsert({
      id: 's',
      name: 'S',
      version: 1,
      root: { id: 'root', type: 'Stack', children: [] },
      updatedAt: '2026-09-12T00:00:00.000Z',
    }, 'root')).toEqual({ ok: true, parentId: 'root', index: 0 })
  })

  it('ops re-exports planPaletteDrop and parseEditorClipboard', () => {
    expect(planPaletteDropFromOps).toBe(planPaletteDrop)
    expect(parseClipboardFromOps).toBe(parseEditorClipboard)
  })
})

describe('html-css-parse (W5d)', () => {
  it('normalizeFlexAxis and boxStyleFromMap live in html-css-parse', () => {
    expect(normalizeFlexAxis('start')).toBe('flex-start')
    const box = boxStyleFromMap({ width: '120px', height: '40px', border: '1px solid #000' })
    expect(box.width).toBe(120)
    expect(box.height).toBe(40)
    expect(box.border).toBe('1px solid #000')
  })

  it('html-to-scene re-exports CSS helpers', () => {
    expect(normalizeFlexFromHtml).toBe(normalizeFlexAxis)
  })
})

describe('editor state hooks inventory (W5e/W5g–W5p)', () => {
  it('orchestrator imports all domain editor hooks through W5p', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const src = readFileSync(
      resolve(__dirname, '../components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    for (const mod of [
      'use-editor-history',
      'use-editor-selection',
      'use-editor-persistence',
      'use-editor-integrations',
      'use-editor-structure',
      'use-editor-mutations',
      'use-editor-palette',
      'use-editor-pointer',
      'use-editor-board-nav',
      'use-editor-master-edit',
      'use-editor-node-select',
      'use-editor-context-menu',
      'use-editor-scene-sync',
    ]) {
      expect(src).toContain(`from './${mod}'`)
    }
    expect(src).not.toContain('function enterMasterEdit')
    expect(src).not.toContain('function selectNode')
    expect(src).not.toContain('function applySceneSnapshot')
    expect(src).not.toContain('function fitToActiveFrame')
  })
})

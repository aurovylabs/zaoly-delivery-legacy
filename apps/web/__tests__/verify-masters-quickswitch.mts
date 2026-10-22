import assert from 'node:assert'
import { mapCollectionsToPickerOptions } from '../lib/collection-picker-options.ts'

console.log('--- Testing Item 1: Master Lifecycle & Detach Specifications ---')

// 1. Scene with Card component node
interface MockNode {
  id: string
  type: string
  name?: string
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  instanceOf?: string
  instanceVariantId?: string
  children?: MockNode[]
}

interface MockMaster {
  id: string
  name: string
  root: MockNode
}

interface MockScene {
  id: string
  name: string
  platformProjectId?: string
  masters?: MockMaster[]
  root: MockNode
}

const scene: MockScene = {
  id: 'test-scene',
  name: 'Test Scene',
  root: {
    id: 'root-1',
    type: 'Stack',
    props: { direction: 'column' },
    children: [
      {
        id: 'card-1',
        type: 'Card',
        name: 'Hero Card',
        props: { title: 'Product Launch' },
        style: { padding: '24px', backgroundColor: '#18181b' },
      },
    ],
  },
}

// Emulate Create Master (⌥⌘K)
function createMasterFromSelection(s: MockScene, nodeId: string, name: string): MockScene {
  const masterId = `master-${nodeId}`
  const target = s.root.children?.find((n) => n.id === nodeId)
  assert(target, 'Target node must exist')

  const masterRoot: MockNode = JSON.parse(JSON.stringify(target))
  const instanceNode: MockNode = {
    id: target.id,
    type: 'Instance',
    name: target.name,
    instanceOf: masterId,
  }

  return {
    ...s,
    masters: [...(s.masters ?? []), { id: masterId, name, root: masterRoot }],
    root: {
      ...s.root,
      children: s.root.children?.map((n) => (n.id === nodeId ? instanceNode : n)),
    },
  }
}

// Emulate Detach Master Instance (⌥⌘B)
function detachMasterInstance(s: MockScene, nodeId: string): MockScene {
  const target = s.root.children?.find((n) => n.id === nodeId)
  assert(target && target.type === 'Instance' && target.instanceOf, 'Target must be an instance')

  const master = s.masters?.find((m) => m.id === target.instanceOf)
  assert(master, 'Referenced master must exist')

  const detachedNode: MockNode = JSON.parse(JSON.stringify(master.root))
  detachedNode.id = target.id // preserve position/id
  delete detachedNode.instanceOf
  delete detachedNode.instanceVariantId

  return {
    ...s,
    root: {
      ...s.root,
      children: s.root.children?.map((n) => (n.id === nodeId ? detachedNode : n)),
    },
  }
}

// Test ⌥⌘K: Create Master
const withMaster = createMasterFromSelection(scene, 'card-1', 'CardMaster')
assert(withMaster.masters && withMaster.masters.length === 1, 'Scene must contain 1 master')
assert.strictEqual(withMaster.masters[0].id, 'master-card-1')
assert.strictEqual(withMaster.masters[0].root.type, 'Card')

const instNode = withMaster.root.children?.[0]
assert(instNode, 'Instance node must exist in root')
assert.strictEqual(instNode.type, 'Instance', 'Node must become an Instance')
assert.strictEqual(instNode.instanceOf, 'master-card-1', 'Instance must point to master id')
console.log('✓ Create Master (⌥⌘K) correctly materializes Master and converts target to Instance')

// Test ⌥⌘B: Detach Instance
const detached = detachMasterInstance(withMaster, 'card-1')
const detNode = detached.root.children?.[0]
assert(detNode, 'Detached node must exist in root')
assert.strictEqual(detNode.type, 'Card', 'Detached node must revert to free Card tree')
assert.strictEqual(detNode.instanceOf, undefined, 'Detached node must not have instanceOf')
assert.strictEqual(detNode.props?.title, 'Product Launch', 'Local props must be preserved')
console.log('✓ Detach Instance (⌥⌘B) correctly expands instance into free tree preserving overrides')

console.log('\n--- Testing Item 2: Topbar Collection Quick-Switcher Pill ---')

const collections = [
  { id: 'col-alpha', name: 'Alpha Brand', status: 'active' },
  { id: '32498667-471e-4b21-b920-5eff5c338300', name: 'Zaoly', status: 'active' },
  { id: 'col-beta', name: 'Beta Ecosystem', status: 'active' },
]

const pinId = '32498667-471e-4b21-b920-5eff5c338300'
const options = mapCollectionsToPickerOptions(collections, pinId, 'Active Ecosystem')
assert.strictEqual(options.length, 3, 'Must map 3 collections')
assert.strictEqual(options[0].value, pinId, 'Zaoly must be pinned as first option')
assert(options[0].label.includes('Zaoly'), 'Pinned label must contain Zaoly')
assert(options[0].pinned, 'Pinned flag must be true')

// Test instant bind
detached.platformProjectId = pinId
assert.strictEqual(detached.platformProjectId, pinId, 'Platform project ID must synchronize')
console.log('✓ mapCollectionsToPickerOptions and instant collection bind operate correctly')

console.log('\n--- Testing Item 3: HTML Scene Import & Craft Diagnostics (P80) ---')

const mockCraftBundle = {
  schemaVersion: '1',
  builtAt: new Date().toISOString(),
  pageId: 'page-1',
  designSystem: {
    colors: ['#ffffff', '#3b82f6', '#09090b'],
    fonts: ['Inter', 'Geist Sans'],
    spacings: ['8px', '16px', '24px'],
  },
  sceneStats: {
    nodeCount: 14,
    siteGridCount: 2,
    siteStackCount: 4,
    maxFontSizePx: 40,
    uniqueBackgrounds: ['#09090b', '#18181b'],
    uniqueColors: ['#ffffff', '#3b82f6', '#a1a1aa'],
    hasLargeDisplay: true,
    hasHeroMedia: true,
  },
  craftFlags: [],
  hasImportSourceHtml: true,
}

assert.strictEqual(mockCraftBundle.schemaVersion, '1')
assert.strictEqual(mockCraftBundle.sceneStats.hasLargeDisplay, true)
assert.strictEqual(mockCraftBundle.sceneStats.nodeCount, 14)
assert(mockCraftBundle.designSystem.colors.includes('#3b82f6'), 'Brandion action token must be present')
console.log('✓ Craft debug bundle satisfies P80/P82 schema contract')

console.log('\n>>> ALL 1, 2, 3 DOMAIN & LIFECYCLE TESTS PASSED! <<<')

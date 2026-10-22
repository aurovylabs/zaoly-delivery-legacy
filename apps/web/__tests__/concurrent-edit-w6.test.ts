import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { softLockConflict } from '../lib/editor/presence-soft-lock'
import type { ScenePresenceUser } from '@zaoly/contracts'

const repoRoot = path.resolve(__dirname, '../../..')

describe('concurrent edit W6 (Presence-only)', () => {
  it('decision spec rejects CRDT merge', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/concurrent-edit-w6.md'), 'utf8')
    expect(spec).toContain('Presence-only')
    expect(spec).toContain('stale-scene')
    expect(spec).toContain('No CRDT')
    expect(spec).not.toMatch(/MUST ship CRDT/i)
    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/concurrent-edit-decision.md'),
      'utf8',
    )
    expect(knowledge).toContain('Presence-only + optimistic lock')
    expect(knowledge).toContain('No CRDT / OT merge')
    expect(knowledge).toContain('keep local draft')
    expect(spec).toContain('keep the local draft')
  })

  it('soft-lock gates structural and leaf ops on peer selection', () => {
    const peers: ScenePresenceUser[] = [
      {
        userId: 'u2',
        name: 'Alex',
        color: '#abc',
        pageId: 'page-1',
        selectedIds: ['n1'],
        isIdle: false,
        lastSeenAt: new Date().toISOString(),
      },
    ]
    expect(
      softLockConflict([{ op: 'remove_node', nodeId: 'n1' }], peers),
    ).toMatch(/Soft-lock/)
    expect(
      softLockConflict([{ op: 'set_prop', nodeId: 'n1', key: 'x', value: 1 }], peers),
    ).toMatch(/Soft-lock/)
    expect(
      softLockConflict([{ op: 'set_flags', nodeId: 'n1', hidden: true }], peers),
    ).toMatch(/Soft-lock/)
    expect(
      softLockConflict([{ op: 'set_prop', nodeId: 'other', key: 'x', value: 1 }], peers),
    ).toBeNull()
  })
})

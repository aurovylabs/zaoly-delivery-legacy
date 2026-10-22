import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasMultiplayerCursors } from '../components/canvas-multiplayer-cursors'
import { TopbarPresenceStack } from '../components/topbar-presence-stack'
import { PresenceActivityRibbon } from '../components/presence-activity-ribbon'
import { buildPresenceActivityChips } from '../lib/editor/presence-activity'
import {
  peerHaloLockLabel,
  softLockSelectionPreview,
} from '../lib/editor/presence-soft-lock-preview'
import type { ScenePresenceUser } from '@zaoly/contracts'

const peers: ScenePresenceUser[] = [
  {
    userId: 'local',
    name: 'Me',
    color: '#111',
    pageId: 'page-home',
    selectedIds: [],
    isIdle: false,
    lastSeenAt: new Date().toISOString(),
  },
  {
    userId: 'peer-1',
    name: 'Alex',
    color: '#0d9488',
    pageId: 'page-home',
    cursor: { x: 40, y: 60, pageId: 'page-home', lastActiveAt: new Date().toISOString() },
    selectedIds: ['n1'],
    viewport: { zoom: 1, panX: 0, panY: 0 },
    isIdle: false,
    lastSeenAt: new Date().toISOString(),
  },
]

describe('presence UI smoke (P114)', () => {
  it('mounts remote cursors and hides local user', () => {
    render(
      <CanvasMultiplayerCursors
        users={peers}
        localUserId="local"
        activePageId="page-home"
        zoom={1}
        panX={0}
        panY={0}
      />,
    )
    expect(screen.getByTestId('creation-multiplayer-cursors')).toBeTruthy()
    expect(screen.getByTestId('creation-peer-cursor').textContent).toContain('Alex')
  })

  it('invokes follow callback from topbar stack', () => {
    const onFollow = vi.fn()
    render(
      <TopbarPresenceStack users={peers} localUserId="local" onFollowUser={onFollow} />,
    )
    fireEvent.click(screen.getByTitle(/Click to follow Alex/))
    expect(onFollow).toHaveBeenCalledWith(expect.objectContaining({ userId: 'peer-1' }))
  })

  it('shows Following name with Stop control', () => {
    const onClear = vi.fn()
    render(
      <TopbarPresenceStack
        users={peers}
        localUserId="local"
        followingUserId="peer-1"
        onClearFollow={onClear}
      />,
    )
    expect(screen.getByTestId('editor-presence-following').textContent).toMatch(/Following Alex/)
    fireEvent.click(screen.getByTestId('editor-presence-follow-stop'))
    expect(onClear).toHaveBeenCalled()
  })

  it('renders activity chips for remote peers', () => {
    const chips = buildPresenceActivityChips(peers, 'local')
    expect(chips).toHaveLength(1)
    expect(chips[0].label).toMatch(/Alex/)
    render(<PresenceActivityRibbon chips={chips} />)
    expect(screen.getByTestId('presence-activity-ribbon')).toBeTruthy()
    expect(screen.getByTestId('presence-activity-chip').textContent).toMatch(/Alex/)
  })

  it('soft-lock message mentions collaborator', async () => {
    const { softLockConflict } = await import('../lib/editor/presence-soft-lock')
    const msg = softLockConflict(
      [{ op: 'remove_node', nodeId: 'n1' }],
      [
        {
          userId: 'peer-1',
          name: 'Alex',
          color: '#0d9488',
          pageId: 'page-home',
          selectedIds: ['n1'],
          isIdle: false,
          lastSeenAt: new Date().toISOString(),
        },
      ],
    )
    expect(msg).toMatch(/Soft-lock/)
    expect(msg).toMatch(/Alex/)
  })

  it('soft-lock selection preview and lock label', () => {
    expect(peerHaloLockLabel('Alex')).toBe('Locked · Alex')
    const preview = softLockSelectionPreview(['n1'], [
      {
        userId: 'peer-1',
        name: 'Alex',
        color: '#0d9488',
        pageId: 'page-home',
        selectedIds: ['n1'],
        isIdle: false,
        lastSeenAt: new Date().toISOString(),
      },
    ])
    expect(preview).toMatch(/Soft-lock preview/)
    expect(preview).toMatch(/Alex/)
  })

  it('applies peer cursor positions via transform (rAF path)', () => {
    render(
      <CanvasMultiplayerCursors
        users={peers}
        localUserId="local"
        activePageId="page-home"
        zoom={2}
        panX={10}
        panY={20}
      />,
    )
    const cursor = screen.getByTestId('creation-peer-cursor')
    expect(cursor.getAttribute('data-transform-cursor')).toBe('true')
    expect(cursor.style.transform).toContain('translate3d')
  })
})

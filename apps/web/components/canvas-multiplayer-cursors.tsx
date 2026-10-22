'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import type { ScenePresenceUser } from '@zaoly/contracts'

interface CanvasMultiplayerCursorsProps {
  users: ScenePresenceUser[]
  localUserId?: string
  activePageId?: string
  zoom?: number
  panX?: number
  panY?: number
}

const IDLE_FADE_MS = 10_000

/**
 * Membership via React; cursor positions apply once per frame via rAF + translate3d.
 */
export function CanvasMultiplayerCursors({
  users,
  localUserId,
  activePageId,
  zoom = 1,
  panX = 0,
  panY = 0,
}: CanvasMultiplayerCursorsProps) {
  const nodeRefs = useRef(new Map<string, HTMLDivElement>())
  const rafRef = useRef<number | null>(null)
  const latestRef = useRef({ users, localUserId, activePageId, zoom, panX, panY })
  latestRef.current = { users, localUserId, activePageId, zoom, panX, panY }

  const remoteUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.userId !== localUserId &&
          (!activePageId || !u.pageId || u.pageId === activePageId) &&
          u.cursor,
      ),
    [users, localUserId, activePageId],
  )

  const membershipKey = remoteUsers
    .map((u) => `${u.userId}:${u.name}:${u.color || ''}:${u.isIdle ? 1 : 0}`)
    .join('|')

  useEffect(() => {
    const flush = () => {
      rafRef.current = null
      const snap = latestRef.current
      const now = Date.now()
      for (const user of snap.users) {
        if (user.userId === snap.localUserId) continue
        if (snap.activePageId && user.pageId && user.pageId !== snap.activePageId) continue
        if (!user.cursor) continue
        const el = nodeRefs.current.get(user.userId)
        if (!el) continue
        const screenX = user.cursor.x * snap.zoom + snap.panX
        const screenY = user.cursor.y * snap.zoom + snap.panY
        const lastActive = new Date(user.cursor.lastActiveAt || user.lastSeenAt).getTime()
        const faded =
          (!Number.isNaN(lastActive) && now - lastActive > IDLE_FADE_MS) || Boolean(user.isIdle)
        el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`
        el.style.opacity = faded ? '0.35' : '1'
      }
    }

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(flush)

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [users, localUserId, activePageId, zoom, panX, panY, membershipKey])

  if (remoteUsers.length === 0) return null

  const now = Date.now()

  return (
    <div
      className="creation-multiplayer-cursors-layer"
      data-testid="creation-multiplayer-cursors"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    >
      {remoteUsers.map((user) => {
        const cursor = user.cursor!
        const lastActive = new Date(cursor.lastActiveAt || user.lastSeenAt).getTime()
        const faded =
          (!Number.isNaN(lastActive) && now - lastActive > IDLE_FADE_MS) || Boolean(user.isIdle)

        return (
          <div
            key={user.userId}
            ref={(el) => {
              if (el) nodeRefs.current.set(user.userId, el)
              else nodeRefs.current.delete(user.userId)
            }}
            className="creation-peer-cursor"
            data-testid="creation-peer-cursor"
            data-transform-cursor="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              willChange: 'transform',
              transition: 'opacity 200ms ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              pointerEvents: 'none',
              opacity: faded ? 0.35 : 1,
              transform: `translate3d(${cursor.x * zoom + panX}px, ${cursor.y * zoom + panY}px, 0)`,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                transform: 'translate(-2px, -2px)',
              }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={user.color || '#0d9488'}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </svg>

            <div
              style={{
                backgroundColor: user.color || '#0d9488',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                marginTop: '2px',
                marginLeft: '12px',
              }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

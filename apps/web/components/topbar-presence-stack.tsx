'use client'

import React from 'react'
import type { ScenePresenceUser } from '@zaoly/contracts'

interface TopbarPresenceStackProps {
  users: ScenePresenceUser[]
  localUserId?: string
  followingUserId?: string | null
  onFollowUser?: (user: ScenePresenceUser) => void
  onClearFollow?: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function TopbarPresenceStack({
  users,
  localUserId,
  followingUserId,
  onFollowUser,
  onClearFollow,
}: TopbarPresenceStackProps) {
  const activePeers = users.filter((u) => u.userId !== localUserId)
  if (activePeers.length === 0) return null

  const following = followingUserId
    ? activePeers.find((u) => u.userId === followingUserId)
    : undefined

  return (
    <div
      className="creation-topbar-presence"
      data-testid="topbar-presence-stack"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginRight: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {activePeers.slice(0, 4).map((user, idx) => {
          const isFollowed = user.userId === followingUserId
          return (
            <button
              key={user.userId}
              type="button"
              onClick={() => onFollowUser?.(user)}
              title={`Click to follow ${user.name}${user.isIdle ? ' (Idle)' : ''}`}
              data-following={isFollowed ? 'true' : undefined}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: user.color || '#8b5cf6',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isFollowed ? '2px solid #fafafa' : '2px solid #18181b',
                boxShadow: isFollowed ? `0 0 0 2px ${user.color || '#8b5cf6'}` : undefined,
                marginLeft: idx > 0 ? '-6px' : '0',
                cursor: 'pointer',
                opacity: user.isIdle ? 0.6 : 1,
                transition: 'transform 120ms ease, box-shadow 160ms ease',
                padding: 0,
                transform: isFollowed ? 'scale(1.08)' : undefined,
                zIndex: isFollowed ? 2 : 1,
              }}
            >
              {getInitials(user.name)}
            </button>
          )
        })}

        {activePeers.length > 4 && (
          <span
            style={{
              fontSize: '10px',
              color: '#a1a1aa',
              marginLeft: '4px',
              fontWeight: 600,
            }}
          >
            +{activePeers.length - 4}
          </span>
        )}
      </div>

      {following ? (
        <span
          data-testid="editor-presence-following"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted, #71717a)',
            whiteSpace: 'nowrap',
          }}
        >
          Following {following.name}
          <button
            type="button"
            data-testid="editor-presence-follow-stop"
            onClick={() => onClearFollow?.()}
            style={{
              fontSize: 10,
              fontWeight: 700,
              border: '1px solid var(--line, #3f3f46)',
              background: 'var(--surface-2, #27272a)',
              color: 'var(--fg, #fafafa)',
              borderRadius: 4,
              padding: '1px 6px',
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
        </span>
      ) : null}
    </div>
  )
}

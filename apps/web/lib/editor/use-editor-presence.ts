'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { ScenePresenceUser } from '@zaoly/contracts'
import { paths } from '../paths'
import { presenceColorForUserId } from './presence-color'
import {
  createThrottle,
  cursorThrottleMsForPeerCount,
  LIVENESS_HIDDEN_MS,
  LIVENESS_VISIBLE_MS,
  shouldSendCursorHeartbeat,
} from './presence-throttle'
import { mergePresenceUsers } from './presence-merge'
import {
  setSoftLockPeers,
  syncPeerPresenceFromUsers,
} from './peer-presence-store'

function apiUrl(path: string): string {
  if (typeof window === 'undefined') return path
  try {
    return new URL(path, window.location.origin).toString()
  } catch {
    return path
  }
}

const IDLE_MS = 60_000

export type PresenceViewport = {
  zoom: number
  panX: number
  panY: number
}

type UseEditorPresenceArgs = {
  sceneId: string
  pageId: string
  selectedIds: readonly string[]
  viewport: PresenceViewport
  viewportRef: RefObject<HTMLElement | null>
  displayName?: string
}

export type UseEditorPresenceResult = {
  users: ScenePresenceUser[]
  localUserId: string | undefined
  followingUserId: string | null
  followUser: (user: ScenePresenceUser) => void
  clearFollow: () => void
  reportPointerFromClient: (clientX: number, clientY: number) => void
  noteLocalViewportGesture: () => void
}

export function useEditorPresence({
  sceneId,
  pageId,
  selectedIds,
  viewport,
  viewportRef,
  displayName = 'Collaborator',
}: UseEditorPresenceArgs): UseEditorPresenceResult {
  const [users, setUsers] = useState<ScenePresenceUser[]>([])
  const [followingUserId, setFollowingUserId] = useState<string | null>(null)
  const [localUserId, setLocalUserId] = useState<string | undefined>(undefined)
  const localUserIdRef = useRef<string | undefined>(undefined)
  localUserIdRef.current = localUserId

  const cursorRef = useRef<{ x: number; y: number; pageId: string } | null>(null)
  const viewportSnapRef = useRef(viewport)
  viewportSnapRef.current = viewport
  const pageIdRef = useRef(pageId)
  pageIdRef.current = pageId
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const lastActivityRef = useRef(Date.now())
  const followingRef = useRef<string | null>(null)
  followingRef.current = followingUserId
  const nameRef = useRef(displayName)
  nameRef.current = displayName
  const visibleRef = useRef(
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  )
  const throttleCursor = useRef(createThrottle(cursorThrottleMsForPeerCount(0)))
  const usersRef = useRef<ScenePresenceUser[]>([])
  usersRef.current = users

  const applyUsers = useCallback((next: ScenePresenceUser[], selfUserId?: string) => {
    if (selfUserId) {
      localUserIdRef.current = selfUserId
      setLocalUserId(selfUserId)
    }
    const localId = selfUserId ?? localUserIdRef.current
    usersRef.current = next
    setUsers(next)
    syncPeerPresenceFromUsers(next, localId)
    setSoftLockPeers(next, localId)
    const remoteCount = next.filter((u) => u.userId !== localId).length
    throttleCursor.current.setIntervalMs(cursorThrottleMsForPeerCount(remoteCount))
  }, [])

  const sendHeartbeat = useCallback(
    async (opts?: { beacon?: boolean; forceIdle?: boolean }) => {
      if (!sceneId) return
      const now = new Date().toISOString()
      const visibilityPaused = !visibleRef.current
      const idle =
        opts?.forceIdle === true ||
        visibilityPaused ||
        Date.now() - lastActivityRef.current > IDLE_MS
      const body = {
        name: nameRef.current,
        color: localUserIdRef.current
          ? presenceColorForUserId(localUserIdRef.current)
          : '#0d9488',
        pageId: pageIdRef.current,
        selectedIds: [...selectedIdsRef.current],
        viewport: viewportSnapRef.current,
        cursor: cursorRef.current
          ? {
              x: cursorRef.current.x,
              y: cursorRef.current.y,
              pageId: cursorRef.current.pageId,
              lastActiveAt: now,
            }
          : undefined,
        isIdle: idle,
      }

      if (opts?.beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
        navigator.sendBeacon(apiUrl(paths.routes.apiScenePresenceHeartbeat(sceneId)), blob)
        return
      }

      try {
        const res = await fetch(apiUrl(paths.routes.apiScenePresenceHeartbeat(sceneId)), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,
        })
        if (!res.ok) return
        const data = (await res.json()) as {
          users?: ScenePresenceUser[]
          selfUserId?: string
        }
        if (Array.isArray(data.users)) applyUsers(data.users, data.selfUserId)
      } catch {
        // ignore transient network errors / offline tests
      }
    },
    [sceneId, applyUsers],
  )

  const reportPointerFromClient = useCallback(
    (clientX: number, clientY: number) => {
      if (!shouldSendCursorHeartbeat(visibleRef.current)) return
      lastActivityRef.current = Date.now()
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const { zoom, panX, panY } = viewportSnapRef.current
      const x = (clientX - rect.left - panX) / zoom
      const y = (clientY - rect.top - panY) / zoom
      cursorRef.current = { x, y, pageId: pageIdRef.current }
      throttleCursor.current(() => {
        void sendHeartbeat()
      })
    },
    [viewportRef, sendHeartbeat],
  )

  const noteLocalViewportGesture = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (followingRef.current) setFollowingUserId(null)
  }, [])

  const followUser = useCallback((user: ScenePresenceUser) => {
    setFollowingUserId(user.userId)
  }, [])

  const clearFollow = useCallback(() => {
    setFollowingUserId(null)
  }, [])

  useEffect(() => {
    if (!visibleRef.current) return
    lastActivityRef.current = Date.now()
    void sendHeartbeat()
  }, [sceneId, pageId, selectedIds, sendHeartbeat])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const syncVisibility = () => {
      const next = document.visibilityState !== 'hidden'
      const wasVisible = visibleRef.current
      visibleRef.current = next
      if (next && !wasVisible) {
        lastActivityRef.current = Date.now()
        void sendHeartbeat()
      } else if (!next && wasVisible) {
        void sendHeartbeat({ forceIdle: true })
      }
    }
    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    return () => document.removeEventListener('visibilitychange', syncVisibility)
  }, [sendHeartbeat])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const schedule = () => {
      if (cancelled) return
      const delay = visibleRef.current ? LIVENESS_VISIBLE_MS : LIVENESS_HIDDEN_MS
      timer = setTimeout(() => {
        if (cancelled) return
        void sendHeartbeat({ forceIdle: !visibleRef.current })
        schedule()
      }, delay)
    }
    schedule()

    const onVis = () => {
      if (timer) clearTimeout(timer)
      schedule()
    }
    document.addEventListener?.('visibilitychange', onVis)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener?.('visibilitychange', onVis)
    }
  }, [sendHeartbeat])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return
    const source = new EventSource(apiUrl(paths.routes.apiSceneEvents(sceneId)))
    const onPresence = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          sceneId?: string
          mode?: 'snapshot' | 'delta'
          users?: ScenePresenceUser[]
          upserts?: ScenePresenceUser[]
          removedUserIds?: string[]
        }
        if (payload.type !== 'presence-updated') return
        if (payload.sceneId !== sceneId) return
        const merged = mergePresenceUsers(usersRef.current, {
          mode: payload.mode,
          users: payload.users,
          upserts: payload.upserts,
          removedUserIds: payload.removedUserIds,
        })
        applyUsers(merged)
      } catch {
        // ignore malformed frames
      }
    }
    source.addEventListener('presence-updated', onPresence as EventListener)
    return () => {
      source.removeEventListener('presence-updated', onPresence as EventListener)
      source.close()
    }
  }, [sceneId, applyUsers])

  useEffect(() => {
    const leave = () => {
      try {
        void fetch(apiUrl(paths.routes.apiScenePresence(sceneId)), {
          method: 'DELETE',
          keepalive: true,
        }).catch(() => {})
      } catch {
        // jsdom / offline
      }
    }
    window.addEventListener('pagehide', leave)
    return () => {
      window.removeEventListener('pagehide', leave)
    }
  }, [sceneId])

  return {
    users,
    localUserId,
    followingUserId,
    followUser,
    clearFollow,
    reportPointerFromClient,
    noteLocalViewportGesture,
  }
}

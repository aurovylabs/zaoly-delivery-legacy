'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Dialog, Field, Input, Text, ToggleGroup } from '@zaoly/ui'
import { paths } from '../lib/paths'

type Member = {
  userId: string
  email: string
  name: string | null
  role: 'editor' | 'viewer'
  createdAt: string
}

export function EditorSceneShareDialog({
  open,
  sceneId,
  onClose,
}: {
  open: boolean
  sceneId: string
  onClose: () => void
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!open) return
    setError(null)
    const res = await fetch(paths.routes.apiSceneMembers(sceneId))
    const data = (await res.json()) as {
      error?: string
      ownerUserId?: string | null
      members?: Member[]
    }
    if (!res.ok) {
      setError(data.error || 'load_failed')
      return
    }
    setOwnerUserId(data.ownerUserId ?? null)
    setMembers(data.members ?? [])
  }, [open, sceneId])

  useEffect(() => {
    void load()
  }, [load])

  async function addMember() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiSceneMembers(sceneId), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = (await res.json()) as { error?: string; members?: Member[] }
      if (!res.ok) throw new Error(data.error || 'add_failed')
      setMembers(data.members ?? [])
      setEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'add_failed')
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(userId: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiSceneMember(sceneId, userId), {
        method: 'DELETE',
      })
      const data = (await res.json()) as { error?: string; members?: Member[] }
      if (!res.ok) throw new Error(data.error || 'remove_failed')
      setMembers(data.members ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'remove_failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share composition">
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ownerUserId ? (
          <Text role="meta" as="p">
            Owner: {ownerUserId}
          </Text>
        ) : null}
        {error ? (
          <p role="alert" style={{ color: 'var(--zaoly-danger, #c00)' }}>
            {error}
          </p>
        ) : null}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}>
          {members.map((m) => (
            <li
              key={m.userId}
              style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}
            >
              <span>
                {m.name || m.email} · {m.role}
              </span>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void removeMember(m.userId)}>
                Remove
              </Button>
            </li>
          ))}
          {members.length === 0 ? (
            <Text role="meta" as="p">
              No members yet.
            </Text>
          ) : null}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void addMember()
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'end' }}
        >
          <Field label="Email" size="sm">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              block
            />
          </Field>
          <ToggleGroup
            aria-label="Member role"
            value={role}
            onChange={(v) => setRole(v === 'viewer' ? 'viewer' : 'editor')}
            options={[
              { value: 'editor', label: 'Editor' },
              { value: 'viewer', label: 'Viewer' },
            ]}
          />
          <Button type="submit" variant="primary" disabled={busy || !email.trim()}>
            Add
          </Button>
        </form>
      </div>
    </Dialog>
  )
}

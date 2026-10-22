'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Field, Input, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../../../lib/paths'
import { AuthScreenLayout } from '../../../components/auth-screen-layout'

export function InviteAcceptClient({ token }: { token: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiInvitesAccept, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, name: name.trim() || undefined }),
      })
      const data = (await res.json()) as { error?: string; email?: string }
      if (!res.ok) throw new Error(data.error || 'accept_failed')
      const login = await signIn('credentials', {
        email: data.email,
        password,
        redirect: false,
      })
      if (login?.error) throw new Error('login_failed')
      router.replace(paths.routes.home)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreenLayout>
      <Panel>
        <SectionChrome title="Accept invite" meta={paths.brandLabel} />
        <Text role="body">Set your name and password to join Zaoly.</Text>
        {error ? (
          <p role="alert" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        ) : null}
        <form onSubmit={onSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          <Field label="Name" size="md">
            <Input value={name} onChange={(e) => setName(e.target.value)} block />
          </Field>
          <Field label="Password" size="md">
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
              block
            />
          </Field>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '…' : 'Create account'}
          </Button>
        </form>
      </Panel>
    </AuthScreenLayout>
  )
}

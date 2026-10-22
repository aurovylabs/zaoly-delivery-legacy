'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectDetail, UpdateProjectInput } from '@zaoly/contracts'
import { Alert, Button, Dialog, Field, Input, Textarea } from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

export type ProjectEditSeed = {
  id: string
  name: string
  description?: string
}

export function ProjectEditDialog({
  open,
  onClose,
  project,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  project: ProjectEditSeed | null
  onSaved?: (project: ProjectDetail) => void
}) {
  const { t } = useUserPrefs()
  const router = useRouter()
  const formId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !project) return
    let cancelled = false

    async function load() {
      setError(null)
      setName(project!.name)
      if (typeof project!.description === 'string') {
        setDescription(project!.description)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(paths.routes.apiProject(project!.id))
        if (!res.ok) {
          throw new Error(t('projects.editLoadFailed', { status: String(res.status) }))
        }
        const detail = (await res.json()) as ProjectDetail
        if (cancelled) return
        setName(detail.name)
        setDescription(detail.description ?? '')
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : t('projects.editLoadFailedGeneric'),
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, project, t])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!project || !name.trim()) {
      setError(t('projects.editNameRequired'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body: UpdateProjectInput = {
        name: name.trim(),
        description: description.trim(),
      }
      const res = await fetch(paths.routes.apiProject(project.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(
          err?.error
            ? t('projects.editFailed', { status: err.error })
            : t('projects.editFailed', { status: String(res.status) }),
        )
      }
      const saved = (await res.json()) as ProjectDetail
      onSaved?.(saved)
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.editFailedGeneric'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose()
      }}
      title={t('projects.editTitle')}
      actions={
        <>
          <Button type="button" variant="ghost" size="md" disabled={saving} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="md"
            disabled={saving || loading || !name.trim()}
          >
            {saving ? t('projects.editSaving') : t('common.save')}
          </Button>
        </>
      }
    >
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <form id={formId} onSubmit={(e) => void onSave(e)} className="creation-projects-create">
          <Field label={t('projects.nameLabel')} htmlFor={`${formId}-name`}>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              block
              autoFocus
              disabled={saving}
            />
          </Field>
          <Field label={t('projects.descriptionLabel')} htmlFor={`${formId}-description`}>
            <Textarea
              id={`${formId}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              block
              disabled={saving}
            />
          </Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
        </form>
      )}
    </Dialog>
  )
}

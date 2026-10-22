'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert, Button, EmptyState, Panel, SectionChrome, Text } from '@zaoly/ui'
import type { CompositionScene, CompositionSummary, ProjectDetail } from '@zaoly/contracts'
import { ProjectEditDialog } from './project-edit-dialog'
import { ProjectTeamPanel } from './project-team-panel'
import { createBlankScene } from '../lib/scene/blank-scene'
import { compositionEditorHref } from '../lib/scene/scene-summary'
import { ConfirmDialog } from '../lib/zaoly-ui-client'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

function inAppEditorHref(platformProjectId: string): string {
  const q = new URLSearchParams()
  const id = platformProjectId.trim()
  if (id) q.set('platformProjectId', id)
  const qs = q.toString()
  return qs ? `${paths.routes.editor}?${qs}` : paths.routes.editor
}

export function ProjectDetailPanel({
  project,
  compositions,
  inAppEditor = false,
}: {
  project: ProjectDetail
  compositions: CompositionSummary[]
  inAppEditor?: boolean
}) {
  const { t } = useUserPrefs()
  const router = useRouter()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [displayProject, setDisplayProject] = useState(project)

  useEffect(() => {
    setDisplayProject(project)
  }, [project])

  async function confirmArchive() {
    setArchiving(true)
    setArchiveError(null)
    try {
      const res = await fetch(paths.routes.apiProjectArchive(displayProject.id), {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error(t('projects.archiveFailed', { status: String(res.status) }))
      }
      setArchiveOpen(false)
      router.push(paths.routes.projects)
      router.refresh()
    } catch (err) {
      setArchiveError(
        err instanceof Error ? err.message : t('projects.archiveFailedGeneric'),
      )
    } finally {
      setArchiving(false)
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!displayProject.platformProjectId.trim()) {
      setError(t('compositions.createNeedsProject'))
      return
    }
    setCreating(true)
    setError(null)
    try {
      const blank = createBlankScene({
        name,
        platformProjectId: displayProject.platformProjectId,
      })
      const res = await fetch(paths.routes.apiScenes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blank),
      })
      if (!res.ok) {
        setError(t('compositions.createFailed', { status: String(res.status) }))
        return
      }
      const body = (await res.json()) as { scene?: CompositionScene }
      const scene = body.scene
      if (!scene?.id) {
        setError(t('compositions.createFailed', { status: 'invalid' }))
        return
      }
      setName('')
      router.push(compositionEditorHref(scene))
      router.refresh()
    } catch {
      setError(t('compositions.createFailed', { status: 'network' }))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="creation-magazine">
      <Panel>
        <SectionChrome title={displayProject.name} meta={displayProject.capabilityStatus} />
        <Text>{displayProject.description || t('projects.noDescription')}</Text>
        <Text role="meta" as="p">
          {t('projects.platformIdLabel')}: {displayProject.platformProjectId}
        </Text>
        <div className="creation-projects-actions">
          <Link href={paths.routes.projects}>
            <Button variant="ghost">{t('projects.backToList')}</Button>
          </Link>
          <Button type="button" variant="ghost" onClick={() => setEditOpen(true)}>
            {t('projects.edit')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setArchiveError(null)
              setArchiveOpen(true)
            }}
          >
            {t('projects.archiveConfirm')}
          </Button>
          {inAppEditor ? (
            <Link href={inAppEditorHref(displayProject.platformProjectId)}>
              <Button type="button">{t('pages.compositions.openInApp')}</Button>
            </Link>
          ) : (
            <Text role="meta" as="p">
              {t('pages.compositions.inAppOffHint', { env: paths.envEditorInApp })}
            </Text>
          )}
        </div>
      </Panel>

      <ProjectTeamPanel
        projectId={displayProject.id}
        platformProjectId={displayProject.platformProjectId}
      />

      <Panel>
        <SectionChrome
          title={t('projects.compositionsTitle')}
          meta={t('projects.compositionsMeta', { count: String(compositions.length) })}
        />
        {inAppEditor ? (
          <form onSubmit={(e) => void onCreate(e)} className="creation-projects-create">
            <label>
              <Text role="meta" as="span">
                {t('compositions.nameLabel')}
              </Text>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                disabled={creating}
              />
            </label>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? t('compositions.creating') : t('compositions.create')}
            </Button>
            {error ? (
              <Text role="meta" as="p">
                {error}
              </Text>
            ) : null}
          </form>
        ) : null}
        {compositions.length === 0 ? (
          <EmptyState>{t('projects.compositionsEmpty')}</EmptyState>
        ) : (
          <ul className="creation-projects-list">
            {compositions.map((comp) => (
              <li key={comp.id}>
                <Panel>
                  <Text role="headline" as="h3">
                    {comp.name}
                  </Text>
                  <Text role="meta" as="p">
                    {comp.updatedAt}
                  </Text>
                  <div className="creation-projects-actions">
                    {inAppEditor ? (
                      <Link href={compositionEditorHref(comp)}>
                        <Button type="button">{t('pages.compositions.openInApp')}</Button>
                      </Link>
                    ) : null}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ProjectEditDialog
        open={editOpen}
        project={{
          id: displayProject.id,
          name: displayProject.name,
          description: displayProject.description,
        }}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => {
          setDisplayProject(saved)
          setEditOpen(false)
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => {
          if (!archiving) setArchiveOpen(false)
        }}
        onConfirm={() => {
          void confirmArchive()
        }}
        title={t('projects.archiveTitle')}
        confirmLabel={archiving ? t('projects.archiving') : t('projects.archiveConfirm')}
        danger
      >
        {t('projects.archiveBody', { name: displayProject.name })}
        {archiveError ? <Alert tone="error">{archiveError}</Alert> : null}
      </ConfirmDialog>
    </div>
  )
}

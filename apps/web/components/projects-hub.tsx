'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  buttonClassName,
  CardActions,
  CollectionHubCard,
  CollectionHubMetric,
  HubIndexLayoutSwitch,
  Panel,
  SectionChrome,
  Text,
  type HubIndexLayout,
} from '../lib/zaoly-ui'
import type { CapabilitySyncStatus, ProjectSummary } from '@zaoly/contracts'
import { ProjectEditDialog, type ProjectEditSeed } from './project-edit-dialog'
import { ConfirmDialog } from '../lib/zaoly-ui-client'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import type { Translator } from '../lib/i18n'

function capabilityLabel(status: CapabilitySyncStatus, t: Translator): string {
  if (status === 'in_sync') return t('projects.capabilityInSync')
  if (status === 'error') return t('projects.capabilityError')
  return t('projects.capabilityPending')
}

function readLayout(): HubIndexLayout {
  if (typeof sessionStorage === 'undefined') return 'cards'
  try {
    return sessionStorage.getItem(paths.hubIndexLayoutKey) === 'list' ? 'list' : 'cards'
  } catch {
    return 'cards'
  }
}

export function ProjectsHub({ projects: initial }: { projects: ProjectSummary[] }) {
  const { t } = useUserPrefs()
  const router = useRouter()
  const [projects, setProjects] = useState(initial)
  const [archiveTarget, setArchiveTarget] = useState<ProjectSummary | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<ProjectEditSeed | null>(null)
  const [layout, setLayout] = useState<HubIndexLayout>('cards')

  useEffect(() => {
    setLayout(readLayout())
  }, [])

  function onLayoutChange(next: HubIndexLayout) {
    setLayout(next)
    try {
      sessionStorage.setItem(paths.hubIndexLayoutKey, next)
    } catch {
      /* ignore */
    }
  }

  async function refresh() {
    const res = await fetch(paths.routes.apiProjects)
    if (!res.ok) return
    const data = (await res.json()) as { items: ProjectSummary[] }
    setProjects(data.items)
    router.refresh()
  }

  async function confirmArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    setArchiveError(null)
    try {
      const res = await fetch(paths.routes.apiProjectArchive(archiveTarget.id), {
        method: 'POST',
      })
      if (!res.ok) {
        throw new Error(t('projects.archiveFailed', { status: res.status }))
      }
      setArchiveTarget(null)
      await refresh()
    } catch (err) {
      setArchiveError(
        err instanceof Error ? err.message : t('projects.archiveFailedGeneric'),
      )
    } finally {
      setArchiving(false)
    }
  }

  function projectActions(project: ProjectSummary) {
    return (
      <CardActions>
        <Link
          href={paths.routes.projectDetail(project.id)}
          className={buttonClassName({ variant: 'ghost' })}
        >
          {t('common.open')}
        </Link>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setEditTarget({ id: project.id, name: project.name })}
        >
          {t('projects.edit')}
        </Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            setArchiveError(null)
            setArchiveTarget(project)
          }}
        >
          {t('projects.archiveConfirm')}
        </Button>
      </CardActions>
    )
  }

  return (
    <div className="creation-projects-hub">
      <Panel>
        <SectionChrome title={t('pages.projects.title')} />
        <Text>{t('pages.projects.lead')}</Text>
      </Panel>

      {projects.length === 0 ? (
        <Panel>
          <Text role="meta" as="p">
            {t('projects.emptyTitle')} — {t('projects.emptyBody')}
          </Text>
        </Panel>
      ) : (
        <>
          <header className="creation-hub-index-head creation-hub-index-head--bare">
            <HubIndexLayoutSwitch
              value={layout}
              onChange={onLayoutChange}
              aria-label={t('projects.layoutAria')}
              cardsLabel={t('projects.layoutCards')}
              listLabel={t('projects.layoutList')}
            />
          </header>
          {layout === 'cards' ? (
            <div className="ds-collection-hub-grid" aria-label={t('projects.listAria')}>
              {projects.map((project) => (
                <CollectionHubCard
                  key={project.id}
                  kicker={project.platformProjectId}
                  badge={capabilityLabel(project.capabilityStatus, t)}
                  badgeStatus={project.capabilityStatus}
                  title={project.name}
                  stats={
                    <CollectionHubMetric
                      value={String(project.compositionCount)}
                      label={t('nav.compositions')}
                    />
                  }
                  actions={projectActions(project)}
                />
              ))}
            </div>
          ) : (
            <ol className="ds-collection-hub-list" aria-label={t('projects.listAria')}>
              {projects.map((project, index) => (
                <li key={project.id} className="ds-collection-hub-list-row">
                  <span className="ds-collection-hub-list-num" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="ds-collection-hub-list-row__main">
                    <Link
                      href={paths.routes.projectDetail(project.id)}
                      className="ds-collection-hub-list-row__title"
                    >
                      {project.name}
                    </Link>
                    <p className="ds-collection-hub-list-meta">
                      <span data-status={project.capabilityStatus}>
                        {capabilityLabel(project.capabilityStatus, t)}
                      </span>
                      <span aria-hidden> · </span>
                      <span>
                        {project.compositionCount} {t('nav.compositions')}
                      </span>
                    </p>
                  </div>
                  <div className="ds-collection-hub-list-row__trail">
                    <Link
                      href={paths.routes.projectDetail(project.id)}
                      className={buttonClassName({ variant: 'ghost', size: 'sm' })}
                    >
                      {t('common.open')}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <ProjectEditDialog
        open={Boolean(editTarget)}
        project={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={(saved) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === saved.id
                ? {
                    ...p,
                    name: saved.name,
                    status: saved.status,
                    capabilityStatus: saved.capabilityStatus,
                    lastActivityAt: saved.lastActivityAt,
                    compositionCount: saved.compositionCount,
                  }
                : p,
            ),
          )
          setEditTarget(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => {
          if (!archiving) setArchiveTarget(null)
        }}
        onConfirm={() => {
          void confirmArchive()
        }}
        title={t('projects.archiveTitle')}
        confirmLabel={archiving ? t('projects.archiving') : t('projects.archiveConfirm')}
        danger
      >
        {t('projects.archiveBody', {
          name: archiveTarget?.name ?? t('projects.thisProject'),
        })}
        {archiveError ? <Alert tone="error">{archiveError}</Alert> : null}
      </ConfirmDialog>
    </div>
  )
}

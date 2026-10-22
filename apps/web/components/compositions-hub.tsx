'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useState } from 'react'
import {
  Button,
  ContextMenu,
  Dialog,
  EmptyState,
  Hint,
  HubIndexCard,
  HubIndexLayoutSwitch,
  type ContextMenuItem,
  type HubIndexLayout,
  Panel,
  SectionChrome,
  Text,
} from '../lib/zaoly-ui'
import type { CompositionSummary, ProjectSummary } from '@zaoly/contracts'
import type { CompositionScene } from '@zaoly/contracts'
import { CompositionCardPreview } from './composition-card-preview'
import { createBlankScene } from '../lib/scene/blank-scene'
import { compositionEditorHref } from '../lib/scene/scene-summary'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import type { Translator } from '../lib/i18n'
import type { CompositionStatus } from '@zaoly/contracts'

const VIEW_KEY = 'zaoly.compositions.view'

function statusLabel(status: CompositionStatus, t: Translator): string {
  if (status === 'ready') return t('compositions.statusReady')
  if (status === 'archived') return t('compositions.statusArchived')
  return t('compositions.statusDraft')
}

/** Stable locale — never `undefined` (Node vs browser locale → hydration mismatch). */
function formatUpdatedAt(iso: string, t: Translator, locale: string): string {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return ''
  try {
    const date = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ms))
    return t('compositions.updatedAt', { date })
  } catch {
    return t('compositions.updatedAt', { date: iso })
  }
}

function readLayout(): HubIndexLayout {
  if (typeof sessionStorage === 'undefined') return 'cards'
  try {
    const v = sessionStorage.getItem(VIEW_KEY)
    return v === 'list' ? 'list' : 'cards'
  } catch {
    return 'cards'
  }
}

type CardMenuState = {
  open: boolean
  x: number
  y: number
  composition: CompositionSummary | null
}

export function CompositionsHub({
  compositions,
  projects,
  inAppEditor = false,
  standalone = false,
}: {
  compositions: CompositionSummary[]
  projects: ProjectSummary[]
  inAppEditor?: boolean
  /** No Collection required to create (Zaoly standalone). */
  standalone?: boolean
}) {
  const { t, locale } = useUserPrefs()
  const router = useRouter()
  const formId = useId()
  const renameFormId = useId()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState(() =>
    standalone ? '' : projects[0]?.id ?? '',
  )
  const [creating, setCreating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layout, setLayout] = useState<HubIndexLayout>('cards')
  const [items, setItems] = useState(compositions)
  const [menu, setMenu] = useState<CardMenuState>({
    open: false,
    x: 0,
    y: 0,
    composition: null,
  })
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [renameTarget, setRenameTarget] = useState<CompositionSummary | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CompositionSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setItems(compositions)
  }, [compositions])

  useEffect(() => {
    setLayout(readLayout())
  }, [])

  function onLayoutChange(next: HubIndexLayout) {
    setLayout(next)
    try {
      sessionStorage.setItem(VIEW_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const selectedProject = projectId
    ? projects.find((p) => p.id === projectId)
    : standalone
      ? undefined
      : projects[0]
  const canCreate = Boolean(
    inAppEditor && (standalone || selectedProject?.platformProjectId),
  )

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!standalone && !selectedProject?.platformProjectId) {
      setError(t('compositions.createNeedsProject'))
      return
    }
    setCreating(true)
    setError(null)
    try {
      const blank = createBlankScene({
        name,
        platformProjectId: standalone
          ? selectedProject?.platformProjectId ?? null
          : selectedProject!.platformProjectId,
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
      setCreateOpen(false)
      router.push(compositionEditorHref(scene))
      router.refresh()
    } catch {
      setError(t('compositions.createFailed', { status: 'network' }))
    } finally {
      setCreating(false)
    }
  }

  function compositionMeta(comp: CompositionSummary): string {
    return [statusLabel(comp.status, t), comp.sourceHint, formatUpdatedAt(comp.updatedAt, t, locale)]
      .filter(Boolean)
      .join(' · ')
  }

  function openCardMenu(comp: CompositionSummary, x: number, y: number) {
    setActionError(null)
    setMenu({ open: true, x, y, composition: comp })
  }

  const menuItems = useMemo((): ContextMenuItem[] => {
    const comp = menu.composition
    if (!comp) return []
    return [
      {
        id: 'rename',
        label: t('compositions.rename'),
        testId: `composition-menu-rename-${comp.id}`,
        onSelect: () => {
          setMenu((m) => ({ ...m, open: false }))
          setRenameTarget(comp)
          setRenameName(comp.name)
          setActionError(null)
          setRenameOpen(true)
        },
      },
      {
        id: 'delete',
        label: t('compositions.delete'),
        danger: true,
        separator: true,
        testId: `composition-menu-delete-${comp.id}`,
        onSelect: () => {
          setMenu((m) => ({ ...m, open: false }))
          setDeleteTarget(comp)
          setActionError(null)
          setDeleteOpen(true)
        },
      },
    ]
  }, [menu.composition, t])

  async function onRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameTarget) return
    const next = renameName.trim()
    if (!next) return
    setRenaming(true)
    setActionError(null)
    try {
      const res = await fetch(paths.routes.apiScene(renameTarget.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: next }),
      })
      if (!res.ok) {
        setActionError(t('compositions.renameFailed', { status: String(res.status) }))
        return
      }
      const body = (await res.json()) as { scene?: CompositionScene }
      const scene = body.scene
      if (!scene?.id) {
        setActionError(t('compositions.renameFailed', { status: 'invalid' }))
        return
      }
      setItems((prev) =>
        prev.map((c) =>
          c.id === scene.id
            ? { ...c, name: scene.name, updatedAt: scene.updatedAt }
            : c,
        ),
      )
      setRenameOpen(false)
      setRenameTarget(null)
      router.refresh()
    } catch {
      setActionError(t('compositions.renameFailed', { status: 'network' }))
    } finally {
      setRenaming(false)
    }
  }

  async function onDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)
    try {
      const res = await fetch(paths.routes.apiScene(deleteTarget.id), {
        method: 'DELETE',
      })
      if (!res.ok) {
        setActionError(t('compositions.deleteFailed', { status: String(res.status) }))
        return
      }
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteOpen(false)
      setDeleteTarget(null)
      router.refresh()
    } catch {
      setActionError(t('compositions.deleteFailed', { status: 'network' }))
    } finally {
      setDeleting(false)
    }
  }

  const createCard = (
    <li key="__create">
      <HubIndexCard
        variant="create"
        data-testid="composition-create-card"
        disabled={!inAppEditor || (!standalone && projects.length === 0)}
        title={t('compositions.createTitle')}
        meta={t(standalone ? 'compositions.createHintStandalone' : 'compositions.createHint')}
        onClick={() => {
          setError(null)
          setCreateOpen(true)
        }}
      />
    </li>
  )

  return (
    <div className="creation-magazine creation-compositions-hub">
      <Panel>
        <div className="creation-compositions-toolbar">
          <SectionChrome title={t('compositions.recentTitle')} meta={t('compositions.recentMeta')} />
          <HubIndexLayoutSwitch
            value={layout}
            onChange={onLayoutChange}
            aria-label={t('compositions.viewAria')}
            cardsLabel={t('compositions.viewGrid')}
            listLabel={t('compositions.viewList')}
          />
        </div>
        <Text role="meta" as="p">
          {t('compositions.recentLead')}
        </Text>
        {!standalone && projects.length === 0 ? (
          <EmptyState>
            {t('compositions.createNeedsProject')}{' '}
            <Link href={paths.routes.projects}>{t('compositions.openProjects')}</Link>.
          </EmptyState>
        ) : null}
        <ul
          className={
            layout === 'list'
              ? 'ds-hub-index-grid ds-hub-index-grid--list creation-compositions-hub-grid creation-compositions-hub-grid--list'
              : 'ds-hub-index-grid creation-compositions-hub-grid'
          }
          data-testid={layout === 'list' ? 'compositions-list' : 'compositions-grid'}
        >
          {createCard}
          {items.map((comp) => {
            const href = compositionEditorHref(comp)
            const preview = (
              <CompositionCardPreview
                sceneId={comp.id}
                pageId={comp.previewPageId}
                emptyLabel={t('compositions.previewEmpty')}
                title={t('compositions.previewTitle', { name: comp.name })}
              />
            )
            return (
              <li key={comp.id} className="creation-composition-card">
                {inAppEditor ? (
                  <HubIndexCard
                    href={href}
                    title={comp.name}
                    meta={compositionMeta(comp)}
                    media={preview}
                    data-testid={`composition-card-${comp.id}`}
                  />
                ) : (
                  <HubIndexCard
                    title={comp.name}
                    meta={compositionMeta(comp)}
                    media={preview}
                    data-testid={`composition-card-${comp.id}`}
                    disabled
                  />
                )}
                {inAppEditor ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="creation-composition-card__menu"
                    aria-label={t('compositions.cardMenuAria', { name: comp.name })}
                    data-testid={`composition-card-menu-${comp.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const rect = e.currentTarget.getBoundingClientRect()
                      openCardMenu(comp, rect.left, rect.bottom + 4)
                    }}
                  >
                    ⋯
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
        {items.length === 0 && (standalone || projects.length > 0) ? (
          <EmptyState>{t('compositions.empty')}</EmptyState>
        ) : null}
      </Panel>

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={menuItems}
        label={t('compositions.cardMenuLabel')}
        onClose={() => setMenu((m) => ({ ...m, open: false }))}
      />

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!creating) setCreateOpen(false)
        }}
        title={t('compositions.createTitle')}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={creating}
              onClick={() => setCreateOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="primary"
              size="md"
              disabled={creating || !canCreate || !name.trim()}
            >
              {creating ? t('compositions.creating') : t('compositions.create')}
            </Button>
          </>
        }
      >
        {!standalone && projects.length === 0 ? (
          <EmptyState>
            {t('compositions.createNeedsProject')}{' '}
            <Link href={paths.routes.projects}>{t('compositions.openProjects')}</Link>.
          </EmptyState>
        ) : (
          <form
            id={formId}
            onSubmit={(e) => void onCreate(e)}
            className="creation-projects-create"
          >
            <label>
              <Text role="meta" as="span">
                {t('compositions.nameLabel')}
              </Text>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                disabled={creating || !inAppEditor}
                autoFocus
              />
            </label>
            {projects.length > 0 ? (
              <label>
                <Text role="meta" as="span">
                  {t(standalone ? 'compositions.projectLabelOptional' : 'compositions.projectLabel')}
                </Text>
                <select
                  value={selectedProject?.id ?? ''}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={creating || !inAppEditor}
                  required={!standalone}
                >
                  {standalone ? (
                    <option value="">{t('compositions.projectNone')}</option>
                  ) : null}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {error ? (
              <Text role="meta" as="p">
                {error}
              </Text>
            ) : null}
            {!inAppEditor ? (
              <Hint panel>
                {t('pages.compositions.inAppOffHint', { env: paths.envEditorInApp })}
              </Hint>
            ) : null}
          </form>
        )}
      </Dialog>

      <Dialog
        open={renameOpen}
        onClose={() => {
          if (!renaming) {
            setRenameOpen(false)
            setRenameTarget(null)
          }
        }}
        title={t('compositions.renameTitle')}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={renaming}
              onClick={() => {
                setRenameOpen(false)
                setRenameTarget(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form={renameFormId}
              variant="primary"
              size="md"
              disabled={renaming || !renameName.trim()}
              data-testid="composition-rename-submit"
            >
              {renaming ? t('compositions.renaming') : t('compositions.renameSave')}
            </Button>
          </>
        }
      >
        <form
          id={renameFormId}
          onSubmit={(e) => void onRename(e)}
          className="creation-projects-create"
        >
          <label>
            <Text role="meta" as="span">
              {t('compositions.nameLabel')}
            </Text>
            <input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              required
              minLength={1}
              disabled={renaming}
              autoFocus
              data-testid="composition-rename-input"
            />
          </label>
          {actionError && renameOpen ? (
            <Text role="meta" as="p">
              {actionError}
            </Text>
          ) : null}
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false)
            setDeleteTarget(null)
          }
        }}
        title={t('compositions.deleteTitle')}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={deleting}
              onClick={() => {
                setDeleteOpen(false)
                setDeleteTarget(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={deleting}
              data-testid="composition-delete-confirm"
              onClick={() => void onDeleteConfirm()}
            >
              {deleting ? t('compositions.deleting') : t('compositions.deleteConfirm')}
            </Button>
          </>
        }
      >
        <Text as="p">
          {t('compositions.deleteBody', { name: deleteTarget?.name ?? '' })}
        </Text>
        {actionError && deleteOpen ? (
          <Text role="meta" as="p">
            {actionError}
          </Text>
        ) : null}
      </Dialog>
    </div>
  )
}

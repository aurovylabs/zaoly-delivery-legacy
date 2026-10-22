'use client'

/**
 * Site Kit publish/pull and surface export.
 * Magazin PDF — retired (`print-out-of-scope-for-zaoly.md`). Magcloud removed.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CompositionScene } from '@zaoly/contracts'
import {
  collectPublishableMasters,
  collectPullableMasters,
  requestSiteKitPublishAll,
  requestSiteKitPull,
} from '../../lib/site-kit/write-client'
import { formatSiteKitPublishStatusMessage } from '../../lib/site-kit/publish-status'
import { mergeSiteKitPullIntoScene } from '../../lib/site-kit/pull-merge'
import { requestSavePageAsPattern } from '../../lib/site-kit/page-as-pattern-client'
import { openKitPlaygroundHref } from '../../lib/site-kit/open-kit-playground'
import { withPrunedComments } from '../../lib/scene-comments'
import { kitPlaygroundHref, paths } from '../../lib/paths'
import { isRealPlatformProjectId } from '../../lib/platform-project-id'
import { resolveActivePageId } from '../../lib/scene/scene-pages'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import type { InspectTokenOption } from '../../lib/inspect/token-catalog'

export type EditorIntegrationsToast = {
  message: string
  tone: 'ok' | 'error'
  durationMs?: number
}

export function useEditorIntegrations(args: {
  scene: CompositionScene
  sceneRef: { current: CompositionScene }
  activeBreakpoint: EditorBreakpoint
  tokenCatalog: InspectTokenOption[]
  pushPresent: (next: CompositionScene) => void
  mutatePresent: (fn: (present: CompositionScene) => CompositionScene) => void
  t: (key: string, vars?: Record<string, string>) => string
  pushToast: (toast: EditorIntegrationsToast) => void
  setError: (message: string | null) => void
  /** Persist dirty scene before from-page (store is SSOT for the API). */
  ensureScenePersisted?: () => Promise<void>
}) {
  const {
    scene,
    sceneRef,
    activeBreakpoint,
    tokenCatalog,
    pushPresent,
    mutatePresent,
    t,
    pushToast,
    setError,
    ensureScenePersisted,
  } = args

  const [exportBusy, setExportBusy] = useState(false)
  const [publishBusy, setPublishBusy] = useState(false)
  const [publishStatus, setPublishStatus] = useState<string | null>(null)
  const [pullResetConfirmOpen, setPullResetConfirmOpen] = useState(false)
  const publishBusyRef = useRef(publishBusy)
  publishBusyRef.current = publishBusy
  /** Magazin PDF retired — stub only. */
  const pdfBusy = false

  const publishableMasterCount = useMemo(
    () => collectPublishableMasters(scene.masters ?? []).length,
    [scene.masters],
  )
  const pullableMasterCount = useMemo(
    () => collectPullableMasters(scene.masters ?? []).length,
    [scene.masters],
  )

  useEffect(() => {
    if (!publishStatus) return
    pushToast({ message: publishStatus, tone: 'ok', durationMs: 4000 })
  }, [publishStatus, pushToast])

  function onDownloadPdf() {
    setError(t('editor.downloadPdfFailed'))
  }

  async function onSurfaceExport(format: 'png' | 'pdf', scope: 'active' | 'all' = 'active') {
    if (exportBusy) return
    setExportBusy(true)
    setError(null)
    try {
      const payload: CompositionScene = {
        ...withPrunedComments(sceneRef.current),
        activeBreakpoint,
      }
      const res = await fetch(paths.routes.apiSceneExport(payload.id), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scene: payload,
          format,
          scope,
          breakpoint: activeBreakpoint,
        }),
      })
      if (res.status === 422 || res.status === 400) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error || t('editor.surfaceExportFailed'))
        return
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || t('editor.surfaceExportFailed'))
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') || ''
      const match = /filename="([^"]+)"/.exec(cd)
      const fallback = format === 'png' ? `${payload.name || payload.id}.png` : `${payload.name || payload.id}.pdf`
      const filename = match?.[1] || fallback
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('editor.surfaceExportFailed'))
    } finally {
      setExportBusy(false)
    }
  }

  async function onPublishToStorybook() {
    if (publishBusy) return
    setError(null)
    setPublishStatus(null)
    if (!publishableMasterCount) {
      setError(t('editor.siteKitPublishNone'))
      return
    }
    // Designer Publish = Collection fork. Unbound scenes hit shared-seed 403 — guide to Inspect bind.
    if (!isRealPlatformProjectId(sceneRef.current.platformProjectId)) {
      setError(t('editor.siteKitPublishNeedCollection'))
      return
    }
    setPublishBusy(true)
    try {
      const primary =
        sceneRef.current.primaryBreakpoint === 'tablet' ||
        sceneRef.current.primaryBreakpoint === 'mobile' ||
        sceneRef.current.primaryBreakpoint === 'desktop'
          ? sceneRef.current.primaryBreakpoint
          : 'desktop'
      const result = await requestSiteKitPublishAll({
        masters: sceneRef.current.masters ?? [],
        breakpoint: activeBreakpoint,
        primaryBreakpoint: primary,
        tokenCatalog,
        platformProjectId: sceneRef.current.platformProjectId,
        publishLane: 'fork',
      })
      if (!result.ok) {
        const raw = result.error || ''
        if (
          raw.includes('SHARED_SEED_WRITE') ||
          raw.includes('seed-write-forbidden') ||
          raw.includes('missing-platform-project-id')
        ) {
          setError(t('editor.siteKitPublishNeedCollection'))
          return
        }
        setError(raw)
        return
      }
      setPublishStatus(formatSiteKitPublishStatusMessage(result, t))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('editor.siteKitPublishBusy'))
    } finally {
      setPublishBusy(false)
    }
  }

  async function runSiteKitPull(mode: 'pull' | 'reset') {
    if (publishBusyRef.current) return
    setPullResetConfirmOpen(false)
    setPublishBusy(true)
    try {
      const current = sceneRef.current
      const result = await requestSiteKitPull({
        masters: current.masters ?? [],
        mode,
        sceneRoot: current.root,
        platformProjectId: current.platformProjectId,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      const nextScene = mergeSiteKitPullIntoScene(current, {
        masters: result.masters,
        ...(result.sceneRoot ? { sceneRoot: result.sceneRoot } : {}),
      })
      pushPresent(nextScene)
      setPublishStatus(
        t('editor.siteKitPullOk', {
          updated: String(result.updated),
          unchanged: String(result.unchanged),
          reset: String(result.reset),
          remapped: String(result.remaps.filter((r) => r.byName).length),
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('editor.siteKitPullBusy'))
    } finally {
      setPublishBusy(false)
    }
  }

  async function onPullFromSiteKit(mode: 'pull' | 'reset') {
    if (publishBusy) return
    setError(null)
    setPublishStatus(null)
    if (!pullableMasterCount) {
      setError(t('editor.siteKitPullNone'))
      return
    }
    if (mode === 'reset') {
      setPullResetConfirmOpen(true)
      return
    }
    await runSiteKitPull('pull')
  }

  async function onSavePageAsPattern(opts?: {
    allPages?: boolean
    pageId?: string
  }) {
    if (publishBusy) return
    setError(null)
    setPublishStatus(null)
    if (!isRealPlatformProjectId(sceneRef.current.platformProjectId)) {
      setError(t('editor.savePageAsPatternNeedCollection'))
      return
    }
    setPublishBusy(true)
    try {
      if (ensureScenePersisted) await ensureScenePersisted()
      const current = sceneRef.current
      const pages = current.pages ?? []
      const pageId =
        opts?.pageId?.trim() ||
        resolveActivePageId(pages, current.activePageId)
      const result = await requestSavePageAsPattern({
        sceneId: current.id,
        pageId,
        allPages: opts?.allPages === true,
        breakpoint: activeBreakpoint,
      })
      if (!result.ok) {
        const err =
          result.code === 'missing-platform-project-id'
            ? t('editor.savePageAsPatternNeedCollection')
            : result.error
        setError(err)
        return
      }
      pushPresent(result.scene)
      // pushPresent is async via setState — keep sceneRef in sync for immediate persist.
      sceneRef.current = result.scene
      if (ensureScenePersisted) await ensureScenePersisted()
      const names = result.results.map((r) => r.exportName).join(', ')
      const kitHref = kitPlaygroundHref({
        componentId: result.componentId,
        platformProjectId: result.scene.platformProjectId ?? null,
      })
      const opened = openKitPlaygroundHref(kitHref)
      setPublishStatus(
        t(
          opened
            ? 'editor.savePageAsPatternOkOpened'
            : 'editor.savePageAsPatternOk',
          {
            names,
            kit: kitHref,
            count: String(result.results.length),
          },
        ),
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('editor.savePageAsPatternFailed'),
      )
    } finally {
      setPublishBusy(false)
    }
  }

  return {
    pdfBusy,
    exportBusy,
    publishBusy,
    publishStatus,
    setPublishStatus,
    pullResetConfirmOpen,
    setPullResetConfirmOpen,
    publishableMasterCount,
    pullableMasterCount,
    onDownloadPdf,
    onSurfaceExport,
    onPublishToStorybook,
    onPullFromSiteKit,
    runSiteKitPull,
    onSavePageAsPattern,
  }
}

'use client'

/**
 * Breakpoint/print preset + scene snapshot/reload + remote SSE (W5p).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { CompositionScene, PrintPresetId } from '@zaoly/contracts'
import { paths } from '../../lib/paths'
import { reportError } from '../../lib/observability/report-error'
import {
  isEditorBreakpoint,
  isPrintPresetId,
  resolveDigitalEditorBreakpoint,
  resolvePrintPreset,
  type EditorBreakpoint,
} from '../../lib/scene/breakpoints'
import { seedEditorPrefillMasters } from '../../lib/scene/editor-master-prefill'
import { activePageRoot } from '../../lib/scene/scene-pages'
import { sceneSaveFingerprint, type SceneDirtyIdentity } from '../../lib/scene/scene-save-fingerprint'
import { fetchScene } from '../../lib/scene/scene-save-client'
import { type SceneUpdatedEvent } from '../../lib/scene/scene-events'
import { replaceSelection } from '../../lib/scene/selection'
import { dispatchOnboardingAction } from '../../lib/editor/onboarding'

export function useEditorSceneSync(args: {
  sceneId: string
  activeBreakpoint: EditorBreakpoint
  activePrintPreset: PrintPresetId
  activeBreakpointRef: { current: EditorBreakpoint }
  activePrintPresetRef: { current: PrintPresetId }
  savedUpdatedAtRef: { current: string }
  dirtyRef: { current: boolean }
  saveInFlightRef: { current: boolean }
  setActiveBreakpoint: Dispatch<SetStateAction<EditorBreakpoint>>
  setActivePrintPreset: Dispatch<SetStateAction<PrintPresetId>>
  setEditingMasterId: Dispatch<SetStateAction<string | null>>
  setEditingVariantId: Dispatch<SetStateAction<string | null>>
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setRemoteUpdateAvailable: Dispatch<SetStateAction<SceneUpdatedEvent | null>>
  setStaleConflict: Dispatch<SetStateAction<'active' | 'dismissed' | null>>
  setError: (message: string | null) => void
  mutatePresent: (fn: (present: CompositionScene) => CompositionScene) => void
  resetPresent: (scene: CompositionScene) => void
  setSavedUpdatedAt: (updatedAt: string) => void
  syncSavedSceneSnapshot: (scene: CompositionScene) => void
  markSaved: (identity: SceneDirtyIdentity, fingerprint: string) => void
}) {
  const {
    sceneId,
    activeBreakpoint,
    activePrintPreset,
    activeBreakpointRef,
    activePrintPresetRef,
    savedUpdatedAtRef,
    dirtyRef,
    saveInFlightRef,
    setActiveBreakpoint,
    setActivePrintPreset,
    setEditingMasterId,
    setEditingVariantId,
    setSelectedIds,
    setRemoteUpdateAvailable,
    setStaleConflict,
    setError,
    mutatePresent,
    resetPresent,
    setSavedUpdatedAt,
    syncSavedSceneSnapshot,
    markSaved,
  } = args

  function onBreakpointChange(value: string) {
    // Zaoly web design: digital lanes only (`print-out-of-scope-for-zaoly.md`).
    if (value === 'print') {
      value = 'desktop'
    }
    if (!isEditorBreakpoint(value) || value === 'print') return
    const prev = activeBreakpointRef.current
    setActiveBreakpoint(value)
    mutatePresent((present) => ({
      ...present,
      activeBreakpoint: value,
      updatedAt: new Date().toISOString(),
    }))
    if ((value === 'tablet' || value === 'mobile') && value !== prev) {
      dispatchOnboardingAction('activateBreakpoint')
    }
  }

  function onPrintPresetChange(value: string) {
    if (!isPrintPresetId(value)) return
    setActivePrintPreset(value)
    mutatePresent((present) => ({
      ...present,
      activePrintPreset: value,
      updatedAt: new Date().toISOString(),
    }))
  }

  function applySceneSnapshot(
    reloaded: CompositionScene,
    fallbackBreakpoint = activeBreakpointRef.current,
    fallbackPrintPreset = activePrintPresetRef.current,
  ) {
    const seeded = seedEditorPrefillMasters(reloaded)
    const bp = resolveDigitalEditorBreakpoint(seeded.activeBreakpoint ?? fallbackBreakpoint)
    const preset = resolvePrintPreset(seeded.activePrintPreset ?? fallbackPrintPreset)
    resetPresent(seeded)
    setActiveBreakpoint(bp)
    setActivePrintPreset(preset)
    setSavedUpdatedAt(seeded.updatedAt)
    syncSavedSceneSnapshot(seeded)
    markSaved(
      { revision: 0, activeBreakpoint: bp, activePrintPreset: preset },
      sceneSaveFingerprint(seeded, bp, preset),
    )
    setEditingMasterId(null)
    setEditingVariantId(null)
    setSelectedIds(replaceSelection(activePageRoot(seeded).id))
    setRemoteUpdateAvailable(null)
    setStaleConflict(null)
    return seeded
  }

  async function reloadSceneFromServer(
    id: string,
    fallbackBreakpoint = activeBreakpointRef.current,
    fallbackPrintPreset = activePrintPresetRef.current,
  ) {
    try {
      const reloaded = await fetchScene(paths.routes.apiScene(id))
      return applySceneSnapshot(reloaded, fallbackBreakpoint, fallbackPrintPreset)
    } catch (e) {
      reportError(e, { source: 'editor-reload-scene', extra: { sceneId: id } })
      throw e
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return
    const source = new EventSource(paths.routes.apiSceneEvents(sceneId))
    const onRemoteSceneUpdated = (event: MessageEvent<string>) => {
      let payload: SceneUpdatedEvent | null = null
      try {
        payload = JSON.parse(event.data) as SceneUpdatedEvent
      } catch {
        return
      }
      if (!payload || payload.sceneId !== sceneId) return
      if (payload.updatedAt === savedUpdatedAtRef.current) return
      // Own persist publishes scene-updated; ignore while we are the writer
      // (otherwise solo autosave spam → false “Remote update available”).
      if (saveInFlightRef.current) return
      if (dirtyRef.current) {
        setRemoteUpdateAvailable(payload)
        return
      }
      void reloadSceneFromServer(sceneId).catch(() => {
        setRemoteUpdateAvailable(payload)
        setError('Remote scene update available - reload failed.')
      })
    }
    source.addEventListener('scene-updated', onRemoteSceneUpdated as EventListener)
    source.onerror = () => {
      // EventSource auto-reconnect is enough for transient disconnects.
    }
    return () => {
      source.removeEventListener('scene-updated', onRemoteSceneUpdated as EventListener)
      source.close()
    }
    // reloadSceneFromServer closes over latest apply helpers; re-bind when scene changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional sceneId-scoped SSE
  }, [sceneId])

  return {
    onBreakpointChange,
    onPrintPresetChange,
    applySceneSnapshot,
    reloadSceneFromServer,
  }
}

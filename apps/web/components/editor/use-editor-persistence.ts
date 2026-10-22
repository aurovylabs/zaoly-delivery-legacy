'use client'

/**
 * Dirty/save persistence slice for the editor scene orchestrator (W5e/W5f).
 * Spec: specs/domain/scene-core-split-w5.md · specs/domain/editor-workspace.md (P78)
 *
 * Dirty checks use mutation revision (O(1)). Full `sceneSaveFingerprint` JSON only
 * at save boundaries when comparing ops-replay / payload shape.
 */
import { useEffect, useRef, useState } from 'react'
import type { CompositionScene, PrintPresetId, SceneOp } from '@zaoly/contracts'
import { EDITOR_AUTOSAVE_DEBOUNCE_MS } from '../../lib/editor-autosave'
import { editorToastMessage } from '../../lib/editor-toast-message'
import { paths } from '../../lib/paths'
import { reportError } from '../../lib/observability/report-error'
import { withPrunedComments } from '../../lib/scene-comments'
import { applySceneOpBatch } from '../../lib/scene/apply-scene-op-batch'
import { applySceneOps, putScene } from '../../lib/scene/scene-save-client'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import { sceneDocumentFingerprint } from '../../lib/scene/scene-document-fingerprint'
import {
  isSceneDirty,
  sceneSaveFingerprint,
  type SceneDirtyIdentity,
} from '../../lib/scene/scene-save-fingerprint'

export type EditorPersistenceToast = {
  message: string
  tone: 'ok' | 'error'
  durationMs?: number
}

export type EditorSaveLiveContext = {
  scene: CompositionScene
  activeBreakpoint: EditorBreakpoint
  activePrintPreset: PrintPresetId
  revision: number
}

export function useEditorPersistence(args: {
  initialUpdatedAt: string
  initialPresent: CompositionScene
  initialBreakpoint: EditorBreakpoint
  initialPrintPreset: PrintPresetId
  contentRevision: number
  scene: CompositionScene
  activeBreakpoint: EditorBreakpoint
  activePrintPreset: PrintPresetId
  getLive: () => EditorSaveLiveContext
  /** True while a stale-scene conflict blocks autosave (W6 keep-draft). */
  isSaveBlocked: () => boolean
  onStaleConflict: (info: { sceneId: string }) => void
  t: (key: string) => string
  pushToast: (toast: EditorPersistenceToast) => void
  setError: (message: string | null) => void
}) {
  const {
    initialUpdatedAt,
    initialPresent,
    initialBreakpoint,
    initialPrintPreset,
    contentRevision,
    scene,
    activeBreakpoint,
    activePrintPreset,
    getLive,
    isSaveBlocked,
    onStaleConflict,
    t,
    pushToast,
    setError,
  } = args

  const [savedIdentity, setSavedIdentity] = useState<SceneDirtyIdentity>({
    revision: 0,
    activeBreakpoint: initialBreakpoint,
    activePrintPreset: initialPrintPreset,
  })
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    sceneSaveFingerprint(initialPresent, initialBreakpoint, initialPrintPreset),
  )
  const [savedUpdatedAt, setSavedUpdatedAt] = useState(initialUpdatedAt)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const saveInFlightRef = useRef(false)
  const toastSaveFeedbackRef = useRef(false)
  const savedUpdatedAtRef = useRef(savedUpdatedAt)
  savedUpdatedAtRef.current = savedUpdatedAt
  const savedSceneSnapshotRef = useRef(structuredClone(withPrunedComments(initialPresent)))
  const pendingOpsRef = useRef<SceneOp[]>([])
  const onSaveRef = useRef<() => Promise<void>>(async () => {})

  /** Keep lock ref in sync before React re-renders — trailing autosave reads the ref in a microtask. */
  function commitSavedUpdatedAt(next: string) {
    savedUpdatedAtRef.current = next
    setSavedUpdatedAt(next)
  }

  const liveIdentity: SceneDirtyIdentity = {
    revision: contentRevision,
    activeBreakpoint,
    activePrintPreset,
  }
  const dirty = isSceneDirty(liveIdentity, savedIdentity)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const isSaveBlockedRef = useRef(isSaveBlocked)
  isSaveBlockedRef.current = isSaveBlocked

  function clearPendingSaveOps() {
    pendingOpsRef.current = []
  }

  function syncSavedSceneSnapshot(next: CompositionScene) {
    savedSceneSnapshotRef.current = structuredClone(withPrunedComments(next))
    clearPendingSaveOps()
  }

  function markSaved(identity: SceneDirtyIdentity, fingerprint: string) {
    setSavedIdentity(identity)
    setSavedFingerprint(fingerprint)
  }

  function enqueuePendingOp(op: SceneOp) {
    pendingOpsRef.current.push(op)
  }

  function enqueuePendingOps(ops: SceneOp[]) {
    pendingOpsRef.current.push(...ops)
  }

  async function onSave() {
    if (saveInFlightRef.current) return
    if (isSaveBlockedRef.current()) {
      setSaveState('error')
      setError(t('editor.staleSceneConflict'))
      return
    }
    saveInFlightRef.current = true
    setSaveState('saving')
    setError(null)
    const live = getLive()
    const bpAtSave = live.activeBreakpoint
    const presetAtSave = live.activePrintPreset
    const sceneAtSave = live.scene
    const revisionAtSave = live.revision
    const outboundFingerprint = sceneSaveFingerprint(sceneAtSave, bpAtSave, presetAtSave)
    const outboundIdentity: SceneDirtyIdentity = {
      revision: revisionAtSave,
      activeBreakpoint: bpAtSave,
      activePrintPreset: presetAtSave,
    }
    const lockAtSave = savedUpdatedAtRef.current
    const opsAtSave = [...pendingOpsRef.current]
    const snapshotAtSave = savedSceneSnapshotRef.current
    const bpUnchanged =
      (snapshotAtSave.activeBreakpoint ?? null) === (bpAtSave ?? null)
    const presetUnchanged =
      (snapshotAtSave.activePrintPreset ?? null) === (presetAtSave ?? null)
    const replay =
      opsAtSave.length > 0
        ? applySceneOpBatch(snapshotAtSave, opsAtSave)
        : null
    const canUseOps =
      !!replay?.ok &&
      bpUnchanged &&
      presetUnchanged &&
      sceneDocumentFingerprint(replay.scene) === sceneDocumentFingerprint(sceneAtSave)
    let hitStale = false
    try {
      const payload: CompositionScene = {
        ...withPrunedComments(sceneAtSave),
        activeBreakpoint: bpAtSave,
        activePrintPreset: presetAtSave,
      }
      const result = canUseOps
        ? await applySceneOps(
            payload.id,
            opsAtSave,
            lockAtSave,
            paths.routes.apiSceneOps(payload.id),
          )
        : await putScene(payload, lockAtSave, paths.routes.apiScene(payload.id))
      if (!result.ok && result.stale) {
        hitStale = true
        onStaleConflict({ sceneId: payload.id })
        setSaveState('error')
        setError(t('editor.staleSceneConflict'))
        pushToast({
          message: t('editor.staleSceneConflict'),
          tone: 'error',
          durationMs: 6000,
        })
        reportError(new Error('stale-scene'), {
          source: 'editor-save-stale',
          extra: { sceneId: payload.id },
        })
        return
      }
      if (!result.ok) {
        throw new Error(result.message)
      }
      // P78: never replace history.present with the response body (clobbers concurrent edits).
      const after = getLive()
      if (after.revision === revisionAtSave) {
        markSaved(outboundIdentity, outboundFingerprint)
        commitSavedUpdatedAt(result.scene.updatedAt)
        syncSavedSceneSnapshot({
          ...result.scene,
          activeBreakpoint: bpAtSave,
          activePrintPreset: presetAtSave,
        })
        setSaveState('saved')
        if (toastSaveFeedbackRef.current) {
          pushToast({ message: t('editor.saved'), tone: 'ok', durationMs: 2500 })
        }
      } else {
        commitSavedUpdatedAt(result.scene.updatedAt)
        syncSavedSceneSnapshot({
          ...result.scene,
          activeBreakpoint: after.activeBreakpoint,
          activePrintPreset: after.activePrintPreset,
        })
        setSaveState('idle')
      }
    } catch (e) {
      setSaveState('error')
      const message = editorToastMessage(
        e instanceof Error ? e.message : 'Save failed',
        'Save failed',
      )
      setError(message)
      pushToast({ message, tone: 'error' })
      reportError(e, {
        source: 'editor-save',
        extra: { sceneId: sceneAtSave.id },
      })
    } finally {
      toastSaveFeedbackRef.current = false
      saveInFlightRef.current = false
      const after = getLive()
      if (!hitStale && !isSaveBlockedRef.current() && after.revision !== revisionAtSave) {
        queueMicrotask(() => {
          void onSaveRef.current()
        })
      }
    }
  }
  onSaveRef.current = onSave

  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (!dirty || isSaveBlockedRef.current()) return
    const handle = window.setTimeout(() => {
      if (!dirtyRef.current || saveInFlightRef.current || isSaveBlockedRef.current()) return
      toastSaveFeedbackRef.current = false
      void onSaveRef.current()
    }, EDITOR_AUTOSAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [dirty, contentRevision, activeBreakpoint, activePrintPreset])

  return {
    savedFingerprint,
    setSavedFingerprint,
    savedIdentity,
    markSaved,
    savedUpdatedAt,
    setSavedUpdatedAt: commitSavedUpdatedAt,
    savedUpdatedAtRef,
    saveState,
    setSaveState,
    dirty,
    dirtyRef,
    saveInFlightRef,
    toastSaveFeedbackRef,
    pendingOpsRef,
    onSaveRef,
    clearPendingSaveOps,
    syncSavedSceneSnapshot,
    enqueuePendingOp,
    enqueuePendingOps,
    onSave,
  }
}

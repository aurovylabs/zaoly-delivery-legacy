'use client'

import { createPortal } from 'react-dom'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Button } from '../../../lib/zaoly-ui'
import {
  GUIDED_TOUR_STEPS,
  applyOnboardingQueryReset,
  clampTipDragPosition,
  compositionCountsFromDetail,
  computeTipPosition,
  getTourProgress,
  getTourStep,
  dispatchOnboardingPrepare,
  focusTokenBindHighlightTarget,
  highlightRectsForTargets,
  isOnboardingPalettePickTarget,
  isTourStepAlreadySatisfied,
  markEmptyCoachSkipped,
  markTourDone,
  markWelcomeSeen,
  matchesTourAction,
  resolveHighlightTargets,
  resolveInsertDropZoneTargets,
  resolveOnboardingCopy,
  setTourProgress,
  shouldShowEmptyCoach,
  shouldShowWelcome,
  shouldStartTour,
  type HighlightRect,
  type OnboardingLocale,
} from '../../../lib/editor/onboarding'
import { paths } from '../../../lib/paths'
import { ZaolySealMark } from '../../zaoly-seal-mark'

type TourView = {
  index: number
  id: string
  text: string
  progress: string
  isLast: boolean
  style?: CSSProperties | null
} | null

function clearPulseClasses() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.zaoly-onboarding-pulse').forEach((el) => {
    el.classList.remove('zaoly-onboarding-pulse')
  })
}

function pulseTargets(anchorId: string | null | undefined, on: boolean) {
  clearPulseClasses()
  if (!on || !anchorId) return
  for (const el of resolveHighlightTargets(anchorId)) {
    el.classList.add('zaoly-onboarding-pulse')
  }
}

function BrandRow({ label }: { label: string }) {
  return (
    <div className="zaoly-onboarding-brand">
      <ZaolySealMark size={28} />
      <span>{label}</span>
    </div>
  )
}

export type OnboardingHostProps = {
  locale?: OnboardingLocale
  rootCount: number
  onLoadSample: () => void | Promise<void>
}

export function OnboardingHost({ locale, rootCount, onLoadSample }: OnboardingHostProps) {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const copy = resolveOnboardingCopy(search, locale)
  const welcomeTitleId = useId()
  const emptyTitleId = useId()
  const doneTitleId = useId()
  const tourDelayRef = useRef<number | null>(null)
  const tourRef = useRef<TourView>(null)
  const advancingRef = useRef(false)

  const [welcomeOpen, setWelcomeOpen] = useState(() => {
    applyOnboardingQueryReset({ search })
    return shouldShowWelcome({ search })
  })
  const [emptyOpen, setEmptyOpen] = useState(false)
  const [tour, setTour] = useState<TourView>(null)
  const [doneOpen, setDoneOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [highlights, setHighlights] = useState<HighlightRect[]>([])
  /** User-dragged tip position (fixed top/left); cleared when the step changes. */
  const [tipDrag, setTipDrag] = useState<{ top: number; left: number } | null>(null)
  const tipDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originTop: number
    originLeft: number
  } | null>(null)
  const tipElRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    setTipDrag(null)
  }, [tour?.id])

  const syncHighlights = useCallback((anchorId: string | null | undefined) => {
    if (!anchorId) {
      setHighlights([])
      return
    }
    setHighlights(highlightRectsForTargets(resolveHighlightTargets(anchorId)))
  }, [])

  const [insertDropGuide, setInsertDropGuide] = useState(false)

  useEffect(() => {
    setInsertDropGuide(false)
  }, [tour?.id])

  useEffect(() => {
    if (!tour?.id) {
      setHighlights([])
      return
    }
    const refresh = () => {
      if (tour.id === 'insert' && insertDropGuide) {
        setHighlights(highlightRectsForTargets(resolveInsertDropZoneTargets()))
        return
      }
      syncHighlights(tour.id)
    }
    refresh()
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)
    const canvas = document.querySelector('[data-testid="creation-editor-canvas"]')
    canvas?.addEventListener('scroll', refresh, true)
    const iv = window.setInterval(refresh, 400)
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
      canvas?.removeEventListener('scroll', refresh, true)
      window.clearInterval(iv)
    }
  }, [tour?.id, insertDropGuide, syncHighlights])

  // Insert tip: picking up a palette atom → light the artboard as drop zone.
  useEffect(() => {
    if (tour?.id !== 'insert') return
    const showDropZone = () => {
      setInsertDropGuide(true)
      pulseTargets(null, false)
      setHighlights(highlightRectsForTargets(resolveInsertDropZoneTargets()))
    }
    const restorePalette = () => {
      setInsertDropGuide(false)
      if (tourRef.current?.id !== 'insert') return
      pulseTargets('insert', true)
      syncHighlights('insert')
    }
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (!isOnboardingPalettePickTarget(e.target)) return
      showDropZone()
    }
    const onDragStart = (e: DragEvent) => {
      if (!isOnboardingPalettePickTarget(e.target)) return
      showDropZone()
    }
    const onDragEnd = () => restorePalette()
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('dragstart', onDragStart, true)
    document.addEventListener('dragend', onDragEnd, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('dragstart', onDragStart, true)
      document.removeEventListener('dragend', onDragEnd, true)
    }
  }, [tour?.id, syncHighlights])

  useEffect(() => {
    tourRef.current = tour
  }, [tour])

  const recomputeEmpty = useCallback((count: number, welcome: boolean) => {
    // Guided tips suppress Empty coach (post-Welcome → tourGate, not emptyGate).
    if (tourRef.current) {
      setEmptyOpen(false)
      return
    }
    setEmptyOpen(shouldShowEmptyCoach({ rootCount: count, welcomeOpen: welcome }))
  }, [])

  useEffect(() => {
    recomputeEmpty(rootCount, welcomeOpen)
  }, [rootCount, welcomeOpen, recomputeEmpty])

  const buildTourView = useCallback(
    (index: number): TourView => {
      const step = getTourStep(index)
      if (!step) return null
      const text = String(copy[step.copyKey] ?? '')
      const total = GUIDED_TOUR_STEPS.length
      const anchorEl = step.anchor ? resolveHighlightTargets(step.anchor)[0] ?? null : null
      const pos = computeTipPosition(anchorEl)
      return {
        index,
        id: step.id,
        text,
        progress: copy.tipProgress(index + 1, total),
        isLast: index >= total - 1,
        style: pos ? { top: pos.top, left: pos.left } : null,
      }
    },
    [copy],
  )

  const showTourAt = useCallback(
    (index: number) => {
      const step = getTourStep(index)
      if (!step) {
        markTourDone()
        setTour(null)
        pulseTargets(null, false)
        setHighlights([])
        return
      }
      setTourProgress(index)
      advancingRef.current = false
      window.setTimeout(() => {
        // Tab already open (session restore) → skip straight to the follow-up tip.
        if (isTourStepAlreadySatisfied(step.id)) {
          const next = index + 1
          if (next >= GUIDED_TOUR_STEPS.length) {
            markTourDone()
            setTour(null)
            pulseTargets(null, false)
            setHighlights([])
            return
          }
          showTourAt(next)
          return
        }
        if (step.id === 'tokenPick' || step.id === 'tokenBind') {
          dispatchOnboardingPrepare(step.id)
          // Wait for Token Studio color filter to paint, then spotlight a top color row.
          window.setTimeout(() => {
            focusTokenBindHighlightTarget()
            const view = buildTourView(index)
            setTour(view)
            pulseTargets(step.anchor, true)
            syncHighlights(step.anchor)
          }, 80)
          return
        }
        if (step.id === 'inlineText') {
          // Wait for the just-inserted canvas node to paint, then spotlight it.
          window.setTimeout(() => {
            const view = buildTourView(index)
            setTour(view)
            pulseTargets(step.anchor, true)
            syncHighlights(step.anchor)
          }, 80)
          return
        }
        const view = buildTourView(index)
        setTour(view)
        pulseTargets(step.anchor, true)
        syncHighlights(step.anchor)
      }, 40)
    },
    [buildTourView, syncHighlights],
  )

  const beginTour = useCallback(
    (delayMs = 480) => {
      if (!shouldStartTour()) return
      setEmptyOpen(false)
      const progress = getTourProgress()
      const index = progress === 'done' ? 0 : progress
      if (tourDelayRef.current != null) window.clearTimeout(tourDelayRef.current)
      tourDelayRef.current = window.setTimeout(() => showTourAt(index), delayMs)
    },
    [showTourAt],
  )

  // Returning visit: welcome seen + not empty (or empty skipped) + tour incomplete → tips.
  // Empty coach takes priority over tour when the board is empty (plan emptyGate → tourGate).
  useEffect(() => {
    if (shouldShowWelcome({ search })) return
    if (shouldShowEmptyCoach({ rootCount, welcomeOpen: false })) return
    if (!shouldStartTour()) return
    beginTour(240)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only resume
  }, [])

  const finishTour = useCallback((opts?: { celebrate?: boolean }) => {
    if (tourDelayRef.current != null) window.clearTimeout(tourDelayRef.current)
    markTourDone()
    setTour(null)
    pulseTargets(null, false)
    setHighlights([])
    advancingRef.current = false
    // After Skip/Done, Empty coach may apply again on a blank artboard.
    setEmptyOpen(shouldShowEmptyCoach({ rootCount, welcomeOpen: false }))
    if (opts?.celebrate) {
      window.setTimeout(() => setDoneOpen(true), 180)
    }
  }, [rootCount])

  const advanceTour = useCallback(() => {
    const current = tourRef.current
    if (!current || advancingRef.current) return
    advancingRef.current = true
    pulseTargets(null, false)
    setHighlights([])
    if (current.isLast) {
      finishTour({ celebrate: true })
      return
    }
    showTourAt(current.index + 1)
  }, [finishTour, showTourAt])

  const completeTourAction = useCallback(
    (action: string) => {
      const current = tourRef.current
      if (!current || advancingRef.current) return
      if (!matchesTourAction(current.id, action)) return
      window.setTimeout(() => advanceTour(), 320)
    },
    [advanceTour],
  )

  useEffect(() => {
    const onAction = (e: Event) => {
      const action = (e as CustomEvent<{ action?: string }>).detail?.action
      if (action) completeTourAction(action)
    }
    const onComposition = (e: Event) => {
      const { rootCount: next } = compositionCountsFromDetail(
        (e as CustomEvent).detail,
      )
      recomputeEmpty(next, welcomeOpen)
    }
    window.addEventListener(paths.onboarding.actionEvent, onAction)
    window.addEventListener(paths.onboarding.compositionChangedEvent, onComposition)
    return () => {
      window.removeEventListener(paths.onboarding.actionEvent, onAction)
      window.removeEventListener(paths.onboarding.compositionChangedEvent, onComposition)
    }
  }, [completeTourAction, recomputeEmpty, welcomeOpen])

  useEffect(() => {
    return () => {
      if (tourDelayRef.current != null) window.clearTimeout(tourDelayRef.current)
      pulseTargets(null, false)
      setHighlights([])
    }
  }, [])

  const closeWelcomeAndMaybeTour = useCallback(() => {
    markWelcomeSeen()
    setWelcomeOpen(false)
    beginTour()
  }, [beginTour])

  const handleExplore = useCallback(() => {
    closeWelcomeAndMaybeTour()
  }, [closeWelcomeAndMaybeTour])

  const handleOpenSample = useCallback(async () => {
    setBusy(true)
    try {
      await onLoadSample()
      markWelcomeSeen()
      setWelcomeOpen(false)
      beginTour(320)
    } finally {
      setBusy(false)
    }
  }, [beginTour, onLoadSample])

  const handleEmptyStart = useCallback(async () => {
    setBusy(true)
    try {
      await onLoadSample()
      markWelcomeSeen()
      setEmptyOpen(false)
      beginTour(320)
    } finally {
      setBusy(false)
    }
  }, [beginTour, onLoadSample])

  const handleEmptyLater = useCallback(() => {
    markEmptyCoachSkipped()
    setEmptyOpen(false)
    beginTour()
  }, [beginTour])

  useEffect(() => {
    if (!welcomeOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleExplore()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [welcomeOpen, handleExplore])

  useEffect(() => {
    if (!doneOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setDoneOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doneOpen])

  const overlay = (
    <>
      {highlights.length > 0 ? (
        <div
          className={
            highlights.length === 1 || insertDropGuide
              ? 'zaoly-onboarding-highlights zaoly-onboarding-highlights--veil'
              : 'zaoly-onboarding-highlights'
          }
          aria-hidden="true"
          data-testid="zaoly-onboarding-highlights"
          data-insert-drop-guide={insertDropGuide ? 'true' : undefined}
        >
          {highlights.map((r, i) => (
            <div
              key={`${Math.round(r.left)}-${Math.round(r.top)}-${i}`}
              className={
                insertDropGuide
                  ? 'zaoly-onboarding-highlight zaoly-onboarding-highlight--drop-zone'
                  : 'zaoly-onboarding-highlight'
              }
              style={{
                top: r.top - 4,
                left: r.left - 4,
                width: r.width + 8,
                height: r.height + 8,
              }}
            />
          ))}
        </div>
      ) : null}
      {welcomeOpen ? (
        <div
          className="zaoly-onboarding-scrim"
          role="dialog"
          aria-modal="true"
          aria-labelledby={welcomeTitleId}
          data-testid="zaoly-onboarding-welcome"
        >
          <div className="zaoly-onboarding-scrim__glow" aria-hidden="true" />
          <div className="zaoly-onboarding-welcome">
            <BrandRow label={copy.brandLabel} />
            <h2 id={welcomeTitleId} className="zaoly-onboarding-title">
              {copy.welcomeTitle}
            </h2>
            <p className="zaoly-onboarding-body">{copy.welcomeBody}</p>
            <div className="zaoly-onboarding-actions">
              <div className="zaoly-onboarding-action zaoly-onboarding-action--primary">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy}
                  aria-busy={busy || undefined}
                  onClick={() => void handleOpenSample()}
                >
                  {busy ? copy.busyOpen : copy.openSample}
                </Button>
                <span className="zaoly-onboarding-action__hint">{copy.openSampleHint}</span>
              </div>
              <button type="button" className="zaoly-onboarding-explore" onClick={handleExplore}>
                {copy.explore}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {emptyOpen && !welcomeOpen && !tour ? (
        <div className="zaoly-onboarding-scrim zaoly-onboarding-scrim--soft" data-testid="zaoly-onboarding-empty">
          <div
            className="zaoly-onboarding-empty"
            role="dialog"
            aria-modal="true"
            aria-labelledby={emptyTitleId}
          >
            <BrandRow label={copy.brandLabel} />
            <h2 id={emptyTitleId} className="zaoly-onboarding-title">
              {copy.emptyTitle}
            </h2>
            <p className="zaoly-onboarding-body">{copy.emptyBody}</p>
            <div className="zaoly-onboarding-actions">
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => void handleEmptyStart()}
              >
                {busy ? copy.busyOpen : copy.letsStart}
              </Button>
              <button type="button" className="zaoly-onboarding-explore" onClick={handleEmptyLater}>
                {copy.later}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tour ? (
        <div
          ref={tipElRef}
          className={
            tipDrag || tour.style
              ? tipDrag
                ? 'zaoly-onboarding-tip zaoly-onboarding-tip--dragging'
                : 'zaoly-onboarding-tip'
              : 'zaoly-onboarding-tip zaoly-onboarding-tip--bottom'
          }
          style={tipDrag ?? tour.style ?? undefined}
          role="status"
          data-testid="zaoly-onboarding-tip"
          data-tour-step={tour.id}
          data-dragging={tipDrag ? 'true' : undefined}
        >
          <button
            type="button"
            className="zaoly-onboarding-tip__drag"
            data-testid="zaoly-onboarding-tip-drag"
            aria-label={copy.tipDrag}
            onPointerDown={(e: ReactPointerEvent<HTMLButtonElement>) => {
              if (e.button !== 0) return
              e.preventDefault()
              const el = tipElRef.current
              if (!el) return
              const rect = el.getBoundingClientRect()
              const origin = tipDrag ?? { top: rect.top, left: rect.left }
              tipDragRef.current = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                originTop: origin.top,
                originLeft: origin.left,
              }
              setTipDrag(origin)
              try {
                e.currentTarget.setPointerCapture?.(e.pointerId)
              } catch {
                /* jsdom / unsupported */
              }
            }}
            onPointerMove={(e: ReactPointerEvent<HTMLButtonElement>) => {
              const drag = tipDragRef.current
              if (!drag || drag.pointerId !== e.pointerId) return
              const next = clampTipDragPosition(
                drag.originTop + (e.clientY - drag.startY),
                drag.originLeft + (e.clientX - drag.startX),
              )
              setTipDrag(next)
            }}
            onPointerUp={(e: ReactPointerEvent<HTMLButtonElement>) => {
              if (tipDragRef.current?.pointerId === e.pointerId) {
                tipDragRef.current = null
                try {
                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                } catch {
                  /* ignore */
                }
              }
            }}
            onPointerCancel={() => {
              tipDragRef.current = null
            }}
          >
            <span className="zaoly-onboarding-tip__progress">{tour.progress}</span>
            <span className="zaoly-onboarding-tip__drag-hint" aria-hidden="true">
              ∷
            </span>
          </button>
          <p className="zaoly-onboarding-tip__text">{tour.text}</p>
          <div className="zaoly-onboarding-tip__nav">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => finishTour({ celebrate: false })}
            >
              {copy.tipSkip}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={advanceTour}>
              {tour.isLast ? copy.tipDone : copy.tipNext}
            </Button>
          </div>
        </div>
      ) : null}

      {doneOpen ? (
        <div
          className="zaoly-onboarding-scrim"
          role="dialog"
          aria-modal="true"
          aria-labelledby={doneTitleId}
          data-testid="zaoly-onboarding-done"
        >
          <div className="zaoly-onboarding-scrim__glow" aria-hidden="true" />
          <div className="zaoly-onboarding-done">
            <BrandRow label={copy.brandLabel} />
            <h2 id={doneTitleId} className="zaoly-onboarding-title">
              {copy.doneTitle}
            </h2>
            <p className="zaoly-onboarding-body">{copy.doneBody}</p>
            <Button type="button" variant="primary" onClick={() => setDoneOpen(false)}>
              {copy.doneCta}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )

  // Escape `.page-body { z-index: 0 }` so tips/scrims paint above hub bar + tool strip.
  if (!portalReady || typeof document === 'undefined') return null
  return createPortal(overlay, document.body)
}

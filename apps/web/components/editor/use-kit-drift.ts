'use client'

/**
 * Probe Kit seed revisions vs Master kitRevision for drift banner.
 * Spec: site-kit-kit-pull.md
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CompositionScene } from '@zaoly/contracts'
import {
  assessKitDrift,
  kitDriftDismissFingerprint,
  readDismissedKitDriftFingerprint,
  writeDismissedKitDriftFingerprint,
  type KitDriftSummary,
  type MasterKitDrift,
} from '../../lib/site-kit/kit-drift'
import { kitComponentIdForMaster } from '../../lib/site-kit/pull-merge'
import { requestSiteKitSeedRevisions } from '../../lib/site-kit/seed-revisions-client'

const POLL_MS = 90_000

export function useKitDrift(scene: CompositionScene) {
  const [summary, setSummary] = useState<KitDriftSummary | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [probeNonce, setProbeNonce] = useState(0)

  const mastersKey = useMemo(() => {
    const masters = scene.masters ?? []
    return masters
      .map((m) => `${m.id}:${m.kitRevision ?? ''}:${m.sourceKey ?? m.root.type}`)
      .join('|')
  }, [scene.masters])

  const refreshDrift = useCallback(() => {
    setProbeNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    setDismissed(readDismissedKitDriftFingerprint())
  }, [])

  useEffect(() => {
    let cancelled = false
    const masters = scene.masters ?? []
    const platformProjectId = scene.platformProjectId
    const componentIds = masters
      .map((m) => kitComponentIdForMaster(m, platformProjectId))
      .filter((id): id is string => Boolean(id))

    if (componentIds.length === 0) {
      setSummary(null)
      return
    }

    void requestSiteKitSeedRevisions(componentIds)
      .then((rows) => {
        if (cancelled) return
        const map = new Map(rows.map((r) => [r.componentId, r.kitRevision]))
        setSummary(assessKitDrift(masters, map, platformProjectId))
      })
      .catch(() => {
        if (!cancelled) setSummary(null)
      })

    return () => {
      cancelled = true
    }
  }, [mastersKey, scene.platformProjectId, scene.masters, probeNonce])

  useEffect(() => {
    if (!scene.masters?.length) return
    const timer = window.setInterval(() => {
      setProbeNonce((n) => n + 1)
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [scene.id, scene.masters?.length])

  const visibleActionable: MasterKitDrift[] = useMemo(() => {
    if (!summary?.actionable.length) return []
    const token = kitDriftDismissFingerprint(scene.id, summary.fingerprint)
    if (dismissed && dismissed === token) return []
    return summary.actionable
  }, [summary, dismissed, scene.id])

  const dismiss = useCallback(() => {
    if (!summary) return
    const token = kitDriftDismissFingerprint(scene.id, summary.fingerprint)
    writeDismissedKitDriftFingerprint(token)
    setDismissed(token)
  }, [summary, scene.id])

  return {
    summary,
    visibleActionable,
    driftCount: visibleActionable.length,
    refreshDrift,
    dismissDrift: dismiss,
  }
}

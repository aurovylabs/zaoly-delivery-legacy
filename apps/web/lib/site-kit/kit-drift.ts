/**
 * Kit drift — Master kitRevision vs latest seed (dev → design round-trip).
 * Spec: site-kit-kit-pull.md
 */
import type { SceneMaster } from '@zaoly/contracts'
import { kitComponentIdForMaster } from './pull-merge'

export type KitDriftKind = 'synced' | 'kit-newer' | 'never-pulled' | 'unknown'

export type MasterKitDrift = {
  masterId: string
  masterName: string
  componentId: string
  localRevision: string | null
  remoteRevision: string | null
  kind: KitDriftKind
}

export type KitDriftSummary = {
  rows: MasterKitDrift[]
  actionable: MasterKitDrift[]
  kitNewerCount: number
  neverPulledCount: number
  fingerprint: string
}

export function classifyKitDrift(
  localRevision: string | null | undefined,
  remoteRevision: string | null | undefined,
): KitDriftKind {
  const remote = remoteRevision?.trim() || null
  if (!remote) return 'unknown'
  const local = localRevision?.trim() || null
  if (!local) return 'never-pulled'
  if (local === remote) return 'synced'
  return 'kit-newer'
}

/** Banner only for true revision mismatch — never-pulled starters stay quiet. */
export function isActionableKitDrift(kind: KitDriftKind): boolean {
  return kind === 'kit-newer'
}

export function assessKitDrift(
  masters: readonly SceneMaster[],
  remoteByComponentId: ReadonlyMap<string, string>,
  platformProjectId?: string | null,
): KitDriftSummary {
  const rows: MasterKitDrift[] = []
  for (const master of masters) {
    const componentId = kitComponentIdForMaster(master, platformProjectId)
    if (!componentId) continue
    const remoteRevision = remoteByComponentId.get(componentId) ?? null
    const localRevision = master.kitRevision?.trim() || null
    const kind = classifyKitDrift(localRevision, remoteRevision)
    rows.push({
      masterId: master.id,
      masterName: master.name?.trim() || master.id,
      componentId,
      localRevision,
      remoteRevision,
      kind,
    })
  }

  const actionable = rows.filter((r) => isActionableKitDrift(r.kind))
  const kitNewerCount = rows.filter((r) => r.kind === 'kit-newer').length
  const neverPulledCount = rows.filter((r) => r.kind === 'never-pulled').length
  const fingerprint = actionable
    .map((r) => `${r.masterId}:${r.remoteRevision ?? ''}`)
    .sort()
    .join('|')

  return {
    rows,
    actionable,
    kitNewerCount,
    neverPulledCount,
    fingerprint,
  }
}

export const KIT_DRIFT_DISMISS_STORAGE_KEY = 'zaoly.kit.drift.dismissed.v1'

export function kitDriftDismissFingerprint(
  sceneId: string,
  fingerprint: string,
): string {
  return `${sceneId}::${fingerprint}`
}

export function readDismissedKitDriftFingerprint(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(KIT_DRIFT_DISMISS_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeDismissedKitDriftFingerprint(value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KIT_DRIFT_DISMISS_STORAGE_KEY, value)
  } catch {
    /* private mode */
  }
}

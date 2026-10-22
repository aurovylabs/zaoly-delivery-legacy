/**
 * Persistable VIDEON still ref (client-safe).
 * Spec: specs/domain/videon-asset-consume.md
 */

export const VIDEON_MEDIA_REF_PROP = 'videonMediaRef' as const

export const DEFAULT_VIDEON_FRAME_T_MS = 1000

export type VideonMediaRef = {
  source: 'videon'
  mediaAssetId: string
  platformProjectId: string
  kind: 'frame'
  tMs?: number
}

/** Build persistable videonMediaRef JSON for scene props. */
export function buildVideonMediaRefJson(input: {
  mediaAssetId: string
  platformProjectId: string
  tMs?: number
}): string {
  const ref: VideonMediaRef = {
    source: 'videon',
    mediaAssetId: input.mediaAssetId,
    platformProjectId: input.platformProjectId,
    kind: 'frame',
    tMs: input.tMs ?? DEFAULT_VIDEON_FRAME_T_MS,
  }
  return JSON.stringify(ref)
}

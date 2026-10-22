/**
 * Server-only VIDEON media fetch for CREATION Asset Library (P0 stills).
 * Spec: specs/domain/videon-asset-consume.md · specs/api/videon-media-bff.md
 * Browser MUST NOT import this with a secret — keep it in the BFF routes.
 */
import { getFederationContractHeaders } from '../federation-contract'
import { isRealPlatformProjectId } from '../platform-project-id'
import {
  videonMediaFrameUrl,
  videonUpstreamMediaFrameUrl,
  videonUpstreamMediaListUrl,
} from '../paths'
import { getServiceSecret, videonApiUrl } from '../runtime-config'
import { DEFAULT_VIDEON_FRAME_T_MS } from './videon-media-ref'

export {
  buildVideonMediaRefJson,
  DEFAULT_VIDEON_FRAME_T_MS,
  VIDEON_MEDIA_REF_PROP,
  type VideonMediaRef,
} from './videon-media-ref'

export type VideonMediaListItem = {
  id: string
  originalFilename: string
  mimeType: string
  lifecycleState: string
  durationMs: number | null
  sceneCount: number
  frameUrl: string
}

export type VideonMediaListResult =
  | { ok: true; platformProjectId: string; items: VideonMediaListItem[] }
  | { ok: false; status: number; error: string }

const THUMB_W = 240

export function defaultVideonFrameTMs(): number {
  return DEFAULT_VIDEON_FRAME_T_MS
}

export async function fetchVideonMediaList(
  platformProjectId: string,
  actorUserId: string,
): Promise<VideonMediaListResult> {
  const pid = platformProjectId.trim()
  if (!pid || !isRealPlatformProjectId(pid)) {
    return { ok: false, status: 400, error: 'platform_project_required' }
  }
  const base = videonApiUrl()
  const secret = getServiceSecret()
  if (!base) return { ok: false, status: 503, error: 'videon_unconfigured' }
  if (!secret) return { ok: false, status: 503, error: 'service_secret_missing' }

  try {
    const res = await fetch(videonUpstreamMediaListUrl(base, pid), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ...getFederationContractHeaders(secret),
        'X-Actor-User-Id': actorUserId,
      },
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    })
    if (res.status === 401) return { ok: false, status: 502, error: 'videon_unauthorized' }
    if (res.status === 403) return { ok: false, status: 403, error: 'collection_access_denied' }
    if (res.status === 404) {
      return { ok: true, platformProjectId: pid, items: [] }
    }
    if (!res.ok) return { ok: false, status: 502, error: `videon_list_failed_${res.status}` }

    const body = (await res.json()) as { items?: unknown }
    const raw = Array.isArray(body.items) ? body.items : []
    const items: VideonMediaListItem[] = []
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue
      const row = entry as Record<string, unknown>
      if (typeof row.id !== 'string' || !row.id) continue
      const lifecycle =
        typeof row.lifecycleState === 'string' ? row.lifecycleState : 'unknown'
      // Prefer ready media; still show others so designers see processing state.
      items.push({
        id: row.id,
        originalFilename:
          typeof row.originalFilename === 'string' ? row.originalFilename : row.id,
        mimeType: typeof row.mimeType === 'string' ? row.mimeType : 'application/octet-stream',
        lifecycleState: lifecycle,
        durationMs: typeof row.durationMs === 'number' ? row.durationMs : null,
        sceneCount: typeof row.sceneCount === 'number' ? row.sceneCount : 0,
        frameUrl: videonMediaFrameUrl(row.id, pid, {
          tMs: DEFAULT_VIDEON_FRAME_T_MS,
          w: THUMB_W,
        }),
      })
    }
    return { ok: true, platformProjectId: pid, items }
  } catch {
    return { ok: false, status: 502, error: 'videon_unreachable' }
  }
}

export type VideonFrameResult =
  | { ok: true; bytes: ArrayBuffer; contentType: string }
  | { ok: false; status: number; error: string }

export async function fetchVideonMediaFrame(input: {
  mediaAssetId: string
  platformProjectId: string
  actorUserId: string
  tMs?: number
  w?: number
}): Promise<VideonFrameResult> {
  const mediaAssetId = input.mediaAssetId.trim()
  const pid = input.platformProjectId.trim()
  if (!mediaAssetId || !pid || !isRealPlatformProjectId(pid)) {
    return { ok: false, status: 400, error: 'fields_required' }
  }
  const base = videonApiUrl()
  const secret = getServiceSecret()
  if (!base) return { ok: false, status: 503, error: 'videon_unconfigured' }
  if (!secret) return { ok: false, status: 503, error: 'service_secret_missing' }

  const tMs =
    input.tMs != null && Number.isFinite(input.tMs)
      ? Math.max(0, Math.round(input.tMs))
      : DEFAULT_VIDEON_FRAME_T_MS
  const w = input.w != null && Number.isFinite(input.w) ? Math.round(input.w) : 480

  try {
    const res = await fetch(
      videonUpstreamMediaFrameUrl(base, mediaAssetId, pid, { tMs, w }),
      {
        method: 'GET',
        headers: {
          Accept: 'image/jpeg',
          ...getFederationContractHeaders(secret),
          'X-Actor-User-Id': input.actorUserId,
        },
        signal: AbortSignal.timeout(20_000),
        cache: 'no-store',
      },
    )
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status, error: 'forbidden' }
    }
    if (res.status === 404) return { ok: false, status: 404, error: 'not_found' }
    if (!res.ok) return { ok: false, status: 502, error: `videon_frame_failed_${res.status}` }
    const bytes = await res.arrayBuffer()
    return {
      ok: true,
      bytes,
      contentType: res.headers.get('Content-Type') ?? 'image/jpeg',
    }
  } catch {
    return { ok: false, status: 502, error: 'videon_unreachable' }
  }
}

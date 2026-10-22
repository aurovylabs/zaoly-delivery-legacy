/**
 * HTTP client for the Zaoly web BFF.
 * Auth: ZAOLY_SERVICE_SECRET + X-Actor-User-Id for service writes.
 */

const CONTRACT =
  process.env.ZAOLY_FEDERATION_CONTRACT_VERSION?.trim() || '2026-05-zaoly-federation-v3'

function zaolyApiBaseUrl(): string {
  return process.env.ZAOLY_API_URL?.trim() || ''
}

function serviceSecret(): string {
  return process.env.ZAOLY_SERVICE_SECRET?.trim() || ''
}

/** Matches apps/web/lib/require-scene-api-access.ts */
export const ACTOR_USER_ID_HEADER = 'X-Actor-User-Id'
export const ZAOLY_ACTOR_LABEL_HEADER = 'X-Actor-Label'
export const SERVICE_SECRET_HEADER = 'X-Service-Secret'
/** Matches apps/web/lib/federation-contract.ts */
export const CONTRACT_VERSION_HEADER = 'X-Federation-Contract-Version'

export type ZaolyFetchOptions = {
  actorUserId?: string
  actorLabel?: string
}

export interface ZaolyFetchError {
  error: true
  message: string
  status?: number
  code?: string
  reason?: string
  failedIndex?: number
  op?: unknown
  scene?: { id?: string; updatedAt?: string }
  [key: string]: unknown
}

export function buildZaolyHeaders(
  opts: ZaolyFetchOptions = {},
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  if (serviceSecret()) {
    headers[SERVICE_SECRET_HEADER] = serviceSecret()
    headers[CONTRACT_VERSION_HEADER] = CONTRACT
  }
  const actor = opts.actorUserId?.trim()
  if (actor) headers[ACTOR_USER_ID_HEADER] = actor
  const label = opts.actorLabel?.trim()
  if (label) headers[ZAOLY_ACTOR_LABEL_HEADER] = label
  return headers
}

export type ZaolyRequestInit = RequestInit & {
  zaoly?: ZaolyFetchOptions
}

function messageFromErrorBody(body: Record<string, unknown>, status: number): string {
  if (typeof body.reason === 'string' && body.reason.trim()) return body.reason.trim()
  if (typeof body.detail === 'string' && body.detail.trim()) return body.detail.trim()
  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
  if (typeof body.error === 'string' && body.error.trim()) return body.error.trim()
  return `HTTP ${status}`
}

export async function zaolyFetch<T = unknown>(
  path: string,
  options: ZaolyRequestInit = {},
): Promise<T | ZaolyFetchError> {
  if (!zaolyApiBaseUrl()) {
    return { error: true, message: 'ZAOLY_API_URL not configured' }
  }
  const { zaoly, ...fetchOptions } = options
  const actorOpts = zaoly ?? {}
  const base = zaolyApiBaseUrl()
  const url = path.startsWith('http')
    ? path
    : `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  const headers = buildZaolyHeaders(actorOpts, fetchOptions.headers as Record<string, string>)
  try {
    const res = await fetch(url, { ...fetchOptions, headers })
    const text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      return {
        error: true,
        message: res.ok ? text || 'Empty response' : `HTTP ${res.status}: ${text.slice(0, 200)}`,
        status: res.status,
      }
    }
    if (!res.ok) {
      const body =
        data && typeof data === 'object' && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : {}
      const code = typeof body.error === 'string' ? body.error : undefined
      const scene =
        body.scene && typeof body.scene === 'object' && !Array.isArray(body.scene)
          ? (body.scene as { id?: string; updatedAt?: string })
          : undefined
      return {
        ...body,
        error: true,
        code,
        message: messageFromErrorBody(body, res.status),
        status: res.status,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
        failedIndex: typeof body.failedIndex === 'number' ? body.failedIndex : undefined,
        op: body.op,
        scene,
      }
    }
    return data as T
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { error: true, message: `Request failed: ${message}` }
  }
}

export function isZaolyError<T>(r: T | ZaolyFetchError): r is ZaolyFetchError {
  return typeof r === 'object' && r !== null && 'error' in r && (r as ZaolyFetchError).error === true
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  FEDERATION_CONTRACT_VERSION_HEADER,
  FEDERATION_CONTRACT_VERSION,
  SERVICE_SECRET_HEADER,
} from '../lib/federation-contract'
import { paths, videonMediaFrameUrl, videonMediaListUrl } from '../lib/paths'
import { ACTOR_USER_ID_HEADER } from '../lib/require-scene-api-access'
import {
  fetchVideonMediaFrame,
  fetchVideonMediaList,
} from '../lib/videon/fetch-videon-media'
import {
  buildVideonMediaRefJson,
  DEFAULT_VIDEON_FRAME_T_MS,
  VIDEON_MEDIA_REF_PROP,
} from '../lib/videon/videon-media-ref'

const COLLECTION_UUID = '550e8400-e29b-41d4-a716-446655440000'
const MEDIA_ID = 'media-asset-1'
const VIDEON_ORIGIN = 'https://videon.test.example'

describe('VIDEON media BFF (P0 stills)', () => {
  const prevVideon = process.env[paths.envVideonApiUrl]
  const prevPublic = process.env[paths.envVideonPublicUrl]
  const prevSecret = process.env[paths.envServiceSecret]
  const fetchImpl = globalThis.fetch

  afterEach(() => {
    if (prevVideon == null) delete process.env[paths.envVideonApiUrl]
    else process.env[paths.envVideonApiUrl] = prevVideon
    if (prevPublic == null) delete process.env[paths.envVideonPublicUrl]
    else process.env[paths.envVideonPublicUrl] = prevPublic
    if (prevSecret == null) delete process.env[paths.envServiceSecret]
    else process.env[paths.envServiceSecret] = prevSecret
    globalThis.fetch = fetchImpl
    vi.restoreAllMocks()
  })

  it('builds list and frame BFF URLs from paths helpers', () => {
    expect(videonMediaListUrl(COLLECTION_UUID)).toBe(
      `${paths.routes.apiVideonMedia}?${paths.activePackQueryKey}=${encodeURIComponent(COLLECTION_UUID)}`,
    )
    expect(videonMediaFrameUrl(MEDIA_ID, COLLECTION_UUID, { tMs: 1000, w: 240 })).toContain(
      paths.routes.apiVideonMediaFrame(MEDIA_ID),
    )
    expect(videonMediaFrameUrl(MEDIA_ID, COLLECTION_UUID, { tMs: 1000, w: 240 })).toContain('t=1000')
    expect(videonMediaFrameUrl(MEDIA_ID, COLLECTION_UUID, { tMs: 1000, w: 240 })).toContain('w=240')
  })

  it('buildVideonMediaRefJson persists source/kind/tMs', () => {
    const json = buildVideonMediaRefJson({
      mediaAssetId: MEDIA_ID,
      platformProjectId: COLLECTION_UUID,
    })
    expect(JSON.parse(json)).toEqual({
      source: 'videon',
      mediaAssetId: MEDIA_ID,
      platformProjectId: COLLECTION_UUID,
      kind: 'frame',
      tMs: DEFAULT_VIDEON_FRAME_T_MS,
    })
    expect(VIDEON_MEDIA_REF_PROP).toBe('videonMediaRef')
  })

  it('returns 503 when VIDEON is unconfigured', async () => {
    delete process.env[paths.envVideonApiUrl]
    delete process.env[paths.envVideonPublicUrl]
    process.env[paths.envServiceSecret] = 'test-service-secret'
    const spy = vi.fn()
    globalThis.fetch = spy as typeof fetch
    const result = await fetchVideonMediaList(COLLECTION_UUID, 'actor-1')
    expect(result).toEqual({ ok: false, status: 503, error: 'videon_unconfigured' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns 503 when service secret is missing', async () => {
    process.env[paths.envVideonApiUrl] = VIDEON_ORIGIN
    delete process.env[paths.envServiceSecret]
    const spy = vi.fn()
    globalThis.fetch = spy as typeof fetch
    const result = await fetchVideonMediaList(COLLECTION_UUID, 'actor-1')
    expect(result).toEqual({ ok: false, status: 503, error: 'service_secret_missing' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns 400 for non-UUID platformProjectId', async () => {
    process.env[paths.envVideonApiUrl] = VIDEON_ORIGIN
    process.env[paths.envServiceSecret] = 'test-service-secret'
    const result = await fetchVideonMediaList('plx-local-demo', 'actor-1')
    expect(result).toEqual({ ok: false, status: 400, error: 'platform_project_required' })
  })

  it('lists media with service headers and same-origin frameUrl', async () => {
    process.env[paths.envVideonApiUrl] = VIDEON_ORIGIN
    process.env[paths.envServiceSecret] = 'test-service-secret'
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      expect(url).toContain(`${VIDEON_ORIGIN}${paths.videonMediaListPath}`)
      expect(url).toContain(paths.activePackQueryKey)
      const headers = new Headers(init?.headers)
      expect(headers.get(SERVICE_SECRET_HEADER)).toBe('test-service-secret')
      expect(headers.get(FEDERATION_CONTRACT_VERSION_HEADER)).toBe(FEDERATION_CONTRACT_VERSION)
      expect(headers.get(ACTOR_USER_ID_HEADER)).toBe('actor-1')
      return new Response(
        JSON.stringify({
          items: [
            {
              id: MEDIA_ID,
              originalFilename: 'hero.mp4',
              mimeType: 'video/mp4',
              lifecycleState: 'ready',
              durationMs: 12_000,
              sceneCount: 3,
            },
          ],
        }),
        { status: 200 },
      )
    })
    globalThis.fetch = fetchMock as typeof fetch
    const result = await fetchVideonMediaList(COLLECTION_UUID, 'actor-1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.id).toBe(MEDIA_ID)
    expect(result.items[0]?.frameUrl).toBe(
      videonMediaFrameUrl(MEDIA_ID, COLLECTION_UUID, { tMs: DEFAULT_VIDEON_FRAME_T_MS, w: 240 }),
    )
    expect(result.items[0]?.frameUrl.startsWith('/api/videon-media/')).toBe(true)
  })

  it('maps upstream 404 list to empty items', async () => {
    process.env[paths.envVideonApiUrl] = VIDEON_ORIGIN
    process.env[paths.envServiceSecret] = 'test-service-secret'
    globalThis.fetch = vi.fn(async () => new Response('', { status: 404 })) as typeof fetch
    const result = await fetchVideonMediaList(COLLECTION_UUID, 'actor-1')
    expect(result).toEqual({ ok: true, platformProjectId: COLLECTION_UUID, items: [] })
  })

  it('proxies frame bytes with JPEG content-type', async () => {
    process.env[paths.envVideonApiUrl] = VIDEON_ORIGIN
    process.env[paths.envServiceSecret] = 'test-service-secret'
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
    globalThis.fetch = vi.fn(async () => {
      return new Response(jpeg, {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    }) as typeof fetch
    const result = await fetchVideonMediaFrame({
      mediaAssetId: MEDIA_ID,
      platformProjectId: COLLECTION_UUID,
      actorUserId: 'actor-1',
      tMs: 500,
      w: 480,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.contentType).toBe('image/jpeg')
    expect(result.bytes.byteLength).toBe(4)
  })

  it('list + frame routes return suite_out_of_scope (VIDEON retired on Zaoly)', () => {
    const listSrc = readFileSync(
      path.join(__dirname, '../app/api/videon-media/route.ts'),
      'utf8',
    )
    const frameSrc = readFileSync(
      path.join(__dirname, '../app/api/videon-media/[mediaAssetId]/frame/route.ts'),
      'utf8',
    )
    expect(listSrc).toContain('export async function GET')
    expect(listSrc).toContain('suiteOutOfScopeResponse')
    expect(frameSrc).toContain('export async function GET')
    expect(frameSrc).toContain('suiteOutOfScopeResponse')
    expect(ACTOR_USER_ID_HEADER).toBe('X-Actor-User-Id')
  })

  it('keeps service secret env keys out of Asset Library client module', () => {
    const src = readFileSync(
      path.join(__dirname, '../components/editor-asset-library-dialog.tsx'),
      'utf8',
    )
    expect(src).not.toContain('ZAOLY_SERVICE_SECRET')
    expect(src).not.toContain('ZAOLY_SERVICE_SECRET')
    expect(src).not.toContain('getServiceSecret')
    expect(src).not.toContain('fetch-videon-media')
    expect(src).toContain('videonMediaListUrl')
    expect(src).toContain('buildVideonMediaRefJson')
  })
})

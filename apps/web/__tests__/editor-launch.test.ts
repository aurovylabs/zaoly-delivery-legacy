import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetLaunchCodeStoreForTests,
  mintLaunchCode,
  redeemLaunchCode,
} from '../lib/launch-token'
import {
  buildEditorLaunchUrl,
  EDITOR_INSERT_TYPE_QUERY_PARAM,
  EDITOR_LAUNCH_CODE_QUERY_PARAM,
  EDITOR_PLATFORM_PROJECT_QUERY_PARAM,
} from '../lib/editor-launch'
import { editorDeepLinkUrl } from '../lib/runtime-config'
import { paths } from '../lib/paths'

describe('editor launch', () => {
  const prev = process.env.ZAOLY_EDITOR_URL

  afterEach(() => {
    vi.unstubAllEnvs()
    if (prev === undefined) delete process.env.ZAOLY_EDITOR_URL
    else process.env.ZAOLY_EDITOR_URL = prev
  })

  it('builds absolute launch URL with platformProjectId and launchCode', () => {
    expect(buildEditorLaunchUrl('http://127.0.0.1:5174/')).toBe('http://127.0.0.1:5174/')
    const withBoth = buildEditorLaunchUrl('http://127.0.0.1:5174', {
      platformProjectId: 'col-1',
      launchCode: 'abc.def',
    })
    expect(withBoth).toContain(`${EDITOR_PLATFORM_PROJECT_QUERY_PARAM}=col-1`)
    expect(withBoth).toContain(`${EDITOR_LAUNCH_CODE_QUERY_PARAM}=abc.def`)
  })

  it('builds relative /editor href with insertType (SK-V6)', () => {
    const href = buildEditorLaunchUrl('/editor', {
      platformProjectId: 'col-9',
      insertType: 'SiteButton',
    })
    expect(href.startsWith('/editor?')).toBe(true)
    expect(href).toContain(`${EDITOR_PLATFORM_PROJECT_QUERY_PARAM}=col-9`)
    expect(href).toContain(`${EDITOR_INSERT_TYPE_QUERY_PARAM}=SiteButton`)
  })

  it('uses env when set', () => {
    process.env.ZAOLY_EDITOR_URL = 'https://editor.example/'
    expect(editorDeepLinkUrl()).toBe('https://editor.example')
  })

  it('falls back locally outside production', () => {
    delete process.env.ZAOLY_EDITOR_URL
    vi.stubEnv('NODE_ENV', 'development')
    expect(editorDeepLinkUrl()).toBe(paths.editorDevFallbackHttp)
  })

  it('returns null in production when unset', () => {
    delete process.env.ZAOLY_EDITOR_URL
    vi.stubEnv('NODE_ENV', 'production')
    expect(editorDeepLinkUrl()).toBeNull()
  })
})

describe('launch token (memory)', () => {
  beforeEach(() => {
    delete process.env[paths.envRedisUrl]
    __resetLaunchCodeStoreForTests()
  })

  it('mints and redeems once', async () => {
    const minted = await mintLaunchCode({
      userId: 'u1',
      email: 'a@example.com',
      name: 'Ada',
      platformProjectId: 'col-1',
    })
    const first = await redeemLaunchCode(minted.launchCode)
    expect(first.ok).toBe(true)
    if (first.ok) {
      expect(first.claims.email).toBe('a@example.com')
      expect(first.claims.platformProjectId).toBe('col-1')
    }
    const second = await redeemLaunchCode(minted.launchCode)
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.error).toBe('consumed')
  })

  it('rejects tampered codes', async () => {
    const minted = await mintLaunchCode({ userId: 'u1', email: 'a@example.com' })
    const bad = await redeemLaunchCode(`${minted.launchCode}x`)
    expect(bad.ok).toBe(false)
  })

  it('rejects expired codes', async () => {
    const minted = await mintLaunchCode({
      userId: 'u1',
      email: 'a@example.com',
      ttlSeconds: -1,
    })
    const result = await redeemLaunchCode(minted.launchCode)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('expired')
  })
})

describe('launch token (redis backend)', () => {
  const redisStore = new Map<string, string>()
  const redis = {
    status: 'ready' as const,
    set: vi.fn(async (key: string, value: string) => {
      redisStore.set(key, value)
      return 'OK'
    }),
    getdel: vi.fn(async (key: string) => {
      const value = redisStore.get(key) ?? null
      redisStore.delete(key)
      return value
    }),
  }

  beforeEach(() => {
    redisStore.clear()
    redis.set.mockClear()
    redis.getdel.mockClear()
    vi.resetModules()
    vi.doMock('../lib/runtime-config', async () => {
      const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
        '../lib/runtime-config',
      )
      return {
        ...actual,
        isRedisConfigured: () => true,
      }
    })
    vi.doMock('../lib/redis/zaoly-redis', () => ({
      getRedisPublisher: () => redis,
      ensureRedisConnected: async () => true,
      launchCodeRedisKey: (jti: string) => `zaoly:launch:${jti}`,
    }))
  })

  afterEach(() => {
    vi.doUnmock('../lib/runtime-config')
    vi.doUnmock('../lib/redis/zaoly-redis')
    vi.resetModules()
  })

  it('mints via SET and consumes once via GETDEL', async () => {
    const { mintLaunchCode: mint, redeemLaunchCode: redeem } = await import('../lib/launch-token')
    const minted = await mint({
      userId: 'u2',
      email: 'redis@example.com',
      platformProjectId: 'col-r',
    })
    expect(redis.set).toHaveBeenCalled()
    const first = await redeem(minted.launchCode)
    expect(first.ok).toBe(true)
    expect(redis.getdel).toHaveBeenCalled()
    const second = await redeem(minted.launchCode)
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.error).toBe('consumed')
  })

  it('fails mint when redis is unavailable', async () => {
    vi.resetModules()
    vi.doMock('../lib/runtime-config', async () => {
      const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
        '../lib/runtime-config',
      )
      return {
        ...actual,
        isRedisConfigured: () => true,
      }
    })
    vi.doMock('../lib/redis/zaoly-redis', () => ({
      getRedisPublisher: () => null,
      ensureRedisConnected: async () => false,
      launchCodeRedisKey: (jti: string) => `zaoly:launch:${jti}`,
    }))
    const { mintLaunchCode: mint } = await import('../lib/launch-token')
    await expect(mint({ userId: 'u3', email: 'x@example.com' })).rejects.toThrow(
      'launch_store_unavailable',
    )
  })
})

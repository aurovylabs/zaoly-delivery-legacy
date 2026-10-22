import { describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'

describe('request-origin allowlist', () => {
  it('allows missing Origin', async () => {
    const { isAllowedMutatingApiOrigin } = await import('../lib/request-origin')
    expect(isAllowedMutatingApiOrigin(null)).toBe(true)
    expect(isAllowedMutatingApiOrigin('')).toBe(true)
  })

  it('allows localhost and staging creation origins', async () => {
    vi.stubEnv(paths.envPublicUrl, 'https://creation-v3.projects-a.plygrnd.tech')
    vi.resetModules()
    const { isAllowedMutatingApiOrigin, allowedMutatingApiOrigins } = await import(
      '../lib/request-origin'
    )
    const allowed = allowedMutatingApiOrigins()
    expect(allowed).toContain('https://creation-v3.projects-a.plygrnd.tech')
    expect(allowed).toContain(`http://localhost:${paths.devPort}`)
    expect(isAllowedMutatingApiOrigin('https://evil.example')).toBe(false)
    expect(isAllowedMutatingApiOrigin(`http://localhost:${paths.devPort}`)).toBe(true)
  })

  it('classifies mutating methods', async () => {
    const { isMutatingApiMethod } = await import('../lib/request-origin')
    expect(isMutatingApiMethod('POST')).toBe(true)
    expect(isMutatingApiMethod('get')).toBe(false)
  })
})

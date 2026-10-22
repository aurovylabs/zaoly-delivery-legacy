import { describe, expect, it } from 'vitest'
import { SUITE_OUT_OF_SCOPE } from '../lib/out-of-scope-response'

describe('retired suite API routes (410)', () => {
  it('GET /api/federation/health', async () => {
    const { GET } = await import('../app/api/federation/health/route')
    const res = await GET()
    expect(res.status).toBe(410)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe(SUITE_OUT_OF_SCOPE)
  })

  it('GET /api/projects/:id/members', async () => {
    const { GET } = await import('../app/api/projects/[id]/members/route')
    const res = await GET()
    expect(res.status).toBe(410)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: SUITE_OUT_OF_SCOPE,
    })
  })

  it('GET /api/projects/collections', async () => {
    const { GET } = await import('../app/api/projects/collections/route')
    const res = await GET()
    expect(res.status).toBe(410)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: SUITE_OUT_OF_SCOPE,
    })
  })
})

import { describe, expect, it } from 'vitest'
import { PRINT_OUT_OF_SCOPE } from '../lib/out-of-scope-response'

describe('retired print / Magazin API routes (410)', () => {
  it('POST /api/scenes/:id/pdf', async () => {
    const { POST } = await import('../app/api/scenes/[id]/pdf/route')
    const res = await POST()
    expect(res.status).toBe(410)
    const body = (await res.json()) as { error: string; detail?: string }
    expect(body.error).toBe(PRINT_OUT_OF_SCOPE)
    expect(body.detail).toMatch(/print-out-of-scope-for-zaoly/)
  })

  it('POST /api/scenes/:id/publish-magcloud', async () => {
    const { POST } = await import('../app/api/scenes/[id]/publish-magcloud/route')
    const res = await POST()
    expect(res.status).toBe(410)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: PRINT_OUT_OF_SCOPE,
    })
  })

  it('GET /api/magcloud/boards', async () => {
    const { GET } = await import('../app/api/magcloud/boards/route')
    const res = await GET()
    expect(res.status).toBe(410)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: PRINT_OUT_OF_SCOPE,
    })
  })

  it('POST /api/magcloud/boards', async () => {
    const { POST } = await import('../app/api/magcloud/boards/route')
    const res = await POST()
    expect(res.status).toBe(410)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: PRINT_OUT_OF_SCOPE,
    })
  })

  it('GET/POST /api/magazine-templates', async () => {
    const { GET, POST } = await import('../app/api/magazine-templates/route')
    const getRes = await GET()
    expect(getRes.status).toBe(410)
    expect(((await getRes.json()) as { error: string }).error).toBe(PRINT_OUT_OF_SCOPE)
    expect((await POST()).status).toBe(410)
  })

  it('magazine-templates nested routes', async () => {
    const { GET: getOne } = await import('../app/api/magazine-templates/[templateId]/route')
    const { POST: publish } = await import(
      '../app/api/magazine-templates/[templateId]/publish/route'
    )
    const { GET: getVersion } = await import(
      '../app/api/magazine-templates/[templateId]/versions/[version]/route'
    )
    expect((await getOne()).status).toBe(410)
    expect((await publish()).status).toBe(410)
    expect((await getVersion()).status).toBe(410)
  })
})

import { describe, expect, it } from 'vitest'
import { PRINT_OUT_OF_SCOPE } from '../lib/out-of-scope-response'
import { POST } from '../app/api/scenes/[id]/pdf/route'

describe('POST /api/scenes/:id/pdf', () => {
  it('returns 410 print_out_of_scope on Zaoly', async () => {
    const res = await POST()
    expect(res.status).toBe(410)
    const body = (await res.json()) as { error: string; detail?: string }
    expect(body.error).toBe(PRINT_OUT_OF_SCOPE)
    expect(body.detail).toMatch(/print-out-of-scope-for-zaoly/)
  })
})

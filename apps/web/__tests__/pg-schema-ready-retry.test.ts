import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'

const query = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('pg', () => ({
  Pool: vi.fn(function MockPool(this: { query: typeof query }) {
    this.query = query
  }),
}))

describe('ensureScenesSchema retry after bootstrap failure', () => {
  beforeEach(() => {
    query.mockReset()
    vi.resetModules()
    process.env[paths.envDatabaseUrl] = 'postgres://zaoly:zaoly@127.0.0.1:5434/zaoly'
  })

  afterEach(async () => {
    const { __resetPgPoolForTests } = await import('../lib/scene/pg-store')
    __resetPgPoolForTests()
    delete process.env[paths.envDatabaseUrl]
    vi.resetModules()
  })

  it('clears schemaReady so a later call can succeed after Postgres returns', async () => {
    const { ensureScenesSchema, __resetPgPoolForTests } = await import('../lib/scene/pg-store')
    __resetPgPoolForTests()

    query.mockRejectedValueOnce(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }))

    await expect(ensureScenesSchema()).rejects.toMatchObject({ code: 'ECONNREFUSED' })

    query.mockResolvedValue({ rows: [], rowCount: 0 })
    await expect(ensureScenesSchema()).resolves.toBeUndefined()
    expect(query.mock.calls.length).toBeGreaterThan(1)
  })
})

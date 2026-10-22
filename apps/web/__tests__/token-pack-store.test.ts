import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'
import {
  deleteTokenOverride,
  listTokenOverrides,
  renameTokenOverride,
  upsertTokenOverride,
} from '../lib/tokens/token-pack-store'

describe('token pack store (file)', () => {
  const prevPack = process.env[paths.envTokenPackStorePath]
  const prevDb = process.env[paths.envDatabaseUrl]
  const prevDbLegacy = process.env.ZAOLY_DATABASE_URL
  let dir = ''

  afterEach(() => {
    if (prevPack == null) delete process.env[paths.envTokenPackStorePath]
    else process.env[paths.envTokenPackStorePath] = prevPack
    if (prevDb == null) delete process.env[paths.envDatabaseUrl]
    else process.env[paths.envDatabaseUrl] = prevDb
    if (prevDbLegacy == null) delete process.env.ZAOLY_DATABASE_URL
    else process.env.ZAOLY_DATABASE_URL = prevDbLegacy
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
      dir = ''
    }
  })

  function useTempPackFile() {
    delete process.env[paths.envDatabaseUrl]
    delete process.env.ZAOLY_DATABASE_URL
    dir = mkdtempSync(path.join(tmpdir(), 'zaoly-token-pack-'))
    const file = path.join(dir, 'token-pack.json')
    process.env[paths.envTokenPackStorePath] = file
    return file
  }

  it('writes atomically (no leftover .tmp after success)', async () => {
    const file = useTempPackFile()
    await upsertTokenOverride({
      path: 'color.action.primary',
      type: 'color',
      value: JSON.stringify({ digital: { hex: '#112233' } }),
      status: 'active',
    })
    const raw = readFileSync(file, 'utf8')
    expect(JSON.parse(raw).leaves['color.action.primary'].value).toContain('#112233')
    const leftovers = readdirSync(dir).filter((name) => name.endsWith('.tmp'))
    expect(leftovers).toEqual([])
  })

  it('renames in one rewrite and updates sibling refs', async () => {
    useTempPackFile()
    await upsertTokenOverride({
      path: 'spacing.static.medium',
      type: 'spacing',
      value: JSON.stringify({ digital: '1rem' }),
      status: 'active',
    })
    await upsertTokenOverride({
      path: 'spacing.static.large',
      type: 'spacing',
      value: JSON.stringify({ digital: 'calc({spacing.static.medium} * 2)' }),
      status: 'active',
    })
    const renamed = await renameTokenOverride({
      fromPath: 'spacing.static.medium',
      leaf: {
        path: 'spacing.static.base',
        type: 'spacing',
        value: JSON.stringify({ digital: '1rem' }),
        status: 'active',
      },
    })
    expect(renamed.rewritten).toBe(1)
    const rows = await listTokenOverrides()
    expect(rows.find((r) => r.path === 'spacing.static.medium')).toBeUndefined()
    expect(rows.find((r) => r.path === 'spacing.static.base')).toBeTruthy()
    expect(rows.find((r) => r.path === 'spacing.static.large')?.value).toContain(
      '{spacing.static.base}',
    )
  })

  it('deletes overrides', async () => {
    useTempPackFile()
    await upsertTokenOverride({
      path: 'color.action.primary',
      type: 'color',
      value: JSON.stringify({ digital: { hex: '#abcdef' } }),
      status: 'active',
    })
    expect(await deleteTokenOverride('color.action.primary')).toBe(true)
    expect(await listTokenOverrides()).toEqual([])
  })
})

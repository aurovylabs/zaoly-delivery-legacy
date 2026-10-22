import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetProjectStoreForTests,
  applyPlatformBinding,
  createProject,
  getProjectByPlatformId,
  listProjects,
  upsertByPlatformProjectId,
} from '../lib/fixtures/project-store'
import {
  boundBrandTokensUrl,
  editorBrandTokensUrl,
  isRealPlatformProjectId,
  needsPlatformOrigin,
} from '../lib/platform-project-id'
import { brandTokensUrl, paths } from '../lib/paths'

describe('project store', () => {
  beforeEach(() => {
    __resetProjectStoreForTests()
  })

  it('creates and lists projects', async () => {
    await createProject({ name: 'Alpha' })
    expect(await listProjects()).toHaveLength(1)
    expect((await listProjects())[0]?.name).toBe('Alpha')
  })

  it('upserts by platform project id idempotently', async () => {
    const id = '11111111-1111-4111-8111-111111111111'
    const a = await upsertByPlatformProjectId(id, {
      name: 'First',
      ownerUserId: 'u1',
      platformCompanyId: 'c1',
    })
    const b = await upsertByPlatformProjectId(id, {
      name: 'Second',
      ownerUserId: 'u1',
      platformCompanyId: 'c1',
    })
    expect(a.id).toBe(b.id)
    expect(b.name).toBe('Second')
    expect(b.capabilityStatus).toBe('in_sync')
    expect((await getProjectByPlatformId(id))?.id).toBe(a.id)
  })

  it('applies platform binding after origin', async () => {
    const project = await createProject({ name: 'Local' })
    expect(needsPlatformOrigin(project.platformProjectId)).toBe(true)
    const uuid = '22222222-2222-4222-8222-222222222222'
    const bound = await applyPlatformBinding(project.id, { platformProjectId: uuid })
    expect(bound?.platformProjectId).toBe(uuid)
    expect(bound?.capabilityStatus).toBe('in_sync')
  })

  it('archives a project without hard-delete', async () => {
    const { archiveProject, getProject, deleteProject } = await import(
      '../lib/fixtures/project-store'
    )
    const created = await createProject({ name: 'Temp' })
    const archived = await archiveProject(created.id)
    expect(archived?.status).toBe('archived')
    expect(await getProject(created.id)).not.toBeNull()
    expect((await listProjects()).some((p) => p.id === created.id)).toBe(false)
    expect(await deleteProject(created.id)).toBe(true)
    expect(await getProject(created.id)).toBeNull()
  })
})

describe('platform project id', () => {
  it('detects real Collection UUIDs', () => {
    expect(isRealPlatformProjectId('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')).toBe(true)
    expect(isRealPlatformProjectId('plx-local-demo')).toBe(false)
    expect(needsPlatformOrigin('plx-local-demo')).toBe(true)
  })

  it('does not call brandTokensUrl without a real string Collection id', () => {
    expect(boundBrandTokensUrl(undefined)).toBeNull()
    expect(boundBrandTokensUrl(null)).toBeNull()
    expect(boundBrandTokensUrl('plx-local-demo')).toBeNull()
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    expect(boundBrandTokensUrl(id)).toBe(brandTokensUrl(id))
  })

  it('editorBrandTokensUrl falls back to local promote preview id when unbound', () => {
    expect(editorBrandTokensUrl(null)).toBe(
      brandTokensUrl(paths.localPromotePreviewPlatformId),
    )
    expect(editorBrandTokensUrl('plx-local-demo')).toBe(
      brandTokensUrl(paths.localPromotePreviewPlatformId),
    )
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    expect(editorBrandTokensUrl(id)).toBe(brandTokensUrl(id))
  })
})

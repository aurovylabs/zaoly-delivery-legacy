/**
 * Collection Team routes — retired Plexon BFF on Zaoly standalone.
 * Spec: specs/domain/project-team.md
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SUITE_OUT_OF_SCOPE } from '../lib/out-of-scope-response'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')

describe('project team paths + spec', () => {
  it('exposes members / invites routes and Plexon service paths', () => {
    expect(paths.routes.apiProjectMembers('proj-1')).toBe('/api/projects/proj-1/members')
    expect(paths.routes.apiProjectMember('proj-1', 'u-2')).toBe(
      '/api/projects/proj-1/members/u-2',
    )
    expect(paths.routes.apiProjectInvites('proj-1')).toBe('/api/projects/proj-1/invites')
    expect(paths.provisioningCollectionMembersPath('col-1')).toBe(
      '/api/platform/provisioning/collections/col-1/members',
    )
    expect(paths.provisioningCollectionMemberPath('col-1', 'u-2')).toBe(
      '/api/platform/provisioning/collections/col-1/members/u-2',
    )
    expect(paths.provisioningCollectionInvitesPath('col-1')).toBe(
      '/api/platform/provisioning/collections/col-1/invites',
    )
  })

  it('spec relates Collection Team to the scene share invite', () => {
    const spec = path.join(repoRoot, 'specs/domain/project-team.md')
    expect(existsSync(spec)).toBe(true)
    const text = readFileSync(spec, 'utf8')
    expect(text).toContain('editor-share-invite.md')
    expect(text).toContain('Collection')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('/api/projects/:id/members')
    expect(pathsDoc).toContain('project-team.md')
  })

  it('locales carry the team strings in both languages', () => {
    const teamKeys = ['teamTitle', 'teamAdd', 'teamInviteLink', 'teamNeedsCollection']
    for (const locale of ['en', 'de']) {
      const dict = JSON.parse(
        readFileSync(path.join(repoRoot, `apps/web/locales/${locale}.json`), 'utf8'),
      ) as { projects: Record<string, string> }
      for (const key of teamKeys) {
        expect(dict.projects[key]).toBeTruthy()
      }
    }
  })
})

describe('project members BFF (retired)', () => {
  it('GET returns 410 suite_out_of_scope', async () => {
    const { GET } = await import('../app/api/projects/[id]/members/route')
    const res = await GET()
    expect(res.status).toBe(410)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: SUITE_OUT_OF_SCOPE,
    })
  })

  it('POST returns 410 suite_out_of_scope', async () => {
    const { POST } = await import('../app/api/projects/[id]/members/route')
    const res = await POST()
    expect(res.status).toBe(410)
  })

  it('DELETE member returns 410 suite_out_of_scope', async () => {
    const { DELETE } = await import('../app/api/projects/[id]/members/[userId]/route')
    const res = await DELETE()
    expect(res.status).toBe(410)
  })

  it('POST invites returns 410 suite_out_of_scope', async () => {
    const { POST } = await import('../app/api/projects/[id]/invites/route')
    const res = await POST()
    expect(res.status).toBe(410)
  })
})

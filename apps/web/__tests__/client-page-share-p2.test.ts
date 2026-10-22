import { describe, expect, it, beforeEach } from 'vitest'
import { createDemoScene } from '../lib/scene/demo-scene'
import { normalizeShareEmail, emailOnAllowlist } from '../lib/client-page-share/email'
import {
  assertCreateAllowedByPolicy,
  localClientSharePolicy,
} from '../lib/client-page-share/policy'
import { buildClientShareSnapshot } from '../lib/client-page-share/snapshot'
import {
  __resetClientPageShareStoreForTests,
  createClientPageShare,
  getClientPageShareByToken,
} from '../lib/client-page-share/store'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'

describe('client page share P2', () => {
  beforeEach(() => {
    __resetClientPageShareStoreForTests({ durable: false })
  })

  it('normalizes emails for allowlist', () => {
    expect(normalizeShareEmail('  Alice@Client.COM ')).toBe('alice@client.com')
    expect(normalizeShareEmail('not-an-email')).toBeNull()
    expect(emailOnAllowlist('bob@x.io', ['bob@x.io'])).toBe(true)
    expect(emailOnAllowlist('eve@x.io', ['bob@x.io'])).toBe(false)
  })

  it('policy asserts live_head and email gates', () => {
    const policy = {
      ...localClientSharePolicy(),
      allowLiveHead: false,
      allowEmailAllowlist: false,
      requirePassword: true,
      allowPublicLink: false,
    }
    expect(
      assertCreateAllowedByPolicy(policy, {
        accessMode: 'password',
        contentMode: 'live_head',
      }),
    ).toBe('live_head_disabled')
    expect(
      assertCreateAllowedByPolicy(policy, {
        accessMode: 'email_allowlist',
        contentMode: 'pinned_revision',
      }),
    ).toBe('email_allowlist_disabled')
    expect(
      assertCreateAllowedByPolicy(policy, {
        accessMode: 'link',
        contentMode: 'pinned_revision',
      }),
    ).toBe('password_required_by_policy')
    expect(
      assertCreateAllowedByPolicy(
        { ...policy, allowLiveHead: true },
        { accessMode: 'password', contentMode: 'live_head' },
      ),
    ).toBeNull()
  })

  it('creates email_allowlist and live_head shares', async () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const built = buildClientShareSnapshot(scene, [pageId])
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const { record, token } = await createClientPageShare({
      platformProjectId: '11111111-1111-4111-8111-111111111111',
      sceneId: scene.id,
      pageIds: [pageId],
      snapshot: built.snapshot,
      accessMode: 'email_allowlist',
      contentMode: 'live_head',
      emailAllowlist: ['Client@Example.com', 'other@ex.com'],
      expiresInDays: 7,
      createdByUserId: 'user-1',
      maxTtlDays: 30,
    })

    expect(record.contentMode).toBe('live_head')
    expect(record.accessMode).toBe('email_allowlist')
    expect(record.emailAllowlist).toEqual(['client@example.com', 'other@ex.com'])
    expect(record.passwordHash).toBeNull()

    const found = await getClientPageShareByToken(token)
    expect(found?.emailAllowlist).toContain('client@example.com')
  })
})

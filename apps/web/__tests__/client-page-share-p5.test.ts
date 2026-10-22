import { describe, expect, it, beforeEach } from 'vitest'
import {
  CLIENT_SHARE_AUDIT_PUBLIC_ACTOR,
  __resetClientShareAuditRateLimitsForTests,
  emitClientShareAuditEvent,
} from '../lib/client-page-share/events'
import { paths } from '../lib/paths'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')

describe('client page share P5 audit', () => {
  beforeEach(() => {
    __resetClientShareAuditRateLimitsForTests()
  })

  it('exposes plexon events path helper', () => {
    expect(paths.provisioningCollectionClientShareEventsPath('col-1')).toBe(
      '/api/platform/provisioning/collections/col-1/client-share-events',
    )
  })

  it('uses a stable public audit actor constant', () => {
    expect(CLIENT_SHARE_AUDIT_PUBLIC_ACTOR).toBe('zaoly:client-share-viewer')
  })

  it('emit helper is fire-and-forget (no throw offline)', () => {
    expect(() =>
      emitClientShareAuditEvent({
        platformProjectId: 'col-1',
        shareId: 'share-1',
        eventType: 'client_share.viewed',
      }),
    ).not.toThrow()
  })

  it('public resolve and unlock routes emit audit events', () => {
    const resolveSrc = readFileSync(
      path.join(root, 'app/api/public/client-shares/[token]/route.ts'),
      'utf8',
    )
    const unlockSrc = readFileSync(
      path.join(root, 'app/api/public/client-shares/[token]/unlock/route.ts'),
      'utf8',
    )
    expect(resolveSrc).toContain("client_share.viewed")
    expect(unlockSrc).toContain("client_share.unlock_failed")
  })
})

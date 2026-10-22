/**
 * Client Page Share audit emit (local-only on Zaoly standalone).
 */

export type ClientShareAuditEventType =
  | 'client_share.created'
  | 'client_share.revoked'
  | 'client_share.viewed'
  | 'client_share.unlock_failed'

export const CLIENT_SHARE_AUDIT_PUBLIC_ACTOR = 'zaoly:client-share-viewer'

export function emitClientShareAuditEvent(_input: {
  platformProjectId: string
  shareId: string
  eventType: ClientShareAuditEventType
  actorUserId?: string | null
  meta?: Record<string, unknown>
}): void {}

export async function pushClientShareAuditEvent(_input: {
  platformProjectId: string
  shareId: string
  eventType: ClientShareAuditEventType
  actorUserId?: string | null
  meta?: Record<string, unknown>
}): Promise<void> {}

/** Test helper */
export function __resetClientShareAuditRateLimitsForTests(): void {}

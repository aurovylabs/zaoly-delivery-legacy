/**
 * Client Page Share → suite ClientRoom slot (retired on Zaoly standalone).
 */
import type { ClientPageShareRecord } from './store'

export function titleForClientRoomSlot(record: ClientPageShareRecord): string {
  return (
    record.label?.trim() ||
    record.snapshot?.name?.trim() ||
    record.snapshot?.pages?.[0]?.name?.trim() ||
    'Client pages'
  )
}

export function hrefForClientRoomSlot(_record: ClientPageShareRecord): string | null {
  return null
}

/** No-op — suite ClientRoom is out of scope for Zaoly. */
export function schedulePublishApprovedShareToClientRoom(
  _record: ClientPageShareRecord,
  _actorUserId: string,
): void {}

/** No-op — suite ClientRoom is out of scope for Zaoly. */
export function scheduleClearCreationPagesClientRoomSlot(
  _platformProjectId: string,
  _actorUserId: string,
): void {}

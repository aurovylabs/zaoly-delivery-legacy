/**
 * Resolve effective Client Share policy (local env defaults on Zaoly).
 * Spec: client-page-share.md
 */
import { paths } from '../paths'
import {
  clientPageShareMaxTtlDays,
  clientPageShareRequirePassword,
  isClientPageShareEnabled,
} from '../runtime-config'

export type ClientSharePolicy = {
  enabled: boolean
  allowPublicLink: boolean
  requirePassword: boolean
  maxTtlDays: number
  allowLiveHead: boolean
  allowEmailAllowlist: boolean
  source: 'local'
}

function envTruthy(raw: string | undefined): boolean | null {
  if (raw == null || raw.trim() === '') return null
  const v = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(v)) return true
  if (['0', 'false', 'no', 'off'].includes(v)) return false
  return null
}

export function localClientSharePolicy(): ClientSharePolicy {
  return {
    enabled: isClientPageShareEnabled(),
    allowPublicLink: envTruthy(process.env[paths.envClientPageShareAllowPublicLink]) !== false,
    requirePassword: clientPageShareRequirePassword(),
    maxTtlDays: clientPageShareMaxTtlDays(),
    allowLiveHead: envTruthy(process.env[paths.envClientPageShareAllowLiveHead]) !== false,
    allowEmailAllowlist:
      envTruthy(process.env[paths.envClientPageShareAllowEmailAllowlist]) !== false,
    source: 'local',
  }
}

export async function resolveClientSharePolicy(
  _platformProjectId: string,
  _userId: string,
): Promise<ClientSharePolicy> {
  return localClientSharePolicy()
}

export function assertCreateAllowedByPolicy(
  policy: ClientSharePolicy,
  opts: {
    accessMode: 'link' | 'password' | 'email_allowlist'
    contentMode: 'pinned_revision' | 'live_head'
  },
): string | null {
  if (!policy.enabled) return 'client_share_disabled'
  if (opts.accessMode === 'link' && (!policy.allowPublicLink || policy.requirePassword)) {
    return 'password_required_by_policy'
  }
  if (opts.accessMode === 'email_allowlist' && !policy.allowEmailAllowlist) {
    return 'email_allowlist_disabled'
  }
  if (opts.contentMode === 'live_head' && !policy.allowLiveHead) {
    return 'live_head_disabled'
  }
  return null
}

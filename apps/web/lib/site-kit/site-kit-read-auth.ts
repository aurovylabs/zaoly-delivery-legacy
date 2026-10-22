/**
 * Fail-closed Site Kit catalog / Pattern override reads (SK-S1).
 * Spec: specs/domain/site-kit-collection-scope.md · specs/api/site-kit-write.md
 */

import { NextResponse } from 'next/server'
import { listProjectsForViewer } from '../fixtures/project-store'
import { isProvisioningAuthorized } from '../federation-contract'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../require-scene-api-access'
import { viewerCanAccessPlatformProjectId } from '../require-scene-collection-access'
import { getServiceSecret, isAuthBypassEnabled, isServiceAuthConfigured } from '../runtime-config'
import type { ListSiteKitCompositionsFilter } from './composition-write'
import {
  extractSiteKitViewToken,
  verifySiteKitViewToken,
} from './storybook-view-token'

export type SiteKitReadPrincipal =
  | { kind: 'session'; userId: string }
  | { kind: 'service'; userId: string }
  | { kind: 'provisioning' }
  | { kind: 'view'; platformProjectId: string }
  | { kind: 'none' }

export async function resolveSiteKitReadPrincipal(
  request: Request,
): Promise<SiteKitReadPrincipal> {
  const viewClaims = verifySiteKitViewToken(extractSiteKitViewToken(request))
  if (viewClaims) {
    return { kind: 'view', platformProjectId: viewClaims.platformProjectId }
  }

  const secret = getServiceSecret()
  if (secret && isProvisioningAuthorized(request, secret)) {
    return { kind: 'provisioning' }
  }

  const access = await requireSceneApiAccess(request)
  if (isSceneApiAccess(access)) {
    return {
      kind: access.mode === 'service' ? 'service' : 'session',
      userId: access.userId,
    }
  }

  if (!isServiceAuthConfigured() && isAuthBypassEnabled()) {
    return { kind: 'session', userId: 'dev-local' }
  }

  void access
  return { kind: 'none' }
}

export async function viewerMayAccessCollection(
  userId: string,
  platformProjectId: string,
): Promise<boolean> {
  const id = platformProjectId.trim()
  if (!id || !userId) return false
  if (!isServiceAuthConfigured()) return true
  return viewerCanAccessPlatformProjectId(id, userId)
}

export type CompositionListAuth =
  | { ok: true; filter: ListSiteKitCompositionsFilter }
  | { ok: false; response: NextResponse }

export async function authorizeSiteKitCompositionList(
  request: Request,
): Promise<CompositionListAuth> {
  const url = new URL(request.url)
  const platformProjectId = url.searchParams.get('platformProjectId')?.trim() || undefined
  const unscoped = url.searchParams.get('unscoped') === '1'
  const principal = await resolveSiteKitReadPrincipal(request)

  if (principal.kind === 'none') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'unauthorized', code: 'site-kit-scope-required' },
        { status: 401 },
      ),
    }
  }

  if (principal.kind === 'view') {
    return {
      ok: true,
      filter: { platformProjectId: principal.platformProjectId },
    }
  }

  if (principal.kind === 'provisioning') {
    if (unscoped) return { ok: true, filter: { unscoped: true } }
    if (platformProjectId) return { ok: true, filter: { platformProjectId } }
    return { ok: true, filter: {} }
  }

  if (unscoped) {
    return { ok: true, filter: { unscoped: true } }
  }

  if (platformProjectId) {
    const allowed = await viewerMayAccessCollection(principal.userId, platformProjectId)
    if (!allowed) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
      }
    }
    return { ok: true, filter: { platformProjectId } }
  }

  if (!isServiceAuthConfigured()) {
    return { ok: true, filter: { unscoped: true } }
  }

  const projects = await listProjectsForViewer(principal.userId)
  const ids = projects
    .map((p) => p.platformProjectId?.trim())
    .filter((id): id is string => Boolean(id))
  if (!ids.length) {
    return { ok: true, filter: { platformProjectIds: [] } }
  }
  return { ok: true, filter: { platformProjectIds: ids } }
}

export async function authorizeSiteKitPatternOverrideRead(
  request: Request,
  ownerPlatformProjectId: string | null | undefined,
): Promise<boolean> {
  const principal = await resolveSiteKitReadPrincipal(request)

  if (principal.kind === 'provisioning') return true

  if (principal.kind === 'view') {
    const owner = ownerPlatformProjectId?.trim()
    if (!owner) return false
    return owner === principal.platformProjectId
  }

  if (principal.kind === 'session' || principal.kind === 'service') {
    const owner = ownerPlatformProjectId?.trim()
    if (!owner) {
      return true
    }
    return viewerMayAccessCollection(principal.userId, owner)
  }

  return false
}

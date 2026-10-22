/**
 * SK-S1/S3 — Collection-scoped Live credentials from Storybook URL.
 * Spec: site-kit-collection-scope.md
 */

export const SITE_KIT_VIEW_TOKEN_QUERY = 'zaolyViewToken'
export const SITE_KIT_VIEW_TOKEN_HEADER = 'X-Zaoly-Site-Kit-View'
export const SITE_KIT_PLATFORM_PROJECT_QUERY = 'platformProjectId'

export function readSiteKitViewTokenFromLocation(
  search = typeof window !== 'undefined' ? window.location.search : '',
): string | null {
  try {
    const token = new URLSearchParams(search).get(SITE_KIT_VIEW_TOKEN_QUERY)?.trim()
    return token || null
  } catch {
    return null
  }
}

export function readSiteKitPlatformProjectIdFromLocation(
  search = typeof window !== 'undefined' ? window.location.search : '',
): string | null {
  try {
    const id = new URLSearchParams(search).get(SITE_KIT_PLATFORM_PROJECT_QUERY)?.trim()
    return id || null
  } catch {
    return null
  }
}

/** SK-S3: Pattern Catalog/Live needs a view token — no anonymous Pattern browse. */
export function hasSiteKitViewCredentials(
  search = typeof window !== 'undefined' ? window.location.search : '',
): boolean {
  return Boolean(readSiteKitViewTokenFromLocation(search))
}

export function siteKitViewAuthHeaders(
  search = typeof window !== 'undefined' ? window.location.search : '',
): HeadersInit {
  const token = readSiteKitViewTokenFromLocation(search)
  return token ? { [SITE_KIT_VIEW_TOKEN_HEADER]: token } : {}
}

export function withSiteKitViewTokenQuery(url: string, search?: string): string {
  const token = readSiteKitViewTokenFromLocation(search)
  const platformProjectId = readSiteKitPlatformProjectIdFromLocation(search)
  if (!token && !platformProjectId) return url
  try {
    const u = new URL(url)
    if (token && !u.searchParams.get(SITE_KIT_VIEW_TOKEN_QUERY)) {
      u.searchParams.set(SITE_KIT_VIEW_TOKEN_QUERY, token)
    }
    if (platformProjectId && !u.searchParams.get(SITE_KIT_PLATFORM_PROJECT_QUERY)) {
      u.searchParams.set(SITE_KIT_PLATFORM_PROJECT_QUERY, platformProjectId)
    }
    return u.toString()
  } catch {
    return url
  }
}

/** Build compositions list URL — always includes platformProjectId when known (SK-S3). */
export function siteKitCompositionsListUrl(
  creationOrigin: string,
  search = typeof window !== 'undefined' ? window.location.search : '',
): string {
  const base = creationOrigin.replace(/\/$/, '')
  const platformProjectId = readSiteKitPlatformProjectIdFromLocation(search)
  const q = new URLSearchParams()
  q.set('t', String(Date.now()))
  if (platformProjectId) q.set(SITE_KIT_PLATFORM_PROJECT_QUERY, platformProjectId)
  return withSiteKitViewTokenQuery(`${base}/api/site-kit/compositions?${q.toString()}`, search)
}

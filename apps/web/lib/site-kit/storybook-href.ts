/**
 * Deep-link into Site Kit Storybook for saved compositions.
 * Spec: knowledge/site-kit-storybook-coolify.md · site-kit-compositions.md · SK-S1/S3
 */
import { compositionStoryTitle } from '@zaoly/site-kit/composition-codegen'
import { paths } from '../paths'

/** Storybook CSF slug segment from PascalCase export name (MarketingHero → marketing-hero). */
export function siteKitCompositionStorySlug(exportName: string): string {
  const trimmed = exportName.trim()
  if (!trimmed) return 'unknown'
  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/** Storybook CSF slug from title path (`Compositions/Shared/Hero` → compositions-shared-hero). */
export function siteKitStoryTitleSlug(storyTitle: string): string {
  return storyTitle
    .trim()
    .split('/')
    .map((segment) => siteKitCompositionStorySlug(segment))
    .filter(Boolean)
    .join('-')
}

/** Atom/layout CSF deep-link (`Site/Button` → `/story/site-button--default`). */
export function siteKitAtomStoryHref(
  storybookOrigin: string,
  storyTitle: string,
  storyId = 'default',
): string {
  const base = storybookOrigin.replace(/\/$/, '')
  const slug = siteKitStoryTitleSlug(storyTitle)
  return `${base}/?path=/story/${slug}--${storyId}`
}

/**
 * Dedicated sidebar story `Compositions/{Shared|scope}/{Name}` (after Storybook rebuild).
 * Prefer passing `storyTitle` from the catalog when available.
 */
export function siteKitCompositionStoryHref(
  storybookOrigin: string,
  exportName: string,
  storyId = 'default',
  options?: { platformProjectId?: string | null; storyTitle?: string },
): string {
  const title =
    options?.storyTitle?.trim() ||
    compositionStoryTitle(exportName, options?.platformProjectId)
  return siteKitAtomStoryHref(storybookOrigin, title, storyId)
}

/**
 * Baked Live story with componentId arg — instant preview before rebuild completes.
 * Prefer {@link siteKitCompositionStoryHref} once Storybook has rebuilt.
 */
export function siteKitLiveCompositionHref(
  storybookOrigin: string,
  componentId: string,
  variantName?: string,
): string {
  const base = storybookOrigin.replace(/\/$/, '')
  const id = componentId.trim()
  if (!id) return `${base}/?path=/story/compositions-live--default`
  const parts = [`componentId:${encodeURIComponent(id)}`]
  const variant = variantName?.trim()
  if (variant) parts.push(`variantName:${encodeURIComponent(variant)}`)
  return `${base}/?path=/story/compositions-live--default&args=${parts.join(';')}`
}

/** Collection-scoped Pattern Catalog (SK-S3 entry point). */
export function siteKitCatalogHref(storybookOrigin: string): string {
  const base = storybookOrigin.replace(/\/$/, '')
  return `${base}/?path=/story/compositions-catalog--default`
}

/** Attach SK-S1 view token + Collection to a Storybook deep-link. */
export function withSiteKitViewCredentials(
  href: string,
  creds: { viewToken: string; platformProjectId: string } | null | undefined,
): string {
  if (!creds?.viewToken?.trim() || !creds.platformProjectId?.trim()) return href
  try {
    const u = new URL(href)
    u.searchParams.set(paths.siteKitViewTokenQueryParam, creds.viewToken.trim())
    u.searchParams.set('platformProjectId', creds.platformProjectId.trim())
    return u.toString()
  } catch {
    return href
  }
}

export async function mintSiteKitViewCredentialsClient(
  platformProjectId: string | null | undefined,
): Promise<{ viewToken: string; platformProjectId: string; expiresAt: string } | null> {
  const id = platformProjectId?.trim()
  if (!id) return null
  try {
    const res = await fetch(paths.routes.apiSiteKitStorybookViewToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformProjectId: id }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as {
      ok?: boolean
      viewToken?: string
      platformProjectId?: string
      expiresAt?: string
    }
    if (!body.ok || !body.viewToken?.trim() || !body.platformProjectId?.trim()) return null
    return {
      viewToken: body.viewToken.trim(),
      platformProjectId: body.platformProjectId.trim(),
      expiresAt: body.expiresAt ?? '',
    }
  } catch {
    return null
  }
}

/**
 * Open any Storybook deep-link, minting SK-S1 view credentials when Collection-bound.
 * Falls back to the bare href if mint fails (SK-V12).
 */
export async function openSiteKitStorybookHref(input: {
  href: string
  platformProjectId?: string | null
}): Promise<boolean> {
  const href = input.href?.trim()
  if (!href) return false
  const creds = await mintSiteKitViewCredentialsClient(input.platformProjectId)
  const finalHref = withSiteKitViewCredentials(href, creds)
  window.open(finalHref, '_blank', 'noopener,noreferrer')
  return true
}

/**
 * Open Collection-scoped Catalog (SK-S3). Falls back to Catalog URL without token if mint fails.
 */
export async function openSiteKitStorybookCatalog(input: {
  storybookOrigin: string | null | undefined
  platformProjectId?: string | null
}): Promise<boolean> {
  const origin = input.storybookOrigin?.trim()
  if (!origin) return false
  return openSiteKitStorybookHref({
    href: siteKitCatalogHref(origin),
    platformProjectId: input.platformProjectId,
  })
}

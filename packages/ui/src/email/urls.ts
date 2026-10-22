/**
 * Canonical hosted email asset URLs (HTTPS).
 * Knowledge: knowledge/email.md · knowledge/paths.md · zaoly-community-distribution.md
 *
 * Assets MUST come from the public delivery repo (`aurovylabs/zaoly-delivery`).
 * Private product remotes (Origin) are not CDN-reachable.
 */

/** Public community GitHub repo (same as `paths.communityGithubRepo`). */
export const ZAOLY_EMAIL_ASSET_GITHUB_REPO = 'aurovylabs/zaoly-delivery'

const emailAssetCdn = (relPath: string) =>
  `https://cdn.jsdelivr.net/gh/${ZAOLY_EMAIL_ASSET_GITHUB_REPO}@main/${relPath}`

/** Zaoly mark (PNG) — jsDelivr from public delivery pack. */
export const ZAOLY_EMAIL_LOGO_MARK_URL = emailAssetCdn(
  'packages/ui/src/email/assets/zaoly-mark.png',
)

/** Zaoly wordmark (PNG). Prefer mark + text lockup in the shell; wordmark for wide headers. */
export const ZAOLY_EMAIL_LOGO_WORDMARK_URL = emailAssetCdn(
  'packages/ui/src/email/assets/zaoly-wordmark.png',
)

/** Corporate site (footer link optional — omit when deliverability forbids links). */
export const URL_ZAOLY_SITE = 'https://zaoly.app'

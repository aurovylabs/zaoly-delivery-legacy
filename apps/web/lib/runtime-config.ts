/** Runtime env resolution — no hardcoded service bases in call sites. */

import { paths } from './paths'
import { envGet } from './env-resolve'

export { envGet } from './env-resolve'

/** Optional federation API origin; Zaoly standalone does not require it. */
export function federationBaseUrl(): string | null {
  const explicit = envGet(paths.envFederationBase)?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const auth = envGet(paths.envFederationAuthUrl)?.trim()
  if (auth) return auth.replace(/\/$/, '')
  return null
}

export function federationBaseUrlNormalized(): string | null {
  const base = federationBaseUrl()
  return base ? base.replace(/\/$/, '') : null
}

export function zaolyPublicUrl(): string {
  return envGet(paths.envPublicUrl)?.trim() || `http://localhost:${paths.devPort}`
}

/** Optional contact mailbox for the public Zaoly website. */
export function publicSiteContactEmail(): string | null {
  const email = envGet(paths.envPublicSiteContactEmail)?.trim()
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email
  return paths.publicSiteContactEmailDefault
}

/** Client Page Share master switch — default on. Spec: client-page-share.md */
export function isClientPageShareEnabled(): boolean {
  const parsed = envTruthy(envGet(paths.envClientPageShareEnabled))
  if (parsed != null) return parsed
  return true
}

export function clientPageShareRequirePassword(): boolean {
  return envTruthy(envGet(paths.envClientPageShareRequirePassword)) === true
}

export function clientPageShareMaxTtlDays(): number {
  const raw = envGet(paths.envClientPageShareMaxTtlDays)?.trim()
  if (raw) {
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return paths.clientPageShareMaxTtlDaysDefault
}

export function clientPageShareUnlockSecret(): string {
  return (
    envGet(paths.envClientPageShareUnlockSecret)?.trim() ||
    getServiceSecret() ||
    'zaoly-client-share-dev-unlock'
  )
}

export function absoluteClientPageShareUrl(token: string): string {
  const base = zaolyPublicUrl().replace(/\/$/, '')
  return `${base}${paths.routes.clientPageShare(token)}`
}

/** Optional external editor origin. Local fallback outside production when unset. */
export function editorDeepLinkUrl(): string | null {
  const raw = envGet(paths.envEditorUrl)?.trim()
  if (raw) return raw.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return paths.editorDevFallbackHttp
  return null
}

function envTruthy(raw: string | undefined): boolean | null {
  if (raw == null || raw.trim() === '') return null
  const v = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(v)) return true
  if (['0', 'false', 'no', 'off'].includes(v)) return false
  return null
}

/**
 * Prefer in-app `/editor` when `ZAOLY_EDITOR_INAPP` (or legacy `ZAOLY_EDITOR_INAPP`) is truthy.
 * Default: on outside production; off in production until explicitly enabled.
 */
export function editorInAppEnabled(): boolean {
  const parsed = envTruthy(envGet(paths.envEditorInApp))
  if (parsed != null) return parsed
  return process.env.NODE_ENV !== 'production'
}

/**
 * Smart Canvas HUD (W1). Default **on** when unset so the frozen concept ships;
 * set `NEXT_PUBLIC_ZAOLY_SMART_HUD=0` for legacy Insert strip.
 * Spec: `specs/domain/canvas-smart-hud.md`
 */
/** Smart Canvas HUD flag — named `is*` so it does not collide with prop locals. */
export function isSmartHudEnabled(): boolean {
  const parsed = envTruthy(process.env.NEXT_PUBLIC_ZAOLY_SMART_HUD)
  if (parsed != null) return parsed
  return true
}

/**
 * Opt-in Smart HUD telemetry. Default **off**.
 * Set `NEXT_PUBLIC_ZAOLY_HUD_TELEMETRY=1` to dispatch `paths.hudTelemetryEvent`.
 */
export function isHudTelemetryEnabled(): boolean {
  const parsed = envTruthy(process.env.NEXT_PUBLIC_ZAOLY_HUD_TELEMETRY)
  return parsed === true
}

export function getServiceSecret(): string {
  return envGet(paths.envServiceSecret)?.trim() || ''
}

/** VIDEON API origin for server-side media consume (P0 stills). Prefer `VIDEON_API_URL`. */
export function videonApiUrl(): string | null {
  const explicit = process.env[paths.envVideonApiUrl]?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const pub = process.env[paths.envVideonPublicUrl]?.trim()
  if (pub) return pub.replace(/\/$/, '')
  return null
}

/** METRON API origin for Collection KPI catalog/evaluate. Prefer `METRON_API_URL`. */
export function metronApiUrl(): string | null {
  const explicit = process.env[paths.envMetronApiUrl]?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const pub = process.env[paths.envMetronPublicUrl]?.trim()
  if (pub) return pub.replace(/\/$/, '')
  return null
}

/** CHECKION API origin for Collection scan distillate. Prefer `CHECKION_API_URL`. */
export function checkionApiUrl(): string | null {
  const explicit = process.env[paths.envCheckionApiUrl]?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const pub = process.env[paths.envCheckionPublicUrl]?.trim()
  if (pub) return pub.replace(/\/$/, '')
  return null
}

export function getExternalAuthUrl(): string {
  return (
    envGet(paths.envFederationAuthUrl)?.trim() || ''
  )
}

export function isServiceAuthConfigured(): boolean {
  return Boolean(getExternalAuthUrl() && getServiceSecret())
}

/** True when Zaoly Postgres is configured (local user store + durable scenes). */
export function isZaolyDatabaseConfigured(): boolean {
  return Boolean(envGet(paths.envDatabaseUrl)?.trim())
}

/**
 * Public email self-registration. Default on when the user store is available.
 * Kill-switch: `ZAOLY_PUBLIC_SIGNUP=0` / `false` / `off`.
 */
export function isPublicSignupEnabled(): boolean {
  if (!isZaolyDatabaseConfigured()) return false
  const parsed = envTruthy(envGet(paths.envZaolyPublicSignup))
  if (parsed != null) return parsed
  return true
}

/** Google OAuth for Auth.js — both client id and secret required. */
export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    envGet(paths.envAuthGoogleId)?.trim() && envGet(paths.envAuthGoogleSecret)?.trim(),
  )
}

/**
 * Storyblok CMS handoff (Export “Send to Storyblok”). Default **off** for Zaoly.
 * Opt-in: `ZAOLY_STORYBLOK_HANDOFF=1` plus Space credentials.
 */
export function isStoryblokHandoffEnabled(): boolean {
  return envTruthy(envGet(paths.envZaolyStoryblokHandoff)) === true
}

/**
 * Single-actor DX bypass (`dev-local`).
 * - Always off in production.
 * - Explicit `ZAOLY_AUTH_BYPASS` / legacy `ZAOLY_AUTH_BYPASS` wins when set.
 * - When Postgres is configured, default **off** (real local users).
 * - Without Postgres, default **on** outside production for JSON-store DX.
 * Spec: zaoly-user-management.md
 */
export function isAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const parsed = envTruthy(envGet(paths.envAuthBypass))
  if (parsed != null) return parsed
  if (isZaolyDatabaseConfigured()) return false
  if (!paths.standaloneMode) return false
  const standalone = envTruthy(envGet(paths.envZaolyStandalone))
  if (standalone === false) return false
  return true
}

export type FederationRuntimeMode = 'dummy' | 'live'

export function getFederationMode(): FederationRuntimeMode {
  const raw = envGet(paths.envFederationMode)?.trim().toLowerCase()
  if (raw === 'live' || raw === 'dummy') return raw
  return paths.federationMode
}

export function getDataSource(): 'fixtures' | 'postgres' {
  return paths.dataSource
}

export function isFederationConfigured(): boolean {
  return Boolean(federationBaseUrl() && getServiceSecret())
}

/** Demo owner/company for outbound federation when no session exists yet. */
export function getFederationDemoOwnerUserId(): string {
  return envGet(paths.envFederationDemoOwner)?.trim() || ''
}

export function getFederationDemoCompanyId(): string {
  return envGet(paths.envFederationDemoCompany)?.trim() || ''
}

/** In-repo DS source marker (`packages/ui`). */
export function resolveZaolyUiSource(): string {
  return process.env[paths.envZaolyUiSource]?.trim() || paths.zaolyUiSourceDefault
}

/** Redis URL for cross-replica SSE + presence (Wave D). Unset → in-process. */
export function getZaolyRedisUrl(): string | null {
  const raw = envGet(paths.envRedisUrl)?.trim()
  return raw || null
}

export function isRedisConfigured(): boolean {
  return Boolean(getZaolyRedisUrl())
}

/** Optional Storybook catalog origin — unset means settings shows in-repo only. */
export function zaolyUiStorybookUrl(): string | null {
  // Literal key: Next only inlines `process.env.NEXT_PUBLIC_*` for client bundles.
  const raw = process.env.NEXT_PUBLIC_ZAOLY_UI_STORYBOOK?.trim()
  return raw ? raw.replace(/\/$/, '') : null
}

/** Site Kit Storybook origin — unset disables editor + library open links. */
export function siteKitStorybookUrl(): string | null {
  // Literal key: Next only inlines `process.env.NEXT_PUBLIC_*` for client bundles.
  // `process.env[paths.envSiteKitStorybook]` stays undefined in the browser.
  const raw = process.env.NEXT_PUBLIC_SITE_KIT_STORYBOOK?.trim()
  return raw ? raw.replace(/\/$/, '') : null
}

/** Public atom CDN base (…/cdn). Falls back to canonical Storybook `/cdn` prefix. */
export function siteKitCdnUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_KIT_CDN?.trim()
  if (raw) return raw.replace(/\/$/, '')
  return paths.siteKitCdnDefault.replace(/\/$/, '')
}

export function siteKitCdnModuleHref(cdnBase = siteKitCdnUrl()): string {
  return `${cdnBase.replace(/\/$/, '')}/${paths.siteKitCdnModuleFile}`
}

export function siteKitCdnCssHref(cdnBase = siteKitCdnUrl()): string {
  return `${cdnBase.replace(/\/$/, '')}/${paths.siteKitCdnCssFile}`
}

export function githubApiUrl(): string {
  const raw = process.env[paths.envGithubApiUrl]?.trim()
  return raw ? raw.replace(/\/$/, '') : paths.githubApiBaseDefault
}

export function githubToken(): string {
  return process.env[paths.envGithubToken]?.trim() || ''
}

/** True when a token is present — never return the token. */
export function githubPromoteConfigured(): boolean {
  return Boolean(githubToken())
}

/** Library Promote target — default this monorepo (`packages/ui`). */
export function zaolyUiGithubRepo(): string {
  return process.env[paths.envZaolyUiGithubRepo]?.trim() || paths.zaolyUiGithubRepo
}

/** Retired on Zaoly standalone — federation health returns out-of-scope. */
export async function probeFederationReachable(): Promise<boolean> {
  return false
}

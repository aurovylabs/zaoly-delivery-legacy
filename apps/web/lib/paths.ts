/** Central path and shell configuration for Zaoly (standalone editor). */

/** Query key for token path on DELETE `/api/tokens` and hub deep-link `/tokens`. */
const TOKEN_PACK_PATH_QUERY_KEY = 'path'

export const paths = {
  /** Legacy NavRail metrics — product chrome is horizontal top nav (P67); kept for shellFrameStyle zeroing. */
  railInsetRem: 0,
  railGapRem: 0,
  railWidthRem: 0,
  mainGutterRem: 2.5,
  /** AppFrame data-rail-edge; left padding overridden by `.creation-app-frame--top-chrome`. */
  railDockEdge: 'left' as const,
  /** CD: radius 0 always (sharp edges). */
  brandCornerRadiusPx: 0,
  brandLabel: 'Zaoly',
  productId: 'zaoly' as const,
  /**
   * Product favicon + brand static assets under `apps/web/public/`.
   * Seal 造 on cobalt (CD) — not suite MSQDX mark. knowledge/corporate-design.md
   */
  brandAssets: {
    mark: '/brand/zaoly-mark.svg',
    wordmark: '/brand/zaoly-wordmark.svg',
    favicon: '/favicon.ico',
    faviconSvg: '/favicon.svg',
    appleTouchIcon: '/apple-touch-icon.png',
  },
  /** Public landing section ids and first-party visual assets. */
  landing: {
    sections: {
      product: 'produkt',
      compare: 'vergleich',
      kit: 'zaoly-kit',
      tokens: 'token-studio',
      workflow: 'workflow',
      contact: 'kontakt',
    },
    /** Public marketing demos (not authenticated `/kit` / `/tokens` hubs). */
    exploreChapters: ['editor', 'kit', 'tokens', 'screens', 'path'] as const,
    assets: {
      heroArtboard: '/landing/hero-artboard.svg',
      kitAssembly: '/landing/kit-assembly.svg',
      tokenStudioApp: '/landing/token-studio-app.jpg',
      kitPlaygroundApp: '/landing/kit-playground-app.jpg',
      /** Editor Compare: desktop + tablet + mobile artboards side by side. */
      editorBreakpointsApp: '/landing/editor-breakpoints-app.jpg',
    },
  },
  faq: {
    sections: {
      product: 'produkt-projekte',
      editor: 'editor-kit',
      tokens: 'tokens',
      collaboration: 'zusammenarbeit-verlauf',
      handoff: 'uebergabe-qualitaet',
      access: 'zugang-betrieb',
    },
  },
  /** Seal glyph 造 — knowledge/corporate-design.md */
  productSealGlyph: '造' as const,
  /** Login / invite Bildmarke (cobalt seal) — large, centered. */
  loginSealSizePx: 120,
  loginSplitSealSizePx: 120,
  /**
   * Brand primary (cobalt) — single hex SoT for chrome + Site Kit + token fixtures.
   * knowledge/corporate-design.md foundations 9a
   */
  brandPrimaryHex: '#1f44ff' as const,
  brandPrimaryHexDark: '#3e63ff' as const,
  brandPrimaryContrastHex: '#f3eee4' as const,
  /**
   * Warm charcoal — light-theme chrome / hub bar ground.
   * knowledge/corporate-design.md foundations 9a
   */
  brandWarmGrayHex: '#2e2a24' as const,
  brandWarmGrayContrastHex: '#f3eee4' as const,
  /** Accent preference id that maps to brandPrimaryHex (not Tailwind blue). */
  defaultAccent: 'blue' as const,
  /** When true (default), editor boots standalone; retired suite adapters optional. */
  standaloneMode: true as const,
  devPort: 3009,
  /** Local Compose host port → container 5432. Avoids suite clash with Echon on 5433. */
  localPostgresHostPort: 5434,
  defaultDisplayName: 'Zaoly',
  displayNameStorageKey: 'zaoly.displayName',
  themeStorageKey: 'zaoly.themePreference',
  accentStorageKey: 'zaoly.accentPreference',
  localeStorageKey: 'zaoly.locale',
  /** Cards | List preference for projects hub (Audion hubIndexLayout pattern). */
  hubIndexLayoutKey: 'zaoly.hubIndexLayout',
  /** Ephemeral Kit Playground TSX drafts (tab session). Spec: site-kit-playground.md SK-V4 / SK-V9 */
  kitPlaygroundDraftStorageKey: 'zaoly.kit.playground.draft.v2',
  /** Kit Playground column widths (sidebar px + editor/preview share). Spec: site-kit-playground.md SK-V21 */
  kitPlaygroundColumnsStorageKey: 'zaoly.kit.playground.columns.v1',
  /** Min height (px) for the three-pane Kit body. Spec: site-kit-playground.md SK-V23 */
  kitPlaygroundBodyMinHeightPx: 1200,
  i18nLibPath: 'apps/web/lib/i18n.ts',
  localesDir: 'apps/web/locales',
  /** CD cream-first; dark uses foundations 9a dark column. */
  defaultTheme: 'light' as const,
  defaultLocale: 'en' as const,
  themeChoices: ['light', 'dark', 'auto'] as const,
  localeChoices: ['en', 'de'] as const,
  federationContract: '2026-05-zaoly-federation-v3' as const,
  dataSource: 'fixtures' as const,
  federationMode: 'dummy' as const,
  envFederationBase: 'NEXT_ZAOLY_FEDERATION_BASE_URL',
  /** Staging Zaoly/CREATION origin for Storyblok preview + export copy links. */
  ecosystemStagingZaoly: 'https://creation-v3.projects-a.plygrnd.tech',
  // Retired suite launcher staging (Audion/…): see knowledge/paths.md § Retired suite env.
  envAudionPublicUrl: 'NEXT_PUBLIC_AUDION_URL',
  envCheckionPublicUrl: 'NEXT_PUBLIC_CHECKION_URL',
  envEchonPublicUrl: 'NEXT_PUBLIC_ECHON_URL',
  federationProductsPath: '/products',
  envPublicUrl: 'NEXT_PUBLIC_ZAOLY_URL',
  /** Optional public inbox for website product and enterprise enquiries. */
  envPublicSiteContactEmail: 'NEXT_PUBLIC_ZAOLY_CONTACT_EMAIL',
  publicSiteContactEmailDefault: 'hello@example.com',
  /**
   * Hosted zaoly.app bootstrap + platform admin email.
   * Seeded by `scripts/deploy-weddy.sh` · note `/root/.zaoly-admin`.
   */
  hostedBootstrapAdminEmail: 'admin@example.com',
  /** Public product site. Traefik on the weddy VPS. Ops: knowledge/deploy-weddy-server.md */
  publicSiteOrigin: 'http://localhost:3009',
  envEditorUrl: 'ZAOLY_EDITOR_URL',
  /** In-repo DS marker (`packages/ui`). Default `in-repo`. Spec: zaoly-ui-in-repo.md */
  envZaolyUiSource: 'ZAOLY_UI_SOURCE',
  zaolyUiSourceDefault: 'in-repo',
  /** Client-only catalog renderer map — webpack/vitest alias, not the server barrel or `@zaoly/ui/catalog` metadata. */
  zaolyUiCatalogModule: '@zaoly/ui/catalog-registry',
  /** Optional catalog view URL — never hardcode the Storybook FQDN in app code. */
  envZaolyUiStorybook: 'NEXT_PUBLIC_ZAOLY_UI_STORYBOOK',
  /** Site Kit Storybook origin (Coolify sibling in Zaoly-Creation-v3). */
  envSiteKitStorybook: 'NEXT_PUBLIC_SITE_KIT_STORYBOOK',
  /**
   * Storyblok (CMS) docs — clipboard handoff PoC only (no Space push).
   * Spec: `specs/domain/storyblok-handoff.md` · knowledge/storyblok-handoff.md
   * Not Storybook (CSF).
   */
  storyblokDocsStoryObject:
    'https://www.storyblok.com/docs/api/management/stories/the-story-object',
  storyblokDocsComponentObject:
    'https://www.storyblok.com/docs/api/management/components/the-component-object',
  storyblokDocsCreateComponent:
    'https://www.storyblok.com/docs/api/management/components/create-a-component',
  /** Management API origin (server / scripts only — never browser). */
  storyblokManagementApiBase: 'https://mapi.storyblok.com/v1',
  /** Content Delivery API origin (preview/public token). */
  storyblokCdnApiBase: 'https://api.storyblok.com/v2/cdn',
  /** Storyblok app origin for Visual Editor deep-links. */
  storyblokAppBase: 'https://app.storyblok.com',
  /** Preview Bridge script (Visual Editor live updates). */
  storyblokBridgeScriptUrl: 'https://app.storyblok.com/f/storyblok-v2-latest.js',
  envStoryblokSpaceId: 'STORYBLOK_SPACE_ID',
  /** Personal access token — Management API (create components/stories). */
  envStoryblokManagementToken: 'STORYBLOK_MANAGEMENT_TOKEN',
  /** Space preview token — CDN read only. */
  envStoryblokPreviewToken: 'STORYBLOK_PREVIEW_TOKEN',
  /**
   * Opt-in Storyblok CMS handoff UI + push (`1`/`true`). Default **off** for Zaoly —
   * Export must not dump pack JSON / snackbars on hosted. Spec: storyblok-handoff.md.
   */
  envZaolyStoryblokHandoff: 'ZAOLY_STORYBLOK_HANDOFF',
  /** Max chars for editor error toasts (never dump full JSON packs). */
  editorToastMessageMaxChars: 240,
  /** Public atom CDN origin (includes `/cdn` path). SK-V14 · knowledge/site-kit-cdn.md */
  envSiteKitCdn: 'NEXT_PUBLIC_SITE_KIT_CDN',
  /** Canonical atom CDN URL when env unset (Storybook host `/cdn` prefix). */
  siteKitCdnDefault: 'https://creation-site-kit.projects-a.plygrnd.tech/cdn',
  siteKitCdnModuleFile: 'site-kit.js',
  siteKitCdnCssFile: 'site-kit.css',
  /** Absolute or cwd-relative root of `@zaoly/site-kit` for direct writes. */
  envSiteKitRoot: 'ZAOLY_SITE_KIT_ROOT',
  /**
   * SK-S4 — when `1`/`true`, allow Publish/Write onto global atom seed (`SiteButton`).
   * Default designers MUST use Collection forks (`Atom~…`). Document in knowledge/paths.md.
   */
  envSiteKitSharedSeedWrite: 'ZAOLY_SITE_KIT_SHARED_SEED_WRITE',
  /** Default relative kit package (repo root = creation-v3). */
  siteKitPackageRelPath: 'packages/site-kit',
  /** npm package name — Patterns import via `/c/{scopeKey}/…` (SK-S5). */
  siteKitPackageName: '@zaoly/site-kit',
  siteKitStorybookPort: 6007,
  siteKitOverridesRelPath: '.data/site-kit/overrides',
  /** GitHub token for Phase-4 library promote PRs (Contents + Pulls). Never leak in health. */
  envGithubToken: 'GITHUB_TOKEN',
  /** Optional GitHub API origin override (GHES). */
  envGithubApiUrl: 'GITHUB_API_URL',
  /** Canonical GitHub REST origin — document in `knowledge/paths.md`. */
  githubApiBaseDefault: 'https://api.github.com',
  /** Pin REST version (docs: apiVersion=2026-03-10). */
  githubApiVersion: '2026-03-10',
  githubPromoteUserAgent: 'zaoly-library-promote',
  /** Optional `owner/repo` override for Library Promote into `packages/ui`. Default: this monorepo. */
  envZaolyUiGithubRepo: 'ZAOLY_UI_GITHUB_REPO',
  zaolyUiGithubRepo: 'aurovylabs/zaoly-delivery',
  githubPromoteBaseBranch: 'main',
  githubPromoteBranchPrefix: 'promote/',
  /** Operator Coolify REST — never call from the browser. Knowledge: `knowledge/paths.md`. */
  coolifyApiBase: 'https://coolify.plygrnd.tech/api/v1',
  coolifyAppUuid: 'uk1t9tnsqo65vlpzo2vwq0u2',
  /** @deprecated DS Storybook — not Site Kit. Prefer coolifySiteKitStorybookUuid. */
  coolifyStorybookUuid: 'rtxcfh4gtxi6yba5l70fu177',
  /** creation-v3 Site Kit Storybook Coolify app. */
  coolifySiteKitStorybookUuid: 'em07kflrn07qukfxyfy84tyh',
  creationGithubRepo: 'aurovylabs/zaoly-delivery',
  /**
   * Delivery / self-host container image (GHCR). Built from product Dockerfile;
   * consumed by `delivery/docker-compose.yml` (no source tree).
   * Knowledge: `zaoly-delivery-repo.md`
   */
  deliveryContainerImage: 'ghcr.io/aurovylabs/zaoly-delivery',
  /**
   * Public community source remote (export via `npm run export:community`).
   * Landing footer links here — not the internal Origin tree.
   * Org `aurovylabs` hosts **delivery only** (no private product repos).
   * Knowledge: `zaoly-community-distribution.md` · `zaoly-repo-remotes.md`
   */
  communityGithubRepo: 'aurovylabs/zaoly-delivery',
  /** Default branch for GitHub blob links (Kit atom source SK-V19). */
  creationGithubDefaultBranch: 'main',
  /** Prefer in-app `/editor` when truthy (default on outside production). */
  envEditorInApp: 'ZAOLY_EDITOR_INAPP',
  /**
   * Smart Canvas HUD (W1). Client-readable.
   * Truthy / unset → smart lanes; `0`/`false`/`off` → legacy Insert+structure strip.
   * Spec: `specs/domain/canvas-smart-hud.md`
   */
  envSmartHud: 'NEXT_PUBLIC_ZAOLY_SMART_HUD',
  /**
   * Opt-in Smart HUD telemetry CustomEvents (no PII).
   * `1`/`true`/`on` → dispatch `paths.hudTelemetryEvent`; default off.
   */
  envHudTelemetry: 'NEXT_PUBLIC_ZAOLY_HUD_TELEMETRY',
  /** Window event name for HUD telemetry payloads. */
  hudTelemetryEvent: 'zaoly:hud-telemetry',
  /**
   * Window event: HUD → Inspect opens SiteSvg deep-edit dialog.
   * Knowledge: `knowledge/canvas-smart-hud.md` (hostAction openSvgDeepEdit).
   */
  hudHostOpenSvgDeepEditEvent: 'zaoly:hud-host:open-svg-deep-edit',
  /**
   * Window event: canvas inline text edit active flag for HUD mutate gate.
   * Detail: `{ active: boolean }`. Knowledge: `knowledge/canvas-inline-text-edit.md`.
   */
  inlineEditActiveEvent: 'zaoly:inline-edit-active',
  /**
   * Hybrid editor onboarding (Welcome → Empty → tour → Done).
   * Spec: `specs/domain/onboarding.md` · knowledge: `onboarding-pattern-notes.md`
   */
  onboarding: {
    welcomeStorageKey: 'zaoly-onboarding-welcome-v1',
    /** v3 = 12 micro-steps (inspect notice, token pick, activate BP tile). */
    tourStorageKey: 'zaoly-onboarding-tour-v3',
    emptySkipStorageKey: 'zaoly-onboarding-empty-skip',
    queryParam: 'onboarding',
    compositionChangedEvent: 'zaoly:composition-changed',
    actionEvent: 'zaoly:onboarding-action',
    /** Host asks panels to focus a useful target (e.g. Tokens → color filter). */
    prepareEvent: 'zaoly:onboarding-prepare',
  },
  /** Absolute or cwd-relative JSON file for durable scene persistence. */
  envSceneStorePath: 'ZAOLY_SCENE_STORE_PATH',
  envTokenPackStorePath: 'ZAOLY_TOKEN_PACK_PATH',
  tokenPackStoreRelPath: '.data/token-pack.json',
  tokenPackPathQueryKey: TOKEN_PACK_PATH_QUERY_KEY,
  /** Max UTF-8 byte length for a single leaf `value` on PATCH (`pack-validate.ts`). */
  tokenPackMaxValueBytes: 16_384,
  /** Max UTF-8 byte length for POST `/api/tokens/import` JSON body string. */
  tokenPackMaxImportBytes: 512_000,
  /** Download filenames for Token Studio pack dumps. */
  tokenPackDownloadJsonName: 'zaoly-tokens.json',
  tokenPackDownloadCssName: 'zaoly-tokens.css',
  /** DTCG `$extensions` key for Zaoly studio round-trip payload. */
  tokenPackStudioExtensionKey: 'com.zaoly.studio',
  /** CSS custom property prefix for pack paths (`color.action.primary` → `--zaoly-color-action-primary`). */
  zaolyTokenCssVarPrefix: '--zaoly-',

  /** Absolute or cwd-relative JSON for MagazineTemplate publish store (Phase 4). */
  envMagazineTemplateStorePath: 'ZAOLY_MAGAZINE_TEMPLATE_STORE_PATH',
  /** Postgres URL — when set, `/api/scenes*` uses PG (P18). Runtime-only; blank at Docker build. */
  envDatabaseUrl: 'ZAOLY_DATABASE_URL',
  /**
   * Redis URL for cross-replica Scene SSE + presence store (Wave D) and launch codes (W2).
   * Unset → in-process bus + memory presence + memory launch codes (valid while swarm_replicas=1).
   * REQUIRED before Coolify replicas > 1.
   */
  envRedisUrl: 'ZAOLY_REDIS_URL',
  /** Pub/Sub channel for scene-updated + presence-updated fan-out. */
  sceneEventsRedisChannel: 'zaoly:scene-bus',
  /** Redis hash key prefix for scene presence (`{prefix}:{sceneId}`). */
  presenceRedisKeyPrefix: 'zaoly:presence',
  /** Soft TTL refresh on presence hash keys (seconds). */
  presenceRedisKeyTtlSec: 20,
  /** Redis string key prefix for single-use editor launch codes (`{prefix}:{jti}`). */
  launchCodeRedisKeyPrefix: 'zaoly:launch',
  /** Default relative to process.cwd() (usually `apps/web` under Next). */
  sceneStoreRelPath: '.data/scenes.json',
  /** Client Page Share durable JSON (when Postgres unset). Spec: client-page-share.md */
  clientPageShareStoreRelPath: '.data/client-page-shares.json',
  envClientPageShareStorePath: 'ZAOLY_CLIENT_SHARE_STORE_PATH',
  /** Feature gate — default on; set `0`/`false`/`off` to disable mint + public resolve. */
  envClientPageShareEnabled: 'ZAOLY_CLIENT_SHARE_ENABLED',
  /** When truthy, create requires password (enterprise-leaning default off for local DX). */
  envClientPageShareRequirePassword: 'ZAOLY_CLIENT_SHARE_REQUIRE_PASSWORD',
  /** Local policy defaults when suite federation unreachable (P2). */
  envClientPageShareAllowPublicLink: 'ZAOLY_CLIENT_SHARE_ALLOW_PUBLIC_LINK',
  envClientPageShareAllowLiveHead: 'ZAOLY_CLIENT_SHARE_ALLOW_LIVE_HEAD',
  envClientPageShareAllowEmailAllowlist: 'ZAOLY_CLIENT_SHARE_ALLOW_EMAIL_ALLOWLIST',
  /** Max TTL days (default 30). */
  envClientPageShareMaxTtlDays: 'ZAOLY_CLIENT_SHARE_MAX_TTL_DAYS',
  /** HMAC secret for password-unlock cookies; falls back to suite service secret. */
  envClientPageShareUnlockSecret: 'ZAOLY_CLIENT_SHARE_UNLOCK_SECRET',
  clientPageShareTokenPrefix: 'crs_',
  /** Scene.comments id prefix for pins projected from client share guests. */
  clientShareSceneCommentIdPrefix: 'cmt_crs_',
  clientPageShareUnlockCookie: 'zaoly_crs_unlock',
  clientPageShareDefaultTtlDays: 14,
  clientPageShareMaxTtlDaysDefault: 30,
  /** Editor copy/paste JSON envelope kind (`knowledge/editor-clipboard.md`). */
  editorClipboardKind: 'zaoly.scene-nodes',
  /** FS fallback for version checkpoints when Postgres unset (W3). */
  sceneVersionsStoreRelPath: '.data/scene-versions',
  /** Optional absolute/relative root for FS version checkpoints. */
  envVersionStorePath: 'ZAOLY_VERSION_STORE_PATH',
  /** Default relative MagazineTemplate JSON store. */
  magazineTemplateStoreRelPath: '.data/magazine-templates.json',
  /** Wire compat for published MagazineTemplate. */
  magazineTemplateCompatVersion: '2026-08-magazine-template-v1',
  /** Quick Scan Mag PDF consumer role. */
  magazineTemplateRoleQuickCheck: 'quick-check-magazine',
  /** EQC → 16:9 pitch slides template role. */
  magazineTemplateRoleQuickCheckSlides: 'quick-check-slides',
  /** Placeholder image src for Image nodes (demo / default child). */
  imagePlaceholderUrl: 'https://placehold.co/320x180',
  imagePlaceholderHeroUrl: 'https://placehold.co/480x200',
  /**
   * Zaoly wordmark SVG path `d` for MagPage logo (react-pdf Svg).
   * Same mark as suite PDF helper — no Coolify/CDN URL.
   * Knowledge: `knowledge/paths.md` · `knowledge/creation-p80-magazine-pdf.md`
   */
  zaolyLogoPdfViewBox: '0 0 167 40',
  zaolyLogoPdfPathD:
    'M97.2578 39.9922L97.25 40V39.9922H97.2578ZM81.3662 0C89.9238 0 96.8764 6.78107 97.2188 15.25L97.25 39.9922H88.6807V30C86.4899 31.1408 84.0089 31.7939 81.3701 31.7939C75.4322 31.7939 70.2574 28.5321 67.5322 23.7031C66.5924 28.8865 61.5514 32.0107 55.6367 32.0107C51.7983 32.0107 46.2771 30.5195 44.2715 25.1865V31.2783H35.5566V15.6074C35.5566 13.2462 35.497 9.14551 31.0342 9.14551C26.5718 9.1458 26.5127 13.2424 26.5127 15.6074V31.2783H17.7588V15.6074C17.7588 13.2463 17.7035 9.14579 13.2373 9.14551C8.77061 9.14551 8.71485 13.2423 8.71484 15.6074V31.2783H0V15.1865C0 8.72536 0.425246 6.7809 3.15039 3.88867C5.51382 1.41784 9.93031 0.271484 13.2373 0.271484C16.0487 0.271577 19.6629 1.10615 22.1318 2.87305C24.6048 1.10606 28.2198 0.271484 31.0312 0.271484C34.3392 0.271595 38.7587 1.42083 41.1172 3.88867C42.8004 5.67968 43.6061 7.10397 43.9756 9.45703C44.3656 3.95925 49.5209 0.362485 55.415 0.362305C59.2971 0.362305 65.9819 1.90097 66.7686 9.61816C69.2028 3.96682 74.8231 8.89035e-05 81.3662 0ZM165.024 0.405273C166.114 0.405273 166.999 1.29057 166.999 2.38086V8.74219C166.999 9.83228 166.113 10.7178 165.024 10.7178H159.146C157.804 10.7178 156.719 11.8038 156.719 13.1455V19.0293C156.719 20.1195 155.834 21.0049 154.745 21.0049H148.866C147.525 21.0051 146.441 22.0912 146.44 23.4326V29.3164C146.44 30.4066 145.555 31.2919 144.466 31.292H138.11C137.02 31.2919 136.136 30.4066 136.136 29.3164V22.9561C136.136 21.8659 137.021 20.9806 138.11 20.9805H143.989C145.33 20.9805 146.416 19.8943 146.416 18.5527V12.6689C146.416 11.5787 147.302 10.6934 148.391 10.6934H154.27C155.611 10.6933 156.696 9.60635 156.696 8.26465V2.38184C156.696 1.29169 157.581 0.406488 158.67 0.40625H165.025L165.024 0.405273ZM118.135 0.40625C126.562 0.406358 133.649 7.04075 133.85 15.4707C134.054 24.156 127.059 31.283 118.427 31.2832H103.869V0.40625H118.135ZM165.018 20.9678C166.11 20.9678 166.996 21.8542 166.996 22.9473V29.3027C166.996 30.3959 166.111 31.2822 165.018 31.2822H158.666C157.573 31.282 156.688 30.3958 156.688 29.3027V22.9473C156.689 21.8544 157.574 20.968 158.666 20.9678H165.018ZM44.208 12.0273C44.2478 12.9477 44.2637 13.9915 44.2637 15.1914V22.1963H52.376C52.7494 24.9191 55.3605 24.9189 55.7383 24.9189C57.2289 24.9189 58.8291 24.0658 58.8291 22.625C58.8289 20.3301 56.6391 20.0633 50.9883 17.875C47.7947 16.8527 45.042 14.9438 44.208 12.0273ZM81.3623 8.26855C77.202 8.26869 73.836 11.6417 73.8359 15.8008C73.8359 19.9599 77.2058 23.3329 81.3623 23.333C85.5228 23.333 88.8896 19.9639 88.8896 15.8008C88.8895 11.6378 85.5227 8.26855 81.3623 8.26855ZM112.063 22.2354H118.427V22.2363C121.946 22.2362 124.812 19.3669 124.812 15.8447C124.812 12.3225 121.946 9.45328 118.427 9.45312H112.063V22.2354ZM55.3145 7.46484C53.447 7.46492 52.8059 8.63753 52.8057 9.43652C52.8057 11.0423 54.9881 11.9523 57.3398 12.6406L57.3408 12.6396H57.3447C60.353 13.4785 63.476 14.3474 65.4932 16.2959C65.4893 16.1631 65.4815 16.0332 65.4814 15.9033C65.4814 13.7072 65.9295 11.6138 66.7354 9.70898H58.0869C58.0355 9.06724 57.93 7.46484 55.3145 7.46484ZM143.173 0.405273C144.095 0.405273 144.844 1.15482 144.844 2.07812V7.43848C144.844 8.36275 144.096 9.11133 143.173 9.11133H137.816C136.893 9.11117 136.146 8.36168 136.146 7.43848V2.0791C136.146 1.15493 136.893 0.40641 137.816 0.40625H143.173V0.405273Z',
  zaolyLogoPdfDefaultWidth: 52,
  zaolyLogoPdfDefaultHeight: 12,
  /**
   * DS face load (Noto Sans JP + Noto Sans + IBM Plex Mono) — same stack as `@zaoly/ui` tokens.
   * App loads via `next/font/local` in `app/layout.tsx` (files under `apps/web/fonts/`); URL is the canonical Google CSS twin.
   * Knowledge: `knowledge/paths.md` · `knowledge/creation-editor-fonts.md`
   */
  googleFontsCssUrl:
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@200;300;400;500;700&family=Noto+Sans:wght@200;300;400;500;700&display=swap',
  /** Base for on-demand Google Fonts CSS2 (scene + inspect typography). */
  googleFontsCss2Base: 'https://fonts.googleapis.com/css2',
  /**
   * Google Fonts family catalog SSOT (Web). macOS Resources is a synced twin —
   * `npm run sync:google-fonts` / `check:google-fonts` (`scripts/sync-google-font-families.mjs`).
   * Knowledge: `knowledge/paths.md` · `knowledge/canvas-smart-hud-macos.md`
   */
  googleFontFamiliesJsonRelPath: 'apps/web/lib/fonts/google-font-families.json',
  /** macOS Resources twin of `googleFontFamiliesJsonRelPath` (byte-identical after sync). */
  macosGoogleFontFamiliesJsonRelPath:
    'apps/macos/Resources/google-font-families.json',
  /** Local Zaoly Vite editor when ZAOLY_EDITOR_URL unset (non-production only). */
  editorDevFallbackHttp: 'http://127.0.0.1:5174',
  envServiceSecret: 'ZAOLY_SERVICE_SECRET',
  // Retired upstream pack env keys — Zaoly uses local pack only.
  /** Server-side VIDEON origin for Collection media consume (P0 stills). */
  envVideonApiUrl: 'VIDEON_API_URL',
  envVideonPublicUrl: 'NEXT_PUBLIC_VIDEON_URL',
  /** Server-side METRON origin for Collection KPI catalog/evaluate. */
  envMetronApiUrl: 'METRON_API_URL',
  envMetronPublicUrl: 'NEXT_PUBLIC_METRON_URL',
  /** Server-side CHECKION origin for Collection scan distillate. */
  envCheckionApiUrl: 'CHECKION_API_URL',
  /** Upstream VIDEON media list (project-scoped). */
  videonMediaListPath: '/api/media',
  /** Upstream VIDEON frame still. */
  videonMediaFramePath: (mediaAssetId: string) =>
    `/api/media/${encodeURIComponent(mediaAssetId)}/frame`,
  /** Upstream METRON KPI list. */
  metronKpisPath: '/api/kpis',
  /** Upstream METRON KPI evaluate. */
  metronKpiEvaluatePath: (kpiId: string) =>
    `/api/kpis/${encodeURIComponent(kpiId)}/evaluate`,
  /** Upstream CHECKION Collection distillate (provisioning BFF). */
  checkionProvisioningProjectPath: (platformProjectId: string) =>
    `/api/platform/provisioning/projects/${encodeURIComponent(platformProjectId)}`,
  // Retired upstream pack routes — see knowledge/upstream-pack-out-of-scope-for-zaoly.md.
  activePackQueryKey: 'platformProjectId' as const,
  localPlatformProjectPrefix: 'plx-local-' as const,
  /** Unbound local editor: BFF returns fixture + `localPromotePreview` under AUTH_BYPASS. */
  localPromotePreviewPlatformId: 'plx-local-preview' as const,
  /**
   * Staging Zaoly Collection (DS-DEPOSIT D2/D4) — deposit guideline SSOT.
   * Knowledge: `knowledge/paths.md`.
   */
  zaolyDepositPlatformProjectId: '32498667-471e-4b21-b920-5eff5c338300',
  zaolyDepositGuidelineId: 'gl-msrxlt4u',
  /** Vaillant **Group** Collection only (gl-mtinudb1 · Spirion cap_bdda0c1e). NOT consumer Vaillant project. */
  vaillantGroupPlatformProjectId: 'f3d27e9f-d14c-4880-82be-3ca31c051173',
  /** @deprecated Use vaillantGroupPlatformProjectId — same Collection id, kept for compat. */
  vaillantPlatformProjectId: 'f3d27e9f-d14c-4880-82be-3ca31c051173',
  /** Copied D5 consume map (canonical deposit semantic map in sibling repo). */
  dsDepositComponentSemanticMapPath: 'apps/web/lib/ds-deposit/component-semantic-map.json',
  dsDepositComponentSemanticMapLibPath: 'apps/web/lib/ds-deposit/component-semantic-map.ts',
  envFederationAuthUrl: 'ZAOLY_FEDERATION_AUTH_URL',
  envAuthSecret: 'AUTH_SECRET',
  authDevFallbackSecret: 'zaoly-local-dev-auth-secret-min-32chars',
  /**
   * Dev-only single-actor bypass (`dev-local`). Production must never set this.
   * Default off when Postgres user-store is active (`zaoly-user-management.md`).
   */
  envAuthBypass: 'ZAOLY_AUTH_BYPASS',
  /** Bootstrap first admin when `users` is empty (requires ZAOLY_DATABASE_URL). */
  envZaolyBootstrapAdminEmail: 'ZAOLY_BOOTSTRAP_ADMIN_EMAIL',
  envZaolyBootstrapAdminPassword: 'ZAOLY_BOOTSTRAP_ADMIN_PASSWORD',
  /** Kill-switch for public self-registration (`0` / `false` / `off`). Default on. */
  envZaolyPublicSignup: 'ZAOLY_PUBLIC_SIGNUP',
  /** Google OAuth client id (Auth.js). */
  envAuthGoogleId: 'AUTH_GOOGLE_ID',
  /** Google OAuth client secret (Auth.js). */
  envAuthGoogleSecret: 'AUTH_GOOGLE_SECRET',
  /** Invite token TTL seconds (default 7d). */
  userInviteTtlSeconds: 7 * 24 * 60 * 60,
  /** Password-reset token TTL seconds (default 1h). Spec: zaoly-system-mail.md */
  passwordResetTtlSeconds: 60 * 60,
  /** Soft email-verify token TTL seconds (default 48h). Spec: zaoly-user-management.md */
  emailVerifyTtlSeconds: 48 * 60 * 60,
  /** Local Mailpit UI (docker compose). Knowledge: local-dev.md */
  localMailpitUiOrigin: 'http://localhost:8025',
  localMailpitSmtpHost: '127.0.0.1',
  localMailpitSmtpPort: 1025,
  /** Optional SMTP for system mail. Spec: zaoly-system-mail.md */
  envZaolySmtpHost: 'ZAOLY_SMTP_HOST',
  envZaolySmtpPort: 'ZAOLY_SMTP_PORT',
  envZaolySmtpUser: 'ZAOLY_SMTP_USER',
  envZaolySmtpPass: 'ZAOLY_SMTP_PASS',
  envZaolySmtpFrom: 'ZAOLY_SMTP_FROM',
  envZaolySmtpFromName: 'ZAOLY_SMTP_FROM_NAME',
  envZaolySmtpTls: 'ZAOLY_SMTP_TLS',
  /**
   * Hosted / compose-managed SMTP (`1`/`true`/`yes`).
   * Env is SSOT — admin Settings MUST NOT override. Self-host leaves unset and uses Settings.
   * Hosted MTA hostname: `hostedSmtpHost` (`mail.zaoly.app`).
   */
  envZaolySmtpManaged: 'ZAOLY_SMTP_MANAGED',
  /** Dedicated hosted MTA (docker-mailserver). Knowledge: zaoly-mail-identity.md */
  hostedSmtpHost: 'smtp.example.com',
  hostedSmtpFromDefault: 'noreply@example.com',
  /**
   * Comma-separated emails promoted to `platform_admin` on schema ensure.
   * Spec: `zaoly-platform-admin.md`
   */
  envZaolyPlatformAdminEmails: 'ZAOLY_PLATFORM_ADMIN_EMAILS',
  /** `1`/`true`/`yes`/`on` enables impersonation APIs · Phase 2b */
  envZaolyPlatformAdminImpersonation: 'ZAOLY_PLATFORM_ADMIN_IMPERSONATION',
  /** `1`/`true`/`yes`/`on` — platform_admin must enroll MFA before other `/admin` modules */
  envZaolyPlatformAdminMfaRequired: 'ZAOLY_PLATFORM_ADMIN_MFA_REQUIRED',
  mfaIssuer: 'Zaoly',
  mfaRecoveryCodeCount: 8,
  mfaTotpDigits: 6,
  mfaTotpPeriodSec: 30,
  /** WebAuthn challenge + login ticket TTL (seconds) */
  webauthnChallengeTtlSeconds: 120,
  webauthnTicketTtlSeconds: 60,
  impersonationCookieName: 'zaoly_impersonate',
  /** Absolute TTL for view-as cookie · hardening P0 */
  impersonationTtlSeconds: 30 * 60,
  impersonationReasonMinLength: 8,
  anonymizedEmailDomain: 'anonymized.invalid',
  /**
   * In-process auth rate limits (per IP, sliding window).
   * Spec: `knowledge/zaoly-admin-hardening.md`
   */
  rateLimitAuthLoginMax: 10,
  rateLimitAuthLoginWindowMs: 60_000,
  rateLimitAuthRegisterMax: 5,
  rateLimitAuthRegisterWindowMs: 60_000,
  rateLimitAuthForgotMax: 5,
  rateLimitAuthForgotWindowMs: 60_000,
  rateLimitAuthInviteMax: 20,
  rateLimitAuthInviteWindowMs: 60_000,
  /** Default / max page size for `GET /api/admin/users?limit=` · `zaoly-platform-admin.md` */
  adminUsersPageSizeDefault: 50,
  adminUsersPageSizeMax: 100,
  /** Default / max page size for `GET /api/admin/audit` */
  adminAuditPageSizeDefault: 50,
  adminAuditPageSizeMax: 100,
  smtpDefaultPort: 587,
  smtpDefaultFromName: 'Zaoly',
  smtpDefaultTls: 'starttls' as const,
  smtpSettingsKey: 'smtp',
  /** `0`/`false` disables default standalone open. */
  envZaolyStandalone: 'ZAOLY_STANDALONE',
  /** Optional error webhook (server) — W4 `reportError`. */
  envErrorWebhookUrl: 'ZAOLY_ERROR_WEBHOOK_URL',
  /** Optional error webhook (browser / error.tsx) — W4. */
  envErrorWebhookUrlPublic: 'NEXT_PUBLIC_ZAOLY_ERROR_WEBHOOK_URL',
  /** Optional Sentry DSN (server) — W9 `reportError`. */
  envSentryDsn: 'ZAOLY_SENTRY_DSN',
  /** Optional Sentry DSN (browser / error boundaries) — W9. */
  envSentryDsnPublic: 'NEXT_PUBLIC_ZAOLY_SENTRY_DSN',
  /** Legacy env aliases (envGet): ZAOLY_SENTRY_DSN / NEXT_PUBLIC_ZAOLY_SENTRY_DSN */
  /** Optional: enable Session Replay (error-only) when browser DSN set — W10. */
  envSentryReplay: 'NEXT_PUBLIC_ZAOLY_SENTRY_REPLAY',
  /** Build-time Sentry org slug for source map upload — W10. */
  envSentryOrg: 'SENTRY_ORG',
  /** Build-time Sentry project slug — W10. */
  envSentryProject: 'SENTRY_PROJECT',
  /** Build-time Sentry auth token (never commit) — W10. */
  envSentryAuthToken: 'SENTRY_AUTH_TOKEN',
  /** Tunnel path for browser→Sentry via Next (ad-blocker bypass) — W10. */
  sentryTunnelPath: '/monitoring/sentry-tunnel',
  envFederationMode: 'ZAOLY_FEDERATION_MODE',
  envFederationDemoOwner: 'ZAOLY_FEDERATION_DEMO_OWNER_USER_ID',
  envFederationDemoCompany: 'ZAOLY_FEDERATION_DEMO_COMPANY_ID',
  envLaunchTokenSecret: 'ZAOLY_LAUNCH_TOKEN_SECRET',
  /** Site Kit Storybook Live view token (HMAC). Spec: site-kit-collection-scope.md SK-S1. */
  /** Optional Coolify Storybook hydrate secret (SK-S1 Pattern CSF bake). */
  envSiteKitHydrateSecret: 'ZAOLY_SITE_KIT_HYDRATE_SECRET',
  siteKitViewTokenHeader: 'X-Zaoly-Site-Kit-View',
  siteKitViewTokenQueryParam: 'zaolyViewToken',
  /** Reusable until expiry — Live poll (~4s). */
  siteKitViewTokenTtlSeconds: 8 * 60 * 60,
  /** Provisioning: CREATION-first Collection origin (Wave 3). */
  provisioningCreationProjectOriginPath: '/api/platform/provisioning/creation-project-origin',
  /** Provisioning: upsert CREATION mirrors for all Collections a user can see. */
  provisioningSyncCapabilityMirrorsPath: '/api/platform/provisioning/sync-capability-mirrors',
  /** Provisioning: sync sibling mirrors for one Collection. */
  provisioningProjectSyncPath: (platformProjectId: string) =>
    `/api/platform/provisioning/projects/${encodeURIComponent(platformProjectId)}/sync`,
  /** Provisioning: list Collections a user can see. */
  provisioningAccessibleCollectionsPath: '/api/platform/provisioning/accessible-collections',
  /** Service: Collection lifecycle (archive / restore). */
  provisioningProjectPath: (platformProjectId: string) =>
    `/api/platform/provisioning/projects/${encodeURIComponent(platformProjectId)}`,
  /** Service: create / list Collection invite links. */
  provisioningCollectionInvitesPath: (platformProjectId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/invites`,
  /** Service: Client Page Share policy (P2). */
  provisioningCollectionClientSharePolicyPath: (platformProjectId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/client-share-policy`,
  /** Service: Client Page Share inventory projection. */
  provisioningCollectionClientSharesPath: (platformProjectId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/client-shares`,
  provisioningCollectionClientSharePath: (platformProjectId: string, shareId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/client-shares/${encodeURIComponent(shareId)}`,
  /** Service: Client Page Share audit ingest (P5). */
  provisioningCollectionClientShareEventsPath: (platformProjectId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/client-share-events`,
  /** Service: list / add Collection members (Team SSOT). Spec: `specs/domain/project-team.md` */
  provisioningCollectionMembersPath: (platformProjectId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/members`,
  /** Service: revoke one Collection member. */
  provisioningCollectionMemberPath: (platformProjectId: string, userId: string) =>
    `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/members/${encodeURIComponent(userId)}`,
  editorLaunchCodeQueryParam: 'launchCode',
  /** One-shot palette hydrate from Kit Playground (`Composition:Hero` / `SiteButton`). */
  editorInsertTypeQueryParam: 'insertType',
  /** Optional editor UX tip (`save-pattern` = Pattern workflow banner). Spec: editor-launch.md SK-V7 */
  editorHintQueryParam: 'hint',
  editorHintSavePattern: 'save-pattern',
  editorHintSavePatternStorageKey: 'zaoly.editor.hint.save-pattern.dismissed.v1',
  /** Chart studio FloatingPanel dock (edge + offset). Spec: chart-studio-panel.md */
  chartStudioDockStorageKey: 'zaoly.editor.chart-studio.dock.v1',
  /** Breakpoint Compare board on/off (device). Spec: responsive-breakpoint-closeout.md */
  breakpointCompareStorageKey: 'zaoly.editor.breakpoint-compare.v1',
  editorLaunchCodeTtlSeconds: 120,
  routes: {
    apiAuthNextAuth: '/api/auth',
    home: '/',
    faq: '/faq',
    /** Public interactive product demos (marketing). */
    explore: '/explore',
    exploreChapter: (chapter: string) => `/explore/${encodeURIComponent(chapter)}`,
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
    apiAuthForgotPassword: '/api/auth/forgot-password',
    apiAuthResetPassword: '/api/auth/reset-password',
    apiAuthVerifyEmail: '/api/auth/verify-email',
    apiAuthVerifyEmailResend: '/api/auth/verify-email/resend',
    apiMePassword: '/api/me/password',
    apiAuthMfaPrepare: '/api/auth/mfa/prepare',
    apiAdminMfa: '/api/admin/mfa',
    apiAdminMfaSetup: '/api/admin/mfa/setup',
    apiAdminMfaConfirm: '/api/admin/mfa/confirm',
    apiAdminMfaDisable: '/api/admin/mfa/disable',
    apiAdminWebAuthnRegisterOptions: '/api/admin/webauthn/register/options',
    apiAdminWebAuthnRegisterVerify: '/api/admin/webauthn/register/verify',
    apiAdminWebAuthnCredentials: '/api/admin/webauthn/credentials',
    apiAdminWebAuthnCredential: (id: string) =>
      `/api/admin/webauthn/credentials/${encodeURIComponent(id)}`,
    apiAuthWebAuthnLoginOptions: '/api/auth/webauthn/login/options',
    apiAuthWebAuthnLoginVerify: '/api/auth/webauthn/login/verify',
    projects: '/projects',
    projectDetail: (id: string) => `/projects/${encodeURIComponent(id)}`,
    compositions: '/compositions',
    editor: '/editor',
    library: '/library',
    /** Site Kit Playground — ephemeral TSX + live preview (no Coolify rebuild). */
    kit: '/kit',
    tokens: '/tokens',
    /** Token Studio hub with leaf focus (`?path=`). */
    tokensFocus: (tokenPath: string) => {
      const trimmed = tokenPath.trim()
      if (!trimmed) return '/tokens'
      return `/tokens?${TOKEN_PACK_PATH_QUERY_KEY}=${encodeURIComponent(trimmed)}`
    },
    /**
     * Storyblok Visual Editor preview host (Site Kit + token pack CSS).
     * Space Settings → Visual Editor Location → `{origin}/preview/storyblok/`
     */
    storyblokPreview: '/preview/storyblok',
    settings: '/settings',
    /** Legacy admin users hub — redirects to `adminUsers` · `zaoly-platform-admin.md` */
    settingsUsers: '/settings/users',
    /** Platform admin console · Spec `zaoly-platform-admin.md` */
    admin: '/admin',
    adminUsers: '/admin/users',
    adminMail: '/admin/mail',
    adminAudit: '/admin/audit',
    adminSecurity: '/admin/security',
    inviteAccept: (token: string) => `/invite/${encodeURIComponent(token)}`,
    /** Public client page share viewer · Spec `client-page-share.md` */
    clientPageShare: (token: string) => `/share/p/${encodeURIComponent(token)}`,
    apiMe: '/api/me',
    apiRegister: '/api/register',
    apiAdminOverview: '/api/admin/overview',
    apiAdminUsers: '/api/admin/users',
    apiAdminUser: (id: string) => `/api/admin/users/${encodeURIComponent(id)}`,
    apiAdminUserForcePasswordReset: (id: string) =>
      `/api/admin/users/${encodeURIComponent(id)}/force-password-reset`,
    apiAdminUserAnonymize: (id: string) =>
      `/api/admin/users/${encodeURIComponent(id)}/anonymize`,
    apiAdminUsersInvite: '/api/admin/users/invite',
    apiAdminAudit: '/api/admin/audit',
    apiAdminImpersonate: '/api/admin/impersonate',
    apiAdminImpersonateStop: '/api/admin/impersonate/stop',
    apiAdminSmtp: '/api/admin/smtp',
    apiAdminSmtpTest: '/api/admin/smtp/test',
    apiInvitesAccept: '/api/invites/accept',
    apiSceneMembers: (id: string) => `/api/scenes/${encodeURIComponent(id)}/members`,
    apiSceneMember: (id: string, userId: string) =>
      `/api/scenes/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    apiHealth: '/api/health',
    apiFederationHealth: '/api/federation/health',
    apiProjects: '/api/projects',
    apiProjectsCollections: '/api/projects/collections',
    apiProject: (id: string) => `/api/projects/${encodeURIComponent(id)}`,
    apiProjectArchive: (id: string) => `/api/projects/${encodeURIComponent(id)}/archive`,
    /** Collection Team roster · `specs/domain/project-team.md` (retired BFF on Zaoly). */
    apiProjectMembers: (id: string) => `/api/projects/${encodeURIComponent(id)}/members`,
    apiProjectMember: (id: string, userId: string) =>
      `/api/projects/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    /** Collection-scoped invite link (Team panel) — not the scene share invite. */
    apiProjectInvites: (id: string) => `/api/projects/${encodeURIComponent(id)}/invites`,
    apiProvisioningProject: (id: string) =>
      `/api/platform/provisioning/projects/${encodeURIComponent(id)}`,
    apiEditorLaunchCode: '/api/editor/launch-code',
    apiEditorLaunchCodeRedeem: '/api/editor/launch-code/redeem',
    apiLibraryCatalog: '/api/library/catalog',
    apiLibraryPromoteDryRun: '/api/library/promote/dry-run',
    apiLibraryPromote: '/api/library/promote',
    apiCompositions: '/api/compositions',
    apiScenes: '/api/scenes',
    apiScene: (id: string) => `/api/scenes/${encodeURIComponent(id)}`,
    apiSceneEvents: (id: string) => `/api/scenes/${encodeURIComponent(id)}/events`,
    apiSceneOps: (id: string) => `/api/scenes/${encodeURIComponent(id)}/ops`,
    apiSceneImportHtml: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/import-html`,
    apiScenePreviewHtml: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/preview-html`,
    apiSceneCraftDebug: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/craft-debug`,
    apiScenePdf: (id: string) => `/api/scenes/${encodeURIComponent(id)}/pdf`,
    /** WYSIWYG artboard PNG/PDF — specs/api/scene-surface-export.md */
    apiSceneExport: (id: string) => `/api/scenes/${encodeURIComponent(id)}/export`,
    /**
     * Retired Magcloud routes — thin 410 stubs only
     * (`print-out-of-scope-for-zaoly.md`). No product client.
     */
    apiScenePublishMagcloud: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/publish-magcloud`,
    apiMagcloudBoards: '/api/magcloud/boards',
    apiSceneShareInvite: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/share-invite`,
    /** Client Page Share CRUD · Spec `specs/api/client-page-share.md` */
    apiSceneClientShares: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/client-shares`,
    apiSceneClientShare: (id: string, shareId: string) =>
      `/api/scenes/${encodeURIComponent(id)}/client-shares/${encodeURIComponent(shareId)}`,
    /** Immediate designer reply/resolve mirror onto share guest threads (P9). */
    apiSceneClientShareThread: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/client-share-thread`,
    apiPublicClientShare: (token: string) =>
      `/api/public/client-shares/${encodeURIComponent(token)}`,
    apiPublicClientShareUnlock: (token: string) =>
      `/api/public/client-shares/${encodeURIComponent(token)}/unlock`,
    apiPublicClientShareHtml: (token: string) =>
      `/api/public/client-shares/${encodeURIComponent(token)}/html`,
    apiPublicClientShareComments: (token: string) =>
      `/api/public/client-shares/${encodeURIComponent(token)}/comments`,
    apiPublicClientShareExport: (token: string) =>
      `/api/public/client-shares/${encodeURIComponent(token)}/export`,
    /** Suite → Collection admin revoke (P4). Spec: client-page-share.md */
    apiProvisioningCollectionClientShare: (
      platformProjectId: string,
      shareId: string,
    ) =>
      `/api/platform/provisioning/collections/${encodeURIComponent(platformProjectId)}/client-shares/${encodeURIComponent(shareId)}`,
    apiScenePresence: (id: string) => `/api/scenes/${encodeURIComponent(id)}/presence`,
    apiScenePresenceHeartbeat: (id: string) =>
      `/api/scenes/${encodeURIComponent(id)}/presence/heartbeat`,
    apiMagazineTemplates: '/api/magazine-templates',
    apiMagazineTemplate: (id: string) =>
      `/api/magazine-templates/${encodeURIComponent(id)}`,
    apiMagazineTemplatePublish: (id: string) =>
      `/api/magazine-templates/${encodeURIComponent(id)}/publish`,
    apiMagazineTemplateVersion: (id: string, version: number | string) =>
      `/api/magazine-templates/${encodeURIComponent(id)}/versions/${encodeURIComponent(String(version))}`,
    /** CREATION BFF — Collection active brand pack (P41). */
    apiBrandTokens: '/api/brand-tokens',
    /** Zaoly local Token Studio pack (fixture + overrides). */
    apiTokens: '/api/tokens',
    /** Admin DTCG JSON import (dry-run diff → apply). */
    apiTokensImport: '/api/tokens/import',
    /** CREATION BFF — Collection VIDEON media list (P0 stills). */
    apiVideonMedia: '/api/videon-media',
    apiVideonMediaFrame: (mediaAssetId: string) =>
      `/api/videon-media/${encodeURIComponent(mediaAssetId)}/frame`,
    /** CREATION BFF — Collection data bind catalog / resolve. */
    apiCollectionDataCatalog: '/api/collection-data/catalog',
    apiCollectionDataResolve: '/api/collection-data/resolve',
    apiCollectionDataCollections: '/api/collection-data/collections',
    /** Site Kit direct write (no GitHub). Spec: `specs/api/site-kit-write.md`. */
    apiSiteKitWrite: '/api/site-kit/write',
    /** Batch publish Masters + one Storybook rebuild. Spec: site-kit.md §5b. */
    apiSiteKitPublish: '/api/site-kit/publish',
    /** Site Kit → CREATION Pull/Reset. Spec: site-kit-kit-pull.md */
    apiSiteKitPull: '/api/site-kit/pull',
    apiSiteKitPullFixture: '/api/site-kit/pull-fixture',
    apiSiteKitSeed: (componentId: string) =>
      `/api/site-kit/seed/${encodeURIComponent(componentId)}`,
    /** Batch seed kitRevision for Kit drift. Spec: site-kit-kit-pull.md */
    apiSiteKitSeedRevisions: '/api/site-kit/seed-revisions',
    apiSiteKitCatalog: '/api/site-kit/catalog',
    apiSiteKitCompositions: '/api/site-kit/compositions',
    apiSiteKitCompositionsFromScene: '/api/site-kit/compositions/from-scene',
    /** Save page artboard(s) as Site Kit Pattern(s). Spec: page-as-pattern.md */
    apiSiteKitCompositionsFromPage: '/api/site-kit/compositions/from-page',
    apiSiteKitStorybookViewToken: '/api/site-kit/storybook-view-token',
    apiSiteKitOverride: (componentId: string) =>
      `/api/site-kit/overrides/${encodeURIComponent(componentId)}`,
    /** Read-only TSX seed + composition for `/kit` Playground. */
    apiSiteKitPlaygroundSource: '/api/site-kit/playground-source',
    /** Read-only package atom implementation source for `/kit` Handoff (SK-V18). */
    apiSiteKitAtomSource: '/api/site-kit/atom-source',
    /** Push Storyblok handoff pack (Management API, server-side). Spec: storyblok-handoff.md */
    apiStoryblokPush: '/api/storyblok/push',
  },
  /** `/kit?componentId=` selection deep-link. */
  kitComponentQueryParam: 'componentId',
} as const

/** Build `/kit` href with optional Collection + component selection. */
export function kitPlaygroundHref(options?: {
  componentId?: string | null
  platformProjectId?: string | null
}): string {
  const q = new URLSearchParams()
  const componentId = options?.componentId?.trim()
  const platformProjectId = options?.platformProjectId?.trim()
  if (componentId) q.set(paths.kitComponentQueryParam, componentId)
  if (platformProjectId) q.set(paths.activePackQueryKey, platformProjectId)
  const qs = q.toString()
  return qs ? `${paths.routes.kit}?${qs}` : paths.routes.kit
}

/** Public community repo URL for landing / docs (not the internal Origin remote). */
export function communityGithubUrl(): string {
  return `https://github.com/${paths.communityGithubRepo}`
}

/**
 * GitHub blob URL for a file under `packages/site-kit` (SK-V19 Kit atom source).
 * `relPath` is catalog-relative (e.g. `src/components/Button.tsx`).
 */
export function siteKitGithubBlobUrl(relPath: string): string {
  const clean = relPath.trim().replace(/^\/+/, '').replace(/\\/g, '/')
  return `https://github.com/${paths.creationGithubRepo}/blob/${paths.creationGithubDefaultBranch}/${paths.siteKitPackageRelPath}/${clean}`
}

/** Absolute Storyblok Visual Preview URL for a slug (staging default origin). */
export function storyblokPreviewHref(
  slug = '',
  options?: { origin?: string; platformProjectId?: string },
): string {
  const origin = (options?.origin || paths.ecosystemStagingZaoly).replace(/\/$/, '')
  const base = `${origin}${paths.routes.storyblokPreview}`
  const clean = slug.replace(/^\/+|\/+$/g, '')
  const path = clean ? `${base}/${clean}` : `${base}/`
  if (!options?.platformProjectId) return path
  const q = new URLSearchParams()
  q.set(paths.activePackQueryKey, options.platformProjectId)
  return `${path}?${q.toString()}`
}

/** `GET /api/brand-tokens?platformProjectId=` (P41 BFF). */
export function brandTokensUrl(platformProjectId: string): string {
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  return `${paths.routes.apiBrandTokens}?${q.toString()}`
}

/** `GET /api/videon-media?platformProjectId=` (P0 BFF list). */
export function videonMediaListUrl(platformProjectId: string): string {
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  return `${paths.routes.apiVideonMedia}?${q.toString()}`
}

/** Same-origin BFF frame URL for canvas paint / thumbs. */
export function videonMediaFrameUrl(
  mediaAssetId: string,
  platformProjectId: string,
  opts?: { tMs?: number; w?: number },
): string {
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  if (opts?.tMs != null) q.set('t', String(opts.tMs))
  if (opts?.w != null) q.set('w', String(opts.w))
  return `${paths.routes.apiVideonMediaFrame(mediaAssetId)}?${q.toString()}`
}

/** Upstream VIDEON media list URL on a given origin. */
export function videonUpstreamMediaListUrl(base: string, platformProjectId: string): string {
  const origin = base.replace(/\/$/, '')
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  return `${origin}${paths.videonMediaListPath}?${q.toString()}`
}

/** Upstream VIDEON frame URL on a given origin. */
export function videonUpstreamMediaFrameUrl(
  base: string,
  mediaAssetId: string,
  platformProjectId: string,
  opts?: { tMs?: number; w?: number },
): string {
  const origin = base.replace(/\/$/, '')
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  if (opts?.tMs != null) q.set('t', String(opts.tMs))
  if (opts?.w != null) q.set('w', String(opts.w))
  return `${origin}${paths.videonMediaFramePath(mediaAssetId)}?${q.toString()}`
}

/** `GET /api/collection-data/catalog?platformProjectId=` */
export function collectionDataCatalogUrl(platformProjectId: string): string {
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  return `${paths.routes.apiCollectionDataCatalog}?${q.toString()}`
}

/** `POST /api/collection-data/resolve` */
export function collectionDataResolveUrl(): string {
  return paths.routes.apiCollectionDataResolve
}

/** `GET /api/collection-data/collections` — accessible Collections for chart source picker. */
export function collectionDataCollectionsUrl(): string {
  return paths.routes.apiCollectionDataCollections
}

/** Upstream METRON KPI list. */
export function metronUpstreamKpisUrl(base: string, platformProjectId: string): string {
  const origin = base.replace(/\/$/, '')
  const q = new URLSearchParams({ [paths.activePackQueryKey]: platformProjectId })
  return `${origin}${paths.metronKpisPath}?${q.toString()}`
}

/** Upstream METRON KPI evaluate. */
export function metronUpstreamKpiEvaluateUrl(base: string, kpiId: string): string {
  const origin = base.replace(/\/$/, '')
  return `${origin}${paths.metronKpiEvaluatePath(kpiId)}`
}

/** Upstream CHECKION Collection distillate. */
export function checkionUpstreamProvisioningProjectUrl(
  base: string,
  platformProjectId: string,
): string {
  const origin = base.replace(/\/$/, '')
  return `${origin}${paths.checkionProvisioningProjectPath(platformProjectId)}`
}

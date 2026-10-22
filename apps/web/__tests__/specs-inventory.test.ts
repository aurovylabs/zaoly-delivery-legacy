import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../../..')

const requiredSpecs = [
  'specs/domain/app-shell.md',
  'specs/domain/plexon-federation.md',
  'specs/domain/suite-enterprise-program.md',
  'specs/domain/project-workspace.md',
  'specs/domain/editor-launch.md',
  'specs/domain/auth-bridge.md',
  'specs/domain/domain-hubs.md',
  'specs/domain/compositions-hub.md',
  'specs/domain/zaoly-composition-persistence.md',
  'specs/domain/zaoly-standalone.md',
  'specs/domain/zaoly-landingpage-concept.md',
  'specs/domain/zaoly-public-faq.md',
  'specs/domain/cache-components-adoption.md',
  'knowledge/cache-components-adoption.md',
  'specs/domain/zaoly-user-management.md',
  'specs/domain/zaoly-platform-admin.md',
  'specs/domain/zaoly-platform-admin-mfa.md',
  'specs/domain/zaoly-platform-admin-webauthn.md',
  'specs/domain/zaoly-system-mail.md',
  'specs/domain/zaoly-token-studio.md',
  'specs/api/zaoly-tokens.md',
  'specs/domain/zaoly-scene-share.md',
  'specs/api/zaoly-users.md',
  'specs/api/zaoly-platform-admin.md',
  'specs/api/zaoly-platform-admin-mfa.md',
  'specs/api/zaoly-platform-admin-webauthn.md',
  'specs/api/zaoly-system-mail.md',
  'knowledge/zaoly-token-studio.md',
  'knowledge/zaoly-system-mail.md',
  'knowledge/zaoly-hosted-vs-self-host.md',
  'knowledge/zaoly-platform-admin.md',
  'knowledge/zaoly-platform-admin-mfa.md',
  'knowledge/zaoly-platform-admin-webauthn.md',
  'knowledge/zaoly-admin-hardening.md',
  'knowledge/self-host.md',
  'specs/api/zaoly-scene-members.md',
  'specs/domain/library-hub.md',
  'specs/domain/mcp-server.md',
  'specs/domain/settings.md',
  'specs/domain/editor-migration.md',
  'specs/domain/composition-scene.md',
  'specs/domain/scene-agent-editing.md',
  'specs/domain/scene-content-audit.md',
  'specs/domain/scene-preview.md',
  'specs/domain/scene-surface-export.md',
  'specs/domain/magcloud-slide-handoff.md',
  'specs/domain/html-scene-import.md',
  'specs/domain/craft-debug.md',
  'specs/domain/composition-magazine-pdf.md',
  'specs/domain/magazine-template.md',
  'specs/domain/library-composition-roundtrip.md',
  'specs/domain/editor-workspace.md',
  'specs/domain/onboarding.md',
  'knowledge/onboarding-pattern-notes.md',
  'specs/domain/scene-pages.md',
  'specs/domain/editor-inspect.md',
  'specs/domain/canvas-drag-reorder.md',
  'specs/domain/code-export-handoff.md',
  'specs/domain/storyblok-handoff.md',
  'specs/domain/storyblok-preview.md',
  'specs/api/storyblok-push.md',
  'specs/domain/artboard-dimensions.md',
  'specs/domain/artboard-presets.md',
  'knowledge/artboard-presets.md',
  'specs/domain/media-breakpoints.md',
  'knowledge/media-breakpoints.md',
  'specs/domain/zaoly-webdesign-product.md',
  'knowledge/zaoly-webdesign-product.md',
  'knowledge/print-out-of-scope-for-zaoly.md',
  'specs/domain/macos-editor-app.md',
  'specs/domain/brand-token-consume.md',
  'specs/domain/collection-data-bind.md',
  'specs/domain/videon-asset-consume.md',
  'specs/api/videon-media-bff.md',
  'specs/api/collection-data-bff.md',
  'specs/domain/editor-presence-collaboration.md',
  'specs/domain/concurrent-edit-w6.md',
  'specs/domain/scene-history-patches-w7.md',
  'specs/domain/scene-structural-sharing-w8.md',
  'specs/domain/editor-share-invite.md',
  'specs/domain/client-page-share.md',
  'specs/api/client-page-share.md',
  'specs/domain/project-team.md',
  'specs/domain/editor-version-history.md',
  'specs/domain/editor-version-diff.md',
  'specs/domain/composition-masters-analytics.md',
  'specs/domain/editor-preflight-a11y.md',
  'specs/domain/editor-i18n-stress-test.md',
  'specs/domain/surface-clip-slant.md',
  'specs/domain/site-table.md',
  'specs/domain/site-kit.md',
  'specs/domain/site-kit-compositions.md',
  'specs/domain/site-kit-kit-pull.md',
  'specs/domain/site-kit-collection-scope.md',
  'specs/domain/site-kit-playground.md',
  'specs/domain/site-kit-cdn.md',
  'specs/domain/page-as-pattern.md',
  'specs/api/site-kit-write.md',
  'specs/domain/canvas-smart-hud.md',
  'specs/domain/canvas-spacing-overlay.md',
  'specs/domain/ci-and-error-boundary.md',
  'specs/domain/auth-hardening-w2.md',
  'specs/domain/version-store-durable-w3.md',
  'specs/domain/observability-and-unbound-w4.md',
  'specs/domain/observability-sentry-w9.md',
  'specs/domain/observability-sentry-w10.md',
  'specs/domain/observability-sentry-data-collection.md',
  'knowledge/zaoly-ui-react-align.md',
  'specs/domain/zaoly-ui-in-repo.md',
  'knowledge/zaoly-ui-in-repo.md',
  'specs/domain/zaoly-naming-purge.md',
  'knowledge/zaoly-naming-purge.md',
  'specs/domain/desktop-web-parity.md',
  'knowledge/desktop-web-parity.md',
  'specs/domain/desktop-tauri-cross-platform.md',
  'knowledge/desktop-tauri-cross-platform.md',
  'knowledge/inspector-hud-layout-ownership.md',
  'knowledge/inspector-uniformity.md',
  'specs/domain/scene-core-split-w5.md',
  'specs/api/projects.md',
  'specs/api/catalog.md',
  'specs/api/scenes.md',
  'specs/api/scene-ops.md',
  'specs/api/scene-html-import.md',
  'specs/api/composition-magazine-pdf.md',
  'specs/api/scene-surface-export.md',
  'specs/api/magcloud-slide-handoff.md',
  'specs/api/magazine-templates.md',
  'specs/api/library-promote.md',
  'specs/api/brand-tokens.md',
  'specs/api/scene-presence.md',
  'specs/api/scene-versions.md',
  'knowledge/paths.md',
  'knowledge/magazine-template-publish.md',
  'knowledge/library-composition-roundtrip.md',
  'knowledge/library-promote-github.md',
  'knowledge/catalog-ssot-p4-smoke.md',
  'knowledge/creation-storybook-test-scenario.md',
  'knowledge/promote-inspect-chrome.md',
  'knowledge/print-mag-capability-matrix.md',
  'knowledge/editor-launch.md',
  'knowledge/auth-bridge.md',
  'knowledge/collection-bindings.md',
  'knowledge/library-fixture-sources.md',
  'knowledge/mcp-server.md',
  'knowledge/legacy-naming-leftovers.md',
  'knowledge/html-scene-import.md',
  'knowledge/scene-agent-editing.md',
  'knowledge/site-kit.md',
  'knowledge/creation-storyblok-einfach.md',
  'knowledge/artboard-dimensions.md',
  'knowledge/site-kit-collection-scope.md',
  'knowledge/site-kit-playground.md',
  'knowledge/site-kit-cdn.md',
  'knowledge/page-as-pattern.md',
  'knowledge/site-kit-storybook-coolify.md',
  'knowledge/keep-drop-backlog.md',
  'knowledge/platform-surface-ownership.md',
  'knowledge/creation-vs-metron-dashboard.md',
  'knowledge/collection-data-bind.md',
  'knowledge/scene-surface-export.md',
  'knowledge/magcloud-slide-handoff.md',
  'knowledge/zaoly-sunset.md',
  'knowledge/editor-parity-checklist.md',
  'knowledge/web-parity-requirements.md',
  'knowledge/editor-parity-parallel-plan.md',
  'knowledge/editor-parity-deferred-plan.md',
  'knowledge/editor-ui-finetune.md',
  'knowledge/creation-layers-panel-multi-bump.md',
  'knowledge/editor-clipboard.md',
  'knowledge/editor-palette-forms.md',
  'knowledge/editor-palette-composition.md',
  'knowledge/editor-palette-molecules.md',
  'knowledge/editor-palette-charts.md',
  'specs/domain/editor-palette-charts.md',
  'knowledge/chart-studio-panel.md',
  'specs/domain/chart-studio-panel.md',
  'knowledge/editor-palette-list.md',
  'knowledge/editor-palette-groups.md',
  'knowledge/editor-palette-print.md',
  'knowledge/editor-palette-persona.md',
  'knowledge/editor-palette-entity.md',
  'knowledge/editor-atomic-slots.md',
  'knowledge/editor-print-surface.md',
  'knowledge/token-layers.md',
  'knowledge/ds-tokens-as-plexon-project.md',
  'apps/web/lib/ds-deposit/component-semantic-map.json',
  'tasks/00-token-consume-plan.md',
  'tasks/p80-scene-pages-plan.md',
  'tasks/p90-scene-agent-api-plan.md',
  'tasks/p98-inspect-layout-clarity.md',
  'knowledge/editor-drag-insert.md',
  'knowledge/creation-postgres.md',
  'knowledge/zaoly-postgres.md',
  'knowledge/zaoly-redis.md',
  'knowledge/scene-store.md',
  'knowledge/empty-projects-after-ds-deposit.md',
  'knowledge/collection-picker.md',
  'knowledge/editor-inspect-port.md',
  'knowledge/editor-inspect-density.md',
  'knowledge/editor-inspect-literals.md',
  'knowledge/token-picker-length-p76.md',
  'knowledge/token-picker-browser-p77.md',
  'knowledge/creation-p77-token-picker-browser-bump.md',
  'knowledge/creation-p79-magazine-pdf.md',
  'knowledge/creation-p80-magazine-pdf.md',
  'knowledge/creation-p83.md',
  'knowledge/creation-p84.md',
  'knowledge/editor-inspect-icons.md',
  'knowledge/editor-immersive-layout.md',
  'knowledge/shell-chrome.md',
  'knowledge/chrome-tooltips.md',
  'knowledge/staging-coolify.md',
  'knowledge/enterprise-hardening-backlog.md',
  'knowledge/concurrent-edit-decision.md',
  'knowledge/backup-rollback.md',
  'knowledge/observability.md',
  'knowledge/scene-core-split.md',
  'knowledge/site-svg.md',
  'knowledge/site-shape-clip-d.md',
  'knowledge/master-component-sets-phase3.md',
  'knowledge/master-edit-exit-chrome.md',
  'knowledge/master-edit-board-dimension.md',
  'knowledge/master-edit-palette-insert.md',
  'knowledge/master-edit-variant-breakpoint-matrix.md',
  'specs/domain/master-edit-board-dimension.md',
  'specs/domain/master-edit-variant-breakpoint-matrix.md',
  'specs/domain/responsive-breakpoint-set-primary.md',
  'knowledge/responsive-breakpoint-set-primary.md',
  'knowledge/responsive-breakpoint-closeout.md',
  'knowledge/master-variant-board-chrome.md',
  'knowledge/kit-master-axes-export.md',
  'knowledge/master-named-variants-phase2.md',
  'knowledge/layout-containment-nested-width.md',
  'knowledge/canvas-inline-text-edit.md',
  'knowledge/site-table.md',
  'knowledge/canvas-smart-hud.md',
  'AGENTS.md',
]

describe('specs inventory', () => {
  for (const rel of requiredSpecs) {
    it(`exists: ${rel}`, () => {
      expect(existsSync(path.join(repoRoot, rel))).toBe(true)
    })
  }

  it('locks Metron as dashboard builder — Creation does not own analytics authoring', () => {
    const doc = readFileSync(
      path.join(repoRoot, 'knowledge/creation-vs-metron-dashboard.md'),
      'utf8',
    )
    expect(doc).toContain('CREATION is not the suite dashboard-builder engine')
    expect(doc).toContain('METRON')
    expect(doc).toContain('Do not host `/dashboards/:id/edit`')
    const surface = readFileSync(
      path.join(repoRoot, 'knowledge/platform-surface-ownership.md'),
      'utf8',
    )
    expect(surface).toContain('creation-vs-metron-dashboard.md')
  })

  it('creation-storyblok-einfach explains Site Kit JSX and Send to Storyblok', () => {
    const doc = readFileSync(
      path.join(repoRoot, 'knowledge/creation-storyblok-einfach.md'),
      'utf8',
    )
    expect(doc).toContain('React/JSX')
    expect(doc).toContain('Send to Storyblok')
    expect(doc).toContain('Site Kit')
    expect(doc).toContain('layout')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('creation-storyblok-einfach.md')
  })

  it('artboard-dimensions documents custom WxH and expanded print presets', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/artboard-dimensions.md'), 'utf8')
    expect(spec).toContain('frame.height')
    expect(spec).toContain('A3')
    expect(spec).toContain('Letter')
    expect(spec).toContain('slide-16-9')
    expect(spec).toContain('1920×1080')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/artboard-dimensions.md'), 'utf8')
    expect(knowledge).toContain('Frame width')
    expect(knowledge).toContain('DIN')
    expect(knowledge).toContain('16:9')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('artboard-dimensions.md')
  })

  it('media-breakpoints and webdesign product direction are documented', () => {
    const media = readFileSync(path.join(repoRoot, 'specs/domain/media-breakpoints.md'), 'utf8')
    expect(media).toContain('media.breakpoint.')
    expect(media).toContain('--zaoly-media-')
    const product = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-webdesign-product.md'),
      'utf8',
    )
    expect(product).toContain('enterprise web design')
    expect(product).toContain('print')
    const printOoS = readFileSync(
      path.join(repoRoot, 'knowledge/print-out-of-scope-for-zaoly.md'),
      'utf8',
    )
    expect(printOoS).toContain('out of scope')
    expect(printOoS).toContain('print_out_of_scope')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('media-breakpoints.md')
    expect(pathsDoc).toContain('zaoly-webdesign-product.md')
    expect(pathsDoc).toContain('print_out_of_scope')
  })

  it('site-kit-playground locks SK-V22 starter Sections', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/site-kit-playground.md'), 'utf8')
    expect(spec).toContain('SK-V22')
    expect(spec).toContain('Sections (starter)')
    expect(spec).toContain('Composition:Landing')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/site-kit-playground.md'), 'utf8')
    expect(knowledge).toContain('SK-V22')
    const masters = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-landing-section-masters.md'),
      'utf8',
    )
    expect(masters).toContain('Kit Playground')
    expect(masters).toContain('buildStarterSectionPlaygroundSeed')
  })

  it('zaoly-webdesign-cleanup locks W1–W6 waves', () => {
    const spec = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-webdesign-cleanup.md'),
      'utf8',
    )
    expect(spec).toContain('W1')
    expect(spec).toContain('formatMediaBreakpointQueries')
    expect(spec).toContain('W2')
    expect(spec).toContain('print_out_of_scope')
    expect(spec).toContain('POST /api/scenes/:id/pdf')
    expect(spec).toContain('W3')
    expect(spec).toContain('activeBreakpoint: print')
    expect(spec).toContain('W4')
    expect(spec).toContain('buildEditorPaletteCatalog')
    expect(spec).toContain('W5')
    expect(spec).toContain('W6')
    expect(spec).toContain('NativeAddPageSheet')
    const plan = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-webdesign-cleanup-plan.md'),
      'utf8',
    )
    expect(plan).toContain('enterprise web design')
    expect(plan).toContain('**W1**')
    expect(plan).toContain('**W5**')
    expect(plan).toContain('macOS native digital IA (W6)')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('zaoly-webdesign-cleanup-plan.md')
  })

  it('artboard-presets documents pack-backed page size catalog', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/artboard-presets.md'), 'utf8')
    expect(spec).toContain('artboard.preset.')
    expect(spec).toContain('type: "artboard"')
    expect(spec).toContain('OP-9')
    expect(spec).toContain('Page frame Inspect')
    expect(spec).toContain('planApplyArtboardPresetToPage')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/artboard-presets.md'), 'utf8')
    expect(knowledge).toContain('artboard.preset.desktop')
    expect(knowledge).toContain('Token Studio')
    expect(knowledge).toContain('Size presets')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('artboard-presets.md')
  })

  it('scene-surface-export locks WYSIWYG PNG/PDF vs Magazin PDF', () => {
    const domain = readFileSync(path.join(repoRoot, 'specs/domain/scene-surface-export.md'), 'utf8')
    expect(domain).toContain('WYSIWYG')
    expect(domain).toContain('png')
    expect(domain).toContain('composition-magazine-pdf.md')
    expect(domain).toContain('png_requires_single_page')
    const api = readFileSync(path.join(repoRoot, 'specs/api/scene-surface-export.md'), 'utf8')
    expect(api).toContain('apiSceneExport')
    expect(api).toContain('POST /api/scenes/:id/export')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-surface-export.md'), 'utf8')
    expect(knowledge).toContain('surface-export.ts')
    expect(knowledge).toContain('Magazin PDF')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('/api/scenes/:id/export')
  })

  it('magcloud-slide-handoff is removed (410 stubs only)', () => {
    const domain = readFileSync(path.join(repoRoot, 'specs/domain/magcloud-slide-handoff.md'), 'utf8')
    expect(domain).toContain('Removed')
    expect(domain).toContain('410')
    expect(domain).toContain('/api/magcloud/boards')
    const api = readFileSync(path.join(repoRoot, 'specs/api/magcloud-slide-handoff.md'), 'utf8')
    expect(api).toContain('apiScenePublishMagcloud')
    expect(api).toContain('print_out_of_scope')
    expect(api).not.toContain('MAGCLOUD_UNIVERSE_URL')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/magcloud-slide-handoff.md'), 'utf8')
    expect(knowledge).toContain('removed')
    expect(knowledge).toContain('publish-magcloud')
    expect(knowledge).not.toContain('creation/deliver')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('/api/scenes/:id/publish-magcloud')
    expect(pathsDoc).toContain('/api/magcloud/boards')
    expect(pathsDoc).not.toContain('MAGCLOUD_UNIVERSE_URL')
    const pathsTs = readFileSync(path.join(repoRoot, 'apps/web/lib/paths.ts'), 'utf8')
    expect(pathsTs).not.toContain('MAGCLOUD_')
  })

  it('app-shell names Zaoly hubs and forbids suite chrome', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/app-shell.md'), 'utf8')
    expect(spec).toContain('zaoly')
    expect(spec).toContain('/compositions')
    expect(spec).toContain('/tokens')
    expect(spec).toContain('horizontal')
    expect(spec).toContain('creation-top-nav')
    expect(spec).toContain('zaoly-hub-chrome')
    expect(spec).toContain('topbar trail host')
    expect(spec).toContain('AppShell preview')
    expect(spec).toContain('/share/p/:token')
    expect(spec).toContain('MUST **not** mount a platform Assistant')
    expect(spec).not.toContain('product=creation')
  })

  it('paths knowledge documents Zaoly env and suite out-of-scope', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(doc).toContain('3009')
    expect(doc).toContain('suite_out_of_scope')
    expect(doc).toContain('upstream_pack_out_of_scope')
    expect(doc).toContain('suite-federation-out-of-scope-for-zaoly.md')
    expect(doc).toContain('/api/tokens')
  })

  it('federation spec documents Wave 3 provisioning', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/plexon-federation.md'), 'utf8')
    expect(spec).toContain('creation-project-origin')
    expect(spec).toContain('/api/platform/provisioning/projects/{id}')
    expect(spec).toContain('sync-capability-mirrors')
    expect(spec).toContain('accessible-collections')
    expect(spec).toContain('P71')
  })

  it('auth-bridge documents launchCode mint and redeem', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/auth-bridge.md'), 'utf8')
    expect(spec).toContain('launchCode')
    expect(spec).toContain('/api/editor/launch-code')
    expect(spec).toContain('redeem')
    expect(spec).toContain('launchCodeRedisKeyPrefix')
    expect(spec).toContain('auth-hardening-w2.md')
  })

  it('W2 auth hardening: Redis launch codes and production bypass lock', () => {
    const w2 = readFileSync(path.join(repoRoot, 'specs/domain/auth-hardening-w2.md'), 'utf8')
    expect(w2).toContain('GETDEL')
    expect(w2).toContain('NODE_ENV')
    expect(w2).toContain('ZAOLY_AUTH_BYPASS')
    const runtime = readFileSync(path.join(repoRoot, 'apps/web/lib/runtime-config.ts'), 'utf8')
    expect(runtime).toContain("NODE_ENV === 'production'")
    const launch = readFileSync(path.join(repoRoot, 'apps/web/lib/launch-token.ts'), 'utf8')
    expect(launch).toContain('getdel')
    expect(launch).toContain('launch_store_unavailable')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('zaoly:launch')
    const redisDoc = readFileSync(path.join(repoRoot, 'knowledge/zaoly-redis.md'), 'utf8')
    expect(redisDoc).toContain('zaoly:launch')
  })

  it('domain hubs document compositions and library Wave 5', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/domain-hubs.md'), 'utf8')
    expect(spec).toContain('/compositions')
    expect(spec).toContain('/library')
    expect(spec).toContain('Wave 5')
  })

  it('Site Kit Collection scope locks tenancy boundary and SK-S waves', () => {
    const scope = readFileSync(
      path.join(repoRoot, 'specs/domain/site-kit-collection-scope.md'),
      'utf8',
    )
    expect(scope).toContain('platformProjectId')
    expect(scope).toContain('SK-S1')
    expect(scope).toContain('SK-S5')
    expect(scope).toContain('**One** Site Kit Storybook')
    expect(scope).toContain('Isolation key = `platformProjectId`')
    expect(scope).toContain('Isolating by CompositionScene id')
    expect(scope).toContain('storybook-view-token')
    expect(scope).toContain('X-Zaoly-Site-Kit-View')
    expect(scope).toContain('Composition~')
    expect(scope).toContain('compositionScopeKey')
    expect(scope).toContain('STORYBOOK_PLATFORM_PROJECT_ID')
    expect(scope).toContain('zaolyViewToken')
    expect(scope).toMatch(/\*\*SK-S1\*\*.*\*\*done\*\*/)
    expect(scope).toMatch(/\*\*SK-S2\*\*.*\*\*done\*\*/)
    expect(scope).toMatch(/\*\*SK-S3\*\*.*\*\*done\*\*/)
    expect(scope).toMatch(/\*\*SK-S4\*\*.*\*\*done\*\*/)
    expect(scope).toMatch(/\*\*SK-S5\*\*.*\*\*done\*\*/)
    expect(scope).toContain('Atom~')
    expect(scope).toContain('ZAOLY_SITE_KIT_SHARED_SEED_WRITE')
    expect(scope).toContain('@zaoly/site-kit/c/')
    expect(scope).toContain('compositionPackageImportPath')

    const compositions = readFileSync(
      path.join(repoRoot, 'specs/domain/site-kit-compositions.md'),
      'utf8',
    )
    expect(compositions).toContain('site-kit-collection-scope.md')
    expect(compositions).toContain('SK-S1')

    const writeApi = readFileSync(path.join(repoRoot, 'specs/api/site-kit-write.md'), 'utf8')
    expect(writeApi).toContain('SK-S1')
    expect(writeApi).toContain('SK-S4')
    expect(writeApi).toContain('site-kit-collection-scope.md')
    expect(writeApi).toContain('/api/site-kit/storybook-view-token')
    expect(writeApi).toContain('Atom~')

    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/site-kit-collection-scope.md'),
      'utf8',
    )
    expect(knowledge).toContain('SK-S1')
    expect(knowledge).toContain('SK-S4')
    expect(knowledge).toContain('SK-S5')
    expect(knowledge).toContain('URL_SITE_KIT_STORYBOOK')
    expect(knowledge).toContain('URL_SITE_KIT_CDN')
    expect(knowledge).toContain('compositionPackageImportPath')

    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('site-kit-collection-scope.md')
    expect(pathsDoc).toContain('storybook-view-token')
    expect(pathsDoc).toContain('ZAOLY_SITE_KIT_SHARED_SEED_WRITE')
    expect(pathsDoc).toContain('@zaoly/site-kit/c/')

    const pkg = JSON.parse(
      readFileSync(path.join(repoRoot, 'packages/site-kit/package.json'), 'utf8'),
    ) as { exports?: Record<string, string> }
    expect(pkg.exports?.['./c/*']).toContain('compositions/c')
    expect(pkg.exports?.['./c/*/*']).toContain('compositions/c')
  })

  it('mcp-server documents zaoly tools and port 3102', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/mcp-server.md'), 'utf8')
    expect(spec).toContain('zaoly.library_catalog')
    expect(spec).toContain('zaoly.scene_apply_ops')
    expect(spec).toContain('zaoly.scene_craft_debug')
    expect(spec).toContain('zaoly.site_kit_page_save')
    expect(spec).toContain('3102')
    expect(spec).toContain('ZAOLY_API_URL')
    expect(spec).toContain('ZAOLY_API_URL')
  })

  it('legacy-naming leftovers inventory documents purge vs aliases', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/legacy-naming-leftovers.md'), 'utf8')
    expect(doc).toContain('X-Federation-Contract-Version')
    expect(doc).toMatch(/msqdx|MSQDX/i)
    expect(doc).toContain('ZAOLY_*')
    expect(doc).toContain('Magcloud')
    expect(doc).toContain('Removed')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('legacy-naming-leftovers.md')
  })

  it('scene-agent-editing documents ops API and optimistic lock', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/scene-agent-editing.md'), 'utf8')
    expect(spec).toContain('applySceneOp')
    expect(spec).toContain('baseUpdatedAt')
    expect(spec).toContain('stale-scene')
    expect(spec).toContain('POST /api/scenes/:id/ops')
  })

  it('scene-ops API spec lists tree index and palette routes', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/api/scene-ops.md'), 'utf8')
    expect(spec).toContain('/api/scenes/:id/tree')
    expect(spec).toContain('/api/editor/palette')
    expect(spec).toContain('op-not-persisted')
  })

  it('editor-migration documents sunset and React SoT', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(spec).toContain('Zaoly')
    expect(spec).toContain('@zaoly/ui')
    expect(spec).toContain('/editor')
    expect(spec).toContain('E4.1')
    expect(spec).toContain('W-UNDO')
  })

  it('editor parity checklist lists E6 gaps with acceptance', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-checklist.md'), 'utf8')
    expect(doc).toContain('P5')
    expect(doc).toContain('P7')
    expect(doc).toContain('P9')
    expect(doc).toContain('P13')
    expect(doc).toContain('P14')
    expect(doc).toContain('P16')
    expect(doc).toContain('P18')
    expect(doc).toContain('P22')
    expect(doc).toContain('P23')
    expect(doc).toContain('P28')
    expect(doc).toContain('P29')
    expect(doc).toContain('P30')
    expect(doc).toContain('P31')
    expect(doc).toContain('P32')
    expect(doc).toContain('P33')
    expect(doc).toContain('P34')
    expect(doc).toContain('P35')
    expect(doc).toContain('P36')
    expect(doc).toContain('P37')
    expect(doc).toContain('P38')
    expect(doc).toContain('P39')
    expect(doc).toContain('P40')
    expect(doc).toContain('P41')
    expect(doc).toContain('P42')
    expect(doc).toContain('editor-parity-deferred-plan.md')
    expect(doc).toContain('Phase B')
    expect(doc).toContain('P61')
    expect(doc).toContain('W-CUTOVER-CLOSE')
    expect(doc).toContain('Legacy CTA removed')
    expect(doc).toContain('wont-do')
    expect(doc).toContain('[x] Product:')
    expect(doc).toContain('[x] Cutover:')
    expect(doc).toContain('2026-08-13')
    expect(doc).toContain('bring es zuende')
  })

  it('editor UI finetune documents P62 items 1–10', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-ui-finetune.md'), 'utf8')
    expect(doc).toContain('P62')
    expect(doc).toContain('W-UI-FINETUNE')
    expect(doc).toContain('Dirty-Save')
    expect(doc).toContain('Palette')
    expect(doc).toContain('Layers Multi-Select')
    expect(doc).toContain('ZAOLY_UI_SOURCE')
    const deferred = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-deferred-plan.md'), 'utf8')
    expect(deferred).toContain('P62')
    expect(deferred).toContain('W-UI-FINETUNE')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('P62')
    expect(workspace).toContain('W-UI-FINETUNE')
    const inspect = readFileSync(path.join(repoRoot, 'specs/domain/editor-inspect.md'), 'utf8')
    expect(inspect).toContain('P62')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('W-UI-FINETUNE')
  })

  it('editor UI finetune-2 documents P63 autosave · native layers · DnD', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-ui-finetune.md'), 'utf8')
    expect(doc).toContain('P63')
    expect(doc).toContain('W-UI-FINETUNE-2')
    expect(doc).toContain('Debounced autosave')
    expect(doc).toContain('Native Layers multi-select')
    expect(doc).toContain('86971324812c094062f74d206c010bb3b547741e')
    expect(doc).toContain('EDITOR_AUTOSAVE_DEBOUNCE_MS')
    const bump = readFileSync(
      path.join(repoRoot, 'knowledge/creation-layers-panel-multi-bump.md'),
      'utf8',
    )
    expect(bump).toContain('86971324812c094062f74d206c010bb3b547741e')
    expect(bump).toContain('selectedIds')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('P63')
    expect(workspace).toContain('W-UI-FINETUNE-2')
    expect(workspace).toContain('autosave')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('P63')
    expect(migration).toContain('W-UI-FINETUNE-2')
    const dockerfile = readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8')
    expect(dockerfile).toContain('ZAOLY_UI_SOURCE=in-repo')
    expect(dockerfile).toContain('selectedIds')
    expect(dockerfile).toContain('packages/ui/src')
    expect(dockerfile).toContain('npm run build -w @zaoly/ui')
    const deferred = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-deferred-plan.md'), 'utf8')
    expect(deferred).toContain('Landed P63')
  })

  it('Dockerfile builds in-repo @zaoly/ui (no sibling DS checkout)', () => {
    const dockerfile = readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8')
    expect(dockerfile).toContain('ZAOLY_UI_SOURCE=in-repo')
    expect(dockerfile).toContain('npm run build -w @zaoly/ui-tokens')
    expect(dockerfile).toContain('npm run build -w @zaoly/ui')
    expect(dockerfile).not.toContain('git clone')
    const staging = readFileSync(path.join(repoRoot, 'knowledge/staging-coolify.md'), 'utf8')
    expect(staging).toContain('ZAOLY_FEDERATION_MODE=live')
  })

  it('editor float rails documents P64 detach + collapse persist', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-ui-finetune.md'), 'utf8')
    expect(doc).toContain('P64')
    expect(doc).toContain('W-FLOAT-RAILS')
    expect(doc).toContain('creation-editor-panel-chrome')
    expect(doc).toContain('creation-editor-inspect-collapsed')
    expect(doc).toContain('EditorRailShell')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('P64')
    expect(workspace).toContain('W-FLOAT-RAILS')
    expect(workspace).toContain('snap-redock')
    const inspect = readFileSync(path.join(repoRoot, 'specs/domain/editor-inspect.md'), 'utf8')
    expect(inspect).toContain('P64')
    expect(inspect).toContain('creation-editor-inspect-collapsed')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('P64')
    expect(migration).toContain('W-FLOAT-RAILS')
    const deferred = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-deferred-plan.md'), 'utf8')
    expect(deferred).toContain('P64 / W-FLOAT-RAILS')
    expect(deferred).toContain('Landed P64')
    const paths = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(paths).toContain('creation-editor-panel-chrome')
    expect(paths).toContain('creation-editor-inspect-collapsed')
  })

  it('editor rail resize + TB dock documents P65 / P66', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-ui-finetune.md'), 'utf8')
    expect(doc).toContain('P65')
    expect(doc).toContain('W-RAIL-RESIZE')
    expect(doc).toContain('P66')
    expect(doc).toContain('W-RAIL-DOCK-TB')
    expect(doc).toContain('leftSize')
    expect(doc).toContain('leftEdge')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('P65 / W-RAIL-RESIZE')
    expect(workspace).toContain('P66 / W-RAIL-DOCK-TB')
    expect(workspace).toContain('not a full Zaoly dock')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('P65')
    expect(migration).toContain('W-RAIL-RESIZE')
    expect(migration).toContain('P66')
    expect(migration).toContain('W-RAIL-DOCK-TB')
    const deferred = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-deferred-plan.md'), 'utf8')
    expect(deferred).toContain('Landed P65')
    expect(deferred).toContain('Landed P66')
    const paths = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(paths).toContain('leftEdge')
    expect(paths).toContain('leftSize')
  })

  it('editor parity parallel plan splits creation-v3 vs zaoly-ui', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-parallel-plan.md'), 'utf8')
    expect(doc).toContain('creation-v3')
    expect(doc).toContain('zaoly-ui')
    expect(doc).toContain('W-LAYERS')
    expect(doc).toContain('clear_token_binding')
    expect(doc).toContain('W-CONTRACT')
    expect(doc).toContain('W-OP9')
  })

  it('editor parity deferred plan covers P16–P22 ownership', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-deferred-plan.md'), 'utf8')
    expect(doc).toContain('W-CONTRACT')
    expect(doc).toContain('W-OP9')
    expect(doc).toContain('W-PG')
    expect(doc).toContain('Phase B')
    expect(doc).toContain('Zaoly-Creation-v3')
    expect(doc).toContain('W-MULTI')
    expect(doc).toContain('W-LAYERS-DND')
    expect(doc).toContain('W-LAYERS-HL')
    expect(doc).toContain('W-DENSITY')
    expect(doc).toContain('W-WRAP')
    expect(doc).toContain('P28')
    expect(doc).toContain('W-CLIP')
    expect(doc).toContain('W-FORMS')
    expect(doc).toContain('W-DRAG')
    expect(doc).toContain('W-PALETTE-DS')
    expect(doc).toContain('W-PALETTE-MOL')
    expect(doc).toContain('W-PALETTE-LIST')
    expect(doc).toContain('W-PALETTE-GROUP')
    expect(doc).toContain('W-PALETTE-PRINT')
    expect(doc).toContain('W-PALETTE-PERSONA')
    expect(doc).toContain('W-PRINT-SURFACE')
    expect(doc).toContain('P38')
    expect(doc).toContain('W-TOKEN-VOCAB')
    expect(doc).toContain('P39')
    expect(doc).toContain('W-TOKEN-PRINT')
    expect(doc).toContain('P42')
    expect(doc).toContain('W-PALETTE-ENTITY')
    expect(doc).toContain('P43')
    expect(doc).toContain('W-ATOMIC-SLOTS')
    expect(doc).toContain('P44')
    expect(doc).toContain('W-ATOMIC-SHELLS')
    expect(doc).toContain('P45')
    expect(doc).toContain('W-PRINT-SLOTS')
    expect(doc).toContain('P46')
    expect(doc).toContain('W-COPY-SLOTS')
    expect(doc).toContain('P47')
    expect(doc).toContain('W-PRINT-LEAVES')
    expect(doc).toContain('P48')
    expect(doc).toContain('W-PRINT-LISTS')
    expect(doc).toContain('P49')
    expect(doc).toContain('W-PRINT-REMAINING')
    expect(doc).toContain('P50')
    expect(doc).toContain('W-PERSONA-SHELL')
    expect(doc).toContain('P51')
    expect(doc).toContain('W-ROW-HITTEST')
    expect(doc).toContain('P52')
    expect(doc).toContain('W-PRINT-IDENTITY')
    expect(doc).toContain('P53')
    expect(doc).toContain('W-SURFACE-EDIT')
    expect(doc).toContain('P54')
    expect(doc).toContain('W-SURFACE-GRAIN')
    expect(doc).toContain('P55')
    expect(doc).toContain('W-INSPECT-LIVE')
    expect(doc).toContain('P56')
    expect(doc).toContain('W-PRINTCHIP-INSPECT')
    expect(doc).toContain('P57')
    expect(doc).toContain('W-SURFACE-ALL')
    expect(doc).toContain('P58')
    expect(doc).toContain('W-ATOM-REMAINING')
    expect(doc).toContain('P59')
    expect(doc).toContain('W-SCORERING-TEXT')
    expect(doc).toContain('P60')
    expect(doc).toContain('W-CUTOVER-CLOSE')
    expect(doc).toContain('P61')
    expect(doc).toContain('Legacy CTA removed')
    expect(doc).toContain('wont-do')
    expect(doc).toContain('no open eng holes')
  })

  it('composition-scene documents undo and breakpoint contract notes', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/composition-scene.md'), 'utf8')
    expect(spec).toContain('clear_token_binding')
    expect(spec).toContain('undo')
    expect(spec).toContain('activeBreakpoint')
    expect(spec).toContain('activePrintPreset')
    expect(spec).toContain("'print'")
    expect(spec).toContain('set_breakpoint_override')
    expect(spec).toContain('Phase B')
    expect(spec).toContain('typed component registry')
    expect(spec).toContain('component-contracts')
    expect(spec).toContain('wrap_nodes')
    expect(spec).toContain('unwrap_node')
    expect(spec).toContain('clipboard')
    expect(spec).toContain('Checkbox')
    expect(spec).toContain('Chip')
    expect(spec).toContain('Lede')
    expect(spec).toContain('RankedList')
    expect(spec).toContain('PrintPage')
    expect(spec).toContain('PrintPersonaCard')
    expect(spec).toContain('EntityCard')
    expect(spec).toContain('P38')
    expect(spec).toContain('P39')
    expect(spec).toContain('P42')
    expect(spec).toContain('P43')
    expect(spec).toContain('P44')
    expect(spec).toContain('P45')
    expect(spec).toContain('P46')
    expect(spec).toContain('P47')
    expect(spec).toContain('P48')
    expect(spec).toContain('P49')
    expect(spec).toContain('P50')
    expect(spec).toContain('P51')
    expect(spec).toContain('P52')
    expect(spec).toContain('P53')
    expect(spec).toContain('P54')
    expect(spec).toContain('W-SURFACE-EDIT')
    expect(spec).toContain('P55')
    expect(spec).toContain('W-SURFACE-GRAIN')
    expect(spec).toContain('P56')
    expect(spec).toContain('W-INSPECT-LIVE')
    expect(spec).toContain('P57')
    expect(spec).toContain('W-PRINTCHIP-INSPECT')
    expect(spec).toContain('P58')
    expect(spec).toContain('W-SURFACE-ALL')
    expect(spec).toContain('P59')
    expect(spec).toContain('W-ATOM-REMAINING')
    expect(spec).toContain('P60')
    expect(spec).toContain('W-SCORERING-TEXT')
    expect(spec).toContain('atomic slots')
    expect(spec).toContain('drag-insert')
  })

  it('editor-inspect and atomic-slots lock P54–P60 surface completeness', () => {
    const inspect = readFileSync(path.join(repoRoot, 'specs/domain/editor-inspect.md'), 'utf8')
    expect(inspect).toContain('W-SURFACE-EDIT')
    expect(inspect).toContain('P54')
    expect(inspect).toContain('W-SURFACE-GRAIN')
    expect(inspect).toContain('P55')
    expect(inspect).toContain('W-INSPECT-LIVE')
    expect(inspect).toContain('P56')
    expect(inspect).toContain('W-PRINTCHIP-INSPECT')
    expect(inspect).toContain('P57')
    expect(inspect).toContain('W-SURFACE-ALL')
    expect(inspect).toContain('P58')
    expect(inspect).toContain('genericCatalogInspectProps')
    expect(inspect).toContain('--creation-catalog-fill')
    expect(inspect).toContain('CATALOG_GENERIC_VARS')
    expect(inspect).toContain('PROMOTE_TOKEN_PATH_TO_CSS_VAR')
    expect(inspect).toContain('W-ATOM-REMAINING')
    expect(inspect).toContain('P59')
    expect(inspect).toContain('W-SCORERING-TEXT')
    expect(inspect).toContain('P60')
    expect(inspect).toContain('surface completeness before nesting')
    expect(inspect).toContain('editor-inspect-literals.md')
    expect(inspect).toContain('token-picker-length-p76.md')
    expect(inspect).toContain('token-picker-browser-p77.md')
    expect(inspect).toContain('P71')
    expect(inspect).toContain('W-COLLECTION-PICKER')
    expect(inspect).toContain('P76')
    expect(inspect).toContain('W-TOKEN-PICKER-LENGTH')
    expect(inspect).toContain('P77')
    expect(inspect).toContain('W-TOKEN-PICKER-BROWSER')
    const literals = readFileSync(path.join(repoRoot, 'knowledge/editor-inspect-literals.md'), 'utf8')
    expect(literals).toContain('P76')
    const p76 = readFileSync(path.join(repoRoot, 'knowledge/token-picker-length-p76.md'), 'utf8')
    expect(p76).toContain('W-TOKEN-PICKER-LENGTH')
    expect(p76).toContain('INSPECT_LENGTH_TOKEN_GROUPS')
    expect(p76).toContain('token-picker-browser-p77.md')
    const p77 = readFileSync(path.join(repoRoot, 'knowledge/token-picker-browser-p77.md'), 'utf8')
    expect(p77).toContain('W-TOKEN-PICKER-BROWSER')
    expect(p77).toContain('zaoly.inspect.tokenRecent')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('W-TOKEN-PICKER-LENGTH')
    expect(migration).toContain('P76')
    expect(migration).toContain('W-TOKEN-PICKER-BROWSER')
    expect(migration).toContain('P77')
    const dockerfile = readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8')
    expect(dockerfile).toContain('ZAOLY_UI_SOURCE=in-repo')
    const bump = readFileSync(path.join(repoRoot, 'knowledge/creation-p77-token-picker-browser-bump.md'), 'utf8')
    expect(bump).toContain('febe073a7deee9231bd1475a165b6a9e577b42f4')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('zaoly.inspect.tokenRecent')
    expect(pathsDoc).toContain('token-picker-browser-p77.md')
    const slots = readFileSync(path.join(repoRoot, 'knowledge/editor-atomic-slots.md'), 'utf8')
    expect(slots).toContain('W-SURFACE-EDIT')
    expect(slots).toContain('P54')
    expect(slots).toContain('W-SURFACE-GRAIN')
    expect(slots).toContain('P55')
    expect(slots).toContain('W-INSPECT-LIVE')
    expect(slots).toContain('P56')
    expect(slots).toContain('W-PRINTCHIP-INSPECT')
    expect(slots).toContain('P57')
    expect(slots).toContain('W-SURFACE-ALL')
    expect(slots).toContain('P58')
    expect(slots).toContain('W-ATOM-REMAINING')
    expect(slots).toContain('P59')
    expect(slots).toContain('W-SCORERING-TEXT')
    expect(slots).toContain('P60')
    expect(slots).toContain('.zaoly-print-chip')
    expect(slots).toContain('Surface completeness before nesting')
    expect(slots).toContain('P61 done')
    const deferred = readFileSync(path.join(repoRoot, 'knowledge/editor-parity-deferred-plan.md'), 'utf8')
    expect(deferred).toContain('W-CUTOVER-CLOSE')
    expect(deferred).toContain('P61')
    expect(deferred).toContain('wont-do')
    expect(deferred).toContain('no open eng holes')
    const sunset = readFileSync(path.join(repoRoot, 'knowledge/zaoly-sunset.md'), 'utf8')
    expect(sunset).toMatch(/standalone Zaoly product|superseded/)
    expect(sunset).toContain('canon-archive.md')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('W-SURFACE-GRAIN')
    expect(workspace).toContain('W-INSPECT-LIVE')
    expect(workspace).toContain('W-PRINTCHIP-INSPECT')
    expect(workspace).toContain('W-SURFACE-ALL')
    expect(workspace).toContain('W-ATOM-REMAINING')
    expect(workspace).toContain('W-SCORERING-TEXT')
    expect(workspace).toContain('textAlign')
    expect(workspace).toContain('P69')
    expect(workspace).toContain('W-SHELL-TOPBAR-2')
    expect(workspace).toContain('P70')
    expect(workspace).toContain('W-SHELL-TOPBAR-ROW')
    expect(workspace).toContain('useTopbarTrailHost')
    expect(workspace).toContain('P71')
    expect(workspace).toContain('W-COLLECTION-PICKER')
  })

  it('shell-chrome knowledge documents P69/P70 tools+actions single-line trail', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/shell-chrome.md'), 'utf8')
    expect(doc).toContain('P69')
    expect(doc).toContain('W-SHELL-TOPBAR-2')
    expect(doc).toContain('P70')
    expect(doc).toContain('W-SHELL-TOPBAR-ROW')
    expect(doc).toContain('single-line')
    expect(doc).toContain('zaoly-hub-chrome')
    expect(doc).toContain('TopbarTrailHostProvider')
    expect(doc).toContain('creation-editor-toolbar__tools')
    expect(doc).toContain('creation-editor-toolbar__actions')
    expect(doc).toContain('P104')
    expect(doc).toContain('chrome-tooltips.md')
  })

  it('chrome-tooltips knowledge documents P104 ChromeTip pattern', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/chrome-tooltips.md'), 'utf8')
    expect(doc).toContain('P104')
    expect(doc).toContain('ChromeTip')
    expect(doc).toContain('editor.hud.')
    expect(doc).toContain('editor.align.')
    expect(doc).toContain('assistant.')
  })

  it('paths knowledge documents in-app editor flag', () => {
    const doc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(doc).toContain('ZAOLY_EDITOR_INAPP')
    expect(doc).toContain('NEXT_PUBLIC_ZAOLY_SMART_HUD')
    expect(doc).toContain('canvas-smart-hud.md')
    expect(doc).toContain('/editor')
    expect(doc).toContain('editor-parity-parallel-plan.md')
    expect(doc).toContain('editor-parity-deferred-plan.md')
    expect(doc).toContain('Phase B Postgres')
    expect(doc).toContain('BRANDION_API_URL')
    expect(doc).toContain('/api/brand-tokens')
  })

  it('editor-migration documents deferred P16–P22 workstreams', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(spec).toContain('W-CONTRACT')
    expect(spec).toContain('W-OP9')
    expect(spec).toContain('P18')
    expect(spec).toContain('P28')
    expect(spec).toContain('P29')
    expect(spec).toContain('P32')
    expect(spec).toContain('P33')
    expect(spec).toContain('P34')
    expect(spec).toContain('P35')
    expect(spec).toContain('P36')
    expect(spec).toContain('P37')
    expect(spec).toContain('P38')
    expect(spec).toContain('W-PRINT-SURFACE')
    expect(spec).toContain('W-TOKEN-VOCAB')
    expect(spec).toContain('P39')
    expect(spec).toContain('W-TOKEN-PRINT')
    expect(spec).toContain('P42')
    expect(spec).toContain('W-PALETTE-ENTITY')
    expect(spec).toContain('P43')
    expect(spec).toContain('W-ATOMIC-SLOTS')
    expect(spec).toContain('P44')
    expect(spec).toContain('W-ATOMIC-SHELLS')
    expect(spec).toContain('P45')
    expect(spec).toContain('W-PRINT-SLOTS')
    expect(spec).toContain('P46')
    expect(spec).toContain('W-COPY-SLOTS')
    expect(spec).toContain('P47')
    expect(spec).toContain('W-PRINT-LEAVES')
    expect(spec).toContain('P48')
    expect(spec).toContain('W-PRINT-LISTS')
    expect(spec).toContain('P49')
    expect(spec).toContain('W-PRINT-REMAINING')
    expect(spec).toContain('P50')
    expect(spec).toContain('W-PERSONA-SHELL')
    expect(spec).toContain('P51')
    expect(spec).toContain('W-ROW-HITTEST')
    expect(spec).toContain('P52')
    expect(spec).toContain('W-PRINT-IDENTITY')
    expect(spec).toContain('P53')
    expect(spec).toContain('W-SURFACE-EDIT')
    expect(spec).toContain('P54')
    expect(spec).toContain('W-SURFACE-GRAIN')
    expect(spec).toContain('P55')
    expect(spec).toContain('W-INSPECT-LIVE')
    expect(spec).toContain('P56')
    expect(spec).toContain('W-PRINTCHIP-INSPECT')
    expect(spec).toContain('P57')
    expect(spec).toContain('W-SURFACE-ALL')
    expect(spec).toContain('P58')
    expect(spec).toContain('W-ATOM-REMAINING')
    expect(spec).toContain('P59')
    expect(spec).toContain('W-CUTOVER-CLOSE')
    expect(spec).toContain('P61')
    expect(spec).toContain('W-UI-FINETUNE')
    expect(spec).toContain('P62')
    expect(spec).toContain('W-UI-FINETUNE-2')
    expect(spec).toContain('P63')
    expect(spec).toContain('editor-parity-deferred-plan.md')
  })

  it('brand-token-consume specifies Brandion SSOT and P39 vocab', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/brand-token-consume.md'), 'utf8')
    expect(spec).toContain('CT-2')
    expect(spec).toContain('W-TOKEN-VOCAB')
    expect(spec).toContain('P39')
    expect(spec).toContain('CT-17')
    expect(spec).toContain('W-TOKEN-STUDIO-EDIT')
    expect(spec).toContain('P75')
    expect(spec).toContain('color.action.primary')
    expect(spec).toContain('spacing.static.medium')
    expect(spec).toContain('typography.heading.h1')
    const api = readFileSync(path.join(repoRoot, 'specs/api/brand-tokens.md'), 'utf8')
    expect(api).toContain('/api/brand-tokens')
    expect(api).toMatch(/Retired on Zaoly|410/)
    expect(api).toContain('/api/tokens')
    expect(api).toContain('BRANDION_API_URL')
    expect(api).toContain('PATCH')
    expect(api).toContain('guidelineId')
    const layers = readFileSync(path.join(repoRoot, 'knowledge/token-layers.md'), 'utf8')
    expect(layers).toContain('P75')
    expect(layers).toContain('P42')
    expect(layers).toContain('P39')
    const tasks = readFileSync(path.join(repoRoot, 'tasks/00-token-consume-plan.md'), 'utf8')
    expect(tasks).toContain('T2')
    expect(tasks).toContain('W-TOKEN-VOCAB')
    expect(tasks).toContain('T3')
    expect(tasks).toContain('W-TOKEN-RESOLVE')
    expect(tasks).toContain('digitalCssForLeaf')
    expect(tasks).toContain('T4')
    expect(tasks).toContain('W-TOKEN-CONSUME')
    expect(tasks).toContain('T5')
    expect(tasks).toContain('W-TOKEN-PRINT')
    expect(tasks).toContain('printCssForLeaf')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('W-TOKEN-STUDIO-EDIT')
    expect(migration).toContain('P75')
  })

  it('DS-DEPOSIT pointer keeps Brandion SSOT and no CREATION push', () => {
    const deposit = readFileSync(
      path.join(repoRoot, 'knowledge/ds-tokens-as-plexon-project.md'),
      'utf8',
    )
    expect(deposit).toContain('DS-DEPOSIT')
    expect(deposit).toContain('brandion-v3/knowledge/ds-tokens-as-plexon-project.md')
    expect(deposit).toContain('W-TOKEN-PUSH')
    expect(deposit).toContain('active-pack')
    expect(deposit).toContain('D4')
    expect(deposit).toContain('32498667-471e-4b21-b920-5eff5c338300')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('ds-tokens-as-plexon-project.md')
    expect(pathsDoc).toContain('ds-deposit-d4-operator.md')
    const layers = readFileSync(path.join(repoRoot, 'knowledge/token-layers.md'), 'utf8')
    expect(layers).toContain('DS-DEPOSIT')
    expect(layers).toContain('spacing.static.1')
    expect(layers).toContain('color.status.pipeline.category_queued')
    expect(layers).toContain('--status-category-queued')
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/brand-token-consume.md'), 'utf8')
    expect(spec).toContain('CT-14')
    expect(spec).toContain('CT-15')
    expect(spec).toContain('CT-16')
    expect(spec).toContain('spacing.static.1')
    expect(spec).toContain('spacing.padding')
    const inspect = readFileSync(path.join(repoRoot, 'specs/domain/editor-inspect.md'), 'utf8')
    expect(inspect).toContain('margin')
    expect(inspect).toContain('Consumes')
    expect(pathsDoc).toContain('component-semantic-map.json')
    expect(deposit).toContain('D5 consume hint')
  })

  it('videon-asset-consume P0 stills + media BFF are inventory-locked', () => {
    const domain = readFileSync(path.join(repoRoot, 'specs/domain/videon-asset-consume.md'), 'utf8')
    expect(domain).toContain('videonMediaRef')
    expect(domain).toContain("kind: 'frame'")
    expect(domain).toContain('Collection media (VIDEON)')
    expect(domain).toContain('Non-goals')
    const api = readFileSync(path.join(repoRoot, 'specs/api/videon-media-bff.md'), 'utf8')
    expect(api).toContain('/api/videon-media')
    expect(api).toContain('VIDEON_API_URL')
    expect(api).toContain('X-Actor-User-Id')
    const inspect = readFileSync(path.join(repoRoot, 'specs/domain/editor-inspect.md'), 'utf8')
    expect(inspect).toContain('videon-asset-consume.md')
    expect(inspect).toContain('videonMediaRef')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('/api/videon-media')
    expect(pathsDoc).toContain('VIDEON_API_URL')
    const keepDrop = readFileSync(path.join(repoRoot, 'knowledge/keep-drop-backlog.md'), 'utf8')
    expect(keepDrop).toContain('VIDEON media as assets')
  })

  it('collection-data-bind Wave 1.2 + BFF are inventory-locked', () => {
    const domain = readFileSync(path.join(repoRoot, 'specs/domain/collection-data-bind.md'), 'utf8')
    expect(domain).toContain('dataBindings')
    expect(domain).toContain('metron.kpi.')
    expect(domain).toContain('metron.collection.kpis')
    expect(domain).toContain('checkion.scan.latest.overallScore')
    expect(domain).toContain('checkion.scan.latest.facets')
    expect(domain).toContain('checkion.scan.latest.scores')
    expect(domain).toContain('checkion.collection.scoreHistory')
    expect(domain).toContain('collection.{platformProjectId}')
    expect(domain).toContain('CD-3b')
    expect(domain).toContain('chartDataMap')
    expect(domain).toContain('CD-2')
    const api = readFileSync(path.join(repoRoot, 'specs/api/collection-data-bff.md'), 'utf8')
    expect(api).toContain('/api/collection-data/catalog')
    expect(api).toContain('/api/collection-data/resolve')
    expect(api).toContain('/api/collection-data/collections')
    expect(api).toContain('chart_series')
    expect(api).toContain('METRON_API_URL')
    expect(api).toContain('CHECKION_API_URL')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/collection-data-bind.md'), 'utf8')
    expect(knowledge).toContain('set_data_binding')
    expect(knowledge).toContain('Data source')
    const chartStudio = readFileSync(path.join(repoRoot, 'specs/domain/chart-studio-panel.md'), 'utf8')
    expect(chartStudio).toContain('Wave 1.2')
    expect(chartStudio).toContain('chartDataMap')
    expect(chartStudio).toContain('collection.{uuid}.{localRef}')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('METRON_API_URL')
    expect(pathsDoc).toContain('CHECKION_API_URL')
    expect(pathsDoc).toContain('collection-data-bind.md')
  })

  it('P98 layout clarity is documented in editor-inspect', () => {
    const inspect = readFileSync(path.join(repoRoot, 'specs/domain/editor-inspect.md'), 'utf8')
    expect(inspect).toContain('P98')
    expect(inspect).toContain('Flex layout')
    expect(inspect).toContain('Grid layout')
    expect(inspect).toContain('Packed/Even')
    expect(inspect).toContain('Grid glyphs')
    expect(inspect).toContain('Size mode glyphs')
    expect(inspect).toContain('fit glyph tiles')
    const tasks = readFileSync(path.join(repoRoot, 'tasks/p98-inspect-layout-clarity.md'), 'utf8')
    expect(tasks).toContain('P98')
    expect(tasks).toContain('P98-7')
    expect(tasks).toContain('P98-8')
    expect(tasks).toContain('P98-9')
    const parity = readFileSync(path.join(repoRoot, 'knowledge/web-parity-requirements.md'), 'utf8')
    expect(parity).toContain('P98')
    expect(parity).toContain('glyph tiles')
    expect(parity).toContain('Hug/Fill/Fixed')
  })

  it('P71 / W-COLLECTION-PICKER documents hub + editor Collection chooser', () => {
    const workspaceSpec = readFileSync(path.join(repoRoot, 'specs/domain/project-workspace.md'), 'utf8')
    expect(workspaceSpec).toContain('P71')
    expect(workspaceSpec).toContain('W-COLLECTION-PICKER')
    expect(workspaceSpec).toContain('accessible-collections')
    const api = readFileSync(path.join(repoRoot, 'specs/api/projects.md'), 'utf8')
    expect(api).toContain('/api/projects/collections')
    expect(api).toContain('/api/projects/open-collection')
    const editor = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(editor).toContain('P71')
    expect(editor).toContain('W-COLLECTION-PICKER')
    const migration = readFileSync(path.join(repoRoot, 'specs/domain/editor-migration.md'), 'utf8')
    expect(migration).toContain('P71')
    expect(migration).toContain('W-COLLECTION-PICKER')
    const picker = readFileSync(path.join(repoRoot, 'knowledge/collection-picker.md'), 'utf8')
    expect(picker).toContain('accessible-collections')
    expect(picker).toContain('32498667-471e-4b21-b920-5eff5c338300')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('accessible-collections')
    expect(pathsDoc).toContain('/api/projects/open-collection')
  })

  it('library promote dry-run is specced and routed via paths', () => {
    const domain = readFileSync(
      path.join(repoRoot, 'specs/domain/library-composition-roundtrip.md'),
      'utf8',
    )
    expect(domain).toContain('Accepted')
    expect(domain).toContain('POST /api/library/promote/dry-run')
    expect(domain).toContain('Promote P1')
    expect(domain).toContain('githubConfigured')
    const api = readFileSync(path.join(repoRoot, 'specs/api/library-promote.md'), 'utf8')
    expect(api).toContain('/api/library/promote/dry-run')
    expect(api).toContain('/api/library/promote')
    expect(api).toContain('writesGit')
    expect(api).toContain('github-unconfigured')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('/api/library/promote/dry-run')
    expect(pathsDoc).toContain('/api/library/promote')
    expect(pathsDoc).toContain('ZAOLY_UI_SOURCE')
    expect(pathsDoc).toContain('ZAOLY_UI_SOURCE')
    expect(pathsDoc).toContain('GITHUB_TOKEN')
    expect(pathsDoc).toContain('GITHUB_API_URL')
    expect(pathsDoc).toContain('personal-access-tokens')
    const githubDoc = readFileSync(path.join(repoRoot, 'knowledge/library-promote-github.md'), 'utf8')
    expect(githubDoc).toContain('aurovylabs/zaoly-delivery')
    expect(githubDoc).toContain('promote/')
    expect(githubDoc).toContain('https://github.com/settings/personal-access-tokens/new')
    expect(githubDoc).toContain('Contents')
    expect(githubDoc).toContain('Pull requests')
    const settings = readFileSync(path.join(repoRoot, 'specs/domain/settings.md'), 'utf8')
    expect(settings).toContain('Must not surface')
    expect(settings).toMatch(/ZAOLY_UI_SOURCE|in-repo|ui/i)
    expect(settings).toMatch(/Plexon|federation/i)
    const pathsTs = readFileSync(path.join(repoRoot, 'apps/web/lib/paths.ts'), 'utf8')
    expect(pathsTs).toContain('apiLibraryPromoteDryRun')
    expect(pathsTs).toContain('apiLibraryPromote')
    expect(pathsTs).toContain('envZaolyUiSource')
    expect(pathsTs).toContain('envGithubToken')
    expect(pathsTs).toContain('githubApiBaseDefault')
    expect(pathsTs).toContain('coolifyStorybookUuid')
    expect(pathsTs).toContain('zaolyUiCatalogModule')
    expect(domain).toContain('insertableCatalogEntries')
    expect(domain).toContain('paths.zaolyUiCatalogModule')
    expect(domain).toContain('genericCatalogInspectProps')
    expect(domain).toContain('--creation-catalog-fill')
    expect(domain).toContain('PROMOTE_TOKEN_PATH_TO_CSS_VAR')
    expect(domain).toContain('Phase 6')
    expect(domain).toContain('Phase 7')
    expect(domain).toContain('Phase 8')
    expect(domain).toContain('P4')
    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/library-composition-roundtrip.md'),
      'utf8',
    )
    expect(knowledge).toContain('catalogComponent')
    expect(knowledge).toContain('is_auto_deploy')
    expect(knowledge).toContain('promote-inspect-chrome.md')
  })

  it('P80 / W-SCENE-PAGES documents multi-page scene model', () => {
    const scenePages = readFileSync(path.join(repoRoot, 'specs/domain/scene-pages.md'), 'utf8')
    expect(scenePages).toContain('P80')
    expect(scenePages).toContain('pages[]')
    expect(scenePages).toContain('activePageId')
    expect(scenePages).toContain('createDemoScene()')
    expect(scenePages).toContain('Home')
    expect(scenePages).toContain('Contact')
    expect(scenePages).toContain('Add page dialog')
    expect(scenePages).toContain('frameWidth')
    const addPageKnowledge = readFileSync(
      path.join(repoRoot, 'knowledge/editor-add-page-dialog.md'),
      'utf8',
    )
    expect(addPageKnowledge).toContain('editor-add-page-dialog')
    expect(addPageKnowledge).toContain('Desktop')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('P80')
    expect(workspace).toContain('W-SCENE-PAGES')
    expect(workspace).toContain('P80 scene pages')
    const plan = readFileSync(path.join(repoRoot, 'tasks/p80-scene-pages-plan.md'), 'utf8')
    expect(plan).toContain('Wave 4')
    expect(plan).toContain('createDemoScene()')
    const demo = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/demo-scene.ts'), 'utf8')
    expect(demo).toContain('DEMO_PAGE_HOME_ID')
    expect(demo).toContain('DEMO_PAGE_CONTACT_ID')
  })

  it('P81 / W-SCENE-BOARD documents scene board paint and EditorPagesList', () => {
    const board = readFileSync(path.join(repoRoot, 'specs/domain/scene-board.md'), 'utf8')
    expect(board).toContain('P81')
    expect(board).toContain('pages[].frame')
    expect(board).toContain('move_page_frame')
    expect(board).toContain('move_node_to_page')
    const workspace = readFileSync(path.join(repoRoot, 'specs/domain/editor-workspace.md'), 'utf8')
    expect(workspace).toContain('P81')
    expect(workspace).toContain('W-SCENE-BOARD')
    expect(workspace).toContain('EditorPagesList')
    expect(workspace).not.toContain('implementation pending')
    const plan = readFileSync(path.join(repoRoot, 'tasks/p81-scene-board-plan.md'), 'utf8')
    expect(plan).toContain('Wave 4')
    expect(plan).toContain('EditorPagesList')
    const pagesList = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor-pages-list.tsx'),
      'utf8',
    )
    expect(pagesList).toContain('editor-pages-list')
    expect(pagesList).toContain('onLayerDropToPage')
    expect(
      readFileSync(path.join(repoRoot, 'apps/web/components/scene-node-view.tsx'), 'utf8'),
    ).toContain('enableCanvasNodeDrag')
    const sceneBoard = readFileSync(
      path.join(repoRoot, 'apps/web/lib/scene/scene-board.ts'),
      'utf8',
    )
    expect(sceneBoard).toContain('buildSceneBoardForPaint')
    expect(sceneBoard).toContain('resolveSceneBoardClick')
  })

  it('editor themes Wave 0 documents SiteSvg Phase 4, Clip D, and Masters Phase 3', () => {
    const siteSvg = readFileSync(path.join(repoRoot, 'specs/domain/site-svg.md'), 'utf8')
    expect(siteSvg).toContain('Phase 4')
    expect(siteSvg).toContain('Vector deep-edit')
    const clip = readFileSync(path.join(repoRoot, 'specs/domain/surface-clip-slant.md'), 'utf8')
    expect(clip).toContain('CL24')
    expect(clip).toContain('SiteShape')
    expect(clip).toContain('clipPathD')
    const masters = readFileSync(path.join(repoRoot, 'specs/domain/composition-masters.md'), 'utf8')
    expect(masters).toContain('Phase 3')
    expect(masters).toContain('instanceVariantAxes')
    expect(masters).toContain('add_master_axis')
    expect(masters).toContain('omit `pages`')
    expect(masters).toContain('alignActivePageRoot')
    expect(masters).toContain('Back to scene')
    expect(masters).toContain('Master-Edit bar')
    expect(masters).toContain('Layers rail')
    expect(masters).toContain('sealed shell')
    expect(masters).toContain('Composition:')
    expect(masters).toContain('dashed outline')
    expect(masters).toContain('Add variant')
    expect(masters).toContain('Editing · {name}')
    expect(masters).toContain('active variant name')
    expect(existsSync(path.join(repoRoot, 'knowledge/site-shape-clip-d.md'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'knowledge/master-component-sets-phase3.md'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'knowledge/master-edit-exit-chrome.md'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'knowledge/master-variant-board-chrome.md'))).toBe(true)
  })

  it('P114 documents real-time presence, multi-cursor, and presence API', () => {
    const domainSpec = readFileSync(
      path.join(repoRoot, 'specs/domain/editor-presence-collaboration.md'),
      'utf8',
    )
    expect(domainSpec).toContain('P114')
    expect(domainSpec).toContain('CanvasMultiplayerCursors')
    expect(domainSpec).toContain('TopbarPresenceStack')
    expect(domainSpec).toContain('ScenePresenceUser')
    expect(domainSpec).toContain('presence-updated')
    expect(domainSpec).toContain('Soft-Lock')
    expect(domainSpec).toContain('macOS Native MUST')
    expect(domainSpec).toContain('swarm_replicas=1')
    expect(domainSpec).toContain('Visibility pause')
    expect(domainSpec).toContain('Adaptive cursor throttle')
    expect(domainSpec).toContain('requestAnimationFrame')
    expect(domainSpec).toContain('Delta-SSE')
    expect(domainSpec).toContain('80 ms')
    expect(domainSpec).toContain('Follow polish')
    expect(domainSpec).toContain('Activity chips')
    expect(domainSpec).toContain('Locked ·')
    expect(domainSpec).toContain('ZAOLY_REDIS_URL')
    expect(domainSpec).toContain('Wave D')
    expect(domainSpec).toContain('concurrent-edit-w6.md')

    const apiSpec = readFileSync(
      path.join(repoRoot, 'specs/api/scene-presence.md'),
      'utf8',
    )
    expect(apiSpec).toContain('/api/scenes/:id/presence/heartbeat')
    expect(apiSpec).toContain('/api/scenes/:id/presence')
    expect(apiSpec).toContain('ScenePresenceState')
    expect(apiSpec).toContain('presence-updated')
    expect(apiSpec).toContain('apiScenePresenceHeartbeat')
    expect(apiSpec).toContain('selfUserId')
    expect(apiSpec).toContain('hidden/inactive')
    expect(apiSpec).toContain('"mode":"delta"')
    expect(apiSpec).toContain('upserts')
    expect(apiSpec).toContain('80 ms')
    expect(apiSpec).toContain('ZAOLY_REDIS_URL')
    expect(apiSpec).toContain('zaoly:scene-bus')

    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/presence-collaboration.md'),
      'utf8',
    )
    expect(knowledge).toContain('Redis')
    expect(knowledge).toContain('NativePresenceController')
    expect(knowledge).toContain('cursorThrottleMsForPeerCount')
    expect(knowledge).toContain('30 000 ms')
    expect(knowledge).toContain('presence-merge')
    expect(knowledge).toContain('80 ms')
    expect(knowledge).toContain('PresenceActivityRibbon')
    expect(knowledge).toContain('Follow polish')
    expect(knowledge).toContain('ZAOLY_REDIS_URL')
    expect(knowledge).toContain('zaoly:scene-bus')
  })

  it('P116 documents scene version history, milestones, and versions API', () => {
    const domainSpec = readFileSync(
      path.join(repoRoot, 'specs/domain/editor-version-history.md'),
      'utf8',
    )
    expect(domainSpec).toContain('P116')
    expect(domainSpec).toContain('CreateCheckpointModal')
    expect(domainSpec).toContain('EditorHistoryDrawer')
    expect(domainSpec).toContain('SceneVersionCheckpoint')
    expect(domainSpec).toContain('scene_versions')
    expect(domainSpec).toContain('version-store-durable-w3.md')

    const apiSpec = readFileSync(
      path.join(repoRoot, 'specs/api/scene-versions.md'),
      'utf8',
    )
    expect(apiSpec).toContain('/api/scenes/:id/versions')
    expect(apiSpec).toContain('/api/scenes/:id/versions/:versionId/restore')
    expect(apiSpec).toContain('SceneVersionSummary')
  })

  it('W3 durable version store and backup runbook', () => {
    const w3 = readFileSync(
      path.join(repoRoot, 'specs/domain/version-store-durable-w3.md'),
      'utf8',
    )
    expect(w3).toContain('scene_versions')
    expect(w3).toContain('versionStore')
    expect(w3).toContain('backup-rollback.md')
    const backup = readFileSync(path.join(repoRoot, 'knowledge/backup-rollback.md'), 'utf8')
    expect(backup).toContain('pg_dump')
    expect(backup).toContain('scene_versions')
    expect(backup).toContain('StandaloneDocker')
    const health = readFileSync(path.join(repoRoot, 'apps/web/app/api/health/route.ts'), 'utf8')
    expect(health).toContain('versionStore')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('ZAOLY_VERSION_STORE_PATH')
    expect(pathsDoc).toContain('backup-rollback.md')
  })

  it('W4 observability hook and unbound-scene fail-closed', () => {
    const w4 = readFileSync(
      path.join(repoRoot, 'specs/domain/observability-and-unbound-w4.md'),
      'utf8',
    )
    expect(w4).toContain('reportError')
    expect(w4).toContain('unbound-scene')
    const obs = readFileSync(path.join(repoRoot, 'knowledge/observability.md'), 'utf8')
    expect(obs).toContain('/api/health')
    expect(obs).toContain('ZAOLY_ERROR_WEBHOOK_URL')
    const report = readFileSync(
      path.join(repoRoot, 'apps/web/lib/observability/report-error.ts'),
      'utf8',
    )
    expect(report).toContain('[zaoly:error]')
    const acl = readFileSync(
      path.join(repoRoot, 'apps/web/lib/require-scene-collection-access.ts'),
      'utf8',
    )
    expect(acl).toContain('zaoly-scene-share')
    expect(acl).toContain('forbidUnlessSceneWriteAccess')
    expect(acl).toContain('scene_members')
    expect(acl).toContain('isOrphanScene')
    expect(acl).toContain('withClaimedOwnerIfOrphan')
    const scenesApi = readFileSync(path.join(repoRoot, 'specs/api/scenes.md'), 'utf8')
    expect(scenesApi).toContain('unbound-scene')
    expect(scenesApi).toContain('Orphan')
    const share = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-scene-share.md'),
      'utf8',
    )
    expect(share).toContain('Orphan claim')
  })

  it('W9 optional Sentry inside reportError', () => {
    const w9 = readFileSync(
      path.join(repoRoot, 'specs/domain/observability-sentry-w9.md'),
      'utf8',
    )
    expect(w9).toContain('ZAOLY_SENTRY_DSN')
    expect(w9).toContain('NEXT_PUBLIC_ZAOLY_SENTRY_DSN')
    expect(w9).toContain('reportError')
    expect(w9).toContain('captureException')
    expect(existsSync(path.join(repoRoot, 'specs/domain/observability-sentry-w9.md'))).toBe(true)
    const obs = readFileSync(path.join(repoRoot, 'knowledge/observability.md'), 'utf8')
    expect(obs).toContain('ZAOLY_SENTRY_DSN')
    expect(obs).toContain('observability-sentry-w9.md')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('ZAOLY_SENTRY_DSN')
    expect(pathsDoc).toContain('NEXT_PUBLIC_ZAOLY_SENTRY_DSN')
    const pathsTs = readFileSync(path.join(repoRoot, 'apps/web/lib/paths.ts'), 'utf8')
    expect(pathsTs).toContain('envSentryDsn')
    expect(pathsTs).toContain('ZAOLY_SENTRY_DSN')
    const report = readFileSync(
      path.join(repoRoot, 'apps/web/lib/observability/report-error.ts'),
      'utf8',
    )
    expect(report).toContain('@sentry/nextjs')
    expect(report).toContain('captureException')
    const backlog = readFileSync(
      path.join(repoRoot, 'knowledge/enterprise-hardening-backlog.md'),
      'utf8',
    )
    expect(backlog).toContain('observability-sentry-w9.md')
    expect(backlog).toMatch(/\*\*W9\*\*.*\*\*done\*\*/)
  })

  it('W10 optional Sentry productization', () => {
    const w10 = readFileSync(
      path.join(repoRoot, 'specs/domain/observability-sentry-w10.md'),
      'utf8',
    )
    expect(w10).toContain('withSentryConfig')
    expect(w10).toContain('sentryTunnelPath')
    expect(w10).toContain('NEXT_PUBLIC_ZAOLY_SENTRY_REPLAY')
    expect(w10).toContain('SENTRY_AUTH_TOKEN')
    const obs = readFileSync(path.join(repoRoot, 'knowledge/observability.md'), 'utf8')
    expect(obs).toContain('observability-sentry-w10.md')
    expect(obs).toContain('/monitoring/sentry-tunnel')
    const pathsTs = readFileSync(path.join(repoRoot, 'apps/web/lib/paths.ts'), 'utf8')
    expect(pathsTs).toContain('sentryTunnelPath')
    expect(pathsTs).toContain('envSentryReplay')
    const nextConfig = readFileSync(path.join(repoRoot, 'apps/web/next.config.ts'), 'utf8')
    expect(nextConfig).toContain('withSentryConfig')
    expect(nextConfig).toContain('@sentry/nextjs/config')
    const mw = readFileSync(path.join(repoRoot, 'apps/web/lib/middleware-public-paths.ts'), 'utf8')
    expect(mw).toContain('sentryTunnelPath')
    const backlog = readFileSync(
      path.join(repoRoot, 'knowledge/enterprise-hardening-backlog.md'),
      'utf8',
    )
    expect(backlog).toContain('observability-sentry-w10.md')
    expect(backlog).toMatch(/\*\*W10\*\*.*\*\*done\*\*/)
    expect(backlog).toMatch(/[Dd]eferred.*scale|horizontal scale/i)
  })

  it('Sentry v11 dataCollection hardening is documented and wired', () => {
    const spec = readFileSync(
      path.join(repoRoot, 'specs/domain/observability-sentry-data-collection.md'),
      'utf8',
    )
    expect(spec).toContain('dataCollection')
    expect(spec).toContain('userInfo')
    expect(spec).toContain('httpBodies')
    const sink = readFileSync(
      path.join(repoRoot, 'apps/web/lib/observability/report-error.ts'),
      'utf8',
    )
    expect(sink).toContain('sentryRestrictiveDataCollection')
    expect(sink).toContain('dataCollection: sentryRestrictiveDataCollection')
    const obs = readFileSync(path.join(repoRoot, 'knowledge/observability.md'), 'utf8')
    expect(obs).toContain('observability-sentry-data-collection.md')
  })

  it('W5a scene-core split extracts tree and clone modules', () => {
    const w5 = readFileSync(path.join(repoRoot, 'specs/domain/scene-core-split-w5.md'), 'utf8')
    expect(w5).toContain('scene-tree.ts')
    expect(w5).toContain('scene-clone.ts')
    expect(w5).toContain('W5a')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('scene-tree.ts')
    expect(knowledge).toContain('W5b')
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/scene-tree.ts'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/scene-clone.ts'))).toBe(true)
    const ops = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/ops.ts'), 'utf8')
    expect(ops).toContain("from './scene-tree'")
    expect(ops).toContain("from './scene-clone'")
    const html = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/html-to-scene.ts'), 'utf8')
    expect(html).toContain("from './scene-tree'")
    expect(html).not.toContain("from './ops'")
  })

  it('W5b scene-core split extracts insert defaults', () => {
    const w5 = readFileSync(path.join(repoRoot, 'specs/domain/scene-core-split-w5.md'), 'utf8')
    expect(w5).toContain('scene-insert-defaults.ts')
    expect(w5).toContain('W5b')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('scene-insert-defaults.ts')
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/scene-insert-defaults.ts'))).toBe(true)
    const ops = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/ops.ts'), 'utf8')
    expect(ops).toContain("from './scene-insert-defaults'")
    expect(ops).not.toMatch(/export function defaultChildForType/)
    expect(ops).not.toMatch(/export function seedInsertChildTree/)
    const defaults = readFileSync(
      path.join(repoRoot, 'apps/web/lib/scene/scene-insert-defaults.ts'),
      'utf8',
    )
    expect(defaults).toContain('export function defaultChildForType')
    expect(defaults).toContain('export function seedInsertChildTree')
    expect(defaults).toContain('export function applySiteTableStructureOp')
  })

  it('W5c scene-core split extracts drop plan and clipboard', () => {
    const w5 = readFileSync(path.join(repoRoot, 'specs/domain/scene-core-split-w5.md'), 'utf8')
    expect(w5).toContain('scene-drop-plan.ts')
    expect(w5).toContain('scene-clipboard.ts')
    expect(w5).toContain('W5c')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('scene-drop-plan.ts')
    expect(knowledge).toContain('scene-clipboard.ts')
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/scene-drop-plan.ts'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/scene-clipboard.ts'))).toBe(true)
    const ops = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/ops.ts'), 'utf8')
    expect(ops).toContain("from './scene-drop-plan'")
    expect(ops).toContain("from './scene-clipboard'")
    expect(ops).not.toMatch(/export function planPaletteDrop/)
    expect(ops).not.toMatch(/export function parseEditorClipboard/)
    const drop = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/scene-drop-plan.ts'), 'utf8')
    expect(drop).toContain('export function planPaletteDrop')
    expect(drop).toContain('export function planLayerDrop')
    const clip = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/scene-clipboard.ts'), 'utf8')
    expect(clip).toContain('export function parseEditorClipboard')
    expect(clip).toContain('paths.editorClipboardKind')
    const pathsSrc = readFileSync(path.join(repoRoot, 'apps/web/lib/paths.ts'), 'utf8')
    expect(pathsSrc).toContain('editorClipboardKind')
  })

  it('W5d scene-core split extracts html CSS parse', () => {
    const w5 = readFileSync(path.join(repoRoot, 'specs/domain/scene-core-split-w5.md'), 'utf8')
    expect(w5).toContain('html-css-parse.ts')
    expect(w5).toContain('W5d')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('html-css-parse.ts')
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/html-css-parse.ts'))).toBe(true)
    const html = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/html-to-scene.ts'), 'utf8')
    expect(html).toContain("from './html-css-parse'")
    expect(html).not.toMatch(/export function parseClassRulesFromDocument/)
    expect(html).not.toMatch(/export function boxStyleFromMap/)
    const css = readFileSync(path.join(repoRoot, 'apps/web/lib/scene/html-css-parse.ts'), 'utf8')
    expect(css).toContain('export function parseClassRulesFromDocument')
    expect(css).toContain('export function boxStyleFromMap')
    expect(css).toContain('export function stripCssAtRules')
  })

  it('W5e scene-core split extracts editor history/selection/persistence hooks', () => {
    const w5 = readFileSync(path.join(repoRoot, 'specs/domain/scene-core-split-w5.md'), 'utf8')
    expect(w5).toContain('use-editor-history.ts')
    expect(w5).toContain('use-editor-selection.ts')
    expect(w5).toContain('use-editor-persistence.ts')
    expect(w5).toContain('W5e')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('use-editor-history.ts')
    expect(knowledge).toContain('use-editor-persistence.ts')
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-history.ts'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-selection.ts'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-persistence.ts'))).toBe(true)
    const orchestrator = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    expect(orchestrator).toContain("from './use-editor-history'")
    expect(orchestrator).toContain("from './use-editor-selection'")
    expect(orchestrator).toContain("from './use-editor-persistence'")
    expect(orchestrator).toContain("from './use-editor-integrations'")
    expect(orchestrator).toContain("from './use-editor-structure'")
    expect(orchestrator).toContain("from './use-editor-mutations'")
    expect(orchestrator).toContain("from './use-editor-palette'")
    expect(orchestrator).toContain("from './use-editor-pointer'")
    expect(orchestrator).toContain("from './use-editor-board-nav'")
    expect(orchestrator).toContain("from './use-editor-master-edit'")
    expect(orchestrator).toContain("from './use-editor-node-select'")
    expect(orchestrator).toContain("from './use-editor-context-menu'")
    expect(orchestrator).toContain("from './use-editor-scene-sync'")
    expect(orchestrator).not.toContain('EDITOR_AUTOSAVE_DEBOUNCE_MS')
    expect(orchestrator).not.toMatch(/setHistory\(\(h\) => undoHistory/)
    expect(orchestrator).not.toContain('requestSiteKitPublishAll')
    expect(orchestrator).not.toContain('requestSiteKitPull')
    expect(orchestrator).not.toContain('function removeSelectedNodes')
    expect(orchestrator).not.toContain('function pasteClipboardNodes')
    expect(orchestrator).not.toContain('function applyMutatingOp')
    expect(orchestrator).not.toContain('function runOps')
    expect(orchestrator).not.toContain('softLockConflict')
    expect(orchestrator).not.toContain('function resolveHydrateTemplate')
    expect(orchestrator).not.toContain('function onPaletteDrop')
    expect(orchestrator).not.toContain('function onCanvasPointerDown')
    expect(orchestrator).not.toContain('function onHandlePointerDown')
    expect(orchestrator).not.toContain('function beginFrameDrag')
    expect(orchestrator).not.toContain('function fitToActiveFrame')
    expect(orchestrator).not.toContain('function activateBoardPage')
    expect(orchestrator).not.toContain('function cycleActivePage')
    expect(orchestrator).not.toContain('function enterMasterEdit')
    expect(orchestrator).not.toContain('function selectNode')
    expect(orchestrator).not.toContain('function applySceneSnapshot')
    expect(orchestrator).not.toContain('function onBreakpointChange')
    const workspace = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor-workspace.tsx'),
      'utf8',
    )
    expect(workspace).not.toMatch(/from ['"].*scene\/history['"]/)
    expect(workspace).not.toMatch(/setHistory\(\(h\) =>/)
    expect(workspace).toContain('pushPresent')
    expect(workspace).toContain('applySceneSnapshot')
    expect(w5).toContain('Raw `setHistory')
    expect(w5).toContain('W5g')
    expect(w5).toContain('use-editor-integrations.ts')
    expect(w5).toContain('W5h')
    expect(w5).toContain('use-editor-structure.ts')
    expect(w5).toContain('W5i')
    expect(w5).toContain('use-editor-mutations.ts')
    expect(w5).toContain('W5j')
    expect(w5).toContain('use-editor-palette.ts')
    expect(w5).toContain('W5k')
    expect(w5).toContain('use-editor-pointer.ts')
    expect(w5).toContain('W5l')
    expect(w5).toContain('use-editor-board-nav.ts')
    expect(w5).toContain('W5m')
    expect(w5).toContain('use-editor-master-edit.ts')
    expect(w5).toContain('W5n')
    expect(w5).toContain('use-editor-node-select.ts')
    expect(w5).toContain('W5o')
    expect(w5).toContain('use-editor-context-menu.ts')
    expect(w5).toContain('W5p')
    expect(w5).toContain('use-editor-scene-sync.ts')
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-integrations.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-structure.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-mutations.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-palette.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-pointer.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-board-nav.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-master-edit.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-node-select.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-context-menu.ts'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'apps/web/components/editor/use-editor-scene-sync.ts'))).toBe(
      true,
    )
    const persistence = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor/use-editor-persistence.ts'),
      'utf8',
    )
    expect(persistence).toContain('EDITOR_AUTOSAVE_DEBOUNCE_MS')
    expect(persistence).toContain('P78')
  })

  it('W5f scene dirty uses mutation revision not render JSON', () => {
    const w5 = readFileSync(path.join(repoRoot, 'specs/domain/scene-core-split-w5.md'), 'utf8')
    expect(w5).toContain('scene-save-fingerprint.ts')
    expect(w5).toContain('W5f')
    expect(w5).toContain('isSceneDirty')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('isSceneDirty')
    expect(knowledge).toContain('mutation revision')
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/scene/scene-save-fingerprint.ts'))).toBe(true)
    const persistence = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor/use-editor-persistence.ts'),
      'utf8',
    )
    expect(persistence).toContain('isSceneDirty')
    expect(persistence).toContain('contentRevision')
    // Per-render dirty must not stringify the scene.
    expect(persistence).not.toMatch(/const dirty =\s*sceneSaveFingerprint/)
    const history = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor/use-editor-history.ts'),
      'utf8',
    )
    expect(history).toContain('revision')
    expect(history).toContain('pushPresent')
    const docFp = readFileSync(
      path.join(repoRoot, 'apps/web/lib/scene/scene-document-fingerprint.ts'),
      'utf8',
    )
    expect(docFp).toContain('WeakMap')
  })

  it('W1 enterprise hardening: CI workflow + error boundary + backlog', () => {
    const workflow = readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8')
    expect(workflow).toContain('/ui')
    expect(workflow).toContain('npm test')
    expect(workflow).toContain('typecheck')
    expect(workflow).toContain('test:google-fonts-sync')
    expect(workflow).toContain('npm ci --prefix mcp-server')
    expect(existsSync(path.join(repoRoot, 'apps/web/app/error.tsx'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'apps/web/app/global-error.tsx'))).toBe(true)
    const errorSrc = readFileSync(path.join(repoRoot, 'apps/web/app/error.tsx'), 'utf8')
    expect(errorSrc).toContain("'use client'")
    expect(errorSrc).toContain('creation-error-boundary')
    expect(errorSrc).toContain('common.errorRetry')
    const globalSrc = readFileSync(path.join(repoRoot, 'apps/web/app/global-error.tsx'), 'utf8')
    expect(globalSrc).toContain("'use client'")
    expect(globalSrc).toContain('creation-error-boundary')
    const backlog = readFileSync(
      path.join(repoRoot, 'knowledge/enterprise-hardening-backlog.md'),
      'utf8',
    )
    expect(backlog).toContain('W1')
    expect(backlog).toContain('GitHub Actions')
    const ciSpec = readFileSync(
      path.join(repoRoot, 'specs/domain/ci-and-error-boundary.md'),
      'utf8',
    )
    expect(ciSpec).toContain('error.tsx')
    expect(ciSpec).toContain('ci.yml')
    const staging = readFileSync(path.join(repoRoot, 'knowledge/staging-coolify.md'), 'utf8')
    expect(staging).toContain('.github/workflows/ci.yml')
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toContain('.github/workflows/ci.yml')
    const rootPkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: { test: string }
    }
    expect(rootPkg.scripts.test).toContain('mcp-server')
  })

  it('W6 concurrent edit decision is Presence-only', () => {
    const w6 = readFileSync(path.join(repoRoot, 'specs/domain/concurrent-edit-w6.md'), 'utf8')
    expect(w6).toContain('Presence-only')
    expect(w6).toContain('stale-scene')
    expect(w6).toContain('keep the local draft')
    expect(w6).toContain('W6')
    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/concurrent-edit-decision.md'),
      'utf8',
    )
    expect(knowledge).toContain('Presence-only')
    expect(knowledge).toContain('keep local draft')
    expect(existsSync(path.join(repoRoot, 'knowledge/editor-pending-ops-and-stale-ux.md'))).toBe(
      true,
    )
    const backlog = readFileSync(
      path.join(repoRoot, 'knowledge/enterprise-hardening-backlog.md'),
      'utf8',
    )
    expect(backlog).toContain('concurrent-edit-w6.md')
    expect(backlog).toMatch(/W6.*done/s)
  })

  it('W7 scene history patches use inverse-op entries', () => {
    const w7 = readFileSync(path.join(repoRoot, 'specs/domain/scene-history-patches-w7.md'), 'utf8')
    expect(w7).toContain('inverse-op')
    expect(w7).toContain('snapshot')
    expect(w7).toContain('invertSceneOps')
    expect(w7).toContain('W7b')
    expect(w7).toContain('W7c')
    expect(w7).toContain('W7d')
    expect(w7).toContain('restore_page')
    expect(w7).toContain('restore_master')
    expect(w7).toContain('wrap_nodes')
    expect(existsSync(path.join(repoRoot, 'specs/domain/scene-history-patches-w7.md'))).toBe(true)
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('scene-history-patches-w7.md')
    expect(knowledge).toContain('invert-scene-ops')
    expect(knowledge).toContain('W7d')
    const backlog = readFileSync(
      path.join(repoRoot, 'knowledge/enterprise-hardening-backlog.md'),
      'utf8',
    )
    expect(backlog).toContain('scene-history-patches-w7.md')
    expect(backlog).toMatch(/W7.*done/s)
    expect(backlog).toContain('W7d')
  })

  it('W8 scene structural sharing uses path-copy hot path', () => {
    const w8 = readFileSync(
      path.join(repoRoot, 'specs/domain/scene-structural-sharing-w8.md'),
      'utf8',
    )
    expect(w8).toContain('path-copy')
    expect(w8).toContain('updateNodeById')
    expect(w8).toContain('mapParentChildren')
    expect(w8).toContain('set_prop')
    expect(w8).toContain('set_breakpoint_override')
    expect(w8).toContain('set_state_override')
    expect(w8).toContain('insert_child')
    expect(w8).toContain('remove_node')
    expect(w8).toContain('move_node')
    expect(w8).toContain('W8b')
    expect(w8).toContain('W8c')
    expect(w8).toContain('W8d')
    expect(w8).toContain('W8e')
    expect(w8).toContain('W8f')
    expect(w8).toContain('set_flags')
    expect(w8).toContain('wrap_nodes')
    expect(w8).toContain('add_interaction')
    expect(w8).toContain('table_add_row')
    expect(w8).toContain('move_node_to_page')
    expect(w8).toContain('create_master')
    expect(w8).toContain('add_master_variant')
    expect(w8).toContain('Residual cold path')
    expect(w8).toContain('cloneScene')
    expect(w8).toContain('commitScenePages')
    expect(existsSync(path.join(repoRoot, 'specs/domain/scene-structural-sharing-w8.md'))).toBe(
      true,
    )
    const pagesMod = readFileSync(
      path.join(repoRoot, 'apps/web/lib/scene/scene-pages.ts'),
      'utf8',
    )
    expect(pagesMod).toContain('export function commitScenePages')
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/scene-core-split.md'), 'utf8')
    expect(knowledge).toContain('scene-structural-sharing-w8.md')
    expect(knowledge).toContain('commitScenePages')
    expect(knowledge).toContain('W8e')
    expect(knowledge).toContain('W8f')
    const backlog = readFileSync(
      path.join(repoRoot, 'knowledge/enterprise-hardening-backlog.md'),
      'utf8',
    )
    expect(backlog).toContain('scene-structural-sharing-w8.md')
    expect(backlog).toMatch(/W8.*done/s)
    expect(backlog).toMatch(/W8a–\*\*f\*\*/)
  })
})

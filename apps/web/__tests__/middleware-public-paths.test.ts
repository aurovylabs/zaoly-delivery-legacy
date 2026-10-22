import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'
import { isMachineScenePath, isPublicPath } from '../lib/middleware-public-paths'

describe('middleware public path classification (WS-1)', () => {
  const sceneMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

  it('serves the landing publicly while keeping the editor gated', () => {
    expect(isPublicPath(paths.routes.home, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.home, 'POST')).toBe(false)
    expect(isPublicPath(paths.routes.faq, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.faq, 'POST')).toBe(false)
    expect(isPublicPath(paths.routes.explore, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.exploreChapter('editor'), 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.explore, 'POST')).toBe(false)
    expect(isPublicPath(paths.routes.register, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiRegister, 'POST')).toBe(true)
    expect(isPublicPath(paths.routes.editor, 'GET')).toBe(false)
    expect(isPublicPath(paths.routes.apiScenes, 'GET')).toBe(false)
  })

  it.each(sceneMethods)('does not treat /api/scenes as public for %s', (method) => {
    expect(isPublicPath('/api/scenes', method)).toBe(false)
  })

  it.each(sceneMethods)('does not treat /api/scenes/:id as public for %s', (method) => {
    expect(isPublicPath('/api/scenes/scene-1', method)).toBe(false)
  })

  it('does not treat PDF export as public', () => {
    expect(isPublicPath('/api/scenes/scene-1/pdf', 'POST')).toBe(false)
  })

  it('does not treat surface export as public', () => {
    expect(isPublicPath('/api/scenes/scene-1/export', 'POST')).toBe(false)
  })

  it('keeps Storybook composition list GET public', () => {
    expect(isPublicPath('/api/site-kit/compositions', 'GET')).toBe(true)
    expect(isPublicPath('/api/site-kit/compositions/Foo', 'GET')).toBe(true)
  })

  it('keeps composition list POST session-gated via middleware', () => {
    expect(isPublicPath('/api/site-kit/compositions', 'POST')).toBe(false)
  })

  it('keeps Storybook override GET public', () => {
    expect(isPublicPath('/api/site-kit/overrides/Button', 'GET')).toBe(true)
  })

  it('keeps library catalog and composition stubs public', () => {
    expect(isPublicPath('/api/library/catalog', 'GET')).toBe(true)
    expect(isPublicPath('/api/compositions', 'GET')).toBe(false)
    expect(isMachineScenePath('/api/compositions', 'GET')).toBe(true)
  })

  it('keeps brand-tokens GET public but not PATCH', () => {
    expect(isPublicPath(paths.routes.apiBrandTokens, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiBrandTokens, 'PATCH')).toBe(false)
  })

  it('allows Sentry tunnel path (W10)', () => {
    expect(isPublicPath(paths.sentryTunnelPath, 'POST')).toBe(true)
    expect(isPublicPath(paths.sentryTunnelPath, 'GET')).toBe(true)
  })

  it('does not treat mutating compositions/catalog as public', () => {
    expect(isPublicPath('/api/compositions', 'POST')).toBe(false)
    expect(isPublicPath('/api/library/catalog', 'POST')).toBe(false)
    expect(isPublicPath('/api/site-kit/overrides/Button', 'POST')).toBe(false)
  })

  it('allows invite accept page and API without a session', () => {
    expect(isPublicPath('/invite/abc', 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiInvitesAccept, 'POST')).toBe(true)
    expect(isPublicPath(paths.routes.login, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiAdminUsers, 'GET')).toBe(false)
  })

  it('allows Storyblok configured GET probe without a session', () => {
    expect(isPublicPath(paths.routes.apiStoryblokPush, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiStoryblokPush, 'POST')).toBe(false)
  })

  it('allows forgot/reset password pages and APIs without a session', () => {
    expect(isPublicPath(paths.routes.forgotPassword, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.resetPassword, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.verifyEmail, 'GET')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthForgotPassword, 'POST')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthResetPassword, 'POST')).toBe(true)
    expect(isPublicPath(paths.routes.apiAuthVerifyEmail, 'POST')).toBe(true)
    // Under /api/auth/* (NextAuth surface); handler still requires a session.
    expect(isPublicPath(paths.routes.apiAuthVerifyEmailResend, 'POST')).toBe(true)
  })

  it('allows Client Page Share public viewer + APIs', () => {
    expect(isPublicPath('/share/p/crs_abc', 'GET')).toBe(true)
    expect(isPublicPath('/api/public/client-shares/crs_abc', 'GET')).toBe(true)
    expect(isPublicPath('/api/public/client-shares/crs_abc/unlock', 'POST')).toBe(true)
    expect(isPublicPath('/api/public/client-shares/crs_abc/html', 'GET')).toBe(true)
    expect(isPublicPath('/api/scenes/s1/client-shares', 'POST')).toBe(false)
  })
})

describe('middleware machine scene paths (MCP service)', () => {
  it('allows ops and import-html POST', () => {
    expect(isMachineScenePath('/api/scenes/s1/ops', 'POST')).toBe(true)
    expect(isMachineScenePath('/api/scenes/s1/import-html', 'POST')).toBe(true)
  })

  it('allows Site Kit from-scene and from-page POST for MCP', () => {
    expect(isMachineScenePath(paths.routes.apiSiteKitCompositionsFromScene, 'POST')).toBe(
      true,
    )
    expect(isMachineScenePath(paths.routes.apiSiteKitCompositionsFromPage, 'POST')).toBe(true)
  })

  it('allows tree, content-audit, preview reads', () => {
    expect(isMachineScenePath('/api/scenes/s1/tree', 'GET')).toBe(true)
    expect(isMachineScenePath('/api/scenes/s1/content-audit', 'GET')).toBe(true)
    expect(isMachineScenePath('/api/scenes/s1/preview', 'GET')).toBe(true)
    expect(isMachineScenePath('/api/scenes/s1/preview', 'POST')).toBe(true)
  })

  it('allows VIDEON media list + frame GET for service callers', () => {
    expect(isMachineScenePath(paths.routes.apiVideonMedia, 'GET')).toBe(true)
    expect(isMachineScenePath('/api/videon-media/media-1/frame', 'GET')).toBe(true)
    expect(isMachineScenePath(paths.routes.apiVideonMedia, 'POST')).toBe(false)
    expect(isMachineScenePath('/api/videon-media/media-1/frame', 'POST')).toBe(false)
  })

  it('rejects wrong methods and non-MCP scene writes', () => {
    expect(isMachineScenePath('/api/scenes/s1/import-html', 'GET')).toBe(false)
    expect(isMachineScenePath('/api/scenes/s1/ops', 'GET')).toBe(false)
    expect(isMachineScenePath('/api/scenes/s1/pdf', 'POST')).toBe(false)
  })
})

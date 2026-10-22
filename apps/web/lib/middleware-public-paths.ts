import { paths } from './paths'

/** Paths that bypass the suite federation session gate in middleware (method-aware). */
export function isPublicPath(pathname: string, method: string): boolean {
  const m = method.toUpperCase()

  // Marketing pages are public; editor and product data keep their own gates.
  if (
    (pathname === paths.routes.home ||
      pathname === paths.routes.faq ||
      pathname === paths.routes.explore ||
      pathname.startsWith(`${paths.routes.explore}/`)) &&
    m === 'GET'
  ) {
    return true
  }

  // Storybook live list — GET only; POST stays session-gated (or machine scene).
  if (
    (pathname === '/api/site-kit/compositions' ||
      pathname.startsWith('/api/site-kit/compositions/')) &&
    m === 'GET'
  ) {
    return true
  }

  // Site Kit live overrides for sibling Storybook — GET only.
  if (pathname.startsWith('/api/site-kit/overrides') && m === 'GET') {
    return true
  }

  // Fixtures-only / catalog reads — GET only (never mutate publicly).
  if (pathname.startsWith('/api/library/catalog') && m === 'GET') {
    return true
  }

  // Brand tokens retired — GET still returns 410 without session (fail closed).
  if (pathname.startsWith(paths.routes.apiBrandTokens) && m === 'GET') {
    return true
  }

  // Storyblok configured probe only — POST stays session-gated.
  if (pathname === paths.routes.apiStoryblokPush && m === 'GET') return true

  return (
    pathname === paths.routes.login ||
    pathname === paths.routes.register ||
    pathname === paths.routes.forgotPassword ||
    pathname === paths.routes.resetPassword ||
    pathname === paths.routes.verifyEmail ||
    pathname === paths.routes.apiRegister ||
    pathname === paths.routes.apiAuthForgotPassword ||
    pathname === paths.routes.apiAuthResetPassword ||
    pathname === paths.routes.apiAuthVerifyEmail ||
    pathname.startsWith('/invite/') ||
    pathname === paths.routes.apiInvitesAccept ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith(paths.sentryTunnelPath) ||
    pathname.startsWith('/api/federation/health') ||
    pathname.startsWith('/api/platform/provisioning') ||
    pathname.startsWith('/api/editor/launch-code/redeem') ||
    pathname.startsWith(paths.routes.storyblokPreview) ||
    pathname.startsWith('/share/p/') ||
    pathname.startsWith('/api/public/client-shares/') ||
    pathname.startsWith('/_next') ||
    pathname === paths.brandAssets.favicon ||
    pathname === paths.brandAssets.faviconSvg ||
    pathname === paths.brandAssets.appleTouchIcon ||
    pathname === paths.brandAssets.mark ||
    pathname === paths.brandAssets.wordmark ||
    pathname.startsWith('/brand/')
  )
}

export function pathnameIsProjectsApi(pathname: string): boolean {
  return pathname === paths.routes.apiProjects || pathname.startsWith(`${paths.routes.apiProjects}/`)
}

/**
 * Paths the Creation MCP may call with service secret (no browser session).
 * Route handlers still enforce requireSceneApiAccess / actor headers.
 */
export function isMachineScenePath(pathname: string, method: string): boolean {
  if (pathname === '/api/editor/palette' && method === 'GET') return true
  if (pathname === '/api/brand-tokens' && method === 'GET') return true
  // VIDEON stills BFF — session or service secret; handlers enforce Collection ACL.
  if (pathname === paths.routes.apiVideonMedia && method === 'GET') return true
  if (
    pathname.startsWith(`${paths.routes.apiVideonMedia}/`) &&
    pathname.endsWith('/frame') &&
    method === 'GET'
  ) {
    return true
  }
  if (pathname === '/api/scenes' && method === 'GET') return true
  if (pathname === '/api/compositions' && method === 'GET') return true
  if (pathname === '/api/site-kit/compositions' && method === 'POST') return true
  if (pathname === '/api/site-kit/compositions/from-scene' && method === 'POST') return true
  if (pathname === '/api/site-kit/compositions/from-page' && method === 'POST') return true
  if (pathname.match(/^\/api\/scenes\/[^/]+$/) && method === 'GET') return true
  const sceneMatch = pathname.match(
    /^\/api\/scenes\/([^/]+)\/(ops|tree|import-html|content-audit|preview|preview-html|craft-debug)$/,
  )
  if (!sceneMatch) return false
  const action = sceneMatch[2]
  if (action === 'ops' && method === 'POST') return true
  if (action === 'import-html' && method === 'POST') return true
  if (action === 'tree' && method === 'GET') return true
  if (action === 'content-audit' && method === 'GET') return true
  if (action === 'preview' && (method === 'GET' || method === 'POST')) return true
  if (action === 'preview-html' && method === 'GET') return true
  if (action === 'craft-debug' && method === 'GET') return true
  return false
}

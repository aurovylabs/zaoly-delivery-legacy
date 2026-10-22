import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './auth'
import { isProvisioningAuthorized } from './lib/federation-contract'
import {
  getServiceSecret,
  isAuthBypassEnabled,
  isZaolyDatabaseConfigured,
} from './lib/runtime-config'
import { paths } from './lib/paths'
import {
  isMachineScenePath,
  isPublicPath,
  pathnameIsProjectsApi,
} from './lib/middleware-public-paths'
import {
  isAllowedMutatingApiOrigin,
  isMutatingApiMethod,
} from './lib/request-origin'
import { clientIpFromHeaders, takeRateLimit } from './lib/rate-limit'
import { impersonationWriteBlockReason } from './lib/users/impersonation-readonly'

function isMachineProjectsGet(req: NextRequest): boolean {
  if (req.method !== 'GET') return false
  if (!pathnameIsProjectsApi(req.nextUrl.pathname)) return false
  const secret = getServiceSecret()
  return isProvisioningAuthorized(req as unknown as Request, secret)
}

function isMachineSceneApi(req: NextRequest): boolean {
  const secret = getServiceSecret()
  if (!isProvisioningAuthorized(req as unknown as Request, secret)) return false
  return isMachineScenePath(req.nextUrl.pathname, req.method)
}

function authNotConfiguredResponse(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  return new NextResponse('Auth not configured', { status: 503 })
}

function forbidBadOrigin(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api/')) return null
  if (!isMutatingApiMethod(req.method)) return null
  if (isPublicPath(pathname, req.method)) return null
  if (pathname.startsWith('/api/auth')) return null
  if (pathname.startsWith('/api/platform/provisioning')) return null
  if (isMachineProjectsGet(req) || isMachineSceneApi(req)) return null
  if (!isAllowedMutatingApiOrigin(req.headers.get('origin'))) {
    return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 })
  }
  return null
}

/** Read-only view-as: block mutating APIs except impersonate stop. */
function forbidImpersonationWrite(req: NextRequest): NextResponse | null {
  const reason = impersonationWriteBlockReason(
    req.method,
    req.nextUrl.pathname,
    req.cookies.get(paths.impersonationCookieName)?.value,
  )
  if (!reason) return null
  return NextResponse.json({ error: reason }, { status: 403 })
}

function authRateLimit(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  if (req.method.toUpperCase() !== 'POST') return null
  const ip = clientIpFromHeaders(req.headers)
  if (
    pathname === '/api/auth/callback/credentials' ||
    pathname === '/api/auth/signin/credentials'
  ) {
    const limited = takeRateLimit(
      `login:${ip}`,
      paths.rateLimitAuthLoginMax,
      paths.rateLimitAuthLoginWindowMs,
    )
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfterSec: limited.retryAfterSec },
        {
          status: 429,
          headers: { 'Retry-After': String(limited.retryAfterSec) },
        },
      )
    }
  }
  return null
}

const gated = auth((req) => {
  const { pathname } = req.nextUrl

  // Login rate-limit + read-only impersonation run once in `proxy` default.

  const badOrigin = forbidBadOrigin(req)
  if (badOrigin) return badOrigin

  if (isPublicPath(pathname, req.method) || isMachineProjectsGet(req) || isMachineSceneApi(req)) {
    const res = NextResponse.next()
    if (pathname.startsWith(paths.routes.storyblokPreview)) {
      res.headers.set(
        'Content-Security-Policy',
        `frame-ancestors 'self' ${paths.storyblokAppBase} https://*.storyblok.com`,
      )
      res.headers.delete('X-Frame-Options')
    }
    return res
  }

  if (!req.auth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const login = new URL(paths.routes.login, req.nextUrl.origin)
    login.searchParams.set('redirect', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
})

/** Next.js 16+ Node proxy (replaces Edge `middleware.ts`) so `auth`/`node:crypto` stay valid. */
export default function proxy(req: NextRequest) {
  const limited = authRateLimit(req)
  if (limited) return limited

  const readonly = forbidImpersonationWrite(req)
  if (readonly) return readonly

  if (isAuthBypassEnabled()) {
    const badOrigin = forbidBadOrigin(req)
    if (badOrigin) return badOrigin
    return NextResponse.next()
  }

  if (isZaolyDatabaseConfigured()) {
    return gated(req, {} as never)
  }

  if (isPublicPath(req.nextUrl.pathname, req.method)) {
    return NextResponse.next()
  }
  return authNotConfiguredResponse(req)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

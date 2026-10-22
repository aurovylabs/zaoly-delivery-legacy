'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  AppFrame,
  PageTitle,
  shellFrameStyle,
} from '../lib/zaoly-ui-shell'
import { ShellBrandCorner } from './shell-brand-corner'
import { ZaolySealMark } from './zaoly-seal-mark'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import { TopbarTrailHostProvider } from './topbar-trail-host'
import { Button } from '../lib/zaoly-ui'
import { PRIMARY_NAV, primaryNavActive } from '../lib/primary-nav'

function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'platform_admin'
}

function PrimaryNav({
  pathname,
  t,
}: {
  pathname: string
  t: (key: string) => string
}) {
  const settingsActive = primaryNavActive(pathname, paths.routes.settings)
  const settingsLabel = t('nav.settings')
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch(paths.routes.apiMe)
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as {
          role?: string
          realRole?: string
          impersonating?: boolean
        }
        if (!cancelled) {
          setIsStaff(
            isStaffRole(data.realRole) || (!data.impersonating && isStaffRole(data.role)),
          )
        }
      })
      .catch(() => {
        /* ignore — members simply omit Admin */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <nav
      className="creation-top-nav creation-top-nav--bar"
      aria-label={t('nav.primaryAria')}
      data-nav-labels="true"
      data-nav-variant="bar"
    >
      <span className="zaoly-hub-chrome__brand" data-testid="zaoly-hub-brand" aria-label={paths.brandLabel}>
        <ZaolySealMark size={20} />
        <span className="zaoly-hub-chrome__wordmark">{paths.brandLabel}</span>
      </span>
      {PRIMARY_NAV.map((item) => {
        if (item.id === 'admin' && !isStaff) return null
        const active = primaryNavActive(pathname, item.href)
        const label = t(item.labelKey)
        return (
          <Link
            key={item.id}
            href={item.href}
            className={active ? 'creation-top-nav__link is-active' : 'creation-top-nav__link'}
            aria-current={active ? 'page' : undefined}
          >
            <span className="creation-top-nav__label">{label}</span>
          </Link>
        )
      })}
      <Link
        href={paths.routes.settings}
        className={
          settingsActive
            ? 'creation-top-nav__link creation-top-nav__settings is-active'
            : 'creation-top-nav__link creation-top-nav__settings'
        }
        aria-current={settingsActive ? 'page' : undefined}
      >
        <span className="creation-top-nav__label">{settingsLabel}</span>
      </Link>
    </nav>
  )
}

function ImpersonationBanner({ t }: { t: (key: string) => string }) {
  const [active, setActive] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch(paths.routes.apiMe)
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as {
          impersonating?: boolean
          email?: string
        }
        if (!cancelled && data.impersonating) {
          setActive(true)
          setEmail(data.email ?? null)
        }
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!active) return null

  async function stop() {
    setBusy(true)
    try {
      await fetch(paths.routes.apiAdminImpersonateStop, { method: 'POST' })
      window.location.assign(paths.routes.adminUsers)
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="zaoly-impersonation-banner" data-testid="zaoly-impersonation-banner" role="status">
      <span>
        {t('admin.impersonatingAs')}
        {email ? ` ${email}` : ''}{' '}
        {t('admin.impersonatingReadonly')}
      </span>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => void stop()}>
        {t('admin.stopImpersonating')}
      </Button>
    </div>
  )
}

export function AppShell({
  children,
  title,
  description,
  titleKey,
  descriptionKey,
  actions,
  status,
  /** Workspace under product chrome: no page title / lead; keeps labeled hub nav + tool trail. */
  immersive = false,
  /** Fill viewport height; children scroll inside (Kit Playground). Keeps page title/lead. */
  contained = false,
  /**
   * Client share / guest preview: full AppFrame + BrandCorner logo, no primary nav.
   * Spec: client-page-share.md · app-shell.md
   */
  preview = false,
}: {
  children: ReactNode
  title?: string | null
  description?: string
  titleKey?: string
  descriptionKey?: string
  actions?: ReactNode
  status?: ReactNode
  immersive?: boolean
  contained?: boolean
  preview?: boolean
}) {
  const pathname = usePathname()
  const { t } = useUserPrefs()
  const [trailHost, setTrailHost] = useState<HTMLElement | null>(null)

  const chromeImmersive = immersive || preview
  /** Labeled warm-gray bar on hubs and immersive editor (not guest preview). */
  const showHubNavBar = !preview

  const frameStyle = useMemo(
    () =>
      shellFrameStyle({
        railInsetRem: paths.railInsetRem,
        railGapRem: paths.railGapRem,
        railWidthRem: paths.railWidthRem,
        mainGutterRem: chromeImmersive ? 0 : paths.mainGutterRem,
      }),
    [chromeImmersive],
  )

  const resolvedTitle = chromeImmersive ? null : titleKey ? t(titleKey) : title
  const resolvedDescription = chromeImmersive
    ? undefined
    : descriptionKey
      ? t(descriptionKey)
      : description

  const frameClass = preview
    ? 'creation-app-frame--top-chrome creation-app-frame--editor creation-app-frame--preview'
    : immersive
      ? 'creation-app-frame--top-chrome creation-app-frame--editor'
      : contained
        ? 'creation-app-frame--top-chrome creation-app-frame--contained creation-app-frame--hub-chrome'
        : 'creation-app-frame--top-chrome creation-app-frame--hub-chrome'

  const nav = showHubNavBar ? <PrimaryNav pathname={pathname} t={t} /> : null

  return (
    <TopbarTrailHostProvider host={trailHost}>
      <AppFrame
        railEdge={paths.railDockEdge}
        style={frameStyle}
        className={frameClass}
        shellCorners
        shellCornerRadius={paths.brandCornerRadiusPx}
        brandCorner={
          preview ? (
            <ShellBrandCorner logoOnly />
          ) : nav ? (
            <div className="zaoly-hub-chrome" data-testid="zaoly-hub-chrome">
              {nav}
            </div>
          ) : undefined
        }
        topbar={
          <>
            <div className="topbar-brand creation-topbar-lead">
              {preview ? (
                <span
                  className="creation-preview-chrome-label"
                  data-testid="creation-preview-chrome-label"
                >
                  {t('shell.clientSharePreview')}
                </span>
              ) : null}
              {!chromeImmersive && resolvedTitle != null && resolvedTitle !== '' ? (
                <PageTitle>{resolvedTitle}</PageTitle>
              ) : null}
            </div>
            <div
              ref={setTrailHost}
              className="topbar-right creation-topbar-trail"
              data-testid="creation-topbar-trail"
            >
              {status}
              {actions}
            </div>
          </>
        }
      >
        <div
          className={
            chromeImmersive
              ? 'creation-stage creation-stage--editor'
              : contained
                ? 'creation-stage creation-stage--contained'
                : 'creation-stage'
          }
        >
          {!preview ? <ImpersonationBanner t={t} /> : null}
          {resolvedDescription ? <p className="creation-page-lead">{resolvedDescription}</p> : null}
          {children}
        </div>
      </AppFrame>
    </TopbarTrailHostProvider>
  )
}

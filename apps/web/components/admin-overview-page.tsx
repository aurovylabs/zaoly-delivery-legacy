'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Chip, EmptyState, SectionChrome, Text } from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

type Overview = {
  userCounts: { total: number; admins: number; members: number; disabled: number }
  publicSignup: boolean
  smtp: { configured: boolean; managed: boolean }
  sceneStore: string
}

const MODULE_TILES = [
  {
    href: paths.routes.adminUsers,
    titleKey: 'admin.tileUsers',
    helpKey: 'admin.tileUsersHelp',
    ctaKey: 'admin.openUsers',
    testId: 'zaoly-admin-tile-users',
  },
  {
    href: paths.routes.adminMail,
    titleKey: 'admin.tileMail',
    helpKey: 'admin.tileMailHelp',
    ctaKey: 'admin.openMail',
    testId: 'zaoly-admin-tile-mail',
  },
  {
    href: paths.routes.adminAudit,
    titleKey: 'admin.tileAudit',
    helpKey: 'admin.tileAuditHelp',
    ctaKey: 'admin.openAudit',
    testId: 'zaoly-admin-tile-audit',
  },
  {
    href: paths.routes.adminSecurity,
    titleKey: 'admin.tileSecurity',
    helpKey: 'admin.tileSecurityHelp',
    ctaKey: 'admin.openSecurity',
    testId: 'zaoly-admin-tile-security',
  },
] as const

export function AdminOverviewPage() {
  const { t } = useUserPrefs()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch(paths.routes.apiAdminOverview)
    if (!res.ok) {
      setError(res.status === 403 ? t('users.adminOnly') : t('admin.overviewFailed'))
      return
    }
    setData((await res.json()) as Overview)
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  if (error) {
    return (
      <p className="zaoly-users-hub__error" role="alert">
        {error}
      </p>
    )
  }

  if (!data) {
    return <EmptyState>{t('common.loading')}</EmptyState>
  }

  const stats = [
    { key: 'total', label: t('admin.statTotal'), value: data.userCounts.total },
    { key: 'admins', label: t('admin.statAdmins'), value: data.userCounts.admins },
    { key: 'members', label: t('admin.statMembers'), value: data.userCounts.members },
    { key: 'disabled', label: t('admin.statDisabled'), value: data.userCounts.disabled },
  ] as const

  return (
    <div className="zaoly-admin-hub" data-testid="zaoly-admin-overview">
      <section
        className="zaoly-admin-hub__section"
        aria-label={t('admin.directoryTitle')}
      >
        <SectionChrome
          title={t('admin.directoryTitle')}
          meta={t('admin.directoryMeta', { count: String(data.userCounts.total) })}
        />
        <Text role="meta" as="p">
          {t('admin.directoryHelp')}
        </Text>
        <dl className="zaoly-admin-hub__stats">
          {stats.map((stat) => (
            <div key={stat.key}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="zaoly-admin-hub__section" aria-label={t('admin.modulesTitle')}>
        <SectionChrome title={t('admin.modulesTitle')} />
        <Text role="meta" as="p">
          {t('admin.modulesHelp')}
        </Text>
        <div className="zaoly-admin-hub__tiles">
          {MODULE_TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="zaoly-admin-hub__tile"
              data-testid={tile.testId}
            >
              <span className="zaoly-admin-hub__tile-title">{t(tile.titleKey)}</span>
              <span className="zaoly-admin-hub__tile-help">{t(tile.helpKey)}</span>
              <span className="zaoly-admin-hub__tile-cta">{t(tile.ctaKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="zaoly-admin-hub__section" aria-label={t('admin.instanceTitle')}>
        <SectionChrome title={t('admin.instanceTitle')} />
        <Text role="meta" as="p">
          {t('admin.instanceHelp')}
        </Text>
        <ul className="zaoly-admin-hub__flags">
          <li>
            <span>{t('admin.publicSignup')}</span>
            <Chip static size="sm" selected={data.publicSignup}>
              {data.publicSignup ? t('admin.on') : t('admin.off')}
            </Chip>
          </li>
          <li>
            <span>{t('admin.smtpStatus')}</span>
            <Chip static size="sm" selected={data.smtp.configured}>
              {data.smtp.configured ? t('smtp.configured') : t('smtp.notConfigured')}
              {data.smtp.managed ? ` · ${t('smtp.sourceManaged')}` : ''}
            </Chip>
          </li>
          <li>
            <span>{t('admin.sceneStore')}</span>
            <Chip static size="sm" selected={data.sceneStore === 'postgres'}>
              {data.sceneStore}
            </Chip>
          </li>
        </ul>
        <div className="zaoly-admin-hub__actions">
          <Link href={paths.routes.adminMail}>
            <Button variant="ghost" size="sm">
              {t('admin.openMail')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

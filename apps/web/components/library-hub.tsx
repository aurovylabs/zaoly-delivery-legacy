'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  EmptyState,
  EntityCard,
  Hint,
  Panel,
  SectionChrome,
  Text,
} from '@zaoly/ui'
import type { ProjectSummary } from '@zaoly/contracts'
import { SiteKitLibraryPreview } from './site-kit-library-preview'
import { groupSiteKitCatalog, type SiteKitCatalogGroupId } from '../lib/library/site-kit-catalog-groups'
import { editorHref } from '../lib/editor-launch'
import { paths, kitPlaygroundHref } from '../lib/paths'
import { isRealPlatformProjectId } from '../lib/platform-project-id'
import { siteKitStorybookUrl } from '../lib/runtime-config'
import {
  siteKitAtomStoryHref,
  siteKitCompositionStoryHref,
  mintSiteKitViewCredentialsClient,
  withSiteKitViewCredentials,
} from '../lib/site-kit/storybook-href'
import { zaolyStarterSectionNavEntries } from '../lib/site-kit/zaoly-starter-sections'
import { useUserPrefs } from '../lib/user-prefs'
import type { Translator } from '../lib/i18n'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'

type CompositionEntry = {
  name: string
  exportName: string
  storyTitle: string
  componentId: string
  platformProjectId?: string | null
  updatedAt: string | null
  previewRoot?: SiteKitCompositionNode | null
}

function atomGroupLabel(id: SiteKitCatalogGroupId, t: Translator): string {
  if (id === 'forms') return t('library.atomGroupForms')
  if (id === 'content') return t('library.atomGroupContent')
  return t('library.atomGroupLayout')
}

function formatUpdatedAt(value: string | null, t: Translator): string | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return t('library.updatedAt', { date: new Date(parsed).toLocaleString() })
}

/**
 * Library hub — starter Sections + Site Kit compositions + atom catalog.
 * Spec: `specs/domain/library-hub.md`
 */
export function LibraryHub({
  inAppEditor = true,
  projects = [],
}: {
  inAppEditor?: boolean
  projects?: ProjectSummary[]
}) {
  const { t } = useUserPrefs()
  const boundProjects = useMemo(
    () => projects.filter((p) => isRealPlatformProjectId(p.platformProjectId)),
    [projects],
  )
  // Collection picker deferred (library-hub.md / Kit SK-V23) — only deep-link or first bound id for optional Patterns fetch.
  const [collectionId] = useState(() => boundProjects[0]?.platformProjectId ?? '')
  const [compositions, setCompositions] = useState<CompositionEntry[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewCreds, setViewCreds] = useState<{
    viewToken: string
    platformProjectId: string
  } | null>(null)
  const storybookUrl = siteKitStorybookUrl()
  const atomGroups = useMemo(() => groupSiteKitCatalog(), [])
  const sections = useMemo(() => zaolyStarterSectionNavEntries(), [])

  const refresh = useCallback(() => {
    setStatus(null)
    if (!collectionId || !isRealPlatformProjectId(collectionId)) {
      setCompositions([])
      setViewCreds(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const url = `${paths.routes.apiSiteKitCompositions}?platformProjectId=${encodeURIComponent(collectionId)}`
    void fetch(url)
      .then((r) => r.json())
      .then((body: { compositions?: CompositionEntry[] }) => {
        setCompositions(body.compositions ?? [])
      })
      .catch(() => setStatus(t('library.compositionsUnavailable')))
      .finally(() => setLoading(false))
    void mintSiteKitViewCredentialsClient(collectionId).then((creds) => {
      setViewCreds(
        creds
          ? { viewToken: creds.viewToken, platformProjectId: creds.platformProjectId }
          : null,
      )
    })
  }, [collectionId, t])

  useEffect(() => {
    refresh()
  }, [refresh])

  function compositionStoryHref(entry: CompositionEntry): string | null {
    if (!storybookUrl) return null
    return withSiteKitViewCredentials(
      siteKitCompositionStoryHref(storybookUrl, entry.exportName, 'default', {
        storyTitle: entry.storyTitle,
        platformProjectId: entry.platformProjectId,
      }),
      viewCreds,
    )
  }

  return (
    <div className="creation-magazine creation-library-hub">
      <Panel>
        <SectionChrome title={t('pages.library.title')} meta="Site Kit" />
        <Text>{t('library.heroBody')}</Text>
        <div className="creation-library-actions">
          {inAppEditor ? (
            <Link href={paths.routes.editor}>
              <Button type="button">{t('library.openEditor')}</Button>
            </Link>
          ) : (
            <Hint panel>{t('pages.compositions.inAppOffHint', { env: paths.envEditorInApp })}</Hint>
          )}
          <Link href={kitPlaygroundHref({})}>
            <Button type="button" data-testid="library-open-kit-playground">
              {t('library.openKitPlayground')}
            </Button>
          </Link>
          {storybookUrl ? (
            <a href={storybookUrl} target="_blank" rel="noreferrer">
              <Button type="button" variant="subtle" data-testid="library-open-storybook-package">
                {t('library.openStorybookCatalog')}
              </Button>
            </a>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={() => refresh()}>
            {t('library.refreshCompositions')}
          </Button>
        </div>
        {storybookUrl ? (
          <Text role="meta" as="p" className="creation-library-storybook-origin">
            {t('library.storybookOrigin')}{' '}
            <a href={storybookUrl} target="_blank" rel="noreferrer">
              {storybookUrl}
            </a>
          </Text>
        ) : (
          <Text role="meta" as="p">
            {t('editor.siteKitStorybookUnset', { key: paths.envSiteKitStorybook })}
          </Text>
        )}
        {status ? (
          <Text role="meta" as="p">
            {status}
          </Text>
        ) : null}
      </Panel>

      <Panel data-testid="library-site-kit-sections">
        <SectionChrome
          title={t('library.sectionsTitle')}
          meta={t('library.sectionsMeta', { count: sections.length })}
        />
        <Text role="meta" as="p">
          {t('library.sectionsLead')}
        </Text>
        <ul className="creation-library-grid">
          {sections.map((entry) => (
            <li key={entry.componentId}>
              <EntityCard
                meta={entry.componentId}
                title={entry.label}
                badge={<Badge tone="neutral">{entry.exportName}</Badge>}
                footer={
                  <div className="creation-library-card-actions">
                    <Link
                      href={kitPlaygroundHref({ componentId: entry.componentId })}
                      data-testid={`library-section-open-kit-${entry.exportName}`}
                    >
                      <Button type="button" size="sm">
                        {t('library.openInKit')}
                      </Button>
                    </Link>
                    {inAppEditor ? (
                      <Link
                        href={editorHref({ insertType: entry.componentId })}
                        data-testid={`library-section-open-editor-${entry.exportName}`}
                      >
                        <Button type="button" size="sm" variant="ghost">
                          {t('library.openEditor')}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                }
              >
                <SiteKitLibraryPreview kind="section" componentId={entry.componentId} />
              </EntityCard>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel data-testid="library-site-kit-compositions">
        <SectionChrome
          title={t('library.compositionsTitle')}
          meta={t('library.compositionsMeta', { count: compositions.length })}
        />
        <Text role="meta" as="p">
          {t('library.compositionsLead')}
        </Text>
        {!collectionId || !isRealPlatformProjectId(collectionId) ? (
          <EmptyState>{t('library.compositionsNeedCollection')}</EmptyState>
        ) : loading ? (
          <Text role="meta" as="p">
            {t('library.loadingCompositions')}
          </Text>
        ) : compositions.length === 0 ? (
          <EmptyState>{t('library.compositionsEmpty')}</EmptyState>
        ) : (
          <ul className="creation-library-grid">
            {compositions.map((entry) => {
              const sb = compositionStoryHref(entry)
              const updated = formatUpdatedAt(entry.updatedAt, t)
              return (
                <li key={entry.componentId || `${entry.platformProjectId ?? 'x'}:${entry.exportName}`}>
                  <EntityCard
                    meta={t('library.compositionKind')}
                    title={entry.name || entry.exportName}
                    badge={<Badge tone="neutral">{entry.exportName}</Badge>}
                    footer={
                      <div className="creation-library-card-actions">
                        {inAppEditor ? (
                          <Link href={paths.routes.editor}>
                            <Button type="button" size="sm">
                              {t('library.openEditor')}
                            </Button>
                          </Link>
                        ) : null}
                        {sb ? (
                          <a href={sb} target="_blank" rel="noreferrer">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              data-testid="library-composition-storybook-package"
                            >
                              {t('library.openStorybook')}
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    }
                  >
                    <SiteKitLibraryPreview
                      kind="composition"
                      componentId={entry.componentId}
                      node={entry.previewRoot}
                    />
                    {updated ? (
                      <Text role="meta" as="p">
                        {updated}
                      </Text>
                    ) : null}
                  </EntityCard>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel data-testid="library-site-kit-atoms">
        <SectionChrome
          title={t('library.atomsTitle')}
          meta={t('library.atomsMeta', { count: atomGroups.reduce((n, g) => n + g.items.length, 0) })}
        />
        <Text role="meta" as="p">
          {t('library.atomsLead')}
        </Text>
        {atomGroups.map((group) => (
          <section key={group.id} className="creation-library-atom-group">
            <SectionChrome
              title={atomGroupLabel(group.id, t)}
              meta={t('library.atomGroupMeta', { count: group.items.length })}
            />
            <ul className="creation-library-grid creation-library-grid--compact">
              {group.items.map((entry) => {
                const sb =
                  storybookUrl != null ? siteKitAtomStoryHref(storybookUrl, entry.title) : null
                return (
                  <li key={entry.id}>
                    <EntityCard
                      meta={entry.id}
                      title={entry.exportName}
                      badge={<Badge tone="neutral">{entry.title}</Badge>}
                      footer={
                        <div className="creation-library-card-actions">
                          <Link
                            href={kitPlaygroundHref({ componentId: entry.id })}
                            data-testid={`library-atom-open-kit-${entry.id}`}
                          >
                            <Button type="button" size="sm">
                              {t('library.openInKit')}
                            </Button>
                          </Link>
                          {inAppEditor ? (
                            <Link
                              href={editorHref({ insertType: entry.id })}
                              data-testid={`library-atom-open-editor-${entry.id}`}
                            >
                              <Button type="button" size="sm" variant="ghost">
                                {t('library.openEditor')}
                              </Button>
                            </Link>
                          ) : null}
                          {sb ? (
                            <a href={sb} target="_blank" rel="noreferrer">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                data-testid="library-atom-storybook-package"
                              >
                                {t('library.openStorybook')}
                              </Button>
                            </a>
                          ) : null}
                        </div>
                      }
                    >
                      <SiteKitLibraryPreview kind="atom" atomId={entry.id} />
                    </EntityCard>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </Panel>
    </div>
  )
}

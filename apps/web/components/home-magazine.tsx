'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { CompositionSummary, ProjectSummary } from '@zaoly/contracts'
import { EmptyState, Text } from '@zaoly/ui'
import { compositionEditorHref } from '../lib/scene/scene-summary'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

/** Serializable Site Kit catalog row for home (no preview tree). */
export type HomeLibraryItem = {
  name: string
  exportName: string
  storyTitle: string
  updatedAt: string | null
}

type DatedName = { id: string; name: string; updatedAt: string | null }

function byUpdatedAtDescThenName(a: DatedName, b: DatedName): number {
  const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0
  const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0
  if (tb !== ta) return tb - ta
  return a.name.localeCompare(b.name)
}

function byLastActivityDescThenName(a: ProjectSummary, b: ProjectSummary): number {
  const ta = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0
  const tb = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0
  if (tb !== ta) return tb - ta
  return a.name.localeCompare(b.name)
}

export function buildHomeRecentProjects(
  projects: ProjectSummary[],
  limit = 8,
): ProjectSummary[] {
  return [...projects]
    .filter((p) => p.status !== 'archived')
    .sort(byLastActivityDescThenName)
    .slice(0, limit)
}

export function buildHomeRecentCompositions(
  compositions: CompositionSummary[],
  limit = 8,
): CompositionSummary[] {
  return [...compositions]
    .sort((a, b) =>
      byUpdatedAtDescThenName(
        { id: a.id, name: a.name, updatedAt: a.updatedAt },
        { id: b.id, name: b.name, updatedAt: b.updatedAt },
      ),
    )
    .slice(0, limit)
}

export function buildHomeRecentLibrary(
  items: HomeLibraryItem[],
  limit = 8,
): HomeLibraryItem[] {
  return [...items]
    .sort((a, b) =>
      byUpdatedAtDescThenName(
        { id: a.exportName, name: a.name, updatedAt: a.updatedAt },
        { id: b.exportName, name: b.name, updatedAt: b.updatedAt },
      ),
    )
    .slice(0, limit)
}

function compositionHref(comp: CompositionSummary): string {
  return compositionEditorHref(comp)
}

function HomeChapter({
  eyebrow,
  title,
  deck,
  children,
}: {
  eyebrow: string
  title: string
  deck?: string
  children: ReactNode
}) {
  return (
    <section className="creation-home-chapter">
      <header className="creation-home-chapter__head">
        <div>
          <p className="creation-home-eyebrow">{eyebrow}</p>
          <h2 className="creation-home-headline">{title}</h2>
          {deck ? <p className="creation-home-chapter__deck">{deck}</p> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

function RecentColumn({
  title,
  ariaLabel,
  empty,
  children,
}: {
  title: string
  ariaLabel: string
  empty?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="creation-home-recent-col" aria-label={ariaLabel}>
      <h3 className="creation-home-recent-col__title">{title}</h3>
      {empty != null ? (
        empty
      ) : (
        <ol className="creation-magazine-list creation-home-recent-list">{children}</ol>
      )}
    </div>
  )
}

export function HomeMagazine({
  projects,
  compositions,
  libraryItems,
}: {
  projects: ProjectSummary[]
  compositions: CompositionSummary[]
  libraryItems: HomeLibraryItem[]
}) {
  const { t } = useUserPrefs()
  const recentProjects = buildHomeRecentProjects(projects, 8)
  const recentCompositions = buildHomeRecentCompositions(compositions, 8)
  const recentLibrary = buildHomeRecentLibrary(libraryItems, 8)

  return (
    <article className="creation-magazine creation-magazine--home" data-section="home-magazine">
      <header className="creation-home-cover">
        <h1 className="creation-home-cover__title">{t('home.kicker')}</h1>
      </header>

      <HomeChapter
        eyebrow={t('home.launchEyebrow')}
        title={t('home.launchTitle')}
        deck={t('home.launchDeck')}
      >
        <div className="creation-home-cta-row" role="group" aria-label={t('home.launchAria')}>
          <Link href={paths.routes.projects} className="creation-capability-tile creation-home-cta">
            <span className="creation-capability-tile__kicker">{t('home.projectsKicker')}</span>
            <span className="creation-capability-tile__label">{t('home.projectsLabel')}</span>
            <span className="creation-capability-tile__deck">{t('home.projectsDeck')}</span>
          </Link>
          <Link
            href={paths.routes.compositions}
            className="creation-capability-tile creation-home-cta"
          >
            <span className="creation-capability-tile__kicker">{t('home.compositionsKicker')}</span>
            <span className="creation-capability-tile__label">{t('home.compositionsLabel')}</span>
            <span className="creation-capability-tile__deck">{t('home.compositionsDeck')}</span>
          </Link>
          <Link href={paths.routes.library} className="creation-capability-tile creation-home-cta">
            <span className="creation-capability-tile__kicker">{t('home.libraryKicker')}</span>
            <span className="creation-capability-tile__label">{t('home.libraryLabel')}</span>
            <span className="creation-capability-tile__deck">{t('home.libraryDeck')}</span>
          </Link>
        </div>
      </HomeChapter>

      <HomeChapter
        eyebrow={t('home.recentEyebrow')}
        title={t('home.recentTitle')}
        deck={t('home.recentDeck')}
      >
        <div className="creation-home-recent-columns" aria-label={t('home.recentAria')}>
          <RecentColumn
            title={t('home.recentProjects')}
            ariaLabel={t('home.recentProjectsAria')}
            empty={
              recentProjects.length === 0 ? (
                <EmptyState className="creation-home-chapter__empty">
                  {t('home.emptyProjects')}{' '}
                  <Link href={paths.routes.projects}>{t('home.emptyProjectsCta')}</Link>.
                </EmptyState>
              ) : undefined
            }
          >
            {recentProjects.map((project, index) => (
              <li key={project.id}>
                <span className="creation-magazine-list-num" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="creation-home-recent-list__main">
                  <Link
                    href={paths.routes.projectDetail(project.id)}
                    className="creation-home-recent-list__title"
                  >
                    {project.name}
                  </Link>
                  <Text role="meta" as="p" className="creation-home-recent-list__meta">
                    {project.capabilityStatus}
                    {project.compositionCount > 0
                      ? ` · ${project.compositionCount} compositions`
                      : ''}
                  </Text>
                </div>
              </li>
            ))}
          </RecentColumn>

          <RecentColumn
            title={t('home.recentCompositions')}
            ariaLabel={t('home.recentCompositionsAria')}
            empty={
              recentCompositions.length === 0 ? (
                <EmptyState className="creation-home-chapter__empty">
                  {t('home.emptyCompositions')}{' '}
                  <Link href={paths.routes.compositions}>{t('home.emptyCompositionsCta')}</Link>.
                </EmptyState>
              ) : undefined
            }
          >
            {recentCompositions.map((comp, index) => (
              <li key={comp.id}>
                <span className="creation-magazine-list-num" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="creation-home-recent-list__main">
                  <Link href={compositionHref(comp)} className="creation-home-recent-list__title">
                    {comp.name}
                  </Link>
                  <Text role="meta" as="p" className="creation-home-recent-list__meta">
                    {comp.status}
                    {comp.sourceHint ? ` · ${comp.sourceHint}` : ''}
                  </Text>
                </div>
              </li>
            ))}
          </RecentColumn>

          <RecentColumn
            title={t('home.recentLibrary')}
            ariaLabel={t('home.recentLibraryAria')}
            empty={
              recentLibrary.length === 0 ? (
                <EmptyState className="creation-home-chapter__empty">
                  {t('home.emptyLibrary')}{' '}
                  <Link href={paths.routes.library}>{t('home.emptyLibraryCta')}</Link>.
                </EmptyState>
              ) : undefined
            }
          >
            {recentLibrary.map((item, index) => (
              <li key={item.exportName}>
                <span className="creation-magazine-list-num" aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="creation-home-recent-list__main">
                  <Link href={paths.routes.library} className="creation-home-recent-list__title">
                    {item.name}
                  </Link>
                  <Text role="meta" as="p" className="creation-home-recent-list__meta">
                    {item.storyTitle}
                  </Text>
                </div>
              </li>
            ))}
          </RecentColumn>
        </div>
      </HomeChapter>
    </article>
  )
}

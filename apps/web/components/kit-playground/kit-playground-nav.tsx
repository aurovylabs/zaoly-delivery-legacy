'use client'

import { useMemo, useState } from 'react'
import { Text } from '@zaoly/ui'
import { groupSiteKitCatalog } from '../../lib/library/site-kit-catalog-groups'
import {
  zaolyStarterSectionNavEntries,
  type ZaolyStarterSectionNavEntry,
} from '../../lib/site-kit/zaoly-starter-sections'
import type { Translator } from '../../lib/i18n'

export type KitPlaygroundSelection =
  | { kind: 'atom'; componentId: string; label: string }
  | { kind: 'pattern'; componentId: string; label: string; exportName: string }
  | { kind: 'section'; componentId: string; label: string; exportName: string }

type PatternEntry = {
  name: string
  exportName: string
  componentId: string
}

function atomGroupLabel(
  id: 'forms' | 'content' | 'layout',
  t: Translator,
): string {
  if (id === 'forms') return t('kit.groupForms')
  if (id === 'content') return t('kit.groupContent')
  return t('kit.groupLayout')
}

function matchesQuery(label: string, q: string): boolean {
  if (!q) return true
  return label.toLowerCase().includes(q.toLowerCase())
}

/** Storybook-like nested nav for Kit Playground (+ SK-V4 search). */
export function KitPlaygroundNav({
  patterns,
  selectedId,
  onSelect,
  t,
}: {
  patterns: PatternEntry[]
  selectedId: string | null
  onSelect: (sel: KitPlaygroundSelection) => void
  t: Translator
}) {
  const [query, setQuery] = useState('')
  const atomGroups = useMemo(() => groupSiteKitCatalog(), [])
  const filteredGroups = useMemo(
    () =>
      atomGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((e) => matchesQuery(e.exportName, query) || matchesQuery(e.id, query)),
        }))
        .filter((g) => g.items.length > 0),
    [atomGroups, query],
  )
  const filteredPatterns = useMemo(
    () =>
      patterns.filter(
        (p) => matchesQuery(p.exportName, query) || matchesQuery(p.componentId, query),
      ),
    [patterns, query],
  )
  const sections = useMemo(() => zaolyStarterSectionNavEntries(), [])
  const filteredSections = useMemo(
    () =>
      sections.filter(
        (s: ZaolyStarterSectionNavEntry) =>
          matchesQuery(s.label, query) ||
          matchesQuery(s.exportName, query) ||
          matchesQuery(s.componentId, query),
      ),
    [sections, query],
  )

  return (
    <nav className="creation-kit-nav" data-testid="kit-playground-nav" aria-label={t('kit.navAria')}>
      <label className="creation-kit-nav__search">
        <span className="visually-hidden">{t('kit.navSearch')}</span>
        <input
          type="search"
          data-testid="kit-nav-search"
          placeholder={t('kit.navSearch')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="creation-kit-nav__section">
        <Text role="meta" as="p" className="creation-kit-nav__heading">
          {t('kit.navAtoms')}
        </Text>
        {filteredGroups.length === 0 ? (
          <Text role="meta" as="p" className="creation-kit-nav__empty" data-testid="kit-nav-atoms-empty">
            {t('kit.navSearchEmpty')}
          </Text>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="creation-kit-nav__group" data-testid={`kit-nav-group-${group.id}`}>
              <Text role="meta" as="p" className="creation-kit-nav__group-label">
                {atomGroupLabel(group.id, t)}
              </Text>
              <ul className="creation-kit-nav__list">
                {group.items.map((entry) => {
                  const active = selectedId === entry.id
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={
                          active
                            ? 'creation-kit-nav__item creation-kit-nav__item--active'
                            : 'creation-kit-nav__item'
                        }
                        data-testid={`kit-nav-atom-${entry.id}`}
                        aria-current={active ? 'true' : undefined}
                        onClick={() =>
                          onSelect({
                            kind: 'atom',
                            componentId: entry.id,
                            label: entry.exportName,
                          })
                        }
                      >
                        {entry.exportName}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="creation-kit-nav__section" data-testid="kit-nav-sections">
        <Text role="meta" as="p" className="creation-kit-nav__heading">
          {t('kit.navSections')}
        </Text>
        <Text role="meta" as="p" className="creation-kit-nav__empty" data-testid="kit-nav-sections-hint">
          {t('kit.navSectionsHint')}
        </Text>
        {filteredSections.length === 0 ? (
          <Text role="meta" as="p" className="creation-kit-nav__empty" data-testid="kit-nav-sections-empty">
            {t('kit.navSearchEmpty')}
          </Text>
        ) : (
          <ul className="creation-kit-nav__list">
            {filteredSections.map((entry) => {
              const active = selectedId === entry.componentId
              return (
                <li key={entry.componentId}>
                  <button
                    type="button"
                    className={
                      active
                        ? 'creation-kit-nav__item creation-kit-nav__item--active'
                        : 'creation-kit-nav__item'
                    }
                    data-testid={`kit-nav-section-${entry.exportName}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() =>
                      onSelect({
                        kind: 'section',
                        componentId: entry.componentId,
                        label: entry.label,
                        exportName: entry.exportName,
                      })
                    }
                  >
                    {entry.label}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="creation-kit-nav__section">
        <Text role="meta" as="p" className="creation-kit-nav__heading">
          {t('kit.navPatterns')}
        </Text>
        {filteredPatterns.length === 0 ? (
          <Text role="meta" as="p" className="creation-kit-nav__empty" data-testid="kit-nav-patterns-empty">
            {query ? t('kit.navSearchEmpty') : t('kit.patternsEmpty')}
          </Text>
        ) : (
          <ul className="creation-kit-nav__list">
            {filteredPatterns.map((entry) => {
              const active = selectedId === entry.componentId
              return (
                <li key={entry.componentId}>
                  <button
                    type="button"
                    className={
                      active
                        ? 'creation-kit-nav__item creation-kit-nav__item--active'
                        : 'creation-kit-nav__item'
                    }
                    data-testid={`kit-nav-pattern-${entry.exportName}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() =>
                      onSelect({
                        kind: 'pattern',
                        componentId: entry.componentId,
                        label: entry.exportName,
                        exportName: entry.exportName,
                      })
                    }
                  >
                    {entry.exportName}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </nav>
  )
}

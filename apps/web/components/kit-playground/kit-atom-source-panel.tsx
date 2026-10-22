'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { Button, Text } from '@zaoly/ui'
import type { Translator } from '../../lib/i18n'
import { paths, siteKitGithubBlobUrl } from '../../lib/paths'
import { SITE_KIT_CATALOG } from '../../lib/site-kit/site-kit-catalog'
import {
  atomBaseTypeFromOverrideId,
  isNamespacedAtomOverrideId,
} from '../../lib/site-kit/override-ids'
import { kitPlaygroundKind } from '../../lib/site-kit/kit-playground-kind'
import {
  configurePlaygroundMonaco,
  PLAYGROUND_MONACO_OPTIONS,
} from '../../lib/site-kit/playground-monaco'
import { siteKitAtomStoryHref, openSiteKitStorybookHref } from '../../lib/site-kit/storybook-href'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => null,
})

type AtomSourcePayload = {
  ok: true
  catalogId: string
  exportName: string
  packageName: string
  relPath: string
  source: string
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard?.writeText(value)
    return true
  } catch {
    return false
  }
}

const ATOM_SOURCE_MONACO_OPTIONS = {
  ...PLAYGROUND_MONACO_OPTIONS,
  readOnly: true,
  domReadOnly: true,
  formatOnPaste: false,
}

/** Shared package atom source viewer (SK-V18/V19) — Handoff + Props. */
export function KitAtomSourcePanel({
  componentId,
  kind = null,
  storybookOrigin = null,
  title,
  testIdPrefix = 'kit-atom-source',
  t,
}: {
  componentId: string
  /** When `pattern` (and not Atom~), show pattern note without fetch. */
  kind?: 'atom' | 'pattern' | 'section' | null
  storybookOrigin?: string | null
  /** Optional section title override (e.g. Props · SiteText). */
  title?: string
  testIdPrefix?: string
  t: Translator
}) {
  const [open, setOpen] = useState(false)
  const [copiedSource, setCopiedSource] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<AtomSourcePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const treatAsPattern =
    kitPlaygroundKind(componentId) === 'pattern' ||
    kitPlaygroundKind(componentId) === 'section'

  useEffect(() => {
    let cancelled = false
    setPayload(null)
    setError(null)
    if (!componentId.trim()) return
    if (treatAsPattern) {
      setError('not-atom')
      return
    }
    setLoading(true)
    const url = `${paths.routes.apiSiteKitAtomSource}?${paths.kitComponentQueryParam}=${encodeURIComponent(componentId)}`
    void fetch(url, { credentials: 'same-origin' })
      .then(async (res) => {
        const body = (await res.json()) as AtomSourcePayload | { ok: false; error?: string }
        if (cancelled) return
        if (!res.ok || !('ok' in body) || !body.ok) {
          setError(
            body && typeof body === 'object' && 'error' in body && body.error
              ? String(body.error)
              : 'missing-file',
          )
          setPayload(null)
          return
        }
        setPayload(body)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) {
          setError('missing-file')
          setPayload(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [componentId, treatAsPattern])

  const storyHref = useMemo(() => {
    if (!storybookOrigin || !payload) return null
    const catalogId = isNamespacedAtomOverrideId(componentId)
      ? atomBaseTypeFromOverrideId(componentId) || payload.catalogId
      : payload.catalogId
    const entry = SITE_KIT_CATALOG.find((e) => e.id === catalogId)
    const storyTitle = entry?.title || `Site/${payload.exportName}`
    return siteKitAtomStoryHref(storybookOrigin, storyTitle)
  }, [storybookOrigin, payload, componentId])

  const githubHref = payload ? siteKitGithubBlobUrl(payload.relPath) : null
  const displayPath = payload ? `${payload.packageName}/${payload.relPath}` : ''

  if (error === 'not-atom') {
    return (
      <div className="creation-kit-atom-source" data-testid={`${testIdPrefix}-pattern`}>
        <Text role="meta" as="p" className="creation-kit-props__section">
          {title ?? t('kit.handoffAtomSource')}
        </Text>
        <Text role="meta" as="p" className="creation-kit-handoff__note">
          {t('kit.handoffAtomSourcePatternNote')}
        </Text>
      </div>
    )
  }

  return (
    <div className="creation-kit-atom-source" data-testid={testIdPrefix}>
      <div className="creation-kit-atom-source__head">
        <Text role="meta" as="p" className="creation-kit-props__section">
          {title ?? t('kit.handoffAtomSource')}
        </Text>
        {payload ? (
          <div className="creation-kit-atom-source__actions">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid={`${testIdPrefix}-copy`}
              onClick={() => {
                void copyText(payload.source).then((ok) => {
                  if (!ok) return
                  setCopiedSource(true)
                  window.setTimeout(() => setCopiedSource(false), 1400)
                })
              }}
            >
              {copiedSource ? t('kit.handoffCopied') : t('kit.handoffCopy')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid={`${testIdPrefix}-copy-path`}
              onClick={() => {
                void copyText(displayPath).then((ok) => {
                  if (!ok) return
                  setCopiedPath(true)
                  window.setTimeout(() => setCopiedPath(false), 1400)
                })
              }}
            >
              {copiedPath ? t('kit.handoffCopied') : t('kit.atomSourceCopyPath')}
            </Button>
          </div>
        ) : null}
      </div>
      {loading ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid={`${testIdPrefix}-loading`}>
          {t('kit.handoffAtomSourceLoading')}
        </Text>
      ) : null}
      {error && error !== 'not-atom' ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid={`${testIdPrefix}-error`}>
          {t('kit.handoffAtomSourceError')}
        </Text>
      ) : null}
      {payload ? (
        <>
          <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid={`${testIdPrefix}-path`}>
            <code>{displayPath}</code>
            {payload.catalogId !== componentId ? ` · seed ${payload.catalogId}` : null}
          </Text>
          <div className="creation-kit-atom-source__links">
            {storyHref ? (
              <button
                type="button"
                className="creation-kit-handoff__css-toggle"
                data-testid={`${testIdPrefix}-storybook`}
                onClick={() => void openSiteKitStorybookHref({ href: storyHref })}
              >
                {t('kit.atomSourceStorybook')}
              </button>
            ) : null}
            {githubHref ? (
              <a
                className="creation-kit-atom-source__github"
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`${testIdPrefix}-github`}
              >
                {t('kit.atomSourceGithub')}
              </a>
            ) : null}
          </div>
          <button
            type="button"
            className="creation-kit-handoff__css-toggle"
            data-testid={`${testIdPrefix}-toggle`}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t('kit.handoffAtomSourceHide') : t('kit.handoffAtomSourceShow')}
          </button>
          {open ? (
            <div className="creation-kit-atom-source__monaco" data-testid={`${testIdPrefix}-monaco`}>
              <MonacoEditor
                height="220px"
                language="typescript"
                theme="vs"
                value={payload.source}
                options={ATOM_SOURCE_MONACO_OPTIONS}
                beforeMount={configurePlaygroundMonaco}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** Handoff wrapper — preserves SK-V18 testids where useful. */
export function KitHandoffAtomSource({
  componentId,
  kind,
  storybookOrigin = null,
  t,
}: {
  componentId: string
  kind: 'atom' | 'pattern' | 'section' | null
  storybookOrigin?: string | null
  t: Translator
}) {
  return (
    <KitAtomSourcePanel
      componentId={componentId}
      kind={kind}
      storybookOrigin={storybookOrigin}
      testIdPrefix="kit-handoff-atom-source"
      t={t}
    />
  )
}

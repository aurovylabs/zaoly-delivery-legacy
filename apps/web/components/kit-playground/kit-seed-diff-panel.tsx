'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Button, Text } from '@zaoly/ui'
import type { Translator } from '../../lib/i18n'
import { paths } from '../../lib/paths'
import { kitSeedDiffBaseId } from '../../lib/site-kit/kit-seed-diff-base'
import {
  configurePlaygroundMonaco,
  PLAYGROUND_MONACO_OPTIONS,
} from '../../lib/site-kit/playground-monaco'

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => ({ default: m.DiffEditor })),
  { ssr: false, loading: () => null },
)

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard?.writeText(value)
    return true
  } catch {
    return false
  }
}

const SEED_DIFF_MONACO_OPTIONS = {
  ...PLAYGROUND_MONACO_OPTIONS,
  readOnly: true,
  renderSideBySide: true,
  originalEditable: false,
  formatOnPaste: false,
}

/** Handoff: catalog playground seed vs live module (SK-V20). */
export function KitSeedDiffPanel({
  componentId,
  modifiedSource,
  t,
}: {
  componentId: string
  modifiedSource: string
  t: Translator
}) {
  const baseId = kitSeedDiffBaseId(componentId)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [originalSource, setOriginalSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedOriginal, setCopiedOriginal] = useState(false)
  const [copiedModified, setCopiedModified] = useState(false)

  useEffect(() => {
    let cancelled = false
    setOriginalSource(null)
    setError(null)
    if (!baseId) return
    setLoading(true)
    const url = `${paths.routes.apiSiteKitPlaygroundSource}?${paths.kitComponentQueryParam}=${encodeURIComponent(baseId)}`
    void fetch(url, { credentials: 'same-origin' })
      .then(async (res) => {
        const body = (await res.json()) as { ok?: boolean; source?: string; error?: string }
        if (cancelled) return
        if (!res.ok || !body?.ok || typeof body.source !== 'string') {
          setError(body?.error ? String(body.error) : 'load-failed')
          setOriginalSource(null)
          return
        }
        setOriginalSource(body.source)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) {
          setError('load-failed')
          setOriginalSource(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseId])

  if (!baseId) {
    return (
      <div className="creation-kit-seed-diff" data-testid="kit-seed-diff-pattern">
        <Text role="meta" as="p" className="creation-kit-props__section">
          {t('kit.seedDiff')}
        </Text>
        <Text role="meta" as="p" className="creation-kit-handoff__note">
          {t('kit.seedDiffPatternNote')}
        </Text>
      </div>
    )
  }

  const identical =
    originalSource != null && originalSource === modifiedSource && modifiedSource.length > 0

  return (
    <div className="creation-kit-seed-diff" data-testid="kit-seed-diff">
      <div className="creation-kit-seed-diff__head">
        <Text role="meta" as="p" className="creation-kit-props__section">
          {t('kit.seedDiff')}
        </Text>
        {originalSource ? (
          <div className="creation-kit-seed-diff__actions">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="kit-seed-diff-copy-original"
              onClick={() => {
                void copyText(originalSource).then((ok) => {
                  if (!ok) return
                  setCopiedOriginal(true)
                  window.setTimeout(() => setCopiedOriginal(false), 1400)
                })
              }}
            >
              {copiedOriginal ? t('kit.handoffCopied') : t('kit.seedDiffCopyOriginal')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="kit-seed-diff-copy-modified"
              onClick={() => {
                void copyText(modifiedSource).then((ok) => {
                  if (!ok) return
                  setCopiedModified(true)
                  window.setTimeout(() => setCopiedModified(false), 1400)
                })
              }}
            >
              {copiedModified ? t('kit.handoffCopied') : t('kit.seedDiffCopyModified')}
            </Button>
          </div>
        ) : null}
      </div>

      <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-seed-diff-labels">
        {t('kit.seedDiffOriginalLabel')} · {baseId} → {t('kit.seedDiffModifiedLabel')}
      </Text>

      {identical ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-seed-diff-unchanged">
          {t('kit.seedDiffUnchanged')}
        </Text>
      ) : null}

      {loading ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-seed-diff-loading">
          {t('kit.seedDiffLoading')}
        </Text>
      ) : null}

      {error ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-seed-diff-error">
          {t('kit.seedDiffError')}
        </Text>
      ) : null}

      {originalSource && !error ? (
        <>
          <button
            type="button"
            className="creation-kit-handoff__css-toggle"
            data-testid="kit-seed-diff-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t('kit.seedDiffHide') : t('kit.seedDiffShow')}
          </button>
          {open ? (
            <div className="creation-kit-seed-diff__monaco" data-testid="kit-seed-diff-monaco">
              <MonacoDiffEditor
                height="280px"
                language="typescript"
                original={originalSource}
                modified={modifiedSource}
                beforeMount={configurePlaygroundMonaco}
                options={SEED_DIFF_MONACO_OPTIONS}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

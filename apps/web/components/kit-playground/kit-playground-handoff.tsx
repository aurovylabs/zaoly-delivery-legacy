'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Text } from '@zaoly/ui'
import type { Translator } from '../../lib/i18n'
import type {
  PlaygroundHandoffFields,
  PlaygroundMaintainerFields,
} from '../../lib/site-kit/playground-source'
import { paths } from '../../lib/paths'
import {
  siteKitCdnCssHref,
  siteKitCdnModuleHref,
  siteKitCdnUrl,
} from '../../lib/runtime-config'
import {
  openSiteKitStorybookHref,
  siteKitAtomStoryHref,
  siteKitCompositionStoryHref,
  siteKitLiveCompositionHref,
} from '../../lib/site-kit/storybook-href'
import { SITE_KIT_CATALOG } from '../../lib/site-kit/site-kit-catalog'
import type { InspectTokenOption } from '../../lib/inspect/token-catalog'
import {
  KitTokenBindingRows,
  resolveTokenBindingRows,
} from './kit-token-binding-rows'
import { KitHandoffAtomSource } from './kit-handoff-atom-source'
import { KitSeedDiffPanel } from './kit-seed-diff-panel'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard?.writeText(value)
    return true
  } catch {
    return false
  }
}

function CopyRow({
  label,
  value,
  testId,
  t,
}: {
  label: string
  value: string
  testId: string
  t: Translator
}) {
  const [copied, setCopied] = useState(false)
  return (
    <li className="creation-kit-handoff__row" data-testid={testId}>
      <div className="creation-kit-handoff__row-head">
        <span className="creation-kit-handoff__label">{label}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid={`${testId}-copy`}
          disabled={!value}
          onClick={() => {
            void copyText(value).then((ok) => {
              if (!ok) return
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1400)
            })
          }}
        >
          {copied ? t('kit.handoffCopied') : t('kit.handoffCopy')}
        </Button>
      </div>
      <pre className="creation-kit-handoff__code">{value || '—'}</pre>
    </li>
  )
}

function HandoffTokenBoard({
  bindingPaths,
  tokenCatalog,
  tokenPackCss,
  t,
}: {
  bindingPaths: readonly string[]
  tokenCatalog: readonly InspectTokenOption[]
  tokenPackCss: string
  t: Translator
}) {
  const [copiedCss, setCopiedCss] = useState(false)
  const [cssOpen, setCssOpen] = useState(false)
  const rows = useMemo(
    () =>
      resolveTokenBindingRows(
        bindingPaths.map((path) => ({ path })),
        tokenCatalog,
      ),
    [bindingPaths, tokenCatalog],
  )

  return (
    <div className="creation-kit-handoff__tokens" data-testid="kit-handoff-token-board">
      <div className="creation-kit-handoff__tokens-head">
        <Text role="meta" as="p" className="creation-kit-props__section">
          {t('kit.handoffTokensBoard')}
        </Text>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          data-testid="kit-handoff-token-pack-css-copy"
          disabled={!tokenPackCss}
          onClick={() => {
            void copyText(tokenPackCss).then((ok) => {
              if (!ok) return
              setCopiedCss(true)
              window.setTimeout(() => setCopiedCss(false), 1400)
            })
          }}
        >
          {copiedCss ? t('kit.handoffCopied') : t('kit.handoffCopyTokenPackCss')}
        </Button>
      </div>
      {rows.length === 0 ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-handoff-token-board-empty">
          {t('kit.handoffTokensBoardEmpty')}
        </Text>
      ) : (
        <KitTokenBindingRows rows={rows} testIdPrefix="kit-handoff-token" />
      )}
      {tokenPackCss ? (
        <div className="creation-kit-handoff__css" data-testid="kit-handoff-token-pack-css-block">
          <button
            type="button"
            className="creation-kit-handoff__css-toggle"
            data-testid="kit-handoff-token-pack-css-toggle"
            aria-expanded={cssOpen}
            onClick={() => setCssOpen((v) => !v)}
          >
            {cssOpen ? t('kit.handoffTokenPackCssHide') : t('kit.handoffTokenPackCssShow')}
          </button>
          {cssOpen ? (
            <pre className="creation-kit-handoff__code" data-testid="kit-handoff-token-pack-css">
              {tokenPackCss}
            </pre>
          ) : null}
        </div>
      ) : rows.length === 0 ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-handoff-token-pack-css-empty">
          {t('kit.handoffTokenPackCssEmpty')}
        </Text>
      ) : null}
    </div>
  )
}

/** SK-V10/V11/V16 Developer Hub handoff — consumer + maintainer + token board. */
export function KitPlaygroundHandoffPane({
  handoff,
  maintainer,
  componentId,
  kind,
  exportName,
  platformProjectId,
  tokenPackSource,
  moduleSource,
  tokenPackCss,
  bindingPaths = [],
  tokenCatalog = [],
  compositionJson,
  shareHref,
  storybookOrigin,
  t,
}: {
  handoff: PlaygroundHandoffFields | null
  maintainer: PlaygroundMaintainerFields | null
  componentId: string | null
  kind: 'atom' | 'pattern' | 'section' | null
  exportName: string | null
  platformProjectId: string | null
  tokenPackSource: 'local' | 'fixture' | null
  moduleSource: string
  tokenPackCss: string
  bindingPaths?: readonly string[]
  tokenCatalog?: readonly InspectTokenOption[]
  compositionJson: string
  shareHref: string
  storybookOrigin: string | null
  t: Translator
}) {
  const [jsonOpen, setJsonOpen] = useState(false)

  const storyLinks = useMemo(() => {
    if (!storybookOrigin || !exportName || !componentId) return null
    // Starter sections are scene Masters — no Coolify CSF story.
    if (kind === 'section') return null
    if (kind === 'pattern') {
      return {
        csf: siteKitCompositionStoryHref(storybookOrigin, exportName, 'default', {
          platformProjectId,
          storyTitle: maintainer?.storyTitle,
        }),
        live: siteKitLiveCompositionHref(storybookOrigin, componentId),
      }
    }
    const atom = SITE_KIT_CATALOG.find((e) => e.id === componentId)
    const title = atom?.title || `Site/${exportName}`
    return {
      csf: siteKitAtomStoryHref(storybookOrigin, title),
      live: null as string | null,
    }
  }, [
    storybookOrigin,
    exportName,
    componentId,
    kind,
    platformProjectId,
    maintainer?.storyTitle,
  ])

  const cdnSnippets = useMemo(() => {
    if (kind !== 'atom' || !exportName) return null
    const base = siteKitCdnUrl()
    return {
      importLine: `import { ${exportName} } from '${siteKitCdnModuleHref(base)}'`,
      cssLink: `<link rel="stylesheet" href="${siteKitCdnCssHref(base)}" />`,
      base,
    }
  }, [kind, exportName])

  if (!handoff || !componentId) {
    return (
      <div className="creation-kit-handoff" data-testid="kit-handoff-empty">
        <Text role="meta" as="p">
          {t('kit.handoffEmpty')}
        </Text>
      </div>
    )
  }

  const tokenLabel =
    tokenPackSource === 'local'
      ? t('kit.tokenPackLocal')
      : tokenPackSource === 'fixture'
        ? t('kit.tokenPackFixture')
        : t('kit.handoffTokensNone')

  const fullShare =
    typeof window !== 'undefined' ? `${window.location.origin}${shareHref}` : shareHref

  const kindLabel =
    kind === 'section'
      ? t('kit.handoffKindSection')
      : kind === 'pattern'
        ? t('kit.handoffKindPattern')
        : t('kit.handoffKindAtom')

  return (
    <div className="creation-kit-handoff" data-testid="kit-handoff-pane">
      <Text role="meta" as="p" className="creation-kit-playground__pane-label">
        {t('kit.handoffPane')}
      </Text>
      {kind === 'section' ? (
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-handoff-section-note">
          {t('kit.handoffSectionNote')}
        </Text>
      ) : null}
      <dl className="creation-kit-handoff__meta" data-testid="kit-handoff-meta">
        <div>
          <dt>{t('kit.handoffId')}</dt>
          <dd>
            <code>{componentId}</code>
          </dd>
        </div>
        <div>
          <dt>{t('kit.handoffKind')}</dt>
          <dd data-testid="kit-handoff-kind">{kindLabel}</dd>
        </div>
        <div>
          <dt>{t('kit.handoffExport')}</dt>
          <dd>
            <code>{exportName || '—'}</code>
          </dd>
        </div>
        {platformProjectId ? (
          <div>
            <dt>{t('kit.handoffCollection')}</dt>
            <dd>
              <code>{platformProjectId}</code>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{t('kit.handoffRootType')}</dt>
          <dd>
            <code>{handoff.rootType || '—'}</code>
          </dd>
        </div>
        <div>
          <dt>{t('kit.handoffTokens')}</dt>
          <dd data-testid="kit-handoff-tokens">{tokenLabel}</dd>
        </div>
        {maintainer ? (
          <>
            <div>
              <dt>{t('kit.maintainerUpdated')}</dt>
              <dd data-testid="kit-maintainer-updated">
                <code>{maintainer.updatedAt || '—'}</code>
              </dd>
            </div>
            <div>
              <dt>{t('kit.maintainerRevision')}</dt>
              <dd data-testid="kit-maintainer-revision">
                <code>{maintainer.kitRevision}</code>
              </dd>
            </div>
            <div>
              <dt>{t('kit.maintainerStoryTitle')}</dt>
              <dd>
                <code>{maintainer.storyTitle}</code>
              </dd>
            </div>
            <div>
              <dt>{t('kit.maintainerVariants')}</dt>
              <dd data-testid="kit-maintainer-variants">{maintainer.variantCount}</dd>
            </div>
            {maintainer.axisCount > 0 ? (
              <div>
                <dt>{t('kit.maintainerAxes')}</dt>
                <dd data-testid="kit-maintainer-axes">{maintainer.axisCount}</dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>
      <Text role="meta" as="p" className="creation-kit-handoff__note">
        {t('kit.handoffTokensNote')}
      </Text>
      <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-handoff-ds-tokens-note">
        {t('kit.handoffDsTokensNote')}
      </Text>
      <HandoffTokenBoard
        bindingPaths={bindingPaths}
        tokenCatalog={tokenCatalog}
        tokenPackCss={tokenPackCss}
        t={t}
      />

      <div className="creation-kit-handoff__links" data-testid="kit-maintainer-links">
        <Text role="meta" as="p" className="creation-kit-props__section">
          {t('kit.maintainerLinks')}
        </Text>
        <div className="creation-kit-handoff__link-row">
          <Link
            href={paths.routes.library}
            className="creation-kit-handoff__link"
            data-testid="kit-maintainer-library"
          >
            {t('kit.maintainerLibrary')}
          </Link>
          {storyLinks?.csf ? (
            <button
              type="button"
              className="creation-kit-handoff__link creation-kit-handoff__link-btn"
              data-testid="kit-maintainer-storybook-csf"
              onClick={() => {
                void openSiteKitStorybookHref({
                  href: storyLinks.csf,
                  platformProjectId: kind === 'pattern' ? platformProjectId : null,
                })
              }}
            >
              {t('kit.maintainerStorybookCsf')}
            </button>
          ) : (
            <span className="creation-kit-handoff__link-muted" data-testid="kit-maintainer-storybook-unset">
              {t('kit.maintainerStorybookUnset')}
            </span>
          )}
          {storyLinks?.live ? (
            <button
              type="button"
              className="creation-kit-handoff__link creation-kit-handoff__link-btn"
              data-testid="kit-maintainer-storybook-live"
              onClick={() => {
                void openSiteKitStorybookHref({
                  href: storyLinks.live!,
                  platformProjectId,
                })
              }}
            >
              {t('kit.maintainerStorybookLive')}
            </button>
          ) : null}
        </div>
        <Text role="meta" as="p" className="creation-kit-handoff__note">
          {t('kit.maintainerStorybookNote')}
        </Text>
        <Text role="meta" as="p" className="creation-kit-handoff__note" data-testid="kit-maintainer-pull-hint">
          {t('kit.maintainerPullHint')}
        </Text>
      </div>

      <ul className="creation-kit-handoff__list">
        <CopyRow
          label={t('kit.handoffInstall')}
          value={handoff.installCommand}
          testId="kit-handoff-install"
          t={t}
        />
        <CopyRow
          label={t('kit.handoffImport')}
          value={handoff.usageImport}
          testId="kit-handoff-import"
          t={t}
        />
        <CopyRow
          label={t('kit.handoffImportPath')}
          value={handoff.importPath}
          testId="kit-handoff-import-path"
          t={t}
        />
        {cdnSnippets ? (
          <>
            <CopyRow
              label={t('kit.handoffCdnImport')}
              value={cdnSnippets.importLine}
              testId="kit-handoff-cdn-import"
              t={t}
            />
            <CopyRow
              label={t('kit.handoffCdnCss')}
              value={cdnSnippets.cssLink}
              testId="kit-handoff-cdn-css"
              t={t}
            />
          </>
        ) : kind === 'pattern' ? (
          <li className="creation-kit-handoff__row" data-testid="kit-handoff-cdn-pattern-note">
            <Text role="meta" as="p" className="creation-kit-handoff__note">
              {t('kit.handoffCdnPatternNote')}
            </Text>
          </li>
        ) : null}
        <CopyRow
          label={t('kit.handoffModule')}
          value={moduleSource}
          testId="kit-handoff-module"
          t={t}
        />
        <CopyRow
          label={t('kit.handoffLink')}
          value={fullShare}
          testId="kit-handoff-link"
          t={t}
        />
      </ul>

      <KitHandoffAtomSource
        componentId={componentId}
        kind={kind}
        storybookOrigin={storybookOrigin}
        t={t}
      />

      <KitSeedDiffPanel
        componentId={componentId}
        modifiedSource={moduleSource}
        t={t}
      />

      <div className="creation-kit-handoff__contract" data-testid="kit-handoff-contract">
        <Text role="meta" as="p" className="creation-kit-props__section">
          {t('kit.handoffAllowedProps')}
        </Text>
        {handoff.allowedProps.length ? (
          <p className="creation-kit-handoff__props">
            {handoff.allowedProps.map((p) => (
              <code key={p}>{p}</code>
            ))}
          </p>
        ) : (
          <Text role="meta" as="p">
            {t('kit.handoffAllowedPropsNone')}
          </Text>
        )}
        <Text role="meta" as="p" className="creation-kit-handoff__note">
          {t('kit.handoffPaintNote')}
        </Text>
      </div>

      <div className="creation-kit-handoff__json" data-testid="kit-maintainer-json">
        <button
          type="button"
          className="creation-kit-sandbox-toggle"
          data-testid="kit-maintainer-json-toggle"
          onClick={() => setJsonOpen((v) => !v)}
        >
          {jsonOpen ? t('kit.maintainerJsonHide') : t('kit.maintainerJsonShow')}
        </button>
        {jsonOpen ? (
          <CopyRow
            label={t('kit.maintainerJson')}
            value={compositionJson}
            testId="kit-maintainer-json-body"
            t={t}
          />
        ) : null}
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { Button, Dialog } from '@zaoly/ui'
import {
  DEFAULT_REACT_EXPORT_CONSUMER,
  generateReactComponent,
  type ReactExportConsumer,
} from '../lib/codegen/codegen-react'
import { assessExportReady } from '../lib/codegen/export-ready'
import {
  tokenPackCssForExportTarget,
  buildExportCopyPack,
} from '../lib/codegen/export-copy-pack'
import {
  buildExportIntent,
  formatExportIntentMarkdown,
} from '../lib/codegen/export-intent'
import {
  buildStoryblokHandoffPack,
  buildStoryblokHandoffPackForPages,
} from '../lib/codegen/storyblok-handoff'
import { paths } from '../lib/paths'
import { generateSwiftUiComponent } from '../lib/codegen/codegen-swiftui'
import { generateTailwindHtml } from '../lib/codegen/codegen-tailwind'
import { resolveScenePreviewHtmlForPage } from '../lib/scene/scene-preview-html-page'
import { materializeScenePages } from '../lib/scene/scene-pages'
import { normalizeCompositionName } from '../lib/site-kit/composition-write-validation'
import { resolveKitExploreFromExport } from '../lib/site-kit/kit-explore-from-export'
import type { InspectTokenOption, ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import {
  configurePlaygroundMonaco,
  PLAYGROUND_MONACO_OPTIONS,
} from '../lib/site-kit/playground-monaco'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <pre data-testid="exported-code-loading" style={{ margin: 0, padding: 16 }}>
      Loading…
    </pre>
  ),
})

const EXPORT_MONACO_OPTIONS = {
  ...PLAYGROUND_MONACO_OPTIONS,
  readOnly: true,
  domReadOnly: true,
  formatOnPaste: false,
  wordWrap: 'on' as const,
}

type CodeExportFormat = 'react' | 'tailwind' | 'swiftui' | 'html' | 'json'
type CodeExportScope = 'page' | 'selection' | 'all-pages'

interface EditorCodeExportDialogProps {
  open: boolean
  onClose: () => void
  scene: CompositionScene
  activePageId?: string
  selectedNodeId?: string | null
  /** Jump to a ready-gate blocker on canvas (select + open linter). Spec: code-export-handoff.md */
  onJumpToIssue?: (nodeId: string) => void
  /** Token pack / fixture catalog for Copy pack token pack CSS. */
  tokenCatalog?: InspectTokenOption[]
  /** Merged pack leaves for media.breakpoint.* handoff (cleanup W1). */
  packLeaves?: ZaolyPackLeaf[] | null
  /** Active editor breakpoint for Intent. */
  activeBreakpoint?: string
  /** Site Kit Storybook origin for Intent Storybook link. */
  siteKitStorybookUrl?: string | null
}

function findNodeById(root: SceneNode, id: string): SceneNode | null {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

function pageExportName(pageName: string, fallback: string): string {
  const normalized = normalizeCompositionName(pageName || fallback)
  if (normalized) return normalized
  const safe = (pageName || fallback).replace(/[^a-zA-Z0-9]+/g, '') || 'Page'
  return safe.charAt(0).toUpperCase() + safe.slice(1)
}

function generateForNode(
  format: CodeExportFormat,
  node: SceneNode,
  componentName: string,
  scene: CompositionScene,
  pageId?: string,
  reactConsumer: ReactExportConsumer = DEFAULT_REACT_EXPORT_CONSUMER,
): string {
  if (format === 'react') {
    return generateReactComponent(node, componentName, {
      consumer: reactConsumer,
      masters: scene.masters,
    })
  }
  if (format === 'swiftui') {
    return generateSwiftUiComponent(node, componentName)
  }
  if (format === 'tailwind') {
    return generateTailwindHtml(node)
  }
  if (format === 'html') {
    const res = resolveScenePreviewHtmlForPage(scene, {
      pageId,
      source: 'scene',
    })
    if (res.ok) return res.html
    return `<!DOCTYPE html>\n<html>\n<head><title>${componentName}</title></head>\n<body>\n  <div id="root">\n    <!-- Exported from CREATION v3 -->\n  </div>\n</body>\n</html>`
  }
  if (format === 'json') {
    return JSON.stringify(node, null, 2)
  }
  return ''
}

function generateAllPages(
  format: CodeExportFormat,
  scene: CompositionScene,
  reactConsumer: ReactExportConsumer = DEFAULT_REACT_EXPORT_CONSUMER,
): string {
  const pages = materializeScenePages(scene).pages ?? []
  if (!pages.length) return '// No pages'

  if (format === 'json') {
    return JSON.stringify(
      pages.map((p) => ({ id: p.id, name: p.name, root: p.root })),
      null,
      2,
    )
  }

  const sections = pages.map((page, index) => {
    const name = pageExportName(page.name, `Page${index + 1}`)
    const body = generateForNode(format, page.root, name, scene, page.id, reactConsumer)
    if (format === 'react') {
      return body
    }
    return [
      `/* ===== ${page.name || name} (${page.id}) ===== */`,
      body,
    ].join('\n')
  })

  if (format === 'react') {
    const names = pages.map((page, index) =>
      pageExportName(page.name, `Page${index + 1}`),
    )
    const indexStub = [
      '',
      '// Optional index stub',
      `export const pages = {`,
      ...names.map((n) => `  ${n},`),
      `}`,
    ].join('\n')
    return `${sections.join('\n\n')}${indexStub}`
  }

  return sections.join('\n\n')
}

function monacoLanguageForFormat(format: CodeExportFormat): string {
  if (format === 'react') return 'typescript'
  if (format === 'json') return 'json'
  if (format === 'html' || format === 'tailwind') return 'html'
  return 'plaintext'
}

export function EditorCodeExportDialog({
  open,
  onClose,
  scene,
  activePageId,
  selectedNodeId,
  onJumpToIssue,
  tokenCatalog,
  packLeaves,
  activeBreakpoint,
  siteKitStorybookUrl,
}: EditorCodeExportDialogProps) {
  const [format, setFormat] = useState<CodeExportFormat>('react')
  const [scope, setScope] = useState<CodeExportScope>(selectedNodeId ? 'selection' : 'page')
  const [copied, setCopied] = useState(false)
  const [copiedPack, setCopiedPack] = useState(false)
  const [copiedStoryblok, setCopiedStoryblok] = useState(false)
  const [storyblokBusy, setStoryblokBusy] = useState(false)
  const [storyblokError, setStoryblokError] = useState<string | null>(null)
  const [storyblokAppUrl, setStoryblokAppUrl] = useState<string | null>(null)
  /** null = unknown, false = hide PoC on hosts without STORYBLOK_* (e.g. zaoly.app). */
  const [storyblokConfigured, setStoryblokConfigured] = useState<boolean | null>(null)
  const [reactConsumer, setReactConsumer] = useState<ReactExportConsumer>(
    DEFAULT_REACT_EXPORT_CONSUMER,
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(paths.routes.apiStoryblokPush, { method: 'GET' })
        const data = (await res.json().catch(() => ({}))) as { configured?: unknown }
        if (!cancelled) setStoryblokConfigured(res.ok && data.configured === true)
      } catch {
        if (!cancelled) setStoryblokConfigured(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const pageRoot = useMemo(() => {
    if (scene.pages && scene.pages.length > 0) {
      const activePage = scene.pages.find((p) => p.id === activePageId) || scene.pages[0]
      return activePage.root
    }
    return scene.root
  }, [scene, activePageId])

  const targetNode = useMemo(() => {
    if (scope === 'selection' && selectedNodeId) {
      const found = findNodeById(pageRoot, selectedNodeId)
      if (found) return found
    }
    return pageRoot
  }, [pageRoot, scope, selectedNodeId])

  const kitExplore = useMemo(
    () => resolveKitExploreFromExport(scene, targetNode),
    [scene, targetNode],
  )

  const readyReport = useMemo(() => {
    if (scope === 'all-pages') {
      const pages = materializeScenePages(scene).pages ?? []
      const merged = pages.flatMap((p) => assessExportReady(p.root).blockers)
      const seen = new Set<string>()
      const blockers = merged.filter((b) => {
        if (seen.has(b.id)) return false
        seen.add(b.id)
        return true
      })
      return { ready: blockers.length === 0, blockers, other: [] as const }
    }
    return assessExportReady(targetNode)
  }, [scope, scene, targetNode])

  const generatedCode = useMemo(() => {
    if (scope === 'all-pages') {
      return generateAllPages(format, scene, reactConsumer)
    }
    if (!targetNode) return '// No component selected'
    if (format === 'json' && scope === 'page') {
      return JSON.stringify(scene, null, 2)
    }
    return generateForNode(
      format,
      targetNode,
      targetNode.name || 'Component',
      scene,
      activePageId,
      reactConsumer,
    )
  }, [targetNode, format, scene, activePageId, scope, reactConsumer])

  const tokenPackCss = useMemo(() => {
    if (format !== 'react') return ''
    if (scope === 'all-pages') {
      const pages = materializeScenePages(scene).pages ?? []
      const chunks = pages
        .map((p) => tokenPackCssForExportTarget(p.root, tokenCatalog, scene.masters))
        .filter(Boolean)
      return chunks.join('\n')
    }
    return tokenPackCssForExportTarget(targetNode, tokenCatalog, scene.masters)
  }, [format, scope, scene, targetNode, tokenCatalog])

  const exportIntent = useMemo(
    () =>
      buildExportIntent({
        scene,
        target: scope === 'all-pages' ? null : targetNode,
        scope,
        format,
        consumer: reactConsumer,
        activePageId,
        breakpoint: activeBreakpoint,
        kitExplore,
        ready: readyReport.ready,
        blockers: readyReport.blockers,
        storybookOrigin: siteKitStorybookUrl,
      }),
    [
      scene,
      targetNode,
      scope,
      format,
      reactConsumer,
      activePageId,
      activeBreakpoint,
      kitExplore,
      readyReport.ready,
      readyReport.blockers,
      siteKitStorybookUrl,
    ],
  )

  const intentMarkdown = useMemo(
    () => formatExportIntentMarkdown(exportIntent),
    [exportIntent],
  )

  const buildStoryblokPack = () => {
    if (!storyblokConfigured) return null
    if (scope === 'all-pages') {
      const pages = materializeScenePages(scene).pages ?? []
      return buildStoryblokHandoffPackForPages({
        pages: pages.map((p) => ({ id: p.id, name: p.name, root: p.root })),
        scene,
        masters: scene.masters,
      })
    }
    return buildStoryblokHandoffPack({
      target: targetNode,
      scene,
      storyName: targetNode.name || scene.name,
      masters: scene.masters,
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyPack = async () => {
    try {
      const pack = buildExportCopyPack({
        moduleSource: generatedCode,
        kitHref: kitExplore.href,
        consumer: reactConsumer,
        tokenPackCss,
        packLeaves,
        intentMarkdown,
      })
      await navigator.clipboard.writeText(pack)
      setCopiedPack(true)
      setTimeout(() => setCopiedPack(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyStoryblok = async () => {
    if (!storyblokConfigured) return
    const pack = buildStoryblokPack()
    if (!pack) return
    setStoryblokBusy(true)
    setStoryblokError(null)
    setStoryblokAppUrl(null)

    try {
      const res = await fetch(paths.routes.apiStoryblokPush, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        code?: string
        appUrl?: string
        storySlug?: string
        missing?: string[]
      }
      if (!res.ok || !data.ok) {
        const missing =
          Array.isArray(data.missing) && data.missing.length
            ? ` (missing ${data.missing.join(', ')})`
            : ''
        throw new Error((data.error || `HTTP ${res.status}`) + missing)
      }
      if (data.appUrl) {
        setStoryblokAppUrl(data.appUrl)
        window.open(data.appUrl, '_blank', 'noopener,noreferrer')
      }
      setCopiedStoryblok(true)
      setTimeout(() => setCopiedStoryblok(false), 2500)
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Storyblok push failed'
      setStoryblokError(
        raw.length > 240 ||
        raw.includes('zaoly-storyblok-poc') ||
        raw.includes('zaoly-storyblok-poc')
          ? 'Storyblok push failed'
          : raw,
      )
    } finally {
      setStoryblokBusy(false)
    }
  }

  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export Code (Developer Handoff)"
      className="creation-editor-code-export-dialog"
      data-testid="editor-code-export-dialog"
      data-resizable="true"
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href={kitExplore.href}
            onClick={onClose}
            data-testid="export-explore-in-kit"
            title={
              kitExplore.componentId
                ? `Open ${kitExplore.componentId} in Kit Playground`
                : 'Open Kit Playground'
            }
          >
            <Button type="button" size="sm" variant="subtle">
              Explore in Kit
            </Button>
          </Link>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleCopy}
            data-testid="export-copy-btn"
          >
            {copied
              ? '✓ Copied!'
              : readyReport.ready || format !== 'react'
                ? 'Copy Code'
                : 'Copy anyway'}
          </Button>
          {format === 'react' ? (
            <Button
              type="button"
              size="sm"
              variant="subtle"
              onClick={handleCopyPack}
              data-testid="export-copy-pack-btn"
              title="Kit link + install + import + Token pack CSS + module"
            >
              {copiedPack ? '✓ Pack copied!' : 'Copy pack'}
            </Button>
          ) : null}
          {storyblokConfigured ? (
            <Button
              type="button"
              size="sm"
              variant="subtle"
              onClick={handleCopyStoryblok}
              disabled={storyblokBusy}
              data-testid="export-copy-storyblok-btn"
              title="Push page to Storyblok Space (CMS — not Storybook)"
            >
              {storyblokBusy
                ? 'Sending…'
                : copiedStoryblok
                  ? '✓ Sent to Storyblok!'
                  : 'Send to Storyblok'}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="creation-editor-code-export-dialog__body">
        {storyblokConfigured && storyblokError ? (
          <p
            data-testid="export-storyblok-error"
            style={{ color: '#f87171', fontSize: 12, margin: '0 0 8px' }}
          >
            Storyblok: {storyblokError}
          </p>
        ) : null}
        {storyblokConfigured && storyblokAppUrl ? (
          <p data-testid="export-storyblok-link" style={{ fontSize: 12, margin: '0 0 8px' }}>
            <a href={storyblokAppUrl} target="_blank" rel="noopener noreferrer">
              Open in Storyblok
            </a>
          </p>
        ) : null}
        <div className="creation-editor-code-export-dialog__toolbar">
          <div style={{ display: 'inline-flex', background: '#27272a', padding: '3px', borderRadius: '8px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setFormat('react')}
              style={{
                background: format === 'react' ? '#3f3f46' : 'transparent',
                color: format === 'react' ? '#fff' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="tab-export-react"
            >
              React 19 JSX
            </button>
            <button
              type="button"
              onClick={() => setFormat('tailwind')}
              style={{
                background: format === 'tailwind' ? '#3f3f46' : 'transparent',
                color: format === 'tailwind' ? '#fff' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="tab-export-tailwind"
            >
              Tailwind CSS
            </button>
            <button
              type="button"
              onClick={() => setFormat('swiftui')}
              style={{
                background: format === 'swiftui' ? '#3f3f46' : 'transparent',
                color: format === 'swiftui' ? '#fff' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="tab-export-swiftui"
            >
              SwiftUI View
            </button>
            <button
              type="button"
              onClick={() => setFormat('html')}
              style={{
                background: format === 'html' ? '#3f3f46' : 'transparent',
                color: format === 'html' ? '#fff' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="tab-export-html"
            >
              HTML5 Page
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              style={{
                background: format === 'json' ? '#3f3f46' : 'transparent',
                color: format === 'json' ? '#fff' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="tab-export-json"
            >
              Scene JSON
            </button>
          </div>

          <div
            style={{ display: 'inline-flex', background: '#18181b', border: '1px solid #27272a', borderRadius: '6px', padding: '2px' }}
            data-testid="export-scope-selector"
          >
            <button
              type="button"
              onClick={() => setScope('page')}
              style={{
                background: scope === 'page' ? '#27272a' : 'transparent',
                color: scope === 'page' ? '#fff' : '#71717a',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid="export-scope-page"
            >
              Entire Page
            </button>
            <button
              type="button"
              onClick={() => setScope('all-pages')}
              style={{
                background: scope === 'all-pages' ? '#27272a' : 'transparent',
                color: scope === 'all-pages' ? '#fff' : '#71717a',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid="export-scope-all-pages"
            >
              All Pages
            </button>
            <button
              type="button"
              onClick={() => setScope('selection')}
              disabled={!selectedNodeId}
              style={{
                background: scope === 'selection' ? '#27272a' : 'transparent',
                color: !selectedNodeId ? '#3f3f46' : scope === 'selection' ? '#fff' : '#71717a',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: selectedNodeId ? 'pointer' : 'not-allowed',
              }}
              data-testid="export-scope-selection"
            >
              Selected Node {selectedNodeId ? `(${targetNode.name || targetNode.type})` : ''}
            </button>
          </div>
        </div>

        {format === 'react' ? (
          <div
            className="creation-editor-code-export-dialog__consumer"
            data-testid="export-react-consumer"
            role="group"
            aria-label="React consumer"
          >
            <button
              type="button"
              data-testid="export-react-consumer-site-kit"
              onClick={() => setReactConsumer('site-kit')}
              className={
                reactConsumer === 'site-kit'
                  ? 'creation-editor-code-export-dialog__consumer-btn is-active'
                  : 'creation-editor-code-export-dialog__consumer-btn'
              }
            >
              Site Kit + tokens
            </button>
            <button
              type="button"
              data-testid="export-react-consumer-zaoly-ui"
              onClick={() => setReactConsumer('zaoly-ui')}
              className={
                reactConsumer === 'zaoly-ui'
                  ? 'creation-editor-code-export-dialog__consumer-btn is-active'
                  : 'creation-editor-code-export-dialog__consumer-btn'
              }
            >
              App DS (@zaoly/ui)
            </button>
          </div>
        ) : null}

        {format === 'react' ? (
          <div
            data-testid="export-ready-banner"
            data-ready={readyReport.ready ? 'true' : 'false'}
            className={
              readyReport.ready
                ? 'creation-editor-code-export-dialog__ready is-ready'
                : 'creation-editor-code-export-dialog__ready is-blocked'
            }
          >
            {readyReport.ready ? (
              <span>Ready for eng — no blocking a11y/token issues on this target.</span>
            ) : (
              <div>
                <strong>
                  Not ready for eng — {readyReport.blockers.length} blocker
                  {readyReport.blockers.length === 1 ? '' : 's'}
                </strong>
                <ul className="creation-editor-code-export-dialog__ready-list">
                  {readyReport.blockers.slice(0, 6).map((issue) => (
                    <li key={issue.id}>
                      {onJumpToIssue ? (
                        <button
                          type="button"
                          data-testid="export-ready-blocker"
                          data-node-id={issue.nodeId}
                          data-code={issue.code}
                          className="creation-editor-code-export-dialog__ready-issue"
                          onClick={() => {
                            onJumpToIssue(issue.nodeId)
                            onClose()
                          }}
                        >
                          <code>{issue.code}</code> · {issue.nodeName || issue.nodeId}:{' '}
                          {issue.message}
                        </button>
                      ) : (
                        <span>
                          <code>{issue.code}</code> · {issue.nodeName || issue.nodeId}:{' '}
                          {issue.message}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <div
          className="creation-editor-code-export-dialog__intent"
          data-testid="export-intent"
          data-ready={exportIntent.ready ? 'true' : 'false'}
        >
          <div className="creation-editor-code-export-dialog__intent-head">Intent</div>
          <dl className="creation-editor-code-export-dialog__intent-grid">
            <div>
              <dt>Scope</dt>
              <dd>{exportIntent.scope}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>
                {exportIntent.targetName}
                <span className="creation-editor-code-export-dialog__intent-muted">
                  {' '}
                  · {exportIntent.targetType}
                </span>
              </dd>
            </div>
            <div>
              <dt>Collection</dt>
              <dd>{exportIntent.collectionId ?? 'unbound'}</dd>
            </div>
            <div>
              <dt>Breakpoint</dt>
              <dd>{exportIntent.breakpoint}</dd>
            </div>
            <div>
              <dt>Consumer</dt>
              <dd>{exportIntent.consumer}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{exportIntent.ready ? 'yes' : `no (${exportIntent.gapCodes.join(', ') || 'gaps'})`}</dd>
            </div>
            <div className="creation-editor-code-export-dialog__intent-wide">
              <dt>Kit</dt>
              <dd>
                <a href={exportIntent.kitHref} data-testid="export-intent-kit-link">
                  {exportIntent.kitComponentId || exportIntent.kitHref}
                </a>
              </dd>
            </div>
            {exportIntent.masterId ? (
              <div>
                <dt>Master</dt>
                <dd>
                  {exportIntent.masterName || exportIntent.masterId}
                </dd>
              </div>
            ) : null}
            {exportIntent.storybookHref ? (
              <div className="creation-editor-code-export-dialog__intent-wide">
                <dt>Storybook</dt>
                <dd>
                  <a
                    href={exportIntent.storybookHref}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="export-intent-storybook-link"
                  >
                    Open CSF / Live
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="creation-editor-code-export-dialog__preview">
          <div className="creation-editor-code-export-dialog__meta">
            <span>
              {scope === 'all-pages'
                ? 'Target: all pages'
                : `Target: <${targetNode.name || targetNode.type} />`}
            </span>
            <span>{generatedCode.split('\n').length} lines</span>
          </div>
          <div data-testid="exported-code-block" className="creation-editor-code-export-dialog__monaco">
            <pre data-testid="exported-code-source" hidden>
              {generatedCode}
            </pre>
            <MonacoEditor
              height="100%"
              language={monacoLanguageForFormat(format)}
              theme="vs-dark"
              value={generatedCode}
              path={`export.${format === 'react' ? 'tsx' : format === 'json' ? 'json' : format === 'swiftui' ? 'swift' : 'html'}`}
              beforeMount={configurePlaygroundMonaco}
              options={EXPORT_MONACO_OPTIONS}
            />
          </div>
        </div>
      </div>
    </Dialog>
  )
}

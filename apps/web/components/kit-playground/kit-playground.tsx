'use client'

import dynamic from 'next/dynamic'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { CompositionPreview, type SiteKitCompositionNode } from '@zaoly/site-kit'
import type { ProjectSummary } from '@zaoly/contracts'
import { Badge, Button, Hint, Panel, Text } from '@zaoly/ui'
import { resolveThemeId } from '../../lib/zaoly-ui'
import { KitPlaygroundNav, type KitPlaygroundSelection } from './kit-playground-nav'
import { KitPlaygroundCopyLink, KitPlaygroundPropsPane } from './kit-playground-props'
import { KitPlaygroundHandoffPane } from './kit-playground-handoff'
import { EditorTokenStudio } from '../editor-token-studio'
import { editorHref } from '../../lib/editor-launch'
import { paths, kitPlaygroundHref } from '../../lib/paths'
import { isRealPlatformProjectId } from '../../lib/platform-project-id'
import { kitInsertTypeFromSelection } from '../../lib/site-kit/kit-insert-type'
import { kitPlaygroundKind } from '../../lib/site-kit/kit-playground-kind'
import { isCompositionOverrideId } from '../../lib/site-kit/override-ids'
import {
  applyEditorPreviewSplit,
  applySidebarResize,
  clampKitColumnLayout,
  kitColumnCssVars,
  KIT_COLUMN_DEFAULTS,
  readKitColumnLayout,
  writeKitColumnLayout,
  type KitColumnLayout,
} from '../../lib/site-kit/kit-playground-columns'
import { parsePlaygroundTsxToComposition } from '../../lib/site-kit/playground-parse'
import { paintPlaygroundComposition } from '../../lib/site-kit/playground-paint'
import {
  clearPlaygroundDraft,
  clearNodeTokenBinding,
  ensureNodeStyleSlot,
  readPlaygroundDraft,
  regeneratePlaygroundSource,
  setNodeProp,
  setNodeStyle,
  setNodeStyleLiteralClearingBinding,
  setNodeTokenBinding,
  writePlaygroundDraft,
} from '../../lib/site-kit/playground-draft'
import {
  collectCompositionBindingPaths,
  starterPackThemeFromResolvedId,
  tokenPackCssForHandoff,
} from '../../lib/site-kit/zaoly-pack-ds-css'
import {
  configurePlaygroundMonaco,
  PLAYGROUND_MONACO_OPTIONS,
} from '../../lib/site-kit/playground-monaco'
import type { PlaygroundHandoffFields, PlaygroundMaintainerFields } from '../../lib/site-kit/playground-source'
import { buildPlaygroundHandoff, buildPlaygroundMaintainer } from '../../lib/site-kit/playground-source'
import { siteKitStorybookUrl } from '../../lib/runtime-config'
import {
  playgroundSandboxSrcdoc,
  transpilePlaygroundTsx,
} from '../../lib/site-kit/playground-transpile'
import { SITE_KIT_CATALOG } from '../../lib/site-kit/site-kit-catalog'
import {
  INSPECT_TOKEN_CATALOG,
  editorPackFromLocalApi,
  mergeLivePackIntoCatalog,
  type BrandTokenPackResponse,
  type InspectTokenOption,
  type ZaolyPackLeaf,
} from '../../lib/inspect/token-catalog'
import {
  SCENE_PREVIEW_VIEWPORTS,
  type ScenePreviewBreakpoint,
} from '../../lib/scene/scene-preview-breakpoints'
import { useUserPrefs } from '../../lib/user-prefs'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="creation-kit-monaco-loading" data-testid="kit-monaco-loading">
      Loading editor…
    </div>
  ),
})

type CompositionEntry = {
  name: string
  exportName: string
  componentId: string
  platformProjectId?: string | null
}

type SourceResponse = {
  ok?: boolean
  componentId?: string
  source?: string
  composition?: SiteKitCompositionNode
  exportName?: string
  kind?: 'atom' | 'pattern'
  platformProjectId?: string | null
  packageName?: string
  importPath?: string
  installCommand?: string
  usageImport?: string
  allowedProps?: string[]
  rootType?: string | null
  updatedAt?: string | null
  kitRevision?: string
  storyTitle?: string
  variantCount?: number
  defaultVariantId?: string | null
  axisCount?: number
  error?: string
}

const DEBOUNCE_MS = 280
const VIEWPORTS: ScenePreviewBreakpoint[] = ['desktop', 'tablet', 'mobile']

/**
 * Kit Playground / Developer Hub — ephemeral TSX + live preview + handoff.
 * Spec: `specs/domain/site-kit-playground.md` (SK-V10)
 */
export function KitPlayground({
  projects: _projects = [],
  initialComponentId = null,
  initialPlatformProjectId = null,
  inAppEditor = true,
}: {
  /** Reserved — Collection picker deferred (SK-V23). */
  projects?: ProjectSummary[]
  initialComponentId?: string | null
  initialPlatformProjectId?: string | null
  inAppEditor?: boolean
}) {
  const { t, theme } = useUserPrefs()
  void _projects
  // SK-V23: no Collection picker — only honor an explicit deep-link platformProjectId.
  const [collectionId] = useState(
    () =>
      (initialPlatformProjectId && isRealPlatformProjectId(initialPlatformProjectId)
        ? initialPlatformProjectId
        : '') ?? '',
  )
  const [patterns, setPatterns] = useState<CompositionEntry[]>([])
  const [selection, setSelection] = useState<KitPlaygroundSelection | null>(null)
  const [exportName, setExportName] = useState('Component')
  const [seedSource, setSeedSource] = useState('')
  const [source, setSource] = useState('')
  const [composition, setComposition] = useState<SiteKitCompositionNode | null>(null)
  const [seedComposition, setSeedComposition] = useState<SiteKitCompositionNode | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [transpileError, setTranspileError] = useState<string | null>(null)
  const [sandboxHtml, setSandboxHtml] = useState(() =>
    playgroundSandboxSrcdoc({ ok: true, message: 'Select a component' }),
  )
  const [loadingSource, setLoadingSource] = useState(false)
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [tokenCatalog, setTokenCatalog] = useState<InspectTokenOption[]>(INSPECT_TOKEN_CATALOG)
  const [brandPack, setBrandPack] = useState<BrandTokenPackResponse | null>(null)
  const [packSource, setPackSource] = useState<'local' | 'fixture' | null>(null)
  const [viewport, setViewport] = useState<ScenePreviewBreakpoint>('desktop')
  const [handoff, setHandoff] = useState<PlaygroundHandoffFields | null>(null)
  const [maintainer, setMaintainer] = useState<PlaygroundMaintainerFields | null>(null)
  const [detailTab, setDetailTab] = useState<'props' | 'tokens' | 'handoff'>('handoff')
  const [selectedPath, setSelectedPath] = useState<number[]>([])
  const [seedPlatformProjectId, setSeedPlatformProjectId] = useState<string | null>(null)
  const [columnLayout, setColumnLayout] = useState<KitColumnLayout>(KIT_COLUMN_DEFAULTS)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const resizeSessionRef = useRef<{
    kind: 'sidebar' | 'split'
    pointerId: number
    startX: number
    origin: KitColumnLayout
  } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bootstrapped = useRef(false)
  const tokenCatalogRef = useRef(tokenCatalog)
  tokenCatalogRef.current = tokenCatalog

  const dirty = source !== seedSource
  const insertType = kitInsertTypeFromSelection(selection)
  const shareHref = kitPlaygroundHref({
    componentId: selection?.componentId ?? null,
    platformProjectId: collectionId || null,
  })
  const frameWidth = SCENE_PREVIEW_VIEWPORTS[viewport].width
  const storybookOrigin = siteKitStorybookUrl()
  const compositionJson = useMemo(
    () => (composition ? JSON.stringify(composition, null, 2) : ''),
    [composition],
  )
  /** SK-V13: Handoff Copy module from composition (keeps tokenBindings → --ds-*), not raw Monaco edits. */
  const handoffModuleSource = useMemo(() => {
    if (!composition || !exportName) return source
    return regeneratePlaygroundSource(exportName, composition)
  }, [composition, exportName, source])
  const tokenPackCss = useMemo(
    () =>
      tokenPackCssForHandoff(tokenCatalog, composition, {
        theme: starterPackThemeFromResolvedId(resolveThemeId(theme)),
      }),
    [tokenCatalog, composition, theme],
  )
  const bindingPaths = useMemo(
    () => collectCompositionBindingPaths(composition),
    [composition],
  )

  useEffect(() => {
    const body = bodyRef.current
    const width = body?.getBoundingClientRect().width
    setColumnLayout(readKitColumnLayout(width))
  }, [])

  useEffect(() => {
    const body = bodyRef.current
    if (!body || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (!width || width <= 0) return
      setColumnLayout((prev) => clampKitColumnLayout(prev, width))
    })
    ro.observe(body)
    return () => ro.disconnect()
  }, [])

  const onColumnResizePointerDown = useCallback(
    (kind: 'sidebar' | 'split') => (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* jsdom */
      }
      resizeSessionRef.current = {
        kind,
        pointerId: event.pointerId,
        startX: event.clientX,
        origin: columnLayout,
      }
    },
    [columnLayout],
  )

  const onColumnResizePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = resizeSessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    const body = bodyRef.current
    if (!body) return
    const width = body.getBoundingClientRect().width
    const next =
      session.kind === 'sidebar'
        ? applySidebarResize(session.origin, event.clientX - session.startX, width)
        : applyEditorPreviewSplit(
            session.origin,
            event.clientX - body.getBoundingClientRect().left,
            width,
          )
    setColumnLayout(next)
  }, [])

  const onColumnResizePointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = resizeSessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    resizeSessionRef.current = null
    const width = bodyRef.current?.getBoundingClientRect().width
    setColumnLayout((current) => {
      const next = clampKitColumnLayout(current, width)
      writeKitColumnLayout(next, width)
      return next
    })
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* jsdom */
    }
  }, [])

  const onTokenSaved = useCallback((token: ZaolyPackLeaf) => {
    setBrandPack((prev) => {
      const base = prev ?? editorPackFromLocalApi({ tokens: [], canWrite: true })
      const nextTokens = [...base.tokens]
      const idx = nextTokens.findIndex((t) => t.path === token.path)
      if (idx >= 0) nextTokens[idx] = token
      else nextTokens.push(token)
      const next = { ...base, tokens: nextTokens }
      setTokenCatalog(mergeLivePackIntoCatalog(next.tokens))
      return next
    })
    setPackSource('local')
  }, [])

  const paintNode = useCallback(
    (node: SiteKitCompositionNode | null) => {
      if (!node) return null
      return paintPlaygroundComposition(node, {
        tokenCatalog: tokenCatalogRef.current,
        breakpoint: viewport,
      })
    },
    [viewport],
  )

  useEffect(() => {
    if (!collectionId || !isRealPlatformProjectId(collectionId)) {
      setPatterns([])
      return
    }
    const url = `${paths.routes.apiSiteKitCompositions}?platformProjectId=${encodeURIComponent(collectionId)}`
    void fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          setPatterns([])
          return
        }
        const body = (await r.json()) as { compositions?: CompositionEntry[] }
        setPatterns(body.compositions ?? [])
      })
      .catch(() => setPatterns([]))
  }, [collectionId])

  useEffect(() => {
    let cancelled = false
    void fetch(paths.routes.apiTokens, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as {
          tokens?: ZaolyPackLeaf[]
          origins?: Record<string, string>
          canWrite?: boolean
        }
      })
      .then((body) => {
        if (cancelled) return
        const pack = editorPackFromLocalApi(body ?? {})
        setPackSource(pack.tokens.length ? 'local' : 'fixture')
        setBrandPack(pack)
        setTokenCatalog(
          pack.tokens.length ? mergeLivePackIntoCatalog(pack.tokens) : INSPECT_TOKEN_CATALOG,
        )
      })
      .catch(() => {
        if (!cancelled) {
          setPackSource('fixture')
          setBrandPack(null)
          setTokenCatalog(INSPECT_TOKEN_CATALOG)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setComposition((prev) =>
      prev
        ? paintPlaygroundComposition(prev, { tokenCatalog, breakpoint: viewport })
        : prev,
    )
    setSeedComposition((prev) =>
      prev
        ? paintPlaygroundComposition(prev, { tokenCatalog, breakpoint: viewport })
        : prev,
    )
  }, [tokenCatalog, viewport])

  const applySourceSideEffects = useCallback(
    (value: string, opts?: { persistDraft?: boolean; componentId?: string }) => {
      const tr = transpilePlaygroundTsx(value)
      if (!tr.ok) {
        setTranspileError(tr.error)
        setSandboxHtml(playgroundSandboxSrcdoc({ ok: false, message: tr.error }))
      } else {
        setTranspileError(null)
        setSandboxHtml(
          playgroundSandboxSrcdoc({
            ok: true,
            message: t('kit.sandboxOk'),
            codePreview: tr.code,
          }),
        )
      }
      const parsed = parsePlaygroundTsxToComposition(value)
      if (parsed.ok) {
        setParseError(null)
        setComposition(
          paintPlaygroundComposition(parsed.composition, {
            tokenCatalog: tokenCatalogRef.current,
            breakpoint: viewport,
          }),
        )
      } else {
        setParseError(parsed.error)
      }
      const id = opts?.componentId ?? selection?.componentId
      if (opts?.persistDraft && id) writePlaygroundDraft(id, value)
    },
    [selection?.componentId, t, viewport],
  )

  const loadSource = useCallback(
    async (componentId: string, labelHint?: string) => {
      setLoadingSource(true)
      setStatus(null)
      setParseError(null)
      setTranspileError(null)
      try {
        const q = new URLSearchParams({ [paths.kitComponentQueryParam]: componentId })
        if (collectionId && isRealPlatformProjectId(collectionId)) {
          q.set(paths.activePackQueryKey, collectionId)
        }
        const res = await fetch(`${paths.routes.apiSiteKitPlaygroundSource}?${q.toString()}`)
        const body = (await res.json()) as SourceResponse
        if (!res.ok || !body.source || !body.composition) {
          setStatus(body.error || t('kit.sourceFailed'))
          setSeedSource('')
          setSource('')
          setComposition(null)
          setSeedComposition(null)
          setHandoff(null)
          setMaintainer(null)
          setSeedPlatformProjectId(null)
          return
        }
        const name =
          body.exportName ||
          labelHint ||
          SITE_KIT_CATALOG.find((e) => e.id === componentId)?.exportName ||
          'Component'
        setExportName(name)
        const kind: 'atom' | 'pattern' | 'section' =
          body.kind ?? kitPlaygroundKind(componentId)
        const boundPid =
          (body.platformProjectId && isRealPlatformProjectId(body.platformProjectId)
            ? body.platformProjectId
            : null) ||
          (collectionId && isRealPlatformProjectId(collectionId) ? collectionId : null)
        setSeedPlatformProjectId(boundPid)
        const nextHandoff: PlaygroundHandoffFields =
          body.packageName && body.importPath && body.installCommand && body.usageImport
            ? {
                packageName: body.packageName,
                importPath: body.importPath,
                installCommand: body.installCommand,
                usageImport: body.usageImport,
                allowedProps: body.allowedProps ?? [],
                rootType: body.rootType ?? body.composition.type ?? null,
              }
            : buildPlaygroundHandoff({
                kind,
                exportName: name,
                composition: body.composition,
                platformProjectId: boundPid,
              })
        setHandoff(nextHandoff)
        const nextMaintainer: PlaygroundMaintainerFields =
          body.kitRevision && body.storyTitle
            ? {
                updatedAt: body.updatedAt ?? null,
                kitRevision: body.kitRevision,
                storyTitle: body.storyTitle,
                variantCount: body.variantCount ?? 0,
                defaultVariantId: body.defaultVariantId ?? null,
                axisCount: body.axisCount ?? 0,
              }
            : buildPlaygroundMaintainer({
                componentId,
                exportName: name,
                platformProjectId: boundPid,
                updatedAt: body.updatedAt,
                storyTitle: body.storyTitle,
                defaultVariantId: body.defaultVariantId,
              })
        setMaintainer(nextMaintainer)
        const painted = paintNode(body.composition)
        setSeedSource(body.source)
        setSeedComposition(painted)
        const draft = readPlaygroundDraft(componentId)
        const nextSource = draft && draft !== body.source ? draft : body.source
        setSource(nextSource)
        if (draft && draft !== body.source) {
          applySourceSideEffects(draft, { persistDraft: false, componentId })
        } else {
          setComposition(painted)
          applySourceSideEffects(body.source, { persistDraft: false, componentId })
        }
      } catch {
        setStatus(t('kit.sourceFailed'))
      } finally {
        setLoadingSource(false)
      }
    },
    [applySourceSideEffects, collectionId, paintNode, t],
  )

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const id = initialComponentId || SITE_KIT_CATALOG[0]?.id
    if (!id) return
    const kind = kitPlaygroundKind(id)
    const catalogLabel = SITE_KIT_CATALOG.find((e) => e.id === id)?.exportName
    const label = catalogLabel ?? id.replace(/^Composition:/, '')
    setSelection({
      kind,
      componentId: id,
      label,
      ...((kind === 'pattern' || kind === 'section' || isCompositionOverrideId(id))
        ? { exportName: label }
        : {}),
    } as KitPlaygroundSelection)
    void loadSource(id, label)
  }, [initialComponentId, loadSource])

  function onSelect(sel: KitPlaygroundSelection) {
    setSelection(sel)
    setSelectedPath([])
    const href = kitPlaygroundHref({
      componentId: sel.componentId,
      platformProjectId: collectionId || null,
    })
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', href)
    }
    void loadSource(sel.componentId, sel.label)
  }

  function onSourceChange(next: string | undefined) {
    const value = next ?? ''
    setSource(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      applySourceSideEffects(value, {
        persistDraft: true,
        componentId: selection?.componentId,
      })
    }, DEBOUNCE_MS)
  }

  function onPropChange(key: string, value: string | number | boolean) {
    if (!composition) return
    const next = setNodeProp(composition, selectedPath, key, value)
    const painted = paintNode(next) ?? next
    const tsx = regeneratePlaygroundSource(exportName, painted)
    setComposition(painted)
    setSource(tsx)
    applySourceSideEffects(tsx, {
      persistDraft: true,
      componentId: selection?.componentId,
    })
  }

  function onStyleChange(key: string, value: string | number) {
    if (!composition) return
    const next = setNodeStyle(composition, selectedPath, key, value)
    const painted = paintNode(next) ?? next
    const tsx = regeneratePlaygroundSource(exportName, painted)
    setComposition(painted)
    setSource(tsx)
    applySourceSideEffects(tsx, {
      persistDraft: true,
      componentId: selection?.componentId,
    })
  }

  function onTokenBindingChange(
    next:
      | { kind: 'token'; bindingKey: string; path: string }
      | { kind: 'literal'; bindingKey: string; styleKey: string; value: string }
      | { kind: 'clear'; bindingKey: string; styleKey: string },
  ) {
    if (!composition) return
    let updated: SiteKitCompositionNode
    if (next.kind === 'token') {
      updated = setNodeTokenBinding(composition, selectedPath, next.bindingKey, next.path)
    } else if (next.kind === 'literal') {
      updated = setNodeStyleLiteralClearingBinding(
        composition,
        selectedPath,
        next.styleKey,
        next.value,
        next.bindingKey,
      )
    } else {
      updated = clearNodeTokenBinding(composition, selectedPath, next.bindingKey)
    }
    const painted = paintNode(updated) ?? updated
    const tsx = regeneratePlaygroundSource(exportName, painted)
    setComposition(painted)
    setSource(tsx)
    applySourceSideEffects(tsx, {
      persistDraft: true,
      componentId: selection?.componentId,
    })
  }

  function onAddBinding(slot: { styleKey: string; bindingKey: string }) {
    if (!composition) return
    const next = ensureNodeStyleSlot(composition, selectedPath, slot.styleKey)
    const painted = paintNode(next) ?? next
    const tsx = regeneratePlaygroundSource(exportName, painted)
    setComposition(painted)
    setSource(tsx)
    applySourceSideEffects(tsx, {
      persistDraft: true,
      componentId: selection?.componentId,
    })
  }

  function onFormat() {
    if (!composition) return
    const painted = paintNode(composition) ?? composition
    const tsx = regeneratePlaygroundSource(exportName, painted)
    setComposition(painted)
    setSource(tsx)
    applySourceSideEffects(tsx, {
      persistDraft: true,
      componentId: selection?.componentId,
    })
  }

  function onReset() {
    if (selection?.componentId) clearPlaygroundDraft(selection.componentId)
    setSource(seedSource)
    setComposition(seedComposition)
    setSelectedPath([])
    setParseError(null)
    setTranspileError(null)
    applySourceSideEffects(seedSource, { persistDraft: false })
  }

  function onOpenInEditor() {
    if (!inAppEditor || !insertType) return
    const href = editorHref({
      platformProjectId: collectionId || null,
      insertType,
    })
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  function onCreatePatternInEditor() {
    if (!inAppEditor) return
    const href = editorHref({
      platformProjectId: collectionId || null,
      hint: paths.editorHintSavePattern,
    })
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="creation-kit-playground"
      data-testid="kit-playground"
      style={
        {
          '--kit-body-min-height': `${paths.kitPlaygroundBodyMinHeightPx}px`,
        } as CSSProperties
      }
    >
      <Panel className="creation-kit-playground__chrome">
        <div className="creation-kit-playground__toolbar">
          <Text role="meta" as="span" data-testid="kit-meta">
            {t('kit.meta')}
          </Text>
          <Button
            type="button"
            size="sm"
            disabled={!inAppEditor || !insertType}
            onClick={onOpenInEditor}
            data-testid="kit-open-in-editor"
          >
            {t('kit.openInEditor')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={!inAppEditor}
            onClick={onCreatePatternInEditor}
            data-testid="kit-create-pattern-in-editor"
          >
            {t('kit.createPatternInEditor')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={!composition}
            onClick={onFormat}
            data-testid="kit-format"
          >
            {t('kit.format')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={!dirty}
            onClick={onReset}
            data-testid="kit-reset"
          >
            {t('kit.reset')}
          </Button>
          <KitPlaygroundCopyLink href={shareHref} t={t} />
          {dirty ? (
            <Badge data-testid="kit-dirty-badge">{t('kit.dirty')}</Badge>
          ) : (
            <Badge data-testid="kit-clean-badge">{t('kit.clean')}</Badge>
          )}
          {packSource ? (
            <Badge data-testid="kit-token-pack-badge">
              {packSource === 'local' ? t('kit.tokenPackLocal') : t('kit.tokenPackFixture')}
            </Badge>
          ) : null}
        </div>
        <Hint panel>{t('kit.ephemeralHint')}</Hint>
        <div data-testid="kit-pattern-flow-hint">
          <Hint panel>{t('kit.patternFlowHint')}</Hint>
        </div>
        {dirty ? (
          <div data-testid="kit-persist-hint">
            <Hint panel>{t('kit.persistHint')}</Hint>
          </div>
        ) : null}
        {status ? (
          <Text role="meta" as="p" data-testid="kit-status">
            {status}
          </Text>
        ) : null}
      </Panel>

      <div
        className="creation-kit-playground__body"
        data-testid="kit-playground-body"
        ref={bodyRef}
        style={kitColumnCssVars(columnLayout)}
      >
        <aside className="creation-kit-playground__sidebar" data-testid="kit-sidebar-pane">
          <KitPlaygroundNav
            patterns={patterns}
            selectedId={selection?.componentId ?? null}
            onSelect={onSelect}
            t={t}
          />
        </aside>

        <button
          type="button"
          className="creation-kit-playground__resize"
          data-testid="kit-resize-sidebar"
          aria-label={t('kit.resizeSidebar')}
          title={t('kit.resizeSidebar')}
          onPointerDown={onColumnResizePointerDown('sidebar')}
          onPointerMove={onColumnResizePointerMove}
          onPointerUp={onColumnResizePointerUp}
          onPointerCancel={onColumnResizePointerUp}
        />

        <section className="creation-kit-playground__editor" data-testid="kit-editor-pane">
          <Text role="meta" as="p" className="creation-kit-playground__pane-label">
            {t('kit.codePane')}
            {selection ? ` · ${selection.label}` : ''}
            {loadingSource ? ` · ${t('common.loading')}` : ''}
          </Text>
          <div className="creation-kit-monaco">
            <MonacoEditor
              height="100%"
              defaultLanguage="typescript"
              path="playground.tsx"
              theme="vs-dark"
              value={source}
              onChange={onSourceChange}
              beforeMount={configurePlaygroundMonaco}
              options={PLAYGROUND_MONACO_OPTIONS}
            />
          </div>
          {transpileError ? (
            <Text role="meta" as="p" className="creation-kit-error" data-testid="kit-transpile-error">
              {transpileError}
            </Text>
          ) : null}
          {parseError ? (
            <Text role="meta" as="p" className="creation-kit-error" data-testid="kit-parse-error">
              {parseError}
            </Text>
          ) : null}
        </section>

        <button
          type="button"
          className="creation-kit-playground__resize"
          data-testid="kit-resize-split"
          aria-label={t('kit.resizeEditorPreview')}
          title={t('kit.resizeEditorPreview')}
          onPointerDown={onColumnResizePointerDown('split')}
          onPointerMove={onColumnResizePointerMove}
          onPointerUp={onColumnResizePointerUp}
          onPointerCancel={onColumnResizePointerUp}
        />

        <section className="creation-kit-playground__preview" data-testid="kit-preview-pane">
          <div className="creation-kit-playground__preview-header">
            <Text role="meta" as="p" className="creation-kit-playground__pane-label">
              {t('kit.previewPane')}
            </Text>
            <div
              className="creation-kit-viewport-toggles"
              role="group"
              aria-label={t('kit.viewportAria')}
              data-testid="kit-viewport-toggles"
            >
              {VIEWPORTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={
                    viewport === id
                      ? 'creation-kit-viewport-toggle creation-kit-viewport-toggle--active'
                      : 'creation-kit-viewport-toggle'
                  }
                  data-testid={`kit-viewport-${id}`}
                  aria-pressed={viewport === id}
                  onClick={() => setViewport(id)}
                >
                  {t(`kit.viewport.${id}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="creation-kit-preview-scroll">
            <div
              className="creation-kit-preview-frame"
              data-testid="kit-preview-frame"
              data-viewport={viewport}
              style={{ maxWidth: frameWidth }}
            >
              <div className="creation-kit-preview-canvas" data-testid="kit-composition-preview">
                {composition ? (
                  <CompositionPreview
                    node={composition}
                    selectedPath={selectedPath}
                    onSelectPath={(path) => {
                      setSelectedPath(path)
                      setDetailTab('props')
                    }}
                  />
                ) : (
                  <Text role="meta" as="p">
                    {t('kit.previewEmpty')}
                  </Text>
                )}
              </div>
            </div>
          </div>
          <div className="creation-kit-detail-tabs" role="tablist" aria-label={t('kit.detailTabsAria')}>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === 'handoff'}
              className={
                detailTab === 'handoff'
                  ? 'creation-kit-detail-tab creation-kit-detail-tab--active'
                  : 'creation-kit-detail-tab'
              }
              data-testid="kit-tab-handoff"
              onClick={() => setDetailTab('handoff')}
            >
              {t('kit.handoffPane')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === 'tokens'}
              className={
                detailTab === 'tokens'
                  ? 'creation-kit-detail-tab creation-kit-detail-tab--active'
                  : 'creation-kit-detail-tab'
              }
              data-testid="kit-tab-tokens"
              onClick={() => setDetailTab('tokens')}
            >
              {t('kit.tokensPane')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === 'props'}
              className={
                detailTab === 'props'
                  ? 'creation-kit-detail-tab creation-kit-detail-tab--active'
                  : 'creation-kit-detail-tab'
              }
              data-testid="kit-tab-props"
              onClick={() => setDetailTab('props')}
            >
              {t('kit.propsPane')}
            </button>
          </div>
          {detailTab === 'handoff' ? (
            <KitPlaygroundHandoffPane
              handoff={handoff}
              maintainer={maintainer}
              componentId={selection?.componentId ?? null}
              kind={selection?.kind ?? null}
              exportName={exportName}
              platformProjectId={seedPlatformProjectId || collectionId || null}
              tokenPackSource={packSource}
              moduleSource={handoffModuleSource}
              tokenPackCss={tokenPackCss}
              bindingPaths={bindingPaths}
              tokenCatalog={tokenCatalog}
              compositionJson={compositionJson}
              shareHref={shareHref}
              storybookOrigin={storybookOrigin}
              t={t}
            />
          ) : detailTab === 'tokens' ? (
            <div className="creation-kit-tokens-pane" data-testid="kit-tokens-pane">
              <EditorTokenStudio
                pack={brandPack}
                catalog={tokenCatalog}
                highlightPaths={bindingPaths}
                onTokenSaved={onTokenSaved}
              />
            </div>
          ) : (
            <KitPlaygroundPropsPane
              composition={composition}
              selectedPath={selectedPath}
              onSelectPath={setSelectedPath}
              tokenCatalog={tokenCatalog}
              onChange={onPropChange}
              onStyleChange={onStyleChange}
              onTokenBindingChange={onTokenBindingChange}
              onAddBinding={onAddBinding}
              storybookOrigin={storybookOrigin}
              t={t}
            />
          )}
          <button
            type="button"
            className="creation-kit-sandbox-toggle"
            data-testid="kit-sandbox-toggle"
            onClick={() => setSandboxOpen((v) => !v)}
          >
            {sandboxOpen ? t('kit.sandboxHide') : t('kit.sandboxShow')}
          </button>
          {sandboxOpen ? (
            <iframe
              title={t('kit.sandboxPane')}
              className="creation-kit-sandbox-frame"
              data-testid="kit-sandbox-iframe"
              sandbox=""
              srcDoc={sandboxHtml}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}

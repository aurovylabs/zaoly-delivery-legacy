'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type {
  SceneBreakpointId,
  SceneMaster,
  SceneNode,
  SceneOp,
} from '@zaoly/contracts'
import {
  Button,
  InspectTabs,
  PropertyInspector,
  Text,
} from '@zaoly/ui'
import { EditorSiteSvgDeepEditDialog } from '../editor-site-svg-deep-edit-dialog'
import { InspectorCssTabLazy } from './inspector-css-tab-lazy'
import { InspectorDesignTabLazy } from './inspector-design-tab-lazy'
import { InspectorPromoteDialog } from './inspector-promote-dialog'
import { InspectorSiteKitBanner } from './inspector-site-kit-banner'
import { InspectorSiteTableControls } from './inspector-site-table-controls'
import { InspectorStateBar } from './inspector-state-bar'
import { useInspectorPromote } from './use-inspector-promote'
import { useInspectorWrites } from './use-inspector-writes'
import { useInteractiveState } from '../../lib/inspect/interactive-state-context'
import { fieldMatchesQuery } from '../../lib/inspect/inspector-field-values'
import {
  loadInspectCollapsed,
  saveInspectCollapsed,
} from '../../lib/editor-panel-chrome'
import {
  inspectFieldsForType,
  variantAxisFieldsForType,
} from '../../lib/inspect/field-catalog'
import { groupPropsIntoInspectSections } from '../../lib/inspect/sections'
import { isGridLayoutType } from '../../lib/inspect/layout-flow-groups'
import { INSPECT_SECTION_I18N_KEYS, type InspectSectionId } from '../../lib/inspect/sections'
import { useInspectTokenCatalog } from '../../lib/inspect/token-catalog-context'
import { loadTokenRecent } from '../../lib/inspect/token-recent'
import {
  writesToBreakpointOverride,
} from '../../lib/scene/cascade'
import {
  isBreakpointSecondary,
  nodeHasBreakpointOverrides,
  planResetBreakpointOverrides,
} from '../../lib/scene/breakpoint-visibility'
import { cascadeInspectView } from '../../lib/inspect/cascade-inspect-view'
import { useUserPrefs } from '../../lib/user-prefs'
import { paths } from '../../lib/paths'
import { useToast } from '../../lib/zaoly-ui-client'
import type {
  BrandTokenPackResponse,
  ZaolyPackLeaf,
} from '../../lib/inspect/token-catalog'
import { isBrandPackPromoteWritable } from '../../lib/inspect/brand-pack-writable'
export function EditorInspector({
  selected,
  selectedPersisted,
  selectedNodes,
  selectedCount,
  sceneRoot,
  isRoot,
  locked,
  activeBreakpoint,
  onBreakpointChange,
  onOp,
  onOps,
  onRemove,
  collectionBind,
  masters,
  sceneMasters,
  onCreateMaster,
  onDetachInstance,
  onEditMaster,
  onSetInstanceVariant,
  onSetInstanceVariantAxes,
  masterEdit,
  brandPack = null,
  onTokenSaved,
  onSiteKitStatus,
  onCompositionSaved,
  platformProjectId = null,
  onOpenAssetLibrary,
  chartStudioOpen = false,
  onOpenChartStudio,
  primaryBreakpoint: scenePrimaryBreakpoint = 'desktop',
}: {
  selected: SceneNode | null
  /** Page-tree / master-edit node for the current selection id. */
  selectedPersisted?: SceneNode | null
  selectedNodes: SceneNode[]
  selectedCount: number
  sceneRoot: SceneNode
  isRoot: boolean
  locked: boolean
  activeBreakpoint: SceneBreakpointId
  /** Wave H — OP-9 cascade base (scene.primaryBreakpoint). */
  primaryBreakpoint?: Exclude<SceneBreakpointId, 'print'>
  /** Toolbar-equivalent — elsewhere chips jump here. */
  onBreakpointChange?: (value: string) => void
  onOp: (op: SceneOp) => void
  onOps: (ops: SceneOp[]) => void
  onRemove: () => void
  collectionBind?: ReactNode
  masters?: {
    id: string
    name: string
    variants?: { id: string; name: string; combination?: Record<string, string> }[]
    defaultVariantId?: string
    axes?: { id: string; name: string; values: string[] }[]
  }[]
  /** Full Masters for Site Kit named-variant export. */
  sceneMasters?: SceneMaster[]
  onCreateMaster?: () => void
  onDetachInstance?: () => void
  onEditMaster?: (masterId: string) => void
  onSetInstanceVariant?: (variantId: string) => void
  onSetInstanceVariantAxes?: (axes: Record<string, string>) => void
  /** Master-Edit named variants / Component Sets — Inspect `variant-axes`. */
  masterEdit?: {
    masterId: string
    masterName: string
    activeVariantId: string
    variants: { id: string; name: string; combination?: Record<string, string> }[]
    axes?: { id: string; name: string; values: string[] }[]
    axisFilters?: Record<string, string>
    onSelectVariant: (variantId: string) => void
    onAddVariant: (name: string) => void
    onRenameVariant: (variantId: string, name: string) => void
    onDeleteVariant: (variantId: string) => void
    onAddAxis?: (name: string, values?: string[]) => void
    onRenameAxis?: (axisId: string, name: string) => void
    onDeleteAxis?: (axisId: string) => void
    onAddAxisValue?: (axisId: string, value: string) => void
    onRenameAxisValue?: (axisId: string, fromValue: string, toValue: string) => void
    onDeleteAxisValue?: (axisId: string, value: string) => void
    onSetAxisFilter?: (axisId: string, value: string) => void
  } | null
  /** Live local pack for promote-from-literal. */
  brandPack?: BrandTokenPackResponse | null
  onTokenSaved?: (token: ZaolyPackLeaf) => void
  /** Visible editor status (same strip as Publish to Storybook). */
  onSiteKitStatus?: (message: string | null) => void
  /** After successful composition save — bind Master to Storybook export. */
  onCompositionSaved?: (input: { masterId: string; exportName: string }) => void
  /** Scene Collection bind for Pattern scope. */
  platformProjectId?: string | null
  onOpenAssetLibrary?: (mode: 'background' | 'image') => void
  /** Chart studio floating panel open (SiteChart). Spec: chart-studio-panel.md */
  chartStudioOpen?: boolean
  onOpenChartStudio?: () => void
}) {
  const { t } = useUserPrefs()
  const { push: pushToast } = useToast()
  const catalog = useInspectTokenCatalog()
  const { activeState } = useInteractiveState()
  const [inspectTab, setInspectTab] = useState<'design' | 'css'>('design')
  const [filterQuery, setFilterQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => loadInspectCollapsed())
  const [recentPaths, setRecentPaths] = useState<string[]>(() => loadTokenRecent())
  const [newMasterVariantName, setNewMasterVariantName] = useState('')
  const [masterVariantDialogOpen, setMasterVariantDialogOpen] = useState(false)
  const [siteSvgDeepEditOpen, setSiteSvgDeepEditOpen] = useState(false)
  const primaryBreakpoint =
    scenePrimaryBreakpoint === 'tablet' ||
    scenePrimaryBreakpoint === 'mobile' ||
    scenePrimaryBreakpoint === 'desktop'
      ? scenePrimaryBreakpoint
      : 'desktop'
  const useOverride = writesToBreakpointOverride(activeBreakpoint, primaryBreakpoint)
  const packWritable = isBrandPackPromoteWritable(brandPack)
  const multi = selectedCount > 1

  useEffect(() => {
    saveInspectCollapsed(collapsed)
  }, [collapsed])

  useEffect(() => {
    const open = () => setSiteSvgDeepEditOpen(true)
    window.addEventListener(paths.hudHostOpenSvgDeepEditEvent, open)
    return () => window.removeEventListener(paths.hudHostOpenSvgDeepEditEvent, open)
  }, [])

  // Hooks must run even when nothing is selected (deselect must not shrink the hook list).
  const hookSelected = selected ?? sceneRoot
  const { writeProp, writeLiteral, setToken, setDataBinding, clearDataBinding } = useInspectorWrites({
    selected: hookSelected,
    selectedNodes,
    multi,
    useOverride,
    activeBreakpoint,
    activeInteractiveState: activeState,
    onOps,
  })

  const { openPromoteLiteral, promoteDialog } = useInspectorPromote({
    brandPack,
    catalog,
    setToken,
    onTokenSaved,
    t,
  })

  if (!selected) {
    return (
      <PropertyInspector title={t('editor.inspector')} data-testid="creation-editor-inspector">
        {collectionBind}
        <Text role="meta" as="p">
          {t('editor.selectHint')}
        </Text>
      </PropertyInspector>
    )
  }

  const fields = inspectFieldsForType(selected.type)
  const variantAxes = variantAxisFieldsForType(selected.type).filter((f) =>
    fieldMatchesQuery(f, filterQuery),
  )
  const sections = groupPropsIntoInspectSections(fields).map((section) => {
    const sectionId = section.id as InspectSectionId
    const labelKey = INSPECT_SECTION_I18N_KEYS[sectionId]
    const label =
      sectionId === 'layout'
        ? isGridLayoutType(selected.type)
          ? t('editor.inspectGridLayout')
          : t('editor.inspectFlexLayout')
        : t(labelKey)
    return {
      ...section,
      label,
      props: section.props.filter((field) => fieldMatchesQuery(field, filterQuery)),
    }
  })
  const cascaded = cascadeInspectView(
    selected,
    activeBreakpoint,
    activeState,
    primaryBreakpoint,
  )
  const readOnly = locked

  function isSectionOpen(id: string): boolean {
    return collapsed[id] !== true
  }

  function toggleSection(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const bpLabel =
    activeBreakpoint === 'mobile'
      ? t('editor.breakpoint.mobile')
      : activeBreakpoint === 'tablet'
        ? t('editor.breakpoint.tablet')
        : activeBreakpoint === 'print'
          ? t('editor.breakpoint.print')
          : t('editor.breakpoint.desktop')

  return (
    <PropertyInspector title={t('editor.inspector')} data-testid="creation-editor-inspector">
      <InspectorStateBar node={selected} onOps={onOps} />
      {collectionBind}
      {multi ? (
        <Text role="meta" as="p" data-testid="editor-multi-selected">
          {t('editor.nSelected', { count: selectedCount })}
        </Text>
      ) : null}
      {locked ? (
        <Text role="meta" as="p" data-testid="editor-locked-hint">
          {t('editor.lockedHint')}
        </Text>
      ) : null}
      {selected &&
      !locked &&
      isBreakpointSecondary(activeBreakpoint, primaryBreakpoint) &&
      (multi
        ? selectedNodes.some((n) =>
            nodeHasBreakpointOverrides(n, activeBreakpoint, primaryBreakpoint),
          )
        : nodeHasBreakpointOverrides(selected, activeBreakpoint, primaryBreakpoint)) ? (
        <div
          className="creation-inspect-bp-reset"
          style={{ marginBottom: '0.75rem' }}
        >
          <Button
            type="button"
            size="sm"
            variant="subtle"
            data-testid="inspect-bp-reset"
            title={t('editor.resetBreakpointOverridesTip')}
            onClick={() => {
              const targets = multi ? selectedNodes : [selected]
              const ops = planResetBreakpointOverrides(
                targets,
                activeBreakpoint,
                primaryBreakpoint,
              )
              if (ops.length) onOps(ops)
            }}
          >
            {t('editor.resetBreakpointOverrides')}
          </Button>
        </div>
      ) : null}
      {selected &&
      !locked &&
      (activeBreakpoint === 'desktop' ||
        activeBreakpoint === 'tablet' ||
        activeBreakpoint === 'mobile') &&
      activeBreakpoint !== primaryBreakpoint ? (
        <div
          className="creation-inspect-bp-set-primary"
          style={{ marginBottom: '0.75rem' }}
        >
          <Button
            type="button"
            size="sm"
            variant="subtle"
            data-testid="inspect-bp-set-primary"
            title={t('editor.setPrimaryBreakpointTip')}
            onClick={() => {
              if (
                activeBreakpoint !== 'desktop' &&
                activeBreakpoint !== 'tablet' &&
                activeBreakpoint !== 'mobile'
              ) {
                return
              }
              onOp({ op: 'set_primary_breakpoint', breakpoint: activeBreakpoint })
              pushToast({
                message: t('editor.setPrimaryBreakpointDone', { bp: bpLabel }),
                tone: 'ok',
                durationMs: 2800,
              })
            }}
          >
            {t('editor.setPrimaryBreakpoint')}
          </Button>
        </div>
      ) : null}
      {selected && selected.instanceOf && !multi ? (
        <div
          className="creation-inspect-masters"
          data-testid="editor-instance-banner"
          style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
        >
          <Text role="meta" as="p">
            {t('editor.mastersInstanceOf', {
              name:
                masters?.find((m) => m.id === selected.instanceOf)?.name ??
                selected.instanceOf,
            })}
          </Text>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <Button
              type="button"
              size="sm"
              variant="subtle"
              disabled={locked}
              data-testid="editor-edit-master-btn"
              onClick={() => onEditMaster?.(selected.instanceOf!)}
            >
              {t('editor.mastersEditMaster')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={locked}
              data-testid="editor-detach-instance-btn"
              onClick={() => onDetachInstance?.()}
            >
              {t('editor.mastersDetach')}
            </Button>
          </div>
        </div>
      ) : null}
      <InspectorSiteKitBanner
        selected={selected}
        selectedPersisted={selectedPersisted}
        locked={locked}
        multi={multi}
        isRoot={isRoot}
        activeBreakpoint={activeBreakpoint}
        catalog={catalog}
        sceneMasters={sceneMasters}
        masterEditId={masterEdit?.masterId ?? null}
        platformProjectId={platformProjectId}
        t={t}
        onSiteKitStatus={onSiteKitStatus}
        onCompositionSaved={onCompositionSaved}
      />
      {!multi && selected?.type === 'SiteTable' && !selected.instanceOf ? (
        <InspectorSiteTableControls
          nodeId={selected.id}
          locked={locked}
          runOp={onOp}
        />
      ) : null}
      {useOverride ? (
        <div
          className="creation-inspect-bp-banner"
          role="status"
          data-testid="editor-bp-override-banner"
        >
          <Text role="meta" as="p">
            {t('editor.bpOverrideBanner', { bp: bpLabel })}
          </Text>
          <Text role="meta" as="p" data-testid="editor-bp-compare-hint">
            {t('editor.bpCompareHint')}
          </Text>
        </div>
      ) : null}

      <InspectTabs
        data-testid="editor-inspect-tabs"
        aria-label={t('editor.inspectTabs')}
        value={inspectTab}
        designLabel={t('editor.inspectDesign')}
        cssLabel={t('editor.inspectCss')}
        onChange={(id) => {
          if (id === 'design' || id === 'css') setInspectTab(id)
        }}
      />

      {inspectTab === 'css' ? (
        <InspectorCssTabLazy selected={selected} cascaded={cascaded} catalog={catalog} t={t} />
      ) : inspectTab === 'design' ? (
        <InspectorDesignTabLazy
          t={t}
          filterQuery={filterQuery}
          setFilterQuery={setFilterQuery}
          variantAxes={variantAxes}
          sections={sections}
          isSectionOpen={isSectionOpen}
          toggleSection={toggleSection}
          selected={selected}
          isRoot={isRoot}
          multi={multi}
          locked={locked}
          onRemove={onRemove}
          onCreateMaster={onCreateMaster}
          onSetInstanceVariant={onSetInstanceVariant}
          onSetInstanceVariantAxes={onSetInstanceVariantAxes}
          masters={masters}
          masterEdit={masterEdit}
          newMasterVariantName={newMasterVariantName}
          setNewMasterVariantName={setNewMasterVariantName}
          masterVariantDialogOpen={masterVariantDialogOpen}
          setMasterVariantDialogOpen={setMasterVariantDialogOpen}
          selectedNodes={selectedNodes}
          cascaded={cascaded}
          activeBreakpoint={activeBreakpoint}
          primaryBreakpoint={primaryBreakpoint}
          useOverride={useOverride}
          readOnly={readOnly}
          catalog={catalog}
          packWritable={packWritable}
          recentPaths={recentPaths}
          setRecentPaths={setRecentPaths}
          bpLabel={bpLabel}
          writeProp={writeProp}
          writeLiteral={writeLiteral}
          setToken={setToken}
          setDataBinding={setDataBinding}
          clearDataBinding={clearDataBinding}
          platformProjectId={platformProjectId}
          openPromoteLiteral={openPromoteLiteral}
          setSiteSvgDeepEditOpen={setSiteSvgDeepEditOpen}
          onOpenAssetLibrary={onOpenAssetLibrary}
          onBreakpointChange={onBreakpointChange}
          chartStudioOpen={chartStudioOpen}
          onOpenChartStudio={onOpenChartStudio}
        />
      ) : null}
      {!multi && selected?.type === 'SiteSvg' && !locked ? (
        <EditorSiteSvgDeepEditDialog
          open={siteSvgDeepEditOpen}
          initialMarkup={String(selected.props?.markup ?? '')}
          onClose={() => setSiteSvgDeepEditOpen(false)}
          onApply={(markup) => writeProp('markup', markup)}
        />
      ) : null}
      <InspectorPromoteDialog
        draft={promoteDialog.draft}
        path={promoteDialog.path}
        busy={promoteDialog.busy}
        error={promoteDialog.error}
        localPreview={promoteDialog.localPreview}
        onPathChange={promoteDialog.setPath}
        onClose={promoteDialog.close}
        onSubmit={promoteDialog.submit}
        t={t}
      />
    </PropertyInspector>
  )
}

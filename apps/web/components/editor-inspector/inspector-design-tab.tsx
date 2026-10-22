'use client'

import { InspectorDesignPanel, type InspectorDesignPanelProps } from './inspector-design-panel'
import {
  useInspectorFieldRenderer,
  type InspectorFieldRendererParams,
} from './use-inspector-field-renderer'

export type InspectorDesignTabProps = Omit<InspectorDesignPanelProps, 'fieldRenderer'> &
  Pick<
    InspectorFieldRendererParams,
    | 'selectedNodes'
    | 'cascaded'
    | 'activeBreakpoint'
    | 'primaryBreakpoint'
    | 'useOverride'
    | 'readOnly'
    | 'catalog'
    | 'packWritable'
    | 'recentPaths'
    | 'setRecentPaths'
    | 'bpLabel'
    | 'writeProp'
    | 'writeLiteral'
    | 'setToken'
    | 'setDataBinding'
    | 'clearDataBinding'
    | 'platformProjectId'
    | 'openPromoteLiteral'
    | 'setSiteSvgDeepEditOpen'
    | 'onOpenAssetLibrary'
    | 'onBreakpointChange'
  >

export function InspectorDesignTab(props: InspectorDesignTabProps) {
  const {
    t,
    filterQuery,
    setFilterQuery,
    variantAxes,
    sections,
    isSectionOpen,
    toggleSection,
    selected,
    isRoot,
    multi,
    locked,
    onRemove,
    onCreateMaster,
    onSetInstanceVariant,
    onSetInstanceVariantAxes,
    masters,
    masterEdit,
    newMasterVariantName,
    setNewMasterVariantName,
    masterVariantDialogOpen,
    setMasterVariantDialogOpen,
    selectedNodes,
    cascaded,
    activeBreakpoint,
    primaryBreakpoint,
    useOverride,
    readOnly,
    catalog,
    packWritable,
    recentPaths,
    setRecentPaths,
    bpLabel,
    writeProp,
    writeLiteral,
    setToken,
    setDataBinding,
    clearDataBinding,
    platformProjectId,
    openPromoteLiteral,
    setSiteSvgDeepEditOpen,
    onOpenAssetLibrary,
    onBreakpointChange,
    chartStudioOpen,
    onOpenChartStudio,
  } = props

  const fieldRenderer = useInspectorFieldRenderer({
    multi,
    selected,
    selectedNodes,
    cascaded,
    activeBreakpoint,
    primaryBreakpoint,
    useOverride,
    readOnly,
    locked,
    catalog,
    packWritable,
    recentPaths,
    setRecentPaths,
    bpLabel,
    t,
    writeProp,
    writeLiteral,
    setToken,
    setDataBinding,
    clearDataBinding,
    platformProjectId,
    openPromoteLiteral,
    setSiteSvgDeepEditOpen,
    onOpenAssetLibrary,
    onBreakpointChange,
  })

  return (
    <InspectorDesignPanel
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
      chartStudioOpen={chartStudioOpen}
      onOpenChartStudio={onOpenChartStudio}
      fieldRenderer={fieldRenderer}
    />
  )
}

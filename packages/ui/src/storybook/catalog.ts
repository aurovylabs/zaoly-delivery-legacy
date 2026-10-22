/**
 * Atomic Storybook inventory — SoT for catalogCompleteness.
 * Spec: specs/domain/zaoly-ui-catalog-map.md
 * Knowledge: knowledge/zaoly-ui-storybook-atomic.md
 * Viewport-critical: specs/domain/zaoly-ui-responsive.md
 */
export type CatalogLayer =
  | 'Foundation'
  | 'Atoms'
  | 'Molecules'
  | 'Organisms'
  | 'Templates'
  | 'Print'
  | 'Mag'

/** How CREATION may instantiate this catalog id. Omitted → derived by `catalogInsert`. */
export type CatalogInsert = 'canvas' | 'print-twin' | 'template' | 'docs'

export type CatalogEntry = {
  id: string
  layer: CatalogLayer
  title: string
  stories: string
  mdx: string
  /** Requires Narrow story (globals.viewport responsiveSm) — responsive bar. */
  viewportCritical?: boolean
  /** Override derived insert mode. */
  insert?: CatalogInsert
  /** Barrel export name when it differs from `id` (e.g. DivergingBar → DivergingBarList). */
  component?: string
}

export const CATALOG: CatalogEntry[] = [
  // Foundation
  { id: 'tokens', layer: 'Foundation', title: 'Foundation/Tokens', stories: 'DesignTokens.stories.tsx', mdx: 'DesignTokens.mdx' },
  { id: 'typography', layer: 'Foundation', title: 'Foundation/Typography', stories: 'Typography.stories.tsx', mdx: 'Typography.mdx' },
  { id: 'motion', layer: 'Foundation', title: 'Foundation/Motion', stories: 'Motion.stories.tsx', mdx: 'Motion.mdx' },
  { id: 'Icons', layer: 'Foundation', title: 'Foundation/Icons', stories: 'components/Icons.stories.tsx', mdx: 'components/Icons.mdx' },
  {
    id: 'InspectLayoutGlyphs',
    layer: 'Foundation',
    title: 'Foundation/Inspect Layout Glyphs',
    stories: 'components/InspectLayoutGlyphs.stories.tsx',
    mdx: 'components/InspectLayoutGlyphs.mdx',
  },
  // Atoms
  { id: 'Text', layer: 'Atoms', title: 'Atoms/Text', stories: 'components/Text.stories.tsx', mdx: 'components/Text.mdx' },
  { id: 'Button', layer: 'Atoms', title: 'Atoms/Button', stories: 'components/Button.stories.tsx', mdx: 'components/Button.mdx' },
  { id: 'Chip', layer: 'Atoms', title: 'Atoms/Chip', stories: 'components/Chip.stories.tsx', mdx: 'components/Chip.mdx' },
  { id: 'Input', layer: 'Atoms', title: 'Atoms/Input', stories: 'components/Input.stories.tsx', mdx: 'components/Input.mdx' },
  { id: 'Textarea', layer: 'Atoms', title: 'Atoms/Textarea', stories: 'components/Textarea.stories.tsx', mdx: 'components/Textarea.mdx' },
  { id: 'Select', layer: 'Atoms', title: 'Atoms/Select', stories: 'components/Select.stories.tsx', mdx: 'components/Select.mdx', viewportCritical: true },
  { id: 'Checkbox', layer: 'Atoms', title: 'Atoms/Checkbox', stories: 'components/Checkbox.stories.tsx', mdx: 'components/Checkbox.mdx' },
  { id: 'Switch', layer: 'Atoms', title: 'Atoms/Switch', stories: 'components/Switch.stories.tsx', mdx: 'components/Switch.mdx' },
  { id: 'Slider', layer: 'Atoms', title: 'Atoms/Slider', stories: 'components/Slider.stories.tsx', mdx: 'components/Slider.mdx' },
  { id: 'Divider', layer: 'Atoms', title: 'Atoms/Divider', stories: 'components/Divider.stories.tsx', mdx: 'components/Divider.mdx' },
  { id: 'Spinner', layer: 'Atoms', title: 'Atoms/Spinner', stories: 'components/Spinner.stories.tsx', mdx: 'components/Spinner.mdx' },
  { id: 'Skeleton', layer: 'Atoms', title: 'Atoms/Skeleton', stories: 'components/Skeleton.stories.tsx', mdx: 'components/Skeleton.mdx' },
  { id: 'StatusDot', layer: 'Atoms', title: 'Atoms/StatusDot', stories: 'components/StatusDot.stories.tsx', mdx: 'components/StatusDot.mdx' },
  { id: 'Tooltip', layer: 'Atoms', title: 'Atoms/Tooltip', stories: 'components/Tooltip.stories.tsx', mdx: 'components/Tooltip.mdx' },
  { id: 'Avatar', layer: 'Atoms', title: 'Atoms/Avatar', stories: 'components/Avatar.stories.tsx', mdx: 'components/Avatar.mdx' },
  { id: 'Hint', layer: 'Atoms', title: 'Atoms/Hint', stories: 'components/Hint.stories.tsx', mdx: 'components/Hint.mdx' },
  { id: 'LoadingText', layer: 'Atoms', title: 'Atoms/LoadingText', stories: 'components/LoadingText.stories.tsx', mdx: 'components/LoadingText.mdx' },
  { id: 'EmptyState', layer: 'Atoms', title: 'Atoms/EmptyState', stories: 'components/EmptyState.stories.tsx', mdx: 'components/EmptyState.mdx' },
  { id: 'PageTitle', layer: 'Atoms', title: 'Atoms/PageTitle', stories: 'components/PageTitle.stories.tsx', mdx: 'components/PageTitle.mdx' },
  // Molecules
  { id: 'Field', layer: 'Molecules', title: 'Molecules/Field', stories: 'components/Field.stories.tsx', mdx: 'components/Field.mdx', viewportCritical: true },
  { id: 'TagInput', layer: 'Molecules', title: 'Molecules/TagInput', stories: 'components/TagInput.stories.tsx', mdx: 'components/TagInput.mdx' },
  { id: 'Alert', layer: 'Molecules', title: 'Molecules/Alert', stories: 'components/Alert.stories.tsx', mdx: 'components/Alert.mdx' },
  { id: 'Toast', layer: 'Molecules', title: 'Molecules/Toast', stories: 'components/Toast.stories.tsx', mdx: 'components/Toast.mdx' },
  { id: 'FilterRow', layer: 'Molecules', title: 'Molecules/FilterRow', stories: 'components/FilterRow.stories.tsx', mdx: 'components/FilterRow.mdx', viewportCritical: true },
  { id: 'ToggleGroup', layer: 'Molecules', title: 'Molecules/ToggleGroup', stories: 'components/ToggleGroup.stories.tsx', mdx: 'components/ToggleGroup.mdx' },
  { id: 'AccentSwatchGroup', layer: 'Molecules', title: 'Molecules/AccentSwatchGroup', stories: 'components/AccentSwatchGroup.stories.tsx', mdx: 'components/AccentSwatchGroup.mdx' },
  { id: 'Tabs', layer: 'Molecules', title: 'Molecules/Tabs', stories: 'components/Tabs.stories.tsx', mdx: 'components/Tabs.mdx' },
  { id: 'Accordion', layer: 'Molecules', title: 'Molecules/Accordion', stories: 'components/Accordion.stories.tsx', mdx: 'components/Accordion.mdx' },
  { id: 'Panel', layer: 'Molecules', title: 'Molecules/Panel', stories: 'components/Panel.stories.tsx', mdx: 'components/Panel.mdx' },
  { id: 'MetricChip', layer: 'Molecules', title: 'Molecules/MetricChip', stories: 'components/MetricChip.stories.tsx', mdx: 'components/MetricChip.mdx' },
  { id: 'Meter', layer: 'Molecules', title: 'Molecules/Meter', stories: 'components/Meter.stories.tsx', mdx: 'components/Meter.mdx' },
  { id: 'ScrollArea', layer: 'Molecules', title: 'Molecules/ScrollArea', stories: 'components/ScrollArea.stories.tsx', mdx: 'components/ScrollArea.mdx' },
  { id: 'InspectDock', layer: 'Molecules', title: 'Molecules/InspectDock', stories: 'components/InspectDock.stories.tsx', mdx: 'components/InspectDock.mdx' },
  { id: 'StepStrip', layer: 'Molecules', title: 'Molecules/StepStrip', stories: 'components/StepStrip.stories.tsx', mdx: 'components/StepStrip.mdx' },
  { id: 'ChannelStack', layer: 'Molecules', title: 'Molecules/ChannelStack', stories: 'components/ChannelStack.stories.tsx', mdx: 'components/ChannelStack.mdx' },
  { id: 'ChannelLane', layer: 'Molecules', title: 'Molecules/ChannelLane', stories: 'components/ChannelStack.stories.tsx', mdx: 'components/ChannelStack.mdx' },
  { id: 'EventFooter', layer: 'Molecules', title: 'Molecules/EventFooter', stories: 'components/EventFooter.stories.tsx', mdx: 'components/EventFooter.mdx' },
  { id: 'CardActions', layer: 'Molecules', title: 'Molecules/CardActions', stories: 'components/CardActions.stories.tsx', mdx: 'components/CardActions.mdx' },
  { id: 'Lede', layer: 'Molecules', title: 'Molecules/Lede', stories: 'components/Lede.stories.tsx', mdx: 'components/Lede.mdx' },
  { id: 'MarkdownProse', layer: 'Molecules', title: 'Molecules/MarkdownProse', stories: 'components/MarkdownProse.stories.tsx', mdx: 'components/MarkdownProse.mdx' },
  { id: 'SectionChrome', layer: 'Molecules', title: 'Molecules/SectionChrome', stories: 'SectionChrome.stories.tsx', mdx: 'SectionChrome.mdx' },
  { id: 'RankedRow', layer: 'Molecules', title: 'Molecules/RankedRow', stories: 'components/RankedRow.stories.tsx', mdx: 'components/RankedRow.mdx' },
  { id: 'BrandCorner', layer: 'Molecules', title: 'Molecules/BrandCorner', stories: 'components/BrandCorner.stories.tsx', mdx: 'components/BrandCorner.mdx' },
  { id: 'ShellBackButton', layer: 'Molecules', title: 'Molecules/ShellBackButton', stories: 'components/ShellBackButton.stories.tsx', mdx: 'components/ShellBackButton.mdx' },
  { id: 'BrandCornerProductMenu', layer: 'Molecules', title: 'Molecules/BrandCornerProductMenu', stories: 'components/BrandCornerProductMenu.stories.tsx', mdx: 'components/BrandCornerProductMenu.mdx' },
  { id: 'TopStatus', layer: 'Molecules', title: 'Molecules/TopStatus', stories: 'components/TopStatus.stories.tsx', mdx: 'components/TopStatus.mdx' },
  { id: 'DivergingBar', layer: 'Molecules', title: 'Molecules/DivergingBar', stories: 'components/DivergingBar.stories.tsx', mdx: 'components/DivergingBar.mdx' },
  { id: 'Flyout', layer: 'Molecules', title: 'Molecules/Flyout', stories: 'components/Flyout.stories.tsx', mdx: 'components/Flyout.mdx' },
  // Organisms
  { id: 'Dialog', layer: 'Organisms', title: 'Organisms/Dialog', stories: 'components/Dialog.stories.tsx', mdx: 'components/Dialog.mdx', viewportCritical: true },
  { id: 'ConfirmDialog', layer: 'Organisms', title: 'Organisms/ConfirmDialog', stories: 'components/ConfirmDialog.stories.tsx', mdx: 'components/ConfirmDialog.mdx' },
  { id: 'DataTable', layer: 'Organisms', title: 'Organisms/DataTable', stories: 'components/DataTable.stories.tsx', mdx: 'components/DataTable.mdx' },
  { id: 'RankedList', layer: 'Organisms', title: 'Organisms/RankedList', stories: 'components/RankedList.stories.tsx', mdx: 'components/RankedList.mdx', viewportCritical: true },
  { id: 'NavRail', layer: 'Organisms', title: 'Organisms/NavRail', stories: 'components/NavRail.stories.tsx', mdx: 'components/NavRail.mdx' },
  { id: 'KpiStrip', layer: 'Organisms', title: 'Organisms/KpiStrip', stories: 'components/KpiStrip.stories.tsx', mdx: 'components/KpiStrip.mdx' },
  { id: 'PipelinePanel', layer: 'Organisms', title: 'Organisms/PipelinePanel', stories: 'components/PipelinePanel.stories.tsx', mdx: 'components/PipelinePanel.mdx' },
  { id: 'StatusMeterPanel', layer: 'Organisms', title: 'Organisms/StatusMeterPanel', stories: 'components/StatusMeterPanel.stories.tsx', mdx: 'components/StatusMeterPanel.mdx' },
  { id: 'SettingsShell', layer: 'Organisms', title: 'Organisms/SettingsShell', stories: 'components/SettingsShell.stories.tsx', mdx: 'components/SettingsShell.mdx', viewportCritical: true },
  // Templates
  { id: 'AppFrame', layer: 'Templates', title: 'Templates/AppFrame', stories: 'components/AppFrame.stories.tsx', mdx: 'components/AppFrame.mdx' },
  { id: 'InfoTip', layer: 'Molecules', title: 'Molecules/InfoTip', stories: 'components/InfoTip.stories.tsx', mdx: 'components/InfoTip.mdx' },
  { id: 'FloatingPanel', layer: 'Organisms', title: 'Organisms/FloatingPanel', stories: 'components/FloatingPanel.stories.tsx', mdx: 'components/FloatingPanel.mdx' },
  { id: 'ChatOverlay', layer: 'Organisms', title: 'Organisms/ChatOverlay', stories: 'components/ChatOverlay.stories.tsx', mdx: 'components/ChatOverlay.mdx' },
  { id: 'FlowBoardStage', layer: 'Organisms', title: 'Organisms/FlowBoardStage', stories: 'components/FlowBoardStage.stories.tsx', mdx: 'components/FlowBoardStage.mdx' },
  { id: 'FlowBoardToolbar', layer: 'Organisms', title: 'Organisms/FlowBoardToolbar', stories: 'components/FlowBoardToolbar.stories.tsx', mdx: 'components/FlowBoardToolbar.mdx' },
  { id: 'FlowBoardPalette', layer: 'Organisms', title: 'Organisms/FlowBoardPalette', stories: 'components/FlowBoardPalette.stories.tsx', mdx: 'components/FlowBoardPalette.mdx' },
  { id: 'FlowNodeCard', layer: 'Organisms', title: 'Organisms/FlowNodeCard', stories: 'components/FlowNodeCard.stories.tsx', mdx: 'components/FlowNodeCard.mdx' },
  { id: 'FlowInspectorShell', layer: 'Organisms', title: 'Organisms/FlowInspectorShell', stories: 'components/FlowInspectorShell.stories.tsx', mdx: 'components/FlowInspectorShell.mdx' },
  { id: 'FlowNodeEditorShell', layer: 'Organisms', title: 'Organisms/FlowNodeEditorShell', stories: 'components/FlowNodeEditorShell.stories.tsx', mdx: 'components/FlowNodeEditorShell.mdx' },
  { id: 'FlowRunStrip', layer: 'Organisms', title: 'Organisms/FlowRunStrip', stories: 'components/FlowRunStrip.stories.tsx', mdx: 'components/FlowRunStrip.mdx' },
  { id: 'ContextMenu', layer: 'Molecules', title: 'Molecules/ContextMenu', stories: 'components/ContextMenu.stories.tsx', mdx: 'components/ContextMenu.mdx' },
  { id: 'JsonTree', layer: 'Molecules', title: 'Molecules/JsonTree', stories: 'components/JsonTree.stories.tsx', mdx: 'components/JsonTree.mdx' },
  { id: 'SchemaTree', layer: 'Molecules', title: 'Molecules/SchemaTree', stories: 'components/SchemaTree.stories.tsx', mdx: 'components/SchemaTree.mdx' },
  { id: 'ExpressionField', layer: 'Molecules', title: 'Molecules/ExpressionField', stories: 'components/ExpressionField.stories.tsx', mdx: 'components/ExpressionField.mdx' },
  { id: 'MagazineContentsNav', layer: 'Molecules', title: 'Molecules/MagazineContentsNav', stories: 'components/MagazineContentsNav.stories.tsx', mdx: 'components/MagazineContentsNav.mdx' },
  { id: 'MarkerCanvas', layer: 'Organisms', title: 'Organisms/MarkerCanvas', stories: 'components/MarkerCanvas.stories.tsx', mdx: 'components/MarkerCanvas.mdx' },
  { id: 'FormSection', layer: 'Molecules', title: 'Molecules/FormSection', stories: 'components/FormSection.stories.tsx', mdx: 'components/FormSection.mdx' },
  { id: 'InspectSection', layer: 'Molecules', title: 'Molecules/InspectSection', stories: 'components/InspectSection.stories.tsx', mdx: 'components/InspectSection.mdx' },
  { id: 'InspectTabs', layer: 'Molecules', title: 'Molecules/InspectTabs', stories: 'components/InspectTabs.stories.tsx', mdx: 'components/InspectTabs.mdx' },
  { id: 'BreakpointSwitcher', layer: 'Molecules', title: 'Molecules/BreakpointSwitcher', stories: 'components/BreakpointSwitcher.stories.tsx', mdx: 'components/BreakpointSwitcher.mdx' },
  { id: 'EntityCard', layer: 'Molecules', title: 'Molecules/EntityCard', stories: 'components/EntityCard.stories.tsx', mdx: 'components/EntityCard.mdx' },
  { id: 'HubIndexCard', layer: 'Molecules', title: 'Molecules/HubIndexCard', stories: 'components/HubIndexCard.stories.tsx', mdx: 'components/HubIndexCard.mdx' },
  { id: 'CollectionHubCard', layer: 'Molecules', title: 'Molecules/CollectionHubCard', stories: 'components/CollectionHubCard.stories.tsx', mdx: 'components/CollectionHubCard.mdx' },
  { id: 'HubIndexLayoutSwitch', layer: 'Molecules', title: 'Molecules/HubIndexLayoutSwitch', stories: 'components/HubIndexLayoutSwitch.stories.tsx', mdx: 'components/HubIndexLayoutSwitch.mdx' },
  { id: 'AddTile', layer: 'Atoms', title: 'Atoms/AddTile', stories: 'components/AddTile.stories.tsx', mdx: 'components/AddTile.mdx' },
  { id: 'SwatchStrip', layer: 'Atoms', title: 'Atoms/SwatchStrip', stories: 'components/SwatchStrip.stories.tsx', mdx: 'components/SwatchStrip.mdx' },
  { id: 'ColorPicker', layer: 'Molecules', title: 'Molecules/ColorPicker', stories: 'components/ColorPicker.stories.tsx', mdx: 'components/ColorPicker.mdx' },
  { id: 'ChatBlockPanel', layer: 'Molecules', title: 'Molecules/ChatBlockPanel', stories: 'components/ChatBlockPanel.stories.tsx', mdx: 'components/ChatBlockPanel.mdx' },
  { id: 'ChatBlockList', layer: 'Molecules', title: 'Molecules/ChatBlockList', stories: 'components/ChatBlockList.stories.tsx', mdx: 'components/ChatBlockList.mdx' },
  { id: 'ChatMetricGrid', layer: 'Molecules', title: 'Molecules/ChatMetricGrid', stories: 'components/ChatMetricGrid.stories.tsx', mdx: 'components/ChatMetricGrid.mdx' },
  { id: 'ChatKeyValueList', layer: 'Molecules', title: 'Molecules/ChatKeyValueList', stories: 'components/ChatKeyValueList.stories.tsx', mdx: 'components/ChatKeyValueList.mdx' },
  { id: 'ChatStepList', layer: 'Molecules', title: 'Molecules/ChatStepList', stories: 'components/ChatStepList.stories.tsx', mdx: 'components/ChatStepList.mdx' },
  { id: 'ChatLinkList', layer: 'Molecules', title: 'Molecules/ChatLinkList', stories: 'components/ChatLinkList.stories.tsx', mdx: 'components/ChatLinkList.mdx' },
  { id: 'ChatAlertBlock', layer: 'Molecules', title: 'Molecules/ChatAlertBlock', stories: 'components/ChatAlertBlock.stories.tsx', mdx: 'components/ChatAlertBlock.mdx' },
  { id: 'ChatDataTable', layer: 'Molecules', title: 'Molecules/ChatDataTable', stories: 'components/ChatDataTable.stories.tsx', mdx: 'components/ChatDataTable.mdx' },
  { id: 'ChatCollapsible', layer: 'Molecules', title: 'Molecules/ChatCollapsible', stories: 'components/ChatCollapsible.stories.tsx', mdx: 'components/ChatCollapsible.mdx' },
  { id: 'ChatEntityGrid', layer: 'Molecules', title: 'Molecules/ChatEntityGrid', stories: 'components/ChatEntityGrid.stories.tsx', mdx: 'components/ChatEntityGrid.mdx' },
  { id: 'ChatPhaseStrip', layer: 'Molecules', title: 'Molecules/ChatPhaseStrip', stories: 'components/ChatPhaseStrip.stories.tsx', mdx: 'components/ChatPhaseStrip.mdx' },
  { id: 'ChatMomentList', layer: 'Molecules', title: 'Molecules/ChatMomentList', stories: 'components/ChatMomentList.stories.tsx', mdx: 'components/ChatMomentList.mdx' },
  { id: 'ChatQuoteList', layer: 'Molecules', title: 'Molecules/ChatQuoteList', stories: 'components/ChatQuoteList.stories.tsx', mdx: 'components/ChatQuoteList.mdx' },
  { id: 'ChatCatalog', layer: 'Organisms', title: 'Organisms/ChatCatalog', stories: 'components/ChatCatalog.stories.tsx', mdx: 'components/ChatCatalog.mdx' },
  { id: 'BrandionTokenStudio', layer: 'Templates', title: 'Templates/BrandionTokenStudio', stories: 'components/BrandionTokenStudio.stories.tsx', mdx: 'components/BrandionTokenStudio.mdx' },
  // Print (magazine PDF visual twins — keep in sync with plexon pdf/magazine)
  { id: 'PrintPage', layer: 'Print', title: 'Print/Page', stories: 'print/PrintPage.stories.tsx', mdx: 'print/PrintPage.mdx' },
  { id: 'PrintCover', layer: 'Print', title: 'Print/Cover', stories: 'print/PrintCover.stories.tsx', mdx: 'print/PrintCover.mdx' },
  { id: 'PrintChapter', layer: 'Print', title: 'Print/Chapter', stories: 'print/PrintChapter.stories.tsx', mdx: 'print/PrintChapter.mdx' },
  { id: 'PrintScoreRing', layer: 'Print', title: 'Print/ScoreRing', stories: 'print/PrintScoreRing.stories.tsx', mdx: 'print/PrintScoreRing.mdx' },
  { id: 'PrintDonut', layer: 'Print', title: 'Print/Donut', stories: 'print/PrintDonut.stories.tsx', mdx: 'print/PrintDonut.mdx' },
  { id: 'PrintLedger', layer: 'Print', title: 'Print/Ledger', stories: 'print/PrintLedger.stories.tsx', mdx: 'print/PrintLedger.mdx' },
  { id: 'PrintRankedList', layer: 'Print', title: 'Print/RankedList', stories: 'print/PrintRankedList.stories.tsx', mdx: 'print/PrintRankedList.mdx' },
  { id: 'PrintTwoColumn', layer: 'Print', title: 'Print/TwoColumn', stories: 'print/PrintTwoColumn.stories.tsx', mdx: 'print/PrintTwoColumn.mdx' },
  { id: 'PrintPullQuote', layer: 'Print', title: 'Print/PullQuote', stories: 'print/PrintPullQuote.stories.tsx', mdx: 'print/PrintPullQuote.mdx' },
  { id: 'PrintCallout', layer: 'Print', title: 'Print/Callout', stories: 'print/PrintCallout.stories.tsx', mdx: 'print/PrintCallout.mdx' },
  { id: 'PrintSteps', layer: 'Print', title: 'Print/Steps', stories: 'print/PrintSteps.stories.tsx', mdx: 'print/PrintSteps.mdx' },
  { id: 'PrintPersonaGrid', layer: 'Print', title: 'Print/PersonaGrid', stories: 'print/PrintPersonaGrid.stories.tsx', mdx: 'print/PrintPersonaGrid.mdx' },
  { id: 'PrintTraitBars', layer: 'Print', title: 'Print/TraitBars', stories: 'print/PrintTraitBars.stories.tsx', mdx: 'print/PrintTraitBars.mdx' },
  { id: 'PrintTable', layer: 'Print', title: 'Print/Table', stories: 'print/PrintTable.stories.tsx', mdx: 'print/PrintTable.mdx' },
  { id: 'PrintChip', layer: 'Print', title: 'Print/Chip', stories: 'print/PrintChip.stories.tsx', mdx: 'print/PrintChip.mdx' },
  { id: 'PrintChipRow', layer: 'Print', title: 'Print/ChipRow', stories: 'print/PrintChipRow.stories.tsx', mdx: 'print/PrintChipRow.mdx' },
  { id: 'PrintPersonaCard', layer: 'Print', title: 'Print/PersonaCard', stories: 'print/PrintPersonaCard.stories.tsx', mdx: 'print/PrintPersonaCard.mdx' },
  { id: 'PrintQuickCheck', layer: 'Print', title: 'Print/QuickCheck', stories: 'print/PrintQuickCheck.stories.tsx', mdx: 'print/PrintQuickCheck.mdx' },
  // Mag (docs-only PDF kit — no react-pdf in Storybook canvas; twins under Print/)
  { id: 'MagOverview', layer: 'Mag', title: 'Mag/Overview', stories: 'mag/MagOverview.stories.tsx', mdx: 'mag/MagOverview.mdx' },
  { id: 'MagPage', layer: 'Mag', title: 'Mag/Page', stories: 'mag/MagPage.stories.tsx', mdx: 'mag/MagPage.mdx' },
  { id: 'MagCover', layer: 'Mag', title: 'Mag/Cover', stories: 'mag/MagCover.stories.tsx', mdx: 'mag/MagCover.mdx' },
  { id: 'MagChip', layer: 'Mag', title: 'Mag/Chip', stories: 'mag/MagChip.stories.tsx', mdx: 'mag/MagChip.mdx' },
  { id: 'Stack', layer: 'Atoms', title: 'Atoms/Stack', stories: 'components/Stack.stories.tsx', mdx: 'components/Stack.mdx' },
  { id: 'Card', layer: 'Atoms', title: 'Atoms/Card', stories: 'components/Card.stories.tsx', mdx: 'components/Card.mdx' },
  { id: 'Badge', layer: 'Atoms', title: 'Atoms/Badge', stories: 'components/Badge.stories.tsx', mdx: 'components/Badge.mdx' },
  { id: 'Heading', layer: 'Atoms', title: 'Atoms/Heading', stories: 'components/Heading.stories.tsx', mdx: 'components/Heading.mdx' },
  { id: 'Image', layer: 'Atoms', title: 'Atoms/Image', stories: 'components/Image.stories.tsx', mdx: 'components/Image.mdx' },
  { id: 'Link', layer: 'Atoms', title: 'Atoms/Link', stories: 'components/Link.stories.tsx', mdx: 'components/Link.mdx' },
  { id: 'Spacer', layer: 'Atoms', title: 'Atoms/Spacer', stories: 'components/Spacer.stories.tsx', mdx: 'components/Spacer.mdx' },
  { id: 'Grid', layer: 'Atoms', title: 'Atoms/Grid', stories: 'components/Grid.stories.tsx', mdx: 'components/Grid.mdx' },
  { id: 'CanvasViewport', layer: 'Organisms', title: 'Organisms/CanvasViewport', stories: 'components/CanvasViewport.stories.tsx', mdx: 'components/CanvasViewport.mdx' },
  { id: 'SelectionHandles', layer: 'Organisms', title: 'Organisms/SelectionHandles', stories: 'components/SelectionHandles.stories.tsx', mdx: 'components/SelectionHandles.mdx' },
  { id: 'PropertyInspector', layer: 'Organisms', title: 'Organisms/PropertyInspector', stories: 'components/PropertyInspector.stories.tsx', mdx: 'components/PropertyInspector.mdx' },
  { id: 'ComponentPalette', layer: 'Organisms', title: 'Organisms/ComponentPalette', stories: 'components/ComponentPalette.stories.tsx', mdx: 'components/ComponentPalette.mdx' },
  { id: 'LayersPanel', layer: 'Organisms', title: 'Organisms/LayersPanel', stories: 'components/LayersPanel.stories.tsx', mdx: 'components/LayersPanel.mdx' },
  { id: 'TokenPicker', layer: 'Organisms', title: 'Organisms/TokenPicker', stories: 'components/TokenPicker.stories.tsx', mdx: 'components/TokenPicker.mdx' },
  { id: 'SplitCraftMenu', layer: 'Molecules', title: 'Molecules/SplitCraftMenu', stories: 'components/SplitCraftMenu.stories.tsx', mdx: 'components/SplitCraftMenu.mdx' },
  { id: 'TokenPreview', layer: 'Molecules', title: 'Molecules/TokenPreview', stories: 'components/TokenPreview.stories.tsx', mdx: 'components/TokenPreview.mdx' },
  { id: 'TokenKindGlyph', layer: 'Molecules', title: 'Molecules/TokenKindGlyph', stories: 'components/TokenKindGlyph.stories.tsx', mdx: 'components/TokenKindGlyph.mdx' },
  { id: 'EasingCurveEditor', layer: 'Molecules', title: 'Molecules/EasingCurveEditor', stories: 'components/EasingCurveEditor.stories.tsx', mdx: 'components/EasingCurveEditor.mdx' },
  { id: 'GridEditor', layer: 'Molecules', title: 'Molecules/GridEditor', stories: 'components/GridEditor.stories.tsx', mdx: 'components/GridEditor.mdx' },
  { id: 'BreakpointEditor', layer: 'Molecules', title: 'Molecules/BreakpointEditor', stories: 'components/BreakpointEditor.stories.tsx', mdx: 'components/BreakpointEditor.mdx' },
  { id: 'FontFamilyPicker', layer: 'Molecules', title: 'Molecules/FontFamilyPicker', stories: 'components/FontFamilyPicker.stories.tsx', mdx: 'components/FontFamilyPicker.mdx' },
  { id: 'ToolButton', layer: 'Atoms', title: 'Atoms/ToolButton', stories: 'components/ToolButton.stories.tsx', mdx: 'components/ToolButton.mdx' },
  { id: 'Timecode', layer: 'Atoms', title: 'Atoms/Timecode', stories: 'components/Timecode.stories.tsx', mdx: 'components/Timecode.mdx' },
  { id: 'TransportBar', layer: 'Molecules', title: 'Molecules/TransportBar', stories: 'components/TransportBar.stories.tsx', mdx: 'components/TransportBar.mdx' },
  { id: 'MediaMonitor', layer: 'Organisms', title: 'Organisms/MediaMonitor', stories: 'components/MediaMonitor.stories.tsx', mdx: 'components/MediaMonitor.mdx' },
  { id: 'TimelineRuler', layer: 'Molecules', title: 'Molecules/TimelineRuler', stories: 'components/TimelineRuler.stories.tsx', mdx: 'components/TimelineRuler.mdx' },
  { id: 'TimelineTrack', layer: 'Molecules', title: 'Molecules/TimelineTrack', stories: 'components/TimelineTrack.stories.tsx', mdx: 'components/TimelineTrack.mdx' },
  { id: 'TimelineClip', layer: 'Molecules', title: 'Molecules/TimelineClip', stories: 'components/TimelineClip.stories.tsx', mdx: 'components/TimelineClip.mdx' },
  { id: 'Waveform', layer: 'Molecules', title: 'Molecules/Waveform', stories: 'components/Waveform.stories.tsx', mdx: 'components/Waveform.mdx' },
  { id: 'Chart', layer: 'Molecules', title: 'Molecules/Chart', stories: 'components/Chart.stories.tsx', mdx: 'components/Chart.mdx' },
  { id: 'SeriesChart', layer: 'Molecules', title: 'Molecules/SeriesChart', stories: 'components/SeriesChart.stories.tsx', mdx: 'components/SeriesChart.mdx' },
  { id: 'LabTile', layer: 'Molecules', title: 'Molecules/LabTile', stories: 'components/LabTile.stories.tsx', mdx: 'components/LabTile.mdx' },
  { id: 'KpiMetric', layer: 'Molecules', title: 'Molecules/KpiMetric', stories: 'components/KpiMetric.stories.tsx', mdx: 'components/KpiMetric.mdx' },
  { id: 'Gauge', layer: 'Molecules', title: 'Molecules/Gauge', stories: 'components/Gauge.stories.tsx', mdx: 'components/Gauge.mdx' },
  { id: 'WidgetGrid', layer: 'Organisms', title: 'Organisms/WidgetGrid', stories: 'components/WidgetGrid.stories.tsx', mdx: 'components/WidgetGrid.mdx' },
  { id: 'RadarChart', layer: 'Molecules', title: 'Molecules/RadarChart', stories: 'components/RadarChart.stories.tsx', mdx: 'components/RadarChart.mdx' },
]

export const VIEWPORT_CRITICAL = CATALOG.filter((e) => e.viewportCritical)

export const CATALOG_LAYER_ORDER: readonly CatalogLayer[] = [
  'Foundation',
  'Atoms',
  'Molecules',
  'Organisms',
  'Templates',
  'Print',
  'Mag',
]

const DOCS_IDS = new Set([
  'tokens',
  'typography',
  'motion',
  'MagOverview',
  'ChatCatalog',
  'BrandionTokenStudio',
  'InspectLayoutGlyphs',
  'TokenKindGlyph',
])

const TEMPLATE_IDS = new Set(['PrintQuickCheck'])

const COMPONENT_ALIASES: Record<string, string> = {
  DivergingBar: 'DivergingBarList',
  Icons: 'IconOverview',
  InspectLayoutGlyphs: 'SizeModeGlyph',
  PrintQuickCheck: 'PrintPage',
}

/** Mag catalog id → Print export (`PRINT_MAG_TWINS`). */
const MAG_PRINT_EXPORT: Record<string, string> = {
  MagPage: 'PrintPage',
  MagCover: 'PrintCover',
  MagChip: 'PrintChip',
  MagCallout: 'PrintCallout',
  MagSteps: 'PrintSteps',
}

export function catalogInsert(entry: CatalogEntry): CatalogInsert {
  if (entry.insert) return entry.insert
  if (DOCS_IDS.has(entry.id)) return 'docs'
  if (TEMPLATE_IDS.has(entry.id)) return 'template'
  if (entry.layer === 'Mag') return 'print-twin'
  return 'canvas'
}

/** Scene `type` CREATION should insert for this catalog entry. `docs` → null. */
export function catalogInsertType(entry: CatalogEntry): string | null {
  const mode = catalogInsert(entry)
  if (mode === 'docs') return null
  if (mode === 'print-twin') return MAG_PRINT_EXPORT[entry.id] ?? null
  if (mode === 'template') return COMPONENT_ALIASES[entry.id] ?? 'PrintPage'
  return entry.id
}

export function catalogComponentName(entry: CatalogEntry): string | null {
  const mode = catalogInsert(entry)
  if (mode === 'docs') return null
  if (mode === 'print-twin') return MAG_PRINT_EXPORT[entry.id] ?? null
  if (entry.component) return entry.component
  return COMPONENT_ALIASES[entry.id] ?? entry.id
}

export function insertableCatalogEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => catalogInsert(entry) !== 'docs')
}

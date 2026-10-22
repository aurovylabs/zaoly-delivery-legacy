'use client'

/**
 * Catalog id → React component. Spec: specs/domain/library-composition-roundtrip.md Phase 7.
 * Keep in sync with CATALOG; `pnpm ds:add` appends an import + map entry.
 * Next App Router: this module and hook-using primitives MUST stay client.
 */
import type { ComponentType } from 'react'
import { Accordion } from '../components/Accordion'
import { AddTile } from '../components/AddTile'
import { Alert } from '../components/Alert'
import { AppFrame } from '../components/AppFrame'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { BrandCorner } from '../components/BrandCorner'
import { BrandCornerProductMenu } from '../components/BrandCornerProductMenu'
import { BreakpointSwitcher } from '../components/BreakpointSwitcher'
import { Button } from '../components/Button'
import { CanvasViewport } from '../components/CanvasViewport'
import { Card } from '../components/Card'
import { CardActions } from '../components/CardActions'
import { ChannelLane, ChannelStack } from '../components/ChannelStack'
import { ChatAlertBlock } from '../components/ChatAlertBlock'
import { ChatBlockList } from '../components/ChatBlockList'
import { ChatBlockPanel } from '../components/ChatBlockPanel'
import { ChatCollapsible } from '../components/ChatCollapsible'
import { ChatDataTable } from '../components/ChatDataTable'
import { ChatEntityGrid } from '../components/ChatEntityGrid'
import { ChatKeyValueList } from '../components/ChatKeyValueList'
import { ChatLinkList } from '../components/ChatLinkList'
import { ChatMetricGrid } from '../components/ChatMetricGrid'
import { ChatMomentList } from '../components/ChatMomentList'
import { ChatOverlay } from '../components/ChatOverlay'
import { ChatPhaseStrip } from '../components/ChatPhaseStrip'
import { ChatQuoteList } from '../components/ChatQuoteList'
import { ChatStepList } from '../components/ChatStepList'
import { Checkbox } from '../components/Checkbox'
import { Chip } from '../components/Chip'
import { ComponentPalette } from '../components/ComponentPalette'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContextMenu } from '../components/ContextMenu'
import { DataTable } from '../components/DataTable'
import { Dialog } from '../components/Dialog'
import { Divider } from '../components/Divider'
import { DivergingBarList } from '../components/DivergingBar'
import { EmptyState, LoadingText } from '../components/LoadingText'
import { EntityCard } from '../components/EntityCard'
import { HubIndexCard } from '../components/HubIndexCard'
import { CollectionHubCard } from '../components/CollectionHubCard'
import { HubIndexLayoutSwitch } from '../components/HubIndexLayoutSwitch'
import { EventFooter } from '../components/EventFooter'
import { ExpressionField } from '../components/ExpressionField'
import { Field } from '../components/Field'
import { FilterRow } from '../components/FilterRow'
import { FloatingPanel } from '../components/FloatingPanel'
import { FlowBoardPalette } from '../components/FlowBoardPalette'
import { FlowBoardStage } from '../components/FlowBoardStage'
import { FlowBoardToolbar } from '../components/FlowBoardToolbar'
import { FlowInspectorShell } from '../components/FlowInspectorShell'
import { FlowNodeCard } from '../components/FlowNodeCard'
import { FlowNodeEditorShell } from '../components/FlowNodeEditorShell'
import { FlowRunStrip } from '../components/FlowRunStrip'
import { Flyout } from '../components/Flyout'
import { FormSection } from '../components/FormSection'
import { Grid } from '../components/Grid'
import { Heading } from '../components/Heading'
import { Hint } from '../components/Hint'
import { IconOverview } from '../components/icons'
import { Image } from '../components/Image'
import { InfoTip } from '../components/InfoTip'
import { Input } from '../components/Input'
import { InspectDock } from '../components/InspectDock'
import { InspectSection } from '../components/InspectSection'
import { InspectTabs } from '../components/InspectTabs'
import { JsonTree } from '../components/JsonTree'
import { KpiStrip } from '../components/KpiStrip'
import { KpiMetric } from '../components/KpiMetric'
import { LabTile } from '../components/LabTile'
import { LayersPanel } from '../components/LayersPanel'
import { Lede } from '../components/Lede'
import { Link } from '../components/Link'
import { MagazineContentsNav } from '../components/MagazineContentsNav'
import { MarkerCanvas } from '../components/MarkerCanvas'
import { MarkdownProse } from '../components/MarkdownProse'
import { Meter } from '../components/Meter'
import { MetricChip } from '../components/MetricChip'
import { NavRail } from '../components/NavRail'
import { SettingsShell } from '../components/SettingsShell'
import { AccentSwatchGroup } from '../components/AccentSwatchGroup'
import { PageTitle } from '../components/PageTitle'
import { Panel } from '../components/Panel'
import { PipelinePanel } from '../components/PipelinePanel'
import { PropertyInspector } from '../components/PropertyInspector'
import { RankedList, RankedRow } from '../components/RankedList'
import { SchemaTree } from '../components/SchemaTree'
import { ScrollArea } from '../components/ScrollArea'
import { Select } from '../components/Select'
import { SelectionHandles } from '../components/SelectionHandles'
import { ShellBackButton } from '../components/ShellBackButton'
import { Skeleton } from '../components/Skeleton'
import { Slider } from '../components/Slider'
import { Spacer } from '../components/Spacer'
import { Spinner } from '../components/Spinner'
import { Stack } from '../components/Stack'
import { StatusDot } from '../components/StatusDot'
import { StatusMeterPanel } from '../components/StatusMeterPanel'
import { StepStrip } from '../components/StepStrip'
import { SwatchStrip } from '../components/SwatchStrip'
import { ColorPicker } from '../components/ColorPicker'
import { Switch } from '../components/Switch'
import { Tabs } from '../components/Tabs'
import { TagInput } from '../components/TagInput'
import { Text } from '../components/Text'
import { Textarea } from '../components/Textarea'
import { Toast } from '../components/Toast'
import { ToggleGroup } from '../components/ToggleGroup'
import { EasingCurveEditor } from '../components/EasingCurveEditor'
import { BreakpointEditor } from '../components/BreakpointEditor'
import { FontFamilyPicker } from '../components/FontFamilyPicker'
import { GridEditor } from '../components/GridEditor'
import { TokenPicker } from '../components/TokenPicker'
import { SplitCraftMenu } from '../components/SplitCraftMenu'
import { TokenPreview } from '../components/TokenPreview'
import { Tooltip } from '../components/Tooltip'
import { TopStatus } from '../components/TopStatus'
import {
  PrintChapter,
  PrintChip,
  PrintChipRow,
  PrintCallout,
  PrintSteps,
  PrintCover,
  PrintDonut,
  PrintLedger,
  PrintPage,
  PrintPersonaCard,
  PrintPersonaGrid,
  PrintPullQuote,
  PrintRankedList,
  PrintScoreRing,
  PrintTable,
  PrintTraitBars,
  PrintTwoColumn,
} from '../print/PrintPrimitives'
import { SectionChrome } from '../SectionChrome'
import { ToolButton } from '../components/ToolButton'
import { Timecode } from '../components/Timecode'
import { TransportBar } from '../components/TransportBar'
import { MediaMonitor } from '../components/MediaMonitor'
import { TimelineRuler } from '../components/TimelineRuler'
import { TimelineTrack } from '../components/TimelineTrack'
import { TimelineClip } from '../components/TimelineClip'
import { Waveform } from '../components/Waveform'
import { Chart } from '../components/Chart'
import { SeriesChart } from '../components/SeriesChart'
import { Gauge } from '../components/Gauge'
import { WidgetGrid } from '../components/WidgetGrid'
import { RadarChart } from '../components/RadarChart'
import {
  CATALOG,
  catalogComponentName,
  catalogInsert,
  catalogInsertType,
  insertableCatalogEntries,
  type CatalogEntry,
} from './catalog'

export type CatalogComponent = ComponentType<Record<string, unknown>>

const CATALOG_COMPONENTS = {
  Accordion,
  AddTile,
  Alert,
  AppFrame,
  Avatar,
  Badge,
  BrandCorner,
  BrandCornerProductMenu,
  BreakpointSwitcher,
  Button,
  CanvasViewport,
  Card,
  CardActions,
  ChannelLane,
  ChannelStack,
  ChatAlertBlock,
  ChatBlockList,
  ChatBlockPanel,
  ChatCollapsible,
  ChatDataTable,
  ChatEntityGrid,
  ChatKeyValueList,
  ChatLinkList,
  ChatMetricGrid,
  ChatMomentList,
  ChatOverlay,
  ChatPhaseStrip,
  ChatQuoteList,
  ChatStepList,
  Checkbox,
  Chip,
  ColorPicker,
  ComponentPalette,
  ConfirmDialog,
  ContextMenu,
  DataTable,
  Dialog,
  Divider,
  DivergingBarList,
  EmptyState,
  EntityCard,
  EventFooter,
  ExpressionField,
  Field,
  FilterRow,
  FloatingPanel,
  FlowBoardPalette,
  FlowBoardStage,
  FlowBoardToolbar,
  FlowInspectorShell,
  FlowNodeCard,
  FlowNodeEditorShell,
  FlowRunStrip,
  Flyout,
  FormSection,
  HubIndexCard,
  CollectionHubCard,
  HubIndexLayoutSwitch,
  Grid,
  Heading,
  Hint,
  IconOverview,
  Image,
  InfoTip,
  Input,
  InspectDock,
  InspectSection,
  InspectTabs,
  JsonTree,
  KpiStrip,
  KpiMetric,
  LabTile,
  LayersPanel,
  Lede,
  Link,
  LoadingText,
  MagazineContentsNav,
  MarkerCanvas,
  MarkdownProse,
  Meter,
  MetricChip,
  NavRail,
  SettingsShell,
  AccentSwatchGroup,
  PageTitle,
  Panel,
  PipelinePanel,
  PrintChapter,
  PrintChip,
  PrintChipRow,
  PrintCallout,
  PrintSteps,
  PrintCover,
  PrintDonut,
  PrintLedger,
  PrintPage,
  PrintPersonaCard,
  PrintPersonaGrid,
  PrintPullQuote,
  PrintRankedList,
  PrintScoreRing,
  PrintTable,
  PrintTraitBars,
  PrintTwoColumn,
  PropertyInspector,
  RankedList,
  RankedRow,
  SchemaTree,
  ScrollArea,
  Select,
  SelectionHandles,
  ShellBackButton,
  Skeleton,
  Slider,
  Spacer,
  Spinner,
  Stack,
  StatusDot,
  StatusMeterPanel,
  StepStrip,
  SwatchStrip,
  Switch,
  Tabs,
  TagInput,
  Text,
  Textarea,
  Toast,
  ToggleGroup,
  EasingCurveEditor,
  GridEditor,
  BreakpointEditor,
  FontFamilyPicker,
  TokenPicker,
  SplitCraftMenu,
  TokenPreview,
  Tooltip,
  TopStatus,
  SectionChrome,
  ToolButton,
  Timecode,
  TransportBar,
  MediaMonitor,
  TimelineRuler,
  TimelineTrack,
  TimelineClip,
  Waveform,
  Chart,
  SeriesChart,
  Gauge,
  WidgetGrid,
  RadarChart,
} as unknown as Record<string, CatalogComponent>

export {
  catalogInsert,
  catalogInsertType,
  catalogComponentName,
  insertableCatalogEntries,
}

export function catalogComponent(id: string): CatalogComponent | null {
  const entry: CatalogEntry | undefined = CATALOG.find((item) => item.id === id)
  if (!entry) return null
  if (catalogInsert(entry) === 'docs') return null
  const name = catalogComponentName(entry)
  if (!name) return null
  return (CATALOG_COMPONENTS as Record<string, CatalogComponent>)[name] ?? null
}

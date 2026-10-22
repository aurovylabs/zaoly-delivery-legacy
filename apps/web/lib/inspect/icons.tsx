import type { ComponentType, ReactNode } from 'react'
import {
  AspectRatioGlyph,
  BorderStyleGlyph,
  GapAxisGlyph,
  OverflowGlyph,
  SelfParkGlyph,
  TextAlignGlyph,
  TransformOriginGlyph,
  WrapGlyph,
  aspectRatioGlyphId,
  borderStyleGlyphId,
  overflowGlyphId,
  selfParkGlyphId,
  textAlignGlyphId,
  transformOriginGlyphId,
  wrapGlyphId,
} from '../../components/inspect-mode-glyphs'
import {
  GridColumnGlyph,
  columnGlyphForPresetLabel,
} from '../../components/inspect-grid-glyphs'
import {
  IconAlignEnd,
  IconAlignLeft,
  IconAlignMiddle,
  IconAlignStart,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconBadge,
  IconBan,
  IconBaseline,
  IconBlur,
  IconBox,
  IconButton,
  IconCard,
  IconCaseLower,
  IconCaseTitle,
  IconCaseUpper,
  IconCheck,
  IconChevronDown,
  IconCircle,
  IconColumns,
  IconDanger,
  IconEdit,
  IconFill,
  IconGap,
  IconGhost,
  IconGrid,
  IconHeading,
  IconHeight,
  IconImage,
  IconInput,
  IconJustifyCenter,
  IconJustifyEnd,
  IconJustifyStart,
  IconLink,
  IconLock,
  IconMaximize,
  IconMinimize,
  IconMinus,
  IconMove,
  IconOpacity,
  IconPadding,
  IconMargin,
  IconRadius,
  IconRotate,
  IconRows,
  IconTableAddRow,
  IconTableAddColumn,
  IconScroll,
  IconShadow,
  IconSpaceAround,
  IconSpaceBetween,
  IconSpacer,
  IconSparkles,
  IconStack,
  IconStretch,
  IconStrikethrough,
  IconSuccess,
  IconText,
  IconType,
  IconFontSize,
  IconFontWeight,
  IconUnderline,
  IconWarning,
  IconWidth,
  IconWrap,
  type IconProps,
} from '@zaoly/ui'
import {
  IconBordersAll,
  IconBordersNone,
  IconBordersRow,
  IconDensityComfortable,
  IconDensityCompact,
  IconDensityDefault,
} from '../zaoly-ui'

function glyph(Icon: ComponentType<IconProps> | undefined): ReactNode {
  return Icon ? <Icon size={14} /> : null
}

const PROP_ICONS: Record<string, ComponentType<IconProps>> = {
  width: IconWidth,
  minWidth: IconWidth,
  maxWidth: IconWidth,
  height: IconHeight,
  minHeight: IconHeight,
  maxHeight: IconHeight,
  gap: IconGap,
  rowGap: IconGap,
  columnGap: IconGap,
  padding: IconPadding,
  paddingTop: IconPadding,
  paddingBottom: IconPadding,
  paddingLeft: IconPadding,
  paddingRight: IconPadding,
  paddingBlock: IconPadding,
  paddingInline: IconPadding,
  margin: IconMargin,
  marginTop: IconMargin,
  marginBottom: IconMargin,
  marginLeft: IconMargin,
  marginRight: IconMargin,
  marginBlock: IconMargin,
  marginInline: IconMargin,
  table_add_row: IconTableAddRow,
  table_add_column: IconTableAddColumn,
  openAssetLibrary: IconImage,
  openSvgDeepEdit: IconEdit,
  direction: IconRows,
  align: IconAlignMiddle,
  alignItems: IconAlignMiddle,
  alignSelf: IconAlignMiddle,
  alignContent: IconAlignMiddle,
  justify: IconJustifyCenter,
  justifyContent: IconJustifyCenter,
  wrap: IconWrap,
  overflow: IconBox,
  textAlign: IconAlignLeft,
  fontSize: IconFontSize,
  fontFamily: IconType,
  fontWeight: IconFontWeight,
  lineHeight: IconBaseline,
  letterSpacing: IconBaseline,
  textDecoration: IconUnderline,
  textTransform: IconCaseUpper,
  fill: IconFill,
  color: IconFill,
  background: IconFill,
  gradient: IconFill,
  radius: IconRadius,
  radiusTopLeft: IconRadius,
  radiusTopRight: IconRadius,
  radiusBottomRight: IconRadius,
  radiusBottomLeft: IconRadius,
  borderRadius: IconRadius,
  borderStyle: IconBox,
  borderColor: IconFill,
  borderWidth: IconPadding,
  rotate: IconRotate,
  opacity: IconOpacity,
  blur: IconBlur,
  shadow: IconShadow,
  href: IconLink,
  src: IconImage,
  alt: IconImage,
  placeholder: IconInput,
  label: IconType,
  checked: IconCheck,
  children: IconType,
  name: IconEdit,
  level: IconHeading,
  variant: IconButton,
  size: IconMinimize,
  tone: IconBadge,
  role: IconType,
  columns: IconColumns,
  axis: IconMove,
  disabled: IconBan,
  selected: IconCheck,
  orientation: IconRows,
  shape: IconCircle,
  layout: IconStack,
  hint: IconType,
  error: IconWarning,
  panel: IconCard,
  displayName: IconEdit,
  title: IconHeading,
  unit: IconType,
  valueLabel: IconType,
  hairline: IconMinus,
  kind: IconType,
  index: IconType,
  barPct: IconWidth,
  primary: IconType,
  secondary: IconType,
  summary: IconType,
  live: IconCircle,
  compact: IconMinimize,
  defaultOpen: IconChevronDown,
  as: IconHeading,
  metaTone: IconType,
  segment: IconBadge,
  confidence: IconCircle,
  bio: IconType,
  spread: IconMaximize,
}

const TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
  Stack: IconStack,
  Button: IconButton,
  Text: IconText,
  Input: IconInput,
  Card: IconCard,
  Image: IconImage,
  SiteImage: IconImage,
  SiteSvg: IconImage,
  SiteShape: IconImage,
  SiteChart: IconRows,
  SiteGauge: IconCircle,
  SiteBadge: IconBadge,
  Heading: IconHeading,
  Grid: IconGrid,
  Link: IconLink,
  Badge: IconBadge,
  Spacer: IconSpacer,
  Checkbox: IconCheck,
  Select: IconChevronDown,
  Switch: IconCircle,
  Textarea: IconInput,
  Chip: IconBadge,
  Divider: IconMinus,
  Avatar: IconCircle,
  Alert: IconWarning,
  Hint: IconType,
  Spinner: IconRotate,
  StatusDot: IconCircle,
  EmptyState: IconText,
  Slider: IconWidth,
  Field: IconInput,
  Panel: IconCard,
  Tabs: IconRows,
  Accordion: IconChevronDown,
  LoadingText: IconType,
  PageTitle: IconHeading,
  AddTile: IconMaximize,
  TagInput: IconBadge,
  ToggleGroup: IconRows,
  Instance: IconBox,
  MetricChip: IconBadge,
  Meter: IconWidth,
  Chart: IconRows,
  Gauge: IconCircle,
  Lede: IconHeading,
  ScrollArea: IconScroll,
  FormSection: IconStack,
  CardActions: IconButton,
  FilterRow: IconRows,
  SectionChrome: IconHeading,
  RankedRow: IconRows,
  RankedList: IconRows,
  TopStatus: IconCircle,
  EventFooter: IconType,
  EntityCard: IconCard,
  ChannelStack: IconStack,
  ChannelLane: IconChevronDown,
  StepStrip: IconRows,
  KpiStrip: IconBadge,
  DivergingBar: IconWidth,
  PrintPage: IconCard,
  PrintChapter: IconHeading,
  PrintCover: IconImage,
  PrintPullQuote: IconType,
  PrintCallout: IconCard,
  PrintSteps: IconRows,
  PrintScoreRing: IconCircle,
  PrintChip: IconBadge,
  PrintChipRow: IconRows,
  PrintTwoColumn: IconColumns,
  PrintDonut: IconCircle,
  PrintRankedList: IconRows,
  PrintLedger: IconRows,
  PrintTraitBars: IconWidth,
  PrintTable: IconGrid,
  PrintPersonaCard: IconCard,
  PrintPersonaGrid: IconGrid,
  SiteTable: IconTableAddRow,
  SiteTableRow: IconRows,
  SiteTableCell: IconColumns,
}

const ALIGN_VALUE: Record<string, ComponentType<IconProps>> = {
  auto: IconBox,
  'flex-start': IconAlignStart,
  start: IconAlignStart,
  center: IconAlignMiddle,
  'flex-end': IconAlignEnd,
  end: IconAlignEnd,
  stretch: IconStretch,
}

const JUSTIFY_VALUE: Record<string, ComponentType<IconProps>> = {
  'flex-start': IconJustifyStart,
  start: IconJustifyStart,
  center: IconJustifyCenter,
  'flex-end': IconJustifyEnd,
  end: IconJustifyEnd,
  'space-between': IconSpaceBetween,
  'space-around': IconSpaceAround,
}

const DIRECTION_VALUE: Record<string, ComponentType<IconProps>> = {
  column: IconArrowDown,
  row: IconArrowRight,
  'column-reverse': IconArrowUp,
  'row-reverse': IconArrowLeft,
}

const DECORATION_VALUE: Record<string, ComponentType<IconProps>> = {
  none: IconBan,
  underline: IconUnderline,
  'line-through': IconStrikethrough,
}

const TRANSFORM_VALUE: Record<string, ComponentType<IconProps>> = {
  none: IconBan,
  uppercase: IconCaseUpper,
  lowercase: IconCaseLower,
  capitalize: IconCaseTitle,
}

const VARIANT_VALUE: Record<string, ComponentType<IconProps>> = {
  primary: IconFill,
  secondary: IconPadding,
  ghost: IconGhost,
  editorial: IconType,
  default: IconBox,
  flush: IconGhost,
  card: IconCard,
  chip: IconBadge,
  icon: IconSparkles,
  magazine: IconType,
  toolbar: IconRows,
}

const SIZE_VALUE: Record<string, ComponentType<IconProps>> = {
  xs: IconMinimize,
  sm: IconMinimize,
  md: IconBox,
  lg: IconMaximize,
  xl: IconMaximize,
}

const TONE_VALUE: Record<string, ComponentType<IconProps>> = {
  neutral: IconCircle,
  accent: IconSparkles,
  success: IconSuccess,
  warning: IconWarning,
  danger: IconDanger,
  error: IconDanger,
  ok: IconSuccess,
  info: IconCircle,
  default: IconCircle,
  muted: IconMinimize,
  solid: IconMaximize,
  pos: IconSuccess,
  low: IconWarning,
  neg: IconDanger,
  choice: IconSparkles,
  advanced: IconLock,
}

const AXIS_VALUE: Record<string, ComponentType<IconProps>> = {
  x: IconWidth,
  y: IconHeight,
  both: IconMove,
}

/** Accessible name for icon chips — unicode arrows become the contract value. */
export function inspectOptionLabel(value: string, label: string): string {
  if (/^[↓→↑←]$/.test(label)) return value
  return label
}

export function inspectPropIcon(name: string): ReactNode {
  return glyph(PROP_ICONS[name])
}

export function paletteTypeIcon(type: string): ReactNode {
  return glyph(TYPE_ICONS[type] ?? IconBox)
}

export function inspectEnumIcon(prop: string, value: string): ReactNode {
  if (prop === 'density') {
    if (value === 'compact') return glyph(IconDensityCompact)
    if (value === 'default') return glyph(IconDensityDefault)
    if (value === 'comfortable') return glyph(IconDensityComfortable)
  }
  if (prop === 'borders') {
    if (value === 'none') return glyph(IconBordersNone)
    if (value === 'row') return glyph(IconBordersRow)
    if (value === 'all') return glyph(IconBordersAll)
  }
  if (prop === 'direction') return glyph(DIRECTION_VALUE[value])
  if (prop === 'align' || prop === 'alignItems' || prop === 'alignContent') {
    return glyph(ALIGN_VALUE[value])
  }
  if (prop === 'alignSelf') {
    return <SelfParkGlyph id={selfParkGlyphId(value)} axis="v" />
  }
  if (prop === 'justifySelf') {
    return <SelfParkGlyph id={selfParkGlyphId(value)} axis="h" />
  }
  if (prop === 'justify' || prop === 'justifyContent') return glyph(JUSTIFY_VALUE[value])
  if (prop === 'textAlign') {
    return <TextAlignGlyph id={textAlignGlyphId(value)} />
  }
  if (prop === 'aspectRatio') {
    return <AspectRatioGlyph id={aspectRatioGlyphId(value)} />
  }
  if (prop === 'transformOrigin') {
    return <TransformOriginGlyph id={transformOriginGlyphId(value)} />
  }
  if (prop === 'overflow') {
    return <OverflowGlyph id={overflowGlyphId(value)} />
  }
  if (prop === 'textDecoration') return glyph(DECORATION_VALUE[value])
  if (prop === 'textTransform') return glyph(TRANSFORM_VALUE[value])
  if (prop === 'borderStyle') {
    return <BorderStyleGlyph id={borderStyleGlyphId(value)} />
  }
  if (prop === 'variant') return glyph(VARIANT_VALUE[value])
  if (prop === 'size') return glyph(SIZE_VALUE[value])
  if (prop === 'tone') return glyph(TONE_VALUE[value])
  if (prop === 'axis') return glyph(AXIS_VALUE[value])
  if (prop === 'columns') {
    return <GridColumnGlyph id={columnGlyphForPresetLabel(`${value} Col`)} />
  }
  if (prop === 'orientation') {
    if (value === 'horizontal') return <GapAxisGlyph id="row" />
    if (value === 'vertical') return <GapAxisGlyph id="column" />
    if (value === 'both') return <GapAxisGlyph id="both" />
  }
  if (prop === 'shape') {
    if (value === 'square') return glyph(IconBox)
    if (value === 'round') return glyph(IconCircle)
  }
  if (prop === 'layout') {
    if (value === 'stack') return glyph(IconStack)
    if (value === 'inline') return glyph(IconRows)
  }
  if (prop === 'level') {
    if (value === 'ok') return glyph(IconSuccess)
    if (value === 'warn') return glyph(IconWarning)
    if (value === 'critical') return glyph(IconDanger)
  }
  if (prop === 'wrap') {
    const wrapId = wrapGlyphId(value === 'true' ? 'wrap' : value === 'false' ? 'nowrap' : value)
    return <WrapGlyph id={wrapId} />
  }
  if (value === 'true') return glyph(prop === 'disabled' ? IconLock : IconCheck)
  if (value === 'false') return glyph(prop === 'disabled' ? IconBan : IconMinus)
  return null
}

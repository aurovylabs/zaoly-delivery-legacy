/**
 * Typed component-contract registry for CREATION editor inspect (P16 / P23).
 * Hand-maintained mirror of @zaoly/ui prop surfaces — bridge until live CEM.
 * P23: Penpot-dense keep-props (padding sides, min/max, type, blur/rotate, token gap).
 */

export type ContractPropKind = 'string' | 'enum' | 'boolean' | 'token' | 'readonly'

export type ContractTokenGroup =
  | 'space'
  | 'size'
  | 'radius'
  | 'opacity'
  | 'shadow'
  | 'color'
  | 'fontSize'
  | 'fontWeight'
  | 'fontFamily'
  | 'lineHeight'
  | 'letterSpacing'
  | 'blur'
  | 'rotate'
  | 'gradient'

export type ContractSectionId =
  | 'component'
  | 'layout'
  | 'constraints'
  | 'appearance'
  | 'typography'
  | 'fill'
  | 'semantics'

export type ContractControl = 'select' | 'segmented'

export type ContractPropDef = {
  name: string
  label: string
  kind: ContractPropKind
  section: ContractSectionId
  options?: Array<{ value: string; label: string }>
  tokenGroup?: ContractTokenGroup
  defaultValue?: string
  /** Short enum/boolean axes use ToggleGroup; default select. */
  control?: ContractControl
}

export type ComponentContract = {
  type: string
  /** Props unique to this type (shared style tokens applied separately). */
  props: ContractPropDef[]
}

function tok(
  name: string,
  label: string,
  section: ContractSectionId,
  tokenGroup: ContractTokenGroup,
): ContractPropDef {
  return { name, label, kind: 'token', section, tokenGroup }
}

function en(
  name: string,
  label: string,
  section: ContractSectionId,
  options: Array<{ value: string; label: string }>,
  defaultValue?: string,
  control: ContractControl = 'select',
): ContractPropDef {
  return { name, label, kind: 'enum', section, options, defaultValue, control }
}

function bool(
  name: string,
  label: string,
  section: ContractSectionId,
  defaultValue = 'false',
  control: ContractControl = 'segmented',
): ContractPropDef {
  return { name, label, kind: 'boolean', section, defaultValue, control }
}

const META_PROPS: ContractPropDef[] = [
  { name: 'type', label: 'Type', kind: 'readonly', section: 'component' },
  { name: 'id', label: 'Id', kind: 'readonly', section: 'component' },
  { name: 'name', label: 'Name', kind: 'string', section: 'component' },
]

const DIRECTION_OPTIONS = [
  { value: 'column', label: '↓' },
  { value: 'row', label: '→' },
  { value: 'column-reverse', label: '↑' },
  { value: 'row-reverse', label: '←' },
]

const ALIGN_OPTIONS = [
  { value: 'stretch', label: 'stretch' },
  { value: 'flex-start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'end' },
]

const JUSTIFY_OPTIONS = [
  { value: 'flex-start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'end' },
  { value: 'space-between', label: 'between' },
  { value: 'space-around', label: 'around' },
]

const ALIGN_CONTENT_OPTIONS = [
  { value: 'stretch', label: 'stretch' },
  { value: 'flex-start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'end' },
  { value: 'space-between', label: 'between' },
]

const ALIGN_SELF_OPTIONS = [
  { value: 'auto', label: 'auto' },
  { value: 'stretch', label: 'stretch' },
  { value: 'flex-start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'end' },
]

const OVERFLOW_OPTIONS = [
  { value: 'visible', label: 'visible' },
  { value: 'hidden', label: 'hidden' },
  { value: 'scroll', label: 'scroll' },
  { value: 'auto', label: 'auto' },
]

const BORDER_STYLE_OPTIONS = [
  { value: 'none', label: 'none' },
  { value: 'solid', label: 'solid' },
  { value: 'dashed', label: 'dashed' },
  { value: 'dotted', label: 'dotted' },
]

/** Mag + CSS twin vocabulary — never start/end (those silently drop in Mag). */
const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'left' },
  { value: 'center', label: 'center' },
  { value: 'right', label: 'right' },
  { value: 'justify', label: 'justify' },
]

const TEXT_DECORATION_OPTIONS = [
  { value: 'none', label: 'none' },
  { value: 'underline', label: 'underline' },
  { value: 'line-through', label: 'strike' },
]

const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'Roman' },
  { value: 'italic', label: 'Italic' },
]

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'none' },
  { value: 'uppercase', label: 'AA' },
  { value: 'lowercase', label: 'aa' },
  { value: 'capitalize', label: 'Aa' },
]

const POSITION_OPTIONS = ['static', 'relative', 'absolute', 'sticky', 'fixed'].map((value) => ({ value, label: value }))
const ASPECT_RATIO_OPTIONS = [
  { value: 'auto', label: 'auto' }, { value: '1 / 1', label: '1:1' },
  { value: '16 / 9', label: '16:9' }, { value: '4 / 3', label: '4:3' },
  { value: '3 / 2', label: '3:2' }, { value: '21 / 9', label: '21:9' },
]
export const TAG_OPTIONS = ['div', 'section', 'nav', 'header', 'footer', 'main', 'article', 'aside', 'form', 'p', 'span'].map((value) => ({ value, label: value }))
export const ROLE_OPTIONS = ['none', 'banner', 'navigation', 'main', 'contentinfo', 'complementary', 'search', 'region', 'button', 'dialog', 'alert', 'status'].map((value) => ({ value, label: value }))
export const BLEND_MODE_OPTIONS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'].map((value) => ({ value, label: value }))
export const TRANSFORM_ORIGIN_OPTIONS = ['center', 'top left', 'top', 'top right', 'right', 'bottom right', 'bottom', 'bottom left', 'left'].map((value) => ({ value, label: value }))
export const OBJECT_FIT_OPTIONS = ['cover', 'contain', 'fill', 'none', 'scale-down'].map((value) => ({ value, label: value }))
export const OBJECT_POSITION_OPTIONS = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'].map((value) => ({ value, label: value }))
export const MEDIA_LOADING_OPTIONS = ['lazy', 'eager'].map((value) => ({ value, label: value }))
export const GRID_AUTO_FLOW_OPTIONS = ['row', 'column', 'row dense', 'column dense'].map((value) => ({ value, label: value }))
export const GRID_ITEM_ALIGN_OPTIONS = ['stretch', 'start', 'center', 'end'].map((value) => ({ value, label: value }))
export const GRID_COL_SPAN_OPTIONS = ['auto', 'span 1', 'span 2', 'span 3', 'span 4', 'span 6', 'span 8', 'span 12', '1 / -1'].map((value) => ({ value, label: value }))
export const GRID_ROW_SPAN_OPTIONS = ['auto', 'span 1', 'span 2', 'span 3', 'span 4', '1 / -1'].map((value) => ({ value, label: value }))
export const GRID_JUSTIFY_SELF_OPTIONS = ['auto', 'stretch', 'start', 'center', 'end'].map((value) => ({ value, label: value }))
export const BACKGROUND_SIZE_OPTIONS = ['cover', 'contain', 'auto'].map((value) => ({ value, label: value }))
export const BACKGROUND_POSITION_OPTIONS = ['center', 'top', 'bottom', 'left', 'right'].map((value) => ({ value, label: value }))
export const BACKGROUND_REPEAT_OPTIONS = ['no-repeat', 'repeat'].map((value) => ({ value, label: value }))

const SHARED_STYLE_PROPS: ContractPropDef[] = [
  tok('padding', 'Padding', 'layout', 'space'),
  tok('paddingTop', 'Padding top', 'layout', 'space'),
  tok('paddingRight', 'Padding right', 'layout', 'space'),
  tok('paddingBottom', 'Padding bottom', 'layout', 'space'),
  tok('paddingLeft', 'Padding left', 'layout', 'space'),
  tok('paddingBlock', 'Padding block', 'layout', 'space'),
  tok('paddingInline', 'Padding inline', 'layout', 'space'),
  tok('margin', 'Margin', 'layout', 'space'),
  tok('marginTop', 'Margin top', 'layout', 'space'),
  tok('marginRight', 'Margin right', 'layout', 'space'),
  tok('marginBottom', 'Margin bottom', 'layout', 'space'),
  tok('marginLeft', 'Margin left', 'layout', 'space'),
  tok('marginBlock', 'Margin block', 'layout', 'space'),
  tok('marginInline', 'Margin inline', 'layout', 'space'),
  tok('width', 'Width', 'constraints', 'size'),
  tok('height', 'Height', 'constraints', 'size'),
  tok('minWidth', 'Min W', 'constraints', 'size'),
  tok('maxWidth', 'Max W', 'constraints', 'size'),
  tok('minHeight', 'Min H', 'constraints', 'size'),
  tok('maxHeight', 'Max H', 'constraints', 'size'),
  en('position', 'Position', 'constraints', POSITION_OPTIONS, 'static', 'segmented'),
  tok('top', 'Top', 'constraints', 'space'),
  tok('right', 'Right', 'constraints', 'space'),
  tok('bottom', 'Bottom', 'constraints', 'space'),
  tok('left', 'Left', 'constraints', 'space'),
  { name: 'zIndex', label: 'Z-index', kind: 'string', section: 'constraints' },
  en('aspectRatio', 'Aspect ratio', 'constraints', ASPECT_RATIO_OPTIONS, 'auto', 'segmented'),
  { name: 'flexGrow', label: 'Grow', kind: 'string', section: 'constraints' },
  { name: 'flexShrink', label: 'Shrink', kind: 'string', section: 'constraints' },
  tok('flexBasis', 'Basis', 'constraints', 'size'),
  en('alignSelf', 'Align self', 'constraints', ALIGN_SELF_OPTIONS, undefined, 'segmented'),
  en('alignItems', 'Align items', 'layout', ALIGN_OPTIONS, undefined, 'segmented'),
  en('justifyContent', 'Justify', 'layout', JUSTIFY_OPTIONS, undefined, 'segmented'),
  tok('radius', 'Radius', 'appearance', 'radius'),
  tok('radiusTopLeft', 'Radius TL', 'appearance', 'radius'),
  tok('radiusTopRight', 'Radius TR', 'appearance', 'radius'),
  tok('radiusBottomRight', 'Radius BR', 'appearance', 'radius'),
  tok('radiusBottomLeft', 'Radius BL', 'appearance', 'radius'),
  tok('clipInsetTopLeftX', 'Clip TL X', 'appearance', 'space'),
  tok('clipInsetTopLeftY', 'Clip TL Y', 'appearance', 'space'),
  tok('clipInsetTopRightX', 'Clip TR X', 'appearance', 'space'),
  tok('clipInsetTopRightY', 'Clip TR Y', 'appearance', 'space'),
  tok('clipInsetBottomRightX', 'Clip BR X', 'appearance', 'space'),
  tok('clipInsetBottomRightY', 'Clip BR Y', 'appearance', 'space'),
  tok('clipInsetBottomLeftX', 'Clip BL X', 'appearance', 'space'),
  tok('clipInsetBottomLeftY', 'Clip BL Y', 'appearance', 'space'),
  /** Phase C free polygon interior (CL18–CL19) — not token-bound. */
  { name: 'clipPolygon', label: 'Clip polygon', kind: 'string', section: 'appearance' },
  /** Phase D CSS path() clip data (CL27–CL28) — not token-bound. */
  { name: 'clipPathD', label: 'Clip path d', kind: 'string', section: 'appearance' },
  tok('rowGap', 'Row gap', 'layout', 'space'),
  tok('columnGap', 'Column gap', 'layout', 'space'),
  tok('opacity', 'Opacity', 'appearance', 'opacity'),
  tok('shadow', 'Shadow', 'appearance', 'shadow'),
  tok('blur', 'Blur', 'appearance', 'blur'),
  tok('rotate', 'Rotate', 'constraints', 'rotate'),
  { name: 'scale', label: 'Scale', kind: 'string', section: 'constraints' },
  { name: 'scaleX', label: 'Scale X', kind: 'string', section: 'constraints' },
  { name: 'scaleY', label: 'Scale Y', kind: 'string', section: 'constraints' },
  { name: 'skewX', label: 'Skew X', kind: 'string', section: 'constraints' },
  { name: 'skewY', label: 'Skew Y', kind: 'string', section: 'constraints' },
  en('transformOrigin', 'Origin', 'constraints', TRANSFORM_ORIGIN_OPTIONS, 'center'),
  en('overflow', 'Overflow', 'appearance', OVERFLOW_OPTIONS, undefined, 'segmented'),
  en('mixBlendMode', 'Blend mode', 'appearance', BLEND_MODE_OPTIONS, 'normal'),
  en('objectFit', 'Object fit', 'appearance', OBJECT_FIT_OPTIONS, 'cover'),
  en('objectPosition', 'Object pos', 'appearance', OBJECT_POSITION_OPTIONS, 'center'),
  ...['filterBrightness', 'filterContrast', 'filterSaturate', 'filterGrayscale', 'filterInvert', 'filterHueRotate'].map((name) => ({ name, label: name, kind: 'string' as const, section: 'appearance' as const })),
  { name: 'gridTemplateColumns', label: 'Grid columns', kind: 'string', section: 'layout' },
  { name: 'gridTemplateRows', label: 'Grid rows', kind: 'string', section: 'layout' },
  en('gridAutoFlow', 'Auto flow', 'layout', GRID_AUTO_FLOW_OPTIONS, 'row'),
  { name: 'gridAutoRows', label: 'Auto rows', kind: 'string', section: 'layout' },
  { name: 'gridAutoColumns', label: 'Auto cols', kind: 'string', section: 'layout' },
  en('justifyItems', 'Justify items', 'layout', GRID_ITEM_ALIGN_OPTIONS, 'stretch', 'segmented'),
  en('colSpan', 'Col span', 'constraints', GRID_COL_SPAN_OPTIONS),
  { name: 'colStart', label: 'Col start', kind: 'string', section: 'constraints' },
  { name: 'colEnd', label: 'Col end', kind: 'string', section: 'constraints' },
  en('rowSpan', 'Row span', 'constraints', GRID_ROW_SPAN_OPTIONS),
  { name: 'rowStart', label: 'Row start', kind: 'string', section: 'constraints' },
  { name: 'rowEnd', label: 'Row end', kind: 'string', section: 'constraints' },
  en('justifySelf', 'Justify self', 'constraints', GRID_JUSTIFY_SELF_OPTIONS, undefined, 'segmented'),
  { name: 'order', label: 'Order', kind: 'string', section: 'constraints' },
  tok('fontFamily', 'Font', 'typography', 'fontFamily'),
  tok('fontSize', 'Size', 'typography', 'fontSize'),
  tok('fontWeight', 'Weight', 'typography', 'fontWeight'),
  en('fontStyle', 'Style', 'typography', FONT_STYLE_OPTIONS, 'normal', 'segmented'),
  tok('lineHeight', 'Line height', 'typography', 'lineHeight'),
  tok('letterSpacing', 'Letter spacing', 'typography', 'letterSpacing'),
  en('textAlign', 'Align', 'typography', TEXT_ALIGN_OPTIONS, undefined, 'segmented'),
  en('textDecoration', 'Decoration', 'typography', TEXT_DECORATION_OPTIONS, undefined, 'segmented'),
  en('textTransform', 'Transform', 'typography', TEXT_TRANSFORM_OPTIONS, undefined, 'segmented'),
  tok('color', 'Color', 'fill', 'color'),
  tok('background', 'Fill', 'fill', 'color'),
  tok('gradient', 'Gradient', 'fill', 'gradient'),
  tok('borderColor', 'Border color', 'fill', 'color'),
  tok('borderWidth', 'Border width', 'fill', 'space'),
  en('borderStyle', 'Border style', 'fill', BORDER_STYLE_OPTIONS, undefined, 'segmented'),
  { name: 'backgroundImage', label: 'BG Image', kind: 'string', section: 'fill' },
  en('backgroundSize', 'BG Size', 'fill', BACKGROUND_SIZE_OPTIONS, 'cover', 'segmented'),
  en('backgroundPosition', 'BG Position', 'fill', BACKGROUND_POSITION_OPTIONS, 'center', 'segmented'),
  en('backgroundRepeat', 'BG Repeat', 'fill', BACKGROUND_REPEAT_OPTIONS, 'no-repeat', 'segmented'),
  { name: 'backgroundOverlay', label: 'BG Overlay', kind: 'string', section: 'fill' },
  en('tag', 'HTML Tag', 'semantics', TAG_OPTIONS, 'div'),
  en('role', 'ARIA Role', 'semantics', ROLE_OPTIONS),
  { name: 'ariaLabel', label: 'Aria label', kind: 'string', section: 'semantics' },
  bool('ariaHidden', 'Aria hidden', 'semantics'),
  { name: 'ariaDescribedBy', label: 'Described by', kind: 'string', section: 'semantics' },
  { name: 'tabIndex', label: 'Tab index', kind: 'string', section: 'semantics' },
  bool('disabled', 'Disabled', 'semantics'),
  bool('required', 'Required', 'semantics'),
  bool('readOnly', 'Read only', 'semantics'),
  { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'semantics' },
]

const PRINT_TYPES = [
  'PrintPage',
  'PrintChapter',
  'PrintCover',
  'PrintPullQuote',
  'PrintCallout',
  'PrintSteps',
  'PrintScoreRing',
  'PrintChip',
  'PrintChipRow',
  'PrintTwoColumn',
  'PrintDonut',
  'PrintRankedList',
  'PrintLedger',
  'PrintTraitBars',
  'PrintTable',
  'PrintPersonaCard',
  'PrintPersonaGrid',
]
/** Visible-box shells that were missing from P54/P55 surface lists. */
const BOX_SHELL_TYPES = [
  'Field',
  'ScrollArea',
  'Tabs',
  'Accordion',
  'EntityCard',
  'RankedRow',
  'SectionChrome',
  'TopStatus',
  'ChannelLane',
  'KpiStrip',
  'DivergingBar',
  'Checkbox',
  'Switch',
  'Slider',
  'Divider',
  'Avatar',
  'Hint',
  'EmptyState',
  'LoadingText',
  'PageTitle',
  'TagInput',
  'ToggleGroup',
  'Meter',
  'Chart',
  'Gauge',
  'Lede',
]
const PADDING_TYPES = [
  'Stack',
  'Grid',
  'Card',
  'Button',
  'Input',
  'Select',
  'Textarea',
  'Panel',
  'Field',
  'ScrollArea',
  'FormSection',
  'CardActions',
  'FilterRow',
  'RankedList',
  'StepStrip',
  'ChannelStack',
  'ChannelLane',
  'EventFooter',
  'Chip',
  'Badge',
  'Alert',
  'AddTile',
  'MetricChip',
  'Image',
  ...BOX_SHELL_TYPES,
  ...PRINT_TYPES,
]
const CONTAINER_SURFACE_TYPES = [
  'Container',
  'Section',
  'SiteStack',
  'SiteContainer',
  'SiteGrid',
  'SiteCard',
  'SiteSection',
  'SiteHero',
  'SiteNav',
  'SiteHeader',
  'SiteFooter',
  'Box',
  'Flex',
  'Page',
]
const SURFACE_TYPES = [
  'Stack',
  'Grid',
  'Card',
  'Button',
  'Input',
  'Image',
  'Badge',
  'Select',
  'Textarea',
  'Panel',
  'Chip',
  'Alert',
  'AddTile',
  'MetricChip',
  'FormSection',
  'FilterRow',
  'CardActions',
  'RankedList',
  'StepStrip',
  'ChannelStack',
  'EventFooter',
  ...CONTAINER_SURFACE_TYPES,
  ...BOX_SHELL_TYPES,
  ...PRINT_TYPES,
]
const TYPE_TYPES = [
  'Text',
  'Heading',
  'Button',
  'Input',
  'Link',
  'Textarea',
  'Alert',
  'Hint',
  'EmptyState',
  'Chip',
  'LoadingText',
  'PageTitle',
  'Lede',
  'MetricChip',
  /** Print shells — Mag textStyle + HTML grain both honor type (WYSIWYG Phase 1). */
  'PrintChip',
  'PrintPullQuote',
  'PrintCallout',
  'PrintCover',
  'PrintChapter',
  'PrintPage',
  'PrintScoreRing',
  'PrintPersonaCard',
  'PrintTable',
  'PrintRankedList',
  'PrintLedger',
]
const TEXT_ALIGN_TYPES = [
  'Text',
  'Heading',
  'Button',
  'Link',
  'Chip',
  'Badge',
  'Alert',
  'Hint',
  'EmptyState',
  'LoadingText',
  'PageTitle',
  'Lede',
  'MetricChip',
  'RankedRow',
  'Meter',
  'Chart',
  'Gauge',
  'SectionChrome',
  'PrintChip',
  'PrintPullQuote',
  'PrintCallout',
  'PrintCover',
  'PrintChapter',
  'PrintPage',
  'PrintScoreRing',
  'PrintPersonaCard',
  'PrintTable',
  'PrintRankedList',
  'PrintLedger',
]
/** Decoration Mag TextStyle + canvas grain both support on Print shells / text. */
const TEXT_DECORATION_TYPES = [
  'Text',
  'Heading',
  'Link',
  'PrintChip',
  'PrintPullQuote',
  'PrintCallout',
  'PrintCover',
  'PrintChapter',
  'PrintTable',
  'PrintRankedList',
  'PrintPersonaCard',
]
const TEXT_TRANSFORM_TYPES = [
  'Text',
  'Heading',
  'Link',
  'PrintChip',
  'PrintPullQuote',
  'PrintCallout',
  'PrintCover',
  'PrintChapter',
  'PrintTable',
  'PrintRankedList',
]
/** Flex/grid parents that honor justify-content / align-items (not Stack — uses align/justify). Grid stays columns-only. */
const FLEX_ALIGN_TYPES = [
  'Card',
  'Panel',
  'FilterRow',
  'CardActions',
  'RankedList',
  'StepStrip',
  'ChannelStack',
  'ChannelLane',
  'EventFooter',
  'FormSection',
  'ScrollArea',
  'Field',
  'Tabs',
  'Accordion',
  'EntityCard',
  'SectionChrome',
  'TopStatus',
  'KpiStrip',
  'PrintChipRow',
  'PrintTwoColumn',
  'PrintPersonaCard',
  'PrintPersonaGrid',
  'PrintPage',
  'PrintChapter',
  'PrintCover',
  'PrintRankedList',
  'PrintLedger',
  'PrintTraitBars',
  'PrintDonut',
  'PrintTable',
]

/** Types that expose rowGap / columnGap beside type-level gap (P85). */
const GAP_TYPES = [
  'Stack',
  'Grid',
  'Card',
  'Field',
  'Panel',
  'FormSection',
  'EventFooter',
  'ChannelLane',
  'EntityCard',
  'PrintTable',
]

/** Which shared style props apply per type. */
const SHARED_APPLIES: Record<string, string[] | '*'> = {
  padding: PADDING_TYPES,
  paddingTop: PADDING_TYPES,
  paddingRight: PADDING_TYPES,
  paddingBottom: PADDING_TYPES,
  paddingLeft: PADDING_TYPES,
  paddingBlock: PADDING_TYPES,
  paddingInline: PADDING_TYPES,
  margin: PADDING_TYPES,
  marginTop: PADDING_TYPES,
  marginRight: PADDING_TYPES,
  marginBottom: PADDING_TYPES,
  marginLeft: PADDING_TYPES,
  marginBlock: PADDING_TYPES,
  marginInline: PADDING_TYPES,
  width: '*',
  height: '*',
  minWidth: '*',
  maxWidth: '*',
  minHeight: '*',
  maxHeight: '*',
  alignSelf: '*',
  alignItems: FLEX_ALIGN_TYPES,
  justifyContent: FLEX_ALIGN_TYPES,
  radius: '*',
  radiusTopLeft: '*',
  radiusTopRight: '*',
  radiusBottomRight: '*',
  radiusBottomLeft: '*',
  clipInsetTopLeftX: '*',
  clipInsetTopLeftY: '*',
  clipInsetTopRightX: '*',
  clipInsetTopRightY: '*',
  clipInsetBottomRightX: '*',
  clipInsetBottomRightY: '*',
  clipInsetBottomLeftX: '*',
  clipInsetBottomLeftY: '*',
  clipPolygon: '*',
  clipPathD: '*',
  rowGap: GAP_TYPES,
  columnGap: GAP_TYPES,
  opacity: '*',
  shadow: ['Stack', 'Grid', 'Card', 'Button', 'Image', 'Badge', 'Panel', 'FormSection', 'ScrollArea'],
  blur: ['Stack', 'Grid', 'Card', 'Button', 'Image', 'Panel', 'ScrollArea'],
  rotate: ['Stack', 'Grid', 'Card', 'Button', 'Image', 'Panel'],
  overflow: '*',
  fontFamily: TYPE_TYPES,
  fontSize: TYPE_TYPES,
  fontWeight: TYPE_TYPES,
  fontStyle: TEXT_DECORATION_TYPES,
  lineHeight: TYPE_TYPES,
  letterSpacing: TYPE_TYPES,
  textAlign: TEXT_ALIGN_TYPES,
  textDecoration: TEXT_DECORATION_TYPES,
  textTransform: TEXT_TRANSFORM_TYPES,
  color: [...new Set([...TYPE_TYPES, ...SURFACE_TYPES, 'Link'])],
  background: [...new Set(SURFACE_TYPES)],
  gradient: ['Stack', 'Card', 'Button', 'Panel', ...CONTAINER_SURFACE_TYPES],
  borderColor: SURFACE_TYPES,
  borderWidth: SURFACE_TYPES,
  borderStyle: SURFACE_TYPES,
  backgroundImage: SURFACE_TYPES,
  backgroundSize: SURFACE_TYPES,
  backgroundPosition: SURFACE_TYPES,
  backgroundRepeat: SURFACE_TYPES,
  backgroundOverlay: SURFACE_TYPES,
  position: '*', top: '*', right: '*', bottom: '*', left: '*', zIndex: '*',
  aspectRatio: '*', flexGrow: '*', flexShrink: '*', flexBasis: '*',
  scale: '*', scaleX: '*', scaleY: '*', skewX: '*', skewY: '*', transformOrigin: '*',
  mixBlendMode: '*', filterBrightness: '*', filterContrast: '*', filterSaturate: '*',
  filterGrayscale: '*', filterInvert: '*', filterHueRotate: '*',
  // objectFit / objectPosition: owned by Image (and SiteImage) type props — not shared `*`,
  // so they do not double-render under Appearance + Component.
  colSpan: '*', colStart: '*', colEnd: '*',
  rowSpan: '*', rowStart: '*', rowEnd: '*', justifySelf: '*', order: '*',
  gridTemplateColumns: ['Grid', 'PrintPersonaGrid'],
  gridTemplateRows: ['Grid', 'PrintPersonaGrid'],
  gridAutoFlow: ['Grid', 'PrintPersonaGrid'],
  gridAutoRows: ['Grid', 'PrintPersonaGrid'],
  gridAutoColumns: ['Grid', 'PrintPersonaGrid'],
  justifyItems: ['Grid', 'PrintPersonaGrid'],
}

const TYPE_CONTRACTS: ComponentContract[] = [
  {
    type: 'Stack',
    props: [
      en('direction', 'Direction', 'layout', DIRECTION_OPTIONS, 'column', 'segmented'),
      en('align', 'Align', 'layout', ALIGN_OPTIONS, undefined, 'segmented'),
      en('justify', 'Justify', 'layout', JUSTIFY_OPTIONS, undefined, 'segmented'),
      en('alignContent', 'Align content', 'layout', ALIGN_CONTENT_OPTIONS, undefined, 'segmented'),
      bool('wrap', 'Wrap', 'layout', 'false'),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'Grid',
    props: [
      en(
        'columns',
        'Columns',
        'layout',
        [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '6', label: '6' },
          { value: '12', label: '12' },
        ],
        '2',
        'segmented',
      ),
      { name: 'gridTemplateColumns', label: 'Template cols', kind: 'string', section: 'layout' },
      { name: 'gridTemplateRows', label: 'Template rows', kind: 'string', section: 'layout' },
      en('gridAutoFlow', 'Auto flow', 'layout', GRID_AUTO_FLOW_OPTIONS, 'row'),
      { name: 'gridAutoRows', label: 'Auto rows', kind: 'string', section: 'layout' },
      en('justifyItems', 'Justify items', 'layout', GRID_ITEM_ALIGN_OPTIONS, 'stretch', 'segmented'),
      en('alignItems', 'Align items', 'layout', GRID_ITEM_ALIGN_OPTIONS, 'stretch', 'segmented'),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'Button',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'variant',
        'Variant',
        'component',
        [
          { value: 'primary', label: 'primary' },
          { value: 'ghost', label: 'ghost' },
          { value: 'subtle', label: 'subtle' },
          { value: 'danger', label: 'danger' },
          { value: 'link', label: 'link' },
        ],
        'primary',
        'segmented',
      ),
      en(
        'size',
        'Button size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
          { value: 'lg', label: 'lg' },
        ],
        'md',
        'segmented',
      ),
      en(
        'shape',
        'Shape',
        'component',
        [
          { value: 'square', label: 'square' },
          { value: 'pill', label: 'pill' },
          { value: 'rounded', label: 'rounded' },
          { value: 'default', label: 'default' },
        ],
        'square',
        'segmented',
      ),
      bool('disabled', 'Disabled', 'component', 'false'),
    ],
  },
  {
    type: 'Text',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'role',
        'Role',
        'typography',
        [
          { value: 'display', label: 'display' },
          { value: 'headline', label: 'headline' },
          { value: 'title', label: 'title' },
          { value: 'body', label: 'body' },
          { value: 'meta', label: 'meta' },
        ],
        'body',
      ),
    ],
  },
  {
    type: 'Heading',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'level',
        'Level',
        'typography',
        [
          { value: '1', label: 'h1' },
          { value: '2', label: 'h2' },
          { value: '3', label: 'h3' },
          { value: '4', label: 'h4' },
          { value: '5', label: 'h5' },
          { value: '6', label: 'h6' },
        ],
        '2',
      ),
    ],
  },
  {
    type: 'Input',
    props: [{ name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' }],
  },
  {
    type: 'Image',
    props: [
      { name: 'src', label: 'Image src', kind: 'string', section: 'component' },
      { name: 'alt', label: 'Alt text', kind: 'string', section: 'component' },
      en('objectFit', 'Fit', 'component', OBJECT_FIT_OPTIONS, 'cover'),
      en('objectPosition', 'Position', 'component', OBJECT_POSITION_OPTIONS, 'center'),
      en('loading', 'Loading', 'component', MEDIA_LOADING_OPTIONS, 'lazy', 'segmented'),
    ],
  },
  {
    type: 'Card',
    props: [tok('gap', 'Gap', 'layout', 'space')],
  },
  {
    type: 'Link',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      { name: 'href', label: 'Href', kind: 'string', section: 'component' },
    ],
  },
  {
    type: 'Badge',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'tone',
        'Tone',
        'component',
        [
          { value: 'neutral', label: 'neutral' },
          { value: 'accent', label: 'accent' },
          { value: 'success', label: 'success' },
          { value: 'warning', label: 'warning' },
          { value: 'danger', label: 'danger' },
        ],
        'neutral',
        'segmented',
      ),
    ],
  },
  {
    type: 'Spacer',
    props: [
      en(
        'size',
        'Size',
        'layout',
        [
          { value: 'xs', label: 'xs' },
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
          { value: 'lg', label: 'lg' },
          { value: 'xl', label: 'xl' },
        ],
        'md',
        'segmented',
      ),
      en(
        'axis',
        'Axis',
        'layout',
        [
          { value: 'x', label: 'x' },
          { value: 'y', label: 'y' },
          { value: 'both', label: 'both' },
        ],
        'y',
        'segmented',
      ),
    ],
  },
  {
    type: 'Checkbox',
    props: [
      { name: 'label', label: 'Label / text', kind: 'string', section: 'component' },
      bool('checked', 'Checked', 'component', 'false'),
      bool('disabled', 'Disabled', 'component', 'false'),
    ],
  },
  {
    type: 'Switch',
    props: [
      { name: 'label', label: 'Label / text', kind: 'string', section: 'component' },
      bool('checked', 'Checked', 'component', 'false'),
      bool('disabled', 'Disabled', 'component', 'false'),
    ],
  },
  {
    type: 'Select',
    props: [
      { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' },
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
      bool('disabled', 'Disabled', 'component', 'false'),
    ],
  },
  {
    type: 'Textarea',
    props: [
      { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' },
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
      bool('disabled', 'Disabled', 'component', 'false'),
    ],
  },
  {
    type: 'Chip',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
      bool('selected', 'Selected', 'component', 'false'),
    ],
  },
  {
    type: 'Divider',
    props: [
      en(
        'orientation',
        'Orientation',
        'layout',
        [
          { value: 'horizontal', label: 'horizontal' },
          { value: 'vertical', label: 'vertical' },
        ],
        'horizontal',
        'segmented',
      ),
    ],
  },
  {
    type: 'Avatar',
    props: [
      { name: 'displayName', label: 'Display name', kind: 'string', section: 'component' },
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
          { value: 'lg', label: 'lg' },
        ],
        'sm',
        'segmented',
      ),
      en(
        'shape',
        'Shape',
        'component',
        [
          { value: 'square', label: 'square' },
          { value: 'round', label: 'round' },
        ],
        'square',
        'segmented',
      ),
    ],
  },
  {
    type: 'Alert',
    props: [
      en(
        'tone',
        'Tone',
        'component',
        [
          { value: 'error', label: 'error' },
          { value: 'ok', label: 'ok' },
          { value: 'info', label: 'info' },
        ],
        'info',
        'segmented',
      ),
    ],
  },
  {
    type: 'Hint',
    props: [bool('panel', 'Panel', 'component', 'false')],
  },
  {
    type: 'Spinner',
    props: [
      { name: 'label', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
    ],
  },
  {
    type: 'StatusDot',
    props: [
      en(
        'level',
        'Level',
        'component',
        [
          { value: 'ok', label: 'ok' },
          { value: 'warn', label: 'warn' },
          { value: 'critical', label: 'critical' },
        ],
        'ok',
        'segmented',
      ),
    ],
  },
  {
    type: 'EmptyState',
    props: [],
  },
  {
    type: 'Slider',
    props: [
      { name: 'value', label: 'Value', kind: 'string', section: 'component' },
      { name: 'min', label: 'Min', kind: 'string', section: 'component' },
      { name: 'max', label: 'Max', kind: 'string', section: 'component' },
      { name: 'step', label: 'Step', kind: 'string', section: 'component' },
    ],
  },
  {
    type: 'Field',
    props: [
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
      en(
        'layout',
        'Layout',
        'layout',
        [
          { value: 'stack', label: 'stack' },
          { value: 'inline', label: 'inline' },
        ],
        'stack',
        'segmented',
      ),
      bool('invalid', 'Invalid', 'component', 'false'),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'Panel',
    props: [
      en(
        'variant',
        'Variant',
        'component',
        [
          { value: 'editorial', label: 'editorial' },
          { value: 'default', label: 'default' },
          { value: 'flush', label: 'flush' },
          { value: 'card', label: 'card' },
        ],
        'editorial',
        'segmented',
      ),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'Tabs',
    props: [
      en(
        'value',
        'Value',
        'component',
        [
          { value: 'a', label: 'a' },
          { value: 'b', label: 'b' },
        ],
        'a',
        'segmented',
      ),
    ],
  },
  {
    type: 'Accordion',
    props: [
      en(
        'value',
        'Value',
        'component',
        [
          { value: 'a', label: 'a' },
          { value: 'b', label: 'b' },
        ],
        'a',
        'segmented',
      ),
    ],
  },
  {
    type: 'LoadingText',
    props: [],
  },
  {
    type: 'PageTitle',
    props: [],
  },
  {
    type: 'AddTile',
    props: [],
  },
  {
    type: 'TagInput',
    props: [
      { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' },
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
      bool('disabled', 'Disabled', 'component', 'false'),
    ],
  },
  {
    type: 'ToggleGroup',
    props: [
      en(
        'value',
        'Value',
        'component',
        [
          { value: 'a', label: 'a' },
          { value: 'b', label: 'b' },
        ],
        'a',
        'segmented',
      ),
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'sm', label: 'sm' },
          { value: 'md', label: 'md' },
        ],
        'sm',
        'segmented',
      ),
      en(
        'variant',
        'Variant',
        'component',
        [
          { value: 'chip', label: 'chip' },
          { value: 'icon', label: 'icon' },
        ],
        'chip',
        'segmented',
      ),
    ],
  },
  {
    type: 'MetricChip',
    props: [],
  },
  {
    type: 'Meter',
    props: [
      { name: 'label', label: 'Label / text', kind: 'string', section: 'component' },
      { name: 'hint', label: 'Hint', kind: 'string', section: 'component' },
      { name: 'valueLabel', label: 'Value label', kind: 'string', section: 'component' },
      { name: 'value', label: 'Value', kind: 'string', section: 'component' },
      { name: 'min', label: 'Min', kind: 'string', section: 'component' },
      { name: 'max', label: 'Max', kind: 'string', section: 'component' },
      { name: 'step', label: 'Step', kind: 'string', section: 'component' },
    ],
  },
  {
    type: 'Chart',
    props: [
      en(
        'variant',
        'Variant',
        'component',
        [
          { value: 'bar', label: 'bar' },
          { value: 'bar_horizontal', label: 'bar_horizontal' },
          { value: 'line', label: 'line' },
          { value: 'area', label: 'area' },
          { value: 'scatter', label: 'scatter' },
          { value: 'pie', label: 'pie' },
          { value: 'donut', label: 'donut' },
          { value: 'funnel', label: 'funnel' },
        ],
        'bar',
      ),
      { name: 'title', label: 'Title', kind: 'string', section: 'component' },
      { name: 'height', label: 'Height (px)', kind: 'string', section: 'component' },
    ],
  },
  {
    type: 'Gauge',
    props: [
      { name: 'label', label: 'Label', kind: 'string', section: 'component' },
      { name: 'unit', label: 'Unit', kind: 'string', section: 'component' },
      { name: 'value', label: 'Value', kind: 'string', section: 'component' },
      { name: 'min', label: 'Min', kind: 'string', section: 'component' },
      { name: 'max', label: 'Max', kind: 'string', section: 'component' },
      en(
        'tone',
        'Tone',
        'component',
        [
          { value: 'neutral', label: 'neutral' },
          { value: 'ok', label: 'ok' },
          { value: 'warn', label: 'warn' },
          { value: 'bad', label: 'bad' },
        ],
        'neutral',
        'segmented',
      ),
    ],
  },
  {
    type: 'Lede',
    props: [
      en(
        'tone',
        'Tone',
        'component',
        [
          { value: 'default', label: 'default' },
          { value: 'pos', label: 'pos' },
          { value: 'low', label: 'low' },
          { value: 'neg', label: 'neg' },
          { value: 'ok', label: 'ok' },
          { value: 'choice', label: 'choice' },
        ],
        'default',
        'segmented',
      ),
      en(
        'kind',
        'Kind',
        'component',
        [
          { value: 'number', label: 'number' },
          { value: 'text', label: 'text' },
          { value: 'empty', label: 'empty' },
        ],
        'number',
        'segmented',
      ),
    ],
  },
  {
    type: 'ScrollArea',
    props: [
      en(
        'orientation',
        'Orientation',
        'layout',
        [
          { value: 'vertical', label: 'vertical' },
          { value: 'horizontal', label: 'horizontal' },
          { value: 'both', label: 'both' },
        ],
        'vertical',
        'segmented',
      ),
    ],
  },
  {
    type: 'FormSection',
    props: [
      { name: 'columns', label: 'Columns', kind: 'string', section: 'layout' },
      en(
        'tone',
        'Tone',
        'component',
        [
          { value: 'default', label: 'default' },
          { value: 'advanced', label: 'advanced' },
        ],
        'default',
        'segmented',
      ),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'CardActions',
    props: [bool('hairline', 'Hairline', 'component', 'true')],
  },
  {
    type: 'FilterRow',
    props: [
      en(
        'variant',
        'Variant',
        'component',
        [
          { value: 'magazine', label: 'magazine' },
          { value: 'toolbar', label: 'toolbar' },
        ],
        'magazine',
        'segmented',
      ),
    ],
  },
  {
    type: 'SectionChrome',
    props: [
      en(
        'metaTone',
        'Meta tone',
        'component',
        [
          { value: 'muted', label: 'muted' },
          { value: 'accent', label: 'accent' },
        ],
        'muted',
        'segmented',
      ),
      en(
        'role',
        'Role',
        'component',
        [
          { value: 'foresight', label: 'foresight' },
          { value: 'research', label: 'research' },
          { value: 'waves', label: 'waves' },
          { value: 'signals', label: 'signals' },
          { value: 'sources', label: 'sources' },
          { value: 'ops', label: 'ops' },
          { value: 'corpus', label: 'corpus' },
          { value: 'pipeline', label: 'pipeline' },
        ],
        'research',
      ),
      en(
        'as',
        'Heading',
        'component',
        [
          { value: 'h2', label: 'h2' },
          { value: 'h3', label: 'h3' },
        ],
        'h2',
        'segmented',
      ),
      bool('quiet', 'Quiet', 'component', 'false'),
    ],
  },
  {
    type: 'RankedRow',
    props: [
      { name: 'index', label: 'Index', kind: 'string', section: 'component' },
      { name: 'barPct', label: 'Bar %', kind: 'string', section: 'component' },
      bool('active', 'Active', 'component', 'false'),
    ],
  },
  {
    type: 'RankedList',
    props: [{ name: 'hint', label: 'Hint', kind: 'string', section: 'component' }],
  },
  {
    type: 'TopStatus',
    props: [
      en(
        'level',
        'Level',
        'component',
        [
          { value: 'ok', label: 'ok' },
          { value: 'warn', label: 'warn' },
          { value: 'critical', label: 'critical' },
        ],
        'ok',
        'segmented',
      ),
      bool('live', 'Live', 'component', 'false'),
    ],
  },
  {
    type: 'EventFooter',
    props: [tok('gap', 'Gap', 'layout', 'space')],
  },
  {
    type: 'ChannelStack',
    props: [],
  },
  {
    type: 'ChannelLane',
    props: [
      bool('compact', 'Compact', 'component', 'false'),
      bool('defaultOpen', 'Open', 'component', 'true'),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'StepStrip',
    props: [{ name: 'hint', label: 'Hint', kind: 'string', section: 'component' }],
  },
  {
    type: 'KpiStrip',
    props: [],
  },
  {
    type: 'DivergingBar',
    props: [],
  },
  {
    type: 'EntityCard',
    props: [
      en(
        'size',
        'Size',
        'component',
        [
          { value: 'default', label: 'default' },
          { value: 'tall', label: 'tall' },
        ],
        'default',
        'segmented',
      ),
      tok('gap', 'Gap', 'layout', 'space'),
    ],
  },
  {
    type: 'PrintPage',
    props: [],
  },
  {
    type: 'PrintChapter',
    props: [{ name: 'index', label: 'Index', kind: 'string', section: 'component' }],
  },
  {
    type: 'PrintCover',
    props: [{ name: 'url', label: 'URL', kind: 'string', section: 'component' }],
  },
  {
    type: 'PrintPullQuote',
    props: [],
  },
  {
    type: 'PrintCallout',
    props: [
      en(
        'variant',
        'Variant',
        'component',
        [
          { value: 'wash', label: 'Wash' },
          { value: 'emphasize', label: 'Emphasize' },
          { value: 'quiet', label: 'Quiet' },
        ],
        'wash',
        'segmented',
      ),
    ],
  },
  {
    type: 'PrintSteps',
    props: [
      en(
        'orientation',
        'Orientation',
        'component',
        [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' },
        ],
        'horizontal',
        'segmented',
      ),
      { name: 'emphasisIndex', label: 'Emphasis index', kind: 'string', section: 'component' },
    ],
  },
  {
    type: 'PrintScoreRing',
    props: [{ name: 'max', label: 'Max', kind: 'string', section: 'component' }],
  },
  {
    type: 'PrintChip',
    props: [
      { name: 'children', label: 'Label / text', kind: 'string', section: 'component' },
      en(
        'tone',
        'Tone',
        'component',
        [
          { value: 'default', label: 'Default' },
          { value: 'muted', label: 'Muted' },
          { value: 'accent', label: 'Accent' },
          { value: 'solid', label: 'Solid' },
        ],
        'default',
        'segmented',
      ),
    ],
  },
  {
    type: 'PrintChipRow',
    props: [],
  },
  {
    type: 'PrintTwoColumn',
    props: [],
  },
  {
    type: 'PrintDonut',
    props: [],
  },
  {
    type: 'PrintRankedList',
    props: [
      en(
        'columns',
        'Columns',
        'component',
        [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
        ],
        '1',
        'segmented',
      ),
      bool('compact', 'Compact', 'component', 'false'),
      { name: 'startIndex', label: 'Start index', kind: 'string', section: 'component' },
    ],
  },
  {
    type: 'PrintLedger',
    props: [{ name: 'max', label: 'Max', kind: 'string', section: 'component' }],
  },
  {
    type: 'PrintTraitBars',
    props: [],
  },
  {
    type: 'PrintTable',
    props: [
      tok('gap', 'Gap', 'layout', 'space'),
      {
        name: 'columnAlign',
        label: 'Column align',
        kind: 'string',
        section: 'component',
        defaultValue: undefined,
      },
    ],
  },
  {
    type: 'PrintPersonaCard',
    props: [
      { name: 'confidence', label: 'Confidence', kind: 'string', section: 'component' },
      bool('spread', 'Spread', 'component', 'true'),
    ],
  },
  {
    type: 'PrintPersonaGrid',
    props: [],
  },
]

const BY_TYPE = new Map(TYPE_CONTRACTS.map((c) => [c.type, c]))

function sharedApplies(propName: string, type: string): boolean {
  const rule = SHARED_APPLIES[propName]
  if (!rule) return false
  return rule === '*' || rule.includes(type)
}

/** Registered component types (Top-N + palette). */
export function listComponentContractTypes(): string[] {
  return TYPE_CONTRACTS.map((c) => c.type)
}

export function getComponentContract(type: string): ComponentContract | null {
  return BY_TYPE.get(type) ?? null
}

/**
 * Flattened inspect props for a type: meta + type props + applicable shared styles.
 * Used by the editor field catalog (CEM bridge).
 */
/** Shared style props applicable to a typed catalog node (respects SHARED_APPLIES). */
export function sharedStylePropsForType(type: string): ContractPropDef[] {
  return SHARED_STYLE_PROPS.filter((p) => sharedApplies(p.name, type))
}

export function contractPropsForType(type: string): ContractPropDef[] {
  const contract = getComponentContract(type)
  if (!contract) return []
  return [...META_PROPS, ...contract.props, ...sharedStylePropsForType(type)]
}

export const COMPONENT_CONTRACTS = TYPE_CONTRACTS

const EXTENDABLE_ALIGN_EXTRAS = ['align', 'justify', 'alignContent'] as const

/** Closed Creation inspector keys that Promote may add as named library props (P4). */
export const EXTENDABLE_PRIMITIVE_PROP_NAMES: readonly string[] = [
  ...SHARED_STYLE_PROPS.map((p) => p.name),
  ...EXTENDABLE_ALIGN_EXTRAS,
]

export type ExtendablePrimitivePropName = (typeof EXTENDABLE_PRIMITIVE_PROP_NAMES)[number]

/** Inspect name → React CSS property applied on the primitive. */
const EXTENDABLE_CSS_ALIASES: Record<string, string> = {
  align: 'alignItems',
  justify: 'justifyContent',
  radius: 'borderRadius',
  shadow: 'boxShadow',
  gradient: 'backgroundImage',
  blur: 'filter',
  rotate: 'transform',
  background: 'background',
  colSpan: 'gridColumn',
  rowSpan: 'gridRow',
  colStart: 'gridColumnStart',
  colEnd: 'gridColumnEnd',
  rowStart: 'gridRowStart',
  rowEnd: 'gridRowEnd',
  justifySelf: 'justifySelf',
  order: 'order',
  objectFit: 'objectFit',
  objectPosition: 'objectPosition',
  backgroundImage: 'backgroundImage',
  backgroundSize: 'backgroundSize',
  backgroundPosition: 'backgroundPosition',
  backgroundRepeat: 'backgroundRepeat',
}

/**
 * Brandion path → existing `@zaoly/ui` CSS variable (no Collection hex).
 * Knowledge: `knowledge/token-layers.md` · `knowledge/promote-inspect-chrome.md`
 * Pipeline: `color.status.pipeline.*` → `--status-*` (`zaoly-ui` `tokens.css` / `zaolyStatus`)
 */
export const PROMOTE_TOKEN_PATH_TO_CSS_VAR: Record<string, string> = {
  'color.action.accent': '--accent',
  'color.action.primary': '--accent',
  'color.brand.primary': '--brand-primary',
  'color.brand.green': '--accent',
  'color.action.secondary': '--muted',
  'color.background': '--surface',
  'color.neutral.100': '--surface-2',
  'color.neutral.700': '--ink',
  'color.ink': '--ink',
  'color.muted': '--muted',
  'color.line': '--line',
  'color.status.ok': '--ok',
  'color.status.warn': '--warn',
  'color.status.danger': '--danger',
  'color.status.pipeline.completed': '--status-completed',
  'color.status.pipeline.enriched': '--status-enriched',
  'color.status.pipeline.category_ready': '--status-category-ready',
  'color.status.pipeline.category_queued': '--status-category-queued',
  'color.status.pipeline.enrich_queued': '--status-enrich-queued',
  'color.status.pipeline.embed_queued': '--status-embed-queued',
  'color.status.pipeline.content_ready': '--status-content-ready',
  'color.status.pipeline.skipped_near_dup': '--status-skipped-near-dup',
  'color.status.pipeline.failed_enrich': '--status-failed-enrich',
  'color.role.foresight': '--role-foresight',
  'color.role.research': '--role-research',
  'color.role.waves': '--role-waves',
  'color.role.signals': '--role-signals',
  'color.role.sources': '--role-sources',
  'color.role.ops': '--role-ops',
  'color.role.corpus': '--role-corpus',
  'color.role.pipeline': '--role-pipeline',
  'radius.control.sm': '--radius-sm',
  'radius.control.md': '--radius-md',
  'radius.surface': '--radius-panel',
  'spacing.static.1': '--space-1',
  'spacing.static.2': '--space-2',
  'spacing.static.3': '--space-3',
  'spacing.static.4': '--space-4',
  'spacing.static.5': '--space-5',
  'spacing.static.6': '--space-6',
  'spacing.static.small': '--space-2',
  'spacing.static.medium': '--space-4',
  'spacing.static.large': '--space-6',
  'spacing.padding.xs': '--space-1',
  'spacing.padding.sm': '--space-2',
  'spacing.padding.md': '--space-3',
  'spacing.padding.lg': '--space-4',
  'spacing.padding.xl': '--space-5',
  'spacing.padding.2xl': '--space-6',
  'typography.body.family': '--stack-body',
  'typography.heading.h1': '--stack-display',
}

const PROMOTE_HEX_RE = /#(?:[0-9a-f]{3,8})\b/i
const CSS_VAR_RE = /^var\(--[a-zA-Z0-9-]+(?:,\s*[^)]+)?\)$/
const CSS_LENGTH_RE = /^-?[\d.]+(px|rem|em|pt|pc|mm|cm|in|vw|vh|vmin|vmax|ch|ex|%)$/
const TOKEN_PATH_RE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/i

export function isPromoteTokenPath(value: string): boolean {
  return TOKEN_PATH_RE.test(value.trim())
}

export function libraryCssValueForTokenPath(path: string): string | null {
  const cssVar = PROMOTE_TOKEN_PATH_TO_CSS_VAR[path.trim()]
  return cssVar ? `var(${cssVar})` : null
}

export function isExtendablePrimitiveProp(name: string): name is ExtendablePrimitivePropName {
  return EXTENDABLE_PRIMITIVE_PROP_NAMES.includes(name)
}

export function extendableCssProperty(name: string): string | null {
  if (!isExtendablePrimitiveProp(name)) return null
  return EXTENDABLE_CSS_ALIASES[name] ?? name
}

export function extendablePrimitiveProps(): ContractPropDef[] {
  const fromShared = SHARED_STYLE_PROPS.filter((p) => isExtendablePrimitiveProp(p.name))
  const extras: ContractPropDef[] = [
    en('align', 'Align', 'layout', ALIGN_OPTIONS, undefined, 'segmented'),
    en('justify', 'Justify', 'layout', JUSTIFY_OPTIONS, undefined, 'segmented'),
    en('alignContent', 'Align content', 'layout', ALIGN_CONTENT_OPTIONS, undefined, 'segmented'),
  ]
  const seen = new Set(fromShared.map((p) => p.name))
  return [...fromShared, ...extras.filter((p) => !seen.has(p.name))]
}

/**
 * Instance DESIGN chrome for catalog types without a typed contract.
 * Shared surface + type + alignment. P4 Promote extends this same set
 * into named library props (token paths → existing CSS variables).
 */
export function genericCatalogInspectProps(): ContractPropDef[] {
  const extras = extendablePrimitiveProps()
  const seen = new Set(SHARED_STYLE_PROPS.map((p) => p.name))
  return [...SHARED_STYLE_PROPS, ...extras.filter((p) => !seen.has(p.name))]
}

export function isAllowedExtendableValue(name: string, value: unknown): boolean {
  if (typeof value !== 'string' || !isExtendablePrimitiveProp(name)) return false
  const text = value.trim()
  if (!text || PROMOTE_HEX_RE.test(text) || /^https?:\/\//i.test(text)) return false
  const def = extendablePrimitiveProps().find((p) => p.name === name)
  const allowed = def?.options?.map((o) => o.value) ?? []
  if (allowed.length) return allowed.includes(text)
  if (libraryCssValueForTokenPath(text) || CSS_VAR_RE.test(text)) return true
  if (CSS_LENGTH_RE.test(text) || text === '0') return true
  if (/^\d+(\.\d+)?$/.test(text)) return true
  if (/^(transparent|currentColor|none|inherit|initial|unset)$/i.test(text)) return true
  if (/^(blur|rotate)\(/i.test(text)) return true
  if (isPromoteTokenPath(text)) return false
  return def?.kind === 'token'
}

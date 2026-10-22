'use client'

import type { Translator } from '../../lib/i18n'
import type { ReactNode } from 'react'
import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import { promoteSiteSvgMarkupToCurrentColor } from '@zaoly/site-kit'
import {
  Button,
  Field,
  Input,
  Select,
  ToggleGroup,
  TokenPicker,
} from '@zaoly/ui'
import { CommitOnBlurInput } from './commit-on-blur-input'
import { InspectDataBindField } from './inspect-data-bind-field'
import { isCollectionDataBindableKey } from '../../lib/collection-data/collection-data-core'
import {
  fieldValue,
  literalFieldValue,
  sharedFieldValue,
  sharedLiteralValue,
  tokenBindingForPicker,
  type SiblingWriteContext,
} from '../../lib/inspect/inspector-field-values'
import {
  partitionInspectBoxModelFields,
  type BoxModelKind,
  type BoxModelWriteMode,
} from '../../lib/inspect/box-model-groups'
import {
  partitionInspectGapFields,
  type GapWriteMode,
} from '../../lib/inspect/gap-groups'
import {
  filterAlignContentUnlessWrap,
  partitionInspectLayoutFlowFields,
  isGridLayoutType,
  resolveAlignAxisKeys,
  readAlignAxisValues,
} from '../../lib/inspect/layout-flow-groups'
import { InspectAlignBar } from '../inspect-align-bar'
import { InspectGapGroup } from '../inspect-gap-group'
import { InspectOpacityField } from '../inspect-opacity-field'
import { InspectLayoutFlow } from '../inspect-layout-flow'
import {
  inspectEnumIcon,
  inspectOptionLabel,
} from '../../lib/inspect/icons'
import {
  inspectFieldIcon,
  previewKindForGroup,
  scopeLabelForGroup,
  TYPOGRAPHY_PICKER_GROUPS,
} from './inspector-preview-helpers'
import {
  inspectUsesTokenPicker,
  isLengthTokenGroup,
  pairInspectFields,
  INSPECT_UNSET_PLACEHOLDER,
  type InspectFieldDef,
} from '../../lib/inspect/field-catalog'
import { GOOGLE_FONT_PICKER_OPTIONS } from '../../lib/fonts/google-font-catalog'
import {
  ensureGoogleFontStylesheet,
  parseGoogleFontLiteralPath,
} from '../../lib/fonts/google-fonts'
import {
  previewForBinding,
  tokenDisplayLabel,
  tokensForGroup,
  type BrandTokenPackResponse,
} from '../../lib/inspect/token-catalog'
import { saveTokenRecent } from '../../lib/inspect/token-recent'
import {
  cascadeNodeForBreakpoint,
  type DigitalPrimaryBreakpoint,
} from '../../lib/scene/cascade'
import {
  isPromotableLiteral,
  studioTypeForInspectGroup,
} from '../../lib/inspect/digital-edit'
import { InspectBoxModelGroup } from '../inspect-box-model-group'
import { InspectClipSlantGroup } from '../inspect-clip-slant-group'
import {
  partitionInspectClipSlantFields,
} from '../../lib/inspect/clip-slant-groups'
import { clipInsetPropsFromPreset } from '../../lib/inspect/clip-presets'
import {
  CLIP_INSET_PROP_KEYS,
  clearedClipInsetPropMap,
} from '../../lib/inspect/clip-insets'
import {
  formatClipPolygonPoints,
  type ClipPolygonPoint,
} from '../../lib/inspect/clip-polygon'
import {
  partitionInspectSizeBoxFields,
  compactSizeLabel,
} from '../../lib/inspect/size-box-groups'
import { InspectSizeBoxGroup } from '../inspect-size-box-group'
import {
  partitionInspectFillFields,
  compactFillLabel,
} from '../../lib/inspect/fill-groups'
import { InspectFillGroup } from '../inspect-fill-group'
import { partitionInspectAlignSelfFields } from '../../lib/inspect/align-self-grid'
import { InspectAlignSelfGrid } from '../inspect-align-self-grid'
import {
  partitionInspectTypographyFields,
  compactTypeLabel,
} from '../../lib/inspect/typography-groups'
import { InspectTypographyGroup } from '../inspect-typography-group'
import { partitionInspectRotateFields, compactRotateLabel } from '../../lib/inspect/rotate-field'
import {
  partitionInspectAppearanceEffectFields,
  compactEffectLabel,
} from '../../lib/inspect/appearance-effects'
import { InspectAppearanceEffects } from '../inspect-appearance-effects'
import { partitionInspectPositionFields } from '../../lib/inspect/position-groups'
import { InspectPositionGroup } from '../inspect-position-group'
import { InspectGridGroup, GRID_PRESETS } from '../inspect-grid-group'
import { InspectGridItemGroup } from '../inspect-grid-item-group'
import { InspectMediaGroup } from '../inspect-media-group'
import { elsewhereBreakpointsForField } from '../../lib/scene/breakpoint-field-overrides'
import {
  InspectBpElsewhereBadges,
  elsewhereBreakpointsTip,
} from './inspect-bp-elsewhere-badges'

export type InspectorFieldRendererParams = {
  multi: boolean
  selected: SceneNode
  selectedNodes: SceneNode[]
  cascaded: ReturnType<typeof cascadeNodeForBreakpoint>
  activeBreakpoint: SceneBreakpointId
  primaryBreakpoint?: DigitalPrimaryBreakpoint
  useOverride: boolean
  readOnly: boolean
  locked: boolean
  catalog: ReturnType<typeof import('../../lib/inspect/token-catalog-context').useInspectTokenCatalog>
  packWritable?: boolean
  recentPaths: string[]
  setRecentPaths: (paths: string[]) => void
  bpLabel: string
  t: Translator
  writeProp: (key: string, value: unknown) => void
  writeLiteral: (key: string, raw: string, sibling?: SiblingWriteContext) => void
  setToken: (key: string, tokenPath: string, sibling?: SiblingWriteContext) => void
  setDataBinding: (key: string, dataRef: string) => void
  clearDataBinding: (key: string) => void
  platformProjectId?: string | null
  openPromoteLiteral: (fieldName: string, type: string, literal: string) => void
  setSiteSvgDeepEditOpen: (open: boolean) => void
  onOpenAssetLibrary?: (mode: 'background' | 'image') => void
  /** Jump toolbar breakpoint from elsewhere chips (M/T/P). */
  onBreakpointChange?: (value: string) => void
}

export function useInspectorFieldRenderer({
  multi,
  selected,
  selectedNodes,
  cascaded,
  activeBreakpoint,
  primaryBreakpoint = 'desktop',
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
  platformProjectId = null,
  openPromoteLiteral,
  setSiteSvgDeepEditOpen,
  onOpenAssetLibrary,
  onBreakpointChange,
}: InspectorFieldRendererParams) {
  function renderField(
    field: InspectFieldDef,
    sibling?: SiblingWriteContext,
    opts?: {
      bare?: boolean
      sizeBox?: boolean
      fillGroup?: boolean
      typeGroup?: boolean
      effectGroup?: boolean
      rotateField?: boolean
    },
  ) {
    const bare = opts?.bare === true
    const sizeBox = opts?.sizeBox === true
    const fillGroup = opts?.fillGroup === true
    const typeGroup = opts?.typeGroup === true
    const effectGroup = opts?.effectGroup === true
    const rotateField = opts?.rotateField === true
    const multiVal = multi
      ? sharedFieldValue(selectedNodes, field, activeBreakpoint, primaryBreakpoint)
      : { value: fieldValue(selected!, field, cascaded), shared: true }
    const value = multiVal.shared ? multiVal.value : ''
    const overridden = cascaded.overrideKeys.has(field.name)
    const baseLabel = sizeBox
      ? compactSizeLabel(field.name)
      : fillGroup
        ? compactFillLabel(field.name)
        : typeGroup
          ? compactTypeLabel(field.name)
          : effectGroup
            ? compactEffectLabel(field.name)
            : rotateField
              ? compactRotateLabel(field.name)
              : field.label
    const labelText =
      useOverride && field.kind !== 'readonly'
        ? `${baseLabel}${overridden ? ` (${t('editor.bpOverride')})` : ` (${t('editor.bpInherit')})`}`
        : baseLabel
    const elsewhereBps =
      field.kind === 'readonly'
        ? []
        : elsewhereBreakpointsForField(
            multi ? selectedNodes : selected ? [selected] : [],
            field.name,
            activeBreakpoint,
          )
    const label =
      elsewhereBps.length > 0 ? (
        <span className="creation-inspect-field-label-row">
          <span>{labelText}</span>
          <InspectBpElsewhereBadges
            bps={elsewhereBps}
            tip={elsewhereBreakpointsTip(elsewhereBps, t, Boolean(onBreakpointChange))}
            onSelectBreakpoint={
              onBreakpointChange
                ? (bp) => onBreakpointChange(bp)
                : undefined
            }
          />
        </span>
      ) : (
        labelText
      )
    const ariaLabel = field.label
    const controlAriaLabel =
      sizeBox || fillGroup || typeGroup || effectGroup || rotateField
        ? ariaLabel
        : labelText

    const propIcon = inspectFieldIcon(field)

    if (multi && !multiVal.shared && field.kind !== 'readonly') {
      if (bare) {
        return (
          <Input
            key={field.name}
            value={t('editor.mixedValue')}
            readOnly
            aria-label={controlAriaLabel}
          />
        )
      }
      return (
        <Field key={field.name} label={label} icon={propIcon} size="sm">
          <Input value={t('editor.mixedValue')} readOnly />
        </Field>
      )
    }

    if (field.kind === 'readonly' || readOnly) {
      if (bare) {
        return (
          <Input
            key={field.name}
            value={multiVal.shared ? multiVal.value : t('editor.mixedValue')}
            readOnly
            aria-label={controlAriaLabel}
          />
        )
      }
      return (
        <Field key={field.name} label={label} icon={propIcon} size="sm">
          <Input value={multiVal.shared ? multiVal.value : t('editor.mixedValue')} readOnly />
        </Field>
      )
    }

    if (field.kind === 'string') {
      const showSvgPromote =
        !multi && selected?.type === 'SiteSvg' && field.name === 'markup' && !locked
      return (
        <Field key={field.name} label={label} icon={propIcon} size="sm">
          <CommitOnBlurInput
            value={value}
            placeholder={
              field.name === 'name' ? t('editor.layerName') : INSPECT_UNSET_PLACEHOLDER
            }
            aria-label={field.label}
            onCommit={(next) => writeProp(field.name, next)}
          />
          {showSvgPromote ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                block
                data-testid="inspect-site-svg-edit-markup"
                onClick={() => setSiteSvgDeepEditOpen(true)}
              >
                {t('editor.siteSvgEditMarkup')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                block
                data-testid="inspect-site-svg-promote-color"
                onClick={() => {
                  const promoted = promoteSiteSvgMarkupToCurrentColor(String(value ?? ''))
                  if (promoted.ok) writeProp('markup', promoted.markup)
                }}
              >
                {t('editor.inspectPromoteCurrentColor')}
              </Button>
            </>
          ) : null}
        </Field>
      )
    }

    if (field.kind === 'enum' || field.kind === 'boolean') {
      const options =
        field.kind === 'boolean'
          ? field.name === 'wrap'
            ? [
                { value: 'false', label: 'nowrap' },
                { value: 'true', label: 'wrap' },
              ]
            : [
                { value: 'false', label: 'off' },
                { value: 'true', label: 'on' },
              ]
          : (field.options ?? []).map((opt) => ({
              value: opt.value,
              label: opt.label.charAt(0).toUpperCase() + opt.label.slice(1),
            }))
      const commit = (next: string) =>
        writeProp(field.name, field.kind === 'boolean' ? next === 'true' : next)
      if (field.control === 'segmented') {
        const mapped = options.map((opt) => ({
          value: opt.value,
          label: inspectOptionLabel(opt.value, opt.label),
          icon: inspectEnumIcon(field.name, opt.value),
        }))
        const useIcons = mapped.some((opt) => opt.icon)
        const control = (
          <ToggleGroup
            key={field.name}
            aria-label={controlAriaLabel}
            size="sm"
            variant={useIcons ? 'icon' : 'chip'}
            value={value}
            onChange={commit}
            options={mapped}
          />
        )
        if (bare) return control
        return (
          <Field key={field.name} label={label} icon={propIcon} size="sm">
            {control}
          </Field>
        )
      }
      if (bare) {
        return (
          <Select
            key={field.name}
            value={value}
            onChange={commit}
            options={options}
            aria-label={controlAriaLabel}
          />
        )
      }
      return (
        <Field key={field.name} label={label} icon={propIcon} size="sm">
          <Select value={value} onChange={commit} options={options} />
        </Field>
      )
    }

    if (field.kind === 'token' && field.tokenGroup) {
      const group = field.tokenGroup
      const lengthGroup = isLengthTokenGroup(group)
      const groupTokens = tokensForGroup(group, catalog)
      const suggestedPaths = groupTokens.map((tok) => tok.path)
      const options = [
        ...catalog
          .filter((tok) => tok.status !== 'pending')
          .map((tok) => {
            const facetPreview = previewForBinding(tok, field.name)
            const inGroup = tok.group === group
            const baseLabel = tokenDisplayLabel(tok)
            let label = baseLabel
            let valueLabel: string | undefined
            if (inGroup && lengthGroup && facetPreview) {
              valueLabel = facetPreview
              label = tok.path.split('.').slice(-2).join('.')
            } else if (inGroup && TYPOGRAPHY_PICKER_GROUPS.has(group) && facetPreview) {
              const role = tokenDisplayLabel(tok)
              valueLabel = facetPreview === role ? undefined : facetPreview
              label = role
            }
            return {
              path: tok.path,
              label,
              valueLabel,
              category: tok.group,
              preview: facetPreview || tok.preview || undefined,
              fontPreview: group === 'fontFamily' && inGroup ? facetPreview : undefined,
              sampleStyle:
                group === 'fontSize' && inGroup && facetPreview
                  ? { fontSize: `min(1.05rem, ${facetPreview})` }
                  : group === 'fontWeight' && inGroup && facetPreview
                    ? { fontWeight: facetPreview }
                    : group === 'lineHeight' && inGroup && facetPreview
                      ? { lineHeight: facetPreview }
                      : undefined,
            }
          }),
        ...(group === 'fontFamily' ? GOOGLE_FONT_PICKER_OPTIONS : []),
      ]
      const literal = multi
        ? sharedLiteralValue(selectedNodes, field, activeBreakpoint, primaryBreakpoint)
        : { value: literalFieldValue(selected!, field, cascaded), shared: true }
      const literalValue = literal.shared ? literal.value : ''
      const pickerBinding = tokenBindingForPicker(value, literal.shared ? literalValue : '')
      const showPicker = inspectUsesTokenPicker(group)
      const studioType = studioTypeForInspectGroup(group)
      const canPromote =
        Boolean(
          packWritable &&
            studioType &&
            !pickerBinding &&
            literal.shared &&
            isPromotableLiteral(studioType, literalValue),
        )
      const groupScopeLabel = scopeLabelForGroup(group)
      const fontFamilyScopes =
        group === 'fontFamily'
          ? [
              { id: 'suggested', label: 'Suggested' },
              { id: group, label: groupScopeLabel },
              { id: 'google', label: 'Google' },
              { id: 'all', label: 'All' },
            ]
          : [
              { id: 'suggested', label: 'Suggested' },
              { id: group, label: groupScopeLabel },
              { id: 'all', label: 'All' },
            ]
      if (!showPicker) {
        return (
          <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Field label={label} icon={propIcon} size="sm">
              <CommitOnBlurInput
                value={literal.shared ? literalValue : t('editor.mixedValue')}
                placeholder={INSPECT_UNSET_PLACEHOLDER}
                readOnly={multi && !literal.shared}
                data-testid={`inspect-literal-${field.name}`}
                aria-label={field.label}
                onCommit={(next) => writeLiteral(field.name, next)}
              />
            </Field>
            {!multi && isCollectionDataBindableKey(field.name) ? (
              <InspectDataBindField
                fieldKey={field.name}
                boundRef={
                  selected.dataBindings?.[field.name] ??
                  selected.instanceOverrides?.dataBindings?.[field.name] ??
                  null
                }
                platformProjectId={platformProjectId}
                disabled={readOnly || locked}
                onBind={(dataRef) => setDataBinding(field.name, dataRef)}
                onClear={() => clearDataBinding(field.name)}
              />
            ) : null}
          </div>
        )
      }
      const tokenPicker = (
        <TokenPicker
          label={
            sizeBox || fillGroup || typeGroup || effectGroup || rotateField
              ? baseLabel
              : field.label
          }
          icon={propIcon}
          browser
          allowCycle
          allowLiteral
          literalValue={literal.shared ? literalValue : t('editor.mixedValue')}
          literalPlaceholder={INSPECT_UNSET_PLACEHOLDER}
          literalReadOnly={multi && !literal.shared}
          literalTestId={`inspect-literal-${field.name}`}
          onLiteralChange={(raw) => {
            writeLiteral(field.name, raw, sibling)
            if (group === 'fontFamily' && raw.trim()) ensureGoogleFontStylesheet(raw)
          }}
          previewKind={previewKindForGroup(group)}
          contextTitle={useOverride ? `Binding for: ${bpLabel}` : undefined}
          options={options}
          value={pickerBinding}
          suggestedPaths={suggestedPaths}
          scopes={fontFamilyScopes}
          emptyQueryCap={group === 'fontFamily' ? 40 : undefined}
          recentPaths={recentPaths}
          onRecentPathsChange={(paths) => {
            setRecentPaths(paths)
            saveTokenRecent(paths)
          }}
          allowNone
          noneLabel={t('editor.tokenNone')}
          emptyLabel={t('editor.tokenEmpty')}
          clearLabel={t('editor.clearToken')}
          promoteLiteralLabel={t('editor.promoteLiteral')}
          onPromoteLiteral={
            canPromote
              ? () => openPromoteLiteral(field.name, studioType!, literalValue)
              : undefined
          }
          onChange={(path) => {
            const googleFamily = parseGoogleFontLiteralPath(path)
            if (googleFamily) {
              writeLiteral(field.name, googleFamily, sibling)
              ensureGoogleFontStylesheet(googleFamily)
              return
            }
            setToken(field.name, path, sibling)
            if (group === 'fontFamily') {
              const tok = catalog.find((t) => t.path === path)
              const css = tok ? previewForBinding(tok, field.name) : undefined
              if (css) ensureGoogleFontStylesheet(css)
            }
          }}
          onClear={() => writeLiteral(field.name, '', sibling)}
          data-testid={`inspect-token-${field.name}`}
        />
      )

      if (field.name === 'opacity') {
        const boundTok = value ? catalog.find((tok) => tok.path === value) : undefined
        const resolvedPreview = boundTok ? previewForBinding(boundTok, 'opacity') : undefined
        return (
          <InspectOpacityField
            key={field.name}
            sliderAriaLabel={labelText}
            percentAriaLabel={t('editor.inspectOpacityPercent')}
            tokenPath={value}
            literalValue={literal.shared ? literalValue : ''}
            resolvedPreview={resolvedPreview}
            mixed={multi && !literal.shared}
            mixedLabel={t('editor.mixedValue')}
            disabled={readOnly}
            onCommitLiteral={(opacity01) => writeLiteral(field.name, String(opacity01))}
            tokenPicker={tokenPicker}
          />
        )
      }

      return (
        <div key={field.name} className="creation-inspect-live-token">
          {tokenPicker}
        </div>
      )
    }

    return null
  }

  function renderBoxModelField(
    kind: BoxModelKind,
    field: InspectFieldDef,
    writeMode: BoxModelWriteMode,
  ) {
    return renderField(field, { group: 'box', kind, writeMode })
  }

  function renderGapField(field: InspectFieldDef, writeMode: GapWriteMode) {
    return renderField(field, { group: 'gap', writeMode })
  }

  function renderSizeBoxField(field: InspectFieldDef) {
    return renderField(field, undefined, { sizeBox: true })
  }

  function renderFillField(field: InspectFieldDef) {
    return renderField(field, undefined, { fillGroup: true })
  }

  function renderTypeStackField(field: InspectFieldDef) {
    return renderField(field, undefined, { typeGroup: true })
  }

  function renderEffectField(field: InspectFieldDef) {
    return renderField(field, undefined, { effectGroup: true })
  }

  function renderRotateField(field: InspectFieldDef) {
    return renderField(field, undefined, { rotateField: true })
  }

  function renderSectionFields(sectionId: string, visible: InspectFieldDef[]) {
    const { padding, margin, radius, rest: afterBox } = partitionInspectBoxModelFields(visible)
    const { clip, rest: afterClip } =
      sectionId === 'appearance'
        ? partitionInspectClipSlantFields(afterBox)
        : { clip: [] as InspectFieldDef[], rest: afterBox }
    const {
      flow,
      align,
      rest: afterFlow,
    } =
      sectionId === 'layout'
        ? partitionInspectLayoutFlowFields(afterClip)
        : { flow: [] as InspectFieldDef[], align: [] as InspectFieldDef[], rest: afterClip }
    const { gap, rest: afterGap } =
      sectionId === 'layout'
        ? partitionInspectGapFields(afterFlow)
        : { gap: [] as InspectFieldDef[], rest: afterFlow }
    const { sizeBox, rest: afterSize } =
      sectionId === 'constraints'
        ? partitionInspectSizeBoxFields(afterGap)
        : { sizeBox: [] as InspectFieldDef[], rest: afterGap }
    const {
      positionField,
      aspectRatioField,
      zIndexField,
      coordinateFields,
      scaleField,
      transformOriginField,
      skewFields,
      rest: afterPosition,
    } =
      sectionId === 'constraints'
        ? partitionInspectPositionFields(afterSize)
        : {
            positionField: null as InspectFieldDef | null,
            aspectRatioField: null as InspectFieldDef | null,
            zIndexField: null as InspectFieldDef | null,
            coordinateFields: [] as InspectFieldDef[],
            scaleField: null as InspectFieldDef | null,
            transformOriginField: null as InspectFieldDef | null,
            skewFields: [] as InspectFieldDef[],
            rest: afterSize,
          }
    const gridItemNames = new Set([
      'colSpan',
      'colStart',
      'colEnd',
      'rowSpan',
      'rowStart',
      'rowEnd',
      'justifySelf',
      'order',
    ])
    const gridItemFields =
      sectionId === 'constraints'
        ? afterPosition.filter((field) => gridItemNames.has(field.name))
        : []
    const afterGridItem =
      sectionId === 'constraints'
        ? afterPosition.filter((field) => !gridItemNames.has(field.name))
        : afterPosition
    const { alignSelf, rest: afterAlignSelf } =
      sectionId === 'constraints'
        ? partitionInspectAlignSelfFields(afterGridItem)
        : { alignSelf: null as InspectFieldDef | null, rest: afterGridItem }
    const { rotate, rest: afterRotate } =
      sectionId === 'constraints'
        ? partitionInspectRotateFields(afterAlignSelf)
        : { rotate: null as InspectFieldDef | null, rest: afterAlignSelf }
    const { effects, rest: afterEffects } =
      sectionId === 'appearance'
        ? partitionInspectAppearanceEffectFields(afterRotate)
        : { effects: [] as InspectFieldDef[], rest: afterRotate }
    const { fill, rest: afterFill } =
      sectionId === 'fill'
        ? partitionInspectFillFields(afterEffects)
        : { fill: [] as InspectFieldDef[], rest: afterEffects }
    const {
      typeStack,
      typeChrome,
      rest: afterType,
    } =
      sectionId === 'typography'
        ? partitionInspectTypographyFields(afterFill)
        : {
            typeStack: [] as InspectFieldDef[],
            typeChrome: [] as InspectFieldDef[],
            rest: afterFill,
          }
    const isGridSelection =
      isGridLayoutType(selected.type) ||
      selectedNodes.some((node) => isGridLayoutType(node.type))
    const gridFieldNames = new Set([
      'gridTemplateColumns',
      'gridTemplateRows',
      'gridAutoFlow',
      'gridAutoRows',
      'gridAutoColumns',
      'justifyItems',
      'columns',
      ...(isGridSelection ? (['alignItems'] as const) : []),
    ])
    const gridFields =
      sectionId === 'layout'
        ? afterType.filter((field) => gridFieldNames.has(field.name))
        : []
    const afterGrid =
      sectionId === 'layout'
        ? afterType.filter((field) => !gridFieldNames.has(field.name))
        : afterType
    const mediaFieldNames = new Set(['src', 'alt', 'objectFit', 'objectPosition', 'loading'])
    const mediaFields = afterGrid.filter((field) => mediaFieldNames.has(field.name))
    const afterMedia = afterGrid.filter((field) => !mediaFieldNames.has(field.name))
    const rest =
      sectionId === 'layout'
        ? filterAlignContentUnlessWrap(afterMedia, cascaded.props)
        : sectionId === 'appearance'
          ? afterMedia.filter((f) => f.name !== 'opacity')
          : afterMedia
    const boxSource = {
      props: cascaded.props,
      tokenBindings: cascaded.tokenBindings,
    }
    const rows: ReactNode[] = []
    const renderBareControl = (field: InspectFieldDef) =>
      renderField(field, undefined, { bare: true })

    if (sectionId === 'layout') {
      // Grid owns cell park inside InspectGridGroup — never Flex AlignBar / Flow.
      const layoutAlign = isGridSelection ? [] : align
      const layoutFlow = isGridSelection ? [] : flow
      const gridAlignItemsFromAlign = isGridSelection
        ? align.find((field) => field.name === 'alignItems') ?? null
        : null
      if (layoutFlow.length) {
        rows.push(
          <InspectLayoutFlow
            key="layout-flow"
            fields={layoutFlow}
            currentDirection={String(cascaded.props.direction ?? 'column')}
            currentWrap={cascaded.props.wrap as boolean | string | undefined}
            onSetProp={writeProp}
          />,
        )
      }
      if (layoutAlign.length) {
        const axes = readAlignAxisValues(cascaded.props, layoutAlign)
        rows.push(
          <InspectAlignBar
            key="layout-align"
            fields={layoutAlign}
            direction={String(cascaded.props.direction ?? 'column')}
            currentJc={axes.justify}
            currentAi={axes.align}
            distributePackedLabel={t('editor.inspectDistributePacked')}
            distributeEvenLabel={t('editor.inspectDistributeEven')}
            distributeAroundLabel={t('editor.inspectDistributeAround')}
            stretchLabel={t('editor.inspectAlignStretch')}
            matrixLabel={t('editor.inspectAlignMatrix')}
            onCommitAlign={(justifyValue, alignValue) => {
              const keys = resolveAlignAxisKeys(layoutAlign)
              if (!keys) return
              writeProp(keys.justifyKey, justifyValue)
              writeProp(keys.alignKey, alignValue)
            }}
          />,
        )
      }
      if (gap.length) {
        rows.push(
          <InspectGapGroup
            key="layout-gap"
            fields={gap}
            source={boxSource}
            groupLabel={t('editor.propGap')}
            expandLabel={t('editor.inspectGapExpand')}
            collapseLabel={t('editor.inspectGapCollapse')}
            mixedLabel={t('editor.mixedValue')}
            renderField={(field) =>
              renderGapField(field, field.name === 'gap' ? 'uniform' : 'axis')
            }
          />,
        )
      }
      // Only real grid parents mount Grid chrome (SiteStack must not inherit it).
      if (isGridSelection) {
        const gridField = (name: string) =>
          gridFields.find((field) => field.name === name) ?? null
        rows.push(
          <InspectGridGroup
            key="layout-grid"
            columnsField={gridField('columns')}
            gridTemplateColumnsField={gridField('gridTemplateColumns')}
            gridTemplateRowsField={gridField('gridTemplateRows')}
            gridAutoFlowField={gridField('gridAutoFlow')}
            gridAutoRowsField={gridField('gridAutoRows')}
            gridAutoColumnsField={gridField('gridAutoColumns')}
            justifyItemsField={gridField('justifyItems')}
            alignItemsField={gridField('alignItems') ?? gridAlignItemsFromAlign}
            currentTemplate={String(cascaded.props.gridTemplateColumns ?? '')}
            currentColumns={String(cascaded.props.columns ?? '')}
            currentJustifyItems={String(cascaded.props.justifyItems ?? 'stretch')}
            currentAlignItems={String(cascaded.props.alignItems ?? 'stretch')}
            currentAutoFlow={String(cascaded.props.gridAutoFlow ?? 'row')}
            groupLabel={t('editor.inspectGridColumns')}
            advancedLabel={t('editor.inspectGridAdvanced')}
            equalGroupLabel={t('editor.inspectGridPresetEqual')}
            responsiveGroupLabel={t('editor.inspectGridPresetResponsive')}
            splitsGroupLabel={t('editor.inspectGridPresetSplits')}
            onApplyPreset={(preset) => {
              const resolved =
                GRID_PRESETS.find((candidate) => candidate.template === preset.template) ??
                preset
              writeProp('gridTemplateColumns', resolved.template)
              if (gridField('columns')) {
                writeProp('columns', resolved.columns ?? '')
              }
            }}
            onSetCellAlign={(prop, value) => writeProp(prop, value)}
            onSetAutoFlow={(value) => writeProp('gridAutoFlow', value)}
            renderField={renderField}
          />,
        )
      }
      if (padding.length) {
        rows.push(
          <InspectBoxModelGroup
            key="box-padding"
            kind="padding"
            fields={padding}
            source={boxSource}
            groupLabel={t('editor.propPadding')}
            expandLabel={t('editor.inspectBoxExpandSides')}
            collapseLabel={t('editor.inspectBoxCollapseSides')}
            mixedLabel={t('editor.mixedValue')}
            renderField={(field) =>
              renderBoxModelField(
                'padding',
                field,
                field.name === 'padding'
                  ? 'uniform'
                  : ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(
                        field.name,
                      )
                    ? 'sides'
                    : 'axis',
              )
            }
          />,
        )
      }
      if (margin.length) {
        rows.push(
          <InspectBoxModelGroup
            key="box-margin"
            kind="margin"
            fields={margin}
            source={boxSource}
            groupLabel={t('editor.propMargin')}
            expandLabel={t('editor.inspectBoxExpandSides')}
            collapseLabel={t('editor.inspectBoxCollapseSides')}
            mixedLabel={t('editor.mixedValue')}
            renderField={(field) =>
              renderBoxModelField(
                'margin',
                field,
                field.name === 'margin'
                  ? 'uniform'
                  : ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].includes(
                        field.name,
                      )
                    ? 'sides'
                    : 'axis',
              )
            }
          />,
        )
      }
    }

    if (sectionId === 'appearance' && radius.length) {
      rows.push(
        <InspectBoxModelGroup
          key="box-radius"
          kind="radius"
          fields={radius}
          source={boxSource}
          groupLabel={t('editor.propRadius')}
          expandLabel={t('editor.inspectBoxExpandCorners')}
          collapseLabel={t('editor.inspectBoxCollapseCorners')}
          mixedLabel={t('editor.mixedValue')}
          renderField={(field) =>
            renderBoxModelField(
              'radius',
              field,
              field.name === 'radius' ? 'uniform' : 'corners',
            )
          }
        />,
      )
    }

    if (sectionId === 'appearance' && clip.length) {
      rows.push(
        <InspectClipSlantGroup
          key="clip-slant"
          fields={clip}
          source={boxSource}
          groupLabel={t('editor.inspectClipSlantGroup')}
          presetLabel={t('editor.inspectClipPreset')}
          amountLabel={t('editor.inspectClipBottomSlant')}
          mirrorLabel={t('editor.inspectClipMirror')}
          expandLabel={t('editor.inspectClipExpand')}
          collapseLabel={t('editor.inspectClipCollapse')}
          modeInsetsLabel={t('editor.inspectClipModeInsets')}
          modePolygonLabel={t('editor.inspectClipModePolygon')}
          modePathLabel={t('editor.inspectClipModePath')}
          addPointLabel={t('editor.inspectClipAddPoint')}
          removePointLabel={t('editor.inspectClipRemovePoint')}
          convertInsetsLabel={t('editor.inspectClipConvertInsets')}
          presetOptionLabels={{
            none: t('editor.inspectClipPresetNone'),
            'slant-bottom': t('editor.inspectClipPresetSlantBottom'),
            'slant-bottom-flip': t('editor.inspectClipPresetSlantBottomFlip'),
            'slant-top': t('editor.inspectClipPresetSlantTop'),
            trapezoid: t('editor.inspectClipPresetTrapezoid'),
            parallelogram: t('editor.inspectClipPresetParallelogram'),
          }}
          renderField={(field) => renderField(field)}
          onWriteAmount={(amount, mirror) => {
            writeProp('clipPolygon', '')
            writeProp('clipPathD', '')
            writeProp('clipInsetBottomLeftY', amount || '')
            writeProp('clipInsetBottomRightY', mirror && amount ? amount : '')
          }}
          onWritePreset={(preset, amount) => {
            writeProp('clipPolygon', '')
            writeProp('clipPathD', '')
            const props = clipInsetPropsFromPreset(preset, amount)
            for (const [key, value] of Object.entries(props)) {
              writeProp(key, value)
            }
          }}
          onWritePolygon={(points: ClipPolygonPoint[] | null) => {
            if (!points) {
              writeProp('clipPolygon', '')
              return
            }
            for (const [key, value] of Object.entries(clearedClipInsetPropMap())) {
              writeProp(key, value)
            }
            writeProp('clipPathD', '')
            writeProp('clipPolygon', formatClipPolygonPoints(points))
          }}
          onWritePathD={(d: string) => {
            for (const [key, value] of Object.entries(clearedClipInsetPropMap())) {
              writeProp(key, value)
            }
            writeProp('clipPolygon', '')
            writeProp('clipPathD', d)
          }}
          onWriteInsetsFromPolygon={(insetProps) => {
            writeProp('clipPolygon', '')
            writeProp('clipPathD', '')
            for (const key of CLIP_INSET_PROP_KEYS) {
              writeProp(key, insetProps[key] ?? '')
            }
          }}
        />,
      )
    }

    if (sectionId === 'appearance') {
      const opacityField = afterEffects.find((f) => f.name === 'opacity')
      if (opacityField) rows.push(renderField(opacityField))
    }

    if (sectionId === 'appearance' && effects.length) {
      rows.push(
        <InspectAppearanceEffects
          key="appearance-effects"
          fields={effects}
          groupLabel={t('editor.inspectEffectsGroup')}
          overflowLabel={t('editor.inspectOverflow')}
          renderTokenField={renderEffectField}
          currentOverflow={String(cascaded.props.overflow ?? 'visible')}
          onSetOverflow={(value) => writeProp('overflow', value)}
        />,
      )
    }

    if (sectionId === 'constraints' && sizeBox.length) {
      rows.push(
        <InspectSizeBoxGroup
          key="constraints-size-box"
          fields={sizeBox}
          source={boxSource}
          groupLabel={t('editor.inspectSizeBox')}
          expandLabel={t('editor.inspectSizeExpand')}
          collapseLabel={t('editor.inspectSizeCollapse')}
          hugLabel={t('editor.inspectSizeHug')}
          fillLabel={t('editor.inspectSizeFill')}
          fixedLabel={t('editor.inspectSizeFixed')}
          renderField={renderSizeBoxField}
          onSetDimension={(dimension, mode) => {
            if (mode === 'hug') {
              writeProp(dimension, 'auto')
              return
            }
            if (mode === 'fill') {
              writeProp(dimension, '100%')
              return
            }
            const current = String(cascaded.props[dimension] ?? '')
            const alreadyFixed =
              Boolean(current) &&
              current !== 'auto' &&
              current !== 'fit-content' &&
              current !== '100%' &&
              current !== '1fr'
            if (!alreadyFixed) writeProp(dimension, dimension === 'width' ? '200' : '120')
          }}
        />,
      )
    }

    if (
      sectionId === 'constraints' &&
      (positionField ||
        aspectRatioField ||
        zIndexField ||
        coordinateFields.length ||
        scaleField ||
        transformOriginField ||
        skewFields.length)
    ) {
      rows.push(
        <InspectPositionGroup
          key="constraints-position"
          positionField={positionField}
          aspectRatioField={aspectRatioField}
          zIndexField={zIndexField}
          coordinateFields={coordinateFields}
          scaleField={scaleField}
          transformOriginField={transformOriginField}
          skewFields={skewFields}
          currentPosition={String(cascaded.props.position ?? 'static')}
          currentOrigin={String(cascaded.props.transformOrigin ?? 'center')}
          onSetPosition={(value) => writeProp('position', value)}
          onSetOrigin={(value) => writeProp('transformOrigin', value)}
          renderField={renderSizeBoxField}
          groupLabel={t('editor.inspectPositionGroup')}
        />,
      )
    }

    if (sectionId === 'constraints' && gridItemFields.length) {
      const gridItemField = (name: string) =>
        gridItemFields.find((field) => field.name === name) ?? null
      rows.push(
        <InspectGridItemGroup
          key="constraints-grid-item"
          colSpanField={gridItemField('colSpan')}
          colStartField={gridItemField('colStart')}
          colEndField={gridItemField('colEnd')}
          rowSpanField={gridItemField('rowSpan')}
          rowStartField={gridItemField('rowStart')}
          rowEndField={gridItemField('rowEnd')}
          justifySelfField={gridItemField('justifySelf')}
          orderField={gridItemField('order')}
          currentColSpan={String(cascaded.props.colSpan ?? 'auto')}
          currentRowSpan={String(cascaded.props.rowSpan ?? 'auto')}
          onSetSpan={(axis, span) => writeProp(axis === 'col' ? 'colSpan' : 'rowSpan', span)}
          renderField={renderField}
        />,
      )
    }

    if (sectionId === 'constraints' && alignSelf) {
      const multiVal = multi
        ? sharedFieldValue(selectedNodes, alignSelf, activeBreakpoint, primaryBreakpoint)
        : {
            value: fieldValue(selected!, alignSelf, cascaded),
            shared: true,
          }
      rows.push(
        <InspectAlignSelfGrid
          key="constraints-align-self"
          field={alignSelf}
          value={multiVal.shared ? multiVal.value : ''}
          onChange={(next) => writeProp(alignSelf.name, next)}
          groupLabel={t('editor.inspectAlignSelf')}
          stretchLabel={t('editor.inspectAlignSelfStretch')}
          autoLabel={t('editor.inspectAlignSelfAuto')}
          disabled={readOnly || (multi && !multiVal.shared)}
        />,
      )
    }

    if (sectionId === 'constraints' && rotate) {
      rows.push(
        <div
          key="constraints-rotate"
          className="creation-inspect-rotate"
          data-testid="inspect-rotate-field"
        >
          {renderRotateField(rotate)}
        </div>,
      )
    }

    if (sectionId === 'fill' && fill.length) {
      rows.push(
        <InspectFillGroup
          key="fill-group"
          fields={fill}
          source={boxSource}
          groupLabel={t('editor.inspectFillGroup')}
          expandLabel={t('editor.inspectFillExpand')}
          collapseLabel={t('editor.inspectFillCollapse')}
          renderField={renderFillField}
          onSetProp={(key, value) => writeProp(key, value)}
          onClearProp={(key) => writeProp(key, '')}
          onOpenAssetLibrary={onOpenAssetLibrary ? () => onOpenAssetLibrary('background') : undefined}
        />,
      )
    }

    if (sectionId === 'typography' && (typeStack.length || typeChrome.length)) {
      rows.push(
        <InspectTypographyGroup
          key="typography-group"
          stackFields={typeStack}
          chromeFields={typeChrome}
          groupLabel={t('editor.inspectTypographyGroup')}
          alignLabel={t('editor.inspectTypeAlign')}
          decorationLabel={t('editor.inspectTypeDecoration')}
          transformLabel={t('editor.inspectTypeTransform')}
          renderStackField={renderTypeStackField}
          renderChromeControl={renderBareControl}
        />,
      )
    }

    if (mediaFields.length) {
      const mediaField = (name: string) =>
        mediaFields.find((field) => field.name === name) ?? null
      rows.push(
        <InspectMediaGroup
          key={`${sectionId}-media`}
          srcField={mediaField('src')}
          altField={mediaField('alt')}
          objectFitField={mediaField('objectFit')}
          objectPositionField={mediaField('objectPosition')}
          loadingField={mediaField('loading')}
          currentSrc={String(cascaded.props.src ?? '')}
          currentFit={String(cascaded.props.objectFit ?? 'cover')}
          currentPos={String(cascaded.props.objectPosition ?? 'center')}
          onSetSrc={(src) => writeProp('src', src)}
          onSetPosition={(position) => writeProp('objectPosition', position)}
          onSetFit={(fit) => writeProp('objectFit', fit)}
          onOpenAssetLibrary={onOpenAssetLibrary ? () => onOpenAssetLibrary('image') : undefined}
          renderField={renderField}
          groupLabel={t('editor.inspectMediaGroup')}
        />,
      )
    }

    rows.push(
      ...pairInspectFields(rest).map((row) =>
        Array.isArray(row) ? (
          <div key={row[0].name} className="creation-inspect-pair">
            {renderField(row[0])}
            {renderField(row[1])}
          </div>
        ) : (
          renderField(row)
        ),
      ),
    )

    return rows
  }

  return {
    renderField,
    renderBoxModelField,
    renderGapField,
    renderSizeBoxField,
    renderFillField,
    renderTypeStackField,
    renderEffectField,
    renderRotateField,
    renderSectionFields,
  }
}

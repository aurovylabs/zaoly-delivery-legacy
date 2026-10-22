import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { EDITOR_PALETTE_TYPES } from '@zaoly/contracts'
import { inspectFieldsForType, INSPECT_UNSET_PLACEHOLDER, inspectUsesTokenPicker, pairInspectFields, variantAxisFieldsForType } from '../lib/inspect/field-catalog'
import { groupPropsIntoInspectSections } from '../lib/inspect/sections'
import {
  layoutGapFromBindings,
  parseInspectLiteral,
  resolveArtboardFillCss,
  resolveEnumPropsToStyle,
  resolveNodePaintStyle,
  resolveSurfacePropsToStyle,
  resolveTokenBindingsToStyle,
  cssGapLiteral,
} from '../lib/inspect/resolve-bindings'
import { tokenDisplayLabel, tokensForGroup } from '../lib/inspect/token-catalog'
import { printChipSurfacePaint, PRINT_CHIP_SURFACE_VARS } from '../lib/scene/print-chip-surface'
import { printSurfaceGrainPaint, PRINT_GRAIN_VARS } from '../lib/scene/print-surface-grain'
import { applySceneOp } from '../lib/scene/ops'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('inspect field catalog', () => {
  it('groups Text fields into Penpot-like sections including Appearance radius', () => {
    const fields = inspectFieldsForType('Text')
    const sections = groupPropsIntoInspectSections(fields)
    const ids = sections.map((s) => s.id)
    expect(ids).toContain('component')
    expect(ids).toContain('appearance')
    expect(ids).toContain('typography')
    expect(fields.some((f) => f.name === 'radius' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'fontSize' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'color' && f.section === 'fill')).toBe(true)
  })

  it('exposes Heading / Grid / Link / Badge / Spacer fields', () => {
    expect(inspectFieldsForType('Heading').some((f) => f.name === 'level')).toBe(true)
    expect(inspectFieldsForType('Grid').some((f) => f.name === 'columns')).toBe(true)
    expect(inspectFieldsForType('Link').some((f) => f.name === 'href')).toBe(true)
    expect(inspectFieldsForType('Badge').some((f) => f.name === 'tone' && f.control === 'segmented')).toBe(
      true,
    )
    expect(inspectFieldsForType('Spacer').some((f) => f.name === 'axis')).toBe(true)
  })

  it('exposes overflow on catalog shells, FormSection, and SiteStack', () => {
    expect(inspectFieldsForType('Button').some((f) => f.name === 'overflow')).toBe(true)
    expect(inspectFieldsForType('FormSection').some((f) => f.name === 'overflow')).toBe(true)
    expect(inspectFieldsForType('SiteStack').some((f) => f.name === 'overflow')).toBe(true)
    expect(inspectFieldsForType('Stack').some((f) => f.name === 'overflow')).toBe(true)
  })

  it('P54 PrintChip inspect includes label proxy + border/radius/size', () => {
    const fields = inspectFieldsForType('PrintChip')
    expect(fields.some((f) => f.name === 'children' && f.label === 'Label / text')).toBe(true)
    expect(fields.some((f) => f.name === 'width' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'height' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'borderWidth' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'borderColor' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'borderStyle' && f.kind === 'enum')).toBe(true)
    expect(fields.some((f) => f.name === 'radius' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'color' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'background' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'tone' && f.kind === 'enum' && f.control === 'segmented')).toBe(true)
    expect(fields.some((f) => f.name === 'variant')).toBe(false)
    expect(fields.some((f) => f.name === 'size' && f.section === 'component')).toBe(false)
    expect(fields.some((f) => f.name === 'selected')).toBe(false)
    const cover = inspectFieldsForType('PrintCover')
    expect(cover.some((f) => f.name === 'borderWidth')).toBe(true)
    const chip = inspectFieldsForType('Chip')
    expect(chip.some((f) => f.name === 'size')).toBe(true)
    expect(chip.some((f) => f.name === 'selected')).toBe(true)
  })

  it('P55 PrintChip inspect includes alignment fields', () => {
    const fields = inspectFieldsForType('PrintChip')
    expect(fields.some((f) => f.name === 'textAlign' && f.kind === 'enum')).toBe(true)
    expect(fields.some((f) => f.name === 'alignSelf' && f.kind === 'enum')).toBe(true)
    expect(fields.some((f) => f.name === 'padding' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'variant')).toBe(false)
    const chip = inspectFieldsForType('Chip')
    expect(chip.some((f) => f.name === 'size')).toBe(true)
    expect(chip.some((f) => f.name === 'selected')).toBe(true)
    expect(chip.some((f) => f.name === 'children')).toBe(true)
    expect(inspectFieldsForType('Grid').some((f) => f.name === 'columns')).toBe(true)
    const workspaceTests = readFileSync(
      path.resolve(__dirname, './editor-workspace.test.tsx'),
      'utf8',
    )
    expect(workspaceTests).toContain('/^Chip$/i')
    expect(workspaceTests).toContain('/^Grid$/i')
  })

  it('P55 print containers inspect includes flex alignment', () => {
    for (const type of ['PrintChipRow', 'PrintTwoColumn', 'PrintPersonaCard'] as const) {
      const fields = inspectFieldsForType(type)
      expect(fields.some((f) => f.name === 'justifyContent' && f.kind === 'enum')).toBe(true)
      expect(fields.some((f) => f.name === 'alignItems' && f.kind === 'enum')).toBe(true)
      expect(fields.some((f) => f.name === 'borderWidth' && f.kind === 'token')).toBe(true)
      expect(fields.some((f) => f.name === 'padding' && f.kind === 'token')).toBe(true)
    }
    expect(inspectFieldsForType('Stack').some((f) => f.name === 'justify')).toBe(true)
    expect(inspectFieldsForType('Stack').some((f) => f.name === 'justifyContent')).toBe(false)
  })

  it('P23 Stack density: padding sides, token gap, segmented direction', () => {
    const fields = inspectFieldsForType('Stack')
    expect(fields.some((f) => f.name === 'paddingTop' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'paddingLeft' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'marginTop' && f.kind === 'token' && f.tokenGroup === 'space')).toBe(
      true,
    )
    expect(fields.some((f) => f.name === 'margin' && f.kind === 'token' && f.tokenGroup === 'space')).toBe(
      true,
    )
    expect(fields.some((f) => f.name === 'gap' && f.kind === 'token' && f.tokenGroup === 'space')).toBe(
      true,
    )
    expect(fields.some((f) => f.name === 'direction' && f.control === 'segmented')).toBe(true)
    expect(fields.some((f) => f.name === 'align' && f.control === 'segmented')).toBe(true)
    expect(fields.some((f) => f.name === 'minWidth' && f.kind === 'token')).toBe(true)
    expect(fields.some((f) => f.name === 'blur' && f.kind === 'token')).toBe(true)
    expect(fields.length).toBeGreaterThan(30)
  })

  it('P83 registry exposes per-corner radius keys', () => {
    const fields = inspectFieldsForType('Card')
    for (const name of [
      'radius',
      'radiusTopLeft',
      'radiusTopRight',
      'radiusBottomRight',
      'radiusBottomLeft',
    ]) {
      expect(fields.some((f) => f.name === name && f.kind === 'token')).toBe(true)
    }
  })

  it('P85 Stack exposes rowGap / columnGap beside gap', () => {
    const fields = inspectFieldsForType('Stack')
    expect(fields.some((f) => f.name === 'gap' && f.tokenGroup === 'space')).toBe(true)
    expect(fields.some((f) => f.name === 'rowGap' && f.tokenGroup === 'space')).toBe(true)
    expect(fields.some((f) => f.name === 'columnGap' && f.tokenGroup === 'space')).toBe(true)
  })

  it('P23 Text typography + Card gap token', () => {
    const text = inspectFieldsForType('Text')
    expect(text.some((f) => f.name === 'fontFamily' && f.kind === 'token')).toBe(true)
    expect(text.some((f) => f.name === 'lineHeight' && f.kind === 'token')).toBe(true)
    expect(text.some((f) => f.name === 'letterSpacing' && f.kind === 'token')).toBe(true)
    const card = inspectFieldsForType('Card')
    expect(card.some((f) => f.name === 'gap' && f.kind === 'token')).toBe(true)
    expect(card.length).toBeGreaterThan(10)
  })

  it('pairs width/height and padding sides', () => {
    const rows = pairInspectFields(inspectFieldsForType('Stack'))
    expect(
      rows.some(
        (row) => Array.isArray(row) && row[0].name === 'width' && row[1].name === 'height',
      ),
    ).toBe(true)
    expect(
      rows.some(
        (row) =>
          Array.isArray(row) && row[0].name === 'paddingTop' && row[1].name === 'paddingBottom',
      ),
    ).toBe(true)
    expect(
      rows.some(
        (row) =>
          Array.isArray(row) && row[0].name === 'marginTop' && row[1].name === 'marginBottom',
      ),
    ).toBe(true)
  })

  it('P56 PrintChip inspect keeps live W/H/radius/opacity/textAlign/border', () => {
    const fields = inspectFieldsForType('PrintChip')
    for (const name of [
      'width',
      'height',
      'radius',
      'opacity',
      'textAlign',
      'borderWidth',
      'borderColor',
      'borderStyle',
      'background',
      'color',
      'padding',
    ]) {
      expect(fields.some((f) => f.name === name)).toBe(true)
    }
    const sections = groupPropsIntoInspectSections(fields)
    const fill = sections.find((s) => s.id === 'fill')
    const appearance = sections.find((s) => s.id === 'appearance')
    expect(fill?.props.some((f) => f.name === 'borderWidth')).toBe(true)
    expect(fill?.props.some((f) => f.name === 'background')).toBe(true)
    expect(fill?.props.some((f) => f.name === 'color')).toBe(true)
    expect(appearance?.props.some((f) => f.name === 'radius')).toBe(true)
    expect(appearance?.props.some((f) => f.name === 'opacity')).toBe(true)
    expect(appearance?.props.some((f) => f.name === 'rotate')).toBe(false)
    expect(sections.some((s) => s.id === 'typography' && s.props.some((f) => f.name === 'textAlign'))).toBe(
      true,
    )
    expect(INSPECT_UNSET_PLACEHOLDER).toBe('—')
  })

  it('P90 Stack catalog parks rotate under Constraints, not Appearance', () => {
    const fields = inspectFieldsForType('Stack')
    expect(fields.some((f) => f.name === 'rotate' && f.section === 'constraints')).toBe(true)
    expect(fields.some((f) => f.name === 'rotate' && f.section === 'appearance')).toBe(false)
    const sections = groupPropsIntoInspectSections(fields)
    expect(sections.find((s) => s.id === 'constraints')?.props.some((f) => f.name === 'rotate')).toBe(
      true,
    )
    expect(sections.find((s) => s.id === 'appearance')?.props.some((f) => f.name === 'rotate')).toBe(
      false,
    )
  })

  it('P56 DESIGN catalog does not hide unset optional surface fields', () => {
    const fields = inspectFieldsForType('PrintChip')
    const sections = groupPropsIntoInspectSections(fields)
    const names = sections.flatMap((s) => s.props.map((f) => f.name))
    expect(names).toEqual(expect.arrayContaining(['width', 'borderWidth', 'textAlign', 'background']))
    const inspector = [
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/index.tsx'), 'utf8'),
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/use-inspector-field-renderer.tsx'), 'utf8'),
    ].join('\n')
    expect(inspector).toContain('inspect-literal-')
    expect(inspector).toContain('writeLiteral')
    expect(inspector).toContain('INSPECT_UNSET_PLACEHOLDER')
    expect(inspector).toContain('literalFieldValue')
    expect(inspector).toContain('inspectUsesTokenPicker')
    const fieldValues = readFileSync(
      path.resolve(__dirname, '../lib/inspect/inspector-field-values.ts'),
      'utf8',
    )
    expect(fieldValues).toContain('function literalFieldValue')
    expect(fieldValues).toContain('function tokenBindingForPicker')
  })

  it('P57+P76 length DESIGN fields keep typable literals and restore TokenPicker', () => {
    expect(inspectUsesTokenPicker('size')).toBe(true)
    expect(inspectUsesTokenPicker('radius')).toBe(true)
    expect(inspectUsesTokenPicker('opacity')).toBe(true)
    expect(inspectUsesTokenPicker('space')).toBe(true)
    expect(inspectUsesTokenPicker('blur')).toBe(true)
    expect(inspectUsesTokenPicker('rotate')).toBe(true)
    expect(inspectUsesTokenPicker('color')).toBe(true)
    expect(inspectUsesTokenPicker('fontFamily')).toBe(true)
    expect(inspectUsesTokenPicker(undefined)).toBe(false)
    const inspector = [
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/index.tsx'), 'utf8'),
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/use-inspector-field-renderer.tsx'), 'utf8'),
    ].join('\n')
    expect(inspector).toContain('aria-label={field.label}')
    expect(inspector).toContain('inspectUsesTokenPicker')
    expect(inspector).toContain('isLengthTokenGroup')
    expect(inspector).toContain('allowLiteral')
    expect(inspector).toContain('onLiteralChange')
    expect(inspector).toContain('writeLiteral')
    const workspaceTests = readFileSync(
      path.resolve(__dirname, './editor-workspace.test.tsx'),
      'utf8',
    )
    expect(workspaceTests).toContain('P57 types PrintChip Width')
    expect(workspaceTests).toContain("setInspectLiteral(width, '120')")
    expect(workspaceTests).toContain('P76 binds PrintChip')
    expect(workspaceTests).toContain('/^Chip$/i')
    expect(workspaceTests).toContain('/^Grid$/i')
  })

  it('P58 every audited palette type has typable size chrome; variants only from DS', () => {
    const chrome = ['width', 'height', 'radius', 'opacity', 'padding', 'borderWidth', 'background', 'color']
    const audit: Array<{
      type: string
      align: 'textAlign' | 'flex' | 'stack'
      fields: string[]
      axes: string[]
      forbidden: string[]
    }> = [
      { type: 'PrintChip', align: 'textAlign', fields: ['tone'], axes: ['tone'], forbidden: ['variant', 'selected'] },
      { type: 'PrintPage', align: 'flex', fields: [], axes: [], forbidden: ['variant'] },
      { type: 'PrintCover', align: 'flex', fields: [], axes: [], forbidden: ['variant'] },
      { type: 'PrintChapter', align: 'flex', fields: [], axes: [], forbidden: ['variant'] },
      { type: 'Stack', align: 'stack', fields: ['direction'], axes: [], forbidden: ['justifyContent'] },
      { type: 'Field', align: 'flex', fields: ['size'], axes: ['size'], forbidden: [] },
      { type: 'Chip', align: 'textAlign', fields: ['size', 'selected'], axes: ['size'], forbidden: [] },
      { type: 'Button', align: 'textAlign', fields: ['variant', 'size', 'shape'], axes: ['variant', 'size', 'shape'], forbidden: [] },
      { type: 'PrintPersonaCard', align: 'flex', fields: ['spread'], axes: [], forbidden: ['variant'] },
      { type: 'PrintRankedList', align: 'flex', fields: ['columns', 'compact'], axes: [], forbidden: [] },
    ]
    for (const row of audit) {
      const fields = inspectFieldsForType(row.type)
      for (const name of chrome) {
        expect(fields.some((f) => f.name === name)).toBe(true)
      }
      expect(fields.some((f) => f.name === 'alignSelf')).toBe(true)
      if (row.align === 'textAlign') {
        expect(fields.some((f) => f.name === 'textAlign')).toBe(true)
      } else if (row.align === 'flex') {
        expect(fields.some((f) => f.name === 'justifyContent')).toBe(true)
        expect(fields.some((f) => f.name === 'alignItems')).toBe(true)
      } else {
        expect(fields.some((f) => f.name === 'align')).toBe(true)
        expect(fields.some((f) => f.name === 'justify')).toBe(true)
        expect(fields.some((f) => f.name === 'justifyContent')).toBe(false)
      }
      for (const name of row.fields) {
        expect(fields.some((f) => f.name === name)).toBe(true)
      }
      const axes = variantAxisFieldsForType(row.type).map((f) => f.name)
      expect(axes).toEqual(row.axes)
      for (const name of row.forbidden) {
        expect(fields.some((f) => f.name === name)).toBe(false)
      }
    }
    expect(inspectFieldsForType('Chip').some((f) => f.name === 'children')).toBe(true)
    expect(inspectFieldsForType('PrintChip').some((f) => f.name === 'size' && f.section === 'component')).toBe(
      false,
    )
    expect(inspectFieldsForType('Grid').some((f) => f.name === 'columns')).toBe(true)
    expect(inspectFieldsForType('Stack').find((f) => f.name === 'align')?.defaultValue).toBeUndefined()
    expect(inspectUsesTokenPicker('size')).toBe(true)
    expect(inspectUsesTokenPicker('color')).toBe(true)
    const workspaceTests = readFileSync(
      path.resolve(__dirname, './editor-workspace.test.tsx'),
      'utf8',
    )
    expect(workspaceTests).toContain('P58 types Stack Width')
    expect(workspaceTests).toContain('/^Chip$/i')
    expect(workspaceTests).toContain('/^Grid$/i')
  })

  it('P56 every palette type exposes live size/chrome; Chip flatten and Grid stay', () => {
    for (const type of EDITOR_PALETTE_TYPES) {
      const fields = inspectFieldsForType(type)
      expect(fields.some((f) => f.name === 'width')).toBe(true)
      expect(fields.some((f) => f.name === 'height')).toBe(true)
      expect(fields.some((f) => f.name === 'radius')).toBe(true)
      expect(fields.some((f) => f.name === 'opacity')).toBe(true)
    }
    expect(inspectFieldsForType('Panel').some((f) => f.name === 'justifyContent')).toBe(true)
    expect(inspectFieldsForType('Field').some((f) => f.name === 'justifyContent')).toBe(true)
    expect(inspectFieldsForType('Card').some((f) => f.name === 'padding')).toBe(true)
    expect(inspectFieldsForType('Text').some((f) => f.name === 'textAlign')).toBe(true)
    const chip = inspectFieldsForType('Chip')
    expect(chip.some((f) => f.name === 'size')).toBe(true)
    expect(chip.some((f) => f.name === 'selected')).toBe(true)
    expect(chip.some((f) => f.name === 'children')).toBe(true)
    expect(inspectFieldsForType('Grid').some((f) => f.name === 'columns')).toBe(true)
    expect(inspectFieldsForType('Grid').some((f) => f.name === 'justifyContent')).toBe(false)
    const workspaceTests = readFileSync(
      path.resolve(__dirname, './editor-workspace.test.tsx'),
      'utf8',
    )
    expect(workspaceTests).toContain('/^Chip$/i')
    expect(workspaceTests).toContain('/^Grid$/i')
  })
})

describe('token bindings resolve', () => {
  it('maps radius.control.md to borderRadius preview', () => {
    const style = resolveTokenBindingsToStyle({ radius: 'radius.control.md', opacity: 'opacity.disabled' })
    expect(style.borderRadius).toBe('0')
    expect(style.opacity).toBe('0.4')
  })

  it('maps per-corner radius bindings to CSS longhands', () => {
    const style = resolveTokenBindingsToStyle({
      radiusTopLeft: 'radius.control.sm',
      radiusTopRight: 'radius.control.md',
    })
    expect(style.borderTopLeftRadius).toBe('0')
    expect(style.borderTopRightRadius).toBe('0')
  })

  it('maps padding sides, blur, rotate, and type tokens', () => {
    const style = resolveTokenBindingsToStyle({
      paddingTop: 'spacing.static.small',
      marginLeft: 'spacing.margin.sm',
      minWidth: 'size.logo.min',
      blur: 'blur.sm',
      rotate: 'rotate.15',
      fontFamily: 'typography.body.family',
      lineHeight: 'typography.heading.h1',
      gap: 'spacing.static.large',
    })
    expect(style.paddingTop).toBe('0.5rem')
    expect(style.marginLeft).toBe('0.5rem')
    expect(style.minWidth).toBe('24px')
    expect(style.filter).toBe('blur(4px)')
    expect(style.transform).toBe('rotate(15deg)')
    expect(style.fontFamily).toMatch(/Geist/)
    expect(style.lineHeight).toBe('1.2')
    expect(style.gap).toBe('2rem')
  })

  it('maps spacing token gap onto Stack/Grid gap ids', () => {
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.medium' })).toBe('md')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.large' })).toBe('lg')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.1' })).toBe('xs')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.2' })).toBe('sm')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.3' })).toBe('md')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.4' })).toBe('lg')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.5' })).toBe('xl')
    expect(layoutGapFromBindings({}, { gap: 'spacing.static.6' })).toBe('xl')
    expect(layoutGapFromBindings({}, { gap: 'spacing.gap.tight' })).toBe('sm')
    expect(layoutGapFromBindings({}, { gap: 'spacing.gap.modules' })).toBe('lg')
    expect(layoutGapFromBindings({}, { gap: 'spacing.gap.xs' })).toBe('xs')
    expect(layoutGapFromBindings({ gap: 'sm' }, {})).toBe('sm')
    expect(layoutGapFromBindings({ gap: 'sm' }, { gap: 'spacing.gap.modules' })).toBe('sm')
    expect(layoutGapFromBindings({ gap: 16 }, {})).toBe('none')
    expect(layoutGapFromBindings({ gap: '12px' }, {})).toBe('none')
    expect(cssGapLiteral({ gap: 16 })).toBe(16)
    expect(cssGapLiteral({ gap: '12px' })).toBe('12px')
    expect(cssGapLiteral({ gap: 'md' })).toBeUndefined()
    expect(resolveSurfacePropsToStyle({ gap: 16 }).gap).toBe(16)
    expect(resolveSurfacePropsToStyle({ gap: 'md' }).gap).toBeUndefined()
  })

  it('D7 space TokenPicker lists static + role leaves', () => {
    const space = tokensForGroup('space')
    expect(space.some((t) => t.path === 'spacing.static.small')).toBe(true)
    expect(space.some((t) => t.path === 'spacing.padding.sm')).toBe(true)
    expect(space.some((t) => t.path === 'spacing.margin.page')).toBe(true)
    expect(space.some((t) => t.path === 'spacing.gap.tight')).toBe(true)
  })

  it('maps overflow / decoration / transform enums to preview CSS', () => {
    const style = resolveEnumPropsToStyle({
      overflow: 'hidden',
      textDecoration: 'underline',
      textTransform: 'uppercase',
      alignSelf: 'center',
    })
    expect(style.overflow).toBe('hidden')
    expect(style.textDecoration).toBe('underline')
    expect(style.textTransform).toBe('uppercase')
    expect(style.alignSelf).toBe('center')
    expect(resolveEnumPropsToStyle({ textTransform: 'none' }).textTransform).toBe('none')
    expect(resolveEnumPropsToStyle({ textDecoration: 'none' }).textDecoration).toBe('none')
  })

  it('P56 props beat baked node.style for typography paint keys', () => {
    const style = resolveNodePaintStyle(
      { fontWeight: '700', fontSize: '24px', fontFamily: 'Lato' },
      {
        fontWeight: 'typography.body.family',
        fontSize: 'typography.body.family',
        fontFamily: 'typography.body.family',
      },
      {
        fontWeight: '400',
        fontSize: '0.78rem',
        fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      },
      undefined,
    )
    expect(style.fontWeight).toBe('700')
    expect(style.fontSize).toBe('24px')
    expect(String(style.fontFamily)).toMatch(/Lato/)
  })

  it('P56 parseInspectLiteral and shared apply map honor unset vs typed values', () => {
    expect(parseInspectLiteral('')).toBe('')
    expect(parseInspectLiteral('  ')).toBe('')
    expect(parseInspectLiteral('96')).toBe(96)
    expect(parseInspectLiteral('12px')).toBe('12px')
    expect(resolveSurfacePropsToStyle({}).width).toBeUndefined()
    expect(resolveSurfacePropsToStyle({ width: 96 }).width).toBe(96)
    expect(resolveSurfacePropsToStyle({ radius: '12px' }).borderRadius).toBe('12px')
    const painted = resolveNodePaintStyle({ width: 120, radius: '8px' }, {}, { height: 24 })
    expect(painted.width).toBe(120)
    expect(painted.height).toBe(24)
    expect(painted.borderRadius).toBe('8px')
    const stackPaint = resolveNodePaintStyle({ width: 160, background: '#fafafa' }, {}, undefined)
    expect(stackPaint.width).toBe(160)
    expect(stackPaint.backgroundColor).toBe('#fafafa')
    expect(
      resolveArtboardFillCss({ background: '#112233' }, {}, undefined),
    ).toBe('#112233')
    expect(
      resolveArtboardFillCss({}, { background: 'color.neutral.100' }, undefined),
    ).toBe('#f3eee4')
    expect(resolveArtboardFillCss({}, {}, undefined)).toBeUndefined()
  })

  it('P56 PrintChip width/radius props paint wrap size and inner chip vars', () => {
    const style = resolveNodePaintStyle(
      { width: 96, radius: '12px', opacity: '0.8' },
      {},
      undefined,
    )
    const painted = printChipSurfacePaint(style)
    expect(painted.size).toBe(true)
    expect(painted.radius).toBe(true)
    expect(painted.wrapStyle.width).toBe(96)
    expect(painted.wrapStyle.opacity).toBe('0.8')
    expect(painted.wrapStyle.borderRadius).toBeUndefined()
    expect((painted.wrapStyle as Record<string, string>)[PRINT_CHIP_SURFACE_VARS.radius]).toBe(
      '12px',
    )
  })

  it('P55 enum props map textAlign / justifyContent / alignItems to wrap CSS', () => {
    const style = resolveEnumPropsToStyle({
      textAlign: 'center',
      justifyContent: 'space-between',
      alignItems: 'center',
    })
    expect(style.textAlign).toBe('center')
    expect(style.justifyContent).toBe('space-between')
    expect(style.alignItems).toBe('center')
  })

  it('P54 PrintChip surface paint forwards stroke vars off the wrap box', () => {
    const painted = printChipSurfacePaint({
      borderWidth: '2px',
      borderColor: 'var(--print-line)',
      borderStyle: 'dashed',
      width: 96,
    })
    expect(painted.stroke).toBe(true)
    expect(painted.size).toBe(true)
    expect(painted.wrapStyle.borderWidth).toBeUndefined()
    expect(painted.wrapStyle.borderColor).toBeUndefined()
    expect((painted.wrapStyle as Record<string, string>)[PRINT_CHIP_SURFACE_VARS.borderWidth]).toBe(
      '2px',
    )
    expect((painted.wrapStyle as Record<string, string>)[PRINT_CHIP_SURFACE_VARS.borderStyle]).toBe(
      'dashed',
    )
    expect(painted.wrapStyle.width).toBe(96)
  })

  it('P55 print grain forwards alignment vars and keeps wrap textAlign', () => {
    const painted = printSurfaceGrainPaint({
      textAlign: 'center',
      justifyContent: 'flex-end',
      alignItems: 'center',
      alignSelf: 'flex-end',
    })
    expect(painted.textAlign).toBe(true)
    expect(painted.justifyContent).toBe(true)
    expect(painted.alignItems).toBe(true)
    expect(painted.typography).toBe(false)
    expect(painted.wrapStyle.textAlign).toBe('center')
    expect(painted.wrapStyle.alignSelf).toBe('flex-end')
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBe('center')
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.justifyContent]).toBe(
      'flex-end',
    )
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.alignItems]).toBe('center')
    const unset = printSurfaceGrainPaint({})
    expect(unset.textAlign).toBe(false)
    expect(unset.justifyContent).toBe(false)
    expect((unset.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBeUndefined()
  })

  it('P91 print grain parks alignSelf via margin; does not invent text-align', () => {
    const painted = printSurfaceGrainPaint({ alignSelf: 'flex-end' })
    expect(painted.blockAlign).toBe(true)
    expect(painted.textAlign).toBe(false)
    expect((painted.wrapStyle as Record<string, string>).marginLeft).toBe('auto')
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBeUndefined()
  })

  it('P90 print grain mirrors alignItems to text-align var for PrintTable cells', () => {
    const painted = printSurfaceGrainPaint({ alignItems: 'center' })
    expect(painted.alignItems).toBe(true)
    expect(painted.textAlign).toBe(true)
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBe('center')
    const end = printSurfaceGrainPaint({ alignItems: 'flex-end' })
    expect((end.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBe('right')
  })

  it('filters Brandion groups including typography facets', () => {
    expect(tokensForGroup('radius').some((t) => t.path === 'radius.control.md')).toBe(true)
    expect(tokensForGroup('space').some((t) => t.path === 'spacing.static.medium')).toBe(true)
    expect(tokensForGroup('fontFamily').some((t) => t.path === 'typography.heading.h1')).toBe(true)
    expect(tokensForGroup('fontSize').some((t) => t.path === 'typography.body.family')).toBe(true)
    expect(tokensForGroup('blur').some((t) => t.path === 'blur.md')).toBe(true)
    const h1 = tokensForGroup('fontFamily').find((t) => t.path === 'typography.heading.h1')
    expect(h1?.label).toBe('typography.heading.h1')
    expect(tokenDisplayLabel(h1!)).toBe('H1')
  })
})

describe('clear_token_binding', () => {
  it('removes binding key', () => {
    let scene = createLegacyFixtureScene()
    const bound = applySceneOp(scene, {
      op: 'set_token_binding',
      nodeId: 'title',
      key: 'radius',
      tokenPath: 'radius.control.md',
    })
    expect(bound.ok).toBe(true)
    if (!bound.ok) return
    scene = bound.scene
    const cleared = applySceneOp(scene, {
      op: 'clear_token_binding',
      nodeId: 'title',
      key: 'radius',
    })
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    const title = cleared.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.tokenBindings?.radius).toBeUndefined()
    expect(title?.tokenBindings?.fontFamily).toBe('typography.heading.h1')
  })
})

describe('DS inspect chrome consumer', () => {
  it('re-exports InspectSection and wires TokenPicker onClear/allowNone', () => {
    const barrel = readFileSync(path.resolve(__dirname, '../lib/zaoly-ui.ts'), 'utf8')
    expect(barrel).toContain('InspectSection')
    expect(barrel).toContain('normalizePrintChipTone')
    expect(barrel).toContain('normalizePrintCalloutVariant')
    expect(barrel).toContain('normalizePrintColumnAlignList')
    expect(barrel).toContain('normalizePrintStepsOrientation')
    const inspector = [
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/index.tsx'), 'utf8'),
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/inspector-design-panel.tsx'), 'utf8'),
      readFileSync(path.resolve(__dirname, '../components/editor-inspector/use-inspector-field-renderer.tsx'), 'utf8'),
    ].join('\n')
    expect(inspector).toContain('InspectSection')
    expect(inspector).toContain('onClear')
    expect(inspector).toContain('allowNone')
    expect(inspector).toContain('emptyLabel')
    expect(inspector).toContain('fontPreview')
    expect(inspector).toContain('sampleStyle')
    expect(inspector).toContain('tokenDisplayLabel')
    expect(inspector).toContain('valueLabel')
    expect(inspector).toContain('TYPOGRAPHY_PICKER_GROUPS')
    expect(inspector).toContain("t('editor.tokenNone')")
    expect(inspector).toContain("t('editor.tokenEmpty')")
    expect(inspector).toContain('block')
    expect(inspector).toContain('allowCycle')
    expect(inspector).toContain('allowLiteral')
    expect(inspector).toContain('inspectDesign')
    expect(inspector).toContain('inspectCss')
    expect(inspector).toContain('InspectTabs')
    expect(inspector).toContain('ToggleGroup')
    expect(inspector).toContain('pairInspectFields')
    expect(inspector).toContain('creation-inspect-pair')
    expect(inspector).toContain('inspect-literal-')
    expect(inspector).toContain('writeLiteral')
    expect(inspector).toContain('creation-inspect-live-token')
    expect(inspector).toContain("field.name !== 'type'")
    expect(inspector).not.toContain('creation-inspect-section')
    expect(barrel).toContain('LayersPanel')
    expect(barrel).toContain('BreakpointSwitcher')
    expect(barrel).toContain('InspectTabs')
    expect(barrel).toContain('EditorBreakpoint')
    const layers = readFileSync(
      path.resolve(__dirname, '../components/editor-layers.tsx'),
      'utf8',
    )
    expect(layers).toContain('LayersPanel')
    expect(layers).toContain('toLayersItem')
    expect(layers).toContain('onMoveUp')
    expect(layers).toContain('onMoveDown')
    const toolbar = readFileSync(
      path.resolve(__dirname, '../components/editor/editor-toolbar.tsx'),
      'utf8',
    )
    const structure = readFileSync(
      path.resolve(__dirname, '../components/editor/use-editor-structure.ts'),
      'utf8',
    )
    expect(toolbar).not.toContain('BreakpointSwitcher')
    expect(toolbar).toContain('editor-breakpoint-compare')
    expect(structure).toContain('reorder_node')
  })

  it('P54 paint forwards PrintChip chrome onto .zaoly-print-chip', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toContain('.creation-scene-node--print-chip')
    expect(css).toContain('.zaoly-print-chip')
    expect(css).toContain('--creation-print-chip-border-width')
    expect(css).toContain('var(--print-line)')
    const view = readFileSync(
      path.resolve(__dirname, '../components/scene-node-view.tsx'),
      'utf8',
    )
    expect(view).toContain('printChipSurfacePaint')
    expect(view).toContain("tokenByPath('color.neutral.700'")
  })

  it('P55 paint forwards print alignment onto magazine inner classes', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toContain('.creation-scene-node--print-surface')
    expect(css).toContain('--creation-print-text-align')
    expect(css).toContain('--creation-print-justify-content')
    expect(css).toContain('.zaoly-print-chip-row')
    expect(css).toContain('.zaoly-print-table th')
    expect(css).toContain('text-align: inherit')
    const view = readFileSync(
      path.resolve(__dirname, '../components/scene-node-view.tsx'),
      'utf8',
    )
    expect(view).toContain('printSurfaceGrainPaint')
    expect(view).toContain('printChipSurfacePaint')
  })

  it('canvas type inherits token styles instead of magazine roles', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toContain('.creation-scene-node .ds-text-headline')
    expect(css).toContain('font-size: inherit')
    const view = readFileSync(
      path.resolve(__dirname, '../components/scene-node-view.tsx'),
      'utf8',
    )
    expect(view).toContain("tokenByPath('color.neutral.700'")
  })

  it('editor chrome uses Zaoly theme tokens, not light-only greys', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toContain('background: var(--bg1)')
    expect(css).toContain('background: var(--bg0)')
    expect(css).toContain('border-bottom: 1px solid var(--line)')
    expect(css).toContain('color: var(--ink)')
    expect(css).not.toContain('#f7f7f7')
    expect(css).not.toContain('var(--surface-1, #fff)')
    expect(css).not.toContain('color-scheme: dark')
  })
})

describe('css peek', () => {
  it('lists resolved styles and token attrs', async () => {
    const { peekResolvedCss } = await import('../lib/inspect/css-peek')
    const peek = peekResolvedCss({
      id: 'n1',
      type: 'Text',
      props: { role: 'headline' },
      style: { width: 120 },
      tokenBindings: { radius: 'radius.control.md' },
    })
    expect(peek.styles.some((r) => r.key === 'borderRadius' && r.value === '0')).toBe(true)
    expect(peek.styles.some((r) => r.key === 'width' && r.value === '120')).toBe(true)
    expect(peek.attrs.some((r) => r.key === 'role' && r.value === 'headline')).toBe(true)
    expect(peek.attrs.some((r) => r.key === 'type' && r.value === 'Text')).toBe(true)
    expect(peek.attrs.some((r) => r.key === 'id' && r.value === 'n1')).toBe(true)
    expect(peek.attrs.some((r) => r.key === 'token:radius')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { magColors, MAG_FONT_FAMILY } from '@zaoly/ui/mag'
import {
  collectPrintPages,
  hasPrintableContent,
  magColorsFromBrandPack,
  magFontFromBrandPack,
  isLiveUpstreamPack,
  isUsableTokenPack,
  materializeSceneForMagazine,
  NoPrintablePagesError,
  rankedItemsFromPrintNode,
  renderMagazinePdf,
  resolveMagInstancePaint,
  catalogForMagPaint,
  magThemeOverridesFromSceneRoot,
  sceneToMagazineDocument,
  flattenPrintNode,
  buildP92S5EvalScene,
} from '../lib/magazine-pdf'
import {
  mergeMagTextStyles,
  resolveSlotTextPaint,
} from '../lib/magazine-pdf/resolve-mag-instance-paint'
import { isUsableFontSrc } from '../lib/magazine-pdf/resolve-mag-fonts'
import type { BrandTokenPackResponse } from '../lib/inspect/token-catalog'

function text(id: string, slot: string, value: string): SceneNode {
  return { id, type: 'Text', props: { slot, children: value } }
}

function coverPage(): SceneNode {
  return {
    id: 'page-1',
    type: 'PrintPage',
    children: [
      text('folio', 'label', 'beispiel.de'),
      {
        id: 'cover',
        type: 'PrintCover',
        children: [
          text('eb', 'label', 'Quick Check'),
          text('ti', 'title', 'Magazin Export'),
          text('fz', 'footer', 'Fazit text'),
          {
            id: 'kpi',
            type: 'Lede',
            props: { ringPct: 72 },
            children: [
              text('kv', 'value', '72'),
              text('kl', 'label', 'Score'),
            ],
          },
        ],
      },
      {
        id: 'ch',
        type: 'PrintChapter',
        props: { index: '01' },
        children: [
          text('ce', 'label', 'Chapter'),
          text('ct', 'title', 'Findings'),
          {
            id: 'list',
            type: 'PrintRankedList',
            children: [
              {
                id: 'r1',
                type: 'RankedRow',
                children: [text('rl', 'label', 'Finding one')],
              },
            ],
          },
        ],
      },
    ],
  }
}

function sceneWith(root: SceneNode, platformProjectId?: string): CompositionScene {
  return {
    id: 'scene-pdf-test',
    name: 'PDF Test',
    version: 1,
    root,
    updatedAt: new Date().toISOString(),
    platformProjectId: platformProjectId ?? null,
  }
}

describe('magazine-pdf collect + flatten', () => {
  it('collects PrintPage and skips digital siblings', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'Stack',
      children: [
        { id: 'btn', type: 'Button', children: [text('bl', 'label', 'Hi')] },
        coverPage(),
      ],
    }
    const pages = collectPrintPages(root)
    expect(pages).toHaveLength(1)
    expect(pages[0]!.type).toBe('PrintPage')
    expect(hasPrintableContent(root)).toBe(true)
  })

  it('wraps orphan PrintChapter into a synthetic page', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'Stack',
      children: [
        {
          id: 'ch',
          type: 'PrintChapter',
          children: [text('t', 'title', 'Orphan')],
        },
      ],
    }
    const pages = collectPrintPages(root)
    expect(pages).toHaveLength(1)
    expect(pages[0]!.id).toContain('__synthetic_print_page__')
    expect(pages[0]!.children?.[0]?.type).toBe('PrintChapter')
  })

  it('throws when nothing printable', () => {
    const s = sceneWith({
      id: 'root',
      type: 'Stack',
      children: [{ id: 'b', type: 'Button', children: [] }],
    })
    expect(() => sceneToMagazineDocument(s)).toThrow(NoPrintablePagesError)
  })

  it('P83/P89: Mag always materializes print lane (not tablet/activeBreakpoint)', () => {
    const list: SceneNode = {
      id: 'list',
      type: 'PrintRankedList',
      children: [
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            {
              id: 'rl',
              type: 'Text',
              props: { slot: 'label', children: 'Base label' },
              breakpoints: {
                tablet: { props: { children: 'Tablet edited label' } },
                print: { props: { children: 'Print edited label' } },
              },
            },
          ],
        },
      ],
    }
    const page: SceneNode = {
      id: 'page-1',
      type: 'PrintPage',
      children: [list],
    }
    const baseScene = sceneWith({ id: 'root', type: 'Stack', children: [page] })
    expect(rankedItemsFromPrintNode(list)[0]?.label).toBe('Base label')

    // Even with activeBreakpoint tablet, Mag folds print (not tablet).
    const tabletScene = { ...baseScene, activeBreakpoint: 'tablet' as const }
    const materialized = materializeSceneForMagazine(tabletScene)
    const matList = materialized.root.children?.[0]?.children?.[0]
    expect(matList?.type).toBe('PrintRankedList')
    expect(rankedItemsFromPrintNode(matList!).map((i) => i.label)).toEqual([
      'Print edited label',
    ])

    // Desktop activeBreakpoint still folds print overrides for Mag.
    const desktopMat = materializeSceneForMagazine({
      ...baseScene,
      activeBreakpoint: 'desktop',
    })
    const deskList = desktopMat.root.children?.[0]?.children?.[0]
    expect(rankedItemsFromPrintNode(deskList!).map((i) => i.label)).toEqual([
      'Print edited label',
    ])
  })

  it('reads RankedRow props.children when slot Text is absent', () => {
    const list: SceneNode = {
      id: 'list',
      type: 'PrintRankedList',
      children: [
        {
          id: 'r1',
          type: 'RankedRow',
          props: { children: 'Props-only label' },
        },
      ],
    }
    expect(rankedItemsFromPrintNode(list)).toEqual([{ label: 'Props-only label' }])
  })

  it('P84: RankedList color binding and padding become Mag tones + wrap', () => {
    const list: SceneNode = {
      id: 'list',
      type: 'PrintRankedList',
      props: { color: '#1122aa', padding: '12px' },
      tokenBindings: { color: 'color.action.primary' },
      children: [
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            {
              id: 'rl',
              type: 'Text',
              props: { slot: 'label', children: 'Painted', color: '#00aa55' },
            },
          ],
        },
      ],
    }
    const paint = resolveMagInstancePaint(list)
    expect(paint.tones?.ink).toBeTruthy()
    expect(paint.wrapStyle?.padding).toBe(9) // 12px × 0.75

    const items = rankedItemsFromPrintNode(list, catalogForMagPaint(null))
    expect(items[0]?.label).toBe('Painted')
    // literal color on label Text wins via resolveNodePaintStyle
    expect(items[0]?.color).toBe('#00aa55')
  })

  it('P86: fontSize, textAlign, gap, maxWidth flow into Mag paint', () => {
    const list: SceneNode = {
      id: 'list-p86',
      type: 'PrintRankedList',
      props: {
        fontSize: '18px',
        textAlign: 'center',
        gap: 'lg',
        maxWidth: '400px',
      },
      children: [],
    }
    const paint = resolveMagInstancePaint(list, catalogForMagPaint(null))
    expect(paint.textStyle?.fontSize).toBe(13.5) // 18px × 0.75
    expect(paint.textStyle?.textAlign).toBe('center')
    expect(paint.wrapStyle?.gap).toBe(14)
    expect(paint.wrapStyle?.maxWidth).toBe(300) // 400px × 0.75
  })

  it('P86: mm padding and label Text fontSize become wrap + per-item style', () => {
    const list: SceneNode = {
      id: 'list-mm',
      type: 'PrintRankedList',
      props: { padding: '4mm' },
      children: [
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            {
              id: 'rl',
              type: 'Text',
              props: { slot: 'label', children: 'Big', fontSize: '22px' },
            },
          ],
        },
      ],
    }
    const paint = resolveMagInstancePaint(list, catalogForMagPaint(null))
    expect(paint.wrapStyle?.padding).toBeGreaterThan(10)
    const items = rankedItemsFromPrintNode(list, catalogForMagPaint(null))
    expect(items[0]?.labelStyle?.fontSize).toBe(16.5) // 22px × 0.75
  })

  it('P87: Stack align/justify alias into Mag wrap', () => {
    const stack: SceneNode = {
      id: 'stack-1',
      type: 'Stack',
      props: { align: 'center', justify: 'space-between', gap: 'xl' },
      children: [],
    }
    const paint = resolveMagInstancePaint(stack, catalogForMagPaint(null))
    expect(paint.wrapStyle?.alignItems).toBe('center')
    expect(paint.wrapStyle?.justifyContent).toBe('space-between')
    expect(paint.wrapStyle?.gap).toBe(20)
  })

  it('P87: paddingBlock/Inline expand to physical sides', () => {
    const node: SceneNode = {
      id: 'page-pad',
      type: 'PrintPage',
      props: { paddingBlock: '12px', paddingInline: '8px' },
      children: [],
    }
    const paint = resolveMagInstancePaint(node, catalogForMagPaint(null))
    expect(paint.wrapStyle?.paddingTop).toBe(9) // 12px × 0.75
    expect(paint.wrapStyle?.paddingBottom).toBe(9)
    expect(paint.wrapStyle?.paddingLeft).toBe(6) // 8px × 0.75
    expect(paint.wrapStyle?.paddingRight).toBe(6)
  })

  it('P87: PrintCover title slot fontSize/textAlign reach Mag titleStyle', () => {
    const cover: SceneNode = {
      id: 'cover-p87',
      type: 'PrintCover',
      props: { alignItems: 'center' },
      children: [
        {
          id: 'ti',
          type: 'Text',
          props: { slot: 'title', children: 'Big Title', fontSize: '32px', textAlign: 'center' },
        },
      ],
    }
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(cover, catalog)
    expect(paint.wrapStyle?.alignItems).toBe('center')
    expect(paint.textStyle?.textAlign).toBe('center')
    const merged = mergeMagTextStyles(paint.textStyle, resolveSlotTextPaint(cover, 'title', catalog))
    expect(merged?.fontSize).toBe(24) // 32px × 0.75
    expect(merged?.textAlign).toBe('center')
  })

  it('P92: PrintChip tone reaches MagChip (no silent drop)', () => {
    const chip: SceneNode = {
      id: 'chip-accent',
      type: 'PrintChip',
      props: { tone: 'accent' },
      children: [text('lbl', 'label', 'Active')],
    }
    const catalog = catalogForMagPaint(null)
    const parts = flattenPrintNode(chip, { catalog })
    const findMagChip = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as {
        type?: ((...args: never[]) => unknown) | { name?: string }
        props?: Record<string, unknown> & { children?: unknown }
      }
      const name = typeof el.type === 'function' ? el.type.name : el.type?.name
      if (name === 'MagChip' && el.props) return el.props
      const kids = el.props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagChip(k)
        if (hit) return hit
      }
      return undefined
    }
    let props: Record<string, unknown> | undefined
    for (const part of parts) {
      props = findMagChip(part)
      if (props) break
    }
    expect(props?.tone).toBe('accent')
  })

  it('P92: PrintCallout variant reaches MagCallout (no silent drop)', () => {
    const callout: SceneNode = {
      id: 'callout-em',
      type: 'PrintCallout',
      props: { variant: 'emphasize' },
      children: [
        text('lbl', 'label', 'Hinweis'),
        text('body', 'value', 'Only contact fields crossed.'),
      ],
    }
    const catalog = catalogForMagPaint(null)
    const parts = flattenPrintNode(callout, { catalog })
    const findMagCallout = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as {
        type?: ((...args: never[]) => unknown) | { name?: string }
        props?: Record<string, unknown> & { children?: unknown }
      }
      const name = typeof el.type === 'function' ? el.type.name : el.type?.name
      if (name === 'MagCallout' && el.props) return el.props
      const kids = el.props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagCallout(k)
        if (hit) return hit
      }
      return undefined
    }
    let props: Record<string, unknown> | undefined
    for (const part of parts) {
      props = findMagCallout(part)
      if (props) break
    }
    expect(props?.variant).toBe('emphasize')
    expect(props?.body).toBe('Only contact fields crossed.')
    expect(props?.label).toBe('Hinweis')
  })

  it('P92: PrintTable columnAlign reaches MagTable (no silent drop)', () => {
    const table: SceneNode = {
      id: 'tbl-col-align',
      type: 'PrintTable',
      props: { columnAlign: 'left,left,right' },
      children: [
        { id: 'c0', type: 'Text', props: { slot: 'label', children: 'Metric' } },
        { id: 'c1', type: 'Text', props: { slot: 'label', children: 'Now' } },
        { id: 'c2', type: 'Text', props: { slot: 'label', children: 'EUR' } },
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            { id: 'l', type: 'Text', props: { slot: 'label', children: 'GEO' } },
            { id: 'v', type: 'Text', props: { slot: 'value', children: '72' } },
            { id: 'e', type: 'Text', props: { slot: 'body', children: '1.240' } },
          ],
        },
      ],
    }
    const catalog = catalogForMagPaint(null)
    const parts = flattenPrintNode(table, { catalog })
    const findMagTable = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as {
        type?: ((...args: never[]) => unknown) | { name?: string }
        props?: Record<string, unknown> & { children?: unknown }
      }
      const name = typeof el.type === 'function' ? el.type.name : el.type?.name
      if (name === 'MagTable' && el.props) return el.props
      const kids = el.props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagTable(k)
        if (hit) return hit
      }
      return undefined
    }
    let props: Record<string, unknown> | undefined
    for (const part of parts) {
      props = findMagTable(part)
      if (props) break
    }
    expect(props?.columnAlign).toEqual(['left', 'left', 'right'])
  })

  it('P92: PrintSteps emphasisIndex reaches MagSteps (no silent drop)', () => {
    const steps: SceneNode = {
      id: 'steps-1',
      type: 'PrintSteps',
      props: { orientation: 'horizontal', emphasisIndex: '2' },
      children: [
        {
          id: 's0',
          type: 'RankedRow',
          children: [
            { id: 'l0', type: 'Text', props: { slot: 'label', children: 'Audit' } },
            { id: 'd0', type: 'Text', props: { slot: 'secondary', children: 'Capture' } },
          ],
        },
        {
          id: 's1',
          type: 'RankedRow',
          children: [{ id: 'l1', type: 'Text', props: { slot: 'label', children: 'Cluster' } }],
        },
        {
          id: 's2',
          type: 'RankedRow',
          children: [
            { id: 'l2', type: 'Text', props: { slot: 'label', children: 'Prioritize' } },
            { id: 'd2', type: 'Text', props: { slot: 'secondary', children: 'Rank' } },
          ],
        },
        {
          id: 's3',
          type: 'RankedRow',
          children: [{ id: 'l3', type: 'Text', props: { slot: 'label', children: 'Ship' } }],
        },
      ],
    }
    const catalog = catalogForMagPaint(null)
    const parts = flattenPrintNode(steps, { catalog })
    const findMagSteps = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as {
        type?: ((...args: never[]) => unknown) | { name?: string }
        props?: Record<string, unknown> & { children?: unknown }
      }
      const name = typeof el.type === 'function' ? el.type.name : el.type?.name
      if (name === 'MagSteps' && el.props) return el.props
      const kids = el.props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagSteps(k)
        if (hit) return hit
      }
      return undefined
    }
    let props: Record<string, unknown> | undefined
    for (const part of parts) {
      props = findMagSteps(part)
      if (props) break
    }
    expect(props?.emphasisIndex).toBe(2)
    expect(props?.orientation).toBe('horizontal')
    expect(props?.steps).toEqual([
      { label: 'Audit', detail: 'Capture' },
      { label: 'Cluster', detail: undefined },
      { label: 'Prioritize', detail: 'Rank' },
      { label: 'Ship', detail: undefined },
    ])
  })

  it('P88: PrintTable cell Text fontSize and gap reach MagTable props', () => {
    const table: SceneNode = {
      id: 'tbl',
      type: 'PrintTable',
      props: { gap: 'lg', alignItems: 'center' },
      children: [
        { id: 'c0', type: 'Text', props: { slot: 'label', children: 'Metric', fontSize: '10px' } },
        { id: 'c1', type: 'Text', props: { slot: 'label', children: 'Now', fontSize: '10px' } },
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            { id: 'l', type: 'Text', props: { slot: 'label', children: 'GEO', fontSize: '22px' } },
            { id: 'v', type: 'Text', props: { slot: 'value', children: '72', fontSize: '18px' } },
          ],
        },
      ],
    }
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(table, catalog)
    expect(paint.wrapStyle?.gap).toBe(14)
    expect(paint.wrapStyle?.alignItems).toBe('center')
    expect(paint.wrapStyle?.alignSelf).toBeUndefined()
    expect(paint.textStyle?.textAlign).toBe('center')
    const parts = flattenPrintNode(table, { catalog })
    expect(parts.length).toBeGreaterThan(0)
    // Walk for MagTable props
    const findMagTable = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as {
        type?: ((...args: never[]) => unknown) | { name?: string }
        props?: Record<string, unknown> & { children?: unknown }
      }
      const name = typeof el.type === 'function' ? el.type.name : el.type?.name
      if (name === 'MagTable' && el.props) return el.props
      const kids = el.props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagTable(k)
        if (hit) return hit
      }
      return undefined
    }
    const magProps = findMagTable(parts[0])
    expect(magProps?.gap).toBe(14)
    expect(magProps?.headStyle).toMatchObject({ fontSize: 7.5 }) // 10px × 0.75
    expect(magProps?.cellStyle).toMatchObject({ textAlign: 'center' })
    const cellStyles = magProps?.cellStyles as Array<Array<{ fontSize?: number }>>
    expect(cellStyles?.[0]?.[0]?.fontSize).toBe(16.5) // 22px × 0.75
    expect(cellStyles?.[0]?.[1]?.fontSize).toBe(13.5) // 18px × 0.75
  })

  it('P90: PrintTable alignItems reaches MagTable cellStyle.textAlign', () => {
    const table: SceneNode = {
      id: 'tbl-align',
      type: 'PrintTable',
      props: { alignItems: 'center' },
      children: [
        { id: 'c0', type: 'Text', props: { slot: 'label', children: 'Metric' } },
        { id: 'c1', type: 'Text', props: { slot: 'label', children: 'Now' } },
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            { id: 'l', type: 'Text', props: { slot: 'label', children: 'GEO' } },
            { id: 'v', type: 'Text', props: { slot: 'value', children: '72' } },
          ],
        },
      ],
    }
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(table, catalog)
    expect(paint.textStyle?.textAlign).toBe('center')
    expect(paint.wrapStyle?.alignItems).toBe('center')
    expect(paint.wrapStyle?.alignSelf).toBeUndefined()
    const parts = flattenPrintNode(table, { catalog })
    const findMagTable = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as { type?: { name?: string }; props?: Record<string, unknown> }
      const name = typeof el.type === 'function' ? el.type.name : (el.type as { name?: string })?.name
      if (name === 'MagTable' && el.props) return el.props
      const kids = (el as { props?: { children?: unknown } }).props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagTable(k)
        if (hit) return hit
      }
      return undefined
    }
    const magProps = findMagTable(parts[0])
    expect(magProps?.cellStyle).toMatchObject({ textAlign: 'center' })
    expect(magProps?.fit).toBe('stretch')
  })

  it('P91: PrintTable alignSelf parks block with MagTable fit=hug (no invented textAlign)', () => {
    const table: SceneNode = {
      id: 'tbl-block',
      type: 'PrintTable',
      props: { alignSelf: 'flex-end' },
      children: [
        { id: 'c0', type: 'Text', props: { slot: 'label', children: 'Metric' } },
        { id: 'c1', type: 'Text', props: { slot: 'label', children: 'Now' } },
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            { id: 'l', type: 'Text', props: { slot: 'label', children: 'GEO' } },
            { id: 'v', type: 'Text', props: { slot: 'value', children: '72' } },
          ],
        },
      ],
    }
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(table, catalog)
    expect(paint.wrapStyle?.alignSelf).toBe('flex-end')
    expect(paint.textStyle?.textAlign).toBeUndefined()
    const parts = flattenPrintNode(table, { catalog })
    const findMagTable = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as { type?: { name?: string }; props?: Record<string, unknown> }
      const name = typeof el.type === 'function' ? el.type.name : (el.type as { name?: string })?.name
      if (name === 'MagTable' && el.props) return el.props
      const kids = (el as { props?: { children?: unknown } }).props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagTable(k)
        if (hit) return hit
      }
      return undefined
    }
    expect(findMagTable(parts[0])?.fit).toBe('hug')
  })

  it('P89: digital-only spacing/type tokens still paint Mag (print∪digital)', () => {
    const table: SceneNode = {
      id: 'tbl',
      type: 'PrintTable',
      props: { alignItems: 'center' },
      tokenBindings: {
        padding: 'spacing.padding.md',
        fontSize: 'typography.heading.h1',
        color: 'color.action.primary',
      },
      breakpoints: {
        print: {
          props: { gap: 'xl', alignItems: 'center' },
          tokenBindings: { padding: 'spacing.padding.lg' },
        },
      },
      children: [
        { id: 'c0', type: 'Text', props: { slot: 'label', children: 'Metric' } },
        { id: 'c1', type: 'Text', props: { slot: 'label', children: 'Now' } },
        {
          id: 'r1',
          type: 'RankedRow',
          children: [
            {
              id: 'l',
              type: 'Text',
              props: { slot: 'label', children: 'GEO' },
              breakpoints: {
                print: { props: { fontSize: '24px' } },
              },
            },
            { id: 'v', type: 'Text', props: { slot: 'value', children: '72' } },
          ],
        },
      ],
    }
    const scene = sceneWith({
      id: 'root',
      type: 'Stack',
      children: [{ id: 'page', type: 'PrintPage', children: [table] }],
    })
    // Mag ignores activeBreakpoint desktop — still folds print overrides.
    const mat = materializeSceneForMagazine({ ...scene, activeBreakpoint: 'desktop' })
    const matTable = mat.root.children?.[0]?.children?.[0]
    expect(matTable?.props?.gap).toBe('xl')
    expect(matTable?.tokenBindings?.padding).toBe('spacing.padding.lg')
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(matTable!, catalog)
    // spacing.padding.lg print facet is 4mm → ≈11.34pt
    expect(paint.wrapStyle?.padding).toBe(11.34)
    expect(paint.wrapStyle?.gap).toBe(20)
    expect(paint.wrapStyle?.alignItems).toBe('center') // P91: no alignSelf←alignItems invent
    // typography.heading.h1 has print 28pt — print wins
    expect(paint.textStyle?.fontSize).toBe(28)
    expect(paint.textStyle?.color).toBe('#1f44ff')
    const matLabel = matTable?.children?.find((c) => c.id === 'r1')?.children?.find((c) => c.id === 'l')
    expect(matLabel?.props?.fontSize).toBe('24px')
    const parts = flattenPrintNode(matTable!, { catalog })
    const findMagTable = (node: unknown): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as { type?: { name?: string }; props?: Record<string, unknown> }
      const name = typeof el.type === 'function' ? el.type.name : (el.type as { name?: string })?.name
      if (name === 'MagTable' && el.props) return el.props
      const kids = (el as { props?: { children?: unknown } }).props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findMagTable(k)
        if (hit) return hit
      }
      return undefined
    }
    const magProps = findMagTable(parts[0])
    const cellStyles = magProps?.cellStyles as Array<Array<{ fontSize?: number; color?: string }>>
    expect(cellStyles?.[0]?.[0]?.fontSize).toBe(18) // 24px × 0.75
  })

  it('P84: PrintPage background feeds Mag paper theme hint', () => {
    const page: SceneNode = {
      id: 'page-1',
      type: 'PrintPage',
      props: { background: '#fff0f0' },
      children: [],
    }
    const theme = magThemeOverridesFromSceneRoot(page, catalogForMagPaint(null))
    expect(theme.paper).toBe('#fff0f0')
  })

  it('P84: dark PrintPage background does not become Mag paper', () => {
    const page: SceneNode = {
      id: 'page-1',
      type: 'PrintPage',
      props: { background: '#0f0f12' },
      children: [],
    }
    const theme = magThemeOverridesFromSceneRoot(page, catalogForMagPaint(null))
    expect(theme.paper).toBeUndefined()
  })

  it('enables MagPage logo by default (P80d)', () => {
    const doc = sceneToMagazineDocument(
      sceneWith({ id: 'root', type: 'Stack', children: [coverPage()] }),
    )
    // MagThemeProvider may wrap Document; walk for MagPage props via element tree
    const rootEl = doc as { props?: { children?: unknown } }
    const findShowLogo = (node: unknown): boolean | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as { type?: { name?: string }; props?: Record<string, unknown>; children?: unknown }
      if (el.props && 'showLogo' in el.props) return el.props.showLogo as boolean
      const kids = el.props?.children ?? el.children
      if (Array.isArray(kids)) {
        for (const k of kids) {
          const found = findShowLogo(k)
          if (found !== undefined) return found
        }
      } else if (kids) {
        return findShowLogo(kids)
      }
      return undefined
    }
    expect(findShowLogo(rootEl)).toBe(true)
  })
})

describe('P80a Mag colors from local pack', () => {
  it('falls back to magColors for fixture / empty pack', () => {
    const fixture: BrandTokenPackResponse = {
      source: 'fixture',
      guidelineId: null,
      platformProjectId: 'plx-local-x',
      tokens: [],
    }
    expect(isLiveUpstreamPack(fixture)).toBe(false)
    expect(isUsableTokenPack(fixture)).toBe(false)
    expect(magColorsFromBrandPack(fixture)).toEqual(magColors)
    expect(magColorsFromBrandPack(null)).toEqual(magColors)
  })

  it('maps local pack color leaves onto Mag palette', () => {
    const pack: BrandTokenPackResponse = {
      source: 'local',
      guidelineId: null,
      platformProjectId: '',
      tokens: [
        {
          path: 'color.action.primary',
          type: 'color',
          value: JSON.stringify({
            digital: { hex: '#1122aa' },
            print: { hex: '#1122aa' },
          }),
          status: 'active',
        },
        {
          path: 'color.background',
          type: 'color',
          value: JSON.stringify({
            digital: { hex: '#fff8f0' },
            print: { hex: '#fff8f0' },
          }),
          status: 'active',
        },
        {
          path: 'color.neutral.700',
          type: 'color',
          value: JSON.stringify({
            digital: { hex: '#1a1a1a' },
            print: { hex: '#1a1a1a' },
          }),
          status: 'active',
        },
      ],
    }
    expect(isLiveUpstreamPack(pack)).toBe(false)
    expect(isUsableTokenPack(pack)).toBe(true)
    const colors = magColorsFromBrandPack(pack)
    expect(colors.accent).toBe('#1122aa')
    expect(colors.paper).toBe('#fff8f0')
    expect(colors.ink).toBe('#1a1a1a')
    expect(colors.inkSoft).toBe('#1a1a1a')
    expect(colors.muted).toBe(magColors.muted)
    expect(colors.donut[1]).toBe('#1122aa')
  })

  it('skips dark color.background so Mag paper stays cream', () => {
    const pack: BrandTokenPackResponse = {
      source: 'local',
      guidelineId: null,
      platformProjectId: '',
      tokens: [
        {
          path: 'color.background',
          type: 'color',
          value: JSON.stringify({
            digital: { hex: '#0f0f12' },
            print: { hex: '#0f0f12' },
          }),
          status: 'active',
        },
        {
          path: 'color.action.primary',
          type: 'color',
          value: JSON.stringify({ digital: { hex: '#00ca55' } }),
          status: 'active',
        },
      ],
    }
    const colors = magColorsFromBrandPack(pack)
    expect(colors.paper).toBe(magColors.paper)
    expect(colors.accent).toBe('#00ca55')
  })
})

describe('P81b token pack Mag fonts', () => {
  it('maps Geist/Inter aliases onto registered Mag family', () => {
    const pack: BrandTokenPackResponse = {
      source: 'local',
      guidelineId: null,
      platformProjectId: '',
      tokens: [
        {
          path: 'typography.heading.h1',
          type: 'typography',
          value: JSON.stringify({ family: 'Geist', digital: { size: '2rem' } }),
          status: 'active',
        },
      ],
    }
    const fonts = magFontFromBrandPack(pack)
    expect(fonts.registeredFamily).toBe(MAG_FONT_FAMILY)
    expect(fonts.brandFamilies).toEqual(['Geist'])
    expect(fonts.usedFallback).toBe(true)
  })

  it('falls back for unknown families without failing', () => {
    const fonts = magFontFromBrandPack({
      source: 'local',
      guidelineId: null,
      platformProjectId: 'x',
      tokens: [
        {
          path: 'typography.body',
          type: 'typography',
          value: JSON.stringify({ family: 'CustomUnregisteredFace' }),
          status: 'active',
        },
      ],
    })
    expect(fonts.registeredFamily).toBe(MAG_FONT_FAMILY)
    expect(fonts.usedFallback).toBe(true)
    expect(fonts.embeddedFromSrc).toBe(false)
  })

  it('P82c records typography.source and accepts font URL shape', () => {
    expect(isUsableFontSrc('https://cdn.example/fonts/Brand.woff2')).toBe(true)
    expect(isUsableFontSrc('not-a-font')).toBe(false)
    const fonts = magFontFromBrandPack({
      source: 'local',
      guidelineId: null,
      platformProjectId: 'x',
      tokens: [
        {
          path: 'typography.brand',
          type: 'typography',
          value: JSON.stringify({
            family: 'BrandEmbedFace',
            source: 'https://cdn.example/fonts/Brand.ttf',
            digital: { size: '1rem' },
          }),
          status: 'active',
        },
      ],
    })
    expect(fonts.fontSrc).toBe('https://cdn.example/fonts/Brand.ttf')
    // Network register may fail in unit tests — still a registered Mag face
    expect(fonts.registeredFamily.length).toBeGreaterThan(0)
    expect(typeof fonts.embeddedFromSrc).toBe('boolean')
  })
})

describe('magazine-pdf render smoke', () => {
  it('renders Cover+Chapter fixture to PDF with logo', async () => {
    const buffer = await renderMagazinePdf(
      sceneWith({ id: 'root', type: 'Stack', children: [coverPage()] }),
      { showLogo: true },
    )
    expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(buffer.length).toBeGreaterThan(800)
  }, 30000)

  it('renders with token pack Mag theme overrides', async () => {
    const colors = magColorsFromBrandPack({
      source: 'local',
      guidelineId: null,
      platformProjectId: 'x',
      tokens: [
        {
          path: 'color.action.primary',
          type: 'color',
          value: JSON.stringify({ digital: { hex: '#00aa55' }, print: { hex: '#00aa55' } }),
          status: 'active',
        },
      ],
    })
    const buffer = await renderMagazinePdf(
      sceneWith({ id: 'root', type: 'Stack', children: [coverPage()] }),
      { colors, showLogo: true },
    )
    expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF')
  }, 30000)
})

describe('P92 S5 quality-eval fixture', () => {
  it('flattens accent chip, callout, columnAlign, and steps without silent drop', () => {
    const scene = buildP92S5EvalScene()
    const catalog = catalogForMagPaint(null)
    const page = scene.root.children?.[0]
    expect(page?.type).toBe('PrintPage')
    const parts = flattenPrintNode(page!, { catalog })

    const findNamed = (node: unknown, want: string): Record<string, unknown> | undefined => {
      if (!node || typeof node !== 'object') return undefined
      const el = node as {
        type?: ((...args: never[]) => unknown) | { name?: string }
        props?: Record<string, unknown> & { children?: unknown }
      }
      const name = typeof el.type === 'function' ? el.type.name : el.type?.name
      if (name === want && el.props) return el.props
      const kids = el.props?.children
      const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
      for (const k of list) {
        const hit = findNamed(k, want)
        if (hit) return hit
      }
      return undefined
    }

    let chipAccent: Record<string, unknown> | undefined
    let callout: Record<string, unknown> | undefined
    let table: Record<string, unknown> | undefined
    let steps: Record<string, unknown> | undefined
    for (const part of parts) {
      chipAccent ??= (() => {
        const walk = (n: unknown): Record<string, unknown> | undefined => {
          if (!n || typeof n !== 'object') return undefined
          const el = n as {
            type?: ((...args: never[]) => unknown) | { name?: string }
            props?: Record<string, unknown> & { children?: unknown }
          }
          const name = typeof el.type === 'function' ? el.type.name : el.type?.name
          if (name === 'MagChip' && el.props?.tone === 'accent') return el.props
          const kids = el.props?.children
          const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
          for (const k of list) {
            const hit = walk(k)
            if (hit) return hit
          }
          return undefined
        }
        return walk(part)
      })()
      callout ??= findNamed(part, 'MagCallout')
      table ??= findNamed(part, 'MagTable')
      steps ??= findNamed(part, 'MagSteps')
    }

    expect(chipAccent?.tone).toBe('accent')
    expect(callout?.variant).toBe('wash')
    expect(table?.columnAlign).toEqual(['left', 'left', 'right'])
    expect(steps?.emphasisIndex).toBe(2)
    expect(steps?.orientation).toBe('horizontal')
  })

  it('renders S5 Mag PDF', async () => {
    const buffer = await renderMagazinePdf(buildP92S5EvalScene(), { showLogo: false })
    expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(buffer.length).toBeGreaterThan(2000)
  }, 30000)
})

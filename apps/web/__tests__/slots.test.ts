import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  hydrateAtomicSlots,
  hydrateEntityCardChrome,
  partitionSlottedChildren,
  slotOf,
  slotPlainText,
} from '../lib/scene/slots'

describe('atomic slots', () => {
  it('treats unknown or missing slot as body', () => {
    expect(slotOf({ id: 'a', type: 'Slider' })).toBe('body')
    expect(slotOf({ id: 'b', type: 'Text', props: { slot: 'nope' } })).toBe('body')
    expect(slotOf({ id: 'c', type: 'Text', props: { slot: 'title' } })).toBe('title')
  })

  it('partitions slotted chrome away from body children', () => {
    const { slots, body } = partitionSlottedChildren([
      { id: 't', type: 'Text', props: { slot: 'title', children: 'Entity' } },
      { id: 's', type: 'Slider', props: { value: 40 } },
      { id: 'f', type: 'Text', props: { slot: 'footer', children: 'Now' } },
    ])
    expect(slots.title?.[0]?.id).toBe('t')
    expect(slots.footer?.[0]?.id).toBe('f')
    expect(body.map((n) => n.id)).toEqual(['s'])
  })

  it('lifts P43 string chrome into slotted children once', () => {
    const node: SceneNode = {
      id: 'card-1',
      type: 'EntityCard',
      props: { title: 'Entity', meta: 'Catalog', badge: 'Live', footer: 'Now', size: 'default' },
      children: [{ id: 's', type: 'Slider', props: { value: 12 } }],
    }
    const once = hydrateEntityCardChrome(node)
    expect(once.props?.title).toBeUndefined()
    expect(once.children?.some((c) => c.props?.slot === 'title' && c.props?.children === 'Entity')).toBe(
      true,
    )
    expect(once.children?.some((c) => c.type === 'Slider')).toBe(true)
    const twice = hydrateEntityCardChrome(once)
    expect(twice.children?.filter((c) => c.props?.slot === 'title')).toHaveLength(1)
  })

  it('lifts Field label/hint strings into slotted children once', () => {
    const node: SceneNode = {
      id: 'field-1',
      type: 'Field',
      props: { label: 'Email', hint: 'Work', size: 'sm' },
      children: [{ id: 'i', type: 'Input', props: { placeholder: 'Input' } }],
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.label).toBeUndefined()
    expect(once.props?.hint).toBeUndefined()
    expect(once.children?.some((c) => c.props?.slot === 'label' && c.props?.children === 'Email')).toBe(
      true,
    )
    expect(once.children?.some((c) => c.type === 'Input')).toBe(true)
    const twice = hydrateAtomicSlots(once)
    expect(twice.children?.filter((c) => c.props?.slot === 'label')).toHaveLength(1)
  })

  it('extracts SectionChrome title text because the DS title is a string', () => {
    const node: SceneNode = {
      id: 'chrome-1',
      type: 'SectionChrome',
      props: { title: 'Section', meta: 'n=12' },
    }
    const hydrated = hydrateAtomicSlots(node)
    expect(hydrated.props?.title).toBeUndefined()
    expect(slotPlainText(hydrated.children, 'title')).toBe('Section')
    expect(slotOf({ id: 'x', type: 'Text', props: { slot: 'label' } })).toBe('label')
  })

  it('lifts PrintPullQuote label/body strings into slotted children once', () => {
    const node: SceneNode = {
      id: 'quote-1',
      type: 'PrintPullQuote',
      props: { label: 'Fazit', body: 'Print pull quote.' },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.label).toBeUndefined()
    expect(once.props?.body).toBeUndefined()
    expect(slotPlainText(once.children, 'label')).toBe('Fazit')
    expect(slotPlainText(once.children, 'value')).toBe('Print pull quote.')
    const twice = hydrateAtomicSlots(once)
    expect(twice.children?.filter((c) => c.props?.slot === 'value')).toHaveLength(1)
  })

  it('lifts PrintCallout label/body strings into slotted children; keeps variant', () => {
    const node: SceneNode = {
      id: 'callout-1',
      type: 'PrintCallout',
      props: { label: 'Hinweis', body: 'Wash band.', variant: 'emphasize' },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.label).toBeUndefined()
    expect(once.props?.body).toBeUndefined()
    expect(once.props?.variant).toBe('emphasize')
    expect(slotPlainText(once.children, 'label')).toBe('Hinweis')
    expect(slotPlainText(once.children, 'value')).toBe('Wash band.')
  })

  it('lifts Alert children string into a slotted copy child once', () => {
    const node: SceneNode = {
      id: 'alert-1',
      type: 'Alert',
      props: { children: 'Watch this', tone: 'info' },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.children).toBeUndefined()
    expect(once.props?.tone).toBe('info')
    expect(slotPlainText(once.children, 'value')).toBe('Watch this')
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.props?.slot === 'value')).toHaveLength(1)
  })

  it('lifts PrintDonut center strings into slotted children once', () => {
    const node: SceneNode = {
      id: 'donut-1',
      type: 'PrintDonut',
      props: {
        centerValue: '72',
        centerLabel: 'GEO',
        slices: [{ id: 'a', label: 'A', value: 40 }],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.centerValue).toBeUndefined()
    expect(once.props?.centerLabel).toBeUndefined()
    expect(once.props?.slices).toBeUndefined()
    expect(slotPlainText(once.children, 'value')).toBe('72')
    expect(slotPlainText(once.children, 'label')).toBe('GEO')
    const slices = once.children?.filter((c) => c.type === 'RankedRow') ?? []
    expect(slices).toHaveLength(1)
    expect(slices[0]?.id).toBe('donut-1__slice_a')
    expect(slotPlainText(slices[0]?.children, 'label')).toBe('A')
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.type === 'RankedRow')).toHaveLength(1)
  })

  it('lifts PrintPage folio strings into slotted children once', () => {
    const node: SceneNode = {
      id: 'page-1',
      type: 'PrintPage',
      props: { folioTitle: 'beispiel.de', folioPage: '1 — 8' },
      children: [{ id: 'ch', type: 'PrintChapter' }],
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.folioTitle).toBeUndefined()
    expect(once.props?.folioPage).toBeUndefined()
    expect(slotPlainText(once.children, 'label')).toBe('beispiel.de')
    expect(slotPlainText(once.children, 'footer')).toBe('1 — 8')
    expect(once.children?.some((c) => c.type === 'PrintChapter')).toBe(true)
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.props?.slot === 'label')).toHaveLength(1)
  })

  it('lifts KpiStrip items into Lede body children once', () => {
    const node: SceneNode = {
      id: 'kpi-1',
      type: 'KpiStrip',
      props: {
        items: [
          { id: 'a', label: 'KPI A', value: '12' },
          { id: 'b', label: 'KPI B', value: '8', meta: 'pts' },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.items).toBeUndefined()
    const ledes = once.children?.filter((c) => c.type === 'Lede') ?? []
    expect(ledes).toHaveLength(2)
    expect(slotPlainText(ledes[0]?.children, 'label')).toBe('KPI A')
    expect(slotPlainText(ledes[0]?.children, 'value')).toBe('12')
    expect(slotPlainText(ledes[1]?.children, 'unit')).toBe('pts')
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.type === 'Lede')).toHaveLength(2)
  })

  it('lifts PrintRankedList items into RankedRow body children once', () => {
    const node: SceneNode = {
      id: 'ranked-1',
      type: 'PrintRankedList',
      props: {
        columns: 1,
        items: [
          { label: 'Item A', meta: 'Lead' },
          { label: 'Item B', meta: 'Follow' },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.items).toBeUndefined()
    expect(once.props?.columns).toBe(1)
    const rows = once.children?.filter((c) => c.type === 'RankedRow') ?? []
    expect(rows).toHaveLength(2)
    expect(slotPlainText(rows[0]?.children, 'label')).toBe('Item A')
    expect(slotPlainText(rows[0]?.children, 'secondary')).toBe('Lead')
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.type === 'RankedRow')).toHaveLength(2)
  })

  it('lifts PrintLedger items into row children once', () => {
    const node: SceneNode = {
      id: 'ledger-1',
      type: 'PrintLedger',
      props: {
        max: 100,
        items: [
          { label: 'A', score: 72, detail: 'Strong' },
          { label: 'B', score: 41, detail: 'Gap' },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.items).toBeUndefined()
    expect(once.props?.max).toBe(100)
    const rows = once.children?.filter((c) => slotOf(c) === 'body') ?? []
    expect(rows).toHaveLength(2)
    expect(slotPlainText(rows[0]?.children, 'label')).toBe('A')
    expect(slotPlainText(rows[0]?.children, 'value')).toBe('72')
    expect(slotPlainText(rows[0]?.children, 'summary')).toBe('Strong')
    expect(hydrateAtomicSlots(once).children).toHaveLength(2)
  })

  it('lifts PrintTraitBars traits into row children once', () => {
    const node: SceneNode = {
      id: 'traits-1',
      type: 'PrintTraitBars',
      props: {
        traits: [
          { displayName: 'Trust', score: 0.72 },
          { displayName: 'Reach', score: 0.41 },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.traits).toBeUndefined()
    const rows = once.children ?? []
    expect(rows).toHaveLength(2)
    expect(slotPlainText(rows[0]?.children, 'label')).toBe('Trust')
    expect(slotPlainText(rows[0]?.children, 'value')).toBe('0.72')
    expect(hydrateAtomicSlots(once).children).toHaveLength(2)
  })

  it('lifts DivergingBar items into row children once', () => {
    const node: SceneNode = {
      id: 'div-1',
      type: 'DivergingBar',
      props: {
        items: [
          { id: 'a', label: 'A', value: 40 },
          { id: 'b', label: 'B', value: -20 },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.items).toBeUndefined()
    const rows = once.children ?? []
    expect(rows).toHaveLength(2)
    expect(rows[0]?.id).toBe('div-1__bar_a')
    expect(slotPlainText(rows[0]?.children, 'label')).toBe('A')
    expect(slotPlainText(rows[0]?.children, 'value')).toBe('40')
    expect(slotPlainText(rows[1]?.children, 'value')).toBe('-20')
    expect(hydrateAtomicSlots(once).children).toHaveLength(2)
  })

  it('lifts PrintPersonaGrid personas into PrintPersonaCard children once', () => {
    const node: SceneNode = {
      id: 'grid-1',
      type: 'PrintPersonaGrid',
      props: {
        personas: [
          {
            name: 'Alex Rivera',
            segment: 'Decision maker',
            bio: 'Evaluates GEO coverage before buying.',
            confidence: 72,
            traits: [{ displayName: 'Trust', score: 0.72 }],
          },
          {
            name: 'Sam Chen',
            segment: 'Researcher',
            bio: 'Maps citation gaps across pages.',
            confidence: 61,
          },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.personas).toBeUndefined()
    const cards = once.children?.filter((c) => c.type === 'PrintPersonaCard') ?? []
    expect(cards).toHaveLength(2)
    expect(cards[0]?.id).toBe('grid-1__persona_0')
    expect(slotPlainText(cards[0]?.children, 'title')).toBe('Alex Rivera')
    const traits = cards[0]?.children?.find((c) => c.type === 'PrintTraitBars')
    expect(traits).toBeTruthy()
    expect(slotPlainText(traits?.children?.[0]?.children, 'label')).toBe('Trust')
    expect(cards[0]?.props?.traits).toBeUndefined()
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.type === 'PrintPersonaCard')).toHaveLength(2)
  })

  it('lifts PrintCover kpis into Lede body children once and keeps identity slots', () => {
    const node: SceneNode = {
      id: 'cover-1',
      type: 'PrintCover',
      props: {
        url: 'beispiel.de',
        eyebrow: 'Quick Check',
        title: 'Print cover',
        kpis: [
          { label: 'GEO', value: '72', ringPct: 72 },
          { label: 'Pages', value: '8' },
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.kpis).toBeUndefined()
    expect(once.props?.url).toBe('beispiel.de')
    expect(slotPlainText(once.children, 'label')).toBe('Quick Check')
    expect(slotPlainText(once.children, 'title')).toBe('Print cover')
    const { body } = partitionSlottedChildren(once.children)
    expect(body).toHaveLength(2)
    expect(body[0]?.type).toBe('Lede')
    expect(body[0]?.id).toBe('cover-1__kpi_0')
    expect(slotPlainText(body[0]?.children, 'label')).toBe('GEO')
    expect(slotPlainText(body[0]?.children, 'value')).toBe('72')
    expect(body[0]?.props?.ringPct).toBe(72)
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.type === 'Lede')).toHaveLength(2)
  })

  it('lifts PrintTable rows and columns into children once', () => {
    const node: SceneNode = {
      id: 'table-1',
      type: 'PrintTable',
      props: {
        columns: ['Metric', 'Now'],
        rows: [
          ['GEO', 72],
          ['Pages', 8],
        ],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.rows).toBeUndefined()
    expect(once.props?.columns).toBeUndefined()
    const cols = once.children?.filter((c) => c.type === 'Text' && c.props?.slot === 'label') ?? []
    expect(cols).toHaveLength(2)
    expect(cols[0]?.id).toBe('table-1__col_0')
    expect(cols[0]?.props?.children).toBe('Metric')
    expect(cols[1]?.props?.children).toBe('Now')
    const rows = once.children?.filter((c) => c.type === 'RankedRow') ?? []
    expect(rows).toHaveLength(2)
    expect(rows[0]?.id).toBe('table-1__row_0')
    expect(slotPlainText(rows[0]?.children, 'label')).toBe('GEO')
    expect(slotPlainText(rows[0]?.children, 'value')).toBe('72')
    expect(hydrateAtomicSlots(once).children).toHaveLength(4)
  })

  it('lifts PrintPersonaCard arrays into print primitive children once', () => {
    const node: SceneNode = {
      id: 'card-1',
      type: 'PrintPersonaCard',
      props: {
        name: 'Alex Rivera',
        segment: 'Decision maker',
        bio: 'Evaluates GEO coverage before buying.',
        confidence: 72,
        spread: true,
        traits: [
          { displayName: 'Trust', score: 0.72 },
          { displayName: 'Reach', score: 0.41 },
        ],
        goals: ['Find reliable answers', 'Compare vendors'],
        painPoints: ['Inconsistent citations'],
      },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.traits).toBeUndefined()
    expect(once.props?.goals).toBeUndefined()
    expect(once.props?.painPoints).toBeUndefined()
    expect(once.props?.name).toBeUndefined()
    expect(once.props?.segment).toBeUndefined()
    expect(once.props?.bio).toBeUndefined()
    expect(once.props?.confidence).toBe(72)
    expect(once.props?.spread).toBe(true)
    expect(slotPlainText(once.children, 'title')).toBe('Alex Rivera')
    expect(slotPlainText(once.children, 'summary')).toBe('Evaluates GEO coverage before buying.')
    expect(once.children?.some((c) => c.props?.slot === 'meta')).toBe(false)
    const chips = once.children?.find((c) => c.type === 'PrintChipRow')
    expect(chips?.id).toBe('card-1__chips')
    expect(chips?.children?.[0]?.id).toBe('card-1__chip_segment')
    expect(slotPlainText(chips?.children?.[0]?.children, 'label')).toBe('Decision maker')
    expect(slotPlainText(chips?.children?.[1]?.children, 'label')).toBe('72% Konfidenz')
    const traits = once.children?.find((c) => c.type === 'PrintTraitBars')
    expect(traits?.id).toBe('card-1__traits')
    expect(slotPlainText(traits?.children?.[0]?.children, 'label')).toBe('Trust')
    const spread = once.children?.find((c) => c.type === 'PrintTwoColumn')
    expect(spread).toBeTruthy()
    expect(spread?.children?.[0]?.id).toBe('card-1__goals')
    expect(spread?.children?.[1]?.id).toBe('card-1__pains')
    expect(slotPlainText(spread?.children?.[0]?.children, 'label')).toBe('Ziele')
    expect(spread?.children?.[0]?.children?.some((c) => c.id === 'card-1__eyebrow_goals')).toBe(true)
    expect(spread?.children?.[1]?.children?.some((c) => c.id === 'card-1__eyebrow_pains')).toBe(true)
    expect(slotPlainText(spread?.children?.[1]?.children, 'label')).toBe('Pain Points')
    const goalRows = spread?.children?.[0]?.children?.filter((c) => c.type === 'RankedRow') ?? []
    expect(slotPlainText(goalRows[0]?.children, 'label')).toBe('Find reliable answers')
    const twice = hydrateAtomicSlots(once)
    expect(twice.children?.filter((c) => c.type === 'PrintChipRow')).toHaveLength(1)
    expect(twice.children?.filter((c) => c.type === 'PrintTraitBars')).toHaveLength(1)
    expect(twice.children?.filter((c) => c.type === 'PrintTwoColumn')).toHaveLength(1)
    expect(twice.props?.traits).toBeUndefined()
    expect(twice.children?.find((c) => c.type === 'PrintTwoColumn')?.children?.[0]?.children?.filter((c) => c.id === 'card-1__eyebrow_goals')).toHaveLength(1)
  })

  it('lifts Chip children string into a slotted label Text once', () => {
    const node: SceneNode = {
      id: 'chip-1',
      type: 'Chip',
      props: { children: 'Chip', size: 'sm' },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.children).toBeUndefined()
    expect(once.props?.size).toBe('sm')
    expect(slotPlainText(once.children, 'label')).toBe('Chip')
    expect(hydrateAtomicSlots(once).children?.filter((c) => c.props?.slot === 'label')).toHaveLength(1)
  })

  it('lifts PrintScoreRing numeric value into a slotted Text child once', () => {
    const node: SceneNode = {
      id: 'ring-1',
      type: 'PrintScoreRing',
      props: { value: 72, max: 100, label: 'Score' },
    }
    const once = hydrateAtomicSlots(node)
    expect(once.props?.value).toBeUndefined()
    expect(once.props?.max).toBe(100)
    expect(once.props?.label).toBeUndefined()
    expect(slotPlainText(once.children, 'value')).toBe('72')
    expect(slotPlainText(once.children, 'label')).toBe('Score')
    expect(once.children?.some((c) => c.id === 'ring-1__value')).toBe(true)
    const twice = hydrateAtomicSlots(once)
    expect(twice.children?.filter((c) => c.props?.slot === 'value')).toHaveLength(1)
  })
})

import { describe, expect, it } from 'vitest'
import {
  coerceEditorNodeToSiteKit,
  EDITOR_TO_SITE_KIT_TYPE,
} from '../lib/site-kit/coerce-editor-tree-to-site-kit'

describe('coerceEditorNodeToSiteKit', () => {
  it('maps Stack and Grid to Site Kit layout types', () => {
    const coerced = coerceEditorNodeToSiteKit({
      id: 'root',
      type: 'Stack',
      props: { direction: 'column' },
      children: [{ id: 'g', type: 'Grid', props: { columns: 3 }, children: [] }],
    })
    expect(coerced.type).toBe('SiteStack')
    expect(coerced.children?.[0]?.type).toBe('SiteGrid')
  })

  it('maps Heading text prop onto SiteText children + title role', () => {
    const coerced = coerceEditorNodeToSiteKit({
      id: 'h',
      type: 'Heading',
      props: { text: 'Title', level: 2 },
    })
    expect(coerced.type).toBe('SiteText')
    expect(coerced.props.children).toBe('Title')
    expect(coerced.props.role).toBe('title')
    expect(coerced.props.level).toBeUndefined()
    expect(coerced.props.text).toBeUndefined()
  })

  it('maps Button label onto SiteButton children', () => {
    const coerced = coerceEditorNodeToSiteKit({
      id: 'b',
      type: 'Button',
      props: { label: 'Go' },
    })
    expect(coerced.type).toBe('SiteButton')
    expect(coerced.props.children).toBe('Go')
    expect(coerced.props.label).toBeUndefined()
  })

  it('strips SiteSvg inspect-only mark and keeps markup', () => {
    const coerced = coerceEditorNodeToSiteKit({
      id: 'svg',
      type: 'SiteSvg',
      props: {
        mark: 'triangle',
        markup: '<svg viewBox="0 0 48 48"><path d="M0 0"/></svg>',
        alt: 'Graphic',
        viewBox: '0 0 48 48',
      },
    })
    expect(coerced.type).toBe('SiteSvg')
    expect(coerced.props.mark).toBeUndefined()
    expect(typeof coerced.props.markup).toBe('string')
    expect(coerced.props.alt).toBe('Graphic')
  })

  it('resolves SiteSvg mark to markup when markup is missing', () => {
    const coerced = coerceEditorNodeToSiteKit({
      id: 'svg',
      type: 'SiteSvg',
      props: { mark: 'triangle', alt: 'Tri' },
    })
    expect(coerced.props.mark).toBeUndefined()
    expect(String(coerced.props.markup ?? '')).toContain('<svg')
    expect(coerced.props.viewBox).toBeTruthy()
  })

  it('leaves Site Kit types unchanged', () => {
    const node = {
      id: 's',
      type: 'SiteStack',
      props: { direction: 'row' },
      children: [{ id: 't', type: 'SiteText', props: { children: 'Hi' } }],
    }
    const coerced = coerceEditorNodeToSiteKit(node)
    expect(coerced.type).toBe('SiteStack')
    expect(coerced.children?.[0]?.type).toBe('SiteText')
  })

  it('covers the closed alias table', () => {
    expect(EDITOR_TO_SITE_KIT_TYPE.Stack).toBe('SiteStack')
    expect(EDITOR_TO_SITE_KIT_TYPE.Grid).toBe('SiteGrid')
    expect(EDITOR_TO_SITE_KIT_TYPE.Button).toBe('SiteButton')
  })
})

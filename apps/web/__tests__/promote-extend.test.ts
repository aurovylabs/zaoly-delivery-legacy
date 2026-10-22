import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  applyExtendToComponentSource,
  collectPrimitiveExtends,
  ExtendUnrepresentableError,
} from '../lib/library/promote-extend'

const chatPanelSource = readFileSync(
  path.resolve(
    __dirname,
    '../../../packages/ui/src/components/ChatBlockPanel.tsx',
  ),
  'utf8',
)

describe('P4 primitive extend patch', () => {
  it('adds textAlign to ChatBlockPanel props, destructure, and root style', () => {
    const patched = applyExtendToComponentSource(chatPanelSource, 'ChatBlockPanel', [
      {
        name: 'textAlign',
        value: 'right',
        cssProperty: 'textAlign',
        tsType: "'left' | 'center' | 'right' | 'justify'",
      },
    ])
    expect(patched).toContain("textAlign?: 'left' | 'center' | 'right' | 'justify'")
    expect(patched).toContain('textAlign,')
    expect(patched).toContain('style={{ ...style, textAlign }}')
    expect(patched).toContain('data-zaoly-chat-block')
  })

  it('rejects an existing style= binding instead of guessing a merge', () => {
    const source = `export type BoxProps = {
  className?: string
}
export function Box({
  className,
  ...rest
}: BoxProps) {
  return (
    <div className={className} style={{ display: 'flex' }} {...rest} />
  )
}
`
    expect(() =>
      applyExtendToComponentSource(source, 'Box', [
        { name: 'textAlign', value: 'right', cssProperty: 'textAlign', tsType: "'right'" },
      ]),
    ).toThrow(ExtendUnrepresentableError)
  })

  it('rejects union-typed Button instead of guessing', () => {
    const button = `export type ButtonProps = A | B\nexport function Button(props: ButtonProps) {\n  return null\n}\n`
    expect(() =>
      applyExtendToComponentSource(button, 'Button', [
        { name: 'textAlign', value: 'right', cssProperty: 'textAlign', tsType: "'right'" },
      ]),
    ).toThrow(ExtendUnrepresentableError)
  })

  it('collects textAlign on ChatBlockPanel and not on Text (already contracted)', () => {
    expect(
      collectPrimitiveExtends({
        id: 'a',
        type: 'ChatBlockPanel',
        props: { textAlign: 'right' },
      }).map((e) => e.name),
    ).toEqual(['textAlign'])
    expect(
      collectPrimitiveExtends({
        id: 'b',
        type: 'Text',
        props: { textAlign: 'right' },
      }),
    ).toEqual([])
  })

  it('collects token fill as var(--accent) and radius literals', () => {
    expect(
      collectPrimitiveExtends({
        id: 'a',
        type: 'ChatBlockPanel',
        props: { background: '' },
        tokenBindings: { background: 'color.action.accent' },
      }),
    ).toEqual([
      {
        name: 'background',
        value: 'var(--accent)',
        cssProperty: 'background',
        tsType: 'string',
      },
    ])
    expect(
      collectPrimitiveExtends({
        id: 'b',
        type: 'ChatBlockPanel',
        props: { radius: '12px' },
      }).map((e) => e.name),
    ).toEqual(['radius'])
  })

  it('collects clipboard ChatBlockPanel fill + pipeline stroke as library CSS vars', () => {
    const extendsList = collectPrimitiveExtends({
      id: 'chatblockpanel-msxjrkb7-1',
      type: 'ChatBlockPanel',
      props: {
        background: '',
        borderColor: '',
        borderWidth: '',
        borderStyle: 'dashed',
      },
      tokenBindings: {
        background: 'color.action.primary',
        borderColor: 'color.status.pipeline.category_queued',
        borderWidth: 'spacing.static.large',
      },
    })
    expect(extendsList).toEqual(
      expect.arrayContaining([
        {
          name: 'background',
          value: 'var(--accent)',
          cssProperty: 'background',
          tsType: 'string',
        },
        {
          name: 'borderColor',
          value: 'var(--status-category-queued)',
          cssProperty: 'borderColor',
          tsType: 'string',
        },
        {
          name: 'borderWidth',
          value: 'var(--space-6)',
          cssProperty: 'borderWidth',
          tsType: 'string',
        },
        {
          name: 'borderStyle',
          value: 'dashed',
          cssProperty: 'borderStyle',
          tsType: "'none' | 'solid' | 'dashed' | 'dotted'",
        },
      ]),
    )
    expect(extendsList).toHaveLength(4)
  })

  it('rejects an unmapped token path instead of inventing a CSS variable', () => {
    expect(() =>
      collectPrimitiveExtends({
        id: 'a',
        type: 'ChatBlockPanel',
        tokenBindings: { background: 'color.unknown.leaf' },
      }),
    ).toThrow(ExtendUnrepresentableError)
  })

  it('adds background to ChatBlockPanel and paints inner Panel', () => {
    const patched = applyExtendToComponentSource(chatPanelSource, 'ChatBlockPanel', [
      {
        name: 'background',
        value: 'var(--accent)',
        cssProperty: 'background',
        tsType: 'string',
      },
    ])
    expect(patched).toContain('background?: string')
    expect(patched).toContain('background,')
    expect(patched).toContain('style={{ ...style, background }}')
    expect(patched).toMatch(/<Panel\s+style=\{\{ \.\.\.style, background \}\}/)
  })

  it('patches fill + stroke onto ChatBlockPanel root and inner Panel', () => {
    const patched = applyExtendToComponentSource(chatPanelSource, 'ChatBlockPanel', [
      {
        name: 'background',
        value: 'var(--accent)',
        cssProperty: 'background',
        tsType: 'string',
      },
      {
        name: 'borderColor',
        value: 'var(--status-category-queued)',
        cssProperty: 'borderColor',
        tsType: 'string',
      },
      {
        name: 'borderWidth',
        value: 'var(--space-6)',
        cssProperty: 'borderWidth',
        tsType: 'string',
      },
      {
        name: 'borderStyle',
        value: 'dashed',
        cssProperty: 'borderStyle',
        tsType: "'none' | 'solid' | 'dashed' | 'dotted'",
      },
    ])
    expect(patched).toContain('borderColor?: string')
    expect(patched).toContain('borderWidth?: string')
    expect(patched).toContain("borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted'")
    expect(patched).toContain(
      'style={{ ...style, background, borderColor, borderWidth, borderStyle }}',
    )
    expect(patched).toMatch(
      /<Panel\s+style=\{\{ \.\.\.style, background, borderColor, borderWidth, borderStyle \}\}/,
    )
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { KitPlaygroundPropsPane } from '../components/kit-playground/kit-playground-props'
import { buildKitPropsTokenOptions } from '../components/kit-playground/kit-props-token-field'
import {
  getNodeAtPath,
  listCompositionOutline,
  updateNodeAtPath,
} from '../lib/site-kit/composition-path'
import { resolveKitPropsPickerPath } from '../lib/site-kit/kit-props-picker-write'
import {
  clearRootTokenBinding,
  ensureNodeStyleSlot,
  setNodeTokenBinding,
  setRootStyleLiteralClearingBinding,
  setRootTokenBinding,
} from '../lib/site-kit/playground-draft'
import {
  collectKitPropsTokenSlots,
  kitPropsTokenSlotForStyleKey,
  KIT_PROPS_TOKEN_SLOTS,
} from '../lib/site-kit/kit-props-token-slots'
import { hudFontSizeLiteralPath } from '../lib/inspect/hud-font-size-presets'

vi.mock('@monaco-editor/react', () => ({
  default: function MockMonaco(props: { value?: string }) {
    return <pre data-testid="monaco-mock">{props.value}</pre>
  },
}))

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () => {
        const id = String(url).includes('SiteText') ? 'SiteText' : 'SiteButton'
        const exportName = id === 'SiteText' ? 'Text' : 'Button'
        return {
          ok: true,
          catalogId: id,
          exportName,
          packageName: '@zaoly/site-kit',
          relPath: `src/components/${exportName}.tsx`,
          source: `export function ${exportName}() { return null }\n`,
        }
      },
    })),
  )
})

const nested = {
  type: 'SiteStack',
  props: {},
  children: [
    {
      type: 'SiteText',
      props: { children: 'Hi' },
      style: { color: '#111' },
    },
    {
      type: 'SiteButton',
      props: { children: 'Go' },
      tokenBindings: { background: 'color.action.primary' },
    },
  ],
}

describe('composition path helpers (SK-V17)', () => {
  it('get/update nested node and list outline', () => {
    expect(getNodeAtPath(nested, [])?.type).toBe('SiteStack')
    expect(getNodeAtPath(nested, [0])?.type).toBe('SiteText')
    expect(getNodeAtPath(nested, [1])?.type).toBe('SiteButton')
    const updated = updateNodeAtPath(nested, [0], (n) => ({
      ...n,
      props: { ...n.props, children: 'Bye' },
    }))
    expect(getNodeAtPath(updated, [0])?.props.children).toBe('Bye')
    expect(getNodeAtPath(updated, [1])?.type).toBe('SiteButton')
    const outline = listCompositionOutline(nested)
    expect(outline.map((e) => e.type)).toEqual(['SiteStack', 'SiteText', 'SiteButton'])
    expect(outline[1]?.path).toEqual([0])
  })

  it('setNodeTokenBinding targets child path', () => {
    const next = setNodeTokenBinding(nested, [0], 'color', 'color.neutral.700')
    expect(next.tokenBindings).toBeUndefined()
    expect(getNodeAtPath(next, [0])?.tokenBindings?.color).toBe('color.neutral.700')
  })
})

describe('kit props picker write + options (SK-V17)', () => {
  it('resolves HUD preset paths to literals', () => {
    expect(resolveKitPropsPickerPath('sz:16px')).toEqual({ kind: 'literal', value: '16px' })
    expect(resolveKitPropsPickerPath('wt:700')).toEqual({ kind: 'literal', value: '700' })
    expect(resolveKitPropsPickerPath('ln:8px')).toEqual({ kind: 'literal', value: '8px' })
    expect(resolveKitPropsPickerPath('gf:Inter')).toEqual({ kind: 'literal', value: 'Inter' })
    expect(resolveKitPropsPickerPath('color.action.primary')).toEqual({
      kind: 'token',
      path: 'color.action.primary',
    })
  })

  it('fontSize options include sz: presets', () => {
    const opts = buildKitPropsTokenOptions(KIT_PROPS_TOKEN_SLOTS.fontSize!, [])
    expect(opts.some((o) => o.path === hudFontSizeLiteralPath('16px'))).toBe(true)
  })

  it('maps style keys and drafts', () => {
    expect(kitPropsTokenSlotForStyleKey('backgroundColor')?.bindingKey).toBe('background')
    const bound = setRootTokenBinding(
      { type: 'SiteButton', props: {}, style: { color: '#111' } },
      'color',
      'color.action.primary',
    )
    expect(bound.tokenBindings?.color).toBe('color.action.primary')
    const literal = setRootStyleLiteralClearingBinding(bound, 'color', '#222', 'color')
    expect(literal.tokenBindings?.color).toBeUndefined()
    expect(clearRootTokenBinding(bound, 'color').tokenBindings).toBeUndefined()
  })
})

describe('kit playground props tree + add binding (SK-V17)', () => {
  it('renders outline and package source for selected Site* child', async () => {
    const onSelectPath = vi.fn()
    render(
      <KitPlaygroundPropsPane
        composition={nested}
        selectedPath={[0]}
        onSelectPath={onSelectPath}
        tokenCatalog={[
          {
            path: 'color.neutral.700',
            group: 'color',
            label: 'Neutral',
            preview: '#333',
            type: 'color',
          },
        ]}
        onChange={vi.fn()}
        onStyleChange={vi.fn()}
        onTokenBindingChange={vi.fn()}
        onAddBinding={vi.fn()}
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-props-tree')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByTestId('kit-props-atom-source')).toBeTruthy()
      expect(screen.getByTestId('kit-props-atom-source-path')).toHaveTextContent('Text.tsx')
    })
    fireEvent.click(screen.getByTestId('kit-props-tree-1'))
    expect(onSelectPath).toHaveBeenCalledWith([1])
  })

  it('Add binding lists missing slots and calls onAddBinding', () => {
    const onAddBinding = vi.fn()
    render(
      <KitPlaygroundPropsPane
        composition={{ type: 'SiteButton', props: { children: 'Go' }, style: {} }}
        tokenCatalog={[]}
        onChange={vi.fn()}
        onStyleChange={vi.fn()}
        onTokenBindingChange={vi.fn()}
        onAddBinding={onAddBinding}
        t={(k) => k}
      />,
    )
    const select = screen.getByTestId('kit-props-add-binding') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'color' } })
    expect(onAddBinding).toHaveBeenCalledWith(
      expect.objectContaining({ bindingKey: 'color', styleKey: 'color' }),
    )
    expect(screen.getByTestId('kit-props-token-picker-color')).toBeTruthy()
  })

  it('ensureNodeStyleSlot creates empty style key for Add binding', () => {
    const next = ensureNodeStyleSlot(
      { type: 'SiteButton', props: {} },
      [],
      'color',
    )
    expect(next.style?.color).toBe('')
    const slots = collectKitPropsTokenSlots(next.style, next.tokenBindings)
    expect(slots.some((s) => s.bindingKey === 'color')).toBe(true)
  })

  it('renders TokenPicker for bindable style slots and keeps literal styles', () => {
    render(
      <KitPlaygroundPropsPane
        composition={{
          type: 'SiteButton',
          props: { children: 'Go' },
          style: {
            color: '#1f44ff',
            backgroundColor: '#111',
            boxSizing: 'border-box',
          },
          tokenBindings: { color: 'color.action.primary' },
        }}
        tokenCatalog={[
          {
            path: 'color.action.primary',
            group: 'color',
            label: 'color.action.primary',
            preview: '#1f44ff',
            type: 'color',
          },
        ]}
        onChange={vi.fn()}
        onStyleChange={vi.fn()}
        onTokenBindingChange={vi.fn()}
        onAddBinding={vi.fn()}
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-props-token-board')).toBeTruthy()
    expect(screen.getByTestId('kit-props-token-picker-color')).toBeTruthy()
    expect(screen.getByTestId('kit-style-boxSizing')).toBeTruthy()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KitPlaygroundPropsPane } from '../components/kit-playground/kit-playground-props'
import { configurePlaygroundMonaco, PLAYGROUND_MONACO_OPTIONS } from '../lib/site-kit/playground-monaco'
import {
  regeneratePlaygroundSource,
  setRootStyle,
} from '../lib/site-kit/playground-draft'
import { paths } from '../lib/paths'

describe('kit playground display polish (SK-V9)', () => {
  it('uses draft storage v2 so compact v1 drafts are ignored', () => {
    expect(paths.kitPlaygroundDraftStorageKey).toBe('zaoly.kit.playground.draft.v2')
  })

  it('configures Monaco for JSX without semantic false positives', () => {
    const setCompilerOptions = vi.fn()
    const setDiagnosticsOptions = vi.fn()
    const monaco = {
      languages: {
        typescript: {
          ScriptTarget: { ESNext: 99 },
          ModuleResolutionKind: { NodeJs: 2 },
          ModuleKind: { ESNext: 99 },
          JsxEmit: { React: 2 },
          typescriptDefaults: {
            setCompilerOptions,
            setDiagnosticsOptions,
          },
        },
      },
    }
    configurePlaygroundMonaco(monaco as never)
    expect(setCompilerOptions).toHaveBeenCalled()
    expect(setDiagnosticsOptions).toHaveBeenCalledWith(
      expect.objectContaining({ noSemanticValidation: true }),
    )
    expect(PLAYGROUND_MONACO_OPTIONS.wordWrap).toBe('off')
    expect(PLAYGROUND_MONACO_OPTIONS.tabSize).toBe(2)
  })

  it('setRootStyle + regenerate emits multi-line style', () => {
    const next = setRootStyle(
      {
        type: 'SiteStack',
        props: {},
        style: { padding: '8px' },
      },
      'background',
      'var(--surface)',
    )
    const tsx = regeneratePlaygroundSource('Hero', next)
    expect(tsx).toMatch(/style=\{\{\n/)
    expect(tsx).toMatch(/padding: "8px"/)
    expect(tsx).toMatch(/background: "var\(--surface\)"/)
  })

  it('props pane lists non-token style keys for ephemeral edit', () => {
    const onChange = vi.fn()
    const onStyleChange = vi.fn()
    const onTokenBindingChange = vi.fn()
    render(
      <KitPlaygroundPropsPane
        composition={{
          type: 'SiteStack',
          props: {},
          style: { boxSizing: 'border-box', opacity: '0.9' },
        }}
        onChange={onChange}
        onStyleChange={onStyleChange}
        onTokenBindingChange={onTokenBindingChange}
        onAddBinding={vi.fn()}
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-style-list')).toBeTruthy()
    fireEvent.change(screen.getByTestId('kit-style-opacity'), {
      target: { value: '0.5' },
    })
    expect(onStyleChange).toHaveBeenCalledWith('opacity', '0.5')
  })

  it('props pane offers TokenPicker for bindable style slots', () => {
    const onTokenBindingChange = vi.fn()
    render(
      <KitPlaygroundPropsPane
        composition={{
          type: 'SiteStack',
          props: {},
          style: { padding: '24px', color: '#111' },
        }}
        tokenCatalog={[
          {
            path: 'color.action.primary',
            group: 'color',
            label: 'Primary',
            preview: '#1f44ff',
            type: 'color',
          },
        ]}
        onChange={vi.fn()}
        onStyleChange={vi.fn()}
        onTokenBindingChange={onTokenBindingChange}
        onAddBinding={vi.fn()}
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-props-token-picker-padding')).toBeTruthy()
    expect(screen.getByTestId('kit-props-token-picker-color')).toBeTruthy()
    expect(screen.queryByTestId('kit-style-padding')).toBeNull()
  })
})

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { KitPlayground } from '../components/kit-playground/kit-playground'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'

vi.mock('next/dynamic', () => ({
  default: () => {
    function MockMonaco(props: {
      value?: string
      onChange?: (v: string | undefined) => void
    }) {
      return (
        <textarea
          data-testid="kit-monaco-mock"
          value={props.value ?? ''}
          onChange={(e) => props.onChange?.(e.target.value)}
        />
      )
    }
    return MockMonaco
  },
}))

vi.mock('../lib/user-prefs', () => ({
  useUserPrefs: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
}))

vi.mock('@zaoly/site-kit', async () => {
  const actual = await vi.importActual<typeof import('@zaoly/site-kit')>(
    '@zaoly/site-kit',
  )
  return {
    ...actual,
    CompositionPreview: ({ node }: { node: { type: string } }) => (
      <div data-testid="kit-composition-preview-inner">{node.type}</div>
    ),
  }
})

const buttonSeed = {
  ok: true,
  componentId: 'SiteButton',
  exportName: 'Button',
  source: `export function Button() {
  return (
    <Button type="button">Hello</Button>
  )
}`,
  composition: {
    type: 'SiteButton',
    props: { children: 'Hello', type: 'button' },
    tokenBindings: { background: 'color.action.primary' },
  },
}

describe('KitPlayground SK-V6 chrome', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/site-kit/playground-source')) {
          return {
            ok: true,
            json: async () => buttonSeed,
          }
        }
        if (url.includes('/api/site-kit/compositions')) {
          return { ok: true, json: async () => ({ compositions: [] }) }
        }
        if (url.includes('/api/tokens')) {
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              tokens: [],
              origins: {},
              canWrite: true,
            }),
          }
        }
        return { ok: false, json: async () => ({}) }
      }),
    )
  })

  it('shows Open in Editor, Create Pattern, viewport toggles, and frame width', async () => {
    render(<KitPlayground inAppEditor projects={[]} />)
    await waitFor(() => {
      expect(screen.getByTestId('kit-open-in-editor')).toBeTruthy()
    })
    expect(screen.getByTestId('kit-create-pattern-in-editor')).toBeTruthy()
    expect(screen.getByTestId('kit-pattern-flow-hint')).toBeTruthy()
    expect(screen.getByTestId('kit-viewport-toggles')).toBeTruthy()
    expect(screen.getByTestId('kit-viewport-desktop')).toBeTruthy()
    const frame = screen.getByTestId('kit-preview-frame')
    expect(frame.getAttribute('data-viewport')).toBe('desktop')
    expect(frame.style.maxWidth).toBe(`${EDITOR_BREAKPOINT_WIDTHS.desktop}px`)
    fireEvent.click(screen.getByTestId('kit-viewport-mobile'))
    expect(frame.getAttribute('data-viewport')).toBe('mobile')
    expect(frame.style.maxWidth).toBe(`${EDITOR_BREAKPOINT_WIDTHS.mobile}px`)
  })

  it('shows persist hint when sandbox is dirty', async () => {
    render(<KitPlayground inAppEditor projects={[]} />)
    await waitFor(() => screen.getByTestId('kit-monaco-mock'))
    const editor = screen.getByTestId('kit-monaco-mock') as HTMLTextAreaElement
    fireEvent.change(editor, { target: { value: `${editor.value}\n// dirty` } })
    await waitFor(() => {
      expect(screen.getByTestId('kit-persist-hint')).toBeTruthy()
    })
  })

  it('shows Tokens tab with EditorTokenStudio (SK-V16)', async () => {
    render(<KitPlayground inAppEditor projects={[]} />)
    await waitFor(() => {
      expect(screen.getByTestId('kit-tab-tokens')).toBeTruthy()
    })
    fireEvent.click(screen.getByTestId('kit-tab-tokens'))
    await waitFor(() => {
      expect(screen.getByTestId('kit-tokens-pane')).toBeTruthy()
      expect(screen.getByTestId('creation-editor-token-studio')).toBeTruthy()
    })
  })
})

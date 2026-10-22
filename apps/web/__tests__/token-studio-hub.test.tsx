// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProviders } from '../components/app-providers'
import { TokenStudioHub } from '../components/token-studio-hub'
import { paths } from '../lib/paths'

const primaryValue = JSON.stringify({ digital: { hex: '#1f44ff' } })
const routerReplace = vi.fn()
let searchQuery = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplace, refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(searchQuery),
  usePathname: () => paths.routes.tokens,
}))

describe('TokenStudioHub', () => {
  beforeEach(() => {
    searchQuery = ''
    routerReplace.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input)
        if (url.includes(paths.routes.apiTokens)) {
          if (init?.method === 'PATCH') {
            return { ok: true, json: async () => ({ ok: true }) }
          }
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              canWrite: true,
              origins: {
                'color.action.primary': 'fixture',
                'spacing.static.medium': 'fixture',
                'spacing.static.large': 'fixture',
                'radius.control.md': 'fixture',
                'opacity.disabled': 'fixture',
                'size.touch.target': 'fixture',
                'typography.heading.h1': 'fixture',
                'shadow.elevation.md': 'fixture',
                'glow.accent': 'fixture',
                'effect.blur.md': 'fixture',
                'motion.base': 'fixture',
              },
              tokens: [
                {
                  path: 'color.action.primary',
                  type: 'color',
                  value: primaryValue,
                  status: 'active',
                },
                {
                  path: 'spacing.static.medium',
                  type: 'spacing',
                  value: JSON.stringify({ digital: '1rem' }),
                  status: 'active',
                },
                {
                  path: 'spacing.static.large',
                  type: 'spacing',
                  value: JSON.stringify({ digital: '2rem' }),
                  status: 'active',
                },
                {
                  path: 'radius.control.md',
                  type: 'radius',
                  value: JSON.stringify({ digital: '8px' }),
                  status: 'active',
                },
                {
                  path: 'opacity.disabled',
                  type: 'opacity',
                  value: JSON.stringify({ digital: '0.4' }),
                  status: 'active',
                },
                {
                  path: 'size.touch.target',
                  type: 'size',
                  value: JSON.stringify({ digital: { preferred: '48px' } }),
                  status: 'active',
                },
                {
                  path: 'typography.heading.h1',
                  type: 'typography',
                  value: JSON.stringify({
                    family: "'Noto Sans JP', sans-serif",
                    weight: '700',
                    digital: { size: '1.5rem', lineHeight: '1.2' },
                  }),
                  status: 'active',
                },
                {
                  path: 'shadow.elevation.md',
                  type: 'shadow',
                  value: JSON.stringify({
                    digital: {
                      offsetX: '0',
                      offsetY: '4px',
                      blur: '12px',
                      spread: '0',
                      color: 'rgba(0, 0, 0, 0.15)',
                    },
                  }),
                  status: 'active',
                },
                {
                  path: 'glow.accent',
                  type: 'glow',
                  value: JSON.stringify({
                    digital: { color: 'rgba(31, 68, 255, 0.85)', blur: '24px', spread: '2px' },
                  }),
                  status: 'active',
                },
                {
                  path: 'effect.blur.md',
                  type: 'effect',
                  value: JSON.stringify({
                    digital: { kind: 'blur', amount: '8px' },
                  }),
                  status: 'active',
                },
                {
                  path: 'motion.base',
                  type: 'motion',
                  value: JSON.stringify({
                    digital: { duration: '240ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
                  }),
                  status: 'active',
                },
              ],
            }),
          }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 80,
        left: 40,
        right: 220,
        bottom: 280,
        width: 180,
        height: 200,
        x: 40,
        y: 80,
        toJSON: () => ({}),
      }),
    })
  })

  it('lists tokens in a dedicated admin hub', async () => {
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    expect(await screen.findByTestId('token-card-color.action.primary')).toBeInTheDocument()
    expect(screen.getByTestId('zaoly-token-studio')).toBeInTheDocument()
    expect(screen.getByTestId('token-chapter-color')).toBeInTheDocument()
    expect(screen.getByTestId('token-family-color-action')).toBeInTheDocument()
    expect(screen.getByTestId('token-cluster-color-action-primary')).toBeInTheDocument()
    expect(screen.getByTestId('token-card-create-color-action')).toBeInTheDocument()
    expect(screen.getByTestId('token-group-new-color')).toBeInTheDocument()
    expect(screen.getByTestId('zaoly-token-studio').className).toContain('creation-magazine')
    expect(screen.getByTestId('token-card-color.action.primary')).toBeInTheDocument()
    expect(screen.queryByTestId('token-origin-color.action.primary')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /add token/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('tablist', { name: /filter token types/i })).toBeInTheDocument()
    expect(screen.getByTestId('token-pack-view-switch')).toBeInTheDocument()
    expect(screen.getByTestId('token-view-cards')).toBeInTheDocument()
    expect(screen.getByTestId('token-view-json')).toBeInTheDocument()
    expect(screen.getByTestId('token-view-css')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^list$/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('token-edit-dock')).not.toBeInTheDocument()
    expect(screen.getByTestId('token-space-grid-spacing.static.medium')).toBeInTheDocument()
    expect(screen.getByTestId('token-radius-corner-radius.control.md')).toBeInTheDocument()
    expect(screen.getByTestId('token-opacity-sheet-opacity.disabled')).toBeInTheDocument()
    expect(screen.getByTestId('token-size-sheet-size.touch.target')).toBeInTheDocument()
    expect(screen.getByTestId('token-type-sheet-typography.heading.h1')).toBeInTheDocument()
    expect(screen.getByTestId('token-shadow-sheet-shadow.elevation.md')).toBeInTheDocument()
    expect(screen.getByTestId('token-glow-sheet-glow.accent')).toBeInTheDocument()
    expect(screen.getByTestId('token-effect-sheet-effect.blur.md')).toBeInTheDocument()
    expect(screen.getByTestId('token-motion-sheet-motion.base')).toBeInTheDocument()
  })

  it('pins a card and opens the side edit dock', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-color.action.primary'))
    expect(await screen.findByTestId('token-edit-dock')).toBeInTheDocument()
    expect(screen.getByTestId('token-edit-dock')).toHaveAttribute('data-mode', 'edit')
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/pick color/i)).toBeInTheDocument()
    expect(screen.queryByText(/select a token to inspect/i)).not.toBeInTheDocument()
  })

  it('opens the same side dock for create (no modal dialog)', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-create-color-action'))
    const dock = await screen.findByTestId('token-edit-dock')
    expect(dock).toHaveAttribute('data-mode', 'create')
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/token path/i)).toHaveValue('color.action.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('creates an empty path family and opens add with that prefix', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await screen.findByTestId('token-group-new-color')
    await user.click(screen.getByTestId('token-group-new-color'))
    await user.type(screen.getByTestId('token-group-slug-color'), 'brand')
    await user.click(screen.getByTestId('token-group-submit-color'))
    expect(await screen.findByTestId('token-family-color-brand')).toBeInTheDocument()
    expect(screen.getByTestId('token-card-create-color-brand')).toBeInTheDocument()
    expect(await screen.findByTestId('token-edit-dock')).toHaveAttribute('data-mode', 'create')
    expect(screen.getByLabelText(/token path/i)).toHaveValue('color.brand.')
  })

  it('keeps the edit dock open when picking a portaled base-token option', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-spacing.static.medium'))
    expect(await screen.findByTestId('token-edit-dock')).toBeInTheDocument()
    await user.click(screen.getByTestId('token-compose-link'))
    await user.click(screen.getByRole('combobox', { name: /base token/i }))
    const menu = await screen.findByTestId('ds-select-menu-portal')
    await user.click(within(menu).getByRole('option', { name: 'spacing.static.large' }))
    expect(screen.getByTestId('token-edit-dock')).toBeInTheDocument()
    expect(screen.getByTestId('token-compose-expr-input')).toHaveValue(
      'calc({spacing.static.large} * 2)',
    )
  })

  it('renames a token from the dock title without closing the dock', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-spacing.static.medium'))
    expect(await screen.findByTestId('token-edit-dock')).toBeInTheDocument()
    await user.click(screen.getByTestId('token-rename-trigger'))
    const input = screen.getByTestId('token-rename-input')
    await user.clear(input)
    await user.type(input, 'spacing.static.page')
    await user.keyboard('{Enter}')
    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([url, init]) => String(url).includes(paths.routes.apiTokens) && init?.method === 'PATCH',
      )
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(String(patchCall?.[1]?.body ?? '{}')) as {
        path: string
        fromPath: string
      }
      expect(body.path).toBe('spacing.static.page')
      expect(body.fromPath).toBe('spacing.static.medium')
    })
    expect(screen.getByTestId('token-edit-dock')).toBeInTheDocument()
  })

  it('opens a cubic-bezier pad for motion easing', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-motion.base'))
    expect(await screen.findByTestId('token-edit-dock')).toBeInTheDocument()
    expect(screen.getByTestId('token-bezier-pad')).toBeInTheDocument()
    expect(screen.getByTestId('token-bezier-p1')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /easing presets/i })).toBeInTheDocument()
  })

  it('lists shadow and glow position fields in the edit dock', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-shadow.elevation.md'))
    expect(await screen.findByTestId('token-snap-shadow-offset-x')).toBeInTheDocument()
    expect(screen.getByTestId('token-snap-shadow-offset-y')).toBeInTheDocument()
    expect(screen.getByTestId('token-snap-shadow-spread')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inset/i })).toBeInTheDocument()
    await user.click(screen.getByTestId('token-card-glow.accent'))
    expect(await screen.findByTestId('token-snap-glow-offset-x')).toBeInTheDocument()
    expect(screen.getByTestId('token-snap-glow-offset-y')).toBeInTheDocument()
  })

  it('live-previews scale-wheel changes on card media and PATCHes on save', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await user.click(await screen.findByTestId('token-card-spacing.static.medium'))
    expect(await screen.findByTestId('token-edit-dock')).toBeInTheDocument()
    const wheel = screen.getByTestId('token-snap-spacing')
    expect(wheel).toHaveAttribute('role', 'slider')
    wheel.focus()
    // 1rem → 1.25rem → 1.5rem (two steps up the rem ladder)
    fireEvent.keyDown(wheel, { key: 'ArrowRight' })
    fireEvent.keyDown(wheel, { key: 'ArrowRight' })
    await waitFor(() => {
      const sheet = screen.getByTestId('token-space-grid-spacing.static.medium')
      expect(sheet).toHaveStyle({ '--token-space': '1.5rem' })
    })
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls
      expect(
        calls.some(
          ([url, init]) =>
            String(url).includes(paths.routes.apiTokens) &&
            (init as RequestInit | undefined)?.method === 'PATCH',
        ),
      ).toBe(true)
    })
  })

  it('filters catalog by unresolved / override / custom status chips', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes(paths.routes.apiTokens)) {
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              canWrite: true,
              origins: {
                'color.action.primary': 'local',
                'spacing.static.medium': 'fixture',
                'spacing.static.broken': 'local',
              },
              tokens: [
                {
                  path: 'color.action.primary',
                  type: 'color',
                  value: JSON.stringify({ digital: { hex: '#ff00aa' } }),
                  status: 'active',
                },
                {
                  path: 'spacing.static.medium',
                  type: 'spacing',
                  value: JSON.stringify({ digital: '1rem' }),
                  status: 'active',
                },
                {
                  path: 'spacing.static.broken',
                  type: 'spacing',
                  value: JSON.stringify({ digital: 'calc({spacing.missing.token} * 2)' }),
                  status: 'active',
                },
              ],
            }),
          }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    expect(await screen.findByTestId('token-unresolved-spacing.static.broken')).toBeInTheDocument()
    expect(screen.getByTestId('token-filter-unresolved')).toHaveTextContent(/· 1/)
    expect(screen.getByTestId('token-filter-override')).toHaveTextContent(/· 1/)
    expect(screen.getByTestId('token-filter-custom')).toHaveTextContent(/· 1/)

    await user.click(screen.getByTestId('token-filter-unresolved'))
    expect(screen.getByTestId('token-card-spacing.static.broken')).toBeInTheDocument()
    expect(screen.queryByTestId('token-card-spacing.static.medium')).not.toBeInTheDocument()
    expect(screen.queryByTestId('token-card-color.action.primary')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('token-filter-override'))
    expect(screen.getByTestId('token-card-color.action.primary')).toBeInTheDocument()
    expect(screen.queryByTestId('token-card-spacing.static.broken')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('token-filter-custom'))
    expect(screen.getByTestId('token-card-spacing.static.broken')).toBeInTheDocument()
    expect(screen.queryByTestId('token-card-color.action.primary')).not.toBeInTheDocument()
  })

  it('reverts all fixture overrides from the toolbar', async () => {
    const user = userEvent.setup()
    const deleted: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input)
        if (url.includes(paths.routes.apiTokens) && init?.method === 'DELETE') {
          const path = new URL(url, 'http://local.test').searchParams.get(paths.tokenPackPathQueryKey)
          if (path) deleted.push(path)
          return { ok: true, json: async () => ({ ok: true, path }) }
        }
        if (url.includes(paths.routes.apiTokens)) {
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              canWrite: true,
              origins:
                deleted.includes('color.action.primary')
                  ? { 'spacing.static.medium': 'fixture', 'color.custom.x': 'local' }
                  : {
                      'color.action.primary': 'local',
                      'spacing.static.medium': 'fixture',
                      'color.custom.x': 'local',
                    },
              tokens: [
                {
                  path: 'color.action.primary',
                  type: 'color',
                  value: JSON.stringify({ digital: { hex: '#ff00aa' } }),
                  status: 'active',
                },
                {
                  path: 'spacing.static.medium',
                  type: 'spacing',
                  value: JSON.stringify({ digital: '1rem' }),
                  status: 'active',
                },
                {
                  path: 'color.custom.x',
                  type: 'color',
                  value: JSON.stringify({ digital: { hex: '#112233' } }),
                  status: 'active',
                },
              ].filter((leaf) => !deleted.includes(leaf.path) || leaf.path === 'color.custom.x'),
            }),
          }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    expect(await screen.findByTestId('token-revert-all-overrides')).toBeInTheDocument()
    await user.click(screen.getByTestId('token-revert-all-overrides'))
    await waitFor(() => {
      expect(deleted).toContain('color.action.primary')
      expect(deleted).not.toContain('color.custom.x')
    })
  })

  it('opens a deep-linked token path into the edit dock', async () => {
    searchQuery = `${paths.tokenPackPathQueryKey}=color.action.primary`
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    expect(await screen.findByTestId('token-edit-dock')).toBeInTheDocument()
    expect(screen.getByTestId('token-card-color.action.primary').className).toMatch(/is-selected/)
  })

  it('applies status filter when clicking an origin badge without opening the dock', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes(paths.routes.apiTokens)) {
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              canWrite: true,
              origins: {
                'color.action.primary': 'local',
                'spacing.static.medium': 'fixture',
              },
              tokens: [
                {
                  path: 'color.action.primary',
                  type: 'color',
                  value: JSON.stringify({ digital: { hex: '#ff00aa' } }),
                  status: 'active',
                },
                {
                  path: 'spacing.static.medium',
                  type: 'spacing',
                  value: JSON.stringify({ digital: '1rem' }),
                  status: 'active',
                },
              ],
            }),
          }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await screen.findByTestId('token-origin-color.action.primary')
    await user.click(screen.getByTestId('token-origin-color.action.primary'))
    expect(screen.queryByTestId('token-edit-dock')).not.toBeInTheDocument()
    expect(screen.getByTestId('token-card-color.action.primary')).toBeInTheDocument()
    expect(screen.queryByTestId('token-card-spacing.static.medium')).not.toBeInTheDocument()
    expect(screen.getByTestId('token-filter-override')).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows fixture baseline for override leaves in card and dock', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes(paths.routes.apiTokens)) {
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              canWrite: true,
              origins: {
                'color.action.primary': 'local',
              },
              tokens: [
                {
                  path: 'color.action.primary',
                  type: 'color',
                  value: JSON.stringify({ digital: { hex: '#ff00aa' } }),
                  status: 'active',
                },
              ],
            }),
          }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    expect(await screen.findByTestId('token-origin-color.action.primary')).toHaveTextContent(
      /override/i,
    )
    expect(screen.getByTestId('token-fixture-was-color.action.primary')).toBeInTheDocument()
    await user.click(screen.getByTestId('token-card-color.action.primary'))
    const baseline = await screen.findByTestId('token-fixture-baseline')
    expect(baseline).toHaveTextContent(/seed/i)
    expect(baseline).not.toHaveTextContent(/fixture/i)
  })

  it('switches to JSON and CSS pack dumps with copy', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(
      <AppProviders>
        <TokenStudioHub />
      </AppProviders>,
    )
    await screen.findByTestId('token-card-color.action.primary')
    await user.click(screen.getByTestId('token-view-json'))
    const jsonDump = await screen.findByTestId('token-pack-json')
    expect(jsonDump.textContent).toContain('"color"')
    expect(jsonDump.textContent).toContain('"$type"')
    expect(jsonDump.textContent).toContain('#1f44ff')
    expect(screen.queryByTestId('token-card-color.action.primary')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('token-pack-copy'))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(String(writeText.mock.calls[0]?.[0])).toContain('$value')

    await user.click(screen.getByTestId('token-view-css'))
    const cssDump = await screen.findByTestId('token-pack-css')
    expect(cssDump.textContent).toContain(':root {')
    expect(cssDump.textContent).toContain('--zaoly-color-action-primary:')
    expect(cssDump.textContent).toContain('#1f44ff')
    expect(screen.getByTestId('token-pack-download')).toBeInTheDocument()
    expect(screen.queryByTestId('token-pack-import')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('token-view-json'))
    expect(screen.getByTestId('token-pack-import')).toBeInTheDocument()
  })

  it('uses the DS barrel, not raw @zaoly/ui', () => {
    const src = readFileSync(path.join(__dirname, '../components/token-studio-hub.tsx'), 'utf8')
    expect(src).toContain("from '../lib/zaoly-ui'")
    expect(src).toContain('groupLeavesByPathFamily')
    expect(src).toContain('withEmptyPathFamilies')
    expect(src).toContain('openCreateInGroup')
    expect(src).toContain('token-family-')
    expect(src).toContain('token-cluster-')
    expect(src).toContain('token-group-new-')
    expect(src).toContain('zaoly-token-studio__status')
    expect(src).toMatch(/no Fixture badge|Fixture is silent/)
    expect(src).toContain('HubIndexCard')
    expect(src).not.toContain('HubIndexLayoutSwitch')
    expect(src).toContain('formatTokenPackJson')
    expect(src).toContain('formatTokenPackCss')
    expect(src).toContain('downloadTokenPackText')
    expect(src).toContain('apiTokensImport')
    expect(src).toContain('catalogLeafStatus')
    expect(src).toContain('token-unresolved-')
    expect(src).toContain('token-filter-${id}')
    expect(src).toContain('countCatalogStatuses')
    expect(src).toContain('toggleStatusFilter')
    expect(src).toContain('fixtureBaselineForPath')
    expect(src).toContain('tokensFocus')
    expect(src).toContain('focusLeaf')
    expect(src).toContain('syncFocusUrl')
    expect(src).toContain('creation-magazine')
    expect(src).toContain('token-edit-dock')
    expect(src).toContain('zaoly-token-studio__edit-dock')
    expect(src).toContain('token-card-create-')
    expect(src).toContain("data-mode={addOpen ? 'create' : 'edit'}")
    expect(src).toContain('SnapTimelineField')
    expect(src).toContain('TokenNominalWheel')
    expect(src).toContain('TokenBezierPad')
    expect(src).toContain('TokenComposeField')
    expect(src).toContain('looksLikeTokenExpr')
    expect(src).toContain('zaoly-token-studio__fields')
    expect(src).not.toContain('zaoly-token-studio__fields--split')
    expect(src).not.toContain('Slider')
    expect(src).not.toContain('token-studio-edit-dialog')
    expect(src).not.toContain('zaoly-token-studio-dialog')
    expect(src).not.toMatch(/\bDialog\b/)
    expect(src).not.toContain('zaoly-token-studio__inspector')
    expect(src).not.toContain('[selectedPath, pack]')
    expect(src).not.toMatch(/from ['"]@zaoly\/ui['"]/)
    expect(src).toContain('zaoly-token-studio__space-sheet')
    expect(src).toContain('zaoly-token-studio__radius-module')
    expect(src).toContain('zaoly-token-studio__opacity-sheet')
    expect(src).toContain('zaoly-token-studio__size-map')
    expect(src).toContain('zaoly-token-studio__type-specimen')
    expect(src).toContain('Aa Bb\\nHg xy')
    expect(src).toContain('zaoly-token-studio__shadow-sheet')
    expect(src).toContain('zaoly-token-studio__shadow-plate')
    expect(src).toContain('zaoly-token-studio__shadow-ghost')
    expect(src).toContain('--token-shadow')
    expect(src).not.toContain('zaoly-token-studio__shadow-stage')
    expect(src).toContain('zaoly-token-studio__glow-sheet')
    expect(src).toContain('zaoly-token-studio__effect-specimen')
    expect(src).toContain('zaoly-token-studio__motion-sheet')
    expect(src).toContain('--token-glow')
    expect(src).toContain('--token-motion-duration')
    expect(src).not.toContain('--zaoly-')
  })
})

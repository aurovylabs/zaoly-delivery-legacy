import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { OnboardingHost } from '../components/editor/onboarding/OnboardingHost'
import {
  clearOnboardingFlags,
  dispatchOnboardingAction,
  markTourDone,
  markWelcomeSeen,
  setTourProgress,
} from '../lib/editor/onboarding'
import { paths } from '../lib/paths'
import { createEmptyArtboardScene } from '../lib/scene/demo-scene'
import { createZaolyDefaultLandingScene } from '../lib/scene/zaoly-default-landing-scene'

describe('OnboardingHost', () => {
  beforeEach(() => {
    clearOnboardingFlags()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows Welcome when flags are cleared', async () => {
    render(
      <OnboardingHost rootCount={0} onLoadSample={() => undefined} />,
    )
    expect(await screen.findByTestId('zaoly-onboarding-welcome')).toBeInTheDocument()
    expect(screen.getByText(/Open sample|Beispiel öffnen/i)).toBeInTheDocument()
  })

  it('Open sample calls loader and begins tour tip', async () => {
    const onLoadSample = vi.fn()
    render(
      <OnboardingHost rootCount={0} onLoadSample={onLoadSample} locale="en" />,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Open sample' }))
    await waitFor(() => expect(onLoadSample).toHaveBeenCalled())
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toBeInTheDocument()
    })
    expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
      'data-tour-step',
      'select',
    )
  })

  it('allows dragging the tip away from the spotlight', async () => {
    clearOnboardingFlags()
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Explore on my own/i }))
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    const tip = await screen.findByTestId('zaoly-onboarding-tip')
    const handle = screen.getByTestId('zaoly-onboarding-tip-drag')
    // Seed a known box for getBoundingClientRect during drag start.
    tip.getBoundingClientRect = () =>
      ({
        top: 200,
        left: 100,
        width: 320,
        height: 120,
        bottom: 320,
        right: 420,
        x: 100,
        y: 200,
        toJSON() {
          return {}
        },
      }) as DOMRect
    fireEvent.pointerDown(handle, { button: 0, clientX: 120, clientY: 210, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 220, clientY: 280, pointerId: 1 })
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(tip).toHaveAttribute('data-dragging', 'true')
    expect(tip.style.left).not.toBe('')
    expect(tip.style.top).not.toBe('')
  })

  it('Skip ends tour without Done celebration', async () => {
    clearOnboardingFlags()
    const { rerender } = render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Explore on my own/i }))
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByTestId('zaoly-onboarding-tip')).toBeNull()
    expect(screen.queryByTestId('zaoly-onboarding-done')).toBeNull()
    rerender(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    expect(screen.queryByTestId('zaoly-onboarding-done')).toBeNull()
  })

  it('shows Empty coach when welcome seen, tour done, and board empty', async () => {
    markWelcomeSeen()
    markTourDone()
    render(
      <OnboardingHost rootCount={0} onLoadSample={() => undefined} locale="en" />,
    )
    expect(await screen.findByTestId('zaoly-onboarding-empty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Let's start" })).toBeInTheDocument()
  })

  it('portals tip above page-body stacking so top chrome cannot cover it', async () => {
    clearOnboardingFlags()
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Explore on my own/i }))
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    const tip = await screen.findByTestId('zaoly-onboarding-tip')
    expect(tip.parentElement).toBe(document.body)
  })

  it('renders spotlight rings for a compact canvas node on select', async () => {
    clearOnboardingFlags()
    const frame = document.createElement('div')
    frame.className = 'creation-scene-page-frame creation-scene-page-frame--active'
    const body = document.createElement('div')
    body.className = 'creation-scene-page-frame__body'
    const node = document.createElement('div')
    node.className = 'creation-scene-node'
    node.setAttribute('data-node-type', 'SiteButton')
    node.setAttribute('data-node-id', 'btn-1')
    node.getBoundingClientRect = () =>
      ({
        top: 160,
        left: 120,
        width: 128,
        height: 36,
        bottom: 196,
        right: 248,
        x: 120,
        y: 160,
        toJSON() {
          return {}
        },
      }) as DOMRect
    body.appendChild(node)
    frame.appendChild(body)
    document.body.appendChild(frame)
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Explore on my own/i }))
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    const layer = await screen.findByTestId('zaoly-onboarding-highlights')
    expect(layer.className).toContain('zaoly-onboarding-highlights--veil')
    expect(layer.querySelectorAll('.zaoly-onboarding-highlight')).toHaveLength(1)
    frame.remove()
  })

  it('select onboarding-action advances from tip 1 to tip 2', async () => {
    clearOnboardingFlags()
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Explore on my own/i }))
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'select',
      )
    })
    act(() => {
      dispatchOnboardingAction('select')
    })
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'openComponents',
      )
    })
    act(() => {
      dispatchOnboardingAction('openComponents')
    })
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'insert',
      )
    })
    act(() => {
      dispatchOnboardingAction('openTokens')
    })
    // Wrong step — must stay on insert
    expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
      'data-tour-step',
      'insert',
    )
  })

  it('insert tip lights the artboard after picking a palette atom', async () => {
    clearOnboardingFlags()
    markWelcomeSeen()
    setTourProgress(2) // insert
    const frame = document.createElement('div')
    frame.className = 'creation-scene-page-frame--active'
    frame.getBoundingClientRect = () =>
      ({
        top: 60,
        left: 220,
        width: 480,
        height: 700,
        bottom: 760,
        right: 700,
        x: 220,
        y: 60,
        toJSON() {
          return {}
        },
      }) as DOMRect
    document.body.appendChild(frame)
    const palette = document.createElement('div')
    palette.setAttribute('data-testid', 'creation-editor-palette')
    const item = document.createElement('li')
    item.className = 'ds-component-palette__item'
    palette.appendChild(item)
    document.body.appendChild(palette)
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'insert',
      )
    })
    fireEvent.pointerDown(item, { button: 0 })
    await waitFor(() => {
      const layer = screen.getByTestId('zaoly-onboarding-highlights')
      expect(layer).toHaveAttribute('data-insert-drop-guide', 'true')
      expect(layer.querySelector('.zaoly-onboarding-highlight--drop-zone')).toBeTruthy()
    })
    frame.remove()
    palette.remove()
  })

  it('openTokens advances to tokenPick follow-up tip', async () => {
    clearOnboardingFlags()
    markWelcomeSeen()
    setTourProgress(6) // openTokens index (v3)
    const tab = document.createElement('button')
    tab.setAttribute('data-testid', 'editor-left-tab-tokens')
    tab.setAttribute('aria-selected', 'false')
    document.body.appendChild(tab)
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'openTokens',
      )
    })
    act(() => {
      dispatchOnboardingAction('tokens')
    })
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'tokenPick',
      )
    })
    tab.remove()
  })

  it('tokenPick advances to tokenBind follow-up tip', async () => {
    clearOnboardingFlags()
    markWelcomeSeen()
    setTourProgress(7) // tokenPick index
    const row = document.createElement('li')
    row.setAttribute('data-testid', 'token-studio-row-color.action.primary')
    row.getBoundingClientRect = () =>
      ({
        top: 160,
        left: 20,
        width: 200,
        height: 32,
        bottom: 192,
        right: 220,
        x: 20,
        y: 160,
        toJSON() {
          return {}
        },
      }) as DOMRect
    document.body.appendChild(row)
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'tokenPick',
      )
    })
    act(() => {
      dispatchOnboardingAction('tokenPick')
    })
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'tokenBind',
      )
    })
    row.remove()
  })

  it('skips openTokens when Tokens tab is already selected', async () => {
    clearOnboardingFlags()
    markWelcomeSeen()
    setTourProgress(6)
    const tab = document.createElement('button')
    tab.setAttribute('data-testid', 'editor-left-tab-tokens')
    tab.setAttribute('aria-selected', 'true')
    document.body.appendChild(tab)
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'tokenPick',
      )
    })
    tab.remove()
  })

  it('activateBreakpoint advances after tablet/mobile action', async () => {
    clearOnboardingFlags()
    markWelcomeSeen()
    setTourProgress(10) // activateBreakpoint index
    const tile = document.createElement('div')
    tile.setAttribute('data-breakpoint-tile', 'tablet')
    tile.setAttribute('data-node-id', '__bp-tile:tablet')
    tile.getBoundingClientRect = () =>
      ({
        top: 100,
        left: 300,
        width: 200,
        height: 80,
        bottom: 180,
        right: 500,
        x: 300,
        y: 100,
        toJSON() {
          return {}
        },
      }) as DOMRect
    document.body.appendChild(tile)
    render(
      <OnboardingHost rootCount={2} onLoadSample={() => undefined} locale="en" />,
    )
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'activateBreakpoint',
      )
    })
    act(() => {
      dispatchOnboardingAction('activateBreakpoint')
    })
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await waitFor(() => {
      expect(screen.getByTestId('zaoly-onboarding-tip')).toHaveAttribute(
        'data-tour-step',
        'preview',
      )
    })
    tile.remove()
  })
})

describe('EditorWorkspace onboarding wiring', () => {
  beforeEach(() => {
    clearOnboardingFlags()
  })

  it('mounts OnboardingHost Welcome on editor when flags cleared', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createEmptyArtboardScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('creation-editor-workspace')).toBeInTheDocument()
    expect(await screen.findByTestId('zaoly-onboarding-welcome')).toBeInTheDocument()
  })

  it('Open sample loads default landing headline on canvas', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createEmptyArtboardScene()} />
      </AppProviders>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Open sample|Beispiel öffnen/i }))
    await waitFor(() => {
      expect(screen.queryByTestId('zaoly-onboarding-welcome')).toBeNull()
    })
    await waitFor(() => {
      expect(
        document.body.textContent?.includes('Compose product pages from kit atoms and tokens') ||
          document.body.textContent?.includes('Built from the system'),
      ).toBe(true)
    })
  })

  it('?onboarding=reset forces Welcome even after prior completion', async () => {
    localStorage.setItem(paths.onboarding.welcomeStorageKey, '1')
    localStorage.setItem(paths.onboarding.tourStorageKey, 'done')
    const prev = window.location.search
    window.history.replaceState({}, '', `?${paths.onboarding.queryParam}=reset`)
    try {
      render(
        <AppProviders>
          <EditorWorkspace initialScene={createZaolyDefaultLandingScene()} />
        </AppProviders>,
      )
      expect(await screen.findByTestId('zaoly-onboarding-welcome')).toBeInTheDocument()
    } finally {
      window.history.replaceState({}, '', prev || '/')
    }
  })
})

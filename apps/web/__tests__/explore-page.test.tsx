// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreChapterPage } from '../components/explore-chapter-page'
import { ExplorePage } from '../components/explore-page'
import { EXPLORE_CHAPTERS } from '../lib/landing/explore'
import { paths } from '../lib/paths'
import { UserPrefsProvider } from '../lib/user-prefs'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

describe('Zaoly explore pages', () => {
  it('lists all public explore chapters from paths', () => {
    render(<UserPrefsProvider initialLocale="de"><ExplorePage /></UserPrefsProvider>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Produktmomente/)
    expect(screen.getByText(/Öffentliche Demos · kein Login/i)).toBeInTheDocument()
    for (const chapter of EXPLORE_CHAPTERS) {
      expect(screen.getByRole('link', { name: new RegExp(chapter.labelDe, 'i') })).toHaveAttribute(
        'href',
        paths.routes.exploreChapter(chapter.id),
      )
      expect(chapter.productRequiresAuth).toBe(chapter.id !== 'path')
    }
    expect(paths.landing.exploreChapters).toEqual(['editor', 'kit', 'tokens', 'screens', 'path'])
  })

  it('mounts deep editor extras on the explore chapter page', async () => {
    const user = userEvent.setup()
    render(<UserPrefsProvider initialLocale="de"><ExploreChapterPage chapterId="editor" /></UserPrefsProvider>)
    expect(screen.getByText(/Öffentliche Demo · kein Login/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /App · Editor \(Login\)/i })[0]).toHaveAttribute(
      'href',
      paths.routes.editor,
    )
    const editor = screen.getByRole('group', { name: /Interaktive Editor-Illustration/i })
    expect(editor).toHaveAttribute('data-density', 'deep')
    expect(within(editor).getByText(/Illustration · nicht der Live-Editor/i)).toBeInTheDocument()
    expect(within(editor).getByRole('tab', { name: 'Canvas' })).toBeInTheDocument()
    await user.click(within(editor).getByRole('button', { name: '125%' }))
    expect(editor).toHaveAttribute('data-zoom', '125')
    await user.click(within(editor).getByRole('button', { name: /Raster/i }))
    expect(editor).toHaveAttribute('data-grid', 'true')
    await user.click(within(editor).getByRole('button', { name: /^Pin$/i }))
    expect(editor).toHaveAttribute('data-pin', 'true')
  })

  it('mounts deep kit catalog and token extras', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<UserPrefsProvider initialLocale="de"><ExploreChapterPage chapterId="kit" /></UserPrefsProvider>)
    const kit = screen.getByRole('group', { name: /Interaktives Zaoly Kit/i })
    expect(kit).toHaveAttribute('data-density', 'deep')
    expect(within(kit).getAllByRole('button', { name: /^(Text|Link|Button|Badge)$/ }).length).toBeGreaterThanOrEqual(4)
    await user.click(within(kit).getByRole('tab', { name: /Formulare|Forms/i }))
    expect(kit).toHaveAttribute('data-step', 'form')
    await user.click(within(kit).getByRole('button', { name: 'Textarea' }))
    expect(kit).toHaveAttribute('data-atom', 'Textarea')
    expect(within(kit).getByLabelText(/TSX-Snippet/i)).toHaveTextContent(/import \{ Textarea \} from '@zaoly\/site-kit'/)
    expect(kit.querySelector('.zl-kit-board__body--playground')).toBeTruthy()
    await user.click(within(kit).getByRole('tab', { name: /^Seite$/i }))
    expect(kit.querySelector('.zl-kit-board__body--playground')).toBeFalsy()
    expect(kit).toHaveAttribute('data-step', 'page')
    expect(within(kit).getByText(/vollständige Seiten|Full pages/i)).toBeInTheDocument()
    await user.click(within(kit).getByRole('button', { name: 'Stack' }))
    expect(kit).toHaveAttribute('data-atom', 'Stack')
    expect(kit).toHaveAttribute('data-step', 'page')
    await user.click(within(kit).getByRole('button', { name: 'Button' }))
    expect(kit).toHaveAttribute('data-atom', 'Button')
    expect(kit).toHaveAttribute('data-step', 'page')

    rerender(<UserPrefsProvider initialLocale="de"><ExploreChapterPage chapterId="tokens" /></UserPrefsProvider>)
    const tokens = screen.getByRole('group', { name: /Interaktives Token Studio/i })
    await user.click(within(tokens).getByRole('button', { name: /Teal/i }))
    expect(tokens).toHaveAttribute('data-swatch', 'teal')
    await user.click(within(tokens).getByRole('button', { name: /Pfad kopieren/i }))
    expect(within(tokens).getByText(/Kopiert:/i)).toBeInTheDocument()
  })

  it('mounts deep screens and path extras', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<UserPrefsProvider initialLocale="de"><ExploreChapterPage chapterId="screens" /></UserPrefsProvider>)
    const breaks = screen.getByRole('group', { name: /Interaktive Breakpoint-Illustration/i })
    await user.click(screen.getByRole('button', { name: /^Tablet$/ }))
    expect(document.querySelector('.zl-experience__screens')).toHaveAttribute('data-break', 'tablet')
    await user.click(within(breaks).getByRole('button', { name: /Vergleichen/i }))
    expect(breaks).toHaveAttribute('data-compare', 'true')

    rerender(<UserPrefsProvider initialLocale="de"><ExploreChapterPage chapterId="path" /></UserPrefsProvider>)
    const pathStage = screen.getByRole('group', { name: /Interaktiver Workflow/i })
    expect(pathStage).toHaveAttribute('data-density', 'deep')
    await user.click(within(pathStage).getByRole('button', { name: /Eine Idee/i }))
    expect(pathStage).toHaveAttribute('data-detail', 'card')
    await user.click(within(pathStage).getByRole('button', { name: /Auto abspielen/i }))
    expect(pathStage).toHaveAttribute('data-autoplay', 'true')
  })
})

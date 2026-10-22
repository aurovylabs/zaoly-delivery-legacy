import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ClientShareTrailChrome } from '../components/client-page-share/client-share-trail-chrome'

describe('ClientShareTrailChrome', () => {
  it('renders zaoly Button/Text chrome for pages, zoom, comment, export', () => {
    const onPageChange = vi.fn()
    const onZoomIn = vi.fn()
    const onToggleComment = vi.fn()
    const onExportPng = vi.fn()

    render(
      <ClientShareTrailChrome
        title="AI-Newsletter"
        draft
        pages={[
          { id: 'p1', name: 'Page 1' },
          { id: 'p2', name: 'Page 2' },
        ]}
        pageId="p2"
        onPageChange={onPageChange}
        zoomPct={84}
        pinMode={false}
        exportBusy={false}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
        onZoomIn={onZoomIn}
        onFit={vi.fn()}
        onToggleComment={onToggleComment}
        onExportPng={onExportPng}
        onExportPdf={vi.fn()}
      />,
    )

    const chrome = screen.getByTestId('client-share-trail-chrome')
    expect(chrome).toHaveClass('creation-editor-topbar-chrome')
    expect(chrome.querySelectorAll('.ds-btn').length).toBeGreaterThan(5)
    expect(screen.getByTestId('client-share-draft-badge')).toHaveTextContent('Draft')
    expect(screen.getByTestId('client-share-zoom-label')).toHaveTextContent('84%')

    fireEvent.click(screen.getByTestId('client-share-page-p1'))
    expect(onPageChange).toHaveBeenCalledWith('p1')

    fireEvent.click(screen.getByTestId('client-share-zoom-in'))
    expect(onZoomIn).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('client-share-comment-toggle'))
    expect(onToggleComment).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('client-share-export-png'))
    expect(onExportPng).toHaveBeenCalled()
  })
})

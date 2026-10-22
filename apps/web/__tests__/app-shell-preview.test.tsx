import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { AppShell } from '../components/app-shell'

vi.mock('next/navigation', () => ({
  usePathname: () => '/share/p/crs_test',
}))

describe('app shell preview (client share)', () => {
  it('keeps AppFrame + BrandCorner logo without primary nav or assistant', () => {
    render(
      <AppProviders>
        <AppShell preview>
          <div data-testid="share-child">preview</div>
        </AppShell>
      </AppProviders>,
    )

    expect(screen.getByTestId('share-child')).toBeInTheDocument()
    expect(screen.getByTestId('brand-corner-preview')).toBeInTheDocument()
    expect(screen.getByTestId('shell-corners')).toBeInTheDocument()
    expect(screen.getByTestId('creation-preview-chrome-label')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary' })).toBeNull()
    expect(document.querySelector('.platform-assistant-fab')).toBeNull()
    expect(document.querySelector('.platform-assistant-embed-frame')).toBeNull()
    expect(document.querySelector('.creation-app-frame--preview')).toBeTruthy()
    expect(document.querySelector('.creation-app-frame--editor')).toBeTruthy()
  })
})

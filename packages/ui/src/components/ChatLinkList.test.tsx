import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatLinkList } from './ChatLinkList'

describe('ChatLinkList', () => {
  it('renders link labels and hrefs', () => {
    render(
      <ChatLinkList
        links={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Zaoly', href: 'https://zaoly.app', external: true },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/projects/demo')
    expect(screen.getByRole('link', { name: 'Zaoly' })).toHaveAttribute('href', 'https://zaoly.app')
  })
})

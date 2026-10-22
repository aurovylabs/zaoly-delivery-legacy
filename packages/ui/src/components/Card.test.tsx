import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'
import { CardActions } from './CardActions'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card</Card>)
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('applies clip-path from clipInset', () => {
    const { container } = render(
      <Card clipInset={{ bottomLeft: { y: '12%' } }}>Slant</Card>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.clipPath).toBe('polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 12%))')
  })

  it('renders media browse slots with a single primary link', () => {
    render(
      <Card
        href="/media/1"
        media={<img alt="preview" src="/p.png" />}
        title="clip.mp4"
        meta={<span>ready</span>}
        actions={
          <CardActions>
            <button type="button">Open</button>
          </CardActions>
        }
      />,
    )
    const link = screen.getByRole('link', { name: /clip\.mp4/i })
    expect(link).toHaveAttribute('href', '/media/1')
    expect(screen.getByAltText('preview')).toBeInTheDocument()
    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'
import { CardActions } from './CardActions'

describe('CardActions', () => {
  it('renders equal-width action row with hairline by default', () => {
    const { container } = render(
      <CardActions>
        <Button variant="ghost">Open</Button>
        <Button variant="ghost">Edit</Button>
        <Button variant="ghost">Delete</Button>
      </CardActions>,
    )
    const row = container.querySelector('.ds-card-actions')
    expect(row).toBeTruthy()
    expect(row).toHaveClass('ds-card-actions--hairline')
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('omits hairline when hairline={false}', () => {
    const { container } = render(
      <CardActions hairline={false}>
        <Button variant="ghost">Open</Button>
      </CardActions>,
    )
    expect(container.querySelector('.ds-card-actions')).not.toHaveClass('ds-card-actions--hairline')
  })

  it('exposes ds-card-actions class for bottom-pinned flex footers', () => {
    const { container } = render(
      <CardActions>
        <Button variant="ghost">Open</Button>
      </CardActions>,
    )
    expect(container.querySelector('.ds-card-actions')).toBeTruthy()
  })
})

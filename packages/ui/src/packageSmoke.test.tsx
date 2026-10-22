import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, Field, Input, RankedList, RankedRow, typeSteps } from './index'

describe('@zaoly/ui package smoke', () => {
  it('renders central primitives from the package entry', () => {
    render(
      <div>
        <Button>Open</Button>
        <Field label="Query">
          <Input defaultValue="alpha" />
        </Field>
        <RankedList>
          <RankedRow index={1} label="Signals" value="9" />
        </RankedList>
      </div>,
    )

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByLabelText('Query')).toHaveValue('alpha')
    expect(screen.getByText('Signals')).toBeInTheDocument()
    expect(typeSteps.display).toContain('clamp(')
  })
})

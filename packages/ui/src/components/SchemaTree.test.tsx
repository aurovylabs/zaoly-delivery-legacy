import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SchemaTree, type SchemaTreeNode } from './SchemaTree'

const scanSchema: SchemaTreeNode = {
  id: "$('n-scan').json",
  key: "$('n-scan').json",
  path: "$('n-scan').json",
  type: 'object',
  schema: true,
  children: [
    {
      id: "$('n-scan').json.overallScore",
      key: 'overallScore',
      path: "$('n-scan').json.overallScore",
      type: 'number',
      schema: true,
    },
    {
      id: "$('n-scan').json.issues",
      key: 'issues',
      path: "$('n-scan').json.issues",
      type: 'object',
      schema: true,
      children: [
        {
          id: "$('n-scan').json.issues.items",
          key: 'items',
          path: "$('n-scan').json.issues.items",
          type: 'array',
          schema: true,
          children: [
            {
              id: "$('n-scan').json.issues.items[item]",
              key: '[item]',
              path: "$('n-scan').json.issues.items[0]",
              type: 'object',
              schema: true,
              children: [
                {
                  id: "$('n-scan').json.issues.items[0].ruleId",
                  key: 'ruleId',
                  path: "$('n-scan').json.issues.items[0].ruleId",
                  type: 'string',
                  schema: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('SchemaTree', () => {
  it('renders nested keys and type badges', () => {
    render(<SchemaTree root={scanSchema} />)
    expect(screen.getByText('overallScore')).toBeInTheDocument()
    expect(screen.getByText('issues')).toBeInTheDocument()
    expect(screen.getAllByText('number').length).toBeGreaterThan(0)
  })

  it('starts path drag with custom mime type', () => {
    render(<SchemaTree root={scanSchema} />)
    const row = screen.getAllByText('overallScore')[0]!.closest('[draggable="true"]')
    expect(row).toBeTruthy()
    const dt = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(row!, { dataTransfer: dt })
    expect(dt.setData).toHaveBeenCalledWith(
      'application/x-zaoly-expression-path',
      "$('n-scan').json.overallScore"
    )
  })

  it('calls onSelectPath for leaf nodes', () => {
    const onSelectPath = vi.fn()
    render(<SchemaTree root={scanSchema} onSelectPath={onSelectPath} />)
    fireEvent.click(screen.getByRole('button', { name: /overallScore/i }))
    expect(onSelectPath).toHaveBeenCalledWith("$('n-scan').json.overallScore")
  })

  it('shows empty label', () => {
    render(<SchemaTree root={[]} emptyLabel="leer" />)
    expect(screen.getByText('leer')).toBeInTheDocument()
  })
})

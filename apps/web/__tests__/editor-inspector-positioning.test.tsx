import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { resolveNodePaintStyle } from '../lib/inspect/resolve-bindings'
import { partitionInspectPositionFields } from '../lib/inspect/position-groups'
import { InspectPositionGroup } from '../components/inspect-position-group'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

describe('Positioning, Coordinates & Aspect Ratio (Phase 1)', () => {
  it('resolves CSS style for position, offsets, zIndex, and aspectRatio', () => {
    const props = {
      position: 'absolute',
      top: 16,
      right: '24px',
      bottom: 0,
      left: '10%',
      zIndex: 99,
      aspectRatio: '16 / 9',
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: '250px',
    }

    const style = resolveNodePaintStyle(props)

    expect(style.position).toBe('absolute')
    expect(style.top).toBe(16)
    expect(style.right).toBe('24px')
    expect(style.bottom).toBe(0)
    expect(style.left).toBe('10%')
    expect(style.zIndex).toBe(99)
    expect(style.aspectRatio).toBe('16 / 9')
    expect(style.flexGrow).toBe(1)
    expect(style.flexShrink).toBe(0)
    expect(style.flexBasis).toBe('250px')
  })

  it('correctly partitions positioning fields', () => {
    const fields = [
      { name: 'width', label: 'Width', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'position', label: 'Position', kind: 'enum', section: 'constraints', appliesTo: ['*'] },
      { name: 'top', label: 'Top', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'right', label: 'Right', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'bottom', label: 'Bottom', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'left', label: 'Left', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'zIndex', label: 'Z-index', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'aspectRatio', label: 'Aspect ratio', kind: 'enum', section: 'constraints', appliesTo: ['*'] },
      { name: 'height', label: 'Height', kind: 'string', section: 'constraints', appliesTo: ['*'] },
    ] as InspectFieldDef[]

    const partitioned = partitionInspectPositionFields(fields)

    expect(partitioned.positionField?.name).toBe('position')
    expect(partitioned.aspectRatioField?.name).toBe('aspectRatio')
    expect(partitioned.zIndexField?.name).toBe('zIndex')
    expect(partitioned.coordinateFields).toHaveLength(4)
    expect(partitioned.rest.map((f) => f.name)).toEqual(['width', 'height'])
  })

  it('hides coordinates when position is static', () => {
    const positionField = {
      name: 'position',
      label: 'Position',
      kind: 'enum',
      section: 'constraints',
      appliesTo: ['*'],
    } as InspectFieldDef
    const topField = {
      name: 'top',
      label: 'Top',
      kind: 'string',
      section: 'constraints',
      appliesTo: ['*'],
    } as InspectFieldDef

    render(
      <InspectPositionGroup
        positionField={positionField}
        aspectRatioField={null}
        zIndexField={null}
        coordinateFields={[topField]}
        currentPosition="static"
        renderField={(f) => <span key={f.name}>{f.label}</span>}
        groupLabel="Position & Ratio"
      />,
    )

    expect(screen.getByTestId('inspect-position-group')).toBeInTheDocument()
    expect(screen.queryByTestId('inspect-position-coords')).toBeNull()
  })

  it('reveals coordinates and Z-Index when position is absolute or relative', () => {
    const positionField = {
      name: 'position',
      label: 'Position',
      kind: 'enum',
      section: 'constraints',
      appliesTo: ['*'],
    } as InspectFieldDef
    const topField = {
      name: 'top',
      label: 'Top',
      kind: 'string',
      section: 'constraints',
      appliesTo: ['*'],
    } as InspectFieldDef
    const zIndexField = {
      name: 'zIndex',
      label: 'Z-index',
      kind: 'string',
      section: 'constraints',
      appliesTo: ['*'],
    } as InspectFieldDef

    render(
      <InspectPositionGroup
        positionField={positionField}
        aspectRatioField={null}
        zIndexField={zIndexField}
        coordinateFields={[topField]}
        currentPosition="absolute"
        renderField={(f) => <div key={f.name}>{f.label} Field</div>}
        groupLabel="Position & Ratio"
      />,
    )

    expect(screen.getByTestId('inspect-position-coords')).toBeInTheDocument()
    expect(screen.getByText('Top Field')).toBeInTheDocument()
    expect(screen.getByText('Z-index Field')).toBeInTheDocument()
  })
})

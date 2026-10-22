// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CanvasFloatingHud } from '../components/canvas-floating-hud'
import { InspectAlignBar } from '../components/inspect-align-bar'
import type { SceneNode } from '@zaoly/contracts'
import { TokenCatalogProvider } from '../lib/inspect/token-catalog-context'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'

vi.mock('../lib/inspect/icons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/inspect/icons')>()
  return {
    ...actual,
    paletteTypeIcon: () => <span data-testid="mock-icon" />,
  }
})

afterEach(() => {
  cleanup()
})

describe('CanvasFloatingHud (Part A)', () => {
  it('does not render Fit / 100% zoom controls on the strip', () => {
    render(
      <CanvasFloatingHud
        smartHudEnabled={false}
        selectedNode={null}
        isMasterInstance={false}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
      />,
    )
    expect(screen.queryByTitle(/Zoom to Fit/)).toBeNull()
    expect(screen.queryByTitle(/Zoom 100%/)).toBeNull()
    expect(screen.queryByText('Fit')).toBeNull()
    expect(screen.queryByText('100%')).toBeNull()
  })

  it('resolves Smart HUD flag from runtime when prop is omitted (no TDZ)', () => {
    expect(() =>
      render(
        <CanvasFloatingHud
          selectedNode={null}
          isMasterInstance={false}
          onAddPrimitive={vi.fn()}
          onWrapStack={vi.fn()}
          onWrapGrid={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onMoveLayer={vi.fn()}
        />,
      ),
    ).not.toThrow()
  })

  const dummyNode: SceneNode = {
    id: 'test-node-1',
    type: 'Stack',
    name: 'Hero Section',
    props: {},
  }

  const legacyProps = {
    smartHudEnabled: false as const,
  }

  it('renders quick primitive buttons and triggers creation callbacks', () => {
    const onAdd = vi.fn()
    render(
      <CanvasFloatingHud
        {...legacyProps}
        selectedNode={null}
        isMasterInstance={false}
        onAddPrimitive={onAdd}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
      />,
    )

    expect(screen.getByTestId('canvas-floating-hud')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Add Stack \/ Frame/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Add Text/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Add Button/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Add Image/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Add Grid/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Add Stack \/ Frame/ }))
    expect(onAdd).toHaveBeenCalledWith('Stack')

    fireEvent.click(screen.getByRole('button', { name: /Add Text/ }))
    expect(onAdd).toHaveBeenCalledWith('SiteText')

    fireEvent.click(screen.getByRole('button', { name: /Add Button/ }))
    expect(onAdd).toHaveBeenCalledWith('Button')

    fireEvent.click(screen.getByRole('button', { name: /Add Image/ }))
    expect(onAdd).toHaveBeenCalledWith('SiteImage')

    fireEvent.click(screen.getByRole('button', { name: /Add Grid/ }))
    expect(onAdd).toHaveBeenCalledWith('Grid')
  })

  it('renders contextual selection actions when node is selected', () => {
    const onWrapStack = vi.fn()
    const onWrapGrid = vi.fn()
    const onMoveLayer = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()
    const onDetach = vi.fn()

    render(
      <CanvasFloatingHud
        smartHudEnabled={false}
        selectedNode={dummyNode}
        isMasterInstance={true}
        onAddPrimitive={vi.fn()}
        onWrapStack={onWrapStack}
        onWrapGrid={onWrapGrid}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onMoveLayer={onMoveLayer}
        onDetachMaster={onDetach}
      />,
    )

    expect(screen.getByText('Hero Section')).toBeTruthy()
    expect(screen.getByText('INSTANCE')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Wrap in AutoLayout Stack/ }))
    expect(onWrapStack).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Wrap in Grid/ }))
    expect(onWrapGrid).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Bring Forward/ }))
    expect(onMoveLayer).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: /Send Backward/ }))
    expect(onMoveLayer).toHaveBeenCalledWith(-1)

    fireEvent.click(screen.getByRole('button', { name: /Duplicate/ }))
    expect(onDuplicate).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Detach Instance/ }))
    expect(onDetach).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Delete Layer/ }))
    expect(onDelete).toHaveBeenCalled()
  })

  it('renders Create Master button when node is not an instance and triggers callback', () => {
    const onCreateMaster = vi.fn()
    render(
      <CanvasFloatingHud
        smartHudEnabled={false}
        selectedNode={dummyNode}
        isMasterInstance={false}
        onCreateMaster={onCreateMaster}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
      />,
    )

    const createBtn = screen.getByRole('button', { name: /Create Master/ })
    expect(createBtn).toBeTruthy()
    expect(screen.queryByTitle(/Detach Instance/)).toBeNull()

    fireEvent.click(createBtn)
    expect(onCreateMaster).toHaveBeenCalled()
  })


  it('renders unwrap button when container is selected and triggers onUnwrap', () => {
    const onUnwrap = vi.fn()
    render(
      <CanvasFloatingHud
        smartHudEnabled={false}
        selectedNode={dummyNode}
        isMasterInstance={false}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onUnwrap={onUnwrap}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
      />,
    )

    const unwrapBtn = screen.getByRole('button', { name: /Unwrap \/ Ungroup/ })
    expect(unwrapBtn).toBeTruthy()
    fireEvent.click(unwrapBtn)
    expect(onUnwrap).toHaveBeenCalledTimes(1)
  })

  it('renders group button when multi-selection is active and triggers onGroupSelection', () => {
    const onGroup = vi.fn()
    render(
      <CanvasFloatingHud
        smartHudEnabled={false}
        selectedNode={null}
        selectedCount={3}
        isMasterInstance={false}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onGroupSelection={onGroup}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
      />,
    )

    const groupBtn = screen.getByRole('button', { name: /Group Selection/ })
    expect(groupBtn).toBeTruthy()
    fireEvent.click(groupBtn)
    expect(onGroup).toHaveBeenCalledTimes(1)
  })
})


describe('CanvasFloatingHud Smart HUD (W1)', () => {
  const root: SceneNode = { id: 'root', type: 'SiteStack', name: 'Root', props: {} }
  const text: SceneNode = {
    id: 't1',
    type: 'SiteText',
    name: 'Headline',
    props: { role: 'body', children: 'Hello' },
  }
  const table: SceneNode = {
    id: 'tbl1',
    type: 'SiteTable',
    name: 'Table',
    props: { density: 'default', borders: 'row' },
    children: [],
  }

  it('keeps insert visible on working root', () => {
    render(
      <CanvasFloatingHud
        smartHudEnabled
        selectedNode={root}
        selectedIds={[root.id]}
        selectedNodes={[root]}
        workingRootId={root.id}
        isMasterInstance={false}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
      />,
    )
    expect(screen.getByTestId('hud-insert-lane')).toBeTruthy()
    expect(screen.getByTestId('hud-smart-lane')).toBeTruthy()
    expect(screen.getByTestId('hud-structure-overflow')).toBeTruthy()
  })

  it('collapses insert for SiteText and shows Font · Size · Weight chips on the strip', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <CanvasFloatingHud
          smartHudEnabled
          selectedNode={text}
          selectedIds={[text.id]}
          selectedNodes={[text]}
          workingRootId={root.id}
          isMasterInstance={false}
          onAddPrimitive={vi.fn()}
          onWrapStack={vi.fn()}
          onWrapGrid={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onMoveLayer={vi.fn()}
          onHudOps={onOps}
        />
      </TokenCatalogProvider>,
    )
    expect(screen.queryByTestId('hud-insert-lane')).toBeNull()
    expect(screen.getByTestId('hud-smart-lane').getAttribute('data-family')).toBe('text')
    fireEvent.click(screen.getByTestId('hud-structure-overflow'))
    expect(screen.getByTestId('hud-overflow-insert')).toBeTruthy()
    expect(screen.getByTestId('hud-token-fontFamily')).toBeTruthy()
    expect(screen.getByTestId('hud-token-fontSize')).toBeTruthy()
    expect(screen.getByTestId('hud-token-fontWeight')).toBeTruthy()
    expect(screen.getByTestId('hud-token-color')).toBeTruthy()
    expect(screen.queryByTestId('hud-open-craft-dialog')).toBeNull()
    expect(screen.queryByTestId('hud-nudge-inc-fontSize')).toBeNull()
    expect(screen.queryByTestId('hud-literal-fontSize')).toBeNull()
    expect(screen.getByTestId('hud-token-fontSize').tagName).toBe('BUTTON')
    expect(screen.getByTestId('hud-slot-fontFamily').querySelector('.creation-canvas-floating-hud__token-icon-glyph')).toBeTruthy()
  })

  it('keeps HUD strip density ~+4px (buttons 32px, glyphs 1.25rem)', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(/\.creation-canvas-floating-hud__btn\s*\{[^}]*height:\s*32px/s)
    expect(css).toMatch(/\.creation-canvas-floating-hud__icon\s*\{[^}]*width:\s*17px/s)
    expect(css).toMatch(
      /\.creation-canvas-floating-hud__token-icon-glyph\s*\{[^}]*width:\s*1\.25rem/s,
    )
  })

  it('fires table_add_row / table_add_column structureOps from the HUD strip', () => {
    const onOps = vi.fn()
    render(
      <CanvasFloatingHud
        smartHudEnabled
        selectedNode={table}
        selectedIds={[table.id]}
        selectedNodes={[table]}
        workingRootId={root.id}
        isMasterInstance={false}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
        onHudOps={onOps}
      />,
    )
    expect(screen.getByTestId('hud-smart-lane').getAttribute('data-family')).toBe('table')
    expect(
      screen.getByTestId('hud-slot-table_add_row').querySelector('.creation-canvas-floating-hud__token-icon-glyph svg'),
    ).toBeTruthy()
    expect(
      screen
        .getByTestId('hud-slot-table_add_column')
        .querySelector('.creation-canvas-floating-hud__token-icon-glyph svg'),
    ).toBeTruthy()
    fireEvent.click(screen.getByTestId('hud-slot-table_add_row'))
    expect(onOps).toHaveBeenCalledWith([{ op: 'table_add_row', nodeId: table.id }])
    fireEvent.click(screen.getByTestId('hud-slot-table_add_column'))
    expect(onOps).toHaveBeenCalledWith([{ op: 'table_add_column', nodeId: table.id }])
  })

  it('fires Asset Library hostAction for SiteImage', () => {
    const image: SceneNode = {
      id: 'img1',
      type: 'SiteImage',
      name: 'Hero',
      props: { src: 'https://example.com/a.png', alt: 'Hero' },
    }
    const onHost = vi.fn()
    render(
      <CanvasFloatingHud
        smartHudEnabled
        selectedNode={image}
        selectedIds={[image.id]}
        selectedNodes={[image]}
        workingRootId={root.id}
        isMasterInstance={false}
        onAddPrimitive={vi.fn()}
        onWrapStack={vi.fn()}
        onWrapGrid={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onMoveLayer={vi.fn()}
        onHudHostAction={onHost}
      />,
    )
    expect(screen.getByTestId('hud-smart-lane').getAttribute('data-family')).toBe('media')
    fireEvent.click(screen.getByTestId('hud-slot-openAssetLibrary'))
    expect(onHost).toHaveBeenCalledWith('openAssetLibrary')
  })

  it('multi-select collapses insert, shows intersection Smart + overflow Insert', () => {
    const stackA: SceneNode = { id: 's1', type: 'SiteStack', name: 'A', props: { direction: 'row' } }
    const stackB: SceneNode = { id: 's2', type: 'SiteStack', name: 'B', props: { direction: 'column' } }
    const onAdd = vi.fn()
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <CanvasFloatingHud
          smartHudEnabled
          selectedNode={stackB}
          selectedIds={[stackA.id, stackB.id]}
          selectedNodes={[stackA, stackB]}
          selectedCount={2}
          workingRootId={root.id}
          isMasterInstance={false}
          onAddPrimitive={onAdd}
          onWrapStack={vi.fn()}
          onWrapGrid={vi.fn()}
          onGroupSelection={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onMoveLayer={vi.fn()}
          onHudOps={onOps}
        />
      </TokenCatalogProvider>,
    )
    expect(screen.queryByTestId('hud-insert-lane')).toBeNull()
    expect(screen.getByTestId('hud-smart-lane').getAttribute('data-multi')).toBe('true')
    expect(screen.getByTestId('hud-family-label').textContent).toBe('layoutStack')
    expect(screen.getByRole('button', { name: /Group Selection/ })).toBeTruthy()

    const overflow = screen.getByTestId('hud-structure-overflow')
    fireEvent.click(overflow)
    expect(screen.getByTestId('hud-overflow-insert')).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Text' }))
    expect(onAdd).toHaveBeenCalledWith('SiteText')

    // Flex axes live in Inspect; HUD keeps spacing/size craft (gap).
    expect(screen.queryByTestId('hud-slot-direction')).toBeNull()
    expect(screen.queryByTestId('hud-slot-justify')).toBeNull()
    expect(screen.getByTestId('hud-slot-gap')).toBeTruthy()
  })
})

describe('InspectAlignBar 9-Point Matrix (Part B)', () => {
  const dummyFields = [
    { name: 'justifyContent', label: 'Justify', kind: 'enum' as const, section: 'layout' as const, appliesTo: ['*'] },
    { name: 'alignItems', label: 'Align', kind: 'enum' as const, section: 'layout' as const, appliesTo: ['*'] },
  ]

  it('renders 3x3 interactive matrix dots and correctly maps column directions', () => {
    const onCommitAlign = vi.fn()

    render(
      <InspectAlignBar
        fields={dummyFields}
        direction="column"
        currentJc="flex-start"
        currentAi="flex-start"
        onCommitAlign={onCommitAlign}
      />,
    )

    expect(screen.getByTestId('inspect-align-matrix')).toBeTruthy()
    expect(screen.getByText('Top Left')).toBeTruthy()
    expect(screen.queryByTestId('control-justifyContent')).toBeNull()

    // Clicking Center Center (col=1, row=1)
    const centerBtn = screen.getByTitle('Center Center')
    fireEvent.click(centerBtn)
    expect(onCommitAlign).toHaveBeenCalledWith('center', 'center')

    // Clicking Bottom Right (col=2, row=2)
    const brBtn = screen.getByTitle('Bottom Right')
    fireEvent.click(brBtn)
    expect(onCommitAlign).toHaveBeenCalledWith('flex-end', 'flex-end')
  })

  it('renders correctly for row direction', () => {
    const onCommitAlign = vi.fn()

    render(
      <InspectAlignBar
        fields={dummyFields}
        direction="row"
        currentJc="flex-end"
        currentAi="center"
        onCommitAlign={onCommitAlign}
      />,
    )

    expect(screen.getByText('Center Right')).toBeTruthy()

    // Clicking Top Left (col=0, row=0) in row direction
    const tlBtn = screen.getByTitle('Top Left')
    fireEvent.click(tlBtn)
    expect(onCommitAlign).toHaveBeenCalledWith('flex-start', 'flex-start')
  })

  it('cycles Packed → Even → Around → Packed on distribute', () => {
    const onCommitAlign = vi.fn()

    const { rerender } = render(
      <InspectAlignBar
        fields={dummyFields}
        direction="row"
        currentJc="flex-start"
        currentAi="center"
        onCommitAlign={onCommitAlign}
      />,
    )

    fireEvent.click(screen.getByTestId('inspect-align-distribute'))
    expect(onCommitAlign).toHaveBeenCalledWith('space-between', 'center')

    rerender(
      <InspectAlignBar
        fields={dummyFields}
        direction="row"
        currentJc="space-between"
        currentAi="center"
        onCommitAlign={onCommitAlign}
      />,
    )
    expect(screen.getByTestId('inspect-align-distribute')).toHaveAttribute(
      'data-distribute-mode',
      'even',
    )
    fireEvent.click(screen.getByTestId('inspect-align-distribute'))
    expect(onCommitAlign).toHaveBeenCalledWith('space-around', 'center')

    rerender(
      <InspectAlignBar
        fields={dummyFields}
        direction="row"
        currentJc="space-around"
        currentAi="center"
        onCommitAlign={onCommitAlign}
      />,
    )
    expect(screen.getByTestId('inspect-align-distribute')).toHaveAttribute(
      'data-distribute-mode',
      'around',
    )
    fireEvent.click(screen.getByTestId('inspect-align-distribute'))
    expect(onCommitAlign).toHaveBeenCalledWith('flex-start', 'center')
  })

  it('toggles cross-axis Stretch', () => {
    const onCommitAlign = vi.fn()
    const { rerender } = render(
      <InspectAlignBar
        fields={dummyFields}
        direction="column"
        currentJc="flex-start"
        currentAi="flex-start"
        onCommitAlign={onCommitAlign}
      />,
    )
    fireEvent.click(screen.getByTestId('inspect-align-stretch'))
    expect(onCommitAlign).toHaveBeenCalledWith('flex-start', 'stretch')

    rerender(
      <InspectAlignBar
        fields={dummyFields}
        direction="column"
        currentJc="flex-start"
        currentAi="stretch"
        onCommitAlign={onCommitAlign}
      />,
    )
    expect(screen.getByTestId('inspect-align-stretch').className).toMatch(/--active/)
    fireEvent.click(screen.getByTestId('inspect-align-stretch'))
    expect(onCommitAlign).toHaveBeenCalledWith('flex-start', 'flex-start')
  })
})

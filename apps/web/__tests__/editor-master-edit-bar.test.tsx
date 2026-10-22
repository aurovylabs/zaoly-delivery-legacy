// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditorMasterEditBar } from '../components/editor-master-edit-bar'
import { readFileSync } from 'node:fs'
import path from 'node:path'

afterEach(() => {
  cleanup()
})

describe('EditorMasterEditBar', () => {
  it('shows Master name, active variant chip, and fires Back to scene', () => {
    const onExit = vi.fn()
    render(
      <EditorMasterEditBar
        masterName="Hero"
        variantName="Variant 2"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={onExit}
      />,
    )
    expect(screen.getByTestId('editor-master-edit-bar')).toBeInTheDocument()
    expect(screen.getByText('Hero')).toBeInTheDocument()
    expect(screen.getByTestId('editor-master-edit-active-variant')).toHaveTextContent(
      'Variant 2',
    )
    fireEvent.click(screen.getByTestId('editor-master-edit-back'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('exposes Variants | Breakpoints dimension SSOT and variant strip on Breakpoints', () => {
    const onBoardDimensionChange = vi.fn()
    const onSelectVariant = vi.fn()
    const { rerender } = render(
      <EditorMasterEditBar
        masterName="Hero"
        variantName="Default"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={vi.fn()}
        boardDimension="variants"
        onBoardDimensionChange={onBoardDimensionChange}
        dimensionVariantsLabel="Variants"
        dimensionBreakpointsLabel="Breakpoints"
        variants={[
          { id: 'v1', name: 'Default' },
          { id: 'v2', name: 'Compact' },
        ]}
        activeVariantId="v1"
        onSelectVariant={onSelectVariant}
      />,
    )
    expect(screen.getByTestId('editor-master-edit-board-dimension')).toBeInTheDocument()
    expect(screen.getByTestId('editor-master-edit-bar')).toHaveAttribute(
      'data-board-dimension',
      'variants',
    )
    expect(screen.queryByTestId('editor-master-edit-variant-strip')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Breakpoints' }))
    expect(onBoardDimensionChange).toHaveBeenCalledWith('breakpoints')

    rerender(
      <EditorMasterEditBar
        masterName="Hero"
        variantName="Default"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={vi.fn()}
        boardDimension="breakpoints"
        onBoardDimensionChange={onBoardDimensionChange}
        dimensionVariantsLabel="Variants"
        dimensionBreakpointsLabel="Breakpoints"
        variants={[
          { id: 'v1', name: 'Default' },
          { id: 'v2', name: 'Compact' },
        ]}
        activeVariantId="v1"
        onSelectVariant={onSelectVariant}
      />,
    )
    expect(screen.getByTestId('editor-master-edit-bar')).toHaveAttribute(
      'data-board-dimension',
      'breakpoints',
    )
    const chips = screen.getAllByTestId('editor-master-edit-variant-chip')
    expect(chips).toHaveLength(2)
    fireEvent.click(chips[1]!)
    expect(onSelectVariant).toHaveBeenCalledWith('v2')
  })

  it('renders a Layers-rail placement with its own back control', () => {
    const onExit = vi.fn()
    render(
      <EditorMasterEditBar
        masterName="Hero"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={onExit}
        placement="rail"
      />,
    )
    expect(screen.getByTestId('editor-master-edit-bar-rail')).toHaveAttribute(
      'data-placement',
      'rail',
    )
    fireEvent.click(screen.getByTestId('editor-master-edit-back-rail'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('shows dimension toggle on rail without variant strip', () => {
    const onBoardDimensionChange = vi.fn()
    render(
      <EditorMasterEditBar
        masterName="Hero"
        variantName="Default"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={vi.fn()}
        placement="rail"
        boardDimension="variants"
        onBoardDimensionChange={onBoardDimensionChange}
        dimensionVariantsLabel="Variants"
        dimensionBreakpointsLabel="Breakpoints"
        variants={[
          { id: 'v1', name: 'Default' },
          { id: 'v2', name: 'Compact' },
        ]}
        activeVariantId="v1"
        onSelectVariant={vi.fn()}
        breakpointsStructureTip="Structure on Desktop"
      />,
    )
    expect(screen.getByTestId('editor-master-edit-bar-rail')).toBeInTheDocument()
    expect(screen.getByTestId('editor-master-edit-board-dimension')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-master-edit-variant-strip')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Breakpoints' }))
    expect(onBoardDimensionChange).toHaveBeenCalledWith('breakpoints')
  })

  it('shows breakpoints structure tip when in Breakpoints dimension', () => {
    render(
      <EditorMasterEditBar
        masterName="Hero"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={vi.fn()}
        boardDimension="breakpoints"
        onBoardDimensionChange={vi.fn()}
        dimensionVariantsLabel="Variants"
        dimensionBreakpointsLabel="Breakpoints"
        breakpointsStructureTip="Structure edits on Desktop"
      />,
    )
    expect(screen.getByTestId('editor-master-edit-breakpoints-tip')).toHaveTextContent(
      'Structure edits on Desktop',
    )
  })

  it('wires canvas chrome + Layers rail exit and documents the specs', () => {
    const root = path.resolve(__dirname, '../../..')
    const chrome = readFileSync(
      path.join(root, 'apps/web/components/editor/editor-canvas-chrome.tsx'),
      'utf8',
    )
    const workspace = readFileSync(
      path.join(root, 'apps/web/components/editor-workspace.tsx'),
      'utf8',
    )
    const layers = readFileSync(
      path.join(root, 'apps/web/components/editor-layers.tsx'),
      'utf8',
    )
    const spec = readFileSync(
      path.join(root, 'specs/domain/composition-masters.md'),
      'utf8',
    )
    const dimSpec = readFileSync(
      path.join(root, 'specs/domain/master-edit-board-dimension.md'),
      'utf8',
    )
    const en = JSON.parse(
      readFileSync(path.join(root, 'apps/web/locales/en.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    const de = JSON.parse(
      readFileSync(path.join(root, 'apps/web/locales/de.json'), 'utf8'),
    ) as { editor: Record<string, string> }

    expect(chrome).toContain('EditorMasterEditBar')
    expect(chrome).toContain('masterEditExit')
    expect(chrome).toContain('onBoardDimensionChange')
    expect(workspace).toContain('masterEditExit=')
    expect(workspace).toContain('placement="rail"')
    expect(workspace).toContain('setMasterMatrixMode')
    expect(workspace).toContain("next === 'matrix'")
    expect(workspace).toContain('creation-editor-left--master-edit')
    expect(workspace).toContain('exitMasterEdit')
    expect(workspace).toContain('editingVariantIdRef={editingVariantIdRef}')
    expect(workspace).toContain('editingMasterId ? undefined : onBreakpointCompareToggle')
    expect(layers).toContain('layers-wrap--master-edit')
    expect(spec).toContain('Back to scene')
    expect(spec).toContain('Layers rail')
    expect(dimSpec).toContain('Variants')
    expect(dimSpec).toContain('Breakpoints')
    expect(dimSpec).toContain('Matrix')
    expect(dimSpec).toContain('setBreakpointCompareEnabled')
    expect(dimSpec).toContain('comparePrefsReady')
    expect(dimSpec).toContain('canvas and Layers rail')
    expect(en.editor.mastersExitEdit).toBe('Back to scene')
    expect(en.editor.masterBoardDimensionVariants).toBe('Variants')
    expect(en.editor.masterBoardDimensionMatrix).toBe('Matrix')
    expect(de.editor.mastersExitEdit).toBe('Zurück zur Szene')
    expect(de.editor.masterBoardDimensionVariants).toBe('Varianten')
    expect(de.editor.masterBoardDimensionMatrix).toBe('Matrix')

    const sceneState = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    expect(sceneState).toMatch(/editingMasterIdRef,\s*\n\s*editingVariantIdRef,/)
    expect(sceneState).toContain('setBreakpointCompareEnabled')
    expect(sceneState).toContain('masterMatrixMode')
    expect(sceneState).toContain('comparePrefsReady')
  })

  it('exposes Matrix dimension in the bar', () => {
    const onBoardDimensionChange = vi.fn()
    render(
      <EditorMasterEditBar
        masterName="Hero"
        editingLabel="Editing Master"
        exitLabel="Back to scene"
        onExit={vi.fn()}
        boardDimension="variants"
        onBoardDimensionChange={onBoardDimensionChange}
        dimensionVariantsLabel="Variants"
        dimensionBreakpointsLabel="Breakpoints"
        dimensionMatrixLabel="Matrix"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Matrix' }))
    expect(onBoardDimensionChange).toHaveBeenCalledWith('matrix')
  })
})

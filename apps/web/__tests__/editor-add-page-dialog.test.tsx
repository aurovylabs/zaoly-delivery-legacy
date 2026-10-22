import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EditorAddPageDialog } from '../components/editor-add-page-dialog'

const t = (key: string) => key

describe('EditorAddPageDialog', () => {
  it('creates a page from the mobile preset', () => {
    const onCreate = vi.fn()
    const onBreakpointSync = vi.fn()
    render(
      <EditorAddPageDialog
        open
        onClose={vi.fn()}
        t={t}
        onCreate={onCreate}
        onBreakpointSync={onBreakpointSync}
      />,
    )
    expect(screen.getByTestId('editor-add-page-dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('editor-add-page-name'), {
      target: { value: 'Mobile home' },
    })
    fireEvent.click(screen.getByTestId('editor-add-page-preset-mobile'))
    fireEvent.click(screen.getByTestId('editor-add-page-confirm'))
    expect(onCreate).toHaveBeenCalledWith({
      op: 'add_page',
      name: 'Mobile home',
      breakpoint: 'mobile',
      frameWidth: 390,
      frameHeight: 844,
    })
    expect(onBreakpointSync).toHaveBeenCalledWith('mobile')
  })

  it('creates a custom-size page without breakpoint', () => {
    const onCreate = vi.fn()
    const onBreakpointSync = vi.fn()
    render(
      <EditorAddPageDialog
        open
        onClose={vi.fn()}
        t={t}
        onCreate={onCreate}
        onBreakpointSync={onBreakpointSync}
      />,
    )
    fireEvent.click(screen.getByText('editor.pageCreateModeCustom'))
    fireEvent.change(screen.getByTestId('editor-add-page-width'), { target: { value: '1100' } })
    fireEvent.change(screen.getByTestId('editor-add-page-height'), { target: { value: '700' } })
    fireEvent.click(screen.getByTestId('editor-add-page-confirm'))
    expect(onCreate).toHaveBeenCalledWith({
      op: 'add_page',
      frameWidth: 1100,
      frameHeight: 700,
    })
    expect(onBreakpointSync).not.toHaveBeenCalled()
  })
})

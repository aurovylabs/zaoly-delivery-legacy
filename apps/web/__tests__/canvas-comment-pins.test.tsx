// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { CanvasCommentPins } from '../components/canvas-comment-pins'
import type { SceneComment } from '@zaoly/contracts'

afterEach(() => {
  cleanup()
})

describe('CanvasCommentPins (Item 3: Spatial Canvas Comments & Pin Annotations)', () => {
  const sampleComments: SceneComment[] = [
    {
      id: 'cmt-1',
      body: 'Review hero padding',
      author: 'Felix',
      createdAt: '2026-09-07T12:00:00Z',
      resolved: false,
      pinX: 120,
      pinY: 240,
      replies: [
        {
          id: 'rep-1',
          author: 'Alice',
          body: 'Increased to 32px as suggested',
          createdAt: '2026-09-07T12:10:00Z',
        },
      ],
    },
    {
      id: 'cmt-2',
      body: 'Check contrast ratio',
      author: 'Marcus',
      createdAt: '2026-09-07T12:15:00Z',
      resolved: true,
      pinX: 450,
      pinY: 300,
    },
  ]

  it('renders numbered pins at spatial canvas coordinates', () => {
    render(
      <CanvasCommentPins
        comments={sampleComments}
        zoom={1.0}
        pinMode={false}
        onTogglePinMode={vi.fn()}
        onAddComment={vi.fn()}
        onReplyComment={vi.fn()}
        onToggleResolve={vi.fn()}
        onDeleteComment={vi.fn()}
      />,
    )

    const pin1 = screen.getByTestId('canvas-comment-pin-cmt-1')
    const pin2 = screen.getByTestId('canvas-comment-pin-cmt-2')

    expect(pin1).toBeTruthy()
    expect(pin2).toBeTruthy()
    expect(pin1.style.left).toBe('120px')
    expect(pin1.style.top).toBe('240px')
    expect(pin2.style.left).toBe('450px')
    expect(pin2.style.top).toBe('300px')
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('opens interactive popover on pin click, displays thread and replies, and handles reply submission', () => {
    const onReply = vi.fn()
    const onResolve = vi.fn()

    render(
      <CanvasCommentPins
        comments={sampleComments}
        zoom={1.0}
        pinMode={false}
        onTogglePinMode={vi.fn()}
        onAddComment={vi.fn()}
        onReplyComment={onReply}
        onToggleResolve={onResolve}
        onDeleteComment={vi.fn()}
      />,
    )

    // Click pin 1
    fireEvent.click(screen.getByTestId('canvas-comment-pin-cmt-1'))

    // Popover is displayed
    const popover = screen.getByTestId('canvas-comment-popover-cmt-1')
    expect(popover).toBeTruthy()
    expect(screen.getByText('Felix')).toBeTruthy()
    expect(screen.getByText('Review hero padding')).toBeTruthy()
    expect(screen.getByText('Increased to 32px as suggested')).toBeTruthy()

    // Type and submit reply
    const replyInput = screen.getByPlaceholderText(/Reply to thread/i)
    fireEvent.change(replyInput, { target: { value: 'Looks great now!' } })
    const replyBtn = screen.getByRole('button', { name: 'Reply' })
    fireEvent.click(replyBtn)

    expect(onReply).toHaveBeenCalledWith('cmt-1', { body: 'Looks great now!' })

    // Click resolve button
    const resolveBtn = screen.getByTitle('Mark resolved')
    fireEvent.click(resolveBtn)
    expect(onResolve).toHaveBeenCalledWith('cmt-1', true)
  })

  it('triggers onDeleteComment when delete button is clicked', () => {
    const onDelete = vi.fn()

    render(
      <CanvasCommentPins
        comments={sampleComments}
        zoom={1.0}
        pinMode={false}
        onTogglePinMode={vi.fn()}
        onAddComment={vi.fn()}
        onReplyComment={vi.fn()}
        onToggleResolve={vi.fn()}
        onDeleteComment={onDelete}
      />,
    )

    fireEvent.click(screen.getByTestId('canvas-comment-pin-cmt-1'))
    const deleteBtn = screen.getByTitle('Delete thread')
    fireEvent.click(deleteBtn)

    expect(onDelete).toHaveBeenCalledWith('cmt-1')
  })

  it('handles pin placement mode: clicking canvas opens draft popover and submits onAddComment', () => {
    const onAdd = vi.fn()
    const onToggleMode = vi.fn()

    render(
      <CanvasCommentPins
        comments={sampleComments}
        zoom={1.0}
        pinMode={true}
        onTogglePinMode={onToggleMode}
        onAddComment={onAdd}
        onReplyComment={vi.fn()}
        onToggleResolve={vi.fn()}
        onDeleteComment={vi.fn()}
      />,
    )

    // Mode banner indicator is visible
    expect(screen.getByText(/Click canvas to place comment pin/)).toBeTruthy()

    // Click canvas layer at (200, 300)
    const layer = screen.getByTestId('canvas-comment-pins-layer')
    fireEvent.click(layer, { clientX: 200, clientY: 300 })

    // Draft popover appears
    const draftPopover = screen.getByTestId('canvas-comment-new-popover')
    expect(draftPopover).toBeTruthy()

    // Type comment body and submit
    const textarea = screen.getByPlaceholderText(/Write your feedback/i)
    fireEvent.change(textarea, { target: { value: 'Need more whitespace here' } })
    const postBtn = screen.getByRole('button', { name: 'Post Pin' })
    fireEvent.click(postBtn)

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Need more whitespace here',
      }),
    )
  })
})

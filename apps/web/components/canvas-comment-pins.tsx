'use client'

import React, { useState } from 'react'
import type { SceneComment } from '@zaoly/contracts'
import { IconCheck as Check, IconMessage as MessageSquare, IconTrash as Trash2, IconClose as X, IconCornerDownRight as CornerDownRight } from '../lib/zaoly-ui'

export interface CanvasCommentPinsProps {
  comments?: SceneComment[]
  zoom: number
  pinMode: boolean
  onTogglePinMode: () => void
  onAddComment: (comment: { pinX: number; pinY: number; body: string; author?: string }) => void
  onReplyComment: (commentId: string, reply: { body: string; author?: string }) => void
  onToggleResolve: (commentId: string, resolved: boolean) => void
  onDeleteComment: (commentId: string) => void
  showResolved?: boolean
}

export function CanvasCommentPins({
  comments = [],
  zoom: _zoom,
  pinMode,
  onTogglePinMode,
  onAddComment,
  onReplyComment,
  onToggleResolve,
  onDeleteComment,
  showResolved = true,
}: CanvasCommentPinsProps) {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState<string>('')
  const [newPinDraft, setNewPinDraft] = useState<{ x: number; y: number; body: string } | null>(null)

  const visibleComments = comments.filter((c) => {
    if (c.pinX === undefined || c.pinY === undefined) return false
    if (!showResolved && c.resolved) return false
    return true
  })

  const activeComment = comments.find((c) => c.id === activeCommentId)

  return (
    <div
      className="creation-canvas-comment-layer"
      data-testid="canvas-comment-pins-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: pinMode ? 'auto' : 'none',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (!pinMode) return
        const rect = e.currentTarget.getBoundingClientRect()
        // Layer lives inside the transformed artboard — use displayed scale, not zoom prop.
        const scaleX = rect.width / e.currentTarget.offsetWidth || 1
        const scaleY = rect.height / e.currentTarget.offsetHeight || 1
        const clickX = (e.clientX - rect.left) / scaleX
        const clickY = (e.clientY - rect.top) / scaleY
        setNewPinDraft({ x: Math.round(clickX), y: Math.round(clickY), body: '' })
        setActiveCommentId(null)
      }}
    >
      {/* 1. Pin Dropping Banner if in pinMode */}
      {pinMode ? (
        <div
          className="creation-canvas-comment-mode-indicator"
          style={{
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-surface-2, #1f1f23)',
            color: 'var(--color-fg, #ffffff)',
            border: '1px solid var(--color-brand-primary, #1f44ff)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            borderRadius: 8,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: 'auto',
            zIndex: 100,
          }}
        >
          <MessageSquare size={16} color="#1f44ff" />
          <span>Click canvas to place comment pin (Esc to cancel)</span>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-muted, #a1a1aa)',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onTogglePinMode()
              setNewPinDraft(null)
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* 2. New Pin Placement Draft Popover */}
      {newPinDraft ? (
        <div
          data-testid="canvas-comment-new-popover"
          style={{
            position: 'absolute',
            left: newPinDraft.x,
            top: newPinDraft.y,
            transform: 'translate(14px, -14px)',
            width: 260,
            background: 'var(--color-surface-2, #18181b)',
            border: '1px solid var(--color-line, #27272a)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            borderRadius: 8,
            padding: 12,
            pointerEvents: 'auto',
            zIndex: 60,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1f44ff' }}>New Canvas Comment</span>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
              onClick={() => setNewPinDraft(null)}
            >
              <X size={13} />
            </button>
          </div>
          <textarea
            autoFocus
            rows={3}
            placeholder="Write your feedback..."
            value={newPinDraft.body}
            onChange={(e) => setNewPinDraft({ ...newPinDraft, body: e.target.value })}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--color-surface-1, #09090b)',
              border: '1px solid var(--color-line, #27272a)',
              borderRadius: 6,
              color: 'var(--color-fg, #f4f4f5)',
              padding: 8,
              fontSize: 12,
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
            <button
              type="button"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid #3f3f46',
                color: '#d4d4d8',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => setNewPinDraft(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newPinDraft.body.trim()}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 12px',
                background: newPinDraft.body.trim() ? '#1f44ff' : '#52525b',
                border: 'none',
                color: '#fff',
                borderRadius: 4,
                cursor: newPinDraft.body.trim() ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (!newPinDraft.body.trim()) return
                onAddComment({
                  pinX: newPinDraft.x,
                  pinY: newPinDraft.y,
                  body: newPinDraft.body.trim(),
                })
                setNewPinDraft(null)
                if (pinMode) onTogglePinMode()
              }}
            >
              Post Pin
            </button>
          </div>
        </div>
      ) : null}

      {/* 3. Existing Canvas Comment Pins */}
      {visibleComments.map((comment, index) => {
        const isSelected = comment.id === activeCommentId
        // Board / artboard CSS px — parent CanvasViewport transform owns zoom/pan.
        const left = comment.pinX ?? 0
        const top = comment.pinY ?? 0

        return (
          <div
            key={comment.id}
            data-testid={`canvas-comment-pin-${comment.id}`}
            style={{
              position: 'absolute',
              left,
              top,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setActiveCommentId(isSelected ? null : comment.id)
              setNewPinDraft(null)
            }}
          >
            {/* Pin Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                minWidth: 26,
                height: 26,
                padding: '0 6px',
                borderRadius: 13,
                background: comment.resolved
                  ? 'var(--color-surface-2, #27272a)'
                  : isSelected
                  ? '#ffffff'
                  : '#1f44ff',
                color: comment.resolved ? '#a1a1aa' : isSelected ? '#1f44ff' : '#ffffff',
                boxShadow: isSelected
                  ? '0 0 0 3px rgba(31,68,255,0.4), 0 4px 12px rgba(0,0,0,0.5)'
                  : '0 4px 10px rgba(0,0,0,0.4)',
                fontSize: 11,
                fontWeight: 700,
                border: comment.resolved ? '1px solid #3f3f46' : '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
            >
              {comment.resolved ? <Check size={12} /> : <MessageSquare size={11} />}
              <span>{index + 1}</span>
            </div>

            {/* Active Thread Popover */}
            {isSelected && activeComment ? (
              <div
                data-testid={`canvas-comment-popover-${comment.id}`}
                style={{
                  position: 'absolute',
                  left: 32,
                  top: -12,
                  width: 290,
                  background: 'var(--color-surface-2, #18181b)',
                  border: '1px solid var(--color-line, #27272a)',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.7)',
                  borderRadius: 10,
                  padding: 14,
                  color: 'var(--color-fg, #fafafa)',
                  zIndex: 80,
                  cursor: 'default',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Popover Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        background: '#1f44ff',
                        color: '#fff',
                        borderRadius: 4,
                      }}
                    >
                      #{index + 1}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{activeComment.author}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      title={activeComment.resolved ? 'Reopen comment' : 'Mark resolved'}
                      style={{
                        background: activeComment.resolved ? '#10b981' : 'transparent',
                        border: '1px solid #3f3f46',
                        borderRadius: 4,
                        color: activeComment.resolved ? '#fff' : '#a1a1aa',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                      }}
                      onClick={() => onToggleResolve(activeComment.id, !activeComment.resolved)}
                    >
                      <Check size={11} />
                      <span>{activeComment.resolved ? 'Resolved' : 'Resolve'}</span>
                    </button>
                    <button
                      type="button"
                      title="Delete thread"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                      onClick={() => {
                        onDeleteComment(activeComment.id)
                        setActiveCommentId(null)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Close popover"
                      style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 2 }}
                      onClick={() => setActiveCommentId(null)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Comment Body */}
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--color-fg, #e4e4e7)',
                    background: 'var(--color-surface-1, #09090b)',
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 10,
                    border: '1px solid var(--color-line, #27272a)',
                  }}
                >
                  {activeComment.body}
                </div>

                {/* Replies Thread */}
                {activeComment.replies && activeComment.replies.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {activeComment.replies.map((rep) => (
                      <div
                        key={rep.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          paddingLeft: 8,
                          borderLeft: '2px solid #3f3f46',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CornerDownRight size={10} color="#71717a" />
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#a1a1aa' }}>{rep.author}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#d4d4d8', paddingLeft: 14 }}>{rep.body}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Reply Input */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    placeholder="Reply to thread..."
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyDraft.trim()) {
                        onReplyComment(activeComment.id, { body: replyDraft.trim() })
                        setReplyDraft('')
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--color-surface-1, #09090b)',
                      border: '1px solid var(--color-line, #27272a)',
                      borderRadius: 4,
                      color: '#f4f4f5',
                      padding: '4px 8px',
                      fontSize: 11,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    disabled={!replyDraft.trim()}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: replyDraft.trim() ? '#1f44ff' : '#3f3f46',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 10px',
                      cursor: replyDraft.trim() ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (!replyDraft.trim()) return
                      onReplyComment(activeComment.id, { body: replyDraft.trim() })
                      setReplyDraft('')
                    }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

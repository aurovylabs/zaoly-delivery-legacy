'use client'

/**
 * Spatial guest comment pins on the shared artboard (P7).
 * Pins are positioned in artboard CSS px; parent CanvasViewport transform handles zoom/pan.
 */
import { useState } from 'react'

export type ShareGuestPinComment = {
  id: string
  authorName: string
  body: string
  createdAt: string
  pinX?: number
  pinY?: number
  resolved?: boolean
  replies?: Array<{
    id: string
    author: string
    body: string
    createdAt: string
  }>
}

type Props = {
  comments: ShareGuestPinComment[]
  pinMode: boolean
  authorName: string
  onAuthorNameChange: (name: string) => void
  onPlace: (input: { pinX: number; pinY: number; body: string }) => void
  onExitPinMode: () => void
  /** Called when a pin is opened — share viewer can refresh comments. */
  onPinOpen?: (commentId: string) => void
}

/** Pin chrome (bubble / popover / draft / banner) — pan must not steal these. */
export function isClientSharePinChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      [
        '[data-testid^="client-share-pin-"]',
        '[data-testid="client-share-pin-draft"]',
        '[data-testid="client-share-pin-mode-banner"]',
      ].join(', '),
    ),
  )
}

export function ClientShareGuestPins({
  comments,
  pinMode,
  authorName,
  onAuthorNameChange,
  onPlace,
  onExitPinMode,
  onPinOpen,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number; body: string } | null>(null)

  const pinned = comments.filter(
    (c) => typeof c.pinX === 'number' && typeof c.pinY === 'number',
  )

  const openPin = (id: string) => {
    setActiveId((prev) => {
      const next = prev === id ? null : id
      if (next) onPinOpen?.(next)
      return next
    })
    setDraft(null)
  }

  return (
    <div
      data-testid="client-share-guest-pins"
      style={{
        position: 'absolute',
        inset: 0,
        // Layer itself is pass-through for pan; pin chrome opts back in with pointer-events:auto.
        pointerEvents: pinMode || Boolean(draft) ? 'auto' : 'none',
        zIndex: 5,
      }}
      onClick={(e) => {
        if (!pinMode) return
        if (isClientSharePinChromeTarget(e.target)) return
        const rect = e.currentTarget.getBoundingClientRect()
        // Layer is inside transformed artboard → client delta / current CSS scale of layer.
        // getBoundingClientRect already includes zoom; divide by displayed size ratio.
        const scaleX = rect.width / e.currentTarget.offsetWidth || 1
        const scaleY = rect.height / e.currentTarget.offsetHeight || 1
        const x = Math.round((e.clientX - rect.left) / scaleX)
        const y = Math.round((e.clientY - rect.top) / scaleY)
        setDraft({ x, y, body: '' })
        setActiveId(null)
      }}
    >
      {pinMode ? (
        <div
          data-testid="client-share-pin-mode-banner"
          style={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            borderRadius: 8,
            background: '#18181b',
            border: '1px solid #1f44ff',
            color: '#f4f4f5',
            fontSize: 12,
            pointerEvents: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <span>Click the page to place a comment</span>
          <button
            type="button"
            data-testid="client-share-pin-mode-exit"
            onClick={(e) => {
              e.stopPropagation()
              setDraft(null)
              onExitPinMode()
            }}
            style={ghostBtn}
          >
            Esc
          </button>
        </div>
      ) : null}

      {draft ? (
        <div
          data-testid="client-share-pin-draft"
          style={{
            position: 'absolute',
            left: draft.x,
            top: draft.y,
            transform: 'translate(12px, -12px)',
            width: 260,
            padding: 12,
            borderRadius: 8,
            background: '#18181b',
            border: '1px solid #27272a',
            boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
            pointerEvents: 'auto',
            zIndex: 20,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#a1a1aa' }}>Your name</span>
            <input
              value={authorName}
              onChange={(e) => onAuthorNameChange(e.target.value)}
              data-testid="client-share-pin-author"
              style={inputStyle}
              placeholder="Name"
            />
          </label>
          <textarea
            autoFocus
            rows={3}
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            data-testid="client-share-pin-body"
            placeholder="Feedback…"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
            <button type="button" style={ghostBtn} onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button
              type="button"
              data-testid="client-share-pin-submit"
              disabled={!draft.body.trim() || !authorName.trim()}
              style={{
                ...primaryBtn,
                opacity: draft.body.trim() && authorName.trim() ? 1 : 0.5,
              }}
              onClick={() => {
                if (!draft.body.trim() || !authorName.trim()) return
                onPlace({ pinX: draft.x, pinY: draft.y, body: draft.body.trim() })
                setDraft(null)
                onExitPinMode()
              }}
            >
              Post
            </button>
          </div>
        </div>
      ) : null}

      {pinned.map((c, index) => {
        const selected = c.id === activeId
        return (
          <div
            key={c.id}
            data-testid={`client-share-pin-${c.id}`}
            role="button"
            tabIndex={0}
            aria-expanded={selected}
            aria-label={`Comment ${index + 1} by ${c.authorName}`}
            style={{
              position: 'absolute',
              left: c.pinX,
              top: c.pinY,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: selected ? 15 : 6,
            }}
            onPointerDown={(e) => {
              // Stop pan capture on the viewport; open on pointerdown (click is unreliable after capture).
              e.stopPropagation()
              if (e.button !== 0) return
              openPin(c.id)
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPin(c.id)
              }
            }}
          >
            <div
              style={{
                minWidth: 26,
                height: 26,
                padding: '0 7px',
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: selected ? '#fff' : '#1f44ff',
                color: selected ? '#1f44ff' : '#fff',
                fontSize: 11,
                fontWeight: 700,
                boxShadow: selected
                  ? '0 0 0 3px rgba(31,68,255,0.35), 0 4px 12px rgba(0,0,0,0.45)'
                  : '0 4px 10px rgba(0,0,0,0.4)',
              }}
            >
              {index + 1}
            </div>
            {selected ? (
              <div
                data-testid={`client-share-pin-popover-${c.id}`}
                style={{
                  position: 'absolute',
                  left: 30,
                  top: -10,
                  width: 260,
                  padding: 12,
                  borderRadius: 8,
                  background: '#18181b',
                  border: '1px solid #27272a',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
                  color: '#f4f4f5',
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.authorName}</div>
                  {c.resolved ? (
                    <span
                      data-testid={`client-share-pin-resolved-${c.id}`}
                      style={{ fontSize: 10, color: '#a1a1aa' }}
                    >
                      Resolved
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.45, color: '#e4e4e7' }}>{c.body}</div>
                {c.replies && c.replies.length > 0 ? (
                  <div
                    data-testid={`client-share-pin-replies-${c.id}`}
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid #27272a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {c.replies.map((reply) => (
                      <div key={reply.id} data-testid={`client-share-pin-reply-${reply.id}`}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1f44ff' }}>
                          {reply.author}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.4, color: '#d4d4d8' }}>
                          {reply.body}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '7px 9px',
  borderRadius: 6,
  border: '1px solid #3f3f46',
  background: '#09090b',
  color: '#f4f4f5',
  fontSize: 12,
}

const primaryBtn: React.CSSProperties = {
  borderRadius: 6,
  border: 'none',
  background: '#1f44ff',
  color: '#fff',
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #3f3f46',
  color: '#d4d4d8',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 12,
  cursor: 'pointer',
}

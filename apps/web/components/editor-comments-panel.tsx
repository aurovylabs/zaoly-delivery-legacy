'use client'

import { useState } from 'react'
import { Button, Input, Text } from '@zaoly/ui'
import type { SceneComment } from '@zaoly/contracts'
import { useUserPrefs } from '../lib/user-prefs'

type Props = {
  open: boolean
  onClose: () => void
  selectedNodeId: string | null
  selectedNodeLabel: string | null
  comments: SceneComment[]
  onAdd: (body: string) => void
  onSetResolved: (commentId: string, resolved: boolean) => void
}

/**
 * P82b — Node-anchored comments panel.
 * Persistence = scene Save (CompositionScene.comments).
 */
export function EditorCommentsPanel({
  open,
  onClose,
  selectedNodeId,
  selectedNodeLabel,
  comments,
  onAdd,
  onSetResolved,
}: Props) {
  const { t } = useUserPrefs()
  const [draft, setDraft] = useState('')

  if (!open) return null

  const canAdd = Boolean(selectedNodeId) && draft.trim().length > 0

  return (
    <aside
      className="creation-editor-comments-stub creation-editor-comments-panel"
      role="complementary"
      aria-label={t('editor.commentsAria')}
      data-testid="editor-comments-panel"
    >
      <div className="creation-editor-comments-stub__head">
        <Text role="title" as="h2" className="creation-editor-comments-stub__title">
          {t('editor.commentsTitle')}
        </Text>
        <button
          type="button"
          className="creation-editor-comments-stub__close"
          onClick={onClose}
          aria-label={t('editor.commentsClose')}
          data-testid="editor-comments-close"
        >
          ×
        </button>
      </div>

      {selectedNodeId ? (
        <Text role="meta" as="p" className="creation-editor-comments-panel__anchor" data-testid="editor-comments-anchor">
          {t('editor.commentsOnNode').replace('{node}', selectedNodeLabel || selectedNodeId)}
        </Text>
      ) : (
        <Text role="meta" as="p" className="creation-editor-comments-stub__body">
          {t('editor.commentsSelectNode')}
        </Text>
      )}

      <ul className="creation-editor-comments-panel__list" data-testid="editor-comments-list">
        {comments.map((c) => (
          <li
            key={c.id}
            className={
              c.resolved
                ? 'creation-editor-comments-panel__item creation-editor-comments-panel__item--resolved'
                : 'creation-editor-comments-panel__item'
            }
            data-testid={`editor-comment-${c.id}`}
          >
            <Text role="meta" as="p" className="creation-editor-comments-panel__meta">
              {c.author} · {new Date(c.createdAt).toLocaleString()}
              {c.resolved ? ` · ${t('editor.commentsResolved')}` : ''}
            </Text>
            <Text role="body" as="p" className="creation-editor-comments-panel__body">
              {c.body}
            </Text>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onSetResolved(c.id, !c.resolved)}
              data-testid={`editor-comment-resolve-${c.id}`}
            >
              {c.resolved ? t('editor.commentsReopen') : t('editor.commentsResolve')}
            </Button>
          </li>
        ))}
      </ul>

      {comments.length === 0 && selectedNodeId ? (
        <Text role="meta" as="p" className="creation-editor-comments-stub__body">
          {t('editor.commentsEmpty')}
        </Text>
      ) : null}

      {selectedNodeId ? (
        <div className="creation-editor-comments-panel__compose">
          <Input
            block
            size="sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={t('editor.commentsDraft')}
            placeholder={t('editor.commentsDraft')}
            data-testid="editor-comments-draft"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canAdd) {
                event.preventDefault()
                onAdd(draft)
                setDraft('')
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={!canAdd}
            onClick={() => {
              onAdd(draft)
              setDraft('')
            }}
            data-testid="editor-comments-add"
          >
            {t('editor.commentsAdd')}
          </Button>
        </div>
      ) : null}

      <Text role="meta" as="p" className="creation-editor-comments-panel__hint">
        {t('editor.commentsPersistHint')}
      </Text>
    </aside>
  )
}

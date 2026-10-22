'use client'

import React, { useState } from 'react'

interface EditorSaveCheckpointDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description?: string) => Promise<void>
}

export function EditorSaveCheckpointDialog({
  isOpen,
  onClose,
  onSave,
}: EditorSaveCheckpointDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a checkpoint name')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave(name.trim(), description.trim() || undefined)
      setName('')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save checkpoint')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          width: '420px',
          padding: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          color: '#f4f4f5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Create Version Milestone</h3>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>⌘⇧S</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
              Milestone Name *
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Sprint 42 Final Review"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#09090b',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#f4f4f5',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Notes on what changed or what was approved..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#09090b',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#f4f4f5',
                fontSize: '12px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '12px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #3f3f46',
                color: '#a1a1aa',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                backgroundColor: '#1f44ff',
                border: 'none',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

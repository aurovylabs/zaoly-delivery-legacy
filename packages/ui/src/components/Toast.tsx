'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Button } from './Button'

export type ToastTone = 'info' | 'ok' | 'error'

export type ToastItem = {
  id: string
  message: string
  tone: ToastTone
  /** ms; errors default persistent (0 = until dismiss) */
  durationMs: number
}

export type ToastPushInput = {
  message: string
  tone?: ToastTone
  durationMs?: number
}

type ToastContextValue = {
  push: (input: ToastPushInput) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function defaultDuration(tone: ToastTone, override?: number): number {
  if (override != null) return override
  if (tone === 'error') return 0
  return 4000
}

/**
 * Toast provider — pre-mounts polite + assertive live regions (WCAG 4.1.3).
 * Spec: specs/domain/zaoly-ui-feedback-data.md
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const politeId = useId()
  const assertiveId = useId()

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (input: ToastPushInput) => {
      const tone = input.tone ?? 'info'
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const durationMs = defaultDuration(tone, input.durationMs)
      setItems((prev) => [...prev, { id, message: input.message, tone, durationMs }])
      return id
    },
    [],
  )

  useEffect(() => {
    const timers = items
      .filter((t) => t.durationMs > 0)
      .map((t) =>
        window.setTimeout(() => dismiss(t.id), t.durationMs),
      )
    return () => {
      for (const id of timers) window.clearTimeout(id)
    }
  }, [items, dismiss])

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])
  const polite = items.filter((t) => t.tone !== 'error')
  const assertive = items.filter((t) => t.tone === 'error')

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ds-toast-viewport" data-placement="bottom-end">
        <div
          id={politeId}
          className="ds-toast-live ds-toast-live--polite"
          role="status"
          aria-live="polite"
          aria-atomic="false"
        >
          {polite.map((t) => (
            <Toast key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
        <div
          id={assertiveId}
          className="ds-toast-live ds-toast-live--assertive"
          role="alert"
          aria-live="assertive"
          aria-atomic="false"
        >
          {assertive.map((t) => (
            <Toast key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export type ToastProps = {
  item: ToastItem
  onDismiss: (id: string) => void
}

/** Single toast chip — prefer push() via useToast. */
export function Toast({ item, onDismiss }: ToastProps) {
  return (
    <div className={cx('ds-toast', `ds-toast--${item.tone}`)}>
      <p className="ds-toast-message">{item.message}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ds-toast-dismiss"
        aria-label="Dismiss"
        onClick={() => onDismiss(item.id)}
      >
        ×
      </Button>
    </div>
  )
}

/**
 * Central error sink — W4 + optional Sentry (W9/W10 + v11 dataCollection).
 * Spec: specs/domain/observability-and-unbound-w4.md · specs/domain/observability-sentry-w9.md
 *       · specs/domain/observability-sentry-w10.md
 *       · specs/domain/observability-sentry-data-collection.md
 * Knowledge: knowledge/observability.md
 *
 * Vendor SDK lives here only — call sites stay on reportError.
 */
import { paths } from '../paths'

export type ErrorReportContext = {
  source: string
  digest?: string
  extra?: Record<string, unknown>
}

/** Privacy-restrictive Sentry v11 profile (opt out of v11’s collect-everything defaults). */
export const sentryRestrictiveDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  },
  httpBodies: [] as string[],
  urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
} as const

type SentryInitOptions = {
  dsn: string
  environment: string
  tunnel?: string
  integrations?: unknown[]
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
  dataCollection?: typeof sentryRestrictiveDataCollection
}

type SentryModule = {
  init: (options: SentryInitOptions) => void
  captureException: (
    exception: unknown,
    hint?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
  ) => void
  replayIntegration?: (options?: {
    maskAllText?: boolean
    maskAllInputs?: boolean
    blockAllMedia?: boolean
  }) => unknown
}

let sentryInitPromise: Promise<SentryModule | null> | null = null

function webhookUrl(): string | null {
  if (typeof window === 'undefined') {
    return process.env[paths.envErrorWebhookUrl]?.trim() || null
  }
  return (
    process.env[paths.envErrorWebhookUrlPublic]?.trim() ||
    process.env[paths.envErrorWebhookUrl]?.trim() ||
    null
  )
}

function sentryDsn(): string | null {
  if (typeof window === 'undefined') {
    return process.env[paths.envSentryDsn]?.trim() || null
  }
  return (
    process.env[paths.envSentryDsnPublic]?.trim() ||
    process.env[paths.envSentryDsn]?.trim() ||
    null
  )
}

function sentryReplayEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const raw = process.env[paths.envSentryReplay]?.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error
  return new Error(typeof error === 'string' ? error : 'unknown_error')
}

async function loadSentry(dsn: string): Promise<SentryModule | null> {
  try {
    const Sentry = (await import('@sentry/nextjs')) as SentryModule
    const init: SentryInitOptions = {
      dsn,
      environment: 'zaoly',
      dataCollection: sentryRestrictiveDataCollection,
    }
    if (typeof window !== 'undefined') {
      init.tunnel = paths.sentryTunnelPath
      if (sentryReplayEnabled() && typeof Sentry.replayIntegration === 'function') {
        init.integrations = [
          Sentry.replayIntegration({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
          }),
        ]
        init.replaysSessionSampleRate = 0
        init.replaysOnErrorSampleRate = 1
      }
    }
    Sentry.init(init)
    return Sentry
  } catch {
    return null
  }
}

function captureWithSentry(err: Error, context: ErrorReportContext): void {
  const dsn = sentryDsn()
  if (!dsn) return

  if (!sentryInitPromise) {
    sentryInitPromise = loadSentry(dsn)
  }

  void sentryInitPromise
    .then((Sentry) => {
      if (!Sentry) return
      Sentry.captureException(err, {
        tags: { source: context.source },
        extra: {
          ...(context.digest ? { digest: context.digest } : {}),
        },
      })
    })
    .catch(() => {
      /* never break callers */
    })
}

/** Test-only: reset lazy Sentry init between cases. */
export function resetReportErrorSentryStateForTests(): void {
  sentryInitPromise = null
}

/**
 * Log + optional webhook + optional Sentry. Never throws.
 */
export function reportError(error: unknown, context: ErrorReportContext): void {
  try {
    const err = toError(error)
    console.error('[zaoly:error]', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      source: context.source,
      digest: context.digest ?? null,
      ...(context.extra ? { extra: context.extra } : {}),
    })

    const url = webhookUrl()
    if (url) {
      const body = JSON.stringify({
        service: 'zaoly',
        message: err.message,
        name: err.name,
        source: context.source,
        digest: context.digest ?? null,
        at: new Date().toISOString(),
      })

      void fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* ignore webhook failures */
      })
    }

    captureWithSentry(err, context)
  } catch {
    /* never break callers */
  }
}

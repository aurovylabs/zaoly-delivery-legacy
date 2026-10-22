/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'

const init = vi.fn()
const captureException = vi.fn()
const replayIntegration = vi.fn(() => ({ name: 'Replay' }))

vi.mock('@sentry/nextjs', () => ({
  init,
  captureException,
  replayIntegration,
}))

describe('reportError (W4 + W9)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    init.mockClear()
    captureException.mockClear()
    replayIntegration.mockClear()
  })

  it('logs structured zaoly:error without throwing', async () => {
    const { reportError, resetReportErrorSentryStateForTests } = await import(
      '../lib/observability/report-error'
    )
    resetReportErrorSentryStateForTests()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    reportError(new Error('kaboom'), { source: 'unit-test', digest: 'd9' })
    expect(spy).toHaveBeenCalled()
    const payload = spy.mock.calls[0]?.[1] as { message: string; source: string; digest: string }
    expect(payload.message).toBe('kaboom')
    expect(payload.source).toBe('unit-test')
    expect(payload.digest).toBe('d9')
  })

  it('posts to webhook when ZAOLY_ERROR_WEBHOOK_URL is set', async () => {
    const { reportError, resetReportErrorSentryStateForTests } = await import(
      '../lib/observability/report-error'
    )
    resetReportErrorSentryStateForTests()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv(paths.envErrorWebhookUrl, 'https://hooks.example/creation')
    reportError(new Error('hooked'), { source: 'webhook-test' })
    expect(fetchMock).toHaveBeenCalled()
    const [url, initOpts] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://hooks.example/creation')
    expect((initOpts as RequestInit).method).toBe('POST')
    const body = JSON.parse(String((initOpts as RequestInit).body)) as {
      service: string
      message: string
    }
    expect(body.service).toBe('zaoly')
    expect(body.message).toBe('hooked')
  })

  it('does not capture to Sentry when DSN is unset (W9)', async () => {
    const { reportError, resetReportErrorSentryStateForTests } = await import(
      '../lib/observability/report-error'
    )
    resetReportErrorSentryStateForTests()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    reportError(new Error('no-sentry'), { source: 'sentry-unset' })
    await Promise.resolve()
    await Promise.resolve()
    expect(init).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('captures to Sentry when ZAOLY_SENTRY_DSN is set (W9)', async () => {
    const { reportError, resetReportErrorSentryStateForTests } = await import(
      '../lib/observability/report-error'
    )
    resetReportErrorSentryStateForTests()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv(paths.envSentryDsn, 'https://key@example.ingest.sentry.io/1')
    reportError(new Error('sentry-me'), {
      source: 'sentry-set',
      digest: 'dig-1',
      extra: { scene: { huge: true } },
    })
    await vi.waitFor(() => {
      expect(init).toHaveBeenCalled()
      expect(captureException).toHaveBeenCalled()
    })
    const { sentryRestrictiveDataCollection } = await import(
      '../lib/observability/report-error'
    )
    expect(init).toHaveBeenCalledWith({
      dsn: 'https://key@example.ingest.sentry.io/1',
      environment: 'zaoly',
      tunnel: paths.sentryTunnelPath,
      dataCollection: sentryRestrictiveDataCollection,
    })
    expect(sentryRestrictiveDataCollection.userInfo).toBe(false)
    expect(sentryRestrictiveDataCollection.cookies).toBe(false)
    expect(sentryRestrictiveDataCollection.httpBodies).toEqual([])
    expect(sentryRestrictiveDataCollection.databaseQueryData).toBe(false)
    const [err, hint] = captureException.mock.calls[0]!
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe('sentry-me')
    expect(hint).toEqual({
      tags: { source: 'sentry-set' },
      extra: { digest: 'dig-1' },
    })
    expect(JSON.stringify(hint)).not.toContain('huge')
  })

  it('enables error-only replay when NEXT_PUBLIC_ZAOLY_SENTRY_REPLAY is set (W10)', async () => {
    const { reportError, resetReportErrorSentryStateForTests } = await import(
      '../lib/observability/report-error'
    )
    resetReportErrorSentryStateForTests()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv(paths.envSentryDsnPublic, 'https://key@example.ingest.sentry.io/1')
    vi.stubEnv(paths.envSentryReplay, '1')
    // jsdom = browser
    reportError(new Error('replay-me'), { source: 'replay-test' })
    await vi.waitFor(() => {
      expect(init).toHaveBeenCalled()
    })
    const initArg = init.mock.calls[0]![0] as {
      tunnel?: string
      replaysOnErrorSampleRate?: number
      replaysSessionSampleRate?: number
      integrations?: unknown[]
    }
    expect(initArg.tunnel).toBe(paths.sentryTunnelPath)
    expect(initArg.replaysSessionSampleRate).toBe(0)
    expect(initArg.replaysOnErrorSampleRate).toBe(1)
    expect(initArg.integrations?.length).toBe(1)
  })
})

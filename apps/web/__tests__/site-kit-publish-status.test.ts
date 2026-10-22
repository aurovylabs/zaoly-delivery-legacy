import { describe, expect, it } from 'vitest'
import {
  formatSiteKitPublishStatusMessage,
  formatSiteKitSaveCompositionStatusMessage,
} from '../lib/site-kit/publish-status'

const t = (key: string, params?: Record<string, string>) =>
  `${key}:${JSON.stringify(params ?? {})}`

describe('site-kit publish status messages', () => {
  it('uses queued wording only when rebuild is queued', () => {
    const msg = formatSiteKitPublishStatusMessage(
      {
        published: 2,
        componentIds: ['SiteButton', 'SiteText'],
        storybookRedeploy: { status: 'queued', reason: 'publish:test' },
      },
      t,
    )
    expect(msg).toContain('siteKitPublishOkQueued')
  })

  it('reports rebuild failed distinctly from skipped', () => {
    const failed = formatSiteKitPublishStatusMessage(
      {
        published: 1,
        componentIds: ['SiteButton'],
        storybookRedeploy: { status: 'failed', reason: 'deploy-failed' },
      },
      t,
    )
    expect(failed).toContain('siteKitPublishRebuildFailed')

    const skipped = formatSiteKitPublishStatusMessage(
      {
        published: 1,
        componentIds: ['SiteButton'],
        storybookRedeploy: { status: 'skipped', reason: 'missing-coolify-credentials' },
      },
      t,
    )
    expect(skipped).toContain('siteKitPublishOkLiveOnly')
  })

  it('surfaces partial publish failures', () => {
    const msg = formatSiteKitPublishStatusMessage(
      {
        published: 1,
        componentIds: ['SiteButton'],
        failures: [{ componentId: 'SiteText', error: 'disk-unwritable' }],
        storybookRedeploy: { status: 'queued', reason: 'publish:test' },
      },
      t,
    )
    expect(msg).toContain('siteKitPublishPartial')
    expect(msg).toContain('siteKitPublishRebuildQueuedSuffix')
  })

  it('formats save composition rebuild states', () => {
    expect(
      formatSiteKitSaveCompositionStatusMessage(
        {
          exportName: 'Hero',
          wrote: ['a'],
          storybookRedeploy: { status: 'failed', reason: 'deploy-failed' },
        },
        t,
      ),
    ).toContain('siteKitSaveCompositionRebuildFailed')
  })
})

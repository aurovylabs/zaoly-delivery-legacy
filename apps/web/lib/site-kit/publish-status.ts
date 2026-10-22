import type { StorybookRedeployResult } from './storybook-redeploy'

export type SiteKitPublishFailure = { componentId: string; error: string }

type Translate = (key: string, params?: Record<string, string>) => string

export function formatSiteKitPublishStatusMessage(
  result: {
    published: number
    componentIds: string[]
    failures?: SiteKitPublishFailure[]
    storybookRedeploy?: StorybookRedeployResult
  },
  t: Translate,
): string {
  const ids = result.componentIds.join(', ')
  if (result.failures?.length) {
    const failed = result.failures.map((f) => f.componentId).join(', ')
    const partial = t('editor.siteKitPublishPartial', {
      published: String(result.published),
      ids,
      failed,
    })
    return appendRebuildClause(partial, result.storybookRedeploy, t)
  }

  const redeploy = result.storybookRedeploy?.status
  if (redeploy === 'queued') {
    return t('editor.siteKitPublishOkQueued', {
      count: String(result.published),
      ids,
    })
  }
  if (redeploy === 'failed') {
    return t('editor.siteKitPublishRebuildFailed', {
      count: String(result.published),
      ids,
    })
  }
  if (redeploy === 'skipped') {
    return t('editor.siteKitPublishOkLiveOnly', {
      count: String(result.published),
      ids,
    })
  }
  return t('editor.siteKitPublishOkSaved', {
    count: String(result.published),
    ids,
  })
}

export function formatSiteKitSaveCompositionStatusMessage(
  result: {
    exportName: string
    wrote: string[]
    warning?: string
    storybookRedeploy?: StorybookRedeployResult
  },
  t: Translate,
): string {
  if (result.warning) return result.warning
  const redeploy = result.storybookRedeploy?.status
  if (redeploy === 'queued') {
    return t('editor.siteKitSaveCompositionOkRebuild', { name: result.exportName })
  }
  if (redeploy === 'failed') {
    return t('editor.siteKitSaveCompositionRebuildFailed', { name: result.exportName })
  }
  if (redeploy === 'skipped') {
    return t('editor.siteKitSaveCompositionRebuildSkipped', { name: result.exportName })
  }
  return t('editor.siteKitSaveCompositionOk', {
    name: result.exportName,
    files: result.wrote.join(', '),
  })
}

function appendRebuildClause(
  base: string,
  redeploy: StorybookRedeployResult | undefined,
  t: Translate,
): string {
  if (redeploy?.status === 'queued') {
    return `${base} ${t('editor.siteKitPublishRebuildQueuedSuffix')}`
  }
  if (redeploy?.status === 'failed') {
    return `${base} ${t('editor.siteKitPublishRebuildFailedSuffix')}`
  }
  if (redeploy?.status === 'skipped') {
    return `${base} ${t('editor.siteKitPublishRebuildSkippedSuffix')}`
  }
  return base
}

/**
 * Batch publish Site Kit Masters → overrides + one Storybook rebuild.
 * Spec: site-kit.md §5b · knowledge/site-kit-storybook-coolify.md
 */
import {
  requestSiteKitStorybookRebuild,
  type StorybookRedeployResult,
} from './storybook-redeploy'
import { collectPublishableMasters } from './publish-collect'
import {
  writeSiteKitStory,
  type SiteKitWriteInput,
  type SiteKitWriteResult,
} from './write'

export { collectPublishableMasters } from './publish-collect'

export type SiteKitPublishResult =
  | {
      ok: true
      published: number
      componentIds: string[]
      wrote: string[]
      storybookRedeploy: StorybookRedeployResult
      failures?: { componentId: string; error: string }[]
    }
  | { ok: false; code: string; error: string }

export async function publishSiteKitItems(
  items: SiteKitWriteInput[],
): Promise<SiteKitPublishResult> {
  if (!items.length) {
    return { ok: false, code: 'empty', error: 'No Site Kit items to publish' }
  }

  const wrote: string[] = []
  const componentIds: string[] = []
  const failures: { componentId: string; error: string }[] = []

  for (const item of items) {
    const result: SiteKitWriteResult = await writeSiteKitStory(item)
    if (!result.ok) {
      failures.push({ componentId: item.componentId, error: result.error })
      continue
    }
    componentIds.push(result.componentId ?? item.componentId)
    wrote.push(...result.wrote)
  }

  if (!componentIds.length) {
    return {
      ok: false,
      code: 'all-failed',
      error: failures[0]?.error ?? 'Publish failed',
    }
  }

  const storybookRedeploy = await requestSiteKitStorybookRebuild(
    `publish:${componentIds.join(',')}`,
  )

  return {
    ok: true,
    published: componentIds.length,
    componentIds,
    wrote,
    storybookRedeploy,
    ...(failures.length ? { failures } : {}),
  }
}

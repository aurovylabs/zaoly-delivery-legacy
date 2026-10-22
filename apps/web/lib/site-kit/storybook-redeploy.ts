/**
 * Coolify redeploy of Site Kit Storybook (Publish to Storybook).
 * Spec: site-kit.md · knowledge/site-kit-storybook-coolify.md
 */
import { paths } from '../paths'

export type StorybookRedeployResult =
  | { status: 'queued'; reason: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string }

/** Narrow JSON/API payloads to the known redeploy union. */
export function parseStorybookRedeployResult(
  value: { status?: string; reason?: string } | null | undefined,
): StorybookRedeployResult | undefined {
  if (!value || typeof value.status !== 'string') return undefined
  const reason = typeof value.reason === 'string' ? value.reason : ''
  if (value.status === 'queued' || value.status === 'skipped' || value.status === 'failed') {
    return { status: value.status, reason }
  }
  return undefined
}

async function fireDeploy(reason: string): Promise<boolean> {
  const hook = process.env.ZAOLY_SITE_KIT_STORYBOOK_DEPLOY_HOOK?.trim()
  if (hook) {
    const res = await fetch(hook, { method: 'POST' })
    if (!res.ok) {
      console.warn(
        `[site-kit] Storybook deploy hook failed (${reason}) status=${res.status}`,
      )
      return false
    }
    console.info(`[site-kit] Storybook deploy hook fired (${reason})`)
    return true
  }

  const token = process.env.COOLIFY_TOKEN?.trim()
  if (!token) {
    console.warn(
      `[site-kit] Storybook redeploy skipped (${reason}): set COOLIFY_TOKEN or ZAOLY_SITE_KIT_STORYBOOK_DEPLOY_HOOK`,
    )
    return false
  }

  const uuid =
    process.env.ZAOLY_SITE_KIT_STORYBOOK_UUID?.trim() ||
    paths.coolifySiteKitStorybookUuid

  const res = await fetch(`${paths.coolifyApiBase}/deploy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ uuid, force: true }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.warn(
      `[site-kit] Coolify Storybook deploy failed (${reason}) status=${res.status} ${text.slice(0, 200)}`,
    )
    return false
  }
  console.info(`[site-kit] Coolify Storybook deploy requested (${reason}) uuid=${uuid}`)
  return true
}

/** Immediate Storybook force rebuild (Publish). No debounce — one call per publish. */
export async function requestSiteKitStorybookRebuild(
  reason: string,
): Promise<StorybookRedeployResult> {
  const configured =
    !!process.env.ZAOLY_SITE_KIT_STORYBOOK_DEPLOY_HOOK?.trim() ||
    !!process.env.COOLIFY_TOKEN?.trim()
  if (!configured) {
    console.warn(
      `[site-kit] Storybook redeploy skipped (${reason}): set COOLIFY_TOKEN or ZAOLY_SITE_KIT_STORYBOOK_DEPLOY_HOOK`,
    )
    return { status: 'skipped', reason: 'missing-coolify-credentials' }
  }

  const ok = await fireDeploy(reason).catch((err) => {
    console.warn('[site-kit] Storybook redeploy error', err)
    return false
  })
  return ok
    ? { status: 'queued', reason }
    : { status: 'failed', reason: 'deploy-failed' }
}

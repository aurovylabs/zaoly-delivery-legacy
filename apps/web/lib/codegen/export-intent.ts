/**
 * Intent block for editor ⌘E — why/what eng is looking at (not only the module).
 * Spec: code-export-handoff.md
 */
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { SITE_KIT_CATALOG } from '@zaoly/site-kit'
import type { ReactExportConsumer } from './codegen-react'
import { resolveExportKitAbsoluteUrl } from './export-copy-pack'
import type { LintIssue } from '../linter/scene-linter'
import {
  siteKitAtomStoryHref,
  siteKitLiveCompositionHref,
} from '../site-kit/storybook-href'
import type { KitExploreFromExport } from '../site-kit/kit-explore-from-export'

export type ExportIntentScope = 'page' | 'selection' | 'all-pages'

export type ExportIntent = {
  scope: ExportIntentScope
  format: string
  consumer: ReactExportConsumer
  targetName: string
  targetType: string
  targetNodeId: string | null
  sceneId: string
  sceneName: string
  pageId: string | null
  pageName: string | null
  collectionId: string | null
  breakpoint: string
  kitComponentId: string | null
  kitHref: string
  kitAbsoluteUrl: string
  masterId: string | null
  masterName: string | null
  storybookHref: string | null
  ready: boolean
  gapCodes: string[]
}

function resolvePageMeta(
  scene: CompositionScene,
  activePageId?: string | null,
): { pageId: string | null; pageName: string | null } {
  const pages = scene.pages ?? []
  if (pages.length === 0) return { pageId: null, pageName: null }
  const page =
    (activePageId ? pages.find((p) => p.id === activePageId) : null) ?? pages[0] ?? null
  if (!page) return { pageId: null, pageName: null }
  return { pageId: page.id, pageName: page.name?.trim() || page.id }
}

function resolveMasterMeta(
  scene: CompositionScene,
  target: SceneNode | null,
): { masterId: string | null; masterName: string | null } {
  if (!target || target.type !== 'Instance' || !target.instanceOf) {
    return { masterId: null, masterName: null }
  }
  const master = scene.masters?.find((m) => m.id === target.instanceOf)
  return {
    masterId: target.instanceOf,
    masterName: master?.name?.trim() || null,
  }
}

export function resolveExportStorybookHref(options: {
  storybookOrigin?: string | null
  componentId?: string | null
}): string | null {
  const origin = options.storybookOrigin?.trim().replace(/\/$/, '')
  const componentId = options.componentId?.trim()
  if (!origin || !componentId) return null

  if (
    componentId.startsWith('Composition~') ||
    componentId.startsWith('Composition')
  ) {
    return siteKitLiveCompositionHref(origin, componentId)
  }

  const entry =
    SITE_KIT_CATALOG.find((e) => e.id === componentId) ||
    SITE_KIT_CATALOG.find((e) => e.exportName === componentId)
  if (entry?.title) {
    return siteKitAtomStoryHref(origin, entry.title)
  }
  return siteKitLiveCompositionHref(origin, componentId)
}

export function buildExportIntent(input: {
  scene: CompositionScene
  target: SceneNode | null
  scope: ExportIntentScope
  format: string
  consumer: ReactExportConsumer
  activePageId?: string | null
  breakpoint?: string | null
  kitExplore: KitExploreFromExport
  ready: boolean
  blockers: readonly LintIssue[]
  storybookOrigin?: string | null
}): ExportIntent {
  const page = resolvePageMeta(input.scene, input.activePageId)
  const master = resolveMasterMeta(input.scene, input.target)
  const kitHref = input.kitExplore.href
  const kitComponentId = input.kitExplore.componentId
  const collectionId = input.scene.platformProjectId?.trim() || null

  return {
    scope: input.scope,
    format: input.format,
    consumer: input.consumer,
    targetName:
      input.scope === 'all-pages'
        ? 'All pages'
        : input.target?.name?.trim() || input.target?.type || '—',
    targetType: input.scope === 'all-pages' ? 'multi-page' : input.target?.type || '—',
    targetNodeId: input.scope === 'all-pages' ? null : input.target?.id ?? null,
    sceneId: input.scene.id,
    sceneName: input.scene.name?.trim() || input.scene.id,
    pageId: page.pageId,
    pageName: page.pageName,
    collectionId,
    breakpoint: input.breakpoint?.trim() || 'desktop',
    kitComponentId,
    kitHref,
    kitAbsoluteUrl: resolveExportKitAbsoluteUrl(kitHref),
    masterId: master.masterId,
    masterName: master.masterName,
    storybookHref: resolveExportStorybookHref({
      storybookOrigin: input.storybookOrigin,
      componentId: kitComponentId,
    }),
    ready: input.ready,
    gapCodes: [...new Set(input.blockers.map((b) => b.code))],
  }
}

/** Compact markdown for Copy pack / tickets. */
export function formatExportIntentMarkdown(intent: ExportIntent): string {
  const lines = [
    `- Scope: ${intent.scope}`,
    `- Target: ${intent.targetName} (${intent.targetType}${intent.targetNodeId ? ` · ${intent.targetNodeId}` : ''})`,
    `- Scene: ${intent.sceneName} (${intent.sceneId})`,
    `- Page: ${intent.pageName ?? '—'}`,
    `- Collection: ${intent.collectionId ?? 'unbound'}`,
    `- Breakpoint: ${intent.breakpoint}`,
    `- Consumer: ${intent.consumer}`,
    `- Format: ${intent.format}`,
    `- Kit: ${intent.kitAbsoluteUrl}`,
    `- Kit componentId: ${intent.kitComponentId ?? '—'}`,
    `- Master: ${intent.masterName ?? intent.masterId ?? '—'}`,
    `- Storybook: ${intent.storybookHref ?? '—'}`,
    `- Ready for eng: ${intent.ready ? 'yes' : 'no'}`,
  ]
  if (intent.gapCodes.length > 0) {
    lines.push(`- Gaps: ${intent.gapCodes.join(', ')}`)
  }
  return lines.join('\n')
}

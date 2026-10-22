import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { AppShell } from '../../../components/app-shell'
import { ProjectDetailPanel } from '../../../components/project-detail-panel'
import { getProject } from '../../../lib/fixtures/project-store'
import { editorInAppEnabled } from '../../../lib/runtime-config'
import { listScenes } from '../../../lib/scene/scene-store'
import {
  sceneToCompositionSummary,
  sortScenesByUpdatedAtDesc,
} from '../../../lib/scene/scene-summary'

async function safeLoad<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch {
    return fallback
  }
}

async function ProjectDetailBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const scenes = await safeLoad(
    () => listScenes(project.platformProjectId),
    [],
  )
  const compositions = sortScenesByUpdatedAtDesc(scenes).map(sceneToCompositionSummary)

  return (
    <AppShell titleKey="pages.projects.title" descriptionKey="pages.projects.lead">
      <ProjectDetailPanel
        project={project}
        compositions={compositions}
        inAppEditor={editorInAppEnabled()}
      />
    </AppShell>
  )
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // AppShell uses usePathname — must stay under Suspense for Cache Components.
  return (
    <Suspense fallback={null}>
      <ProjectDetailBody params={params} />
    </Suspense>
  )
}

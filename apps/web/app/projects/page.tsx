import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '../../components/app-shell'
import { ProjectsHub } from '../../components/projects-hub'
import { auth } from '../../auth'
import { getProjectByPlatformId, listProjectsForViewer } from '../../lib/fixtures/project-store'
import { paths } from '../../lib/paths'
import { listScenes } from '../../lib/scene/scene-store'
import { enrichProjectsWithSceneCounts } from '../../lib/scene/scene-summary'

async function safeLoad<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch {
    return fallback
  }
}

async function ProjectsPageBody({
  searchParams,
}: {
  searchParams: Promise<{ platformProjectId?: string }>
}) {
  const { platformProjectId } = await searchParams
  const session = await auth()
  const viewerId = session?.user?.id ?? null

  if (platformProjectId) {
    const bound = await getProjectByPlatformId(platformProjectId)
    if (bound) redirect(paths.routes.projectDetail(bound.id))
  }

  const [rawProjects, scenes] = await Promise.all([
    listProjectsForViewer(viewerId),
    safeLoad(() => listScenes(), []),
  ])
  const projects = enrichProjectsWithSceneCounts(rawProjects, scenes)
  return (
    <AppShell titleKey="pages.projects.title" descriptionKey="pages.projects.lead">
      <ProjectsHub projects={projects} />
    </AppShell>
  )
}

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ platformProjectId?: string }>
}) {
  // AppShell uses usePathname — must stay under Suspense for Cache Components.
  return (
    <Suspense fallback={null}>
      <ProjectsPageBody searchParams={searchParams} />
    </Suspense>
  )
}

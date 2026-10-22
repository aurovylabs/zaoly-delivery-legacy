import { Suspense } from 'react'
import { AppShell } from '../../components/app-shell'
import { KitPlayground } from '../../components/kit-playground/kit-playground'
import { auth } from '../../auth'
import { listProjectsForViewer } from '../../lib/fixtures/project-store'
import { paths } from '../../lib/paths'
import { editorInAppEnabled } from '../../lib/runtime-config'

async function safeLoadProjects(viewerId: string | null) {
  try {
    return await listProjectsForViewer(viewerId)
  } catch {
    return []
  }
}

async function KitPlaygroundBody({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  const projects = await safeLoadProjects(session?.user?.id ?? null)
  const params = await searchParams
  const rawComponent = params[paths.kitComponentQueryParam]
  const rawCollection = params[paths.activePackQueryKey]
  const initialComponentId = typeof rawComponent === 'string' ? rawComponent : null
  const initialPlatformProjectId = typeof rawCollection === 'string' ? rawCollection : null

  return (
    <KitPlayground
      projects={projects}
      initialComponentId={initialComponentId}
      initialPlatformProjectId={initialPlatformProjectId}
      inAppEditor={editorInAppEnabled()}
    />
  )
}

export default function KitPlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <AppShell titleKey="pages.kit.title" descriptionKey="pages.kit.lead">
      <Suspense
        fallback={
          <KitPlayground
            projects={[]}
            initialComponentId={null}
            initialPlatformProjectId={null}
            inAppEditor={editorInAppEnabled()}
          />
        }
      >
        <KitPlaygroundBody searchParams={searchParams} />
      </Suspense>
    </AppShell>
  )
}

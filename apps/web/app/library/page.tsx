import { Suspense } from 'react'
import { AppShell } from '../../components/app-shell'
import { LibraryHub } from '../../components/library-hub'
import { auth } from '../../auth'
import { listProjectsForViewer } from '../../lib/fixtures/project-store'
import { editorInAppEnabled } from '../../lib/runtime-config'

async function safeLoadProjects(viewerId: string | null) {
  try {
    return await listProjectsForViewer(viewerId)
  } catch {
    return []
  }
}

async function LibraryHubBody() {
  const session = await auth()
  const projects = await safeLoadProjects(session?.user?.id ?? null)
  return <LibraryHub inAppEditor={editorInAppEnabled()} projects={projects} />
}

export default function LibraryPage() {
  return (
    <AppShell titleKey="pages.library.title" descriptionKey="pages.library.lead">
      <Suspense fallback={<LibraryHub inAppEditor={editorInAppEnabled()} projects={[]} />}>
        <LibraryHubBody />
      </Suspense>
    </AppShell>
  )
}

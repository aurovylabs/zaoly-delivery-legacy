import { Suspense } from 'react'
import { AppShell } from '../../components/app-shell'
import { CompositionsHub } from '../../components/compositions-hub'
import { auth } from '../../auth'
import { listProjectsForViewer } from '../../lib/fixtures/project-store'
import {
  editorInAppEnabled,
  isAuthBypassEnabled,
  isServiceAuthConfigured,
} from '../../lib/runtime-config'
import { listScenesForViewer } from '../../lib/require-scene-collection-access'
import { sceneToCompositionSummary } from '../../lib/scene/scene-summary'

async function safeLoad<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch {
    return fallback
  }
}

function resolveViewerId(sessionUserId: string | null | undefined): string {
  if (sessionUserId?.trim()) return sessionUserId.trim()
  if (!isServiceAuthConfigured() && isAuthBypassEnabled()) return 'dev-local'
  return 'anonymous'
}

async function CompositionsHubBody() {
  const session = await auth()
  const viewerId = resolveViewerId(session?.user?.id)
  const [projects, listResult] = await Promise.all([
    safeLoad(() => listProjectsForViewer(viewerId === 'anonymous' ? null : viewerId), []),
    safeLoad(() => listScenesForViewer(viewerId), { scenes: [] }),
  ])
  const compositions = ('scenes' in listResult ? listResult.scenes : []).map(
    sceneToCompositionSummary,
  )
  const standalone = !isServiceAuthConfigured()

  return (
    <CompositionsHub
      compositions={compositions}
      projects={projects}
      inAppEditor={editorInAppEnabled()}
      standalone={standalone}
    />
  )
}

export default function CompositionsPage() {
  const standalone = !isServiceAuthConfigured()
  return (
    <AppShell titleKey="pages.compositions.title" descriptionKey="pages.compositions.lead">
      <Suspense
        fallback={
          <CompositionsHub
            compositions={[]}
            projects={[]}
            inAppEditor={editorInAppEnabled()}
            standalone={standalone}
          />
        }
      >
        <CompositionsHubBody />
      </Suspense>
    </AppShell>
  )
}

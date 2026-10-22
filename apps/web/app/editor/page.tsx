import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '../../auth'
import { AppShell } from '../../components/app-shell'
import { EditorWorkspace } from '../../components/editor-workspace'
import { paths } from '../../lib/paths'
import { editorInAppEnabled } from '../../lib/runtime-config'
import { resolveEditorInitialScene } from '../../lib/scene/editor-scene-boot'
import { Hint, Text } from '../../lib/zaoly-ui'

async function EditorPageBody({
  searchParams,
}: {
  searchParams?: Promise<{
    sceneId?: string
    platformProjectId?: string
    insertType?: string
    hint?: string
  }>
}) {
  const params = (await searchParams) ?? {}
  const inApp = editorInAppEnabled()

  if (!inApp) {
    return (
      <AppShell titleKey="pages.editor.title" descriptionKey="pages.editor.lead">
        <Hint panel>
          <Text>
            In-app editor is off. Set <code>{paths.envEditorInApp}=1</code> to enable{' '}
            <Link href={paths.routes.compositions}>Compositions</Link> launch into{' '}
            <code>{paths.routes.editor}</code>.
          </Text>
        </Hint>
      </AppShell>
    )
  }

  const session = await auth()
  const scene = await resolveEditorInitialScene({
    sceneId: params.sceneId,
    platformProjectId: params.platformProjectId ?? null,
    viewerUserId: session?.user?.id ?? null,
  })
  const insertType = params.insertType?.trim() || null
  const hint = params.hint?.trim() || null

  return (
    <AppShell immersive>
      <EditorWorkspace
        initialScene={scene}
        initialInsertType={insertType}
        initialHint={hint}
      />
    </AppShell>
  )
}

export default function EditorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    sceneId?: string
    platformProjectId?: string
    insertType?: string
    hint?: string
  }>
}) {
  // AppShell (usePathname) + auth/searchParams/scene boot under Suspense.
  return (
    <Suspense fallback={null}>
      <EditorPageBody searchParams={searchParams} />
    </Suspense>
  )
}

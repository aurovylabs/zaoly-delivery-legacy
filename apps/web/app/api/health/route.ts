import { connection, NextResponse } from 'next/server'
import { paths } from '../../../lib/paths'
import { projectStoreBackend } from '../../../lib/fixtures/project-store'
import { sceneStoreBackend } from '../../../lib/scene/scene-store'
import { versionStoreBackend } from '../../../lib/scene/version-store'
import { githubPromoteConfigured, resolveZaolyUiSource } from '../../../lib/runtime-config'

export async function GET() {
  // Cache Components: opt out of prerender so host env (ZAOLY_DATABASE_URL) is live.
  await connection()
  return NextResponse.json({
    ok: true,
    product: 'zaoly',
    productId: paths.productId,
    standalone: paths.standaloneMode,
    federationContract: paths.federationContract,
    sceneStore: sceneStoreBackend(),
    versionStore: versionStoreBackend(),
    projectStore: projectStoreBackend(),
    zaolyUiSource: resolveZaolyUiSource(),
    libraryPromote: { githubConfigured: githubPromoteConfigured() },
  })
}

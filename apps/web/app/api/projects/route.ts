import { NextResponse } from 'next/server'
import type { CreateProjectInput } from '@zaoly/contracts'
import { auth } from '../../../auth'
import {
  createProject,
  getProjectByPlatformId,
  listProjectsForViewer,
  setProjectCapabilityStatus,
} from '../../../lib/fixtures/project-store'
import { viewerCanAccessProject } from '../../../lib/project-access'
import { isRealPlatformProjectId } from '../../../lib/platform-project-id'
import { requireApiSession } from '../../../lib/require-api-session'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const platformProjectId = url.searchParams.get('platformProjectId')
  const session = await auth()
  const viewerId = session?.user?.id ?? null

  if (platformProjectId) {
    const project = await getProjectByPlatformId(platformProjectId)
    if (!project) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    if (!(await viewerCanAccessProject(project, viewerId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    return NextResponse.json(project)
  }
  if (!viewerId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ items: await listProjectsForViewer(viewerId) })
}

export async function POST(request: Request) {
  const denied = await requireApiSession()
  if (denied) return denied

  let body: CreateProjectInput
  try {
    body = (await request.json()) as CreateProjectInput
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name_required' }, { status: 400 })
  }

  try {
    const session = await auth()
    const ownerUserId = session?.user?.id?.trim()
    if (!ownerUserId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const platformCompanyId = body.platformCompanyId?.trim() || undefined

    const bindExisting = isRealPlatformProjectId(body.platformProjectId)
    let project = await createProject({
      name: body.name,
      description: body.description,
      platformProjectId: body.platformProjectId,
      ownerUserId,
      platformCompanyId,
    })

    if (bindExisting) {
      project = (await setProjectCapabilityStatus(project.id, 'in_sync')) ?? project
    }

    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'create_failed'
    const status = code === 'platform_project_exists' ? 409 : 400
    return NextResponse.json({ error: code }, { status })
  }
}

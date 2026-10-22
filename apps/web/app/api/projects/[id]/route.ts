import { NextResponse } from 'next/server'
import type { UpdateProjectInput } from '@zaoly/contracts'
import { auth } from '../../../../auth'
import {
  archiveProject,
  getProject,
  updateProject,
} from '../../../../lib/fixtures/project-store'
import { viewerCanAccessProject } from '../../../../lib/project-access'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const project = await getProject(id)
  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json(project)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const session = await auth()
  const viewerId = session?.user?.id ?? null
  if (!viewerId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const existing = await getProject(id)
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (!(await viewerCanAccessProject(existing, viewerId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: UpdateProjectInput
  try {
    body = (await request.json()) as UpdateProjectInput
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const project = await updateProject(id, body)
  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json(project)
}

/**
 * @deprecated Prefer POST /api/projects/:id/archive — DELETE archives (no hard-delete).
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const session = await auth()
  const viewerId = session?.user?.id ?? null
  if (!viewerId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!(await viewerCanAccessProject(project, viewerId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const archived = await archiveProject(id)
  if (!archived) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}

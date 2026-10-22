import { NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { archiveProject, getProject } from '../../../../../lib/fixtures/project-store'
import { viewerCanAccessProject } from '../../../../../lib/project-access'

/** Archive project locally (hidden from default lists). */
export async function POST(
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
  return NextResponse.json(archived)
}

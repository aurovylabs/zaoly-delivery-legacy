/**
 * Legacy path — Zaoly uses local scene members.
 * Spec: specs/domain/editor-share-invite.md · specs/api/zaoly-scene-members.md
 */

import { NextResponse } from 'next/server'
import { paths } from '../../../../../lib/paths'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  return NextResponse.json(
    {
      error: 'use_scene_members',
      membersPath: paths.routes.apiSceneMembers(id),
    },
    { status: 410 },
  )
}

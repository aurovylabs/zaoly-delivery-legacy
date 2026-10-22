/**
 * Browser client for Phase-4 library promote.
 * Spec: `specs/api/library-promote.md`
 */

import type { CompositionScene } from '@zaoly/contracts'
import { paths } from '../paths'

export type PromoteClientKind = 'P1' | 'P2'

export type PromoteClientOk = {
  ok: true
  htmlUrl: string | null
  number: number | null
  writesGit: boolean
}

export type PromoteClientFail = { ok: false; error: string; code?: string }
export type PromoteClientResult = PromoteClientOk | PromoteClientFail

export async function requestLibraryPromote(
  input: {
    kind: PromoteClientKind
    scene: CompositionScene
    nodeId?: string
  },
  fetchImpl: typeof fetch = fetch,
): Promise<PromoteClientResult> {
  const res = await fetchImpl(paths.routes.apiLibraryPromote, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      kind: input.kind,
      scene: input.scene,
      ...(input.kind === 'P1' && input.nodeId ? { nodeId: input.nodeId } : {}),
    }),
  })
  const body = (await res.json().catch(() => null)) as {
    ok?: boolean
    error?: string
    issues?: { code?: string; message?: string }[]
    proposal?: {
      writesGit?: boolean
      pullRequest?: { htmlUrl?: string; number?: number }
    }
  } | null
  if (!body || body.ok !== true) {
    return {
      ok: false,
      error: body?.issues?.[0]?.message || body?.error || 'Promote failed',
      code: body?.issues?.[0]?.code,
    }
  }
  return {
    ok: true,
    writesGit: Boolean(body.proposal?.writesGit),
    htmlUrl: body.proposal?.pullRequest?.htmlUrl ?? null,
    number: body.proposal?.pullRequest?.number ?? null,
  }
}

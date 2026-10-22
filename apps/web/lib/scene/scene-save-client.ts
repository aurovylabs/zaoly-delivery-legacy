import type { CompositionScene, SceneOp } from '@zaoly/contracts'

export type ScenePutBody = CompositionScene & { baseUpdatedAt: string }

export type ScenePutResult =
  | { ok: true; scene: CompositionScene }
  | { ok: false; stale: true }
  | { ok: false; stale: false; message: string; status: number }

export type SceneOpsResult = ScenePutResult

export async function applySceneOps(
  sceneId: string,
  ops: SceneOp[],
  baseUpdatedAt: string,
  apiPath: string,
  fetchFn: typeof fetch = fetch,
): Promise<SceneOpsResult> {
  const res = await fetchFn(apiPath, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ baseUpdatedAt, ops }),
  })
  if (res.status === 409) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    if (body?.error === 'stale-scene') {
      return { ok: false, stale: true }
    }
    return { ok: false, stale: false, message: 'Save conflict', status: 409 }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string
      message?: string
    } | null
    return {
      ok: false,
      stale: false,
      message: body?.message ?? body?.error ?? `Save failed (${res.status})`,
      status: res.status,
    }
  }
  const data = (await res.json()) as { scene: CompositionScene }
  return { ok: true, scene: data.scene }
}

export async function putScene(
  scene: CompositionScene,
  baseUpdatedAt: string,
  apiPath: string,
  fetchFn: typeof fetch = fetch,
): Promise<ScenePutResult> {
  const res = await fetchFn(apiPath, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...scene, baseUpdatedAt } satisfies ScenePutBody),
  })
  if (res.status === 409) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    if (body?.error === 'stale-scene') {
      return { ok: false, stale: true }
    }
    return { ok: false, stale: false, message: 'Save conflict', status: 409 }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string
      message?: string
    } | null
    return {
      ok: false,
      stale: false,
      message: body?.message ?? body?.error ?? `Save failed (${res.status})`,
      status: res.status,
    }
  }
  const data = (await res.json()) as { scene: CompositionScene }
  return { ok: true, scene: data.scene }
}

export async function fetchScene(
  apiPath: string,
  fetchFn: typeof fetch = fetch,
): Promise<CompositionScene> {
  const res = await fetchFn(apiPath)
  if (!res.ok) {
    throw new Error(`Load failed (${res.status})`)
  }
  const data = (await res.json()) as { scene: CompositionScene }
  return data.scene
}

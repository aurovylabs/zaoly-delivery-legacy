import {
  encodePresenceEvent,
  encodeSceneBusEvent,
  encodeSceneHeartbeat,
  SCENE_EVENTS_HEARTBEAT_MS,
  subscribeSceneEvents,
} from '../../../../../lib/scene/scene-events'
import { getScenePresence } from '../../../../../lib/scene/presence-store'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'


function streamHeaders(): HeadersInit {
  return {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      const write = (chunk: string) => controller.enqueue(encoder.encode(chunk))
      write(encodeSceneHeartbeat())

      let unsubscribe = () => {}
      let heartbeat: ReturnType<typeof setInterval> | null = null

      void (async () => {
        // Immediate presence snapshot so reconnects resync without waiting for a peer HB.
        const snap = await getScenePresence(id)
        write(
          encodePresenceEvent({
            type: 'presence-updated',
            sceneId: id,
            mode: 'snapshot',
            users: snap.users,
            activeUsersCount: snap.users.length,
          }),
        )

        unsubscribe = subscribeSceneEvents(id, (event) => {
          write(encodeSceneBusEvent(event))
        })
        heartbeat = setInterval(() => {
          write(encodeSceneHeartbeat())
        }, SCENE_EVENTS_HEARTBEAT_MS)
      })()

      const close = () => {
        if (heartbeat) clearInterval(heartbeat)
        unsubscribe()
      }
      req.signal.addEventListener('abort', close, { once: true })
    },
    cancel() {
      // cleanup is handled by request abort above in runtime environments
    },
  })

  return new Response(stream, { headers: streamHeaders() })
}

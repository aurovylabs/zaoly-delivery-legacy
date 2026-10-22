# API — Scene Presence & Collaboration — CREATION v3 (P114)

**Status:** Accepted · **Date:** 2026-09-08 · **Live wave:** 2026-09-10 · **Desktop parity:** 2026-09-10 · **Perf Wave A:** 2026-09-10 · **Transport Wave B:** 2026-09-10  
**Parent:** `specs/domain/editor-presence-collaboration.md`  
**Contracts:** `packages/contracts` (`ScenePresenceUser`, `ScenePresenceState`, `PresenceUpdatedPayload`)  
**Ops:** `knowledge/presence-collaboration.md`

---

## 1. Overview

Lightweight presence heartbeat + SSE fan-out for collaborators on the same `CompositionScene`. Same in-process replica stance as `scene-updated` SSE. Web and macOS Native clients use identical endpoints and event names.

---

## 2. Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scenes/:id/presence/heartbeat` | Session / Service | Upsert local cursor, selection, viewport; returns snapshot + `selfUserId`; publishes SSE `presence-updated` |
| `GET` | `/api/scenes/:id/presence` | Session / Service | Snapshot of active collaborators |
| `DELETE` | `/api/scenes/:id/presence` | Session / Service | Leave; publishes SSE `presence-updated` |
| `GET` | `/api/scenes/:id/events` | Session / Service | SSE: `scene-updated`, `presence-updated`, `heartbeat` |

Constants: `paths.routes.apiScenePresence`, `apiScenePresenceHeartbeat`, `apiSceneEvents` (Web). macOS: `ZaolyAPIPaths` mirroring the same relative paths against the configured creation base URL (`knowledge/paths.md` → `URL_ZAOLY_STAGING`).

---

## 3. Heartbeat body

```json
{
  "name": "Sarah Miller",
  "color": "#0d9488",
  "pageId": "page-home",
  "cursor": { "x": 420.5, "y": 180.0, "pageId": "page-home", "lastActiveAt": "…" },
  "selectedIds": ["node_hero_button_1"],
  "viewport": { "zoom": 1.0, "panX": 0, "panY": 0 },
  "isIdle": false
}
```

`userId` is taken from the authenticated session (body MUST NOT override actor).

Response MUST include `users`, `activeUsersCount`, and `selfUserId` (session actor).

---

## 4. Lifecycle

1. Liveness tick every 5 000 ms while the client document/app is visible; cursor ticks use adaptive throttle (120 / 200 / 250 ms by remote peer count; see domain spec). Clients MAY heartbeat less often when hidden/inactive (30 000 ms liveness, `isIdle: true`, no cursor ticks) — same endpoints, no contract change.
2. Immediate heartbeat on selection / page change (while visible/active) and on become-visible / become-active.
3. Idle: client MAY set `isIdle: true` after 60 000 ms without pointer/keyboard (and MUST while visibility-paused).
4. Prune peers with `lastSeenAt` older than 15 000 ms.
5. Leave via `DELETE` (Web `pagehide`; macOS view disappear / window close).
6. After upsert/remove, the server MUST coalesce presence SSE per scene (**80 ms** window — at most one `presence-updated` flush per window). HTTP heartbeat responses remain full snapshots and are not delayed by coalesce.
7. SSE payload (`PresenceUpdatedPayload`):

**Snapshot** (SSE subscribe / resync):

```
event: presence-updated
data: {"type":"presence-updated","sceneId":"…","mode":"snapshot","users":[…],"activeUsersCount":2}
```

**Delta** (coalesced upsert/leave/prune):

```
event: presence-updated
data: {"type":"presence-updated","sceneId":"…","mode":"delta","upserts":[…],"removedUserIds":["…"],"activeUsersCount":2}
```

On `GET /api/scenes/:id/events` subscribe, the server MUST write one immediate **snapshot** frame (after the initial SSE heartbeat) so reconnects resync without waiting for a peer heartbeat.

Native clients MUST subscribe with the same auth session/cookies (or Bearer) as other BFF calls. Clients MUST merge `mode: "delta"` into local presence state; `mode: "snapshot"` (or legacy frames with full `users` and no `mode`) replaces state.

---

## 5. Soft-lock (client)

Structural **and** leaf/property ops rejected locally when a peer's `selectedIds` intersects the op target (see `concurrent-edit-w6.md`). Surface toast/alert. Server scene ACL unchanged.

---

## 6. Replica gate (Wave D)

- **Without** `ZAOLY_REDIS_URL`: in-process SSE bus + memory presence store. Valid while Coolify `swarm_replicas=1`.
- **With** `ZAOLY_REDIS_URL`: Redis Pub/Sub on channel `zaoly:scene-bus` fans out `scene-updated` and `presence-updated` across replicas; presence users live in Redis hashes `zaoly:presence:{sceneId}` (TTL refresh).
- Coolify MUST set `ZAOLY_REDIS_URL` **before** raising `swarm_replicas` above 1. Staging remains 1 replica until ops attach Redis.

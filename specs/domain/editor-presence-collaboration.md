# Real-Time Presence, Multi-Cursor Collaboration & Granular Node-Locking — CREATION v3 (P114)

**Status:** Accepted · **Date:** 2026-09-08 · **Live wave:** 2026-09-10 · **Desktop parity:** 2026-09-10 · **Perf Wave A:** 2026-09-10 · **Transport Wave B:** 2026-09-10  
**Context:** Enterprise real-time multiplayer presence across Web (`apps/web`) and macOS Native (`apps/macos`).  
**Parent:** `specs/domain/editor-workspace.md` · `specs/domain/app-shell.md`  
**API:** `specs/api/scene-presence.md`  
**Ops notes:** `knowledge/presence-collaboration.md`  
**Contracts:** `packages/contracts` (`ScenePresenceUser`, `SceneUserCursor`, `ScenePresenceState`, `PresenceUpdatedPayload`)

---

## 1. Goal & Requirements

Enterprise teams require near-real-time visibility into who is reviewing or modifying a composition:

1. **Live Multiplayer Cursors (`CanvasMultiplayerCursors` / `NativeMultiplayerCursorsView`):**
   - Clients MUST transmit artboard cursor positions (`x`, `y`, `pageId`) on pointer activity (throttle ≤ 150 ms).
   - Overlay MUST be mounted over the canvas stage (no hit-testing).
   - Distinct persistent avatar colors (stable hash of `userId`).
   - Inactive cursors SHOULD fade when `lastActiveAt` is older than 10 s.

2. **Presence Avatars & Follow-Mode (`TopbarPresenceStack` / macOS presence stack):**
   - Stacked avatar pills in top chrome (Web: `TopbarPresenceStack`; macOS: workspace strip).
   - **Follow:** click peer → pan/zoom to their `viewport` (or cursor); unfollow on local pan/pointer move.

3. **Granular Selection Halo:**
   - Peers' `selectedIds[]` MUST paint a colored outline + name chip on remote nodes.
   - Chip MUST read **Locked · {name}** when painting a peer selection (conflict preview before the user attempts a structural op).
   - When the local selection intersects a peer's `selectedIds`, the editor SHOULD show a non-blocking preview strip (`Soft-lock preview: {name} has this selection`).
   - **Soft-Lock (lite):** structural ops (`remove_node`, `move_node`, `reparent`/`wrap`/`unwrap`, `move_node_to_page`, delete/duplicate page, insert into peer-selected container) MUST be rejected when a peer has the same node (or container target) in `selectedIds`. Surface via toast/alert (not silent).

4. **Transport:**
   - Liveness heartbeat every 5 000 ms; prune > 15 000 ms.
   - Cursor/selection heartbeats throttle ~100–150 ms; immediate on selection/page change.
   - Server MUST fan out `presence-updated` on the existing Scene SSE bus after each heartbeat upsert and on leave.
   - Graceful departure: Web `pagehide` DELETE; macOS window close / view disappear DELETE.
   - **No CRDT** — scene document sync remains optimistic lock + `scene-updated` SSE.
   - **W6 (2026-09-12):** This stance is the accepted product decision (`specs/domain/concurrent-edit-w6.md`). Merge/CRDT is out of scope until a dedicated program.

5. **Follow polish:** Follow indicator MUST show `Following {name}` with an explicit Stop control; followed avatar SHOULD be visually marked. Unfollow on local pan/pointer remains required.

6. **Activity chips:** Top chrome SHOULD list compact remote activity chips (`{name} · {pageId}` and optional selection hint) for awareness without opening Follow.

7. **Platform:** Web MUST. macOS Native MUST (same API contract).

8. **Replica stance (Wave D):** In-process SSE + memory presence is valid while Coolify `swarm_replicas=1` and `ZAOLY_REDIS_URL` is unset. When Redis is configured, Scene SSE Pub/Sub and the presence hash store MUST run on Redis (`knowledge/presence-collaboration.md`). Redis is REQUIRED before replicas > 1.

---

## 2. Data Model

Unchanged contracts in `@zaoly/contracts` (`SceneUserCursor`, `ScenePresenceUser` including optional `viewport`, `ScenePresenceState`). Heartbeat response MAY include `selfUserId`.

---

## 3. UI & Platform Integration

### Web (`apps/web`)
- Overlay: `canvas-multiplayer-cursors.tsx` inside editor canvas chrome.
- Top chrome: `topbar-presence-stack.tsx` with Follow + Stop; `presence-activity-ribbon.tsx` for activity chips; soft-lock preview strip.
- Peer paint: `lib/editor/peer-presence-store.ts` + `SceneNodeView` halo (`Locked · {name}`).
- Client hub: `lib/editor/use-editor-presence.ts`.

### macOS Native (`apps/macos`)
- Overlay: `NativeMultiplayerCursorsView` in `NativeCanvasViewport`.
- Controller: `Presence/NativePresenceController.swift` (throttle, SSE coalesce, leave).
- Top strip: Follow + Stop, activity chips, soft-lock preview alert path.
- WebKit: throttled `pointer_move` + incremental peer-halo JS (no full HTML reload on presence).
- Soft-lock gates `applyOp` / `applyOps` in `NativeWorkspaceView`.

---

## 4. Performance (MUST)

1. Never full canvas HTML reload on presence ticks.
2. Throttle pointer at JS bridge before native (adaptive; see below).
3. Coalesce SSE snapshots — apply latest only.
4. Cursor overlay only paints peers with cursors on the active page.
5. Heartbeat body stays small (ids + cursor + viewport).
6. **Visibility pause:** when the document (`visibilityState === 'hidden'`) or macOS app is inactive, clients MUST stop cursor heartbeats and stretch liveness to 30 000 ms with `isIdle: true`. On become-visible / become-active, clients MUST send an immediate heartbeat and restore 5 000 ms liveness. Selection/page heartbeats remain immediate only while visible/active.
7. **Adaptive cursor throttle** (JS and Swift), by remote peer count on the scene: 0–4 → 120 ms; 5–9 → 200 ms; ≥ 10 → 250 ms. Selection/page/visibility-resume bypass throttle.
8. **Overlay paint:** Web MUST apply peer cursor positions via `requestAnimationFrame` (transform writes; ≤ one paint per frame). macOS MUST display-link / run-loop coalesce published presence and MUST NOT re-animate every cursor tick.
9. **Server coalesce:** presence SSE MUST flush at most once per scene every **80 ms** (buffered upserts/removes).
10. **Delta-SSE:** `presence-updated` MUST use `mode: "delta"` with `upserts` / `removedUserIds` for coalesced changes; `mode: "snapshot"` with full `users` on SSE subscribe (and rare resync). Clients MUST merge deltas locally. HTTP heartbeat remains a full snapshot.

---

## 5. Related

- `specs/api/scene-presence.md`
- `knowledge/presence-collaboration.md`
- `knowledge/paths.md`
- `packages/contracts`

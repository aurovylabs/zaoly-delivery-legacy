# Concurrent edit — product decision (W6)

**Status:** Accepted · **Date:** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Knowledge:** `knowledge/concurrent-edit-decision.md`  
**Related:** `specs/domain/editor-presence-collaboration.md` · `specs/api/scenes.md` · `specs/domain/scene-agent-editing.md`

## Decision

CREATION v3 **ships Presence-only collaboration** with **server-authoritative optimistic locking**.

| Chosen | Not chosen (now) |
|--------|------------------|
| Live presence (cursors, selection halos, Follow, activity) | CRDT document merge (Yjs/Automerge/…) |
| Soft-lock on peer selection (structural **and** leaf/property ops on that selection) | OT / ShareDB live op transform of the scene tree |
| `baseUpdatedAt` → `409 stale-scene` + **explicit reload/keep** (no silent wipe) | Silent last-writer-wins or auto field merge |
| `scene-updated` SSE awareness | Peer-to-peer / offline-first multi-writer sync |

## Rationale (2026)

1. **Server is already the SSOT** for scenes, versions, agent ops, Brandion packs, and Collection federation. CRDT/OT would duplicate authority and complicate ACL, checkpoints, and MCP retry loops.
2. **Composition trees are object graphs**, not free-form text. Soft-lock + visible peer selection matches design-tool practice (selection as soft lock) without inventing tree CRDT semantics.
3. **Agents + humans** already share `baseUpdatedAt` / `stale-scene` (`scene-agent-editing`). Auto-merge would hide lost updates agents must surface and retry.
4. **Presence (P114) is shipped** Web + macOS with Redis gate before replicas > 1. Investing in merge before multi-replica ops would be premature.
5. Industry guidance for centralized SaaS with structured documents still favors optimistic concurrency + awareness over full CRDT unless offline-first is a product requirement — CREATION is online Collection-scoped.

## Normative rules

1. Document writes MUST continue to require `baseUpdatedAt` and MUST return `409 stale-scene` on mismatch (no silent merge).
2. Editors MUST NOT invent CRDT/OT merge of scene JSON on conflict. On `409 stale-scene`, the editor MUST **keep the local draft** and MUST surface an explicit choice to **reload** (discard local) or **keep editing** (pause autosave until reload). Auto-wipe of `history.present` on stale is forbidden.
3. Soft-lock MUST reject **structural** and **leaf** mutations targeting a peer-selected node id (best-effort awareness; not a hard lease). Leaf ops include `set_prop`, `set_style`, token bindings, breakpoint/state overrides, `set_flags`, and interaction CRUD. Soft-lock is still not a lease-expiry protocol.
4. Revisit this decision only when product explicitly requires simultaneous multi-writer editing of the same subtree **without** reload (then open a new program with storage + ops model redesign).

## Acceptance

1. Specs inventory lists this doc + knowledge decision note.
2. Presence + scenes API specs still state “No CRDT”.
3. Enterprise backlog marks W6 **done** with this decision.
4. Unit/inventory tests assert the chosen model strings and soft-lock + stale-scene contracts remain present.

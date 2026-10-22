# VIDEON asset consume — CREATION v3 (P0 stills)

**Status:** Accepted · 2026-09-25 · **Phase:** P0 (Collection media stills)  
**API:** `specs/api/videon-media-bff.md`  
**Plexon:** `../plexon-v3/specs/domain/videon-integration.md` (CREATION consume stills)  
**Parent:** `editor-inspect.md` (P93 Asset Library) · `brand-token-consume.md` (BFF auth pattern)  
**Knowledge:** `knowledge/paths.md` · `knowledge/keep-drop-backlog.md`

## Goal

Designers pick **Collection-bound VIDEON media** from the CREATION Asset Library and apply a **still frame** as Image `src` or container `backgroundImage`, without inventing a CREATION media store or a Video scene node.

## Invariants

1. **Collection-bound only** — list/frame require the scene’s real `platformProjectId`. Unbound / local scenes show an empty VIDEON category (no accessible-mediathek fan-out in P0).
2. **Domain state stays in VIDEON** — CREATION MUST NOT copy media binaries into scene JSON or a CREATION blob store. Scene stores a **stable ref** plus a same-origin BFF frame URL for paint.
3. **Product→Product** — CREATION BFF calls VIDEON with `ZAOLY_SERVICE_SECRET` + actor (`X-Actor-User-Id`). MUST NOT route media bytes through Plexon.
4. **Access Model B** — VIDEON enforces workspace membership; CREATION BFF additionally checks Collection access for the session actor before proxying.
5. **No hardcoded FQDNs** — `VIDEON_API_URL` / paths helpers only.

## Ref shape (persist on node)

When applying a VIDEON still, CREATION MUST set:

| Prop | Value |
|------|--------|
| `src` or `backgroundImage` | Same-origin frame URL: `/api/videon-media/:mediaAssetId/frame?platformProjectId=&t=&w=` |
| `videonMediaRef` | JSON string of |

```ts
type VideonMediaRef = {
  source: 'videon'
  mediaAssetId: string
  platformProjectId: string
  kind: 'frame'
  tMs?: number
}
```

Signed object URLs MUST NOT be the scene SoT. Re-paint uses the BFF frame route (session).

## Asset Library UX (P0)

- New category chip **Collection media (VIDEON)** in `EditorAssetLibraryDialog`.
- WHEN `platformProjectId` is a real Collection id AND VIDEON is configured, DANN list project-scoped media and show frame thumbs via BFF.
- WHEN VIDEON is unset / empty / denied, DANN show EmptyState (no stock fallback mixed into this category).
- Apply modes unchanged (background / image).

## Non-goals (P0)

- Scene `Video` primitive / live `<video>` playback  
- Cut / scene-key / In–Out clip picker  
- Premiere ZIP / adobe-download insert  
- Brandion binary asset store  
- macOS `NativeAssetLibrarySheet` parity (follow-up)

## P1 (deferred)

- Video node + stream/playback proxy  
- Analysis scene / Cut clip selection  
- Optional high-quality download-on-insert

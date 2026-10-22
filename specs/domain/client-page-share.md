# Client Page Share (CREATION)

**Status:** Accepted · 2026-09-19 · **Phase:** P9 (designer replies visible on share)  
**Knowledge:** `knowledge/client-page-share-eval.md` · `knowledge/client-page-share-p2.md` · `knowledge/client-page-share-p3.md` · `knowledge/client-page-share-p4.md` · `knowledge/client-page-share-p5.md` · `knowledge/client-page-share-p6.md` · `knowledge/client-page-share-list-preview-shell.md` · `knowledge/client-page-share-p7-preview-canvas.md` · `knowledge/client-page-share-p8-scene-comments.md` · `knowledge/client-page-share-p9-designer-replies.md`  
**Plexon:** `../plexon-v3/specs/domain/creation-client-share.md`  
**Parent:** `editor-workspace.md` · `composition-scene.md` · `scene-pages.md` · `editor-comments.md`  
**API:** `specs/api/client-page-share.md`

## Goal

Collection creators/admins can share one or more **pages** from a bound composition scene with external clients as a **view-only** browser experience — without Collection membership and without editor ACL.

## Distinguishing siblings

| Feature | Spec | Grants |
|---------|------|--------|
| Invite collaborators | `editor-share-invite.md` | Plexon Collection member (same company) |
| Client Page Share | **this** | Anonymous or gated **view** of page snapshot |
| Storyblok preview | `storyblok-preview.md` | CMS authoring preview |
| Site Kit Publish | site-kit write | Library / seed write — not client review |

## Invariants

1. **View-only** — share viewer MUST NOT call scene ops, presence, versions write, Site Kit write, Storyblok push, or PDF/export APIs that mutate state.
2. **Collection-owned** — share row stores `platformProjectId` + `sceneId`; lifecycle survives creator offboarding (Plexon policy).
3. **Bound scene only** — create share REQUIRES real `platformProjectId` (same gate as `share-invite`).
4. **Token hygiene** — store SHA-256 of plain token for public lookup; also retain plain token **server-side only** so authenticated managers can re-copy `shareUrl` in the editor list. Return plain on create; authenticated `GET …/client-shares` MAY include `shareUrl`. Public resolve MUST never return the plain token.
5. **Page subset** — share exposes only selected `pageId[]` (and their node subtrees needed to render). Do not leak full scene secrets (other pages, internal notes) in the public payload.
6. **Pinned default** — Phase 1 `contentMode: pinned_revision` stores a render snapshot at mint/refresh time.
7. **Fail closed** — unknown / revoked / expired / policy-blocked / bad password → generic 404/410.
8. **Org policy** — before mint and before resolve, honor Plexon `clientShare` policy (`creation-client-share.md`).
9. **No hardcoded FQDNs** — public URL via `paths` / runtime-config (`pathClientPageShare(token)`).
10. **Preview shell** — `/share/p/:token` MUST render inside `AppShell preview`: full `AppFrame` + shell corners + BrandCorner logo (no product launcher menu), **no** primary product nav, **no** Assistant FAB. Share page tabs / export live in the topbar trail.

## Data model (Creation)

Table `creation_client_shares` (name indicative):

| Column | Notes |
|--------|-------|
| `id` | UUID |
| `platform_project_id` | Collection id |
| `scene_id` | Scene id |
| `token_hash` | SHA-256 hex (public resolve lookup) |
| `token_plain` | Plain `crs_` token for authenticated manager re-copy (nullable on legacy rows) |
| `page_ids` | JSON string[] |
| `content_mode` | `pinned_revision` \| `live_head` |
| `revision_id` | Optional scene version id when pinned |
| `snapshot_json` | Pinned render payload (pages + tokens ref); seed for `live_head` fallback if scene missing |
| `access_mode` | `link` \| `password` \| `email_allowlist` |
| `password_hash` | Nullable |
| `email_allowlist` | JSON string[] (normalized lowercase) when `email_allowlist` |
| `expires_at` | Nullable timestamptz |
| `revoked_at` | Nullable |
| `approved_at` | Nullable — Suite E2 ClientRoom freigabe |
| `approved_by_user_id` | Nullable — actor who approved |
| `created_by_user_id` | Audit only |
| `updated_at` / `created_at` | |
| `label` | Optional human name (“Client review v3”) |
| `comments_enabled` | Boolean — guest comments on (P3) |
| `guest_comments` | JSON array of `{ id, pageId, authorName, authorEmail?, body, createdAt, pinX?, pinY? }` (P3 + spatial P7) |

## Viewer UX

- Route: `/share/p/:token` (middleware public allowlist).
- **Chrome:** `AppShell preview` — Zaoly `AppFrame` + BrandCorner logo plaque (top-right), shell corners; **no** primary nav / settings / product launcher / Assistant. Quiet “Shared preview” lead label top-left. Page tabs + zoom (± / fit / %) + watermarked export in the topbar trail.
- **Preview stage (P7):** shared page renders inside `@zaoly/ui` `CanvasViewport` (artboard sized from page `frame` / breakpoint defaults). Guests MAY pan (wheel / space-drag) and zoom (pinch, Ctrl/Cmd+wheel, trail ±, fit). Zoom range 10%–400% via `lib/editor/canvas-navigation.ts`.
- **Spatial guest comments:** when unlocked, guests place numbered pins on the artboard (`pinX` / `pinY` in artboard CSS px). Thread popover on pin click. Comments always persist on the **share record**. **P8:** spatial pins are also **projected** into `CompositionScene.comments` (id prefix `cmt_crs_`, author `Client · …`, board coords = page frame + pin) so designers see/work them in the editor. Projection is append-only / idempotent; guests never call scene ops. **P9:** designer replies / resolve on projected scene comments **post immediately** to share via `POST …/client-share-thread` (and re-mirror on scene Save); public payloads merge share + scene replies. Page-only notes without pins remain share-only.
- Password gate: interstitial form before payload fetch (still inside the preview shell).
- Email allowlist gate: interstitial email form; unlock if address is listed (P2).
- `live_head`: Draft watermark/badge in chrome; HTML rebuilt from current scene head.
- Brand: apply Brandion pack CSS from snapshot ref (same path as editor preview), not live editor session cookies.
- **P3 SSO:** session with Collection view (or allowlisted email) skips password/email gate.
- **P3 export:** watermarked PNG/PDF of shared pages from viewer.

## Editor UX

Share control becomes a menu:

1. **Invite to Collection** → existing `share-invite`
2. **Share pages with client** → dialog:
   - **Active shares first** — list existing links with copy / open / revoke (delete)
   - Create form (pages, access, password, TTL, label, content mode, comments)
   - After create: show URL inline + copy

Only users who can manage Collection lifecycle (same as invite) MAY create/revoke client shares.

## Phases

| Phase | Deliverable |
|-------|-------------|
| P1 | Token CRUD, pinned snapshot, password, TTL, revoke, viewer, editor dialog, tests — **shipped 2026-09-19** |
| P2 | `live_head`, email allowlist, Plexon policy + shares inventory — **shipped 2026-09-19** |
| P3 | Guest comments, SSO viewer, watermarked export — **shipped 2026-09-19** |
| P4 | Plexon Collection Shares panel + `DELETE` service fan-out to Creation token store — **shipped 2026-09-19** |
| P5 | Audit events (`created` / `revoked` / `viewed` / `unlock_failed`) + Collection CSV export — **shipped 2026-09-19** |
| P6 | Company `clientShare` defaults + restrictive Collection merge (Plexon) — **shipped 2026-09-19** |
| P7 | Preview `CanvasViewport` zoom/pan + spatial guest comment pins — **shipped 2026-09-20** |
| P8 | Project guest spatial pins into `CompositionScene.comments` for designer editor — **shipped 2026-09-20** |
| P9 | Designer replies/resolve live on share (immediate thread POST + 3s poll) — **shipped 2026-09-20** |

## Non-goals

- Collection membership for clients  
- Public edit / CRDT  
- Replacing CMS publish  
- User-owned share hosting (XD failure mode)

## Testing

- Spec inventory includes this file  
- Unit: token hash, expiry, page subset filter, password verify  
- API: create requires session + binding; public GET never returns other pages  
- UI smoke: dialog + password interstitial  

# Editor comments (P82b / P103)

**Status:** Accepted · Updated 2026-09-07  
**Product:** CREATION v3

## Model

- Comments live on `CompositionScene.comments` (JSON SoT with scene Save).
- Each comment supports either node anchoring, spatial canvas coordinates, or both:
  ```ts
  export interface SceneCommentReply {
    id: string
    author: string
    body: string
    createdAt: string
  }

  export interface SceneComment {
    id: string
    nodeId?: SceneNodeId
    body: string
    author: string
    createdAt: string
    resolved: boolean
    pinX?: number
    pinY?: number
    replies?: SceneCommentReply[]
  }
  ```
- Node-anchored comments without spatial coordinates track node bounding boxes.
- Spatial pin comments (`pinX`, `pinY`) anchor to canvas / board coordinates and persist regardless of node hierarchy changes.
- **Client Page Share (P8):** guest spatial pins project into `scene.comments` with id prefix `cmt_crs_` (`paths.clientShareSceneCommentIdPrefix`). See `client-page-share.md` / `knowledge/client-page-share-p8-scene-comments.md`.
- Node orphans (deleted nodes for purely node-anchored comments without spatial pins) are pruned on save / comment mutation. Spatial canvas pins are retained.

## UI

- Toolbar Comments toggles `EditorCommentsPanel`.
- Canvas Pin Mode (`C` keyboard shortcut) allows 1-click dropping of numbered comment pins (`[ 💬 1 ]`, `[ 💬 2 ]`).
- Interactive Pin Popover:
  - Displays thread header with author, date, and resolved toggle.
  - Displays thread body and threaded replies list (`replies`).
  - Reply input to submit responses.
  - Resolve / Unresolve status toggling (resolved pins appear dimmed or hidden).
- Web (`canvas-comment-pins.tsx`) and macOS Native (`NativeCanvasCommentPinsView.swift`) share 100% mutual parity.

## Related

- `packages/contracts` `SceneComment`, `SceneCommentReply`
- `apps/web/lib/scene-comments.ts`
- `apps/web/components/canvas-comment-pins.tsx`
- `apps/macos/Sources/CREATIONApp/Panels/NativeCommentsDrawer.swift`
- `apps/macos/Sources/CREATIONApp/NativeCanvas/NativeCanvasCommentPinsView.swift`
- `knowledge/creation-p82.md`

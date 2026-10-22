# Scene Version History, Named Milestones & Point-in-Time Restore — CREATION v3 (P116)

**Status:** Accepted · **Date:** 2026-09-08  
**Context:** Enterprise revision control, named milestone checkpoints, audit trails, and point-in-time recovery across Web (`apps/web`) and macOS Desktop Native (`apps/macos`).  
**Parent:** `specs/domain/editor-workspace.md` · `specs/domain/composition-scene.md`  
**API:** `specs/api/scene-versions.md`  
**Contracts:** `packages/contracts` (`SceneVersionSummary`, `SceneVersionCheckpoint`, `CreateSceneVersionInput`)

---

## 1. Goal & Requirements

Enterprise production teams need full governance over design revisions, preventing catastrophic data loss, providing release checkpoints, and allowing instantaneous rollback to known good states:

1. **Named Milestone Checkpoints (`CreateCheckpointModal` / `⌘⇧S`):**
   - Designers can snapshot the current scene document with a human-readable title (e.g., *"Sprint 42 Final Review"*, *"Before Navigation Rework"*, *"Release Candidate 1"*) and an optional markdown description.
   - Automatically stores the author, timestamp, composition thumbnail hash, and exact `CompositionScene` JSON tree.

2. **Automated Background Checkpoints:**
   - Background checkpoint created automatically every 30 minutes of active editing, or immediately before major destructive operations (e.g. Bulk Page Deletion, Master Unlinking, Full Layout Restructure).
   - Automated checkpoints are labeled *"Auto-save Checkpoint"* to distinguish them from deliberate designer milestones.

3. **Revisions Drawer & Visual Timeline (`EditorHistoryDrawer`):**
   - Chronological timeline sidebar tab or drawer (`History` / `Versionen`).
   - Grouped by date (*Today*, *Yesterday*, *Last Week*, *Older*).
   - Filter chips: `All`, `Named Milestones Only`, `My Saves`.
   - Card metadata: Checkpoint name, author avatar & name, relative timestamp, number of pages, and thumbnail.

4. **Point-in-Time Restore & Safety Fork:**
   - **Preview Mode:** Clicking a historical checkpoint loads a read-only preview of that exact state onto the canvas without mutating the current working document. A prominent top bar banner warns: *"Viewing version from Sep 7, 2026 — Read Only"*.
   - **Restore Action:** Clicking *"Restore this version"* presents a confirmation dialog. Upon confirmation:
     1. Automatically snapshots the *current* state as an emergency backup checkpoint (*"Pre-restore safety snapshot"*).
     2. Replaces `history.present` with the checkpoint scene tree.
     3. Commits to the scene store with an incremented version counter.

---

## 2. Data Model

Contracts defined in `@zaoly/contracts`:

```typescript
export interface SceneVersionSummary {
  id: string
  sceneId: string
  versionNumber: number
  name: string
  description?: string
  isAutoSave: boolean
  author: {
    id: string
    name: string
    avatarUrl?: string
  }
  pageCount: number
  nodeCount: number
  createdAt: string
}

export interface SceneVersionCheckpoint extends SceneVersionSummary {
  snapshot: CompositionScene
}

export interface CreateSceneVersionInput {
  name: string
  description?: string
  isAutoSave?: boolean
}
```

---

## 3. Storage & Persistence

1. **Postgres Storage (`ZAOLY_DATABASE_URL`) — production SSOT (W3):**
   - Table `scene_versions` (aligned with `scenes` / `scene_op_audit` naming):
     - `id` (TEXT primary key)
     - `scene_id` (TEXT, scene id)
     - `version_number` (integer sequential per scene)
     - `name` (TEXT)
     - `description` (TEXT)
     - `is_auto_save` (boolean)
     - `author_json` (jsonb)
     - `page_count` / `node_count` (integer)
     - `snapshot` (jsonb `CompositionScene`)
     - `created_at` (timestamptz)
   - Spec: `specs/domain/version-store-durable-w3.md`
2. **File Store Fallback:**
   - When running without Postgres, stored as `{ZAOLY_VERSION_STORE_PATH|paths.sceneVersionsStoreRelPath}/:sceneId/:versionId.json`.
3. **Backup:** `knowledge/backup-rollback.md` — Coolify Postgres dumps cover scenes + versions.

---

## 4. UI & Platform Integration

### Web (`apps/web`)
- **Drawer Component:** `apps/web/components/editor-history-drawer.tsx`.
- **Checkpoint Modal:** `apps/web/components/editor-save-checkpoint-dialog.tsx` triggered by `⌘⇧S` or Topbar menu item.
- **Preview Banner:** `apps/web/components/editor-history-preview-banner.tsx`.

### macOS Native (`apps/macos`)
- **Native Drawer:** `NativeHistoryDrawer.swift` toggled via `View` -> `Show Version History` (`⌥⌘H`).
- **Native Sheet:** `NativeSaveCheckpointSheet.swift`.
- **Menu Items:** File -> `Save Version Checkpoint...` (`⌘⇧S`) and `Revert to Version...`.

---

## 5. Related

- `specs/api/scene-versions.md`
- `specs/domain/editor-workspace.md`
- `specs/domain/composition-scene.md`
- `packages/contracts`

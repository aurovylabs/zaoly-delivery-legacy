# Visual Version Diffing & Change Summary — CREATION v3 (P117)

**Status:** Accepted · **Date:** 2026-09-08  
**Context:** Enterprise design revision comparison, AST node diffing, and visual change highlights across Web (`apps/web`) and macOS Desktop Native (`apps/macos`).  
**Parent:** `specs/domain/editor-workspace.md` · `specs/domain/editor-version-history.md`  
**Contracts:** `packages/contracts` (`NodeDiffKind`, `PropertyDiff`, `SceneNodeDiff`, `SceneDiffResult`)

---

## 1. Goal & Requirements

Enterprise teams require visual clarity on exact changes introduced between design versions before approving releases or reverting historical checkpoints:

1. **AST Structural Node Comparison:**
   - Evaluates nodes by unique ID (`node.id`).
   - Categorizes every node into:
     - **`added`** (`+`): Exists in the target version, but was absent in the base version.
     - **`removed`** (`-`): Existed in the base version, but is absent in the target version.
     - **`modified`** (`~`): Exists in both versions, but properties, styles, token bindings, or child order have mutated.
     - **`unchanged`**: Identical configuration and subtree.

2. **Property-Level Diffing (`PropertyDiff`):**
   - Inspects props, styles, and token bindings.
   - For every modified field, stores: `field` name, `oldValue`, and `newValue`.
   - Distinguishes literal edits (e.g. `gap: "16px"` -> `"24px"`) from token binding reassignments (e.g. `color: "brand.primary"` -> `color: "brand.accent"`).

3. **Multi-Page Aggregate Metrics:**
   - Computes document-level totals: `addedCount`, `removedCount`, `modifiedCount`.
   - Breaks down changes per page (`pageId`, `pageName`).

4. **UI Integration:**
   - **History Drawer Integration:** Clicking "Compare with Current" on any checkpoint in `EditorHistoryDrawer` / `NativeHistoryDrawer` expands a collapsible change summary.
   - **Diff Summary Pill:** Displays a compact color-coded pill: `+4` (Emerald), `-1` (Rose), `~6` (Amber).
   - **Canvas Highlight Overlays:** Optional diff visualizer draws dashed borders around affected elements on canvas (Green for added, Amber for modified).

---

## 2. Data Model

Contracts in `@zaoly/contracts`:

```typescript
export type NodeDiffKind = 'added' | 'removed' | 'modified' | 'unchanged'

export interface PropertyDiff {
  key: string
  kind: 'prop' | 'style' | 'tokenBinding'
  oldValue: unknown
  newValue: unknown
}

export interface SceneNodeDiff {
  nodeId: string
  type: string
  name?: string
  kind: NodeDiffKind
  propertyDiffs: PropertyDiff[]
}

export interface PageDiffSummary {
  pageId: string
  pageName: string
  addedCount: number
  removedCount: number
  modifiedCount: number
  nodeDiffs: SceneNodeDiff[]
}

export interface SceneDiffResult {
  baseSceneId: string
  targetSceneId: string
  totalAdded: number
  totalRemoved: number
  totalModified: number
  pages: PageDiffSummary[]
}
```

---

## 3. Related

- `specs/domain/editor-version-history.md`
- `apps/web/lib/scene/scene-diff.ts`
- `apps/macos/Sources/CREATIONApp/Models/SceneDiff.swift`
- `packages/contracts`

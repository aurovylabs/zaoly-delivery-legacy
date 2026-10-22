# Direct Canvas Drag & Drop and Sibling Reordering — CREATION v3 (P102)

**Status:** Accepted · **Date:** 2026-09-06  
**Context:** Interactive direct-manipulation layout reordering on the infinite canvas across Web (`apps/web`) and macOS Desktop Native (`apps/macos`).  
**Parent:** `specs/domain/editor-workspace.md` · `specs/domain/scene-board.md`

---

## 1. Goal & Direct Manipulation Model

Users should be able to reorganize components and layout structures directly on the visual canvas by dragging any node, previewing its destination with a high-fidelity drop indicator line, and releasing it to reorder among siblings or insert into containers:

1. **Drag Initiation (`dragstart` / Pointer Drag):**
   - Initiated when dragging a canvas element (holding mouse button and moving past a 4px threshold).
   - Canvas panning is deferred when dragging a node.
   - The dragged node is styled with reduced opacity (`opacity: 0.4`) on the canvas.
   - A floating **Ghost Preview Badge** follows the cursor:
     `[ ☷ Heading: "Hero Title" ]` with dark glassmorphism background and brand accent border.

2. **Sibling Boundary Hit-Testing & Drop Indicator Lines:**
   - As the pointer hovers over candidate sibling nodes or container zones:
     - **Vertical Stacks & Block Containers (`direction: column`):**
       - If hovering top 50% of sibling: renders a glowing horizontal insertion line **above** the sibling.
       - If hovering bottom 50% of sibling: renders a glowing horizontal insertion line **below** the sibling.
     - **Horizontal Stacks (`direction: row`):**
       - If hovering left 50% of sibling: renders a glowing vertical insertion line to the **left** of the sibling.
       - If hovering right 50% of sibling: renders a glowing vertical insertion line to the **right** of the sibling.
     - **Empty Containers / Append:**
       - If hovering an empty container or past the last child: renders the drop line inside the container boundary.
   - **Indicator Styling:**
     - 2px line in brand accent `#1f44ff` with subtle glow (`box-shadow: 0 0 8px rgba(31, 68, 255, 0.6)`).
     - Circular anchor endpoints (4px radius dots) at each end of the line.

3. **Drop Action & Scene Mutation (`move_node` / `reorder_children`):**
   - On release (`drop` / pointerup):
     - Calculates new parent and sibling index.
     - Commits an atomic scene operation via `moveNode(in:nodeId:targetParentId:index:)` or `applySceneOp({ type: 'move_node', nodeId, targetParentId, index })`.
     - Preserves undo/redo history.
     - Restores element opacity and clears drop indicators.

---

## 2. Parity Across Platforms

### Web (`apps/web`)
- HTML5 Drag & Drop or Pointer-event tracking mounted in `apps/web/components/scene-node-view.tsx` and `apps/web/components/canvas-drop-indicator.tsx`.
- Drag state managed in `apps/web/components/editor-workspace.tsx`.
- `dropEdgeFromPoint` accepts optional X-axis geometry and uses it for `direction: row`; legacy Y-only callers remain valid.
- Canvas nodes are draggable in board and single-artboard modes while neither Master edit nor Hand/pan mode is active.

### macOS Native (`apps/macos`)
- WebKit canvas renderer (`NativeSceneHTMLRenderer.swift`):
  - Injects native drag listeners (`ondragstart`, `ondragover`, `ondragleave`, `ondrop`).
  - WebKit coordinates translated to drop indicator overlay.
  - Posts message `window.webkit.messageHandlers.creationNative.postMessage({ type: "reorder_node", payload: { nodeId, targetId, position } })`.
  - **Label pills** (`#creation-drop-line-label`): floating `INSERT BEFORE` / `INSERT AFTER` pill centered on the insertion line (brand accent `#1f44ff`, bold uppercase, glowing shadow).
  - **Inside badges** (`.creation-drop-inside-badge`): floating `↳ INTO [TYPE]` badge docked at top-right corner when hovering a container drop target (dashed outline + translucent fill).
- Scene Reducer (`SceneReducer.swift`):
  - Implements `reorderNode(in:nodeId:targetId:position:)` preserving node tree integrity.
  - **Index shift fix**: when the dragged node was earlier in the same parent's children array, the target insertion index is decremented by 1 to compensate for the removal offset.

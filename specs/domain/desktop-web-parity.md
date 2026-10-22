# Domain Spec: Zaoly Desktop Web-Parity & Native Runtime

**Product:** Zaoly Desktop  
**Status:** In-flight (Spec-Driven Architecture & Parity Wave)  
**Target Platforms:** macOS 14+ (WKWebView), Windows 10/11 (WebView2), Linux (WebKitGTK)  
**Runtime Model:** Tauri v2 Native Host (Rust Core) + React 19 / Vite Frontend Engine (`@zaoly/ui` + `@zaoly/contracts`)  
**Related Specs:** `specs/domain/desktop-tauri-cross-platform.md`, `specs/domain/editor-workspace.md`, `specs/domain/editor-inspect.md`, `specs/domain/canvas-smart-hud.md`, `specs/domain/composition-scene.md`, `specs/domain/zaoly-token-studio.md`

---

## 1. Executive Summary & Problem Statement

### 1.1 The Gap
A prototype vanilla DOM/TypeScript shell in `apps/desktop` previously provided a rudimentary 8-action reducer and basic canvas/inspector controls. However, it lacked 95% of the capabilities, visual polish, and design fidelity of `apps/web`:
- Missing multi-select marquee, spatial alignment, distance guides, and box model overlays.
- Missing Token Studio with DTCG brand variables, bezier curves, and color harmonies.
- Missing Master component system with variant matrix and axes.
- Missing advanced inspector groups (CSS Grid builder, 4-sided box model pads, linear/radial gradient angles, slant/clip-path, pseudo-states :hover/:focus/:active).
- Missing preflight a11y linter, version history checkpoints, and code export dialogs.

### 1.2 The Solution
Zaoly Desktop achieves **100% functional and aesthetic parity** by directly utilizing the production React 19 workspace engine powered by `@zaoly/ui` and `@zaoly/contracts` inside a lightweight Tauri v2 desktop shell. Rather than maintaining a divergent, hand-crafted vanilla HTML/JS imitation, `apps/desktop` hosts the shared `@zaoly/ui` design system and workspace components via Vite, while delegating storage, system menus, file associations, and native dialogs to a native Rust IPC core.

---

## 2. Desktop Architecture & Layering

```
┌────────────────────────────────────────────────────────────────────────┐
│                        apps/desktop (Tauri v2)                         │
├────────────────────────────────────────────────────────────────────────┤
│  NATIVE RUST CORE (src-tauri)                                          │
│  - OS System Menus & Global Keyboard Accelerators (⌘N, ⌘O, ⌘S, ⌘Z, ⌘K) │
│  - Native Dialogs (Open, Save As, Export destination)                 │
│  - Direct Local File System I/O (.zaoly / .creation)                   │
│  - OS File Association & Startup Document Routing                     │
│  - Window Frame, Vibrancy & State Persistence                          │
├────────────────────────────────────────────────────────────────────────┤
│  DESKTOP RUNTIME ADAPTER (TypeScript Bridge)                           │
│  - DesktopSceneStorageAdapter: Replaces HTTP /api/scenes with IPC I/O  │
│  - DesktopTokenPackAdapter: Local DTCG brand token persistence         │
│  - NativeMenuRouter: Bridges menu IPC events to React action handlers  │
├────────────────────────────────────────────────────────────────────────┤
│  FULL REACT 19 / VITE CLIENT WORKSPACE                                 │
│  - Canvas Engine (@zaoly/ui CanvasViewport + Overlays + Smart HUD)     │
│  - Left Rail (Components Palette + In-Scene Masters + Token Studio)    │
│  - Right Rail (Multi-Section Inspector: Design & CSS Tabs)             │
│  - Single-Line Topbar Chrome (Pill HUD + Thematic Menu Dropdowns)       │
│  - Operations Engine (@zaoly/contracts SceneOp + 100-level Undo/Redo)  │
│  - Specialized Dialogs (Code Export, Linter, History, Asset Library)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Fine-Grained Capability & Component Parity Matrix

The following table details every single subsystem and its parity requirement between `apps/web` and `apps/desktop`:

| Subsystem | Web Component (`apps/web`) | Desktop Parity Implementation | Desktop Status |
| :--- | :--- | :--- | :--- |
| **Workspace Orchestrator** | `EditorWorkspace.tsx` (1,579 lines) | Pure React 19 Client Root with `DesktopWorkspace` wrapper | **Landed** |
| **Scene State & Reducer** | `useEditorSceneState.ts` (1,416 lines) | `useDesktopScene.ts` + `DesktopSceneStorageAdapter` | **Landed** |
| **Operations Engine** | `apps/web/lib/scene/ops.ts` (2,677 lines) | 100% shared from `@zaoly/contracts` + `scene-reducer.ts` | **Landed** |
| **Canvas Viewport** | `CanvasViewport.tsx` (`@zaoly/ui`) | Pan (10%-250%), Zoom cluster, Space+Drag | **Landed** |
| **Selection Model** | `useEditorSelection.ts` / Set<string> | Single-click, Shift-click multi-select, Canvas Marquee drag | **Landed** |
| **Spatial Align & Distribute** | `lib/scene/spatial-align.ts` | Align Left/Center/Right/Top/Middle/Bottom, Distribute H/V in HUD | **Landed** |
| **Selection Handles** | `SelectionHandles.tsx` (`@zaoly/ui`) | Interactive bounding box with selection outline | **Landed** |
| **Distance Guides Overlay** | `CanvasDistanceGuides.tsx` | Red distance guides and pixel measurements on Alt/Option hover | **Landed** |
| **Box Model Overlay** | `CanvasBoxModelOverlay.tsx` | Visual padding (green) and margin (orange) bands overlay | **Landed** |
| **Drop Indicator Overlay** | `CanvasDropIndicator.tsx` | Native OS Drag & Drop ingestion highlight on canvas | **Landed** |
| **Minimap** | `SceneBoardMinimap.tsx` | Floating interactive radar minimap for spatial canvas navigation | Planned |
| **Responsive Board** | `breakpoint-board.ts` / Compare mode | Desktop (1440), Tablet (768), Mobile (390) breakpoint switcher | **Landed** |
| **Scene Board Mode** | `scene-board.ts` / `EditorPagesList` | Multi-artboard page strip with inline rename & duplicate | **Landed** |
| **Inline Canvas Text Edit** | `inline-canvas-text-edit.tsx` | Double-click text to inline edit | **Landed** |
| **Floating Smart HUD** | `canvas-floating-hud.tsx` (21 KB) | Floating Smart HUD: Comp, Dup, Stack, Grid, Swatches, Multi-Align | **Landed** |
| **Right-Click Context Menu** | Web: `use-editor-context-menu` · Prototype: `DesktopContextMenu` | Production shell inherits web canvas menu; prototype Dup/Delete/Wrap/Master | **Landed** |
| **Docked / Floating Rails** | `EditorPanelRail.tsx` / `editor-panel-chrome.ts` | Docked sidebar rails with responsive flex layout | **Landed** |
| **Left Rail: Component Palette** | `ComponentPalette.tsx` (`@zaoly/ui`) | Grouped Layout, Forms, Feedback, Typography + search filter | **Landed** |
| **Left Rail: Masters List** | `EditorMastersPanel.tsx` | In-scene Masters list, insert instance, detach, delete | **Landed** |
| **Left Rail: Layers Tree** | `EditorLayers.tsx` / `LayersPanel.tsx` | Hierarchy tree, icons, collapse chevrons, eye (hide), lock (padlock) | **Landed** |
| **Left Rail: Pages List** | `EditorPagesList.tsx` | Multi-page artboard tabs with add, rename, duplicate, delete | **Landed** |
| **Left Rail: Token Studio** | `EditorTokenStudio.tsx` (40 KB) | Brand Token Studio with swatches, DTCG paths, 1-click copy | **Landed** |
| **Inspector: Design & CSS Tabs** | `inspector-design-panel.tsx` / `inspector-css-panel.tsx` | Design property controls + live computed CSS stylesheet view | **Landed** |
| **Inspector: Pseudo-States** | `inspector-state-bar.tsx` | Live preview for `:hover`, `:focus`, `:active`, `:disabled` states | Planned |
| **Inspector: Data Bindings** | `inspect-data-bind-field.tsx` | Collection field bindings with token resolver | Planned |
| **Inspector: Size Box** | `inspect-size-box-group.tsx` | Width/Height auto and fixed dimension controls | **Landed** |
| **Inspector: Layout Flow** | `inspect-layout-flow.tsx` | Flex direction (Row/Col), Gap, Align, Justify | **Landed** |
| **Inspector: CSS Grid Builder** | `inspect-grid-group.tsx` (12 KB) | Grid presets (Equal, Responsive, Splits), cell park, advanced | **Landed** |
| **Inspector: Box Model Pads** | `inspect-box-model-group.tsx` | 4-sided interactive padding and margin box model pads | **Landed** |
| **Inspector: Typography** | `inspect-typography-group.tsx` | Google Fonts picker, font size, weight, color, text copy | **Landed** |
| **Inspector: Fill & Gradients** | `inspect-fill-group.tsx` (23 KB) | Solid color picker + Native EyeDropper API pixel sampler | **Landed** |
| **Inspector: Effects & Shadows** | `inspect-appearance-effects.tsx` | Box shadow input + live opacity slider | **Landed** |
| **Inspector: Clip & Slant** | `inspect-clip-slant-group.tsx` (15 KB) | Angled cuts, skew transforms, clip-path presets | Planned |
| **Inspector: Overrides Badges** | `inspect-bp-elsewhere-badges.tsx` | Visual badges indicating breakpoint overrides with 1-click reset | **Landed** |
| **Inspector: Promote to Master** | `inspector-promote-dialog.tsx` | Convert selected subtree to reusable scene Master | **Landed** |
| **Single-Line Topbar Chrome** | `EditorTopbarChrome.tsx` | Unified HUD topbar with breakpoint switcher, zoom, dirty indicator | **Landed** |
| **Code Export Dialog** | `EditorCodeExportDialog.tsx` | React TSX + Tailwind, Semantic HTML + CSS, JSON export + pack media `@media` | **Landed** |
| **Add page (artboard size)** | `EditorAddPageDialog.tsx` | Desktop/Tablet/Mobile or custom W×H (production shell); prototype `DesktopAddPageDialog` | **Landed** |
| **Print / Magazin** | Magazin PDF / Magcloud / magazine-templates | Desktop API interceptor returns **410** `print_out_of_scope` | **Landed** |
| **Asset Library Dialog** | `EditorAssetLibraryDialog.tsx` | Ingestion and management of media assets + OS file drag-drop | **Landed** |
| **Preflight Linter & A11y** | `EditorLinterPanel.tsx` (15 KB) | Contrast checker, missing tokens, broken bindings, i18n/RTL sim | Planned |
| **History & Checkpoints** | `EditorHistoryDrawer.tsx` (13 KB) | Named milestone checkpoints, diff view, restore version | Planned |
| **Quick Command Palette** | `⌘K` Spotlight launcher | Fuzzy search across editor actions, component palette, page jump | Available |
| **Native Screen EyeDropper** | `window.EyeDropper` | Native desktop pixel color sampler on all Inspector color fields | Available |
| **Native System Menus** | `src-tauri/src/menu.rs` → `AppShell` `native-menu-action` | File/Edit/View accelerators → adapter I/O + synthetic keydowns into web `EditorWorkspace` | **Landed** |
| **Native File I/O (.zaoly)** | `src-tauri/src/commands.rs` | Fast native open/save dialogs, direct disk reading/writing | Available |

---

## 4. Architectural Strategy & Implementation Approach

### 4.1 Reusing the Production React Engine
Rather than writing an isolated third implementation of UI components:
1. `apps/desktop` will be configured as a **Vite + React 19** application within the monorepo.
2. It imports `@zaoly/ui`, `@zaoly/contracts`, and `@zaoly/site-kit` directly.
3. It imports the production editor stylesheet (`@zaoly/ui/styles.css` and corporate tokens) to guarantee pixel-perfect visual styling, typography, and dark-mode aesthetics.
4. It mounts the modular components from `apps/web/components/editor/` or a dedicated shared workspace client.

### 4.2 Desktop Storage Adapter (`DesktopSceneStorageAdapter`)
In `apps/web`, persistence communicates with Next.js BFF endpoints (`PUT /api/scenes/:id`, `PATCH /api/brand-tokens`).  
In `apps/desktop`, all persistence operations route through a local desktop storage adapter:
- **Save Scene:** Encodes `CompositionScene` to JSON and invokes Tauri Rust command `save_scene_file` or writes to active file path.
- **Open Scene:** Invokes Tauri command `open_scene_file` via native OS file dialog, parses JSON into `CompositionScene`, and dispatches to history stack.
- **Autosave:** Maintains local debounce to active `.zaoly` file path without network overhead.
- **Local Brand Tokens:** Reads and writes to local `.zaoly-tokens.json` in project directory.

### 4.3 Native Menu & Keyboard Event Bridge
Tauri Rust host emits native menu events via Tauri window event listener:
```typescript
import { listen } from '@tauri-apps/api/event';

listen<string>('native-menu-action', (event) => {
  switch (event.payload) {
    case 'new_document': onNewDocument(); break;
    case 'open_document': onOpenDocument(); break;
    case 'save_document': onSaveDocument(); break;
    case 'save_as_document': onSaveAsDocument(); break;
    case 'export_document': onExportDocument(); break;
    case 'quick_palette': onToggleQuickPalette(); break;
    case 'undo': onUndo(); break;
    case 'redo': onRedo(); break;
    case 'duplicate': onDuplicate(); break;
    case 'zoom_in': onZoomIn(); break;
    case 'zoom_out': onZoomOut(); break;
    case 'zoom_reset': onZoomReset(); break;
  }
});
```

---

## 5. Phased Rollout Plan

- **Phase 1: Foundation & Dependencies (`apps/desktop`) — Landed 2026-10-10**
  - Configure `apps/desktop/package.json` with React 19, `@zaoly/ui`, `@zaoly/contracts`, `@zaoly/site-kit`, and DS CSS assets.
  - Update `apps/desktop/vite.config.ts` with path aliases for `@zaoly/ui`, `@zaoly/contracts`, and editor barrels.
  - Set up `AppShell` and `RootProviders` (theme via `applyThemePreference`) for desktop runtime — `src/main.tsx` · `src/app/*`.

- **Phase 2: Desktop Workspace Shell & Adapter**
  - Create `DesktopWorkspace.tsx` and `useDesktopSceneState.ts`.
  - Implement `DesktopSceneStorageAdapter` bridging `.zaoly` file I/O and Tauri IPC.
  - Boot default starter scene (`createZaolyDefaultLandingScene`).

- **Phase 3: Canvas Subsystem Parity**
  - Mount `CanvasViewport` with pan/zoom navigation.
  - Enable selection handles, distance guides, box model overlays, and drop indicators.
  - Enable Contextual Floating Smart HUD and right-click Context Menu.
  - Enable in-place canvas text editing (`InlineCanvasTextEdit`).

- **Phase 4: Left Rail & Right Inspector Parity**
  - Mount dockable/floating left rail (`ComponentPalette`, `EditorMastersPanel`, `EditorLayers`, `EditorPagesList`, `EditorTokenStudio`).
  - Mount dockable/floating right rail (`EditorInspector` with Design and CSS tabs, pseudo-states, Grid builder, Box model, Fill & Gradients, Slant/Clip).

- **Phase 5: Topbar, Modals & Native Integrations**
  - Single-line HUD topbar with Breakpoints switcher, Print presets, Zoom, and thematic menus.
  - Modals: Code Export dialog, Preflight Linter panel, Asset Library dialog, History drawer.
  - OS drag-and-drop file ingestion into canvas.
  - Screen EyeDropper API integration.

- **Phase 6: Test Verification & Release Build**
  - Unit tests for desktop reducer, ops engine, and file storage adapter.
  - Verify complete build with `npm run build:desktop` (`tauri build`).
  - Test on macOS native bundle (`Zaoly.app`).

---

## 6. Acceptance Criteria

1. **Visual Parity:** Zaoly Desktop renders identical typography (Geist), dark theme palette, glassmorphic HUDs, and component aesthetics as `apps/web/editor`.
2. **Operations Parity:** All 30+ atomic `SceneOp` transformations (insert, remove, reorder, wrap, unwrap, master variants, axes, pages) execute identically without errors.
3. **Canvas Parity:** Multi-select marquee, spatial alignment, distance guides, box model overlays, and floating Smart HUD are fully interactive.
4. **Inspector Parity:** All 12 inspector groups (Position, Flow, Grid, Size, Box Model, Typography, Fill & Gradients, Effects, Slant/Clip, Pseudo-states, Badges) provide real-time canvas updates.
5. **Token Studio Parity:** Left rail Tokens tab displays live brand tokens, color swatches, and bezier curves with drag-to-canvas binding.
6. **Native System Integration:** File Open, Save, Save As (`.zaoly`), native menus with `⌘`-shortcuts, and quick command palette (`⌘K`) operate smoothly offline.

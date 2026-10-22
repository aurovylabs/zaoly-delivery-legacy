# Domain Spec: macOS Native App & Bridge

**Product:** CREATION v3  
**Status:** In-flight (Native Desktop Parity Wave)  
**Target:** macOS 14.0+ / 15.0+  
**Related Specs:** `specs/domain/app-shell.md`, `specs/domain/home-magazine.md`, `specs/domain/compositions-hub.md`, `specs/domain/site-kit-playground.md`, `specs/domain/library-hub.md`, `specs/domain/project-workspace.md`

---

## 1. Overview

The macOS native app for CREATION provides a premium, native desktop shell around the `@zaoly/ui` composition runtime and its native SwiftUI/WebKit canvas engine. It leverages SwiftUI, AppKit, and WebKit (`WKWebView`) to deliver:
- Native menu bar integration (Undo/Redo, Zoom, Export, Canvas controls).
- Direct file association with `.creation` and `.zaoly` scene documents.
- Window management with unified titlebar/toolbar and full-bleed overlay chrome.
- Full functional and visual parity with the CREATION v3 Web AppShell and domain hubs.
- Bidirectional communication via `webkit.messageHandlers.creationNative`.

---

## 2. JavaScript / Web Bridge Interface

The web editor exposes a bridge listener and dispatches events to macOS WebKit handlers:

```typescript
export interface CreationNativeBridgeMessage {
  type: 'zoom_in' | 'zoom_out' | 'zoom_reset' | 'undo' | 'redo' | 'export_html' | 'export_pdf' | 'load_document'
  payload?: any
}
```

Incoming events to Swift:
```typescript
window.webkit?.messageHandlers?.creationNative?.postMessage({
  type: 'scene_updated',
  sceneId: string,
  dirty: boolean,
  selectedNodeId: string | null
})
```

---

## 3. Native File Format

- **File extension:** `.creation`
- **UTType:** `com.zaoly.creation.document`
- **MIME type:** `application/json`
- **Schema:** Follows `CompositionScene` from `@zaoly/contracts`.

---

## 4. Native AppShell & Navigation Architecture

Following `specs/domain/app-shell.md`, the macOS native app replicates the Web AppShell structure:

### 4.1 Primary Navigation Strip (`creation-top-nav`)
- **Position:** Top-left horizontal pill strip, positioned cleanly beside the macOS traffic lights (reserve width ~76px).
- **Style:** Capsule pill with `.ultraThinMaterial` / `ZaolyTheme.surface1`, subtle border stroke (`ZaolyTheme.lineSubtle`), height `36-40px`.
- **Items:** MUST be **icon-only**; visible text labels MUST NOT appear in the pill.
  - `home` (`house.fill`) → Home Magazine
  - `projects` (`folder.fill`) → Projects Hub
  - `compositions` (`square.stack.3d.up.fill`) → Compositions Hub
  - `library` (`books.vertical.fill`) → Library Hub
  - `kit` (`slider.horizontal.2.square.badge.arrow.down`) → Kit Playground
  - `settings` (`person.crop.circle.fill` / Avatar) → Settings Page
- **Tooltips:** Every icon MUST provide a tooltip and accessibility description.

### 4.2 Topbar Trail & Overlay (P102 / W-SHELL-CANVAS-BLEED)
- **Overlay Topbar:** In editor mode, the canvas MUST run **full-bleed** to the top edge of the window under a floating, transparent overlay chrome (no rigid solid 48px header block offsetting the canvas).
- **Centered Editor Trail:** When in `.editor` route, the center of the topbar hosts the primary tools & actions:
  - Tools: Undo, Redo, Save Checkpoint, Review Menu (Linter, Diff, Preflight A11y), Export Menu (HTML, PDF, Code).
  - Actions: Breakpoint selector (Desktop / Tablet / Mobile), Zoom controls (`-`, `100%`, `+`), Fit to screen, Site Kit center.

### 4.3 BrandCorner Product Launcher (Top-Right)
- **Position:** Top-right corner, always on across all hubs and editor.
- **Label:** `CREATION` with `v3` badge.
- **Action:** Interactive dropdown menu listing federated Plexon apps (Audion, Brandion, Storyblok Handoff, Plexon Cloud Console).

### 4.4 Platform Assistant Host
- Floating Action Button (FAB) in the bottom-right corner (`sparkles` icon) opening the platform Assistant Host drawer across all routes.

---

## 5. Native Domain Hubs Parity

### 5.1 Home Magazine (`NativeHomeMagazineView`)
Conforming to `specs/domain/home-magazine.md`:
- **Editorial Cover:** Large bold `CREATION` brand wordmark hero.
- **01 · Launch:** Capability launch tiles:
  - *Projects* (Collection management & sync)
  - *Compositions* (Scene documents & editor)
  - *Library* (Site Kit components & patterns)
- **02 · Recent Activity Columns:** Three equal columns:
  - *Recent Projects:* Last edited collections with sync indicators.
  - *Recent Compositions:* Live composition summaries with 1-click open in editor.
  - *Recent Library:* Published Site Kit components & Storybook links.

### 5.2 Compositions Hub (`NativeCompositionsHubView`)
Conforming to `specs/domain/compositions-hub.md`:
- **Live Scene Store Synchronization:** Compositions Hub MUST query the active scene persistence store via `GET /api/scenes` (with fallback to `/api/compositions` and `SceneCatalog`), ensuring that newly created, edited, and imported compositions from server/web are immediately fetched and visible.
- **Sorting:** Compositions MUST be sorted by `updatedAt` descending (most recent first).
- **Layout Modes:** Interactive Cards / List switch.
- **Cards View:** Live card previews with miniature HTML/WebKit rendered viewports, title, project badge, status tag (Draft / Ready / Archived), and last updated timestamp.
- **List View:** Dense tabular view for quick scanning and sorting.
- **Creation Dialog:** Modal to create a new blank `CompositionScene` bound to a selected Plexon Collection, persisting both locally and to `POST /api/scenes`.
- **Actions:** 1-click open into the native Editor runtime with live fetching from `GET /api/scenes/:id`.
- **Manual & Lifecycle Refresh:** Supports view task load, manual refresh button, and pull-to-refresh.

### 5.3 Kit Playground (`NativeKitPlaygroundView`)
Conforming to `specs/domain/site-kit-playground.md`:
- **Navigation Tree:** Structured hierarchy of:
  - *Atoms* (SiteButton, SiteInput, SiteBadge, SiteLink, SiteTypography)
  - *Layout* (SiteStack, SiteGrid, SiteContainer, SiteTable)
  - *Patterns* (Hero sections, Nav bars, Feature cards)
- **Interactive Sandbox Viewport:** Sandboxed live preview with desktop / mobile switch.
- **Inspector Pane:** Real-time props tweaking, variant switches, and token binding inspectors.
- **Storybook Integration:** Direct deep-link launch into Storybook CSF URLs.

### 5.4 Projects Hub & Library Hub Polish
- **Projects Hub:** Modern split view with collection status badges (`in_sync`, `pending`, `error`), composition counts, last activity date, and archive/edit triggers.
- **Library Hub:** Grid of published Site Kit components categorized by groups (Forms, Content, Layout) with Storybook deep-link tokens.

---

## 6. Visual Design System & macOS Native Polish

- **Vibrancy:** Extensive use of `NSVisualEffectView` / SwiftUI `.background(.ultraThinMaterial)` for floating bars, sidebars, HUDs, and modal dialogs.
- **Palette & Tokens:** Strict mapping to `@zaoly/ui` / Zaoly Theme tokens:
  - Surface hierarchy: `--bg-0`, `--bg-1`, `--surface-1`, `--surface-2`.
  - Border lines: `--line-subtle`, `--line`.
  - Accent / Brand: `--brand-primary` (#6366f1 / indigo), `--brand-accent` (#ec4899 / pink), `--brand-success` (#10b981).
- **Elevation Shadows:** Soft, multi-layered black-based drop shadows matching web `--creation-elevation-shadow*`.
- **Dark & Light Mode:** Seamless toggle between Dark, Light, and System modes.

---

## 7. Core Engine & Test Verification Requirements

1. **CSS Renderer Precision:** `NativeSceneHTMLRenderer` must generate valid, standards-compliant CSS with spaces (`key: value`), full support for CSS Grid containers (`grid-template-columns`, `grid-template-rows`, `grid-auto-flow`, `justify-items`, `align-items`) and child placement (`grid-column`, `grid-row`, `colStart`, `colEnd`, `justify-self`, `align-self`, `order`).
2. **Accessibility Linter Parity:** `SceneLinter` issues must carry canonical IDs (`a11y-icon-no-aria-*`, `a11y-touch-target-small-*`, `a11y-tab-discontinuous-*`) and auto-fix ops matching web rules.
3. **Lock Rejection:** `SceneReducer.moveNodeToPage` must reject moving locked nodes or children of locked ancestors.
4. **Storybook CSF Slug Normalization:** `CreationAPIClient` story URLs must match CSF naming conventions.
5. **Automated Test Gate:** All 95 tests in `CREATIONAppTests` must pass cleanly.

---

## 8. Detachable Floating Windows & Panel Docking Architecture (P64 / P74)

The macOS editor workspace supports true native multi-window docking and undocking for both side rails:

### 8.1 Rails & Capabilities
1. **Left Rail (`leftSidebarView`):**
   - Palette (Component catalog & search), Layers (Scene tree & hierarchy), Masters & Components.
   - Docked width: 240px; collapsible to 0px when detached.
2. **Right Rail (`inspectorSidebarView`):**
   - Node Inspector (Design, Dimensions, Grid, Flex, Fill & Stroke, Typography, Effects, Tokens, Interactions), Page Frame Inspector.
   - Docked width: 270px; collapsible to 0px when detached.

### 8.2 Native Window Specifications (`NSPanel`)
- Detached panels are hosted in native AppKit `NSPanel` utility windows with custom borderless/hidden titlebar chrome:
  - **Style Mask:** `[.titled, .closable, .resizable, .utilityWindow, .nonactivatingPanel]`.
  - **Custom Chrome (No Standard Traffic Lights):** Standard macOS traffic lights (`closeButton`, `miniaturizeButton`, `zoomButton`) are hidden via `standardWindowButton(_:).isHidden = true` and `titlebarAppearsTransparent = true`, `titleVisibility = .hidden`.
  - **Window Level:** `.floating` (floats conveniently above the canvas without stealing active application focus unnecessarily).
  - **Movable by Background:** `isMovableByWindowBackground = true`, allowing window dragging from custom header bar or background areas.
  - **Frame Persistence:** Persists user-adjusted window coordinates and dimensions across app launches via `setFrameAutosaveName("ZAOLY_LeftRailPanel")` and `setFrameAutosaveName("ZAOLY_RightRailPanel")`.
  - **Multi-Monitor:** Can be moved completely outside the main document window, onto secondary monitors or side screens.

### 8.3 Interaction, Drag-to-Detach & Snap Redocking (P64 / P66)
- **Custom Header Controls:**
  - **Drag Handle Strip:** Custom branded header bar with icon, title, and drag area.
  - **Minimize / Collapse:** Custom toggle button (`minus` / `chevron`) to collapse the panel to header-only height.
  - **Dock Action:** Custom dock button (`arrow.down.right.and.arrow.up.left`) returning the panel to its home edge.
  - **Close Action:** Custom close button (`xmark`) which cleanly redocks the panel.
- **Drag-to-Detach Gesture:**
  - Dragging the docked panel header horizontally away from its home edge (`> 48px` displacement) automatically detaches the panel into a floating window positioned at the cursor.
- **Snap-to-Dock Zones:**
  - When dragging a floating panel near the home edge of the main editor window (`<= 48px` snap threshold), a translucent snap indicator overlay illuminates along the docking edge.
  - Releasing mouse in the snap zone immediately redocks the panel into the main workspace.
- **Keyboard Shortcuts (P74):**
  - `[` / `⌘[`: Toggle Left Rail undock / dock.
  - `]` / `⌘]`: Toggle Right Rail undock / dock.
  - `\` / `⌘\`: Redock all floating rails to main workspace.
- **Menu Bar Integration:** "View" / "Window" menus provide explicit commands for detaching and redocking rails.
- **Canvas Expansion:** When rails are detached, the center canvas view automatically and smoothly expands into the reclaimed horizontal space. When both rails are detached, the canvas fills the entire main window width.

### 8.4 Component Palette (Site Kit SSOT Parity)
- Conforming strictly to `specs/domain/site-kit.md` (Decision 4 & Requirement 3):
  - The native macOS component insertion palette (`NativePaletteSidebar`) MUST exclusively present canonical Site Kit atoms and layout containers from `@zaoly/site-kit` and `SITE_KIT_PALETTE_IDS`.
  - Non-SiteKit layers, legacy mock cards, and unsupported primitives (`Card`, `Panel`, `EmptyState`, `Spacer`, `Heading`, `Lede`, `Switch`, `Slider`, `Chip`, `Alert`, `Hint`, `Avatar`, `StatusDot`, `Spinner`, `MetricChip`, `Tabs`, `Accordion`) MUST NOT appear in the palette.
  - Grouping follows the web standard:
    - **Layout & Containers:** `SiteContainer`, `SiteStack`, `SiteGrid`, `SiteDivider`
    - **Typography & Content:** `SiteText`, `SiteLink`, `SiteBadge`, `SiteImage`, `SiteSvg`, `SiteChart`, `SiteGauge`, `SiteTable`
    - **Forms & Controls:** `SiteButton`, `SiteInput`, `SiteTextarea`, `SiteSelect`, `SiteCheckbox`
  - Node creation in `SceneNode.createDefault(for:)` MUST directly produce valid `SceneNode` instances matching the canonical `Site*` types.

### 8.5 Chart Studio Panel & Multi-Variant SVG Canvas Parity
- Conforming strictly to `specs/domain/chart-studio-panel.md` and `@zaoly/site-kit`:
  - Selecting or inserting a `SiteChart` node opens a dedicated floating **Chart Studio** panel (`NativeChartStudioPanel`).
  - **Panel Capabilities:**
    - **Kind Switcher:** 8 canonical variants: `bar`, `bar_horizontal`, `line`, `area`, `scatter`, `pie`, `donut`, `funnel`.
    - **Chrome:** Chart title and min-height controls.
    - **Series Table:** Structured series editing with label, value, categorical color swatch picker, move up/down, row deletion, and "+ Add Point".
    - **Marks:** Kind-specific styling controls:
      - `barGap` for bar, bar_horizontal, and funnel (0–48px).
      - `donutHole` for donut (0–85%).
      - `strokeWidth` and `pointRadius` for line and area.
      - `pointRadius` for scatter.
  - **Canvas SVG Engine:**
    - `NativeSceneHTMLRenderer` generates high-fidelity inline SVGs matching `packages/site-kit/src/components/Chart.tsx` for all 8 variants, honoring series colors, tick labels, and marks.
  - **Inspector Integration:**
    - `NativeInspectorSidebar` provides a quick teaser ("Open Chart Studio...") and kind selector without bloating the right rail.

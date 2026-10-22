# Domain Spec: Cross-Platform Desktop App (Tauri v2 + Rust)

**Product:** Zaoly  
**Status:** Active Implementation (Cross-Platform Standalone Wave)  
**Target Platforms:** Windows 10/11 (WebView2), Linux (WebKitGTK), macOS 14+ (WKWebView)  
**Architecture Model:** Option 2 — Standalone Native Desktop Shell with Rust Core and Pure Client Runtime  
**Parity:** `specs/domain/desktop-web-parity.md` (React 19 + `@zaoly/ui` host)  
**Related Specs:** `specs/domain/macos-editor-app.md`, `specs/domain/editor-workspace.md`, `specs/domain/composition-scene.md`

---

## 1. Executive Summary & Vision

Zaoly Desktop provides a self-contained, lightning-fast design tool application running natively on **Windows, Linux, and macOS**. It avoids dependency on a browser server process, delivering an offline-first desktop experience powered by **Tauri v2** and **Rust**.

### Key Architectural Pillars:
1. **Pure Desktop Independence:** Starts instantly without external servers or web services. All composition logic, document persistence, and undo/redo stacks operate locally.
2. **Rust Performance & System Hooks:** Rust manages file system I/O (`.zaoly`), native file dialogs, system menus, window states, and heavy serialization.
3. **Full Design Surface Parity:** Matches the advanced composition features of Zaoly Web while utilizing high-performance native desktop idioms (keyboard shortcuts, gesture zooming, context menus, and floating HUDs).

---

## 2. Desktop System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        apps/desktop (Tauri v2)                         │
├───────────────────────────────────┬────────────────────────────────────┤
│  Frontend Client Engine (Webview) │  Native Core (Rust)                │
│  - Multi-Tool Component Palette   │  - Window Management & Lifecycle   │
│  - Full Layers & Hierarchy Tree   │  - OS Menu & Shortcut Routing      │
│  - Interactive Canvas Engine      │  - Direct File I/O (.zaoly)        │
│  - Floating Contextual Smart HUD  │  - Native File Dialogs (Open/Save) │
│  - Multi-Section Inspector        │  - Scene Serialization & Validation│
│  - Undo/Redo History Stack (100+) │  - File Association Handlers       │
│  - Breakpoint & Page Switcher     │                                    │
│  - Code & Export Generation       │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│  macOS: WKWebView  │  Windows: WebView2  │  Linux: WebKitGTK           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Surface & Feature Parity Requirements

### 3.1 Component Palette
Supports rapid element insertion via click, drag, and search filtering:
- **Layout Containers:** `Stack` (Flexbox auto-layout), `Grid` (CSS Grid), `Container` (Generic box), `Card` (Feature card), `Spacer`, `Divider`, `ScrollArea`.
- **Content & Typography:** `Text` (Paragraph/Body), `Heading` (H1–H3), `Lede` (Display intro), `PageTitle`, `Link`, `Image` (Media asset), `Avatar` (Monogram/Profile).
- **Forms & Controls:** `Button` (Interactive action), `Input` (Text input), `Textarea` (Multi-line field), `Checkbox`, `Select` (Dropdown), `Switch` (Toggle), `Slider` (Range), `Chip` (Tag).
- **Feedback & Metrics:** `Badge` (Status pill), `Alert` (Callout), `Hint` (Field note), `Spinner` (Loader), `StatusDot` (Live indicator), `MetricChip` (KPI stat).
- **Pre-assembled Patterns:** `HeroPattern` (Full hero banner), `PricingCard` (Tier pricing table), `NavbarPattern` (Header nav), `FooterPattern` (Page footer).

### 3.2 Hierarchy & Layers Panel
- Full nested tree view of all scene nodes matching `@zaoly/contracts`.
- Visual node type icons (`◆` Instance, `⊞` Stack, `▦` Grid, `▣` Container, `🗂` Card, `H` Heading, `T` Text, `B` Button, `🖼` Image, `⎚` Input, `🏷` Badge, `✨` Pattern).
- **Collapsible Folders:** Expand/collapse chevron (`▾` / `▸`) for container nodes with live child count badges when collapsed (`(3)`).
- **Live Search Filter:** Quick search input filtering layers in real-time while preserving active ancestor hierarchy.
- Interactive selection with selection halo syncing with canvas.
- Node reordering (Move up / Move down), duplication, and deletion.

### 3.3 Multi-Page & Artboard Management (P80 Canonical Parity)
- Full support for `CompositionScene.pages` (`ScenePage[]`) and `activePageId`.
- Dedicated horizontal **Page Strip** above the canvas with active artboard tabs.
- 1-click page switching, inline double-click rename, page duplication, and deletion (safeguarding the sole remaining page).
- Dual-write synchronization maintaining active page root at `scene.root` on every mutation.

### 3.4 Interactive Canvas Engine & Asset Ingestion
- **Pan & Zoom:** Smooth scaling from 25% to 250% (`⌘+`, `⌘-`, `⌘0`, Space+Drag or middle click).
- **Artboard Frame:** Responsive canvas artboard reflecting the active breakpoint (Desktop: 1200px, Tablet: 768px, Mobile: 375px).
- **Node Selection & Hover Halos:** Precise hover outline and active node boundary handles.
- **In-Place Canvas Text Editing:** Double-clicking any text element (`Text`, `Heading`, `Button`, `Link`, `Badge`, `Lede`, `PageTitle`) activates inline `contenteditable` editing directly on canvas. `Enter` commits the text, `Esc` reverts without intrusive modal prompts.
- **Direct Asset Drag-and-Drop:** Dragging PNG, JPEG, SVG, or WebP files from Finder/Explorer onto the canvas immediately ingests the file as an `Image` node (or updates the selected image node).
- **Contextual Floating Smart HUD:**
  - Pinned directly above the selected node.
  - One-click actions: Master Component conversion (`◆ Comp`), Instance Detachment (`◇ Detach`), Duplicate (`⌘D`), Wrap in Stack, Wrap in Grid, Delete (`Backspace`), Move Up/Down, Quick color swatches.

### 3.5 Brand Token Studio Integration (/tokens Parity)
- Adheres to `knowledge/zaoly-starter-token-pack.md` and local pack administration.
- Dedicated **Tokens Panel** in the left rail tab displaying catalog leaves with live swatches and copyable DTCG paths.
- **Inspector Token Bindings:** Contextual dropdowns to bind element Fill, Text Color, Corner Radius, and Padding to named brand tokens (`color.action.primary`, `color.surface.base`, `spacing.md`, `radius.lg`).
- Persisted on node as `node.tokenBindings[propKey] = tokenPath`.

### 3.6 Multi-Section Inspector & Responsive Overrides (OP-9 Parity)
Categorized accordion controls with instant live canvas updates:
1. **Identity & Selection:** Node ID, Designer-facing label name.
2. **Image Asset:** Source URL/data, Alt description, Object-fit (Cover, Contain, Fill).
3. **Typography & Content:** Double-click editable copy, Google Fonts picker, Font size, Weight (400–800), Align, Text color.
4. **Brand Token Bindings:** Direct token picker for Fill, Text, Radius, and Padding.
5. **Auto-Layout & Flow:** Direction (`Row` vs `Column`), Justify, Align items, Gap spacing.
6. **Dimensions:** Width, Height (Auto, Fixed px, 100%), Min-Width, Min-Height.
7. **Box Model:** Padding, Margin.
8. **Appearance & Surface:** Background color, Border radius, Border width, Border color.
9. **Effects & Shadows:** Box shadow, Live opacity slider (0–100%).
10. **Breakpoint Mode Switch & Reset:** In Tablet/Mobile views, user can toggle between `⚡ OVERRIDE` (writes to `node.breakpoints[bp]`) and `BASE`. Active overrides trigger a visual alert with a 1-click `Reset` button to revert to base.

### 3.7 Master Components & Reusable Library (P82 Parity)
- Direct creation of reusable components from any selected canvas node via Floating HUD `◆ Comp`.
- Dedicated **Masters & Components** category in the Palette displaying saved master roots with layer counts.
- 1-click instance insertion from the Palette into the active artboard.
- Contextual instance detachment (`◇ Detach`) via Smart HUD.
- Live tree expansion on canvas ensuring full nested rendering and editing while preserving clean instance references in `.zaoly` documents.

### 3.8 Live Code Stream Drawer Split
- Real-time docked code drawer toggled via the `{ } Code` button in the topbar.
- Instant live stream generation of semantic **HTML + CSS** and **React TSX with Tailwind CSS**.
- One-click copy with visual toast confirmation.

### 3.9 History & Undo/Redo Engine
- 100-level deep undo/redo action stack storing immutable scene snapshots.
- Dual-path routing: native OS menu events (`listen('native-menu-action')`) + Webview keyboard accelerators (`⌘Z`, `⇧⌘Z`).

### 3.10 Export & Code Generation Modes
- **HTML + CSS:** Production-ready semantic markup with standalone stylesheet.
- **React + Tailwind CSS:** Modular TSX component using Tailwind utility classes (`flex`, `p-6`, `bg-slate-900`, `rounded-xl`).
- **Zaoly Contracts JSON:** Exact `CompositionScene` schema for headless pipeline integration.
- **Save to Disk:** Direct native file export dialog saving `.html`, `.tsx`, or `.json` to local disk.

### 3.11 Desktop Quick Command Palette (`⌘K` / `Ctrl+K`)
- Spotlight command launcher accessible via `⌘K`, topbar search icon, and native Edit menu.
- Unified fuzzy search across:
  - **Editor Actions:** New, Open, Save, Save As, Export, Toggle Code, Toggle Theme, Undo, Redo, Zoom, Page Artboards.
  - **Component Palette:** Direct 1-click insertion for all 32 components.
  - **Master Components:** Instant instantiation of user-created design library components.
  - **Page Jump:** Instant switching to any artboard page in the document.
- Full keyboard navigation (`↑`/`↓` to highlight, `↵` to execute, `Esc` to dismiss).

### 3.12 Native Screen EyeDropper API
- Integrated screen color sampling pipette button on all Inspector color fields (Text Color, Surface Fill, Border Color).
- Utilizes the native desktop `EyeDropper` API (`window.EyeDropper`) for sampling color values across any display pixel.

---

## 4. Native File Format (`.zaoly`)

- Extension: `.zaoly` (and legacy `.creation`).
- Schema conforms strictly to `CompositionScene` from `@zaoly/contracts`.
- Direct file open and save via native OS dialogs.

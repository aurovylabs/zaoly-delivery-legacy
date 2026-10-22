# Code Export Handoff & Design System / A11y Linter — CREATION v3 (P98 / P99)

**Status:** Accepted · **Date:** 2026-09-06 · **Related:** Kit component handoff on `/kit` — `specs/domain/site-kit-playground.md` SK-V10 (install/import/copy module) · **SK-V13** token-faithful Kit module (`var(--ds-*)` + `tokenBindings` export; no SwiftUI on `/kit`). Editor Export = **scene/page**; Kit Playground Handoff = **Site Kit component**.
**Context:** Developer handoff & design system quality audit across Web (`apps/web`) and macOS Desktop Native (`apps/macos`).  
**Parent:** `specs/domain/editor-workspace.md` · `specs/domain/editor-inspect.md`

---

## 1. Goal

Designers and engineers need immediate, production-grade code export and automated design quality checks directly inside the CREATION editor without switching tools or context:

1. **P98 — Multi-Language Code Generator Modal (`⌘E` / Topbar "Export"):**
   - **React 19 JSX**: Idiomatic React 19 code consuming `@zaoly/ui` design system primitives (`<Stack>`, `<Grid>`, `<Card>`, `<Text>`, `<Button>`, `<Image>`, `<Badge>`, `<Divider>`), dynamic import filtering (only importing used components), binding Brandion design tokens (`color="brand.action.primary"`), and standard CSS inline styles. Container background media (`backgroundImage`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`, `backgroundOverlay`) serialize cleanly into inline `style={{ backgroundImage: '...', ... }}` rather than raw HTML props.
   - **Tailwind CSS**: Translates layout and visual styling into standard utility classes (`flex flex-col gap-4 p-6 rounded-lg bg-zinc-900...`) including background images (`bg-[url('...')] bg-cover bg-center bg-no-repeat`).
   - **SwiftUI View Hierarchy**: Translates scene nodes into native SwiftUI (`VStack`, `HStack`, `LazyVGrid`, `Text`, `AsyncImage`, `.padding()`, `.background()`) including container background images via `.background(AsyncImage(...))`.
   - **Scope Selector**: Switch between **Selected**, **Entire Page**, and **All Pages** with full parity across Web (`EditorCodeExportDialog`) and macOS Native (`NativeExportPreviewSheet`).
   - **1-Click Actions**: **Copy Code** with visual checkmark/toast feedback. **Download File is out of scope** (removed on Web; Pattern SSOT uses Save page as Pattern — `page-as-pattern.md`).

2. **P99 — Design System & A11y Linter Panel:**
   - **Automated Scene Crawler**: Analyzes active composition or selection.
   - **WCAG AA/AAA Contrast Audit**: Evaluates luminance contrast ratio between foreground text and resolved parent background color. Flags ratios below 4.5:1 (normal text) and 3:1 (large/bold text).
   - **Brandion Token Compliance**: Flags raw hardcoded `#hex` colors or arbitrary length strings that should be bound to canonical Brandion tokens (`color.bg.surface`, `spacing.static.md`).
   - **Accessibility (A11y) Checks**:
     - Flags `<Image>` / `<SiteImage>` nodes missing descriptive `alt` text.
     - Flags buttons or interactive links with empty labels and missing `aria-label`.
   - **1-Click Navigation**: Clicking any issue card in the linter panel automatically jumps to and selects the node on the canvas.

---

## 2. Code Generation Model

### React 19 JSX
```tsx
import { Stack, Text, Button, Image } from '@zaoly/ui'

export function HeroSection() {
  return (
    <Stack
      direction="column"
      gap="24px"
      style={{
        padding: "48px 24px",
        backgroundColor: "#09090b",
      }}
    >
      <Text
        role="title"
        style={{
          fontSize: "36px",
          fontWeight: 700,
          color: "#ffffff",
        }}
      >
        Next-Gen Creation Engine
      </Text>
      …
    </Stack>
  )
}
```

React export MUST pretty-print open tags (one attribute per line when ≥2 attrs, long attrs, or multi-key `style`) — same rules as Kit Playground SK-V8 (`generateCompositionModule`). The Export dialog preview MUST show the generated source in a **read-only Monaco** pane (Copy still uses the same string). Dialog chrome MUST be wide by default (`min(92vw, 72rem)`) and **resizable** (`resize: both`, `data-resizable="true"`) so long pretty JSX is readable — same pattern as HTML preview / Asset Library.

**Explore in Kit:** Export actions MUST include a link (`data-testid="export-explore-in-kit"`) to `kitPlaygroundHref` for the current export target — Instance → Master kit id when present, else Site Kit atom / editor→Site coerce (`resolveKitExploreFromExport`). Collection `platformProjectId` MUST be forwarded when bound.

### React consumer modes (design ↔ eng)

React export MUST offer a consumer toggle (`data-testid="export-react-consumer"`):

| Mode | Import | Tokens | Default |
| :--- | :--- | :--- | :--- |
| **Site Kit** (`site-kit`) | `@zaoly/site-kit` catalog export names (`Stack`, `Button`, …) via `generateCompositionModule` | Bound paths as `style={{ …: 'var(--ds-…)' }}` + optional `export const tokenBindings` (SK-V13) | **Default** for handoff |
| **App DS** (`zaoly-ui`) | `@zaoly/ui` primitives | Token paths as string props (legacy app consume) | Opt-in |

Site Kit mode MUST expand Instances (when Masters present) and coerce editor aliases (`Button`→`SiteButton`, …) before codegen — same coerce path as page-as-pattern.

### Eng copy-pack

WHERE React export is open, the dialog MUST offer **Copy pack** (`data-testid="export-copy-pack-btn"`) that copies one clipboard document with:

1. **Intent** — same fields as the Intent block (scope, Collection, breakpoint, Kit/Storybook links, ready/gaps)
2. **Kit** — absolute Playground deep-link for the export target (`kitPlaygroundHref` / Explore in Kit)
3. **Install** — `pnpm add` for the active consumer (`@zaoly/site-kit` or `@zaoly/ui`)
4. **Import** — the package import line from the generated module (when present)
5. **Brandion CSS** — `:root { --ds-* }` for bindings on the export target via `brandionDsCssForHandoff` (SK-V15 grammar); empty/unavailable when catalog cannot resolve
6. **Module** — the same generated source as **Copy Code**

Copy pack MUST NOT replace Copy Code (module-only). Helper: `lib/codegen/export-copy-pack.ts`.

### Storyblok CMS pack (PoC)

WHERE Export is open, the dialog MUST offer **Send to Storyblok** (`data-testid="export-copy-storyblok-btn"`) that POSTs the pack to `POST /api/storyblok/push`, copies the JSON, and surfaces the Storyblok `appUrl`. Spec: `specs/domain/storyblok-handoff.md` · `specs/api/storyblok-push.md`. Pack surface: `data-testid="export-storyblok-pack"`. Helpers: `lib/codegen/storyblok-handoff.ts`, `lib/codegen/storyblok-push.ts`.

### Intent block

WHERE the Export dialog is open, the UI MUST show an **Intent** summary (`data-testid="export-intent"`) so eng sees context without reading only JSX:

- Scope (`page` | `selection` | `all-pages`), target name/type/id
- Scene + page + Collection (`platformProjectId` or unbound)
- Active breakpoint
- Consumer + format
- Kit deep-link + `componentId`
- Master id/name when the target is an Instance
- Storybook href when a Storybook origin is configured
- Ready-for-eng yes/no + blocking gap codes

Helper: `lib/codegen/export-intent.ts`. Intent MUST also appear in Copy pack.

### Ready for eng gate

WHERE React export is open, the dialog MUST show a readiness banner (`data-testid="export-ready-banner"`) from `assessExportReady` on the export target tree:

- **Ready** when no `error` issues and no `A11Y-ALT-MISSING` / `DS-TOKEN-UNBOUND`
- **Not ready** lists blocking codes/messages; Copy remains available (label MAY note “anyway”) so eng can still inspect imperfect trees
- WHEN a blocker row is activated (`data-testid="export-ready-blocker"`), the editor MUST select that `nodeId`, open the P99 linter panel, and close the Export dialog so Design can fix on-canvas (same jump contract as linter issue cards)

Severity for the gate: P99 errors block; missing alt and unbound tokens also block handoff even when severity is warning/info.


### SwiftUI View
```swift
import SwiftUI

struct HeroSectionView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Next-Gen Creation Engine")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)
            Text("Build high-performance web and native interfaces with 1:1 fidelity.")
                .font(.system(size: 18))
                .foregroundColor(Color(hex: "#a1a1aa"))
            Button(action: {}) {
                Text("Get Started")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color(hex: "#1f44ff"))
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
        }
        .padding(EdgeInsets(top: 48, leading: 24, bottom: 48, trailing: 24))
        .background(Color(hex: "#09090b"))
    }
}
```

---

## 3. Linter Diagnostic Severity

| Code | Severity | Description |
| :--- | :--- | :--- |
| `A11Y-CONTRAST-FAIL` | Error | Contrast ratio is below WCAG AA minimum (< 4.5:1). |
| `A11Y-ALT-MISSING` | Warning | Image element is missing an `alt` attribute. |
| `A11Y-EMPTY-BUTTON` | Error | Button element has no accessible name, text, or `aria-label`. |
| `DS-TOKEN-UNBOUND` | Info | Element uses hardcoded `#hex` color instead of a Brandion token. |

---

## 4. Parity Commitment

Both Web (`apps/web`) and macOS Desktop Native (`apps/macos`) must provide:
1. `⌘E` shortcut opening the Code Export Modal with React 19 JSX, Tailwind, and SwiftUI tabs.
2. An automated Linter inspection panel/sheet displaying contrast, accessibility, and token health with click-to-select navigation.

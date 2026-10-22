# Canvas spacing overlay — Zaoly

**Status:** Accepted · 2026-10-04  
**Product:** Zaoly digital editor (Web; parity with CREATION)  
**Depends:** `editor-workspace.md` · `editor-inspect.md` · `canvas-smart-hud.md`  
**Anchors:** `apps/web/components/canvas-box-model-overlay.tsx` · `apps/web/lib/editor/box-model-overlay-sides.ts` · `apps/web/components/editor/editor-canvas-chrome.tsx`

## Purpose

Make **layout space** readable on the canvas:

1. **Selection box-model bands** — padding (inward) and margin (outward) as hatch overlays when a single node is selected and spacing resolves to > 0.
2. **Empty layout hatch** — very subtle diagonal pattern on **page-frame body only** (`::before`); NOT on nested stacks (avoids “everything hatched”).
3. **Media hug** — `SiteImage` / `SiteSvg` selection hosts MUST hug content (`max-content` + `align-self: flex-start`) unless Inspect size is Fill (`100%` / `fill`). Flex stretch MUST NOT inflate an unset media node to full artboard width.

This is **editor chrome only** for (1)–(2). Media hug (3) is live layout on the canvas host (same as Text hug) and affects selection bounds; Preview/PDF follow the same paint host sizing.

**Dropped:** always-on selection layout veil and per-stack hatch (too noisy).

## Behavior

### Box-model overlay

- WENN genau **ein** Node selektiert ist UND `selectionBounds` gesetzt ist UND aufgelöstes Padding oder Margin auf mindestens einer Seite > 0 ist, DANN MUSS der Canvas farbige Hatch-Bänder zeigen:
  - **Padding:** innerhalb der Border-Box (Figma-ähnlich; Accent/grün-tüfts)
  - **Margin:** außerhalb der Border-Box (Warn/Orange-tüfts)
- WENN Multi-Select ODER keine Spacing-Seiten > 0, DANN MUSS das Overlay fehlen (kein Zero-Band-Noise).
- Für `SiteImage` / `SiteSvg` MUSS die Selection-Chrome die **Paint-Border-Box** messen (`img` / SVG), nicht den Flex-Item-Host. Der Host ist ein BFC — Child-Margin liegt *innerhalb* des Hosts und darf die blaue Box nicht aufblasen (sonst doppelte Margin: grün innen + orange über dem Board).
- Für übrige Site-Kit-`paintOnSelf`-Shells (`SiteText`, `SiteStack`, `SiteGrid`, …) leben Padding/Margin auf dem **inneren Kit-Element**, nicht auf dem Selection-Host. Das Overlay MUSS das erste Element-Child ohne `data-node-id` als Paint-Target nutzen (sonst bleiben Computed-Sides 0 und die Hatch fehlt).
- Padding- und Margin-Bänder MÜSSEN `getComputedStyle` am Paint-Target nutzen und an der Live-Paint-Border-Box verankert sein (nicht Host-Gap als Padding zählen).
- Paint-Pipeline bleibt Fallback (Tests/SSR) — WENN die Live-Messung keine positive Seite liefert, DANN MUSS aufgelöstes Node-Spacing (props / tokenBindings / style) die Bänder speisen. Skalierung über Live-`getBoundingClientRect`/`offsetWidth`.
- Overlay MUSS `pointer-events: none` sein und DARF Resize-Handles / Distance-Guides / Drop-Chrome nicht ersetzen oder verdecken (Handles bleiben darüber).

### Empty layout hatch

- WENN der Editor-Canvas gerendert wird (`.creation-editor-canvas`), DANN DARF nur `.creation-scene-page-frame__body` ein **sehr dezentes** Diagonal-Muster via `::before` zeigen.
- Nested `.site-stack` MUST NOT receive the hatch.
- Export-/Preview-Pfade OHNE `.creation-editor-canvas` MÜSSEN ohne Muster bleiben.

### Media hug (SiteImage / SiteSvg)

- WENN `paintOnSelf` und Width **nicht** Fill ist, DANN MUSS der Selection-Host `width: max-content; max-width: 100%; align-self: flex-start` bekommen (`mediaNodeHostStyle`).
- WENN Width Fill (`100%` / `fill`) ist, DANN MUSS der Host `width: 100%` + `align-self: stretch` behalten.

## Non-goals

- Zweites Selection-/Resize-Rechteck
- Property bar am Selection-Rect (`canvas-smart-hud.md` Non-goal bleibt)
- Alt-Hover Distance-Guides ändern
- macOS Native Overlay-Parität in diesem Slice
- Immer-an Padding-Overlay ohne Selection

## Tests

- Unit: Seiten-Expansion (uniform / block+inline / sides) → Band-Geometrie + Zoom-Skalierung
- UI-Smoke: selektierter Node mit Padding/Margin → Overlay-Testids; ohne Spacing → kein Overlay

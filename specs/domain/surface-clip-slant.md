# Surface clip / slant — CREATION v3

**Status:** Accepted (spec) — 2026-09-02 · Phase B presets 2026-09-09 · Phase C polygon 2026-09-09 · **Phase D SiteShape + clipPathD** — 2026-09-10  
**Wave:** 16 (Phase A + B + C) · **Wave D:** SiteShape leaf + arbitrary path clip  
**Parent:** `specs/domain/editor-inspect.md` · `specs/domain/composition-scene.md` · `specs/domain/site-kit.md` · `specs/domain/site-svg.md` (shared vector deep-edit)  
**DS:** `packages/ui/specs/domain/zaoly-ui-surface-clip.md`  
**Tasks:** `tasks/wave16-surface-clip-slant.md` · Knowledge: `knowledge/site-shape-clip-d.md`

## Goal

Give containers a **constrained slanted silhouette** (schräge Kante) without a free path/point editor. Layout box stays rectangular; paint uses CSS `clip-path: polygon(...)`. Same contract in Storybook (`@zaoly/ui` + Site Kit) and the CREATION inspector.

## Problem

Marketing surfaces often need one edge diagonal (e.g. bottom-right lower than bottom-left). Today:

- Inspect has **radius** corners, not clip.
- HTML import treats `clip-path` as **lossy** (`lossy-pseudo-clip-path`).
- `transform: skew()` is forbidden for this — it warps content.

## Model — corner insets (Phase A)

Four corners; each has an **inward** inset on X and Y (length or `%` of the box edge). Default `0` / unset = corner sits on the layout box.

| Scene prop | Corner | Positive X | Positive Y |
|------------|--------|------------|------------|
| `clipInsetTopLeftX` / `clipInsetTopLeftY` | TL | right | down |
| `clipInsetTopRightX` / `clipInsetTopRightY` | TR | left | down |
| `clipInsetBottomRightX` / `clipInsetBottomRightY` | BR | left | up |
| `clipInsetBottomLeftX` / `clipInsetBottomLeftY` | BL | right | up |

**Resolved polygon** (box-relative):

```
TL = (0 + xTL, 0 + yTL)
TR = (100% − xTR, 0 + yTR)
BR = (100% − xBR, 100% − yBR)
BL = (0 + xBL, 100% − yBL)
→ clip-path: polygon(TL, TR, BR, BL)
```

Lengths MUST resolve to `calc(...)` / px at paint; percentages stay as `%`.

### Example — bottom edge slanting down to the right

Designer wants BR lower than BL on the visible edge → raise **BL** only:

- `clipInsetBottomLeftY = 12%` (or token / `2rem`)
- other insets `0`

→ `polygon(0 0, 100% 0, 100% 100%, 0 88%)`.

## Requirements (EARS)

### Contract

| ID | Requirement |
|----|-------------|
| **CL1** | Scene nodes that already expose Appearance radius MUST accept the eight `clipInset*` props (tokenGroup length / space, same as radius). AppliesTo: Stack, Grid, Card, Panel, Image, SiteStack, SiteCard, SiteSection, and other surface types that share `SHARED_STYLE_PROPS` appearance — MUST mirror radius applies. |
| **CL2** | WENN alle acht Insets unset oder `0`/`0%`/`0px` sind, DANN MUST paint **kein** `clip-path` setzen. |
| **CL3** | WENN mindestens ein Inset ≠ 0, DANN MUST paint `clip-path: polygon(...)` nach der Formel oben setzen. MUST NOT use `skew()`. |
| **CL4** | `clipInset*` MUST round-trip via `set_prop` / SceneOps / CSS peek (`clip-path` row when active). |
| **CL5** | Token bindings for `clipInset*` MUST use the length TokenPicker path (P76), same as radius. |

### Storybook / DS

| ID | Requirement |
|----|-------------|
| **CL6** | `@zaoly/ui` MUST expose a pure helper `clipPathFromCornerInsets(insets) → string \| undefined` and document it under `zaoly-ui-surface-clip.md`. |
| **CL7** | Stack and Card (minimum) MUST accept a `clipInset` prop object **or** the flat CSS vars/`style.clipPath` from the helper; Storybook Controls MUST expose the four corners (X/Y or compact Y-for-slant presets). |
| **CL8** | Site Kit surface atoms that paint Background MUST honor the same resolved `clip-path` when Scene props carry `clipInset*` (via existing paint pipeline — no second geometry model). |

### Inspector

| ID | Requirement |
|----|-------------|
| **CL9** | Appearance MUST show a **Clip / Slant** compact group (beside radius). Default collapsed: one **Bottom slant** (or Edge select + Amount) control that writes the corresponding corner Y/X. Expand reveals all eight fields (or four corners × XY), pattern like P83 radius. |
| **CL10** | Compact Bottom slant Amount → writes `clipInsetBottomLeftY` (positive = BL up → slant down-right). Optional mirror toggle for down-left (`clipInsetBottomRightY`). |
| **CL11** | Selection handles / hit-test MUST remain the **layout rectangle** (clip is paint-only in Phase A). |

### Import / export

| ID | Requirement |
|----|-------------|
| **CL12** | WENN HTML→Scene einen `clip-path: polygon` mit genau vier Eckpunkten erkennt, die dem Corner-Inset-Modell entsprechen, DANN MUST der Mapper die acht (oder reduzierten) `clipInset*` setzen — nicht länger nur `lossy-pseudo-clip-path`. |
| **CL13** | Andere `clip-path` Formen (circle, ellipse, path, >8 Punkte) bleiben lossy. 4–8 Punkt-Polygone, die nicht auf Corner-Insets mapparbar sind → Phase C `clipPolygon` (CL22). |

### Presets (Phase B)

Presets are a **write convenience** onto the eight `clipInset*` props. Paint SSOT remains the insets (CL2–CL3). No separate paint geometry.

| ID | Requirement |
|----|-------------|
| **CL14** | `@zaoly/ui` MUST expose `CLIP_PRESET_IDS`, `cornerInsetsFromClipPreset(id, amount?) → CornerInsets`, and `DEFAULT_CLIP_PRESET_AMOUNT` (`12%`). Documented in `zaoly-ui-surface-clip.md`. |
| **CL15** | CREATION MUST map presets to flat `clipInset*` props (clear inactive axes). Inspect Preset control MUST apply that map on both Web and macOS. |
| **CL16** | Preset ids (minimum): `none`, `slant-bottom` (BL Y), `slant-bottom-flip` (BR Y), `slant-top` (TL Y), `trapezoid` (BL X + BR X), `parallelogram` (TL X + BR X). Amount default `12%`; empty amount + non-`none` MUST use the default. |
| **CL17** | Inspect MUST detect the active preset from current insets when they exactly match a preset shape (same amount on mapped axes, others unset). Non-matching → show as custom / no preset id (UI: `none` selected only when all insets empty). |

## Non-goals (Phase A–C)

- Free path / point editor **on canvas** (Inspect-only polygon mode in Phase C)
- `transform: skew`
- Changing layout bounds or overflow hit-testing to the polygon
- Mag PDF vector fidelity beyond CSS clip where Playwright already paints HTML
- Arbitrary SVG shape nodes (**scheduled Phase D** below — not A–C)
- Persisting a separate `clipPreset` scene prop (presets expand to insets only)
- Token bindings on individual polygon points (literals only in Phase C)

## Phases

| Phase | Scope |
|-------|--------|
| **A** | Contract + helper + Storybook + Inspect compact + paint resolve (this spec) |
| **B** | Presets enum (`slant-bottom`, `trapezoid`, …) mapping onto insets — dual-ship Web + macOS |
| **C** | Optional 4–8 point polygon editor (Inspect) + `clipPolygon` serialize + HTML import — dual-ship |
| **D** | Dedicated `SiteShape` leaf + `clipPathD` on surfaces — dual-ship |

### Polygon editor (Phase C)

**Scene prop `clipPolygon`:** string — CSS polygon *interior* only (no `polygon()` wrapper), e.g. `0 0, 100% 0, 80% 100%, 0 100%`. Canonical point count **4–8**. Empty / unset = inactive.

| ID | Requirement |
|----|-------------|
| **CL18** | WHEN Inspect is expanded, MUST offer **Insets** vs **Polygon** mode. Polygon mode edits 4–8 box-relative points (X/Y strings) and writes `clipPolygon`. Add/remove points MUST enforce min 4 / max 8. |
| **CL19** | Paint priority: WHEN `clipPolygon` parses to 4–8 valid points, MUST set `clip-path: polygon(...)` from those points and ignore `clipInset*` for paint. WHEN writing presets or inset axes, MUST clear `clipPolygon`. WHEN writing `clipPolygon`, MUST clear all eight `clipInset*`. Prefer mapping a polygon back to `clipInset*` (and clearing `clipPolygon`) when it is a 4-point corner-inset silhouette (CL12 rules). |
| **CL20** | Canvas selection handles / hit-test MUST remain the **layout rectangle** (clip remains paint-only). |
| **CL21** | Dual-ship Web + macOS required before Phase C is “done” (paint + Inspect polygon mode). |
| **CL22** | HTML→Scene: WENN `clip-path: polygon` 4–8 Punkte hat und **nicht** auf Corner-Insets mappt, DANN MUST `clipPolygon` gesetzt werden (nicht nur `lossy-pseudo-clip-path`). circle / ellipse bleiben lossy until Phase D; `path(...)` → Phase D `clipPathD` (CL28). |
| **CL23** | `@zaoly/ui` MUST expose `clipPathFromPolygonPoints` (+ parse/normalize helpers) documented in `zaoly-ui-surface-clip.md`. |

### Phase D — SiteShape leaf + clipPathD

**SiteShape** is a Site Kit leaf (`type: 'SiteShape'`) with path SoT (not opaque markup soup):

```ts
// SceneNode.type === 'SiteShape'
type SiteShapeProps = {
  /** SVG path `d` attribute (user-space). */
  d: string
  viewBox?: string
  alt?: string
  title?: string
}
```

Fill/stroke follow Appearance + optional `color` token like `SiteSvg` (`currentColor`). Deep-edit reuses the SiteSvg Phase 4 vector surface; Apply writes `d` (+ `viewBox`) via `set_prop` — MUST NOT explode into Path SceneNodes.

**Scene prop `clipPathD`:** string — raw SVG path data for CSS `clip-path: path('...')` (or equivalent paint). Empty / unset = inactive. AppliesTo same surfaces as `clipInset*` / `clipPolygon`.

| ID | Requirement |
|----|-------------|
| **CL24** | Palette MUST include `SiteShape` with a default closed path (e.g. rounded diamond) + non-empty `alt`. |
| **CL25** | Canvas / preview / Mag paint MUST render `SiteShape` as inline SVG `<path d=…>` sized by Appearance width/height; selection hit-test remains the layout rectangle. |
| **CL26** | Inspect on `SiteShape` MUST expose path summary + **Edit Shape** (isolated vector deep-edit) + alt/title + color; MUST NOT put pen tools on the board. |
| **CL27** | Appearance Clip / Slant MUST offer **Path** mode alongside Insets / Polygon. Path mode edits `clipPathD`. Writing `clipPathD` MUST clear `clipPolygon` and all eight `clipInset*`. Writing insets/presets/polygon MUST clear `clipPathD`. |
| **CL28** | Paint precedence: WHEN `clipPathD` is non-empty and parses as a path, MUST set `clip-path: path('…')` (or SVG-equivalent) and ignore polygon/insets. ELSE fall through to CL19 (`clipPolygon`) then insets. |
| **CL29** | HTML→Scene: WENN `clip-path: path(...)` (or `path("...")`) present, DANN MUST set `clipPathD` (strip wrapper quotes) — MUST NOT only emit `lossy-pseudo-clip-path`. |
| **CL30** | Dual-ship Web + macOS required before Phase D is “done” (SiteShape paint + Inspect Path mode + deep-edit reuse). |
| **CL31** | Knowledge `knowledge/site-shape-clip-d.md` MUST document ops notes and overlap with `SiteSvg` (markup SoT vs path SoT). |

## Acceptance

1. Spec inventory includes `surface-clip-slant.md`.
2. Unit tests: `clipPathFromCornerInsets` (zero → undefined; BL-Y → expected polygon) — Web + macOS (`ClipPathInsets`).
3. Storybook: Stack/Card story with Controls for slant.
4. Editor: Inspect writes `clipInset*`; canvas + preview-html show clip — **Web and macOS**.
5. HTML import: 4-point trapezoid maps to insets (CL12) — Web mapper; macOS remote path uses Web API.
6. Phase B: preset helper + Inspect preset select apply/detect (Web + macOS); unit tests for map + detect.
7. Phase C: `clipPolygon` paint precedence; Inspect polygon mode (4–8 points); HTML import CL22; unit tests Web + macOS; dual-ship.
8. Phase D: `SiteShape` palette + paint; `clipPathD` precedence + Inspect Path mode; HTML `path()` import; dual-ship; knowledge note.
# Scene surface export — CREATION v3

**Status:** Accepted · **Date:** 2026-09-17  
**Product:** CREATION v3  
**API:** `specs/api/scene-surface-export.md`  
**Related:** `scene-preview.md` · `composition-magazine-pdf.md` · `scene-board.md`

## Purpose

Designer-facing **WYSIWYG** export of any scene page / artboard as **PNG** or multi-page **PDF**, using Scene → HTML → Playwright (same family as Vision preview, different quality and sizing).

Does **not** replace Magazin PDF (`Print*` → Mag twins).

## Formats

| Format | Result |
|--------|--------|
| `png` | Single artboard only (`image/png`) |
| `pdf` | One PDF page per selected artboard (`application/pdf`) |

## Scope

| Input | Pages exported |
|-------|----------------|
| `pageIds: string[]` | Those ids, in scene `pages[]` order |
| `scope: 'active'` (default) | Active page |
| `scope: 'all'` | Every page in `pages[]` order |

PNG with more than one resolved page → **422** `png_requires_single_page`.

## Sizing

- Viewport = artboard `frame.width` × `frame.height` when set; else breakpoint / print-preset derived size (`resolvePageArtboardWidth` / `Height`).
- PNG `scale` default **2** (`deviceScaleFactor`).
- Not Vision-compact viewports (960×600).

## Breakpoint

Request `breakpoint` or scene `activeBreakpoint` (default `desktop`). Fold OP-9 via `materializeNodeForBreakpoint` before HTML build. `print` allowed for print-lane overrides on digital trees.

## Body

Client POSTs in-memory `scene` (unsaved edits), same pattern as Magazin PDF.

## Non-goals

- Replacing Magazin PDF
- Client `html2canvas` of editor chrome
- ZIP of many PNGs
- Vision/MCP payload soft-caps (Surface export is download-sized)

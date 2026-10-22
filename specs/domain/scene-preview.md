# Scene preview + Vision self-check (Welle 2)

**Status:** Accepted — 2026-08-24  
**Depends:** `scene-content-audit.md` · `scene-agent-editing.md` · `mcp-server.md`  
**API:** `GET|POST /api/scenes/:id/preview` · `GET /api/scenes/:id/preview-html`  
**MCP:** `zaoly.scene_preview`  
**Plexon:** multimodal tool result in assistant loop (Anthropic image content)

## Purpose

Give agents a **pixel** self-check: render the active page to PNG, then Vision-compare against user intent (+ optional Spirion reference). Complements structural `scene_content_audit` (JSON/props only).

## Render path (locked)

1. Server loads scene (same auth as scene ops: session or service + actor).
2. Expand Instances (`expandCompositionScene` / `expandSceneTree` for optional `pageId`) for the target page.
3. Site-Kit tree → HTML via `serializeSiteKitComposition` + dedicated HTML builder (chrome-free document with Site Kit CSS vars). Scene Google Fonts (literals + resolved tokens when catalog available) MUST be injected as CSS2 `<link>` tags in the preview `<head>` (P93 / Wave 8).
4. **Playwright** Chromium screenshot (`page.setContent` → **WebP quality ~50**; viewport by breakpoint — desktop **960×600** for Vision payload size).
5. Return image as `pngBase64` field (legacy name) with `mimeType: image/webp`. Soft-fail with `error` when too large / Playwright fails — agents must not claim pixel QA.

**Out of scope:** Client-canvas capture; capturing the interactive editor chrome; MCP Alpine container hosting Chromium (preview runs on **creation-web**). Designer download of full-size PNG/PDF → `scene-surface-export.md` (separate API, not this Vision path).

## Breakpoints

| Id | Viewport |
|----|----------|
| `mobile` | 390×700 |
| `tablet` | 768×720 |
| `desktop` (default) | 960×600 |

## API

`GET|POST /api/scenes/:id/preview` — query or JSON body:

```ts
type ScenePreviewRequest = {
  breakpoint?: 'mobile' | 'tablet' | 'desktop'
  pageId?: string // default activePageId
}

type ScenePreviewResult = {
  sceneId: string
  updatedAt: string
  pageId: string
  breakpoint: string
  mimeType: 'image/webp'
  /** WebP base64; field name kept for MCP compat */
  pngBase64: string
  width: number
  height: number
  /** Present when Playwright/infra failed or payload too large — agent must not claim pixel QA */
  error?: string
}
```

Auth: same as `GET /api/scenes/:id/tree`.

### HTML preview (editor)

`GET /api/scenes/:id/preview-html?pageId=&source=scene|import&format=json`

- `source=scene` (default): Site-Kit tree → HTML (`buildScenePreviewHtml`), same document Playwright screenshots use.
- `source=import`: last `importSourceHtml` on the page (from `import-html`); 404 `import-source-missing` when never imported.
- Default response: `text/html`. `format=json` returns `{ html, pageId, source, importSourceHtmlAt? }` for editor iframe `srcDoc`.
- Editor toolbar: **import** icon (`Import`) opens dialog with tabs **Import source** vs **Scene render**.
- Dialog chrome (`creation-editor-html-preview-dialog`): **resizable** (width + height via CSS `resize: both`), default size wider than standard `Dialog` (`max-width` override), iframe/body flex-fill so content tracks the dialog size.

## MCP

`zaoly.scene_preview` — maps to preview API; call after `zaoly.scene_content_audit` ok (or after polish). Description tells agents to Vision-check the returned image.

## Plexon Vision loop

1. Depth prompt Phase „Polish“: after `creation_scene_content_audit` ok → `creation_scene_preview` (cap **2** preview rounds unless user asks more).
2. Orchestrator: when tool result JSON has `pngBase64` + `mimeType`, attach Anthropic `tool_result` content as `[text summary, image base64]` (not string-only).
3. Model Vision-check: hierarchy, whitespace, missing CTAs, seed leftovers in pixels, contrast.
4. On issues: ops → re-audit → re-preview.
5. On preview `error`: fall back to content_audit; never claim pixels were checked.

## EARS

- WENN der Agent eine Marketing-/PDP-Seite als fertig meldet und `creation_scene_preview` verfügbar ist, DANN MUSS er mindestens einmal Preview versucht haben.
- WENN Preview fehlschlägt, DANN MUSS der Agent auf `scene_content_audit` zurückfallen und den Fehler nennen.
- WENN Vision Findings meldet, DANN MUSS der Agent Fixes via ops anwenden bevor „fertig“.

## Infra

- `playwright` dependency on creation-web; Chromium + OS libs in creation **Dockerfile runner**.
- Document in `knowledge/paths.md` + `knowledge/staging-coolify.md`.

## Non-goals (MVP)

- Multi-page PDF preview · Diff against previous commit · Auto-apply Spirion layouts

## Acceptance

1. Unit: HTML builder emits seed copy visible as text; preview API returns PNG when Chromium available (else structured `error`).
2. MCP tool registered; Plexon catalog `creation_scene_preview` → `creation_scene`.
3. Orchestrator multimodal tool_result for preview; depth prompt documents preview phase.
4. Staging deploy creation-web (+ mcp) + plexon.

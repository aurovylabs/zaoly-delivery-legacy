# Craft Debug Bundle

**Status:** Accepted — 2026-08-25  
**Depends:** `html-scene-import.md` · `scene-content-audit.md` · `assistant-spirion-mcp.md`  
**Knowledge:** `knowledge/paths.md`

## Purpose

Give operators and Cursor a **single JSON artifact** after HTML→Scene import so craft failures (“dünn”, wrong tokens, pack ignored) are diagnosable without pasting Scene-Render HTML.

## Shape (`SceneCraftDebugBundle`)

Persisted on `ScenePage.craftDebug` (+ `craftDebugAt`) when `import-html` succeeds.

| Field | Source |
|-------|--------|
| `schemaVersion` | `"1"` |
| `builtAt` | ISO |
| `pageId` | target page |
| `designSystem` | unique colors / fonts / gap-padding literals from imported tree (+ `:root` extract from HTML when present) |
| `sceneStats` | nodeCount, SiteGrid/SiteStack counts, maxFontSizePx, unique backgrounds/colors, hasLargeDisplay, hasHeroMedia |
| `craftFlags` | soft warnings e.g. `craft-thin` (not hard-fail) |
| `importWarnings` | mapper warnings from HTML→Scene |
| `importHtmlBytes` | raw HTML size |
| `hasImportSourceHtml` | whether `importSourceHtml` is set |
| `importSourceHtmlAt` | timestamp |
| `spirion?` | optional — agent/MCP may pass `craftMeta.spirion` on import (`captureIds`, look/rhythm summaries, `avoid`) |

## API

`GET /api/scenes/:id/craft-debug?pageId=` (default: active page)

- Auth: same as `preview-html` (`requireSceneApiAccess`; machine path for GET).
- Response: live recomputed stats merged over stored `craftDebug`, plus `importSourceHtmlPreview` (first ~2k chars) when present — never require full HTML in Cursor chat.
- MCP: `zaoly.scene_craft_debug` — compact JSON for the Plexon assistant (flags / stats / designSystem / spirion; no full HTML). Agents MUST call this before finishing a landing/PDP turn and treat `craft-thin` as a must-fix, not a soft skip.

## Editor

HTML Preview dialog: third tab **Debug** — JSON summary of the bundle + craft flags.

## Content audit

`creation_scene_content_audit` MAY emit **warnings** with code `craft-thin` when scene stats look sparse (small display type, few backgrounds, no grid, no hero mass). Does **not** flip `ok` to false by itself.

`sceneStats.hasHeroMedia` is true when any node is a large `SiteImage`/`Image`/`SiteSvg` (width ≥480 or height ≥320) **or** a stack/container carries `props.backgroundImage` / `background` with `url(` or an `https://` fill (full-bleed heroes — HTML import ignores absolute overlays).

Soft flag `craft-no-hero-media` fires when `!hasHeroMedia` and `nodeCount >= 8` (text-only dense pages). Plexon landing quality gate requires **both** `hasLargeDisplay` and `hasHeroMedia` — large type alone is not enough.

Soft flag `craft-loose-display-leading` fires when ≥48px type has missing or body-like `lineHeight` (>1.25). HTML import clamps display/title leading to ~1.08 / 1.2 so body `1.6` does not stick on hero wraps (Fallgefühl).

## EARS

- WENN `import-html` erfolgreich ist, DANN MUSS die Ziel-Page `craftDebug` + `craftDebugAt` erhalten.
- WENN `GET craft-debug` mit gültiger Auth und Scene/Page aufgerufen wird, DANN MUSS `200` + Bundle JSON geliefert werden.
- WENN Craft dünn ist, DANN SOLL `craftFlags` / Audit `craft-thin` warnen — nicht als Import-Fehler abbrechen.

# Scene content audit — agent self-check (Welle 1)

**Status:** Accepted — 2026-08-24  
**Depends:** `scene-agent-editing.md` · `composition-scene.md` · `composition-masters.md`  
**API:** `GET /api/scenes/:id/content-audit`  
**MCP:** `zaoly.scene_content_audit`

## Purpose

Give agents a **structural** self-check after layout writes: expand Instances, scan visible copy/props, report seed/Master leftovers and missing PDP signals — without pixels (Welle 2 = `scene_preview`).

## Response shape

```ts
type SceneContentAuditFinding = {
  nodeId: string
  severity: 'error' | 'warning'
  code:
    | 'seed-copy'
    | 'generic-alt'
    | 'empty-select-options'
    | 'missing-cta'
    | 'missing-product-title'
    | 'craft-thin'
  message: string
  propKey?: string
  value?: string
}

type SceneContentAuditResult = {
  sceneId: string
  updatedAt: string
  activePageId: string | null
  ok: boolean // true when no error-severity findings
  findings: SceneContentAuditFinding[]
}
```

## Rules (EARS)

- WENN der expandierte aktive Page-Baum einen sichtbaren String in der Seed-Liste enthält (`Get started`, `Option A`, `Option B`, alleiniges `Text`/`Link`/`New`/`Button`/`Email`/`Select`/`Image`/`Message`), DANN MUSS ein Finding `seed-copy` (severity `error`) entstehen.
- WENN `SiteImage`/`Image` `alt` fehlt oder generisch ist (`Image`, `image`, leer), DANN MUSS `generic-alt` (warning) entstehen.
- WENN `SiteSelect`/`Select` Optionen fehlen oder nur Seed-Optionen (`Option A`/`Option B`) hat, DANN MUSS `empty-select-options` (error) entstehen.
- WENN die Page mindestens ein Button/SiteButton hat, aber alle Labels Seed sind, DANN MUSS `missing-cta` (error) entstehen.
- WENN kein SiteText/Text mit role `title`|`display` und non-seed children existiert, DANN MUSS `missing-product-title` (warning) entstehen (nur wenn Page ≥3 content nodes — vermeidet False Positives auf leeren Pages).
- WENN Scene-Stats dünn wirken (kleine Display-Type, wenige Surfaces, kein Grid bei großen Pages), DANN SOLL `craft-thin` (warning) entstehen — siehe `craft-debug.md`. Flippt `ok` nicht allein.

## Auth

Same as `GET /api/scenes/:id/tree` (session or service + actor).

## Agent guidance

Before claiming a PDP/landing is done: call `creation_scene_content_audit`; on findings, `set_prop` / re-insert until `ok` or only warnings remain (user can accept warnings).

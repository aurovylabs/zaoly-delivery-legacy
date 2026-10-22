# MagazineTemplate (WYSIWYG Phase 4)

**Status:** Accepted · **Date:** 2026-08-15  
**API:** `specs/api/magazine-templates.md`  
**Knowledge:** `knowledge/magazine-template-publish.md`  
**Federation:** `2026-05-plexon-federation-v3`  
**Consumers:** Plexon Quick Scan PDF (`role: quick-check-magazine`) · Plexon EQC pitch slides (`role: quick-check-slides`, optional; fixture fallback in Plexon)

## Purpose

Immutable, Collection-scoped magazine templates authored in CREATION. Consumers bind report data into `props.dataSlot` targets and render Mag PDF from the **published scene snapshot** — never from a live mutable editor scene id.

## Model

| Field | Notes |
|-------|--------|
| `templateId` | Stable id across versions |
| `version` | Monotonic integer; **published** versions are immutable |
| `status` | `draft` \| `published` |
| `role` | Consumer role key, e.g. `quick-check-magazine` |
| `platformProjectId` | Collection scope (required for publish) |
| `name` | Human label |
| `sceneSnapshot` | Deep-cloned `CompositionScene` at publish time |
| `sourceSceneId` | Authoring provenance only (optional; not used by consumers) |
| `zaolyUiSource` | `ZAOLY_UI_SOURCE` SHA at publish (library generation) |
| `slotSchema` | List of `{ dataSlot, nodeId, nodeType }` extracted from snapshot |
| `compatVersion` | Wire compat, e.g. `2026-08-magazine-template-v1` |
| `publishedAt` | ISO timestamp when published; null on draft |
| `createdAt` / `updatedAt` | ISO timestamps |

## dataSlot vs layout slot

- **Layout** `props.slot` — editor chrome slots (`title`, `label`, …) for Print* shells. Unrelated to report binding.
- **Data** `props.dataSlot` — consumer binding key on PrintCover / PrintTable / PrintRankedList / PrintPersona* (and grids). Publish extracts only nodes with a non-empty `dataSlot`.

Canonical Quick Check keys (non-exhaustive): `eqc.cover`, `eqc.cover.kpis`, `eqc.domain.issues`, `eqc.domain.comparison`, `eqc.geo.competitors`, `eqc.geo.recommendations`, `eqc.personas`, `eqc.persona`.

## Lifecycle

1. **Draft from scene** — copy current scene into a draft template (`status: draft`, `version: 0`).
2. **Validate** — capability-matrix stub (Print* inspect enums / printable pages). Stub MAY return empty issues; MUST reject missing `platformProjectId` or empty printable content on publish.
3. **Publish** — deep-clone scene → `sceneSnapshot`, rebuild `slotSchema`, bump `version`, set `status: published` + `publishedAt`. Prior published versions remain readable and immutable.
4. **Consume** — list/get by `platformProjectId` + `role` returns **published** versions only. Response includes snapshot + schema; no live scene store lookup.

## Requirements (EARS)

1. WHEN a consumer requests templates by collection + role, the system MUST return published versions only.
2. WHEN a template version is published, the system MUST NOT mutate that version's `sceneSnapshot` or `slotSchema` afterward.
3. WHEN publishing, the system MUST require `platformProjectId` and at least one printable Mag page in the snapshot.
4. WHERE a Print* node declares `props.dataSlot`, publish MUST include it in `slotSchema` (not layout `props.slot`).
5. WHEN validation fails, publish MUST reject with a machine- and human-readable reason (no partial publish).

## Out of scope

- Editor UI chrome for publish CTA (API + store first)
- Postgres table (JSON durable store for Phase 4; PG may follow scenes pattern later)
- Pixel-perfect HTML≡PDF (Phase 3)

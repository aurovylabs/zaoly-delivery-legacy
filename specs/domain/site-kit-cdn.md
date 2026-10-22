# Site Kit public atom CDN (SK-V14)

**Status:** Accepted · **Date:** 2026-09-13  
**Parent:** `specs/domain/site-kit-collection-scope.md` · `specs/domain/site-kit-playground.md`  
**Knowledge:** `knowledge/site-kit-cdn.md` · `knowledge/paths.md`

## Goal

Ship a **public, unauthenticated ESM + CSS** surface for the **shared atom seed** only, so Kit Handoff `import` snippets work outside the monorepo `file:` workspace.

## Public vs private

| On CDN | Not on CDN |
|--------|------------|
| Shared atoms (`Button`, `Stack`, …) + `styles.css` / tokens CSS | Collection Patterns (`Composition~…`), atom forks (`Atom~…`), override JSON, Storybook CSF hydrate |

Patterns remain Collection-ACL (SK-S1). Brandion active-pack CSS stays on Brandion / Creation BFF — not hosted on the kit CDN.

## Requirements (EARS)

1. WHEN the atom CDN build runs, the system MUST emit ESM (+ CSS) for barrel atoms only and MUST NOT include `src/compositions/c/**` modules.
2. WHERE Kit Handoff selects an **atom**, the pane MUST show a CDN import snippet using `paths` / `URL_SITE_KIT_CDN` (never a hardcoded FQDN in components).
3. WHERE Kit Handoff selects a **Pattern**, the pane MUST NOT claim the Pattern module is on the public CDN — scoped package path + ACL remain authoritative.
4. The CDN host MAY share the Site Kit Storybook Coolify app as a `/cdn` static prefix (SK-V14) or a sibling Coolify app; canonical origin is `URL_SITE_KIT_CDN` / `NEXT_PUBLIC_SITE_KIT_CDN`.
5. MUST NOT publish Collection Brandion packs or Pattern trees on this surface.

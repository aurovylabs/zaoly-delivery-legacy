# Zaoly naming purge (no msqdx identifiers)

**Status:** Accepted · **Date:** 2026-10-10  
**Related:** `specs/domain/zaoly-ui-in-repo.md` · **Knowledge:** `knowledge/zaoly-naming-purge.md`

## Decision

After in-repo DS ownership, Zaoly MUST NOT keep `msqdx` / `MSQDX` / `@msqdx` as product identifiers in code, CSS, env keys, MIME types, theme ids, or operator docs — **except** historical notes in:

- `specs/domain/zaoly-ui-in-repo.md`
- `knowledge/zaoly-ui-in-repo.md`
- this purge spec + `knowledge/zaoly-naming-purge.md`

## Rename map (canonical)

| Former | Now |
|--------|-----|
| `@msqdx/ui` | `@zaoly/ui` |
| `.msqdx-print-*` | `.zaoly-print-*` |
| `data-msqdx-*` | `data-zaoly-*` |
| `application/x-msqdx-*` | `application/x-zaoly-*` |
| theme `msqdx` / `msqdx-dark` | `zaoly` / `zaoly-dark` |
| `msqdxBrand` / `msqdxLight` / … | `zaolyBrand` / `zaolyLight` / … |
| `resolveMsqdxUiRef` / `msqdxUiRef` | `resolveZaolyUiSource` / `zaolyUiSource` |
| `MSQDX_UI_REF` | `ZAOLY_UI_SOURCE` |
| `MsqdxLogoPdf` | `ZaolyLogoPdf` |
| Export consumer `msqdx-ui` | `zaoly-ui` |
| Email CDN `aurovylabs/zaoly-delivery` | `aurovylabs/zaoly-delivery` in-repo assets |
| Site URL msqdx.com (email) | `zaoly.app` |
| `msq-dx-deposit*.dtcg.json` | `zaoly-deposit*.dtcg.json` |
| `MsqdxCornerBox` / `msqdxCutdown` | `ZaolyCornerBox` / `zaolyCutdown` |
| `brand-tokens-msqdx.json` | `brand-tokens-zaoly.json` |

## Acceptance

`rg -i 'msqdx|msq-dx' apps/web packages Dockerfile .github apps/macos knowledge specs` (excl. node_modules/dist and the historical files listed above) has **zero** hits. Tests + build green.

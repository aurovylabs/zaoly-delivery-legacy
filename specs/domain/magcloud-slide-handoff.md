# Magcloud slide handoff — removed

**Status:** Removed — 2026-10-11  
**Product:** Zaoly (enterprise web design)

Zaoly MUST NOT implement Magcloud publish, board catalog, or Universe deliver.

HTTP: routes below MAY remain as **410** `print_out_of_scope` stubs only — no client, no env, no MCP tool.

| Route | Status |
|-------|--------|
| `POST /api/scenes/:id/publish-magcloud` | 410 |
| `GET\|POST /api/magcloud/boards` | 410 |

Related: `knowledge/print-out-of-scope-for-zaoly.md` · `knowledge/magcloud-slide-handoff.md` · `specs/api/magcloud-slide-handoff.md`

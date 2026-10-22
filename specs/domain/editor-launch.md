# Editor launch — CREATION v3

## Status
Accepted (Wave 2–4 + Editor migration E4) — **P61 cutover closed** 2026-08-13

## Goal
Open composition work from the CREATION AppShell via in-app `/editor`.

## Modes

| Mode | When | Target |
|------|------|--------|
| **In-app** | `ZAOLY_EDITOR_INAPP` truthy (default on outside production) | `/editor` |
| **Ops deep-link** | Optional `ZAOLY_EDITOR_URL` — **not** a visible CTA after P61 | Env helper only |

## Launch helpers

Builder: `apps/web/lib/editor-launch.ts` · query `platformProjectId`, `launchCode` (auth bridge redeem remains for Ops), optional `insertType` (`paths.editorInsertTypeQueryParam`).

| Query | Role |
|-------|------|
| `platformProjectId` | Collection bind for scene boot |
| `launchCode` | Ops auth bridge redeem |
| `insertType` | One-shot palette hydrate after ready (`SiteButton`, `Composition:Hero`, …). Stripped from URL after insert so refresh does not re-insert. |
| `hint` | Optional UX banner (`paths.editorHintQueryParam`). `save-pattern` = one-shot dismissible Pattern workflow tip (SK-V7). |

Kit Playground **Open in Editor** (`specs/domain/site-kit-playground.md` SK-V6) sets `insertType` from the selected catalog/seed component — not from dirty Monaco TSX.

**Create Pattern in Editor** (SK-V7) opens `/editor?platformProjectId=&hint=save-pattern` without writing playground TSX.

MUSS: Never hardcode editor FQDN.  
WENN in-app off, DANN hub/project show enable-hint for `ZAOLY_EDITOR_INAPP` (no Legacy Zaoly CTA).

## Non-goals
- iframe embed of Zaoly Vite under AppShell (prefer native `/editor`)
- Keeping Zaoly as long-term SoT after E6 cutover
- Visible Legacy Zaoly CTA (removed P61)
- Writing playground sandbox TSX into Site Kit overrides via launch

## Acceptance
1. In-app flag documented in `knowledge/paths.md`.
2. `/editor` available when flag on.
3. Hub + project detail + editor toolbar have **no** Legacy Zaoly CTA.
4. `ZAOLY_EDITOR_URL` may remain unset as optional Ops deep-link.
5. `insertType` one-shot insert via palette hydrate; query stripped after apply; idempotent per scene+type.
6. `hint=save-pattern` shows a dismissible banner once (session); no auto-save.

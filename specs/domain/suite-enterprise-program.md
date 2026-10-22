# CREATION — Suite Enterprise Program

**Status:** Accepted (program) — 2026-09-25. E4/E1/E2 Plexon-Clients; Hook: `POST …/scenes/:id/import-html` nach erfolgreichem Import. Weitere Lauf-Pfade folgen.  
**Programm:** `plexon-v3/specs/domain/suite-enterprise-program.md`  
**Federation:** `2026-05-plexon-federation-v3`

## Pflicht

| Welle | CREATION liefert | Status |
|---|---|---|
| E1 | Letzte Composition (Name, Szene, Deep-Link) für das Lagebild. | Done |
| E2 | Client Page Share kann einen Stand **freigeben**. Slot `creation_pages` zeigt nur diesen Stand. Kommentare bleiben Kommentare. | Done (2026-09-25) — `PATCH …/client-shares/:id` `{ approve: true }` → PUT Plexon `…/client-room/slots/creation_pages`; Widerruf eines freigegebenen Shares cleart den Slot best-effort. |
| E4 | Audit bei Freigabe, Widerruf und Export. | Done (approve/revoke Suite-Audit; Import-Hook) |
| E5 | Deep-Link aus einem CHECKION-Befund öffnet die Szene. Der Flow schreibt keine SceneOps. | Open |
| E7 | `sceneId` am Kampagnenbrief, lesend. | Open |
| E8 | Deep-Link in der Krisenvorlage, derselbe Weg. | Open |

## Freigabe

Zustände eines Client Shares: `shared` | `approved` | `revoked`. `approved` setzt eine Person und eine Zeit. Nur `approved` darf in den Kundenraum.

## Annahme

- KPI-Bau bleibt in METRON.
- Token-Wahrheit bleibt in BRANDION.
- Storyblok-Rücksync und macOS-Parity sind keine Enterprise-Wellen dieses Programms.
- Magazin-Vorlagen für Quick-Check bleiben `magazine-template.md`.

## Acceptance

Ein Share im Zustand `shared` erscheint nicht im Kundenraum. Ein Flow-Lauf verändert die Szene nicht.

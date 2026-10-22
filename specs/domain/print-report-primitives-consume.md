# CREATION — Print report primitives consume (chip tone · callout · columnAlign · steps)

**Status:** Accepted — Phase A–E **Implemented** (2026-09-13)  
**Wave:** `W-PRINT-REPORT-ATOMS` (DS **P92**)  
**Upstream DS:** `zaoly/specs/domain/zaoly-ui-print-report-primitives.md`  
**Depends:** `composition-magazine-pdf.md` · `editor-inspect.md` · `editor-palette-print.md` · `knowledge/print-mag-capability-matrix.md`  
**Knowledge:** `knowledge/print-report-primitives.md`

## Purpose

Wire Creation editor + Mag PDF flatten to DS Print/Mag extensions so **agent smoke** (Plexon Creation craft) can author emphasis without Non-Print HTML that Mag skips.

## Locked decisions

1. **No Creation-only primitives** — types and tone enums live in `@zaoly/ui`; Creation inspect + flatten only.  
2. **Pin bump** — each DS phase ships behind `ZAOLY_UI_SOURCE` bump before Creation consume.  
3. **P54 freeze lifted only after DS A** — `editor-inspect.md` currently forbids inventing PrintChip variants; WHEN DS `tone` exists, Creation MUST expose it as shell enum on `PrintChip`.  
4. **Capability matrix** — every new prop row MUST be **Y** (HTML + Mag) before inspect shows it.  
5. **Silent skip unchanged** — Non-Print nodes still skipped by Mag flatten; Steps/Callout are Print* so they export.

## Phase map (Creation work)

| DS phase | Creation deliverables | Status |
|----------|----------------------|--------|
| A Chip tone | `inspectFieldsForType('PrintChip')` + `tone` · canvas class / CSS var · flatten → `MagChip tone` · defaults · tests | **Done** |
| B Callout | Palette entry · `defaultChildForType('PrintCallout')` · slots · flatten → `MagCallout` · icons · tests | **Done** |
| C columnAlign | Shell prop on `PrintTable` · grain on th/td · flatten → MagTable cell aligns · matrix + silent-drop test | **Done** |
| D Steps | Palette · defaults · flatten → `MagSteps` · playbook-facing tree shape | **Done** |

## Inspect contracts

### PrintChip

| Field | Kind | Notes |
|-------|------|-------|
| `tone` | enum | `default` \| `muted` \| `accent` \| `solid`; default unset ≡ `default` |

Label copy stays slotted Text (`slot=label`). Tone is **shell**, not on the Text child.

### PrintCallout (new)

| Field | Kind | Notes |
|-------|------|-------|
| `variant` | enum | `wash` \| `emphasize` \| `quiet` |
| slots | identity | `label?`, `body` (required) |

### PrintTable

| Field | Kind | Notes |
|-------|------|-------|
| `columnAlign` | string[] or structured enum list | Parallel to column count; document normalize in flatten |

Precedence: cell Text `textAlign` > `columnAlign[i]` > `left`.

### PrintSteps (new)

| Field | Kind | Notes |
|-------|------|-------|
| `orientation` | enum | `horizontal` \| `vertical` |
| `emphasisIndex` | number \| unset | 0-based; out of range → no emphasis |

Children: ordered steps with `label` + optional `detail` (RankedRow or `PrintStep` — pick one in implementation and stick to palette defaults).

## Mag flatten

Update `apps/web/lib/magazine-pdf/flatten-print-node.tsx` (+ paint resolve as needed):

| Scene type | Mag |
|------------|-----|
| PrintChip (+ tone) | MagChip |
| PrintCallout | MagCallout |
| PrintTable (+ columnAlign) | MagTable |
| PrintSteps | MagSteps |

Amend twin table in `composition-magazine-pdf.md` when B/D land.

## Agent / smoke expectations

- Prefer `PrintChip tone=accent|solid` for active framework dimensions.  
- Prefer `PrintCallout` for wash bands; do not use `PrintPullQuote` for non-quotes.  
- Prefer `columnAlign` ending in `right` for numeric/EUR columns.  
- Prefer `PrintSteps` for linear process; do not insert SiteStack diagrams inside `PrintPage` for Mag smoke.  
- Plexon playbooks amended in plexon-v3 (out of this file).

## Tests (Creation)

1. Unit: inspect field present; defaultChild seeds valid tree.  
2. Flatten: tone/variant/columnAlign/emphasisIndex appear in Mag props (silent-drop guard).  
3. Matrix doc + `__tests__/print-mag-wysiwyg*.test.ts` extended.  
4. Optional MCP/agent fixture: one print-report brief using A+C (and B/D when shipped).

## Acceptance

1. After each DS pin bump, Creation canvas and Mag PDF agree on the new prop.  
2. No inspect control that Mag drops.  
3. `knowledge/print-mag-capability-matrix.md` updated per phase.  
4. Paths recorded in `knowledge/paths.md` + `knowledge/print-report-primitives.md`.

## Sequencing

Follow DS A→B→C→(D). Creation consume may trail each DS PR by one pin bump — do not batch all Creation work before A is on the pin.

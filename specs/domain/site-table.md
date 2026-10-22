# SiteTable (Site Kit content table)

**Status:** Accepted · **Product:** CREATION v3 · **Package:** `@zaoly/site-kit`  
**Depends:** `site-kit.md` · `editor-inspect.md` · `composition-scene.md` · `scene-ops` (table structure ops) · **Smart HUD (concept):** `canvas-smart-hud.md`  
**Knowledge:** `knowledge/site-table.md` · HUD slots `knowledge/canvas-smart-hud.md` (`table` / `tableRow` / `tableCell`)  
**Non-goals:** Data-grid (sort/filter/virtualization), `PrintTable` / MagTable merge, Brandion row binding

## Purpose

Provide a **semantic HTML content table** as Site Kit atoms so designers build price lists, specs, and comparison tables visually in CREATION; Storybook catalogs the same React modules.

## Atom model

| Scene type | React | HTML |
|------------|-------|------|
| `SiteTable` | `Table` | `<table class="site-table">` |
| `SiteTableRow` | `TableRow` | `<tr>` |
| `SiteTableCell` | `TableCell` | `<th>` or `<td>` |

Structure is **scene children** (not `props.rows` arrays). Default cell content is a nested `SiteText`.

## Seed

WHEN the designer inserts `SiteTable` from the palette, the system MUST seed **3 columns × 1 header row + 2 body rows**, each cell a `SiteTableCell` with a `SiteText` child. Header row MUST set `props.header = true` and header cells MUST set `props.header = true` (render as `th`).

## Design props (`SiteTable`)

- `density`: `compact` | `default` | `comfortable`
- `borders`: `none` | `row` | `all`
- `striped`: boolean
- `caption`: optional string → `<caption>`

`SiteTableCell`: `align` (`start` | `center` | `end`), optional width via shared layout paint. `SiteTableRow`: `header` boolean.

## Structure ops

| Op | Behavior |
|----|----------|
| `table_add_row` | Append one body row with column count matching the widest existing row; cells get empty `SiteText` |
| `table_add_column` | Append one cell to every `SiteTableRow` under the table |
| `table_remove_row` | Remove last **body** row; refuse if fewer than 1 body row would remain |
| `table_remove_column` | Remove last cell from every row; refuse if fewer than 1 column would remain |

WHEN Inspect or the Smart HUD selects an unlocked **free** `SiteTable` (no `instanceOf`), the system MUST expose Table structure controls that dispatch those ops. HUD action chips MUST use `IconTableAddRow` / `IconTableAddColumn` from `@zaoly/ui`.

WHEN the selection is a Master **Instance** expanded as `SiteTable`, density/borders/striped MAY write via `instanceOverrides`, but structure actions MUST be hidden and `table_*` ops MUST reject (sealed Instance — Edit Master or Detach; see `composition-masters.md`).

## Canvas / content edit

- `SiteTable` paints a semantic `<table>`; header rows in `<thead>`, others in `<tbody>`.
- Row/cell chrome wraps MUST use `display: contents` so `tr`/`th`/`td` participate in table layout.
- Nested `SiteText` MUST support existing canvas inline edit (`creation-inline-edit`).

## Storybook

WHERE `SiteTable` / `SiteTableRow` / `SiteTableCell` exist in `SITE_KIT_CATALOG`, CSF stories MUST exist under `packages/site-kit` (`Site/Table`, …). Publish follows the normal Site Kit Coolify path.

## Separation

MUST NOT reuse `PrintTable`, magazine CSS, `RankedRow`, or MagTable for this atom family.

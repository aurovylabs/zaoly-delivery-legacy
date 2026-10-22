# HTML → Scene import — P2 fidelity waves

**Status:** Wave C shipped — 2026-08-25  
**Parent:** `html-scene-import.md`  
**Implementation:** `apps/web/lib/scene/html-to-scene.ts`  
**Principle:** Map only onto **existing** Site Kit + Inspect contract props (or `node.style` when the renderer already merges it). No parallel CSS dump on nodes; no new editor chrome per import hack.

## Goal

Raise craft fidelity for agent HTML (Lindenau-class landings) while keeping the editor tree **clean and editable**. Each wave is spec-first, one reviewable diff, tests against fixtures.

## Storage channels (unchanged)

| Channel | Use |
|---------|-----|
| `props.*` | Inspect-visible literals/enums (`color`, `justify`, `letterSpacing`, …) |
| `node.style` | Paint-only CSS the contract does not model (`borderTop` shorthand, `aspectRatio`, `fontStyle`, rem/`%` width when not numeric px) |
| Node type + `direction` / `columns` | `display:flex` / `display:grid` — never free `display` prop |

## Wave A — Contract props + box paint (shipped target)

**Scope:** Properties already in `component-contracts.ts` `SHARED_STYLE_PROPS` and `resolve-bindings.ts` / `resolveEnumPropsToStyle`.

| CSS | Scene | Notes |
|-----|--------|--------|
| `letter-spacing` | `props.letterSpacing` | literal |
| `text-transform` | `props.textTransform` | enum: `none` \| `uppercase` \| `lowercase` \| `capitalize` |
| `text-decoration` | `props.textDecoration` | enum: `none` \| `underline` \| `line-through` |
| `text-align` | `props.textAlign` | enum |
| `margin` / `margin-*` | `props.margin*` | literals |
| `justify-content` | `props.justify` | CSS `start`/`end` → `flex-start`/`flex-end` |
| `align-items` | `props.align` | same normalization |
| `align-self` | `props.alignSelf` | |
| `align-content` | `props.alignContent` | |
| `overflow` | `props.overflow` | enum |
| `opacity` | `props.opacity` | 0–1 number |
| `min-width` / `max-width` / `min-height` / `max-height` | `props.minWidth` etc. | literals |
| `width` / `height` | `node.style` | px → number; else literal string (`rem`, `%`, `vw`) |
| `aspect-ratio` | `node.style.aspectRatio` | literal |
| `font-style` | `node.style.fontStyle` | no contract key (italic/oblique) |
| `border*` | `node.style.border*` | Wave A includes borders (see parent spec) |

### EARS (Wave A)

- WENN ein Element resolved `letter-spacing` / `text-transform` / `text-decoration` trägt, DANN MUSS der Mapper die passenden `props` setzen (kein `var()` im Output).
- WENN ein Flex/Grid-Container `justify-content` oder `align-items` hat, DANN MUSS der Mapper `props.justify` / `props.align` setzen.
- WENN `width`/`height` nicht als px-Zahl parsebar sind, DANN MUSS der Mapper den CSS-Literal-String auf `node.style` schreiben.
- WENN `position:absolute|fixed` auf einem Element liegt, DANN MUSS der Import weiterhin `ignored-absolute-position` warnen und **kein** `position`/`z-index` setzen (Non-goal Wave A).

### Acceptance

- Unit tests in `apps/web/__tests__/html-to-scene.test.ts` for Wave A table rows.
- Lindenau fixture: nav `letter-spacing` + uppercase; nav-links `justify-content:flex-end`; seal `aspect-ratio` + border radius.

## Wave B — Parser + nested craft (shipped target)

| CSS / selector | Scene | Notes |
|----------------|--------|--------|
| `background-image: …gradient(…)` / gradient in `background` | `props.gradient` | literal; solid `background-color` still → `props.background` |
| `.class span` / `.class em` (one level) | merged into descendant style | extends P1 `.class h2` parser |
| `.foo + .foo` / `.bar tag + tag` | merged when prev sibling matches | padding/border tweaks only |
| `grid-column` / `grid-row` | `node.style.gridColumn` / `gridRow` | paint escape; no Inspect field |
| colored / block inline in `h1`–`h3` | `SiteStack` of `SiteText` | split when child `color` ≠ parent or `display:block` |
| structural `<a>` with block `span` | `SiteStack` children | no flatten to single label |

### EARS (Wave B)

- WENN resolved `background-image` oder `background` einen `linear-gradient` / `repeating-linear-gradient` enthält, DANN MUSS der Mapper `props.gradient` setzen (resolved literals, kein `var()`).
- WENN ein `<style>`-Rule `.brand span` oder `.intro h2 em` matcht, DANN MUSS der Mapper die Deklarationen auf das Kind-Element anwenden.
- WENN ein Element die Klasse des rechten Teils von `.day + .day` trägt und das unmittelbare vorherige Geschwister die linke Klasse teilt, DANN MUSS der Mapper die Sibling-Rule mergen.
- WENN ein Grid-Kind `grid-column` oder `grid-row` trägt, DANN MUSS der Mapper den Literal-String auf `node.style` schreiben.
- WENN ein Headline-Kind (`em`/`span`) eine abweichende `color` oder `display:block` hat, DANN MUSS der Import mehrere `SiteText`-Knoten unter `SiteStack` erzeugen (kein Style-Mashup in einem `children`-String).

### Acceptance

- Unit tests for gradient, `.brand span`, `.day + .day`, `grid-column: 2`, colored `em` in `h2`.
- Lindenau fixture: intro `em` wine color; brand subline typography (stack, not flat mash).

## Wave C — Decorative overlays (shipped target)

No new Site Kit type — `::before` / `::after` map to **decorative `SiteStack` children** on the host (first = before, last = after). Host gets `node.style.position: relative` when layers attach.

| CSS pseudo | Scene | Notes |
|------------|--------|--------|
| `.host::before` / `::after` | child `SiteStack` named `::before` / `::after` | empty; paint via props + `node.style` |
| gradient / bg / border / opacity | `props.gradient`, `props.background`, `style.border*`, `props.opacity` | same channels as Wave A/B |
| `inset` / `top` / `left` / `width` / `height` / `transform` | `node.style` | decor only — not on flow nodes |
| `position:absolute` on decor | `node.style.position: absolute` | **Wave C exception** to flow-node absolute ban |
| `clip-path`, `-webkit-text-stroke`, `:hover`, `@keyframes` | not mapped | warn `lossy-pseudo-*` / stay in non-goals |

### EARS (Wave C)

- WENN `<style>` eine Regel `.class::before` oder `.class::after` mit sichtbarer Fläche (gradient, background, border, box-shadow) definiert, DANN MUSS der Mapper ein dekoratives `SiteStack`-Kind am Host erzeugen.
- WENN Dekor-Kinder existieren, DANN MUSS der Host `node.style.position: relative` tragen (Paint-Escape).
- WENN Pseudo-Regeln nur `clip-path` / `transition` / `:hover` o. Ä. enthalten, DANN MUSS der Import warnen und **kein** leeres Decor-Kind erzeugen.
- WENN mindestens ein Pseudo gemappt wurde, DANN MUSS `warnings` `mapped-pseudo-to-decor` statt pauschal `dropped-pseudo` liefern.

### Acceptance

- Unit test: `.hero-media::before` gradient + `.hero-media::after` border arch.
- Unit test: `clip-path`-only pseudo → warning, kein Kind.
- Lindenau snippet: hero-media trägt `::before` gradient child.

## Phased delivery (update parent)

| Phase | Scope |
|-------|--------|
| P2-A | This doc Wave A |
| P2-B | Wave B |
| P2-C | Wave C or explicit wont-do in parent non-goals |

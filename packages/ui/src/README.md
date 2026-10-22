# Zaoly design system (product UI)

Internal tokens + CSS layers for ECHON web-ui. **No** `@zaoly/react` / MUI.

## Layout

```
apps/web-ui/src/design-system/
  index.ts
  tokens/          # brand, colors, spacing, radii, typography, roles
  css/             # tokens → base → ranked → components → briefing → frame → ultra-wide → chat
```

Entry: `apps/web-ui/src/index.css` `@import`s the CSS layers.

**Catalog:** Storybook — `pnpm storybook` · `knowledge/storybook-web-ui.md`

## Themes (`data-theme`)

| Id | Notes |
|----|--------|
| `zaoly` / `zaoly-dark` | Trial (default dark) |
| `zaoly-ui` / `zaoly-ui-dark` | Scale tokens + clearer surfaces |
| `forest` | Legacy; config-only |

Config: `web.ui.theme` / `web.ui.theme_choices` in `config/paths.yaml`. Default stays `zaoly-dark`.

## Scale tokens (CSS)

- `--space-1`…`--space-6` — 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 rem
- `--radius-sm|md|panel|pill|sheet`
- `--type-display|body|mono` (aliases → `--font-*` on themes)
- Motion: `--duration-*` / `--ease-*` / `--motion-*` · Button: `components/Button.tsx` · `knowledge/zaoly-ui-motion-buttons.md`
- Typography: `--type-*` / `--weight-*` / `--stack-*` · `<Text>` · Spec `specs/domain/zaoly-ui-typography.md` · `knowledge/zaoly-ui-typography.md`
- Chip: `<Chip>` · Spec `specs/domain/zaoly-ui-chip.md` · `knowledge/zaoly-ui-chip.md`
- Ranked list: `<RankedList>` / `<RankedRow>` · Spec `specs/domain/zaoly-ui-ranked-list.md` · `knowledge/zaoly-ui-ranked-list.md`
- Field: `<Field>` / `<Input>` / custom `<Select>` (no native OS dropdown) · Spec `specs/domain/zaoly-ui-field.md` · `knowledge/zaoly-ui-field.md`
- Foundation: Panel, MetricChip, PageTitle, Textarea, ToggleGroup, Hint, FilterRow, StatusDot, Alert, LoadingText/EmptyState · Spec `specs/domain/zaoly-ui-foundation.md` · `knowledge/zaoly-ui-completeness.md`
- Extended: Divider, Checkbox, Switch, Tabs, Skeleton, Spinner, Tooltip, Dialog · Spec `specs/domain/zaoly-ui-extended.md` · CSS `css/extended.css`
- Button: Spec `specs/domain/zaoly-ui-button.md` · `knowledge/zaoly-ui-motion-buttons.md`

Under v2, legacy `--radius` → `--radius-sm`. Panels use `--radius-panel`.

## Extend

1. Add TS values in `tokens/*.ts` (+ unit test).
2. Mirror CSS vars in `css/tokens.css` for the theme block(s).
3. Prefer `var(--space-*)` / `var(--radius-*)` in component CSS.
4. Charts: `chartTokensFor()` in `theme/zaolyTokens.ts` reads design-system colors.

## Links

- Map (pre-pass): `zaoly-ui-design-system-map.md`
- Trial themes: `ui-zaoly-trial.md`
- Paths: `urls-and-paths.md` · `config/paths.yaml` `brand.*` / `web.ui.*`
- ADR 0028 (amended for v2 theme ids)

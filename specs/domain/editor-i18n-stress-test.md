# Internationalization & RTL Layout Stress-Testing — CREATION v3 (P123)

**Status:** Accepted (P123) — 2026-09-08  
**Parent:** `specs/domain/composition-scene.md` · `specs/domain/editor-inspect.md`  
**Target:** Web (`apps/web/lib/scene/i18n-simulator.ts`, Canvas) & macOS Native (`I18nSimulator.swift`, `NativeSceneHTMLRenderer.swift`)

## Goal

Modern global digital products must gracefully handle multilingual layout expansion and bi-directional text flows (Right-to-Left / RTL):
- **Text Expansion (+30% to +40%):** Translations from English to languages such as German, Greek, French, or Finnish frequently result in significantly longer strings, causing button labels to wrap awkwardly or containers to overflow and break spatial alignments.
- **RTL Mirroring (Arabic, Hebrew, Persian):** Text direction flips, flex directions invert (`flex-start` becomes `flex-end`), icon placements swap from left to right, and padding asymmetries must be mirrored.

P123 provides a live, non-destructive **Simulation Mode** directly within the CREATION editor viewport.

---

## Domain Contracts (`packages/contracts`)

```typescript
export type CanvasLayoutDirection = 'ltr' | 'rtl'

export interface I18nStressTestConfig {
  /** Whether pseudo-localization string expansion is active. */
  pseudoLocalization: boolean
  /** Target text length expansion multiplier (default 1.35 for +35%). */
  expansionMultiplier?: number
  /** Text direction mode (LTR or RTL). */
  direction: CanvasLayoutDirection
  /** Prefix/suffix markers to visually demarcate translated strings. */
  bracketEnclosure?: boolean
}
```

---

## Functional Characteristics

### 1. Pseudo-Localization Transformation
When active, every text string in the preview AST is dynamically transformed:
1. **Accented Character Replacement:** Vowels are replaced with diacritical counterparts (`a` -> `å`, `e` -> `é`, `o` -> `ö`) to verify character set and font encoding.
2. **Expansion Padding (+35%):** Vowels or tail markers are repeated to simulate typical Romance and Germanic word expansion.
3. **Bracket Enclosure:** Wrapped in `[...!!!]` so truncation or hidden overflows are instantly visible at the canvas boundary.
   - Example: `"Submit Payment"` -> `"[Süübmiit Pååyméént !!!]"`

### 2. RTL Canvas Mirroring
- Adds `dir="rtl"` to the page artboard container.
- Flex layouts with `flex-direction: row` automatically invert child order in standard CSS.
- Text alignments of `left` adapt to standard start-of-line orientation.

### 3. Non-Destructive Guarantee
Simulation transforms occur **only during canvas rendering / preview generation**. The underlying `CompositionScene` document and AST remain 100% untouched and unmutated.

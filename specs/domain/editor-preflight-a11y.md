# Editor Pre-Flight & A11y Engine — CREATION v3 (P122)

**Status:** Accepted (P122) — 2026-09-08  
**Parent:** `specs/domain/code-export-handoff.md` (P99) · `specs/domain/editor-inspect.md`  
**Target:** Web (`apps/web/lib/scene/scene-linter.ts`, `editor-linter-panel.tsx`) & macOS Native (`SceneLinter.swift`, `NativeLinterSheet.swift`)

## Goal

Enterprise-grade design systems and web applications require rigorous automated compliance with **WCAG 2.2 Level AA / AAA** accessibility and usability standards prior to deployment. P122 expands CREATION's audit capabilities into a comprehensive **Pre-Flight Accessibility Engine**:

1. **Touch-Target Sizing Validation (WCAG 2.5.8 Target Size Minimum):**
   - Flags all interactive nodes (`Button`, `Input`, clickable elements) with effective dimensions `< 44x44px` on mobile/touch viewports.
   - Provides 1-click auto-fix to enforce `minWidth: 44px; minHeight: 44px;`.
2. **Accessible Name & Icon-Only Button Verification (WCAG 4.1.2 Name, Role, Value):**
   - Detects interactive elements lacking both visible text and `aria-label` or `aria-labelledby`.
   - 1-click auto-fix generates a semantic `aria-label` derived from the node's identifier, icon name, or component role.
3. **Sequential Focus Navigation & Tab-Order Analysis (WCAG 2.4.3 Focus Order):**
   - Automatically computes document-order keyboard tab sequences across DOM nodes.
   - Flags non-standard or discontinuous positive `tabindex` values (`tabindex > 0`) that break natural reading flow.
   - Highlights sequential focus navigation path on the canvas with numbered badges.

---

## Domain Contracts (`packages/contracts`)

```typescript
export type A11yIssueSeverity = 'error' | 'warning' | 'info'

export type A11yIssueCategory =
  | 'contrast'
  | 'touch-target'
  | 'accessible-name'
  | 'focus-order'
  | 'typography'

export interface A11yPreFlightIssue {
  id: string
  nodeId: string
  pageId?: string
  category: A11yIssueCategory
  severity: A11yIssueSeverity
  ruleId: string
  title: string
  description: string
  wcagCriterion?: string
  fixAction?: {
    type: 'set-style' | 'set-prop'
    key: string
    value: string
  }
}

export interface TabOrderEntry {
  nodeId: string
  tabIndex: number
  orderIndex: number
  label: string
}

export interface A11yPreFlightReport {
  score: number
  issues: A11yPreFlightIssue[]
  tabOrder: TabOrderEntry[]
  summary: {
    errorsCount: number
    warningsCount: number
    passedChecksCount: number
  }
}
```

---

## Validation Rules

| Rule ID | Category | WCAG Criterion | Condition | Auto-Fix |
|---------|----------|----------------|-----------|----------|
| `touch-target-small` | `touch-target` | 2.5.8 (AA) | Interactive node width/height `< 44px` | Set `minWidth: 44px`, `minHeight: 44px` |
| `icon-button-no-aria`| `accessible-name`| 4.1.2 (A) | Button with no text children & missing `aria-label` | Set `aria-label: "Action"` |
| `positive-tab-index` | `focus-order` | 2.4.3 (A) | Node specifies explicit `tabIndex > 0` | Reset `tabIndex: 0` |
| `heading-hierarchy` | `typography` | 1.3.1 (A) | Skipping heading levels (e.g. `H1` -> `H3`) | Set heading to next expected level |

---

## Parity Guarantee

Both Web and macOS Native share:
- Identical linting rules and severity weights.
- 1-click remediation actions via `SceneOp.setStyle` / `SceneOp.setProp`.
- Synchronous pre-flight scoring: `score = max(0, 100 - (errors * 15 + warnings * 5))`.

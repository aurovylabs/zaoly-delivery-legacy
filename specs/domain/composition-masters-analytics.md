# Master Component Usage Impact & Instance Analytics — CREATION v3 (P118)

**Status:** Accepted · **Date:** 2026-09-08  
**Context:** Blast-radius analysis, instance telemetry, override inspection, and deep navigation for Master Components across Web (`apps/web`) and macOS Desktop Native (`apps/macos`).  
**Parent:** `specs/domain/composition-masters.md` · `specs/domain/composition-scene.md` · `specs/domain/editor-workspace.md`  
**Contracts:** `packages/contracts` (`MasterInstanceRef`, `MasterImpactReport`)

---

## 1. Goal & Requirements

When design system maintainers or engineers edit a Master Component, mutating its default tree or token bindings has immediate blast radius across the entire project. Designers need instant visibility into:

1. **Instance Telemetry:**
   - How many instances of a Master exist across the entire scene?
   - On which pages / artboards are they placed?
   - Which variant of the Master does each instance bind to?

2. **Override Detection:**
   - Identify whether an instance contains local root overrides (`instanceOverrides.props`, `instanceOverrides.style`, `instanceOverrides.tokenBindings`).
   - List the specific mutated keys (e.g., `props.label`, `style.backgroundColor`).

3. **Bidirectional Quick-Jump Navigation:**
   - From the Masters sidebar/panel, clicking an instance ref immediately selects the target page and focuses/selects the instance node on canvas (`selectNode(pageId, nodeId)`).

4. **Zero Performance Overhead:**
   - Analysis runs on-demand or memoized per scene revision; avoids deep cloning of non-instance subtrees.

---

## 2. Data Model

Contracts in `@zaoly/contracts`:

```typescript
export interface MasterInstanceRef {
  instanceNodeId: string
  pageId: string
  pageName: string
  parentNodeId?: string
  variantId?: string
  hasOverrides: boolean
  overrideKeys: string[]
}

export interface MasterImpactReport {
  masterId: string
  masterName: string
  totalInstances: number
  pageCount: number
  instances: MasterInstanceRef[]
}
```

---

## 3. EARS Requirements

### Master Impact Analysis
- **WENN** the designer views or selects a Master in the Masters panel,
- **DANN MUST** the system calculate a `MasterImpactReport` scanning all pages and nodes for `type === 'Instance'` with `instanceOf === masterId`.
- **DANN MUST** it identify whether `instanceOverrides` are present and compute the list of override keys across `props`, `style`, and `tokenBindings`.

### Quick-Jump Navigation
- **WENN** the designer clicks an instance in the impact report,
- **DANN MUST** the editor switch the active page to `instance.pageId` (if different from current) and set the selection to `[instance.instanceNodeId]`.

---

## 4. Related Specs & Implementations

- `specs/domain/composition-masters.md`
- `apps/web/lib/scene/master-impact.ts`
- `apps/macos/Sources/CREATIONApp/Models/MasterImpact.swift`
- `packages/contracts`

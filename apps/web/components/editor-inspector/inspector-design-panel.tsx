'use client'

import type { Translator } from '../../lib/i18n'
import type { SceneNode } from '@zaoly/contracts'
import { Button, Dialog, Field, Input, Select, Text } from '@zaoly/ui'
import { IconPlus as Plus } from '../../lib/zaoly-ui'
import { CollapsibleInspectSection } from './collapsible-inspect-section'
import { pairInspectFields, type InspectFieldDef } from '../../lib/inspect/field-catalog'
import type { useInspectorFieldRenderer } from './use-inspector-field-renderer'
import { productOfAxisValueCounts } from '../../lib/scene/master-variants'
import { CHART_STUDIO_OWNED_PROP_NAMES } from '../../lib/chart-studio/owned-props'

type FieldRenderer = ReturnType<typeof useInspectorFieldRenderer>

export type InspectorDesignPanelProps = {
  t: Translator
  filterQuery: string
  setFilterQuery: (value: string) => void
  variantAxes: InspectFieldDef[]
  sections: { id: string; label: string; props: InspectFieldDef[] }[]
  isSectionOpen: (id: string) => boolean
  toggleSection: (id: string) => void
  selected: SceneNode
  isRoot: boolean
  multi: boolean
  locked: boolean
  onRemove: () => void
  onCreateMaster?: () => void
  onSetInstanceVariant?: (variantId: string) => void
  onSetInstanceVariantAxes?: (axes: Record<string, string>) => void
  masters?: {
    id: string
    name: string
    variants?: { id: string; name: string; combination?: Record<string, string> }[]
    defaultVariantId?: string
    axes?: { id: string; name: string; values: string[] }[]
  }[]
  masterEdit?: {
    masterId: string
    masterName: string
    activeVariantId: string
    variants: { id: string; name: string; combination?: Record<string, string> }[]
    axes?: { id: string; name: string; values: string[] }[]
    axisFilters?: Record<string, string>
    onSelectVariant: (variantId: string) => void
    onAddVariant: (name: string) => void
    onRenameVariant: (variantId: string, name: string) => void
    onDeleteVariant: (variantId: string) => void
    onAddAxis?: (name: string, values?: string[]) => void
    onRenameAxis?: (axisId: string, name: string) => void
    onDeleteAxis?: (axisId: string) => void
    onAddAxisValue?: (axisId: string, value: string) => void
    onRenameAxisValue?: (axisId: string, fromValue: string, toValue: string) => void
    onDeleteAxisValue?: (axisId: string, value: string) => void
    onSetAxisFilter?: (axisId: string, value: string) => void
  } | null
  newMasterVariantName: string
  setNewMasterVariantName: (value: string) => void
  masterVariantDialogOpen: boolean
  setMasterVariantDialogOpen: (open: boolean) => void
  /** Chart studio floating panel — teaser when SiteChart + dismissed. */
  chartStudioOpen?: boolean
  onOpenChartStudio?: () => void
  fieldRenderer: FieldRenderer
}

export function InspectorDesignPanel({
  t,
  filterQuery,
  setFilterQuery,
  variantAxes,
  sections,
  isSectionOpen,
  toggleSection,
  selected,
  isRoot,
  multi,
  locked,
  onRemove,
  onCreateMaster,
  onSetInstanceVariant,
  onSetInstanceVariantAxes,
  masters,
  masterEdit,
  newMasterVariantName,
  setNewMasterVariantName,
  masterVariantDialogOpen,
  setMasterVariantDialogOpen,
  chartStudioOpen = false,
  onOpenChartStudio,
  fieldRenderer,
}: InspectorDesignPanelProps) {
  const { renderField, renderSectionFields } = fieldRenderer

  return (
        <>
          <Input
            block
            size="sm"
            className="creation-inspect-filter"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            aria-label={t('editor.inspectFilter')}
            placeholder={t('editor.inspectFilter')}
            data-testid="editor-inspect-filter"
          />

          {(() => {
            const instanceMaster =
              !masterEdit && selected.instanceOf
                ? masters?.find((m) => m.id === selected.instanceOf)
                : undefined
            const instanceVariants = instanceMaster?.variants ?? []
            const instanceAxes = instanceMaster?.axes ?? []
            const showInstanceAxes =
              !masterEdit &&
              Boolean(selected?.instanceOf) &&
              instanceAxes.length > 0 &&
              Boolean(onSetInstanceVariantAxes)
            const showInstanceVariant =
              !showInstanceAxes &&
              Boolean(onSetInstanceVariant) &&
              instanceVariants.length >= 2
            const masterAxes = masterEdit?.axes ?? []
            const showMasterAxesManage = Boolean(masterEdit && masterAxes.length > 0)
            const axisProduct = masterEdit
              ? productOfAxisValueCounts({
                  id: masterEdit.masterId,
                  name: masterEdit.masterName,
                  root: selected,
                  axes: masterAxes,
                })
              : instanceAxes.length
                ? instanceAxes.reduce((acc, a) => acc * Math.max(1, a.values.length), 1)
                : 0
            const showMasterNamed = Boolean(masterEdit)
            const showPropAxes = variantAxes.length > 0
            if (
              !showMasterNamed &&
              !showInstanceVariant &&
              !showInstanceAxes &&
              !showPropAxes
            ) {
              return null
            }

            const activeMasterVariant = masterEdit?.variants.find(
              (v) => v.id === masterEdit.activeVariantId,
            )

            const submitAdd = () => {
              if (!masterEdit) return
              const name = newMasterVariantName.trim()
              if (!name) return
              masterEdit.onAddVariant(name)
              setNewMasterVariantName('')
              setMasterVariantDialogOpen(false)
            }

            return (
              <CollapsibleInspectSection
                title={t('editor.variantAxes')}
                titleId="creation-inspect-variant-axes"
                sectionId="variant-axes"
                open={isSectionOpen('variant-axes')}
                onToggle={() => toggleSection('variant-axes')}
                collapseLabel={t('editor.inspectSectionCollapse')}
                expandLabel={t('editor.inspectSectionExpand')}
                testId="editor-variant-axes"
              >
                {showMasterNamed && masterEdit ? (
                  <>
                    {showMasterAxesManage ? (
                      <div
                        className="creation-inspect-master-axes"
                        data-testid="inspect-master-axes"
                      >
                        {axisProduct >= 30 ? (
                          <p
                            className="creation-inspect-axis-warn"
                            data-testid="inspect-master-axis-warn"
                          >
                            {t('editor.mastersAxisProductWarn')}
                          </p>
                        ) : null}
                        {masterAxes.slice(2).map((axis) => (
                          <Field
                            key={`filter-${axis.id}`}
                            label={`${axis.name} (${t('editor.mastersAxisFilter')})`}
                            size="sm"
                          >
                            <Select
                              value={
                                masterEdit.axisFilters?.[axis.id] &&
                                axis.values.includes(masterEdit.axisFilters[axis.id]!)
                                  ? masterEdit.axisFilters[axis.id]!
                                  : axis.values[0] ?? ''
                              }
                              data-testid={`inspect-master-axis-filter-${axis.id}`}
                              options={axis.values.map((v) => ({ value: v, label: v }))}
                              onChange={(next) => {
                                if (next) masterEdit.onSetAxisFilter?.(axis.id, next)
                              }}
                            />
                          </Field>
                        ))}
                        {masterAxes.map((axis) => (
                          <div
                            key={axis.id}
                            className="creation-inspect-master-axis"
                            data-testid={`inspect-master-axis-${axis.id}`}
                          >
                            <Field label={t('editor.mastersAxisName')} size="sm">
                              <Input
                                block
                                size="sm"
                                key={`${axis.id}-name`}
                                defaultValue={axis.name}
                                data-testid={`inspect-master-axis-rename-${axis.id}`}
                                onBlur={(e) => {
                                  const next = e.currentTarget.value.trim()
                                  if (next && next !== axis.name) {
                                    masterEdit.onRenameAxis?.(axis.id, next)
                                  } else {
                                    e.currentTarget.value = axis.name
                                  }
                                }}
                              />
                            </Field>
                            <Text role="meta" as="p">
                              {axis.values.join(', ')}
                            </Text>
                            <div className="creation-inspect-master-variants creation-inspect-master-variants--compact">
                              <Input
                                block
                                size="sm"
                                placeholder={t('editor.mastersAddAxisValue')}
                                aria-label={t('editor.mastersAddAxisValue')}
                                data-testid={`inspect-master-axis-add-value-${axis.id}`}
                                onKeyDown={(e) => {
                                  if (e.key !== 'Enter') return
                                  const value = e.currentTarget.value.trim()
                                  if (!value) return
                                  masterEdit.onAddAxisValue?.(axis.id, value)
                                  e.currentTarget.value = ''
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                data-testid={`inspect-master-axis-delete-${axis.id}`}
                                onClick={() => masterEdit.onDeleteAxis?.(axis.id)}
                              >
                                {t('editor.mastersDeleteAxis')}
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant="subtle"
                          data-testid="inspect-master-axis-add"
                          onClick={() =>
                            masterEdit.onAddAxis?.(t('editor.mastersNewAxisName'), ['Default'])
                          }
                        >
                          {t('editor.mastersAddAxis')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="subtle"
                        data-testid="inspect-master-axis-add"
                        onClick={() =>
                          masterEdit.onAddAxis?.(t('editor.mastersNewAxisName'), ['Default'])
                        }
                      >
                        {t('editor.mastersAddAxis')}
                      </Button>
                    )}
                    <div
                      className="creation-inspect-master-variants creation-inspect-master-variants--compact"
                      data-testid="inspect-master-variants"
                    >
                      <Select
                        value={masterEdit.activeVariantId}
                        data-testid="inspect-master-variant-select"
                        aria-label={t('editor.mastersInstanceVariant')}
                        options={masterEdit.variants.map((v) => ({
                          value: v.id,
                          label: v.name,
                        }))}
                        onChange={(next) => {
                          if (next) masterEdit.onSelectVariant(next)
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="subtle"
                        icon={<Plus size={16} strokeWidth={1.75} aria-hidden />}
                        aria-label={t('editor.mastersAddVariant')}
                        title={t('editor.mastersAddVariant')}
                        data-testid="inspect-master-variant-add-open"
                        onClick={() => {
                          setNewMasterVariantName('')
                          setMasterVariantDialogOpen(true)
                        }}
                      />
                    </div>
                    <Dialog
                      open={masterVariantDialogOpen}
                      onClose={() => setMasterVariantDialogOpen(false)}
                      title={t('editor.mastersAddVariant')}
                      className="creation-inspect-master-variant-dialog"
                      data-testid="inspect-master-variant-dialog"
                      actions={
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            data-testid="inspect-master-variant-dialog-cancel"
                            onClick={() => setMasterVariantDialogOpen(false)}
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="subtle"
                            disabled={!newMasterVariantName.trim()}
                            data-testid="inspect-master-variant-add-btn"
                            onClick={submitAdd}
                          >
                            {t('editor.mastersAddVariant')}
                          </Button>
                        </>
                      }
                    >
                      <Field label={t('editor.mastersAddVariantPlaceholder')} size="sm">
                        <Input
                          block
                          size="sm"
                          value={newMasterVariantName}
                          placeholder={t('editor.mastersAddVariantPlaceholder')}
                          aria-label={t('editor.mastersAddVariantPlaceholder')}
                          data-testid="inspect-master-variant-add-input"
                          autoFocus
                          onChange={(e) => setNewMasterVariantName(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitAdd()
                          }}
                        />
                      </Field>
                      {activeMasterVariant ? (
                        <Field label={t('editor.mastersRenameVariant')} size="sm">
                          <Input
                            block
                            size="sm"
                            key={activeMasterVariant.id}
                            defaultValue={activeMasterVariant.name}
                            data-testid="inspect-master-variant-rename"
                            onBlur={(e) => {
                              const next = e.currentTarget.value.trim()
                              if (next && next !== activeMasterVariant.name) {
                                masterEdit.onRenameVariant(activeMasterVariant.id, next)
                              } else {
                                e.currentTarget.value = activeMasterVariant.name
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                            }}
                          />
                        </Field>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={masterEdit.variants.length <= 1}
                        data-testid="inspect-master-variant-delete-btn"
                        onClick={() => {
                          masterEdit.onDeleteVariant(masterEdit.activeVariantId)
                        }}
                      >
                        {t('editor.mastersDeleteVariant')}
                      </Button>
                    </Dialog>
                  </>
                ) : null}

                {showInstanceAxes && instanceMaster && onSetInstanceVariantAxes ? (
                  <div
                    className="creation-inspect-instance-axes"
                    data-testid="inspect-instance-variant-axes"
                  >
                    {axisProduct >= 30 ? (
                      <p
                        className="creation-inspect-axis-warn"
                        data-testid="inspect-master-axis-warn"
                      >
                        {t('editor.mastersAxisProductWarn')}
                      </p>
                    ) : null}
                    {instanceAxes.map((axis) => {
                      const current =
                        selected.instanceVariantAxes?.[axis.id] ??
                        axis.values[0] ??
                        ''
                      return (
                        <Field key={axis.id} label={axis.name} size="sm">
                          <Select
                            value={axis.values.includes(current) ? current : axis.values[0]!}
                            disabled={locked}
                            data-testid={`editor-instance-axis-${axis.id}`}
                            options={axis.values.map((v) => ({ value: v, label: v }))}
                            onChange={(next) => {
                              if (!next) return
                              const nextAxes: Record<string, string> = {
                                ...(selected.instanceVariantAxes ?? {}),
                              }
                              for (const a of instanceAxes) {
                                nextAxes[a.id] =
                                  a.id === axis.id
                                    ? next
                                    : (nextAxes[a.id] ?? a.values[0] ?? '')
                              }
                              onSetInstanceVariantAxes(nextAxes)
                            }}
                          />
                        </Field>
                      )
                    })}
                  </div>
                ) : null}

                {showInstanceVariant &&
                !showInstanceAxes &&
                instanceMaster &&
                onSetInstanceVariant ? (
                  <Field label={t('editor.mastersInstanceVariant')} size="sm">
                    <Select
                      value={
                        selected.instanceVariantId &&
                        instanceVariants.some((v) => v.id === selected.instanceVariantId)
                          ? selected.instanceVariantId
                          : instanceMaster.defaultVariantId ?? instanceVariants[0]!.id
                      }
                      disabled={locked}
                      data-testid="editor-instance-variant-select"
                      options={instanceVariants.map((v) => ({
                        value: v.id,
                        label: v.name,
                      }))}
                      onChange={(next) => {
                        if (next) onSetInstanceVariant(next)
                      }}
                    />
                  </Field>
                ) : null}

                {showPropAxes
                  ? pairInspectFields(variantAxes).map((row) =>
                      Array.isArray(row) ? (
                        <div key={row[0].name} className="creation-inspect-pair">
                          {renderField(row[0])}
                          {renderField(row[1])}
                        </div>
                      ) : (
                        renderField(row)
                      ),
                    )
                  : null}
              </CollapsibleInspectSection>
            )
          })()}

          {(() => {
            const showCreateMaster = Boolean(
              selected && !isRoot && !selected.instanceOf && !multi && onCreateMaster,
            )
            const showChartStudioTeaser = Boolean(
              selected?.type === 'SiteChart' && !multi && onOpenChartStudio && !chartStudioOpen,
            )
            const componentSection = sections.find((s) => s.id === 'component')
            const otherSections = sections.filter((s) => s.id !== 'component')
            const componentVisible =
              componentSection?.props.filter(
                (field) =>
                  !(field.variantAxis && field.section === 'component') &&
                  field.name !== 'type' &&
                  field.name !== 'id' &&
                  !(selected?.type === 'SiteChart' && CHART_STUDIO_OWNED_PROP_NAMES.has(field.name)),
              ) ?? []
            const showComponent =
              showCreateMaster || showChartStudioTeaser || componentVisible.length > 0

            return (
              <>
                {showComponent ? (
                  <CollapsibleInspectSection
                    title={componentSection?.label ?? t('editor.inspectSectionComponent')}
                    titleId="creation-inspect-component"
                    sectionId="component"
                    open={isSectionOpen('component')}
                    onToggle={() => toggleSection('component')}
                    collapseLabel={t('editor.inspectSectionCollapse')}
                    expandLabel={t('editor.inspectSectionExpand')}
                    testId="editor-inspect-section-component"
                  >
                    {showCreateMaster ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        block
                        disabled={locked}
                        data-testid="editor-create-master-btn"
                        onClick={() => onCreateMaster?.()}
                      >
                        {t('editor.mastersCreate')}
                      </Button>
                    ) : null}
                    {showChartStudioTeaser ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="subtle"
                        block
                        disabled={locked}
                        data-testid="editor-open-chart-studio"
                        onClick={() => onOpenChartStudio?.()}
                      >
                        {t('editor.chartStudioOpen')}
                      </Button>
                    ) : null}
                    {/* Same partition path as other sections (Media group for Image/SiteImage). */}
                    {renderSectionFields('component', componentVisible)}
                  </CollapsibleInspectSection>
                ) : null}
                {otherSections.map((section) => {
                  const visible = section.props.filter(
                    (field) =>
                      !(field.variantAxis && field.section === 'component') &&
                      field.name !== 'type' &&
                      field.name !== 'id',
                  )
                  if (!visible.length) return null
                  return (
                    <CollapsibleInspectSection
                      key={section.id}
                      title={section.label}
                      titleId={`creation-inspect-${section.id}`}
                      sectionId={section.id}
                      open={isSectionOpen(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      collapseLabel={t('editor.inspectSectionCollapse')}
                      expandLabel={t('editor.inspectSectionExpand')}
                      testId={`editor-inspect-section-${section.id}`}
                    >
                      {renderSectionFields(section.id, visible)}
                    </CollapsibleInspectSection>
                  )
                })}
              </>
            )
          })()}

          {!isRoot && !locked ? (
            <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
              {multi ? t('editor.removeNodes') : t('editor.removeNode')}
            </Button>
          ) : null}
        </>

  )
}

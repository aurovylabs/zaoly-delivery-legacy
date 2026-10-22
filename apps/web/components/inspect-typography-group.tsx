'use client'

import type { ReactNode } from 'react'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { TYPE_CHROME_KEYS } from '../lib/inspect/typography-groups'

type InspectTypographyGroupProps = {
  stackFields: InspectFieldDef[]
  chromeFields: InspectFieldDef[]
  renderStackField: (field: InspectFieldDef) => ReactNode
  renderChromeControl: (field: InspectFieldDef) => ReactNode
  groupLabel: string
  alignLabel: string
  decorationLabel: string
  transformLabel: string
}

function fieldByName(fields: InspectFieldDef[], name: string): InspectFieldDef | undefined {
  return fields.find((field) => field.name === name)
}

export function InspectTypographyGroup({
  stackFields,
  chromeFields,
  renderStackField,
  renderChromeControl,
  groupLabel,
  alignLabel,
  decorationLabel,
  transformLabel,
}: InspectTypographyGroupProps) {
  if (!stackFields.length && !chromeFields.length) return null

  const fontField = fieldByName(stackFields, 'fontFamily')
  const sizeField = fieldByName(stackFields, 'fontSize')
  const weightField = fieldByName(stackFields, 'fontWeight')
  const leadingField = fieldByName(stackFields, 'lineHeight')
  const trackingField = fieldByName(stackFields, 'letterSpacing')

  const chromeLabel: Record<string, string> = {
    textAlign: alignLabel,
    textDecoration: decorationLabel,
    textTransform: transformLabel,
  }

  return (
    <div className="creation-inspect-type" data-testid="inspect-typography-group">
      <div className="creation-inspect-type__header">
        <span className="creation-inspect-type__label">{groupLabel}</span>
      </div>

      <div className="creation-inspect-type__stack" data-testid="inspect-type-stack">
        {fontField ? (
          <div className="creation-inspect-type__font">{renderStackField(fontField)}</div>
        ) : null}
        {sizeField || weightField ? (
          <div className="creation-inspect-pair">
            {sizeField ? renderStackField(sizeField) : null}
            {weightField ? renderStackField(weightField) : null}
          </div>
        ) : null}
        {leadingField || trackingField ? (
          <div className="creation-inspect-pair">
            {leadingField ? renderStackField(leadingField) : null}
            {trackingField ? renderStackField(trackingField) : null}
          </div>
        ) : null}
      </div>

      {chromeFields.length ? (
        <div className="creation-inspect-type__chrome" data-testid="inspect-type-chrome">
          {TYPE_CHROME_KEYS.map((key) => {
            const field = fieldByName(chromeFields, key)
            if (!field) return null
            return (
              <div key={key} className="creation-inspect-type__chrome-col">
                <span className="creation-inspect-type__chrome-label">{chromeLabel[key]}</span>
                {renderChromeControl(field)}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  PrintCallout,
  PrintChip,
  PrintChipRow,
  PrintPage,
  PrintPersonaGrid,
  PrintPullQuote,
  PrintRankedList,
  PrintSteps,
  PrintTable,
  PrintTwoColumn,
  normalizePrintCalloutVariant,
  normalizePrintChipTone,
  normalizePrintColumnAlignList,
  normalizePrintStepsEmphasisIndex,
  normalizePrintStepsOrientation,
} from './PrintPrimitives'

describe('PrintPrimitives magazine twins', () => {
  it('renders folio, pull quote, two-column ranked list, and persona grid', () => {
    render(
      <PrintPage folioTitle="beispiel.de" folioPage="2 — 5">
        <PrintPullQuote label="Fazit" body="GEO ausbaufähig." />
        <PrintTwoColumn
          left={<p className="zaoly-print-body">Links</p>}
          right={
            <PrintRankedList
              columns={2}
              items={[
                { label: 'Alpha Finding mit etwas längerem Text' },
                { label: 'Beta' },
                { label: 'Gamma' },
                { label: 'Delta' },
              ]}
            />
          }
        />
        <PrintPersonaGrid
          personas={[
            {
              name: 'Anna Planer',
              segment: 'B2B',
              confidence: 0.8,
              goals: ['Lieferklarheit'],
            },
            {
              name: 'Jonas Sucher',
              confidence: 0.7,
            },
          ]}
        />
      </PrintPage>,
    )

    expect(screen.getByText('beispiel.de')).toBeTruthy()
    expect(screen.getByText('2 — 5')).toBeTruthy()
    expect(screen.getByText('GEO ausbaufähig.')).toBeTruthy()
    expect(screen.getByText('Anna Planer')).toBeTruthy()
    expect(screen.getByText('Jonas Sucher')).toBeTruthy()
    expect(screen.getByText('Alpha Finding mit etwas längerem Text')).toBeTruthy()
  })

  it('P92 PrintChip tones map to modifier classes', () => {
    expect(normalizePrintChipTone(undefined)).toBe('default')
    expect(normalizePrintChipTone('nope')).toBe('default')
    const { container } = render(
      <PrintChipRow>
        <PrintChip tone="default">default</PrintChip>
        <PrintChip tone="muted">muted</PrintChip>
        <PrintChip tone="accent">accent</PrintChip>
        <PrintChip tone="solid">solid</PrintChip>
      </PrintChipRow>,
    )
    expect(container.querySelector('.zaoly-print-chip--muted')).toBeTruthy()
    expect(container.querySelector('.zaoly-print-chip--accent')).toBeTruthy()
    expect(container.querySelector('.zaoly-print-chip--solid')).toBeTruthy()
    expect(container.querySelectorAll('[data-tone="default"]').length).toBeGreaterThan(0)
  })

  it('P92 PrintCallout variants map to modifier classes', () => {
    expect(normalizePrintCalloutVariant(undefined)).toBe('wash')
    expect(normalizePrintCalloutVariant('nope')).toBe('wash')
    const { container } = render(
      <PrintPage>
        <PrintCallout variant="wash">wash</PrintCallout>
        <PrintCallout variant="emphasize">emphasize</PrintCallout>
        <PrintCallout variant="quiet" label="Note">
          quiet
        </PrintCallout>
      </PrintPage>,
    )
    expect(container.querySelector('.zaoly-print-callout--wash')).toBeTruthy()
    expect(container.querySelector('.zaoly-print-callout--emphasize')).toBeTruthy()
    expect(container.querySelector('.zaoly-print-callout--quiet')).toBeTruthy()
    expect(container.querySelector('[data-variant="quiet"]')).toBeTruthy()
    expect(screen.getByText('Note')).toBeTruthy()
  })

  it('P92 PrintTable columnAlign applies per-column textAlign', () => {
    expect(normalizePrintColumnAlignList('left,left,right', 3)).toEqual([
      'left',
      'left',
      'right',
    ])
    expect(normalizePrintColumnAlignList(['right'], 3)).toEqual(['right', 'left', 'left'])
    const { container } = render(
      <PrintPage>
        <PrintTable
          columns={['Metric', 'Now', 'EUR']}
          columnAlign={['left', 'left', 'right']}
          rows={[['GEO', 72, '1.240']]}
        />
      </PrintPage>,
    )
    const cells = container.querySelectorAll('.zaoly-print-table td')
    expect((cells[2] as HTMLElement).style.textAlign).toBe('right')
    const heads = container.querySelectorAll('.zaoly-print-table th')
    expect((heads[2] as HTMLElement).style.textAlign).toBe('right')
  })

  it('P92 PrintSteps emphasisIndex marks the active step', () => {
    expect(normalizePrintStepsOrientation('vertical')).toBe('vertical')
    expect(normalizePrintStepsEmphasisIndex(2, 4)).toBe(2)
    expect(normalizePrintStepsEmphasisIndex(9, 4)).toBeUndefined()
    const { container } = render(
      <PrintPage>
        <PrintSteps
          emphasisIndex={2}
          steps={[
            { label: 'Audit' },
            { label: 'Cluster' },
            { label: 'Prioritize', detail: 'Rank' },
            { label: 'Ship' },
          ]}
        />
      </PrintPage>,
    )
    expect(container.querySelectorAll('.zaoly-print-steps__item')).toHaveLength(4)
    expect(container.querySelector('[data-emphasis="true"]')?.textContent).toContain('Prioritize')
  })
})

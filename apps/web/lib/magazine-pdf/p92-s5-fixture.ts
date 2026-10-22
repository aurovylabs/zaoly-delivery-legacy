import type { CompositionScene, SceneNode } from '@zaoly/contracts'

function text(id: string, slot: string, value: string, role?: string): SceneNode {
  return {
    id,
    type: 'Text',
    props: { slot, children: value, ...(role ? { role } : {}) },
  }
}

function chip(id: string, label: string, tone: 'default' | 'muted' | 'accent' | 'solid'): SceneNode {
  return {
    id,
    type: 'PrintChip',
    props: { tone },
    children: [text(`${id}__label`, 'label', label, 'title')],
  }
}

/**
 * Golden S5 PrintPage for P92 operator quality eval
 * (accent chips + callout + EUR columnAlign + steps emphasis).
 * Spec knowledge: `knowledge/print-report-quality-eval.md`.
 */
export function buildP92S5PrintPage(): SceneNode {
  return {
    id: 'p92-s5-page',
    type: 'PrintPage',
    children: [
      text('p92-s5-folio', 'label', 'eqc.example', 'meta'),
      text('p92-s5-folio-page', 'footer', '1 — 1', 'meta'),
      {
        id: 'p92-s5-chapter',
        type: 'PrintChapter',
        props: { index: '01' },
        children: [
          text('p92-s5-ch-eye', 'label', 'EQC Report', 'meta'),
          text('p92-s5-ch-title', 'title', 'Sichtbarkeit & Prioritäten', 'title'),
          text(
            'p92-s5-ch-lede',
            'summary',
            'Accent chips, wash callout, EUR-aligned table, and an emphasized process step.',
            'body',
          ),
          {
            id: 'p92-s5-chips',
            type: 'PrintChipRow',
            children: [
              chip('p92-s5-chip-geo', 'GEO', 'muted'),
              chip('p92-s5-chip-cite', 'Citations', 'accent'),
              chip('p92-s5-chip-cov', 'Coverage', 'muted'),
              chip('p92-s5-chip-trust', 'Trust', 'muted'),
            ],
          },
          {
            id: 'p92-s5-callout',
            type: 'PrintCallout',
            props: { variant: 'wash' },
            children: [
              text('p92-s5-co-label', 'label', 'Hinweis', 'meta'),
              text(
                'p92-s5-co-body',
                'value',
                'Nur Contact-Felder haben die Citation-Schwelle gekreuzt — Priorität vor Broad-Crawl.',
                'body',
              ),
            ],
          },
          {
            id: 'p92-s5-table',
            type: 'PrintTable',
            props: { columnAlign: 'left,left,right' },
            children: [
              text('p92-s5-table__col_0', 'label', 'Issue', 'meta'),
              text('p92-s5-table__col_1', 'label', 'Owner', 'meta'),
              text('p92-s5-table__col_2', 'label', 'EUR', 'meta'),
              {
                id: 'p92-s5-row-0',
                type: 'RankedRow',
                children: [
                  text('p92-s5-r0-a', 'label', 'Thin FAQ', 'title'),
                  text('p92-s5-r0-b', 'value', 'Content', 'body'),
                  text('p92-s5-r0-c', 'body', '4.200', 'body'),
                ],
              },
              {
                id: 'p92-s5-row-1',
                type: 'RankedRow',
                children: [
                  text('p92-s5-r1-a', 'label', 'Missing schema', 'title'),
                  text('p92-s5-r1-b', 'value', 'Tech', 'body'),
                  text('p92-s5-r1-c', 'body', '1.850', 'body'),
                ],
              },
              {
                id: 'p92-s5-row-2',
                type: 'RankedRow',
                children: [
                  text('p92-s5-r2-a', 'label', 'Weak CTAs', 'title'),
                  text('p92-s5-r2-b', 'value', 'UX', 'body'),
                  text('p92-s5-r2-c', 'body', '980', 'body'),
                ],
              },
              {
                id: 'p92-s5-row-3',
                type: 'RankedRow',
                children: [
                  text('p92-s5-r3-a', 'label', 'Orphan PDFs', 'title'),
                  text('p92-s5-r3-b', 'value', 'Ops', 'body'),
                  text('p92-s5-r3-c', 'body', '640', 'body'),
                ],
              },
            ],
          },
          {
            id: 'p92-s5-steps',
            type: 'PrintSteps',
            props: { orientation: 'horizontal', emphasisIndex: '2' },
            children: [
              {
                id: 'p92-s5-step-0',
                type: 'RankedRow',
                children: [
                  text('p92-s5-s0-l', 'label', 'Audit', 'title'),
                  text('p92-s5-s0-d', 'secondary', 'Capture signals', 'meta'),
                ],
              },
              {
                id: 'p92-s5-step-1',
                type: 'RankedRow',
                children: [
                  text('p92-s5-s1-l', 'label', 'Cluster', 'title'),
                  text('p92-s5-s1-d', 'secondary', 'Group themes', 'meta'),
                ],
              },
              {
                id: 'p92-s5-step-2',
                type: 'RankedRow',
                children: [
                  text('p92-s5-s2-l', 'label', 'Prioritize', 'title'),
                  text('p92-s5-s2-d', 'secondary', 'Rank actions', 'meta'),
                ],
              },
              {
                id: 'p92-s5-step-3',
                type: 'RankedRow',
                children: [
                  text('p92-s5-s3-l', 'label', 'Ship', 'title'),
                  text('p92-s5-s3-d', 'secondary', 'Publish fixes', 'meta'),
                ],
              },
            ],
          },
        ],
      },
    ],
  }
}

export function buildP92S5EvalScene(): CompositionScene {
  return {
    id: 'p92-s5-eval',
    name: 'P92 S5 Report Smoke',
    version: 1,
    root: {
      id: 'p92-s5-root',
      type: 'Stack',
      children: [buildP92S5PrintPage()],
    },
    updatedAt: '2026-09-13T00:00:00.000Z',
    platformProjectId: null,
  }
}

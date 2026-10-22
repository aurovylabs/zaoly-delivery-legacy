'use client'

import React from 'react'
import { ChromeTip } from './chrome-tip'
import { useT } from '../lib/user-prefs'

export type SpatialAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type SpatialDistribution = 'horizontal' | 'vertical'

export type MultiAlignToolbarProps = {
  selectedCount: number
  onAlign: (alignment: SpatialAlignment) => void
  onDistribute: (axis: SpatialDistribution) => void
  className?: string
}

export function MultiAlignToolbar({
  selectedCount,
  onAlign,
  onDistribute,
  className = '',
}: MultiAlignToolbarProps) {
  const t = useT()
  if (selectedCount < 2) return null

  return (
    <div
      className={`creation-multi-align-toolbar ${className}`}
      data-testid="multi-align-toolbar"
      role="toolbar"
      aria-label={t('editor.align.toolbar')}
    >
      <div className="creation-multi-align-toolbar__group">
        <ChromeTip tip={t('editor.align.left')}>
          <button
            type="button"
            className="creation-multi-align-toolbar__btn"
            data-testid="align-left-btn"
            onClick={() => onAlign('left')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="2" height="12" rx="0.5" />
              <rect x="6" y="4" width="7" height="3" rx="0.5" />
              <rect x="6" y="9" width="5" height="3" rx="0.5" />
            </svg>
          </button>
        </ChromeTip>

        <ChromeTip tip={t('editor.align.center')}>
          <button
            type="button"
            className="creation-multi-align-toolbar__btn"
            data-testid="align-center-h-btn"
            onClick={() => onAlign('center')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="7" y="2" width="2" height="12" rx="0.5" opacity="0.6" />
              <rect x="3" y="4" width="10" height="3" rx="0.5" />
              <rect x="4.5" y="9" width="7" height="3" rx="0.5" />
            </svg>
          </button>
        </ChromeTip>

        <ChromeTip tip={t('editor.align.right')}>
          <button
            type="button"
            className="creation-multi-align-toolbar__btn"
            data-testid="align-right-btn"
            onClick={() => onAlign('right')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="12" y="2" width="2" height="12" rx="0.5" />
              <rect x="3" y="4" width="7" height="3" rx="0.5" />
              <rect x="5" y="9" width="5" height="3" rx="0.5" />
            </svg>
          </button>
        </ChromeTip>

        <div className="creation-multi-align-toolbar__separator" />

        <ChromeTip tip={t('editor.align.top')}>
          <button
            type="button"
            className="creation-multi-align-toolbar__btn"
            data-testid="align-top-btn"
            onClick={() => onAlign('top')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="12" height="2" rx="0.5" />
              <rect x="4" y="6" width="3" height="7" rx="0.5" />
              <rect x="9" y="6" width="3" height="5" rx="0.5" />
            </svg>
          </button>
        </ChromeTip>

        <ChromeTip tip={t('editor.align.middle')}>
          <button
            type="button"
            className="creation-multi-align-toolbar__btn"
            data-testid="align-middle-v-btn"
            onClick={() => onAlign('middle')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="7" width="12" height="2" rx="0.5" opacity="0.6" />
              <rect x="4" y="3" width="3" height="10" rx="0.5" />
              <rect x="9" y="4.5" width="3" height="7" rx="0.5" />
            </svg>
          </button>
        </ChromeTip>

        <ChromeTip tip={t('editor.align.bottom')}>
          <button
            type="button"
            className="creation-multi-align-toolbar__btn"
            data-testid="align-bottom-btn"
            onClick={() => onAlign('bottom')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="12" width="12" height="2" rx="0.5" />
              <rect x="4" y="3" width="3" height="7" rx="0.5" />
              <rect x="9" y="5" width="3" height="5" rx="0.5" />
            </svg>
          </button>
        </ChromeTip>

        {selectedCount >= 3 ? (
          <>
            <div className="creation-multi-align-toolbar__separator" />
            <ChromeTip tip={t('editor.align.distributeH')}>
              <button
                type="button"
                className="creation-multi-align-toolbar__btn"
                data-testid="distribute-h-btn"
                onClick={() => onDistribute('horizontal')}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="2" width="1.5" height="12" rx="0.5" />
                  <rect x="12.5" y="2" width="1.5" height="12" rx="0.5" />
                  <rect x="6.5" y="4" width="3" height="8" rx="0.5" />
                </svg>
              </button>
            </ChromeTip>
            <ChromeTip tip={t('editor.align.distributeV')}>
              <button
                type="button"
                className="creation-multi-align-toolbar__btn"
                data-testid="distribute-v-btn"
                onClick={() => onDistribute('vertical')}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="2" width="12" height="1.5" rx="0.5" />
                  <rect x="2" y="12.5" width="12" height="1.5" rx="0.5" />
                  <rect x="4" y="6.5" width="8" height="3" rx="0.5" />
                </svg>
              </button>
            </ChromeTip>
          </>
        ) : null}
      </div>
    </div>
  )
}

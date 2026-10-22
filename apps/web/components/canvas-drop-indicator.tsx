'use client'

import React from 'react'

export interface CanvasDropIndicatorProps {
  visible: boolean
  edge: 'before' | 'after' | 'into' | null
  direction?: 'row' | 'column' | string
  rect: {
    left: number
    top: number
    width: number
    height: number
  } | null
  label?: string
}

/**
 * P102: Direct Canvas Drag & Drop Glowing Indicator Overlay.
 * Renders a 2px glowing line in brand accent (#1f44ff) with 4px circular anchor dots
 * at both ends, or a glowing dashed container frame for 'into'.
 */
export function CanvasDropIndicator({
  visible,
  edge,
  direction = 'column',
  rect,
  label,
}: CanvasDropIndicatorProps) {
  if (!visible || !edge || !rect) return null

  const isRow = direction === 'row'

  if (edge === 'into') {
    return (
      <div
        data-testid="canvas-drop-indicator-into"
        data-drop-indicator="true"
        style={{
          position: 'absolute',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          border: '2px dashed #1f44ff',
          borderRadius: '8px',
          backgroundColor: 'rgba(31, 68, 255, 0.08)',
          boxShadow: '0 0 12px rgba(31, 68, 255, 0.3)',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'all 0.1s ease',
        }}
      >
        {label && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              backgroundColor: '#1f44ff',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        )}
      </div>
    )
  }

  // Position calculation for insertion line
  let lineX = rect.left
  let lineY = rect.top
  let lineWidth = rect.width
  let lineHeight = 2

  if (isRow) {
    // Vertical line for row containers (left or right)
    lineX = edge === 'before' ? rect.left : rect.left + rect.width
    lineY = rect.top
    lineWidth = 2
    lineHeight = rect.height
  } else {
    // Horizontal line for column containers (above or below)
    lineX = rect.left
    lineY = edge === 'before' ? rect.top : rect.top + rect.height
    lineWidth = rect.width
    lineHeight = 2
  }

  return (
    <div
      data-testid={`canvas-drop-indicator-line-${edge}`}
      data-drop-indicator="true"
      style={{
        position: 'absolute',
        left: `${lineX}px`,
        top: `${lineY - (isRow ? 0 : 1)}px`,
        width: `${lineWidth}px`,
        height: `${lineHeight}px`,
        backgroundColor: '#1f44ff',
        boxShadow: '0 0 8px rgba(31, 68, 255, 0.8), 0 0 2px rgba(31, 68, 255, 1)',
        borderRadius: '2px',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Start anchor dot */}
      <span
        style={{
          position: 'absolute',
          left: isRow ? '-3px' : '-4px',
          top: isRow ? '-4px' : '-3px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#1f44ff',
          boxShadow: '0 0 6px rgba(31, 68, 255, 1)',
        }}
      />
      {/* End anchor dot */}
      <span
        style={{
          position: 'absolute',
          right: isRow ? '-3px' : '-4px',
          bottom: isRow ? '-4px' : '-3px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#1f44ff',
          boxShadow: '0 0 6px rgba(31, 68, 255, 1)',
        }}
      />
      {label && (
        <span
          style={{
            position: 'absolute',
            left: isRow ? '8px' : '50%',
            top: isRow ? '50%' : '-22px',
            transform: isRow ? 'translateY(-50%)' : 'translateX(-50%)',
            backgroundColor: '#1f44ff',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

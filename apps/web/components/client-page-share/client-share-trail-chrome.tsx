'use client'

/**
 * Client share preview trail — same @zaoly/ui chrome language as the editor topbar.
 * Spec: specs/domain/client-page-share.md · knowledge/client-page-share-p7-preview-canvas.md
 */
import {
  Badge,
  Button,
  IconDownload,
  IconImage,
  IconMaximize,
  IconMessage,
  IconZoomIn,
  IconZoomOut,
  Text,
} from '@zaoly/ui'
import { ChromeTip } from '../chrome-tip'

export type ClientShareTrailPage = {
  id: string
  name: string
}

type Props = {
  title: string
  draft?: boolean
  pages: ClientShareTrailPage[]
  pageId: string | null
  onPageChange: (id: string) => void
  zoomPct: number
  pinMode: boolean
  exportBusy: boolean
  onZoomOut: () => void
  onZoomReset: () => void
  onZoomIn: () => void
  onFit: () => void
  onToggleComment: () => void
  onExportPng: () => void
  onExportPdf: () => void
}

export function ClientShareTrailChrome({
  title,
  draft,
  pages,
  pageId,
  onPageChange,
  zoomPct,
  pinMode,
  exportBusy,
  onZoomOut,
  onZoomReset,
  onZoomIn,
  onFit,
  onToggleComment,
  onExportPng,
  onExportPdf,
}: Props) {
  return (
    <div
      className="creation-editor-topbar-chrome"
      data-testid="client-share-trail-chrome"
      role="toolbar"
      aria-label="Shared preview"
    >
      <div className="creation-editor-topbar-chrome__row">
        <div
          className="creation-editor-toolbar__tools"
          data-testid="client-share-trail-tools"
        >
          <Text as="span" role="label" className="creation-share-trail-title">
            {title}
          </Text>
          {draft ? (
            <Badge tone="warning" data-testid="client-share-draft-badge">
              Draft
            </Badge>
          ) : null}
          <div
            className="creation-share-trail-pages"
            data-testid="client-share-trail-pages"
            role="group"
            aria-label="Pages"
          >
            {pages.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={p.id === pageId ? 'subtle' : 'ghost'}
                aria-pressed={p.id === pageId}
                data-testid={`client-share-page-${p.id}`}
                onClick={() => onPageChange(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div
          className="creation-editor-toolbar__actions"
          data-testid="client-share-zoom-controls"
        >
          <ChromeTip tip="Zoom out">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<IconZoomOut />}
              data-testid="client-share-zoom-out"
              aria-label="Zoom out"
              onClick={onZoomOut}
            />
          </ChromeTip>
          <ChromeTip tip="Reset zoom to 100%">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="client-share-zoom-label"
              onClick={onZoomReset}
            >
              <Text as="span" role="meta" className="creation-editor-toolbar__zoom">
                {zoomPct}%
              </Text>
            </Button>
          </ChromeTip>
          <ChromeTip tip="Zoom in">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<IconZoomIn />}
              data-testid="client-share-zoom-in"
              aria-label="Zoom in"
              onClick={onZoomIn}
            />
          </ChromeTip>
          <ChromeTip tip="Fit page">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<IconMaximize />}
              data-testid="client-share-zoom-fit"
              aria-label="Fit page"
              onClick={onFit}
            />
          </ChromeTip>
          <ChromeTip tip={pinMode ? 'Exit comment pin mode' : 'Place comment pin (C)'}>
            <Button
              type="button"
              size="sm"
              variant={pinMode ? 'subtle' : 'ghost'}
              icon={<IconMessage />}
              data-testid="client-share-comment-toggle"
              data-active={pinMode ? 'true' : 'false'}
              aria-pressed={pinMode}
              aria-label={pinMode ? 'Placing comment' : 'Comment'}
              onClick={onToggleComment}
            />
          </ChromeTip>
          <ChromeTip tip="Export PNG">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<IconImage />}
              disabled={exportBusy}
              data-testid="client-share-export-png"
              aria-label="Export PNG"
              onClick={onExportPng}
            />
          </ChromeTip>
          <ChromeTip tip="Export PDF">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<IconDownload />}
              disabled={exportBusy}
              data-testid="client-share-export-pdf"
              aria-label="Export PDF"
              onClick={onExportPdf}
            />
          </ChromeTip>
        </div>
      </div>
    </div>
  )
}

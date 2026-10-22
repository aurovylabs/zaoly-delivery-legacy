'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Dialog,
  Button,
  Input,
  Chip,
  FilterRow,
  ScrollArea,
  Stack,
  Text,
  Card,
  Image,
  EmptyState,
  IconImage as ImageIcon,
  IconUpload as Upload,
  IconSparkles as Sparkles,
  IconCheck as Check,
  IconClose as X,
  IconLayers as Layers,
} from '../lib/zaoly-ui'
import {
  STOCK_ASSETS,
  STOCK_ASSET_CATEGORIES,
  filterStockAssets,
  type StockAsset,
} from '../lib/assets/stock-assets'
import { isRealPlatformProjectId } from '../lib/platform-project-id'
import { videonMediaFrameUrl, videonMediaListUrl } from '../lib/paths'
import {
  buildVideonMediaRefJson,
  DEFAULT_VIDEON_FRAME_T_MS,
} from '../lib/videon/videon-media-ref'

export type AssetLibraryTargetMode = 'background' | 'image' | 'any'

export type ApplyAssetMeta = {
  videonMediaRef?: string
}

interface EditorAssetLibraryDialogProps {
  open: boolean
  onClose: () => void
  targetMode?: AssetLibraryTargetMode
  targetNodeName?: string
  /** Scene Collection id — enables VIDEON category when real UUID. */
  platformProjectId?: string | null
  onApplyAsset: (
    assetUrl: string,
    applyMode: 'background' | 'image',
    meta?: ApplyAssetMeta,
  ) => void
}

const STORAGE_KEY = 'creation-custom-uploaded-assets'
const VIDEON_CATEGORY_ID = 'videon'
const APPLY_FRAME_W = 1280

type VideonListItem = {
  id: string
  originalFilename: string
  mimeType: string
  lifecycleState: string
  durationMs: number | null
  sceneCount: number
  frameUrl: string
}

type LibraryAsset = StockAsset & {
  source?: 'stock' | 'upload' | 'videon'
  videonMediaId?: string
}

function loadCustomAssets(): StockAsset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomAssets(assets: StockAsset[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
  } catch {
    // ignore
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return 'Still'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function EditorAssetLibraryDialog({
  open,
  onClose,
  targetMode = 'any',
  targetNodeName,
  platformProjectId = null,
  onApplyAsset,
}: EditorAssetLibraryDialogProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null)
  const [customAssets, setCustomAssets] = useState<StockAsset[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [videonItems, setVideonItems] = useState<VideonListItem[]>([])
  const [videonStatus, setVideonStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [videonError, setVideonError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const boundCollection = isRealPlatformProjectId(platformProjectId)
  const collectionId = boundCollection ? platformProjectId!.trim() : ''

  useEffect(() => {
    if (open) {
      setCustomAssets(loadCustomAssets())
      setSelectedAsset(null)
      setSearchQuery('')
      setUrlDraft('')
    }
  }, [open])

  useEffect(() => {
    if (!open || activeCategory !== VIDEON_CATEGORY_ID) return
    if (!collectionId) {
      setVideonItems([])
      setVideonStatus('ready')
      setVideonError(null)
      return
    }
    let cancelled = false
    setVideonStatus('loading')
    setVideonError(null)
    void fetch(videonMediaListUrl(collectionId), { credentials: 'same-origin' })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          setVideonItems([])
          setVideonStatus('error')
          setVideonError(body.error ?? `list_failed_${res.status}`)
          return
        }
        const body = (await res.json()) as { items?: VideonListItem[] }
        setVideonItems(Array.isArray(body.items) ? body.items : [])
        setVideonStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setVideonItems([])
        setVideonStatus('error')
        setVideonError('videon_unreachable')
      })
    return () => {
      cancelled = true
    }
  }, [open, activeCategory, collectionId])

  const allAssets = useMemo(() => [...customAssets, ...STOCK_ASSETS], [customAssets])

  const videonAssets = useMemo((): LibraryAsset[] => {
    const q = searchQuery.trim().toLowerCase()
    return videonItems
      .filter((item) => {
        if (!q) return true
        return (
          item.originalFilename.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.lifecycleState.toLowerCase().includes(q)
        )
      })
      .map((item) => ({
        id: `videon-${item.id}`,
        title: item.originalFilename,
        category: 'abstract' as const,
        url: videonMediaFrameUrl(item.id, collectionId, {
          tMs: DEFAULT_VIDEON_FRAME_T_MS,
          w: APPLY_FRAME_W,
        }),
        thumbUrl: item.frameUrl,
        author: `${formatDuration(item.durationMs)} · ${item.lifecycleState}`,
        tags: ['videon', 'collection', item.lifecycleState],
        source: 'videon' as const,
        videonMediaId: item.id,
      }))
  }, [videonItems, searchQuery, collectionId])

  const displayedAssets = useMemo((): LibraryAsset[] => {
    if (activeCategory === VIDEON_CATEGORY_ID) return videonAssets
    if (activeCategory === 'uploads') {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return customAssets
      return customAssets.filter(
        (a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q)),
      )
    }
    return filterStockAssets(allAssets, activeCategory, searchQuery)
  }, [allAssets, customAssets, activeCategory, searchQuery, videonAssets])

  const categoryChips = useMemo(
    () => [
      ...STOCK_ASSET_CATEGORIES,
      { id: VIDEON_CATEGORY_ID, label: 'Collection media (VIDEON)' },
    ],
    [],
  )

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        const newAsset: StockAsset = {
          id: `custom-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: 'abstract',
          url: dataUrl,
          thumbUrl: dataUrl,
          author: 'Local Upload',
          tags: ['upload', 'custom', 'local'],
        }
        const updated = [newAsset, ...customAssets]
        setCustomAssets(updated)
        saveCustomAssets(updated)
        setSelectedAsset(newAsset)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUrlAdd = () => {
    if (!urlDraft.trim()) return
    const url = urlDraft.trim()
    const newAsset: StockAsset = {
      id: `url-${Date.now()}`,
      title: 'Imported URL Image',
      category: 'abstract',
      url,
      thumbUrl: url,
      author: 'Direct URL',
      tags: ['url', 'remote'],
    }
    const updated = [newAsset, ...customAssets]
    setCustomAssets(updated)
    saveCustomAssets(updated)
    setSelectedAsset(newAsset)
    setUrlDraft('')
  }

  const applyAsset = (asset: LibraryAsset, mode: 'background' | 'image') => {
    const meta: ApplyAssetMeta | undefined =
      asset.source === 'videon' && asset.videonMediaId && collectionId
        ? {
            videonMediaRef: buildVideonMediaRefJson({
              mediaAssetId: asset.videonMediaId,
              platformProjectId: collectionId,
              tMs: DEFAULT_VIDEON_FRAME_T_MS,
            }),
          }
        : undefined
    onApplyAsset(asset.url, mode, meta)
    onClose()
  }

  const handleApply = (mode: 'background' | 'image') => {
    if (!selectedAsset) return
    applyAsset(selectedAsset, mode)
  }

  const videonEmptyHint = !collectionId
    ? 'Bind this composition to a Collection to browse VIDEON media.'
    : videonStatus === 'loading'
      ? 'Loading Collection media…'
      : videonStatus === 'error'
        ? `Could not load VIDEON media (${videonError ?? 'error'}).`
        : 'No media in this Collection yet. Upload in VIDEON first.'

  // Always mount — gating with `if (!open) return null` remounts under React Strict Mode
  // and used to race Dialog cleanup close() → onClose → open=false (Image… appeared dead).
  // Quiet close is fixed in `@zaoly/ui` Dialog; keep always-mounted like HTML preview.
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Asset Library & Stock Photography"
      className="creation-editor-asset-library-dialog"
      data-testid="editor-asset-library-dialog"
      actions={
        <Stack direction="row" gap="sm" align="center" className="creation-editor-asset-library-dialog__actions">
          {selectedAsset ? (
            <Text role="meta" className="creation-editor-asset-library-dialog__selected-label">
              Selected: <strong>{selectedAsset.title}</strong>
            </Text>
          ) : null}

          {targetMode === 'background' || targetMode === 'any' ? (
            <Button
              type="button"
              size="sm"
              variant={targetMode === 'background' ? 'primary' : 'ghost'}
              disabled={!selectedAsset}
              onClick={() => handleApply('background')}
              data-testid="asset-apply-background-btn"
              icon={<Layers size={13} aria-hidden />}
            >
              {targetNodeName ? `Apply as Background (${targetNodeName})` : 'Apply as Container Background'}
            </Button>
          ) : null}

          {targetMode === 'image' || targetMode === 'any' ? (
            <Button
              type="button"
              size="sm"
              variant={targetMode === 'image' ? 'primary' : 'ghost'}
              disabled={!selectedAsset}
              onClick={() => handleApply('image')}
              data-testid="asset-apply-image-btn"
              icon={<ImageIcon size={13} aria-hidden />}
            >
              {targetNodeName ? `Apply as Image (${targetNodeName})` : 'Apply as Image Element'}
            </Button>
          ) : null}

          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Stack>
      }
    >
      <Stack gap="md" className="creation-editor-asset-library-dialog__layout">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="creation-editor-asset-library-dialog__file-input"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileUpload(f)
          }}
        />

        <Stack
          direction="row"
          gap="sm"
          align="center"
          className="creation-editor-asset-library-dialog__toolbar"
        >
          <Input
            block
            size="sm"
            type="search"
            className="search-input"
            placeholder="Search photography by title, mood, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="asset-search-input"
            aria-label="Search assets"
          />
          {searchQuery ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              shape="rounded"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              icon={<X size={13} aria-hidden />}
            />
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="subtle"
            onClick={() => fileInputRef.current?.click()}
            data-testid="asset-upload-btn"
            icon={<Upload size={13} aria-hidden />}
          >
            Upload Image...
          </Button>
        </Stack>

        <FilterRow
          variant="toolbar"
          className="creation-editor-asset-library-dialog__categories"
          data-testid="asset-category-pills"
          aria-label="Asset categories"
        >
          {categoryChips.map((cat) => {
            const isActive = activeCategory === cat.id
            const label =
              cat.id === 'uploads' && customAssets.length > 0
                ? `${cat.label} (${customAssets.length})`
                : cat.id === VIDEON_CATEGORY_ID && videonItems.length > 0
                  ? `${cat.label} (${videonItems.length})`
                  : cat.label
            return (
              <Chip
                key={cat.id}
                size="sm"
                selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                data-testid={`asset-cat-${cat.id}`}
              >
                {label}
              </Chip>
            )
          })}
        </FilterRow>

        {activeCategory !== VIDEON_CATEGORY_ID ? (
          <Stack
            direction="row"
            gap="sm"
            align="center"
            className="creation-editor-asset-library-dialog__url-bar"
          >
            <Text role="meta">Or direct URL:</Text>
            <Input
              block
              size="sm"
              type="url"
              placeholder="Paste https:// image URL..."
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUrlAdd()
              }}
              aria-label="Image URL"
              className="creation-editor-asset-library-dialog__url-input"
            />
            <Button
              type="button"
              size="sm"
              variant="subtle"
              disabled={!urlDraft.trim()}
              onClick={handleUrlAdd}
            >
              Add to Library
            </Button>
          </Stack>
        ) : null}

        <ScrollArea
          orientation="vertical"
          className="creation-editor-asset-library-dialog__gallery"
          data-drag-over={isDragOver ? 'true' : 'false'}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) handleFileUpload(f)
          }}
          data-testid="asset-grid-container"
        >
          {activeCategory === VIDEON_CATEGORY_ID &&
          (videonStatus === 'loading' || displayedAssets.length === 0) ? (
            <Stack
              gap="sm"
              align="center"
              className="creation-editor-asset-library-dialog__empty"
              data-testid="asset-videon-empty"
            >
              <Sparkles size={24} aria-hidden />
              <EmptyState>{videonEmptyHint}</EmptyState>
            </Stack>
          ) : displayedAssets.length === 0 ? (
            <Stack gap="sm" align="center" className="creation-editor-asset-library-dialog__empty">
              <Sparkles size={24} aria-hidden />
              <EmptyState>No images found matching your search</EmptyState>
              <Text role="hint">
                Try another keyword, clear category filter, or drag and drop your own photo here.
              </Text>
            </Stack>
          ) : (
            <div className="creation-editor-asset-library-dialog__grid">
              {displayedAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id
                return (
                  <Card
                    key={asset.id}
                    className={
                      isSelected
                        ? 'creation-editor-asset-library-dialog__card creation-editor-asset-library-dialog__card--selected'
                        : 'creation-editor-asset-library-dialog__card'
                    }
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={asset.title}
                    onClick={() => setSelectedAsset(asset)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedAsset(asset)
                      }
                    }}
                    onDoubleClick={() => {
                      setSelectedAsset(asset)
                      applyAsset(asset, targetMode === 'image' ? 'image' : 'background')
                    }}
                    data-testid={`asset-card-${asset.id}`}
                    media={
                      <span className="creation-editor-asset-library-dialog__media-plane">
                        <Image src={asset.thumbUrl} alt="" loading="lazy" />
                        {isSelected ? (
                          <span className="creation-editor-asset-library-dialog__check" aria-hidden>
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                    }
                    title={asset.title}
                    meta={<Text role="meta">{asset.author}</Text>}
                  />
                )
              })}
            </div>
          )}
        </ScrollArea>
      </Stack>
    </Dialog>
  )
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import {
  CompositionPreview,
  type SiteKitCompositionNode,
} from '../components/CompositionPreview'
import {
  defaultAxisPicks,
  findVariantByAxisPicks,
  type KitMasterAxis,
} from '../master-variants'
import {
  hasSiteKitViewCredentials,
  readSiteKitPlatformProjectIdFromLocation,
  siteKitCompositionsListUrl,
  siteKitViewAuthHeaders,
  withSiteKitViewTokenQuery,
} from '../storybook/view-credentials'

/**
 * Hot catalog: polls CREATION for Collection-scoped compositions (SK-S3).
 * Spec: site-kit-collection-scope.md · site-kit-compositions.md
 */
const ZAOLY_ORIGIN = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.STORYBOOK_ZAOLY_ORIGIN) ||
  (typeof process !== 'undefined' ? process.env.STORYBOOK_ZAOLY_ORIGIN : '') ||
  ''
).replace(/\/$/, '')

type CatalogEntry = {
  name: string
  exportName: string
  storyTitle: string
  componentId: string
  platformProjectId?: string | null
  updatedAt: string | null
}

type NamedVariant = {
  id: string
  name: string
  composition: SiteKitCompositionNode
  combination?: Record<string, string>
}

type OverrideBody = {
  composition?: SiteKitCompositionNode
  variants?: NamedVariant[]
  defaultVariantId?: string
  axes?: KitMasterAxis[]
}

async function fetchCatalog(): Promise<CatalogEntry[] | { error: 'unauthorized' | 'network' }> {
  if (!ZAOLY_ORIGIN) return []
  if (!hasSiteKitViewCredentials()) return { error: 'unauthorized' }
  try {
    const res = await fetch(siteKitCompositionsListUrl(ZAOLY_ORIGIN), {
      cache: 'no-store',
      headers: siteKitViewAuthHeaders(),
    })
    if (res.status === 401 || res.status === 403) return { error: 'unauthorized' }
    if (!res.ok) return { error: 'network' }
    const body = (await res.json()) as { compositions?: CatalogEntry[] }
    return body.compositions ?? []
  } catch {
    return { error: 'network' }
  }
}

async function fetchOverride(componentId: string): Promise<OverrideBody | null> {
  if (!ZAOLY_ORIGIN || !hasSiteKitViewCredentials()) return null
  const res = await fetch(
    withSiteKitViewTokenQuery(
      `${ZAOLY_ORIGIN}/api/site-kit/overrides/${encodeURIComponent(componentId)}?t=${Date.now()}`,
    ),
    { cache: 'no-store', headers: siteKitViewAuthHeaders() },
  )
  if (!res.ok) return null
  return (await res.json()) as OverrideBody
}

function CatalogPanel() {
  const [items, setItems] = useState<CatalogEntry[]>([])
  const [selected, setSelected] = useState<string>('')
  const [override, setOverride] = useState<OverrideBody | null>(null)
  const [axisPicks, setAxisPicks] = useState<Record<string, string>>({})
  const [variantId, setVariantId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [needsCredentials, setNeedsCredentials] = useState(false)
  const scopedCollection = readSiteKitPlatformProjectIdFromLocation()

  useEffect(() => {
    let cancelled = false
    const pull = () => {
      if (!hasSiteKitViewCredentials()) {
        if (!cancelled) {
          setNeedsCredentials(true)
          setItems([])
          setError(null)
        }
        return
      }
      void fetchCatalog().then((next) => {
        if (cancelled) return
        if (!Array.isArray(next)) {
          setNeedsCredentials(next.error === 'unauthorized')
          setItems([])
          setError(
            next.error === 'unauthorized'
              ? null
              : 'Could not reach CREATION compositions API',
          )
          return
        }
        setNeedsCredentials(false)
        setItems(next)
        setError(null)
        setSelected((prev) => {
          if (prev && next.some((e) => e.componentId === prev)) return prev
          return next[0]?.componentId ?? ''
        })
      })
    }
    pull()
    const id = window.setInterval(pull, 4000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!selected || needsCredentials) {
      setOverride(null)
      setVariantId('')
      return
    }
    let cancelled = false
    const pull = () => {
      void fetchOverride(selected).then((body) => {
        if (cancelled) return
        setOverride(body)
        const variants = body?.variants?.filter((v) => v.composition?.type) ?? []
        setVariantId((prev) => {
          if (variants.length < 2) return ''
          if (prev && variants.some((v) => v.id === prev)) return prev
          return body?.defaultVariantId && variants.some((v) => v.id === body.defaultVariantId)
            ? body.defaultVariantId
            : variants[0]!.id
        })
        if (body?.axes?.length) {
          const def =
            variants.find((v) => v.id === body.defaultVariantId) ?? variants[0] ?? null
          setAxisPicks(defaultAxisPicks(body.axes, def))
        } else {
          setAxisPicks({})
        }
      })
    }
    pull()
    const id = window.setInterval(pull, 4000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [selected, needsCredentials])

  const variants = override?.variants?.filter((v) => v.composition?.type) ?? []
  const axes = override?.axes?.length ? override.axes : undefined
  const treeByAxes =
    axes && variants.length >= 2
      ? findVariantByAxisPicks(variants, axes, axisPicks)?.composition
      : null
  const tree =
    treeByAxes ??
    (variants.length >= 2
      ? (variants.find((v) => v.id === variantId)?.composition ??
        variants.find((v) => v.id === override?.defaultVariantId)?.composition ??
        variants[0]?.composition ??
        null)
      : override?.composition?.type
        ? override.composition
        : null)

  if (!ZAOLY_ORIGIN) {
    return (
      <p style={{ fontFamily: 'system-ui', color: '#555' }}>
        Set <code>STORYBOOK_ZAOLY_ORIGIN</code> at Storybook build time to enable live
        catalog polling.
      </p>
    )
  }

  if (needsCredentials) {
    return (
      <div
        style={{ fontFamily: 'system-ui', display: 'grid', gap: 12, maxWidth: '36rem' }}
        data-testid="catalog-credentials-gate"
      >
        <strong>Collection scope required</strong>
        <p style={{ color: '#555', margin: 0 }}>
          Pattern Catalog is Collection-gated (SK-S3). Open Storybook from the CREATION editor
          or Library so the link includes a <code>zaolyViewToken</code> for your Collection.
          Anonymous browsing of other companies’ Patterns is not allowed.
        </p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'system-ui', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <strong>Live compositions</strong>
        <span style={{ color: '#888', fontSize: 13 }}>polls every 4s · no rebuild</span>
        {scopedCollection ? (
          <span style={{ fontSize: 12, color: '#555' }} data-testid="catalog-collection-chip">
            Collection · {scopedCollection.slice(0, 8)}…
          </span>
        ) : null}
        {error ? <span style={{ color: '#b00020' }}>{error}</span> : null}
      </div>
      {items.length === 0 ? (
        <p style={{ color: '#555' }}>
          No saves yet for this Collection. In CREATION: <strong>Save as Site Kit component</strong>{' '}
          — they appear here automatically.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 6, maxWidth: 28 + 'rem' }}>
            <span style={{ fontSize: 13, color: '#555' }}>Composition</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ padding: '8px 10px', fontSize: 14 }}
              data-testid="catalog-composition-select"
            >
              {items.map((item) => (
                <option key={item.componentId} value={item.componentId}>
                  {item.exportName}
                  {item.updatedAt ? ` · ${item.updatedAt.slice(0, 19)}` : ''}
                </option>
              ))}
            </select>
          </label>
          {axes
            ? axes.map((axis) => (
                <label
                  key={axis.id}
                  style={{ display: 'grid', gap: 6, maxWidth: 16 + 'rem' }}
                >
                  <span style={{ fontSize: 13, color: '#555' }}>{axis.name}</span>
                  <select
                    value={axisPicks[axis.id] ?? axis.values[0] ?? ''}
                    onChange={(e) =>
                      setAxisPicks((prev) => ({ ...prev, [axis.id]: e.target.value }))
                    }
                    style={{ padding: '8px 10px', fontSize: 14 }}
                    data-testid={`catalog-axis-select-${axis.id}`}
                  >
                    {axis.values.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              ))
            : null}
          {!axes && variants.length >= 2 ? (
            <label style={{ display: 'grid', gap: 6, maxWidth: 16 + 'rem' }}>
              <span style={{ fontSize: 13, color: '#555' }}>Variant</span>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                style={{ padding: '8px 10px', fontSize: 14 }}
                data-testid="catalog-variant-select"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      )}
      {tree ? (
        <CompositionPreview node={tree} />
      ) : selected ? (
        <p style={{ color: '#888' }}>Loading {selected}…</p>
      ) : null}
    </div>
  )
}

const meta = {
  title: 'Compositions/Catalog',
  tags: ['site-kit', 'composition', 'live', 'hot'],
  parameters: {
    docs: {
      description: {
        component:
          'Collection-scoped hot catalog (SK-S3). Open from CREATION with zaolyViewToken — no cross-tenant Pattern browse.',
      },
    },
  },
  render: () => <CatalogPanel />,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

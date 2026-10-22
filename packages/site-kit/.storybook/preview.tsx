import type { ArgTypesEnhancer, Decorator, Preview } from '@storybook/react-vite'
import { useEffect, useReducer } from 'react'
import { useArgs } from 'storybook/preview-api'
import {
  CompositionPreview,
  type SiteKitCompositionNode,
} from '../src/components/CompositionPreview'
import {
  resolveMasterOverrideVariant,
  type KitMasterAxis,
  type KitNamedVariantCell,
} from '../src/master-variants'
import {
  fetchOverrideJson,
  initialOverrideFetchState,
  OVERRIDE_POLL_INTERVAL_MS,
  reduceOverrideFetch,
  type OverrideFetchState,
} from '../src/storybook/live-override-polling'
import {
  siteKitViewAuthHeaders,
  withSiteKitViewTokenQuery,
} from '../src/storybook/view-credentials'
import '../src/styles.css'

/**
 * Live CREATION overrides (Coolify static Storybook).
 * Named variants = CSF substories (+ Controls `variant` or Component Set axis selects).
 * Spec: site-kit.md · knowledge/master-component-sets-phase3.md
 */
const ZAOLY_ORIGIN = (
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.STORYBOOK_ZAOLY_ORIGIN) ||
  (typeof process !== 'undefined' ? process.env.STORYBOOK_ZAOLY_ORIGIN : '') ||
  ''
).replace(/\/$/, '')

function componentIdFromStoryTitle(title: string | undefined): string | null {
  if (!title) return null
  if (title.startsWith('Compositions/')) {
    const parts = title.slice('Compositions/'.length).split('/').filter(Boolean)
    // SK-S2: Compositions/{scope}/{Name} — live paint uses args.componentId; do not guess namespaced id.
    if (parts.length >= 2) return null
    const name = parts[0]
    return name ? `Composition${name}` : null
  }
  if (title.startsWith('Site/')) {
    const name = title.slice('Site/'.length).split('/')[0]
    return name ? `Site${name}` : null
  }
  return null
}

type NamedVariant = KitNamedVariantCell & {
  composition: SiteKitCompositionNode
}

type OverrideBody = {
  args?: Record<string, unknown>
  composition?: SiteKitCompositionNode
  variants?: NamedVariant[]
  defaultVariantId?: string
  axes?: KitMasterAxis[]
}

function listVariants(override: OverrideBody): NamedVariant[] {
  return (
    override.variants?.filter(
      (v): v is NamedVariant => Boolean(v.composition?.type),
    ) ?? []
  )
}

const masterVariantArgTypesEnhancer: ArgTypesEnhancer = (context) => {
  const axisKeys = Object.keys(context.argTypes ?? {}).filter(
    (k) =>
      k !== 'variant' &&
      k !== 'masterVariant' &&
      k !== 'variantName' &&
      k !== 'componentId' &&
      context.argTypes?.[k]?.control &&
      Array.isArray((context.argTypes?.[k] as { options?: unknown }).options),
  )
  if (axisKeys.length) {
    return {
      ...context.argTypes,
      variant: { control: false, table: { disable: true } },
      masterVariant: { control: false, table: { disable: true } },
      variantName: { control: false, table: { disable: true } },
      componentId: { control: false, table: { disable: true } },
    }
  }
  const options = context.argTypes?.variant?.options
  if (Array.isArray(options) && options.length >= 2) {
    return {
      ...context.argTypes,
      variant: {
        name: 'variant',
        description: 'Master named variant',
        control: { type: 'select' },
        options,
      },
      masterVariant: { control: false, table: { disable: true } },
      variantName: { control: false, table: { disable: true } },
      componentId: { control: false, table: { disable: true } },
    }
  }
  return {
    ...context.argTypes,
    variant: { control: false, table: { disable: true } },
    masterVariant: { control: false, table: { disable: true } },
  }
}

function overrideFetchReducer(
  state: OverrideFetchState<OverrideBody>,
  event: Parameters<typeof reduceOverrideFetch<OverrideBody>>[1],
): OverrideFetchState<OverrideBody> {
  return reduceOverrideFetch(state, event)
}

const withLiveOverrides: Decorator = (Story, context) => {
  const [args] = useArgs()
  const argId =
    typeof args.componentId === 'string' ? args.componentId.trim() : ''
  const fromTitle =
    context.title === 'Compositions/Live' || context.title === 'Compositions/Catalog'
      ? null
      : componentIdFromStoryTitle(context.title)
  const componentId = argId || fromTitle
  const [fetchState, dispatch] = useReducer(
    overrideFetchReducer,
    initialOverrideFetchState<OverrideBody>(),
  )

  useEffect(() => {
    if (!componentId || !ZAOLY_ORIGIN) {
      dispatch({ type: 'reset' })
      return
    }
    dispatch({ type: 'reset' })
    let cancelled = false
    const controller = new AbortController()

    const pull = () => {
      const url = withSiteKitViewTokenQuery(
        `${ZAOLY_ORIGIN}/api/site-kit/overrides/${encodeURIComponent(componentId)}?t=${Date.now()}`,
      )
      void fetchOverrideJson<OverrideBody>(url, controller.signal, {
        headers: siteKitViewAuthHeaders(),
      })
        .then((next) => {
          if (cancelled) return
          if (!next) {
            dispatch({ type: 'not-found' })
            return
          }
          dispatch({ type: 'success', override: next })
        })
        .catch(() => {
          if (cancelled) return
          dispatch({ type: 'error' })
        })
    }

    pull()
    const id = window.setInterval(pull, OVERRIDE_POLL_INTERVAL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') pull()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [componentId])

  const override = fetchState.override
  const variants = override ? listVariants(override) : []
  const active =
    variants.length >= 2 && override
      ? resolveMasterOverrideVariant({
          variants,
          axes: override.axes,
          defaultVariantId: override.defaultVariantId,
          args,
          storyName: context.name,
        })
      : null
  const tree =
    active?.composition ??
    (override?.composition?.type ? override.composition : null)

  const staleBanner =
    fetchState.status === 'stale' ? (
      <p
        data-testid="site-kit-override-stale"
        style={{ fontSize: 12, color: '#a16207', marginBottom: 8 }}
      >
        Live override temporarily unavailable — showing last loaded version.
      </p>
    ) : null

  if (tree) {
    return (
      <>
        {staleBanner}
        <CompositionPreview node={tree} />
      </>
    )
  }

  if (fetchState.status === 'loading') {
    return <p data-testid="site-kit-override-loading">Loading live override…</p>
  }

  if (fetchState.status === 'error') {
    return <p data-testid="site-kit-override-error">Live override unavailable.</p>
  }

  if (override?.args && Object.keys(override.args).length > 0) {
    const {
      masterVariant: _m,
      variantName: _v,
      componentId: _c,
      variant: _seedVariant,
      ...merged
    } = { ...args, ...override.args }
    if (
      typeof args.variant === 'string' &&
      resolveMasterOverrideVariant({
        variants,
        args: { variant: args.variant },
      })
    ) {
      merged.variant = args.variant
    }
    return (
      <>
        {staleBanner}
        <Story args={merged} />
      </>
    )
  }

  return <Story />
}

const preview: Preview = {
  decorators: [withLiveOverrides],
  argTypesEnhancers: [masterVariantArgTypesEnhancer],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i } },
  },
}

export default preview

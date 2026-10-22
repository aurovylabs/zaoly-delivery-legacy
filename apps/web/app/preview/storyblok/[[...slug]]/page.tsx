import { Suspense } from 'react'
import { StoryblokPreviewClient } from '../../../../components/storyblok/storyblok-preview-client'
import { mergeLivePackIntoCatalog } from '../../../../lib/inspect/token-catalog'
import { loadMergedLocalPack } from '../../../../lib/tokens/token-pack-store'
import { paths } from '../../../../lib/paths'
import { buildZaolyPackRootCss } from '../../../../lib/site-kit/zaoly-pack-ds-css'
import { type StoryblokBlokLike } from '../../../../lib/storyblok/blok-to-composition'
import { fetchStoryblokDraftStory } from '../../../../lib/storyblok/fetch-cdn-story'

type PageProps = {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

async function StoryblokPreviewBody({ params, searchParams }: PageProps) {
  const { slug: slugParts } = await params
  const sp = await searchParams
  const slugFromQuery = firstParam(sp.slug)?.trim()
  const slug =
    slugFromQuery ||
    (slugParts && slugParts.length ? slugParts.join('/') : '') ||
    'home'

  const fetched = await fetchStoryblokDraftStory(slug)
  if (!fetched.ok) {
    return (
      <main data-testid="storyblok-preview-error" style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h1>Storyblok preview</h1>
        <p>
          Could not load <code>{slug}</code> ({fetched.error}, HTTP {fetched.status}).
        </p>
        <p style={{ color: '#666', fontSize: 14 }}>
          Set Coolify <code>{paths.envStoryblokPreviewToken}</code> and ensure the story exists as
          draft. Visual Editor Location should be{' '}
          <code>
            {paths.ecosystemStagingZaoly}
            {paths.routes.storyblokPreview}/
          </code>
        </p>
      </main>
    )
  }

  const content = fetched.story.content as StoryblokBlokLike

  let tokenPackCss = ''
  const merged = await loadMergedLocalPack()
  if (merged.tokens.length) {
    const catalog = mergeLivePackIntoCatalog(merged.tokens)
    tokenPackCss = buildZaolyPackRootCss(catalog)
  }

  return (
    <StoryblokPreviewClient
      initialStoryId={fetched.story.id}
      initialContent={content}
      tokenPackCss={tokenPackCss}
      storyName={fetched.story.name}
    />
  )
}

export default function StoryblokPreviewPage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <StoryblokPreviewBody {...props} />
    </Suspense>
  )
}

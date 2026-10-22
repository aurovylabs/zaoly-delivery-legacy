/**
 * Storyblok CDN story fetch (preview / draft). Server only.
 * Spec: specs/domain/storyblok-preview.md
 */
import { paths } from '../paths'

export type StoryblokCdnStory = {
  id: number
  name: string
  slug: string
  full_slug?: string
  content: Record<string, unknown>
}

export function resolveStoryblokPreviewToken(): string | null {
  return process.env[paths.envStoryblokPreviewToken]?.trim() || null
}

export async function fetchStoryblokDraftStory(
  slug: string,
  options?: { token?: string },
): Promise<{ ok: true; story: StoryblokCdnStory } | { ok: false; status: number; error: string }> {
  const token = options?.token ?? resolveStoryblokPreviewToken()
  if (!token) {
    return { ok: false, status: 503, error: 'storyblok_preview_token_missing' }
  }
  const clean = slug.replace(/^\/+|\/+$/g, '') || 'home'
  const base = paths.storyblokCdnApiBase.replace(/\/$/, '')
  const url = `${base}/stories/${encodeURIComponent(clean)}?token=${encodeURIComponent(token)}&version=draft`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      return { ok: false, status: res.status, error: `cdn_http_${res.status}` }
    }
    const json = (await res.json()) as { story?: StoryblokCdnStory }
    if (!json.story?.content) {
      return { ok: false, status: 404, error: 'story_missing' }
    }
    return { ok: true, story: json.story }
  } catch {
    return { ok: false, status: 502, error: 'cdn_unreachable' }
  }
}

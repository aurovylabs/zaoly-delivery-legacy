import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExploreChapterPage } from '../../../components/explore-chapter-page'
import { EXPLORE_CHAPTERS, isExploreChapter } from '../../../lib/landing/explore'
import { getPublicSiteLocale } from '../../../lib/public-site-locale-server'
import '../../landing.css'

type Props = { params: Promise<{ chapter: string }> }

export function generateStaticParams() {
  return EXPLORE_CHAPTERS.map((chapter) => ({ chapter: chapter.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapter } = await params
  if (!isExploreChapter(chapter)) return { title: 'Explore — Zaoly' }
  const meta = EXPLORE_CHAPTERS.find((entry) => entry.id === chapter)!
  const locale = await getPublicSiteLocale()
  const title = locale === 'de' ? meta.titleDe : meta.titleEn
  const description = locale === 'de' ? meta.bodyDe : meta.bodyEn
  return { title: `${title} — Explore — Zaoly`, description }
}

export default async function Page({ params }: Props) {
  const { chapter } = await params
  if (!isExploreChapter(chapter)) notFound()
  return <ExploreChapterPage chapterId={chapter} />
}

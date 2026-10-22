import type { Metadata } from 'next'
import { ExplorePage } from '../../components/explore-page'
import { getPublicSiteLocale } from '../../lib/public-site-locale-server'
import '../landing.css'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicSiteLocale()
  return locale === 'de'
    ? {
        title: 'Explore — Zaoly',
        description: 'Interaktive Produktmomente: Editor, Kit, Token Studio, Screens und Weg — öffentlich zum Ausprobieren.',
      }
    : {
        title: 'Explore — Zaoly',
        description: 'Interactive product moments: editor, Kit, Token Studio, screens, and path — public and hands-on.',
      }
}

export default function Page() {
  return <ExplorePage />
}

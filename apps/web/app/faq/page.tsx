import type { Metadata } from 'next'
import { FaqPage } from '../../components/faq-page'
import { getPublicSiteLocale } from '../../lib/public-site-locale-server'
import '../landing.css'
import './faq.css'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicSiteLocale()
  return locale === 'de'
    ? {
        title: 'FAQ — Zaoly',
        description:
          'Ausführliche Antworten zum Zaoly Editor, Kit, Token Studio, Projektmodell, Zusammenarbeit, React-Handoff und Zugang.',
      }
    : {
        title: 'FAQ — Zaoly',
        description:
          'Detailed answers about the Zaoly editor, Kit, Token Studio, projects, collaboration, React handoff, and access.',
      }
}

export default function Page() {
  return <FaqPage />
}

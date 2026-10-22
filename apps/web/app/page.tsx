import type { Metadata } from 'next'
import { LandingPage } from '../components/landing-page'
import { getPublicSiteLocale } from '../lib/public-site-locale-server'
import { publicSiteContactEmail } from '../lib/runtime-config'
import './landing.css'

/** Public product introduction. The authenticated workspace stays at /editor. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicSiteLocale()
  return locale === 'de'
    ? {
        title: 'Zaoly — Vom Design zur echten Komponente',
        description:
          'Gestalte visuell mit dem Zaoly Kit und mache aus Entwürfen wiederverwendbare React-Komponenten mit Varianten, Markentokens und klarem Entwickler-Handoff.',
      }
    : {
        title: 'Zaoly — From design to reusable components',
        description:
          'Design visually with Zaoly Kit and turn your work into reusable React components with variants, brand tokens, and a clear developer handoff.',
      }
}

export default function HomePage() {
  return <LandingPage contactEmail={publicSiteContactEmail()} />
}

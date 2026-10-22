// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { FaqPage } from '../components/faq-page'
import { UserPrefsProvider } from '../lib/user-prefs'
import { paths } from '../lib/paths'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

describe('Zaoly public FAQ', () => {
  const renderFaq = (locale: 'de' | 'en' = 'de') => render(<UserPrefsProvider initialLocale={locale}><FaqPage /></UserPrefsProvider>)

  it('explains the researched product model in six accessible topic groups', () => {
    renderFaq()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Gute Fragen.Klare Antworten.')
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(7)
    const topicLinks = within(screen.getByRole('navigation', { name: 'FAQ Themen' })).getAllByRole('link')
    expect(topicLinks).toHaveLength(6)
    for (const [index, section] of Object.values(paths.faq.sections).entries()) {
      expect(document.getElementById(section)).toBeInTheDocument()
      expect(topicLinks[index]).toHaveAttribute('href', `#${section}`)
    }
    expect(document.querySelectorAll('.zl-faq__questions details')).toHaveLength(26)
    expect(document.querySelectorAll('.zl-faq__questions details[open]')).toHaveLength(6)
    expect(document.querySelectorAll('.zl-faq__answer p p')).toHaveLength(0)
    expect(screen.getByText(/Master.*Instanzen in dieser Komposition/i)).toBeInTheDocument()
    expect(screen.getByText(/nicht automatisch eine fertige Mobile-Gestaltung/i)).toBeInTheDocument()
    expect(screen.getByText(/erst nach Bestätigung werden gültige lokale Werte angewendet/i)).toBeInTheDocument()
    expect(screen.getByText(/bereits exportiertes React-Modul und eine externe Anwendung ändern sich dadurch nicht/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Owner.*Editor.*Viewer/i)).toHaveLength(2)
    expect(screen.getByText(/„Copy pack“ bündelt zusätzlich Kontext/i)).toBeInTheDocument()
    expect(screen.getByText(/ersetzt weder einen vollständigen Accessibility-Test noch Code Review/i)).toBeInTheDocument()
    expect(screen.getByText(/Konto selbst anlegen/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrierungsseite' })).toHaveAttribute(
      'href',
      paths.routes.register,
    )
  })

  it('uses canonical links back to the product and application', () => {
    renderFaq()

    expect(screen.getAllByRole('link', { name: 'Zaoly Startseite' })[0]).toHaveAttribute('href', paths.routes.home)
    expect(screen.getAllByRole('link', { name: /Editor öffnen/i })[0]).toHaveAttribute('href', paths.routes.editor)
    expect(screen.getAllByRole('link', { name: 'Kit Playground' }).some((link) => link.getAttribute('href') === paths.routes.kit)).toBe(true)
    expect(screen.getAllByRole('link', { name: 'Token Studio' }).some((link) => link.getAttribute('href') === paths.routes.tokens)).toBe(true)
    expect(screen.getAllByRole('link', { name: 'Anmelden' }).some((link) => link.getAttribute('href') === paths.routes.login)).toBe(true)
    expect(screen.getAllByRole('link', { name: 'FAQ', current: 'page' })[0]).toHaveAttribute('href', paths.routes.faq)
  })

  it('renders the FAQ topics and detailed answers in English', () => {
    renderFaq('en')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good questions.Clear answers.')
    expect(screen.getByRole('navigation', { name: 'FAQ navigation' })).toBeInTheDocument()
    expect(screen.getAllByText('Product model').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('.zl-faq__questions details')).toHaveLength(26)
    expect(screen.getByText(/Zaoly is a standalone visual editor for digital products/i)).toBeInTheDocument()
    expect(screen.getByText(/already exported React code and external applications do not update by themselves/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'EN' })[0]).toHaveAttribute('aria-pressed', 'true')
  })
})

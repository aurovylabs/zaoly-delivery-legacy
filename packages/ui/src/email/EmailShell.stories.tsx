import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  emailButton,
  emailCodePanel,
  emailMetaTable,
  emailParagraph,
  renderZaolyEmailDocument,
} from './index'

function EmailPreview({ html }: { html: string }) {
  return (
    <iframe
      title="Zaoly email preview"
      srcDoc={html}
      style={{ width: '100%', minHeight: 780, border: '1px solid #d4d2d2', borderRadius: 8 }}
    />
  )
}

const meta = {
  title: 'Foundations/EmailShell',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

export const PasswordResetCode: Story = {
  render: () => (
    <EmailPreview
      html={renderZaolyEmailDocument({
        productLabel: 'PLEXON',
        eyebrow: 'Sicherheit',
        title: 'Code für dein Konto',
        preheader: 'Dein PLEXON-Code zum Setzen eines neuen Passworts',
        bodyHtml: [
          emailParagraph('Hallo,'),
          emailParagraph(
            'dein PLEXON-Code zum Setzen eines neuen Passworts lautet:'
          ),
          emailCodePanel('demo-token-8f3a2c', 'Einmal-Code · 1 Stunde gültig'),
          emailParagraph(
            'Öffne in PLEXON die Seite „Passwort zurücksetzen“, füge den Code ein und wähle ein neues Passwort. Wenn du das nicht angefordert hast, ignoriere diese Nachricht.'
          ),
        ].join(''),
        footerNote: 'PLEXON · Zaoly',
      })}
    />
  ),
}

export const CollectionInvite: Story = {
  render: () => (
    <EmailPreview
      html={renderZaolyEmailDocument({
        productLabel: 'PLEXON',
        eyebrow: 'Team',
        title: 'Einladung zur Collection',
        preheader: 'Du wurdest zu Demo eingeladen',
        bodyHtml: [
          emailParagraph('Ada hat dich zur Collection „Demo“ eingeladen (Rolle: admin).'),
          emailMetaTable([
            { label: 'Collection', value: 'Demo' },
            { label: 'Rolle', value: 'admin' },
          ]),
          emailButton('Einladung annehmen', 'https://example.com/invite/demo'),
          emailParagraph('Du musst mit einem PLEXON-Konto derselben Organisation angemeldet sein.'),
        ].join(''),
        footerNote: 'PLEXON · Zaoly',
      })}
    />
  ),
}

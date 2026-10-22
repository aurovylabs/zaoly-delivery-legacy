/**
 * Branded system mail templates (en + de).
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import { renderMailHtml, renderMailText } from './mail-layout'
import { resolveMailLocale, type MailLocale } from './mail-locale'

export type { MailLocale }
export { resolveMailLocale }

export type MailPayload = { subject: string; text: string; html: string }

function pack(
  locale: MailLocale,
  subject: string,
  layout: Parameters<typeof renderMailHtml>[0],
): MailPayload {
  return {
    subject,
    text: renderMailText(layout),
    html: renderMailHtml({ ...layout, locale }),
  }
}

export function inviteMailContent(input: {
  inviteUrl: string
  role: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'Einladung zu Zaoly', {
      locale,
      preheader: 'Du wurdest zu Zaoly eingeladen.',
      eyebrow: 'Einladung',
      title: 'Willkommen bei Zaoly',
      paragraphs: [
        'Du wurdest eingeladen, mit Zaoly zu arbeiten — dem editor-first Design- und Handoff-Produkt.',
        'Öffne den Link, setze dein Passwort und starte direkt im Editor.',
      ],
      meta: [{ label: 'Rolle', value: input.role }],
      cta: { label: 'Einladung öffnen', href: input.inviteUrl },
      footnote: 'Der Link ist sieben Tage gültig und kann nur einmal genutzt werden.',
    })
  }
  return pack(locale, "You're invited to Zaoly", {
    locale,
    preheader: 'You have been invited to Zaoly.',
    eyebrow: 'Invitation',
    title: 'Welcome to Zaoly',
    paragraphs: [
      'You have been invited to work in Zaoly — the editor-first design and handoff product.',
      'Open the link, set your password, and jump straight into the editor.',
    ],
    meta: [{ label: 'Role', value: input.role }],
    cta: { label: 'Open invite', href: input.inviteUrl },
    footnote: 'This link expires in seven days and can be used once.',
  })
}

export function welcomeMailContent(input: {
  editorUrl: string
  name?: string | null
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  const hello =
    locale === 'de'
      ? input.name?.trim()
        ? `Hallo ${input.name.trim()},`
        : 'Hallo,'
      : input.name?.trim()
        ? `Hi ${input.name.trim()},`
        : 'Hi,'
  if (locale === 'de') {
    return pack(locale, 'Willkommen bei Zaoly', {
      locale,
      preheader: 'Dein Zaoly-Konto ist bereit.',
      eyebrow: 'Konto',
      title: 'Dein Konto ist bereit',
      paragraphs: [
        hello,
        'Dein Zaoly-Konto ist aktiv. Starte im Editor, baue Compositions und übergib saubere Komponenten an dein Team.',
      ],
      cta: { label: 'Editor öffnen', href: input.editorUrl },
    })
  }
  return pack(locale, 'Welcome to Zaoly', {
    locale,
    preheader: 'Your Zaoly account is ready.',
    eyebrow: 'Account',
    title: 'Your account is ready',
    paragraphs: [
      hello,
      'Your Zaoly account is active. Open the editor, build compositions, and hand off clean components to your team.',
    ],
    cta: { label: 'Open editor', href: input.editorUrl },
  })
}

export function smtpTestMailContent(locale: MailLocale = 'en'): MailPayload {
  const resolved = resolveMailLocale(locale)
  if (resolved === 'de') {
    return pack(resolved, 'Zaoly SMTP-Test', {
      locale: resolved,
      preheader: 'SMTP ist konfiguriert.',
      eyebrow: 'System',
      title: 'SMTP-Test erfolgreich',
      paragraphs: [
        'SMTP ist konfiguriert. Diese Testmail kam von Zaoly.',
        'Einladungen, Willkommen und weitere Systemmails nutzen dieselbe Verbindung.',
      ],
    })
  }
  return pack(resolved, 'Zaoly SMTP test', {
    locale: resolved,
    preheader: 'SMTP is configured.',
    eyebrow: 'System',
    title: 'SMTP test succeeded',
    paragraphs: [
      'SMTP is configured. This test message was sent by Zaoly.',
      'Invites, welcome messages, and other system mail use the same connection.',
    ],
  })
}

export function sceneSharedMailContent(input: {
  sceneName: string
  role: string
  editorUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, `Freigabe: ${input.sceneName}`, {
      locale,
      preheader: `Dir wurde „${input.sceneName}“ freigegeben.`,
      eyebrow: 'Freigabe',
      title: 'Eine Composition wurde geteilt',
      paragraphs: [
        'Jemand hat dich zu einer Composition in Zaoly hinzugefügt.',
      ],
      meta: [
        { label: 'Composition', value: input.sceneName },
        { label: 'Rolle', value: input.role },
      ],
      cta: { label: 'Composition öffnen', href: input.editorUrl },
    })
  }
  return pack(locale, `Shared with you: ${input.sceneName}`, {
    locale,
    preheader: `"${input.sceneName}" was shared with you.`,
    eyebrow: 'Share',
    title: 'A composition was shared with you',
    paragraphs: ['Someone added you to a composition in Zaoly.'],
    meta: [
      { label: 'Composition', value: input.sceneName },
      { label: 'Role', value: input.role },
    ],
    cta: { label: 'Open composition', href: input.editorUrl },
  })
}

export function commentNewMailContent(input: {
  sceneName: string
  authorName: string
  excerpt: string
  openUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  const excerpt = clip(input.excerpt, 280)
  if (locale === 'de') {
    return pack(locale, `Neuer Kommentar: ${input.sceneName}`, {
      locale,
      preheader: `${input.authorName} hat kommentiert.`,
      eyebrow: 'Feedback',
      title: 'Neuer Client-Kommentar',
      paragraphs: [
        `${input.authorName} hat Feedback zu „${input.sceneName}“ hinterlassen.`,
        excerpt,
      ],
      cta: { label: 'Im Editor öffnen', href: input.openUrl },
    })
  }
  return pack(locale, `New comment: ${input.sceneName}`, {
    locale,
    preheader: `${input.authorName} left a comment.`,
    eyebrow: 'Feedback',
    title: 'New client comment',
    paragraphs: [
      `${input.authorName} left feedback on “${input.sceneName}”.`,
      excerpt,
    ],
    cta: { label: 'Open in editor', href: input.openUrl },
  })
}

export function commentReplyMailContent(input: {
  sceneName: string
  replyAuthor: string
  excerpt: string
  shareUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  const excerpt = clip(input.excerpt, 280)
  if (locale === 'de') {
    return pack(locale, `Antwort zu deinem Kommentar`, {
      locale,
      preheader: `${input.replyAuthor} hat geantwortet.`,
      eyebrow: 'Feedback',
      title: 'Antwort auf deinen Kommentar',
      paragraphs: [
        `${input.replyAuthor} hat auf dein Feedback zu „${input.sceneName}“ geantwortet.`,
        excerpt,
      ],
      cta: { label: 'Freigabe öffnen', href: input.shareUrl },
    })
  }
  return pack(locale, 'Reply to your comment', {
    locale,
    preheader: `${input.replyAuthor} replied.`,
    eyebrow: 'Feedback',
    title: 'Reply to your comment',
    paragraphs: [
      `${input.replyAuthor} replied to your feedback on “${input.sceneName}”.`,
      excerpt,
    ],
    cta: { label: 'Open share', href: input.shareUrl },
  })
}

export function accountDisabledMailContent(input: {
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'Dein Zaoly-Konto wurde deaktiviert', {
      locale,
      preheader: 'Zugang vorübergehend gesperrt.',
      eyebrow: 'Konto',
      title: 'Konto deaktiviert',
      paragraphs: [
        'Dein Zaoly-Konto wurde von einem Admin deaktiviert. Du kannst dich derzeit nicht anmelden.',
        'Bei Fragen wende dich an dein Team oder den Zaoly-Admin.',
      ],
    })
  }
  return pack(locale, 'Your Zaoly account was disabled', {
    locale,
    preheader: 'Access temporarily suspended.',
    eyebrow: 'Account',
    title: 'Account disabled',
    paragraphs: [
      'Your Zaoly account was disabled by an admin. You cannot sign in right now.',
      'If this looks wrong, contact your team or Zaoly admin.',
    ],
  })
}

export function accountEnabledMailContent(input: {
  loginUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'Dein Zaoly-Konto ist wieder aktiv', {
      locale,
      preheader: 'Du kannst dich wieder anmelden.',
      eyebrow: 'Konto',
      title: 'Konto wieder aktiviert',
      paragraphs: ['Dein Zaoly-Konto ist wieder freigeschaltet.'],
      cta: { label: 'Anmelden', href: input.loginUrl },
    })
  }
  return pack(locale, 'Your Zaoly account is active again', {
    locale,
    preheader: 'You can sign in again.',
    eyebrow: 'Account',
    title: 'Account re-enabled',
    paragraphs: ['Your Zaoly account has been re-enabled.'],
    cta: { label: 'Sign in', href: input.loginUrl },
  })
}

export function roleChangedMailContent(input: {
  role: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'Deine Zaoly-Rolle wurde geändert', {
      locale,
      preheader: `Neue Rolle: ${input.role}`,
      eyebrow: 'Konto',
      title: 'Rolle aktualisiert',
      paragraphs: ['Ein Admin hat deine App-Rolle in Zaoly geändert.'],
      meta: [{ label: 'Neue Rolle', value: input.role }],
    })
  }
  return pack(locale, 'Your Zaoly role was updated', {
    locale,
    preheader: `New role: ${input.role}`,
    eyebrow: 'Account',
    title: 'Role updated',
    paragraphs: ['An admin changed your app role in Zaoly.'],
    meta: [{ label: 'New role', value: input.role }],
  })
}

export function passwordResetMailContent(input: {
  resetUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'Passwort zurücksetzen — Zaoly', {
      locale,
      preheader: 'Link zum Zurücksetzen deines Passworts.',
      eyebrow: 'Sicherheit',
      title: 'Passwort zurücksetzen',
      paragraphs: [
        'Wir haben eine Anfrage erhalten, dein Zaoly-Passwort zurückzusetzen.',
        'Wenn du das nicht warst, kannst du diese Mail ignorieren.',
      ],
      cta: { label: 'Neues Passwort setzen', href: input.resetUrl },
      footnote: 'Der Link ist eine Stunde gültig und kann nur einmal genutzt werden.',
    })
  }
  return pack(locale, 'Reset your Zaoly password', {
    locale,
    preheader: 'Use this link to reset your password.',
    eyebrow: 'Security',
    title: 'Reset your password',
    paragraphs: [
      'We received a request to reset your Zaoly password.',
      'If you did not ask for this, you can ignore this email.',
    ],
    cta: { label: 'Set a new password', href: input.resetUrl },
    footnote: 'This link expires in one hour and can be used once.',
  })
}

export function emailVerifyMailContent(input: {
  verifyUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'E-Mail bestätigen — Zaoly', {
      locale,
      preheader: 'Bestätige deine E-Mail-Adresse für Zaoly.',
      eyebrow: 'Konto',
      title: 'E-Mail bestätigen',
      paragraphs: [
        'Bitte bestätige deine E-Mail-Adresse, damit wir wissen, dass dieses Konto zu dir gehört.',
        'Dein Konto ist bereits nutzbar — die Bestätigung hilft bei Sicherheit und Support.',
      ],
      cta: { label: 'E-Mail bestätigen', href: input.verifyUrl },
      footnote: 'Der Link ist 48 Stunden gültig und kann nur einmal genutzt werden.',
    })
  }
  return pack(locale, 'Confirm your email — Zaoly', {
    locale,
    preheader: 'Confirm your email address for Zaoly.',
    eyebrow: 'Account',
    title: 'Confirm your email',
    paragraphs: [
      'Please confirm your email address so we know this account belongs to you.',
      'Your account is already usable — confirmation helps with security and support.',
    ],
    cta: { label: 'Confirm email', href: input.verifyUrl },
    footnote: 'This link expires in 48 hours and can be used once.',
  })
}

export function passwordChangedMailContent(input: {
  loginUrl: string
  locale?: MailLocale
}): MailPayload {
  const locale = resolveMailLocale(input.locale)
  if (locale === 'de') {
    return pack(locale, 'Dein Zaoly-Passwort wurde geändert', {
      locale,
      preheader: 'Passwort erfolgreich aktualisiert.',
      eyebrow: 'Sicherheit',
      title: 'Passwort geändert',
      paragraphs: [
        'Dein Zaoly-Passwort wurde soeben aktualisiert.',
        'Wenn du das nicht warst, setze dein Passwort erneut zurück und kontaktiere einen Admin.',
      ],
      cta: { label: 'Anmelden', href: input.loginUrl },
    })
  }
  return pack(locale, 'Your Zaoly password was changed', {
    locale,
    preheader: 'Password updated successfully.',
    eyebrow: 'Security',
    title: 'Password changed',
    paragraphs: [
      'Your Zaoly password was just updated.',
      'If this was not you, reset your password again and contact an admin.',
    ],
    cta: { label: 'Sign in', href: input.loginUrl },
  })
}

function clip(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

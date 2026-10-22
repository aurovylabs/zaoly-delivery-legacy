import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { paths } from './lib/paths'
import { getAuthSecret } from './lib/auth-secret'
import { isGoogleAuthConfigured } from './lib/runtime-config'
import { sendWelcomeEmail, voidSystemMail } from './lib/mail/system-mail'
import { voidEnsureStarterLandingForUser } from './lib/scene/user-starter-scene'
import { readImpersonation } from './lib/users/impersonation'
import { isMfaEnabledForUser, verifyMfaLoginCode } from './lib/users/mfa-store'
import { enforceActiveJwt } from './lib/users/session-revoke'
import { consumeWebAuthnTicket } from './lib/users/webauthn-challenge'
import {
  ensureBootstrapAdmin,
  getUserById,
  isZaolyUserStoreAvailable,
  parseAppRole,
  upsertGoogleMember,
  validateLocalCredentials,
} from './lib/users/user-store'

class MfaRequiredError extends CredentialsSignin {
  code = 'mfa_required'
}

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      totp: { label: 'TOTP', type: 'text' },
      webauthnTicket: { label: 'WebAuthn ticket', type: 'text' },
    },
    async authorize(credentials) {
      if (!isZaolyUserStoreAvailable()) return null
      await ensureBootstrapAdmin()

      const ticket =
        typeof credentials?.webauthnTicket === 'string'
          ? credentials.webauthnTicket.trim()
          : ''
      if (ticket) {
        const userId = consumeWebAuthnTicket(ticket)
        if (!userId) return null
        const user = await getUserById(userId)
        if (!user || user.disabled) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        }
      }

      if (!credentials?.email || !credentials?.password) return null
      const email = String(credentials.email).trim().toLowerCase()
      const password = String(credentials.password)
      const user = await validateLocalCredentials(email, password)
      if (!user) return null
      if (await isMfaEnabledForUser(user.id)) {
        const totp =
          typeof credentials.totp === 'string' ? credentials.totp.trim() : ''
        if (!totp) throw new MfaRequiredError()
        if (!(await verifyMfaLoginCode(user.id, totp))) return null
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
      }
    },
  }),
  ...(isGoogleAuthConfigured()
    ? [
        Google({
          clientId: process.env[paths.envAuthGoogleId]!,
          clientSecret: process.env[paths.envAuthGoogleSecret]!,
        }),
      ]
    : []),
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  providers,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: paths.routes.login },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google') {
        const email =
          (typeof profile?.email === 'string' && profile.email) ||
          (typeof token.email === 'string' ? token.email : '') ||
          ''
        const googleSub = account.providerAccountId
        if (!email || !googleSub) return token
        try {
          const { user: local, created } = await upsertGoogleMember({
            googleSub,
            email,
            name: typeof profile?.name === 'string' ? profile.name : null,
          })
          token.sub = local.id
          token.email = local.email
          token.name = local.name
          token.role = local.role
          if (created) {
            voidEnsureStarterLandingForUser(local.id)
            voidSystemMail(sendWelcomeEmail({ to: local.email, name: local.name }))
          }
        } catch {
          return token
        }
        return token
      }
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        const role = parseAppRole((user as { role?: string }).role)
        if (role) token.role = role
        token.actorSub = user.id
      }

      // Impersonation overlay: effective sub = target; actorSub preserved for admin gates.
      try {
        const imp = await readImpersonation()
        if (imp && token.sub) {
          if (!token.actorSub) token.actorSub = token.sub
          if (imp.actorUserId === token.actorSub || imp.actorUserId === token.sub) {
            const target = await getUserById(imp.targetUserId)
            if (target && !target.disabled) {
              token.sub = target.id
              token.email = target.email
              token.name = target.name
              token.role = target.role
              token.impersonating = true
              token.actorSub = imp.actorUserId
            }
          }
        } else if (token.impersonating && token.actorSub) {
          const actor = await getUserById(String(token.actorSub))
          if (actor) {
            token.sub = actor.id
            token.email = actor.email
            token.name = actor.name
            token.role = actor.role
          }
          delete token.impersonating
        }
      } catch {
        /* no request cookie context */
      }

      try {
        return await enforceActiveJwt(token)
      } catch {
        return token
      }
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.email = token.email ?? ''
        session.user.name = token.name ?? null
        const role = parseAppRole(typeof token.role === 'string' ? token.role : null)
        if (role) {
          ;(session.user as { role?: string }).role = role
        }
        if (token.impersonating) {
          ;(session.user as { impersonating?: boolean }).impersonating = true
          ;(session.user as { impersonatorId?: string }).impersonatorId = String(
            token.actorSub ?? '',
          )
        }
      }
      return session
    },
  },
})

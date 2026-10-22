import type { DefaultSession } from 'next-auth'

/** Matches `AppRole` in `lib/users/user-store` · `zaoly-platform-admin.md` */
type ZaolySessionRole = 'admin' | 'member' | 'platform_admin'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: ZaolySessionRole
      impersonating?: boolean
      impersonatorId?: string
    } & DefaultSession['user']
  }

  interface User {
    role?: ZaolySessionRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: ZaolySessionRole
    actorSub?: string
    impersonating?: boolean
  }
}

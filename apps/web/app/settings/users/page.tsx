import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { paths } from '../../../lib/paths'

/** Compat → canonical platform admin directory · `zaoly-platform-admin.md` */
async function SettingsUsersRedirectBody(): Promise<null> {
  await connection()
  redirect(paths.routes.adminUsers)
  return null
}

export default function SettingsUsersRedirect() {
  return (
    <Suspense fallback={null}>
      <SettingsUsersRedirectBody />
    </Suspense>
  )
}

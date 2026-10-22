import { Suspense } from 'react'
import { AppShell } from '../../components/app-shell'
import { SettingsPage } from '../../components/settings-page'

function SettingsRouteBody() {
  return (
    <AppShell titleKey="pages.settings.title" descriptionKey="pages.settings.lead">
      <SettingsPage />
    </AppShell>
  )
}

export default function SettingsRoute() {
  // AppShell uses usePathname — must stay under Suspense for Cache Components.
  return (
    <Suspense fallback={null}>
      <SettingsRouteBody />
    </Suspense>
  )
}

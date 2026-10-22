import { Suspense } from 'react'
import { AppShell } from '../../components/app-shell'
import { TokenStudioHub } from '../../components/token-studio-hub'

function TokenStudioBody() {
  return (
    <AppShell titleKey="pages.tokens.title" descriptionKey="pages.tokens.lead">
      <TokenStudioHub />
    </AppShell>
  )
}

export default function TokenStudioPage() {
  // AppShell (usePathname) + TokenStudioHub (useSearchParams) under Suspense.
  return (
    <Suspense fallback={null}>
      <TokenStudioBody />
    </Suspense>
  )
}

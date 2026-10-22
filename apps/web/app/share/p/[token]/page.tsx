import { Suspense } from 'react'
import { AppShell } from '../../../../components/app-shell'
import { ClientPageShareViewer } from '../../../../components/client-page-share/client-page-share-viewer'

/**
 * Public client page share — full Zaoly AppFrame + BrandCorner, no product nav.
 * Spec: specs/domain/client-page-share.md · specs/domain/app-shell.md (preview)
 */
async function ClientPageShareBody({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <AppShell preview>
      <ClientPageShareViewer token={decodeURIComponent(token)} />
    </AppShell>
  )
}

export default function ClientPageSharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  // AppShell uses usePathname — must stay under Suspense for Cache Components.
  return (
    <Suspense fallback={null}>
      <ClientPageShareBody params={params} />
    </Suspense>
  )
}

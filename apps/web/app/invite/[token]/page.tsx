import { Suspense } from 'react'
import { InviteAcceptClient } from './invite-accept-client'

async function InviteAcceptBody({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <InviteAcceptClient token={decodeURIComponent(token)} />
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  return (
    <Suspense fallback={null}>
      <InviteAcceptBody params={params} />
    </Suspense>
  )
}

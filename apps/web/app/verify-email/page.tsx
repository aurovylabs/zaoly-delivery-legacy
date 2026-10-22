import { Suspense } from 'react'
import { VerifyEmailPage } from '../../components/verify-email-page'
import { isZaolyDatabaseConfigured } from '../../lib/runtime-config'

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage authConfigured={isZaolyDatabaseConfigured()} />
    </Suspense>
  )
}

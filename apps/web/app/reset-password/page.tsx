import { ResetPasswordPage } from '../../components/reset-password-page'
import { isZaolyDatabaseConfigured } from '../../lib/runtime-config'

export default function ResetPasswordRoute() {
  return <ResetPasswordPage authConfigured={isZaolyDatabaseConfigured()} />
}

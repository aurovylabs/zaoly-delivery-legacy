import { ForgotPasswordPage } from '../../components/forgot-password-page'
import { isZaolyDatabaseConfigured } from '../../lib/runtime-config'

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage authConfigured={isZaolyDatabaseConfigured()} />
}

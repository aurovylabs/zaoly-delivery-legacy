import { LoginPage } from '../../components/login-page'
import {
  isGoogleAuthConfigured,
  isPublicSignupEnabled,
  isZaolyDatabaseConfigured,
} from '../../lib/runtime-config'

export default function LoginRoute() {
  return (
    <LoginPage
      authConfigured={isZaolyDatabaseConfigured()}
      signupEnabled={isPublicSignupEnabled()}
      googleEnabled={isGoogleAuthConfigured()}
    />
  )
}

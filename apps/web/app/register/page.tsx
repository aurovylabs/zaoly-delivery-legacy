import { RegisterPage } from '../../components/register-page'
import {
  isGoogleAuthConfigured,
  isPublicSignupEnabled,
} from '../../lib/runtime-config'

export default function RegisterRoute() {
  return (
    <RegisterPage
      signupEnabled={isPublicSignupEnabled()}
      googleEnabled={isGoogleAuthConfigured()}
    />
  )
}

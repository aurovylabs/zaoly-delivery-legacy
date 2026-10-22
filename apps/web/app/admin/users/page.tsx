import { AdminOpsShell } from '../../../components/admin-ops-shell'
import { SettingsUsersPage } from '../../../components/settings-users-page'

export default function AdminUsersRoute() {
  return (
    <AdminOpsShell titleKey="pages.adminUsers.title" descriptionKey="pages.adminUsers.lead">
      <SettingsUsersPage />
    </AdminOpsShell>
  )
}

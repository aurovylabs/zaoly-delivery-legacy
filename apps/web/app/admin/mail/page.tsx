import { AdminOpsShell } from '../../../components/admin-ops-shell'
import { AdminMailPage } from '../../../components/admin-mail-page'

export default function AdminMailRoute() {
  return (
    <AdminOpsShell titleKey="pages.adminMail.title" descriptionKey="pages.adminMail.lead">
      <AdminMailPage />
    </AdminOpsShell>
  )
}

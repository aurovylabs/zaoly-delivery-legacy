import { AdminOpsShell } from '../../components/admin-ops-shell'
import { AdminOverviewPage } from '../../components/admin-overview-page'

export default function AdminOverviewRoute() {
  return (
    <AdminOpsShell titleKey="pages.admin.title" descriptionKey="pages.admin.lead">
      <AdminOverviewPage />
    </AdminOpsShell>
  )
}

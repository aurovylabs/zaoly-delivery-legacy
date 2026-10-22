import { AdminOpsShell } from '../../../components/admin-ops-shell'
import { AdminAuditPage } from '../../../components/admin-audit-page'

export default function AdminAuditRoute() {
  return (
    <AdminOpsShell titleKey="pages.adminAudit.title" descriptionKey="pages.adminAudit.lead">
      <AdminAuditPage />
    </AdminOpsShell>
  )
}

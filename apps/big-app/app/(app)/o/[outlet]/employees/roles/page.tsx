import { Suspense } from 'react'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { RolesContent } from './roles-content'

export default function EmployeesRolesPage() {
  return (
    <Suspense fallback={<TableSkeleton columns={4} rows={6} showHeader={false} />}>
      <RolesContent />
    </Suspense>
  )
}

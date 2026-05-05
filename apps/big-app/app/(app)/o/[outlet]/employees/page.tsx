import { Suspense } from 'react'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { EmployeesContent } from './employees-content'

export default function EmployeesPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <h2 className="shrink-0 font-semibold text-lg">Employee listing</h2>
      <Suspense fallback={<TableSkeleton columns={6} rows={8} showHeader={false} />}>
        <EmployeesContent />
      </Suspense>
    </div>
  )
}

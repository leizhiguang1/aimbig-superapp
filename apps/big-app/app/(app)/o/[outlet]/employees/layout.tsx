import { Suspense, type ReactNode } from 'react'
import { EmployeesTabs } from '@/components/employees/EmployeesTabs'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="shrink-0">
        <h1 className="font-semibold text-2xl tracking-tight">Employees</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Staff directory, roles, positions, and commission rules.
        </p>
      </div>
      <div className="shrink-0">
        <EmployeesTabs />
      </div>
      <Suspense fallback={<TableSkeleton columns={5} rows={8} showHeader={false} />}>
        {children}
      </Suspense>
    </div>
  )
}

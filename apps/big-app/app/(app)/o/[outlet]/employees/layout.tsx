import { Suspense, type ReactNode } from 'react'
import { EmployeesTabs } from '@/components/employees/EmployeesTabs'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { hasPermission } from '@/lib/auth/permissions'
import { getServerContext } from '@/lib/context/server'

export default async function EmployeesLayout({ children }: { children: ReactNode }) {
  const ctx = await getServerContext()
  const [canList, canRoles, canPositions, canCommission] = await Promise.all([
    hasPermission(ctx, 'staff.employee_listing'),
    hasPermission(ctx, 'staff.roles'),
    hasPermission(ctx, 'staff.position'),
    hasPermission(ctx, 'staff.commissions'),
  ])
  const visible = [
    canList ? 'listing' : null,
    canRoles ? 'roles' : null,
    canPositions ? 'positions' : null,
    canCommission ? 'commission' : null,
  ].filter(Boolean) as Array<'listing' | 'roles' | 'positions' | 'commission'>

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="shrink-0">
        <h1 className="font-semibold text-2xl tracking-tight">Employees</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Staff directory, roles, positions, and commission rules.
        </p>
      </div>
      <div className="shrink-0">
        <EmployeesTabs visible={visible} />
      </div>
      <Suspense fallback={<TableSkeleton columns={5} rows={8} showHeader={false} />}>
        {children}
      </Suspense>
    </div>
  )
}

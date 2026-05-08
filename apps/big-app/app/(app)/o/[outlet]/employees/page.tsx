import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { hasPermission } from '@/lib/auth/permissions'
import { getServerContext } from '@/lib/context/server'
import { outletPath } from '@/lib/outlet-path'
import { EmployeesContent } from './employees-content'

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ outlet: string }>
}) {
  // Sidebar shows "Employees" if the user has ANY staff.* flag, but this
  // page renders the listing which needs `staff.employee_listing`. If the
  // user has e.g. only `staff.roles`, redirect them to the first sub-tab
  // they CAN see instead of 404'ing.
  const { outlet } = await params
  const ctx = await getServerContext()
  if (!(await hasPermission(ctx, 'staff.employee_listing'))) {
    if (await hasPermission(ctx, 'staff.roles')) {
      redirect(outletPath(outlet, '/employees/roles'))
    }
    if (await hasPermission(ctx, 'staff.position')) {
      redirect(outletPath(outlet, '/employees/positions'))
    }
    if (await hasPermission(ctx, 'staff.commissions')) {
      redirect(outletPath(outlet, '/employees/commission'))
    }
    // No staff flags at all — fall through; EmployeesContent will notFound().
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <h2 className="shrink-0 font-semibold text-lg">Employee listing</h2>
      <Suspense fallback={<TableSkeleton columns={6} rows={8} showHeader={false} />}>
        <EmployeesContent />
      </Suspense>
    </div>
  )
}

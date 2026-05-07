import { notFound } from 'next/navigation'
import { EmployeesTable } from '@/components/employees/EmployeesTable'
import { NewEmployeeButton } from '@/components/employees/EmployeeForm'
import { hasPermission } from '@/lib/auth/permissions'
import { getServerContext } from '@/lib/context/server'
import { listEmployees } from '@/lib/services/employees'
import { listOutlets } from '@/lib/services/outlets'
import { listPositions } from '@/lib/services/positions'
import { listRoles } from '@/lib/services/roles'

export async function EmployeesContent() {
  const ctx = await getServerContext()
  if (!(await hasPermission(ctx, 'staff.employee_listing'))) notFound()
  const canManage = await hasPermission(ctx, 'staff.employees')
  const [employees, roles, positions, outlets] = await Promise.all([
    listEmployees(ctx),
    listRoles(ctx),
    listPositions(ctx),
    listOutlets(ctx),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {employees.length} employee{employees.length === 1 ? '' : 's'}
        </p>
        {canManage ? (
          <NewEmployeeButton roles={roles} positions={positions} outlets={outlets} />
        ) : null}
      </div>
      <EmployeesTable
        employees={employees}
        roles={roles}
        positions={positions}
        outlets={outlets}
        canManage={canManage}
      />
    </div>
  )
}

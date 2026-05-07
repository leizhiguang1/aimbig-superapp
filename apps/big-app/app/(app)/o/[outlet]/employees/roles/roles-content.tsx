import { notFound } from 'next/navigation'
import { NewRoleButton } from '@/components/employees/RoleForm'
import { RolesPermissionMatrix } from '@/components/employees/RolesPermissionMatrix'
import { hasPermission } from '@/lib/auth/permissions'
import { getServerContext } from '@/lib/context/server'
import { listRoles } from '@/lib/services/roles'

export async function RolesContent() {
  const ctx = await getServerContext()
  if (!(await hasPermission(ctx, 'staff.roles'))) notFound()
  const roles = await listRoles(ctx)

  return (
    <div className="flex flex-col gap-3 px-1 pb-8 md:px-3 md:pb-12">
      <RolesPermissionMatrix
        roles={roles}
        toolbarLeft={
          <p className="text-muted-foreground text-sm">
            {roles.length} role{roles.length === 1 ? '' : 's'}
          </p>
        }
        toolbarRight={<NewRoleButton />}
      />
    </div>
  )
}

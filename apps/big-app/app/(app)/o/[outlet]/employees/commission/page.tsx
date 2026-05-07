import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { hasPermission } from '@/lib/auth/permissions'
import { getServerContext } from '@/lib/context/server'

export default async function EmployeesCommissionPage() {
  const ctx = await getServerContext()
  if (!(await hasPermission(ctx, 'staff.commissions'))) notFound()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Commission</CardTitle>
        <CardDescription>
          Commission rules are configured in Phase 2. This tab is a placeholder.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Commission calculation lands alongside Sales reporting and payroll flows in Phase 2.
      </CardContent>
    </Card>
  )
}

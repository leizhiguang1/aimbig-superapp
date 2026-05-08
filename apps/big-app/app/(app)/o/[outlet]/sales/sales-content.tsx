import { SalesOrdersTableWithDetail } from "@/components/sales/SalesOrdersTableWithDetail";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import { listSalesOrders } from "@/lib/services/sales";

export async function SalesOrdersContent() {
	const ctx = await getServerContext();
	const canSalesAll = await hasPermission(
		ctx,
		"sales.customer_transparency",
	);
	const customerConsultantIdFilter = canSalesAll
		? null
		: (ctx.currentUser?.employeeId ?? null);
	const orders = await listSalesOrders(ctx, { customerConsultantIdFilter });

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3">
			<div className="flex shrink-0 items-center justify-between text-muted-foreground text-sm">
				<span>
					{orders.length} sales order{orders.length === 1 ? "" : "s"}
				</span>
			</div>
			<SalesOrdersTableWithDetail orders={orders} />
		</div>
	);
}

import { notFound } from "next/navigation";
import { NewCustomerButton } from "@/components/customers/CustomerForm";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import { listCustomers } from "@/lib/services/customers";
import { listEmployees } from "@/lib/services/employees";
import { listOutlets } from "@/lib/services/outlets";

export async function CustomersContent({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	const { outlet: outletCode } = await params;
	const ctx = await getServerContext();
	if (!(await hasPermission(ctx, "customers.customers"))) notFound();
	const [canCreate, canUpdate, canSeeContact, canCustomerAll] =
		await Promise.all([
			hasPermission(ctx, "customers.customers"),
			hasPermission(ctx, "customers.update"),
			hasPermission(ctx, "customers.customers_contact"),
			hasPermission(ctx, "customers.customer_transparency"),
		]);
	const consultantFilter = canCustomerAll
		? null
		: (ctx.currentUser?.employeeId ?? null);
	const [customers, outlets, employees] = await Promise.all([
		listCustomers(ctx, { consultantIdFilter: consultantFilter }),
		listOutlets(ctx),
		listEmployees(ctx),
	]);

	const defaultConsultantId = ctx.currentUser?.employeeId ?? null;
	const defaultHomeOutletId =
		outlets.find((o) => o.code === outletCode)?.id ?? null;

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex shrink-0 items-center justify-between">
				<p className="text-muted-foreground text-sm">
					{customers.length} customer{customers.length === 1 ? "" : "s"}
				</p>
				{canCreate ? (
					<NewCustomerButton
						outlets={outlets}
						employees={employees}
						defaultConsultantId={defaultConsultantId}
						defaultHomeOutletId={defaultHomeOutletId}
					/>
				) : null}
			</div>
			<CustomersTable
				customers={customers}
				outlets={outlets}
				employees={employees}
				defaultConsultantId={defaultConsultantId}
				canUpdate={canUpdate}
				canSeeContact={canSeeContact}
			/>
		</div>
	);
}

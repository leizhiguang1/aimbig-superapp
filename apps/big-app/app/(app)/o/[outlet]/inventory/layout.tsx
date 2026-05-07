import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";

export default async function InventoryLayout({ children }: { children: ReactNode }) {
	const ctx = await getServerContext();
	if (!(await hasPermission(ctx, "inventory.inventory"))) notFound();
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Inventory</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Catalog of products, consumables, and medications. Stock levels and
					low-stock alerts.
				</p>
			</div>
			<InventoryTabs />
			<Suspense
				fallback={<TableSkeleton columns={6} rows={8} showHeader={false} />}
			>
				{children}
			</Suspense>
		</div>
	);
}

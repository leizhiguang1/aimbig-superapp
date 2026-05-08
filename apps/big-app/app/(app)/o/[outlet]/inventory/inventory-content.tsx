import { AddItemButton } from "@/components/inventory/AddItemChooser";
import { ItemsTable } from "@/components/inventory/ItemsTable";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import {
	listBrands,
	listCategories,
	listInventoryItems,
	listSuppliers,
	listUoms,
} from "@/lib/services/inventory";
import { listOutlets } from "@/lib/services/outlets";
import { listTaxes } from "@/lib/services/taxes";

export async function InventoryContent({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	const { outlet: outletCode } = await params;
	const ctx = await getServerContext();
	const [outlets, uoms, brands, categories, suppliers, taxes, canSeeCost, canEdit] =
		await Promise.all([
			listOutlets(ctx),
			listUoms(ctx),
			listBrands(ctx),
			listCategories(ctx),
			listSuppliers(ctx),
			listTaxes(ctx),
			hasPermission(ctx, "inventory.inventory_cost"),
			hasPermission(ctx, "inventory.inventory_edit"),
		]);
	const activeOutletId = outlets.find((o) => o.code === outletCode)?.id ?? null;
	const items = await listInventoryItems(ctx, activeOutletId);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex shrink-0 items-center justify-between">
				<p className="text-muted-foreground text-sm">
					{items.length} item{items.length === 1 ? "" : "s"}
				</p>
				{canEdit ? (
					<AddItemButton
						uoms={uoms}
						brands={brands}
						categories={categories}
						suppliers={suppliers}
						taxes={taxes}
						outlets={outlets}
						canSeeCost={canSeeCost}
					/>
				) : null}
			</div>
			<ItemsTable
				items={items}
				uoms={uoms}
				brands={brands}
				categories={categories}
				suppliers={suppliers}
				taxes={taxes}
				outlets={outlets}
				activeOutletId={activeOutletId}
				canSeeCost={canSeeCost}
				canEdit={canEdit}
			/>
		</div>
	);
}

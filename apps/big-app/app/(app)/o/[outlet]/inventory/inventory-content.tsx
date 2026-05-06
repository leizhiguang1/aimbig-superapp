import { AddItemButton } from "@/components/inventory/AddItemChooser";
import { ItemsTable } from "@/components/inventory/ItemsTable";
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
	const [outlets, uoms, brands, categories, suppliers, taxes] =
		await Promise.all([
			listOutlets(ctx),
			listUoms(ctx),
			listBrands(ctx),
			listCategories(ctx),
			listSuppliers(ctx),
			listTaxes(ctx),
		]);
	const activeOutletId = outlets.find((o) => o.code === outletCode)?.id ?? null;
	const items = await listInventoryItems(ctx, activeOutletId);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					{items.length} item{items.length === 1 ? "" : "s"}
				</p>
				<AddItemButton
					uoms={uoms}
					brands={brands}
					categories={categories}
					suppliers={suppliers}
					taxes={taxes}
					outlets={outlets}
				/>
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
			/>
		</div>
	);
}

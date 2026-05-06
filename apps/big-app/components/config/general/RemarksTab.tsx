import { RemarkCategoryCard } from "@/components/config/general/RemarkCategoryCard";
import type { BrandConfigCategory } from "@/lib/brand-config/categories";
import { getServerContext } from "@/lib/context/server";
import { listBrandConfigItemsByCategories } from "@/lib/services/brand-config";

const REMARK_CATEGORIES: BrandConfigCategory[] = [
	"reason.stock_add",
	"reason.stock_reduce",
	"reason.stock_return",
	"void_reason",
	"reason.receipt",
	"reason.attendance",
	"reason.appointment_consumable",
	"reason.appointment_cancel",
	"reason.appointment_revert",
	"reason.employee_edit",
	"reason.lead_unsuccessful",
	"lead_contact_preference",
];

export async function RemarksTab() {
	const ctx = await getServerContext();
	const grouped = await listBrandConfigItemsByCategories(
		ctx,
		REMARK_CATEGORIES,
		{ includeArchived: true },
	);

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{REMARK_CATEGORIES.map((category) => (
				<RemarkCategoryCard
					key={category}
					category={category}
					items={grouped[category] ?? []}
				/>
			))}
		</div>
	);
}

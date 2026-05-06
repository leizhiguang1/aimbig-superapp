import { DashboardRemindersCard } from "@/components/dashboard/DashboardRemindersCard";
import { LowStockCard } from "@/components/dashboard/LowStockCard";
import { getServerContext } from "@/lib/context/server";
import { listRemindersForEmployee } from "@/lib/services/follow-ups";
import { listLowStockItems } from "@/lib/services/inventory";
import { listOutlets } from "@/lib/services/outlets";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	const ctx = await getServerContext();
	const { outlet } = await params;
	const outlets = await listOutlets(ctx);
	const activeOutletId = outlets.find((o) => o.code === outlet)?.id ?? null;

	const [reminders, lowStock] = await Promise.all([
		ctx.currentUser?.employeeId
			? listRemindersForEmployee(ctx, ctx.currentUser.employeeId)
			: Promise.resolve([]),
		activeOutletId
			? listLowStockItems(ctx, activeOutletId)
			: Promise.resolve([]),
	]);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<DashboardRemindersCard reminders={reminders} />
				<LowStockCard items={lowStock} outletSlug={outlet} />
			</div>
		</div>
	);
}

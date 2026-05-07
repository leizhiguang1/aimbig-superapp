import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/shell/placeholder-page";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";

export default async function ReportsPage() {
	const ctx = await getServerContext();
	if (!(await hasPermission(ctx, "system.reports"))) notFound();
	return (
		<PlaceholderPage
			title="Reports"
			description="Revenue, appointments, commission, and utilization reports."
		/>
	);
}

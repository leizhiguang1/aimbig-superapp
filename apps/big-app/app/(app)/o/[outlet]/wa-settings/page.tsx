import { notFound } from "next/navigation";
import { getServerContext } from "@/lib/context/server";
import { listOutlets } from "@/lib/services/outlets";
import { WaSettingsClient } from "./wa-settings-client";

export const dynamic = "force-dynamic";

export default async function WaSettingsPage({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	const { outlet: outletCode } = await params;
	const ctx = await getServerContext();
	const outlets = await listOutlets(ctx);
	const current = outlets.find((o) => o.code === outletCode && o.is_active);
	if (!current) notFound();

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="font-semibold text-lg">WhatsApp Lines & Settings</h2>
				<p className="text-muted-foreground text-sm">
					Manage WhatsApp lines, push notifications, chat staff, tags and CRM
					stages.
				</p>
			</div>
			<WaSettingsClient outletId={current.id} />
		</div>
	);
}

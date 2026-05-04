import { notFound } from "next/navigation";
import { getServerContext } from "@/lib/context/server";
import { listOutlets } from "@/lib/services/outlets";
import { AutomationsClient } from "./automations-client";

export const dynamic = "force-dynamic";

export default async function AutomationsPage({
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
				<h2 className="font-semibold text-lg">Automations</h2>
				<p className="text-muted-foreground text-sm">
					Auto-reply and scheduled WhatsApp messages. Runs in the WhatsApp
					service, not in BIG.
				</p>
			</div>
			<AutomationsClient outletId={current.id} />
		</div>
	);
}

import { notFound } from "next/navigation";
import { getServerContext } from "@/lib/context/server";
import { listOutlets } from "@/lib/services/outlets";
import { ContactsClient } from "./contacts-client";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
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
				<h2 className="font-semibold text-lg">WhatsApp Contacts</h2>
				<p className="text-muted-foreground text-sm">
					CRM metadata for your WhatsApp contacts. Separate from the Customers
					module.
				</p>
			</div>
			<ContactsClient outletId={current.id} />
		</div>
	);
}

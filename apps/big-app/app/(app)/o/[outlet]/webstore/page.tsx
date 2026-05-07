import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/shell/placeholder-page";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";

export default async function WebstorePage() {
	const ctx = await getServerContext();
	if (!(await hasPermission(ctx, "system.webstore"))) notFound();
	return (
		<PlaceholderPage
			title="Webstore"
			description="Public booking site and online store. (Phase 2.)"
		/>
	);
}

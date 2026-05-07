"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as billingSettingsService from "@/lib/services/billing-settings";

export type BillingSettingsActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof billingSettingsService.updateBillingSettings>>;

export async function updateBillingSettingsAction(
	input: unknown,
): Promise<BillingSettingsActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		const settings = await billingSettingsService.updateBillingSettings(
			ctx,
			input,
		);
		revalidatePath("/o/[outlet]/config/sales", "page");
		return settings;
	} catch (err) {
		return toErr("[updateBillingSettingsAction]", err);
	}
}

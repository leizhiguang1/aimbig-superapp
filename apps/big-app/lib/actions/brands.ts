"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as brandsService from "@/lib/services/brands";

export type BrandActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof brandsService.updateBrand>>;

export async function updateBrandAction(
	input: unknown,
): Promise<BrandActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		const brand = await brandsService.updateBrand(ctx, input);
		revalidatePath("/o/[outlet]/config/general", "page");
		return brand;
	} catch (err) {
		return toErr("[updateBrandAction]", err);
	}
}

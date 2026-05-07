"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import {
	type BrandConfigCategory,
	isBrandConfigCategory,
} from "@/lib/brand-config/categories";
import { getServerContext } from "@/lib/context/server";
import { ValidationError } from "@/lib/errors";
import * as brandConfigService from "@/lib/services/brand-config";

// Categories are referenced from many surfaces — revalidate the admin page
// and the primary consumers so rename/reorder shows up everywhere.
function revalidate() {
	revalidatePath("/o/[outlet]/config/appointments", "page");
	revalidatePath("/o/[outlet]/config/sales", "page");
	revalidatePath("/o/[outlet]/config/customers", "page");
	revalidatePath("/o/[outlet]/appointments", "page");
	revalidatePath("/o/[outlet]/customers", "page");
	revalidatePath("/o/[outlet]/sales", "page");
}

export type BrandConfigItemActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof brandConfigService.createBrandConfigItem>>;

export async function createBrandConfigItemAction(
	input: unknown,
): Promise<BrandConfigItemActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		const row = await brandConfigService.createBrandConfigItem(ctx, input);
		revalidate();
		return row;
	} catch (err) {
		return toErr("[createBrandConfigItemAction]", err);
	}
}

export async function updateBrandConfigItemAction(
	id: string,
	input: unknown,
): Promise<BrandConfigItemActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		const row = await brandConfigService.updateBrandConfigItem(ctx, id, input);
		revalidate();
		return row;
	} catch (err) {
		return toErr("[updateBrandConfigItemAction]", err);
	}
}

export async function archiveBrandConfigItemAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		await brandConfigService.archiveBrandConfigItem(ctx, id);
		revalidate();
		return { ok: true };
	} catch (err) {
		return toErr("[archiveBrandConfigItemAction]", err);
	}
}

export async function deleteBrandConfigItemAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		await brandConfigService.deleteBrandConfigItem(ctx, id);
		revalidate();
		return { ok: true };
	} catch (err) {
		return toErr("[deleteBrandConfigItemAction]", err);
	}
}

// Client-safe fetch of the active rows for a category. Used by dialogs that
// need a picklist without making the parent RSC fetch pre-open.
export async function listActiveBrandConfigItemsAction(category: string) {
	if (!isBrandConfigCategory(category))
		throw new ValidationError(`Unknown category "${category}"`);
	const ctx = await getServerContext();
	return brandConfigService.listActiveBrandConfigItems(
		ctx,
		category as BrandConfigCategory,
	);
}

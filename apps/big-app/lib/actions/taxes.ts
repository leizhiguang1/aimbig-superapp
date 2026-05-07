"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as taxesService from "@/lib/services/taxes";

function revalidate() {
	revalidatePath("/o/[outlet]/config/taxes", "page");
	revalidatePath("/o/[outlet]/services", "page");
	revalidatePath("/o/[outlet]/inventory", "page");
}

export type TaxActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof taxesService.createTax>>;

export async function createTaxAction(
	input: unknown,
): Promise<TaxActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		const tax = await taxesService.createTax(ctx, input);
		revalidate();
		return tax;
	} catch (err) {
		return toErr("[createTaxAction]", err);
	}
}

export async function updateTaxAction(
	id: string,
	input: unknown,
): Promise<TaxActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		const tax = await taxesService.updateTax(ctx, id, input);
		revalidate();
		return tax;
	} catch (err) {
		return toErr("[updateTaxAction]", err);
	}
}

export async function deleteTaxAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.config");
		await taxesService.deleteTax(ctx, id);
		revalidate();
		return { ok: true };
	} catch (err) {
		return toErr("[deleteTaxAction]", err);
	}
}

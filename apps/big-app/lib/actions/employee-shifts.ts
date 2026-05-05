"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as service from "@/lib/services/employee-shifts";

export type ShiftActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof service.createShift>>;

export async function createShiftAction(
	input: unknown,
): Promise<ShiftActionResult> {
	try {
		const ctx = await getServerContext();
		const shift = await service.createShift(ctx, input);
		revalidatePath("/o/[outlet]/roster", "page");
		return shift;
	} catch (err) {
		return toErr("[createShiftAction]", err);
	}
}

export async function updateShiftAction(
	id: string,
	input: unknown,
): Promise<ShiftActionResult> {
	try {
		const ctx = await getServerContext();
		const shift = await service.updateShift(ctx, id, input);
		revalidatePath("/o/[outlet]/roster", "page");
		return shift;
	} catch (err) {
		return toErr("[updateShiftAction]", err);
	}
}

export async function deleteShiftAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await service.deleteShift(ctx, id);
		revalidatePath("/o/[outlet]/roster", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteShiftAction]", err);
	}
}

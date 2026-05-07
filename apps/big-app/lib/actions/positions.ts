"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as positionsService from "@/lib/services/positions";

export type PositionActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof positionsService.createPosition>>;

export async function createPositionAction(
	input: unknown,
): Promise<PositionActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.position");
		const position = await positionsService.createPosition(ctx, input);
		revalidatePath("/o/[outlet]/employees/positions", "page");
		return position;
	} catch (err) {
		return toErr("[createPositionAction]", err);
	}
}

export async function updatePositionAction(
	id: string,
	input: unknown,
): Promise<PositionActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.position");
		const position = await positionsService.updatePosition(ctx, id, input);
		revalidatePath("/o/[outlet]/employees/positions", "page");
		return position;
	} catch (err) {
		return toErr("[updatePositionAction]", err);
	}
}

export async function deletePositionAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "staff.position");
		await positionsService.deletePosition(ctx, id);
		revalidatePath("/o/[outlet]/employees/positions", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deletePositionAction]", err);
	}
}

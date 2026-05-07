"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as passcodesService from "@/lib/services/passcodes";

export type PasscodeActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof passcodesService.createPasscode>>;

export async function createPasscodeAction(
	input: unknown,
): Promise<PasscodeActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.passcode");
		const passcode = await passcodesService.createPasscode(ctx, input);
		revalidatePath("/o/[outlet]/passcode", "page");
		return passcode;
	} catch (err) {
		return toErr("[createPasscodeAction]", err);
	}
}

export async function deletePasscodeAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.passcode");
		await passcodesService.deletePasscode(ctx, id);
		revalidatePath("/o/[outlet]/passcode", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deletePasscodeAction]", err);
	}
}

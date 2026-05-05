"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import {
	createFormResponse,
	deleteFormResponse,
} from "@/lib/services/form-responses";

export type FormResponseActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof createFormResponse>>;

export async function createFormResponseAction(
	input: unknown,
): Promise<FormResponseActionResult> {
	try {
		const ctx = await getServerContext();
		const result = await createFormResponse(ctx, input);
		revalidatePath("/", "layout");
		return result;
	} catch (err) {
		return toErr("[createFormResponseAction]", err);
	}
}

export async function deleteFormResponseAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await deleteFormResponse(ctx, id);
		revalidatePath("/", "layout");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteFormResponseAction]", err);
	}
}

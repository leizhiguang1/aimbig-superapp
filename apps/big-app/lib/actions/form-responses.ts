"use server";

import { revalidatePath } from "next/cache";
import { getServerContext } from "@/lib/context/server";
import {
	createFormResponse,
	deleteFormResponse,
} from "@/lib/services/form-responses";

export async function createFormResponseAction(input: unknown) {
	const ctx = await getServerContext();
	const result = await createFormResponse(ctx, input);
	revalidatePath("/", "layout");
	return result;
}

export async function deleteFormResponseAction(id: string) {
	const ctx = await getServerContext();
	await deleteFormResponse(ctx, id);
	revalidatePath("/", "layout");
}

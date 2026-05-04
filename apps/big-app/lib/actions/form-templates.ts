"use server";

import { revalidatePath } from "next/cache";
import { getServerContext } from "@/lib/context/server";
import {
	createFormTemplate,
	deleteFormTemplate,
	updateFormTemplate,
} from "@/lib/services/form-templates";

export async function createFormTemplateAction(input: unknown) {
	const ctx = await getServerContext();
	const result = await createFormTemplate(ctx, input);
	revalidatePath("/config/e-documents");
	return result;
}

export async function updateFormTemplateAction(id: string, input: unknown) {
	const ctx = await getServerContext();
	const result = await updateFormTemplate(ctx, id, input);
	revalidatePath("/config/e-documents");
	return result;
}

export async function deleteFormTemplateAction(id: string) {
	const ctx = await getServerContext();
	await deleteFormTemplate(ctx, id);
	revalidatePath("/config/e-documents");
}

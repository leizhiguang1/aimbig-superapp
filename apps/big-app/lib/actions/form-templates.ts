"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import {
	createFormTemplate,
	deleteFormTemplate,
	type FormTemplateWithSections,
	updateFormTemplate,
} from "@/lib/services/form-templates";

export type FormTemplateActionResult =
	| { error: string }
	| FormTemplateWithSections;

export async function createFormTemplateAction(
	input: unknown,
): Promise<FormTemplateActionResult> {
	try {
		const ctx = await getServerContext();
		const result = await createFormTemplate(ctx, input);
		revalidatePath("/config/e-documents");
		return result;
	} catch (err) {
		return toErr("[createFormTemplateAction]", err);
	}
}

export async function updateFormTemplateAction(
	id: string,
	input: unknown,
): Promise<FormTemplateActionResult> {
	try {
		const ctx = await getServerContext();
		const result = await updateFormTemplate(ctx, id, input);
		revalidatePath("/config/e-documents");
		return result;
	} catch (err) {
		return toErr("[updateFormTemplateAction]", err);
	}
}

export async function deleteFormTemplateAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await deleteFormTemplate(ctx, id);
		revalidatePath("/config/e-documents");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteFormTemplateAction]", err);
	}
}

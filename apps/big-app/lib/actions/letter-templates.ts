"use server";

import { revalidatePath } from "next/cache";
import { getServerContext } from "@/lib/context/server";
import * as letterTemplatesService from "@/lib/services/letter-templates";

export async function listLetterTemplatesAction() {
	const ctx = await getServerContext();
	return letterTemplatesService.listLetterTemplates(ctx, { activeOnly: false });
}

export async function listActiveLetterTemplatesAction() {
	const ctx = await getServerContext();
	return letterTemplatesService.listLetterTemplates(ctx, { activeOnly: true });
}

export async function createLetterTemplateAction(input: unknown) {
	const ctx = await getServerContext();
	const tpl = await letterTemplatesService.createLetterTemplate(ctx, input);
	revalidatePath("/o/[outlet]/config/letter-templates", "page");
	return tpl;
}

export async function updateLetterTemplateAction(id: string, input: unknown) {
	const ctx = await getServerContext();
	const tpl = await letterTemplatesService.updateLetterTemplate(ctx, id, input);
	revalidatePath("/o/[outlet]/config/letter-templates", "page");
	return tpl;
}

export async function deleteLetterTemplateAction(id: string) {
	const ctx = await getServerContext();
	await letterTemplatesService.deleteLetterTemplate(ctx, id);
	revalidatePath("/o/[outlet]/config/letter-templates", "page");
}

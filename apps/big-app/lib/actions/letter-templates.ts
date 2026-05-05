"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
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

export type LetterTemplateActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof letterTemplatesService.createLetterTemplate>>;

export async function createLetterTemplateAction(
	input: unknown,
): Promise<LetterTemplateActionResult> {
	try {
		const ctx = await getServerContext();
		const tpl = await letterTemplatesService.createLetterTemplate(ctx, input);
		revalidatePath("/o/[outlet]/config/letter-templates", "page");
		return tpl;
	} catch (err) {
		return toErr("[createLetterTemplateAction]", err);
	}
}

export async function updateLetterTemplateAction(
	id: string,
	input: unknown,
): Promise<LetterTemplateActionResult> {
	try {
		const ctx = await getServerContext();
		const tpl = await letterTemplatesService.updateLetterTemplate(ctx, id, input);
		revalidatePath("/o/[outlet]/config/letter-templates", "page");
		return tpl;
	} catch (err) {
		return toErr("[updateLetterTemplateAction]", err);
	}
}

export async function deleteLetterTemplateAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await letterTemplatesService.deleteLetterTemplate(ctx, id);
		revalidatePath("/o/[outlet]/config/letter-templates", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteLetterTemplateAction]", err);
	}
}

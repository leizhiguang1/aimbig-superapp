import type { Context } from "@/lib/context/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
	type FormTemplateInput,
	formTemplateInputSchema,
} from "@/lib/schemas/form-templates";
import { assertBrandId } from "@/lib/supabase/query";
import type { Tables } from "@/lib/supabase/types";

export type FormTemplate = Tables<"form_templates">;
export type FormTemplateSection = Tables<"form_template_sections">;

export type FormTemplateWithSections = FormTemplate & {
	sections: FormTemplateSection[];
};

export async function listFormTemplates(
	ctx: Context,
	opts?: { activeOnly?: boolean },
): Promise<FormTemplateWithSections[]> {
	const brandId = assertBrandId(ctx);
	let q = ctx.db
		.from("form_templates")
		.select("*, sections:form_template_sections(*)")
		.eq("brand_id", brandId)
		.order("name");
	if (opts?.activeOnly) q = q.eq("is_active", true);
	const { data, error } = await q;
	if (error) throw new ValidationError(error.message);
	return ((data ?? []) as FormTemplateWithSections[]).map((t) => ({
		...t,
		sections: (t.sections ?? []).sort((a, b) => a.sort_order - b.sort_order),
	}));
}

export async function getFormTemplate(
	ctx: Context,
	id: string,
): Promise<FormTemplateWithSections> {
	const brandId = assertBrandId(ctx);
	const { data, error } = await ctx.db
		.from("form_templates")
		.select("*, sections:form_template_sections(*)")
		.eq("id", id)
		.eq("brand_id", brandId)
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Form template ${id} not found`);
	const t = data as FormTemplateWithSections;
	return { ...t, sections: (t.sections ?? []).sort((a, b) => a.sort_order - b.sort_order) };
}

export async function createFormTemplate(
	ctx: Context,
	input: unknown,
): Promise<FormTemplateWithSections> {
	const brandId = assertBrandId(ctx);
	const { sections, ...rest }: FormTemplateInput = formTemplateInputSchema.parse(input);

	const { data: tpl, error: tplErr } = await ctx.db
		.from("form_templates")
		.insert({ ...rest, brand_id: brandId })
		.select("*")
		.single();
	if (tplErr) throw new ValidationError(tplErr.message);

	if (sections.length > 0) {
		const { error: secErr } = await ctx.db
			.from("form_template_sections")
			.insert(sections.map((s) => ({ ...s, form_template_id: tpl.id })));
		if (secErr) throw new ValidationError(secErr.message);
	}

	return getFormTemplate(ctx, tpl.id);
}

export async function updateFormTemplate(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<FormTemplateWithSections> {
	const brandId = assertBrandId(ctx);
	const { sections, ...rest } = formTemplateInputSchema.partial().parse(input);

	const { error: tplErr } = await ctx.db
		.from("form_templates")
		.update(rest)
		.eq("id", id)
		.eq("brand_id", brandId);
	if (tplErr) throw new ValidationError(tplErr.message);

	// Replace sections when provided
	if (sections !== undefined) {
		await ctx.db.from("form_template_sections").delete().eq("form_template_id", id);
		if (sections.length > 0) {
			const { error: secErr } = await ctx.db
				.from("form_template_sections")
				.insert(sections.map((s) => ({ ...s, form_template_id: id })));
			if (secErr) throw new ValidationError(secErr.message);
		}
	}

	return getFormTemplate(ctx, id);
}

export async function deleteFormTemplate(ctx: Context, id: string): Promise<void> {
	const brandId = assertBrandId(ctx);
	const { error } = await ctx.db
		.from("form_templates")
		.delete()
		.eq("id", id)
		.eq("brand_id", brandId);
	if (error) throw new ValidationError(error.message);
}

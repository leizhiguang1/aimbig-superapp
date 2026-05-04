import type { Context } from "@/lib/context/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { letterTemplateInputSchema } from "@/lib/schemas/letter-templates";
import { assertBrandId } from "@/lib/supabase/query";
import type { Tables } from "@/lib/supabase/types";

export type LetterTemplate = Tables<"letter_templates">;

export async function listLetterTemplates(
	ctx: Context,
	opts?: { activeOnly?: boolean },
): Promise<LetterTemplate[]> {
	const brandId = assertBrandId(ctx);
	let q = ctx.db
		.from("letter_templates")
		.select("*")
		.eq("brand_id", brandId)
		.order("name");
	if (opts?.activeOnly) q = q.eq("is_active", true);
	const { data, error } = await q;
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function getLetterTemplate(
	ctx: Context,
	id: string,
): Promise<LetterTemplate> {
	const brandId = assertBrandId(ctx);
	const { data, error } = await ctx.db
		.from("letter_templates")
		.select("*")
		.eq("id", id)
		.eq("brand_id", brandId)
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Letter template ${id} not found`);
	return data;
}

export async function createLetterTemplate(
	ctx: Context,
	input: unknown,
): Promise<LetterTemplate> {
	const brandId = assertBrandId(ctx);
	const p = letterTemplateInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("letter_templates")
		.insert({ ...p, brand_id: brandId })
		.select("*")
		.single();
	if (error) throw new ValidationError(error.message);
	return data;
}

export async function updateLetterTemplate(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<LetterTemplate> {
	const brandId = assertBrandId(ctx);
	const p = letterTemplateInputSchema.partial().parse(input);
	const { data, error } = await ctx.db
		.from("letter_templates")
		.update(p)
		.eq("id", id)
		.eq("brand_id", brandId)
		.select("*")
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Letter template ${id} not found`);
	return data;
}

export async function deleteLetterTemplate(
	ctx: Context,
	id: string,
): Promise<void> {
	const brandId = assertBrandId(ctx);
	const { error } = await ctx.db
		.from("letter_templates")
		.delete()
		.eq("id", id)
		.eq("brand_id", brandId);
	if (error) throw new ValidationError(error.message);
}

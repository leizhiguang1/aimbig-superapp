import type { Context } from "@/lib/context/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
	type FormResponseInput,
	formResponseInputSchema,
} from "@/lib/schemas/form-templates";
import type { Tables } from "@/lib/supabase/types";

export type FormResponse = Tables<"customer_form_responses">;

export async function listFormResponsesForCustomer(
	ctx: Context,
	customerId: string,
): Promise<FormResponse[]> {
	const { data, error } = await ctx.db
		.from("customer_form_responses")
		.select("*")
		.eq("customer_id", customerId)
		.order("created_at", { ascending: false });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function listFormResponsesForAppointment(
	ctx: Context,
	appointmentId: string,
): Promise<FormResponse[]> {
	const { data, error } = await ctx.db
		.from("customer_form_responses")
		.select("*")
		.eq("appointment_id", appointmentId)
		.order("created_at", { ascending: false });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function getFormResponse(
	ctx: Context,
	id: string,
): Promise<FormResponse> {
	const { data, error } = await ctx.db
		.from("customer_form_responses")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Form response ${id} not found`);
	return data;
}

export async function createFormResponse(
	ctx: Context,
	input: unknown,
): Promise<FormResponse> {
	const parsed: FormResponseInput = formResponseInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("customer_form_responses")
		.insert({
			customer_id: parsed.customer_id,
			appointment_id: parsed.appointment_id ?? null,
			form_template_id: parsed.form_template_id ?? null,
			form_name: parsed.form_name,
			signed_by_name: parsed.signed_by_name ?? null,
			signed_at: parsed.signed_by_name ? new Date().toISOString() : null,
			sections: parsed.sections as unknown as import("@/lib/supabase/types").Json,
		})
		.select("*")
		.single();
	if (error) throw new ValidationError(error.message);
	return data;
}

export async function deleteFormResponse(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db
		.from("customer_form_responses")
		.delete()
		.eq("id", id);
	if (error) throw new ValidationError(error.message);
}

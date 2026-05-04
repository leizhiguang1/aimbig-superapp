import type { Context } from "@/lib/context/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
	type CancelManualTransactionInput,
	cancelManualTransactionInputSchema,
	type CreateManualTransactionInput,
	createManualTransactionInputSchema,
} from "@/lib/schemas/manual-transactions";
import { assertBrandId } from "@/lib/supabase/query";
import type { Tables } from "@/lib/supabase/types";

export type ManualTransaction = Tables<"manual_transactions">;
export type ManualTransactionItem = Tables<"manual_transaction_items">;

export type ManualTransactionWithRelations = ManualTransaction & {
	customer: {
		id: string;
		code: string;
		first_name: string;
		last_name: string | null;
		profile_image_path: string | null;
	} | null;
	outlet: { id: string; code: string; name: string } | null;
	created_by_employee: {
		id: string;
		first_name: string;
		last_name: string;
	} | null;
	cancelled_by_employee: {
		id: string;
		first_name: string;
		last_name: string;
	} | null;
	items: ManualTransactionItem[];
};

const MT_SELECT = `
  *,
  customer:customers!manual_transactions_customer_id_fkey(id, code, first_name, last_name, profile_image_path),
  outlet:outlets!manual_transactions_outlet_id_fkey(id, code, name),
  created_by_employee:employees!manual_transactions_created_by_fkey(id, first_name, last_name),
  cancelled_by_employee:employees!manual_transactions_cancelled_by_fkey(id, first_name, last_name),
  items:manual_transaction_items(*)
`.trim();

export async function listManualTransactions(
	ctx: Context,
	opts: {
		outletId?: string | null;
		customerId?: string | null;
		limit?: number;
	} = {},
): Promise<ManualTransactionWithRelations[]> {
	const brandId = assertBrandId(ctx);
	let query = ctx.db
		.from("manual_transactions")
		.select(
			`${MT_SELECT}, _brand_outlet:outlets!manual_transactions_outlet_id_fkey!inner(brand_id)`,
		)
		.eq("_brand_outlet.brand_id", brandId)
		.order("created_at", { ascending: false })
		.limit(opts.limit ?? 200);
	if (opts.outletId) query = query.eq("outlet_id", opts.outletId);
	if (opts.customerId) query = query.eq("customer_id", opts.customerId);
	const { data, error } = await query;
	if (error) throw new ValidationError(error.message);
	return (data ?? []) as unknown as ManualTransactionWithRelations[];
}

export async function getManualTransaction(
	ctx: Context,
	id: string,
): Promise<ManualTransactionWithRelations> {
	const brandId = assertBrandId(ctx);
	const { data, error } = await ctx.db
		.from("manual_transactions")
		.select(
			`${MT_SELECT}, _brand_outlet:outlets!manual_transactions_outlet_id_fkey!inner(brand_id)`,
		)
		.eq("id", id)
		.eq("_brand_outlet.brand_id", brandId)
		.single();
	if (error || !data) throw new NotFoundError("Manual transaction not found");
	return data as unknown as ManualTransactionWithRelations;
}

export type CreateManualTransactionResult = { id: string; code: string };

export async function createManualTransaction(
	ctx: Context,
	input: unknown,
): Promise<CreateManualTransactionResult> {
	const parsed: CreateManualTransactionInput =
		createManualTransactionInputSchema.parse(input);
	const employeeId = ctx.currentUser?.employeeId;
	if (!employeeId) throw new ValidationError("Employee context required");

	const { data, error } = await ctx.db.rpc("create_manual_transaction", {
		p_outlet_id: parsed.outlet_id,
		p_customer_id: parsed.customer_id,
		p_created_by: employeeId,
		p_remarks: (parsed.remarks ?? "") as string,
		p_items: parsed.items.map((item) => ({
			item_type: item.item_type,
			service_id: item.service_id ?? null,
			inventory_item_id: item.inventory_item_id ?? null,
			item_name: item.item_name,
			item_code: item.item_code ?? null,
			unit_price: item.unit_price,
			quantity: item.quantity,
		})),
	});
	if (error) throw new ValidationError(error.message);
	const result = data as { id: string; code: string };
	return result;
}

export async function cancelManualTransaction(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<void> {
	const parsed: CancelManualTransactionInput =
		cancelManualTransactionInputSchema.parse(input);
	const employeeId = ctx.currentUser?.employeeId;
	if (!employeeId) throw new ValidationError("Employee context required");

	const { error } = await ctx.db.rpc("cancel_manual_transaction", {
		p_mt_id: id,
		p_cancelled_by: employeeId,
		p_reason: parsed.reason,
	});
	if (error) {
		if (error.message.includes("mt_not_found_or_already_cancelled")) {
			throw new NotFoundError(
				"Manual transaction not found or already cancelled",
			);
		}
		throw new ValidationError(error.message);
	}
}

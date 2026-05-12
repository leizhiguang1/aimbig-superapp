import type { Context } from "@/lib/context/types";
import { ValidationError } from "@/lib/errors";
import { assertOutletInBrand } from "@/lib/supabase/brand-ownership";
import { assertBrandId } from "@/lib/supabase/query";

export type SalesSummary = {
	totalSales: number;
	totalPayments: number;
	orderCount: number;
	paymentCount: number;
};

export async function getSalesSummary(
	ctx: Context,
	opts: { outletId?: string | null; from?: string; to?: string } = {},
): Promise<SalesSummary> {
	const brandId = assertBrandId(ctx);
	if (opts.outletId) await assertOutletInBrand(ctx, opts.outletId);
	const today = new Date().toISOString().slice(0, 10);
	const from = opts.from ?? today;
	const to = opts.to ?? today;

	let soQuery = ctx.db
		.from("sales_orders")
		.select(
			"total, _brand_outlet:outlets!sales_orders_outlet_id_fkey!inner(brand_id)",
			{ count: "exact" },
		)
		.eq("_brand_outlet.brand_id", brandId)
		.gte("sold_at", `${from}T00:00:00`)
		.lte("sold_at", `${to}T23:59:59`)
		.neq("status", "void");
	if (opts.outletId) soQuery = soQuery.eq("outlet_id", opts.outletId);
	const { data: soData, count: soCount, error: soErr } = await soQuery;
	if (soErr) throw new ValidationError(soErr.message);

	const totalSales = (soData ?? []).reduce(
		(sum, r) => sum + Number(r.total),
		0,
	);

	let payQuery = ctx.db
		.from("payments")
		.select(
			"amount, _brand_outlet:outlets!payments_outlet_id_fkey!inner(brand_id)",
			{ count: "exact" },
		)
		.eq("_brand_outlet.brand_id", brandId)
		.gte("paid_at", `${from}T00:00:00`)
		.lte("paid_at", `${to}T23:59:59`);
	if (opts.outletId) payQuery = payQuery.eq("outlet_id", opts.outletId);
	const { data: payData, count: payCount, error: payErr } = await payQuery;
	if (payErr) throw new ValidationError(payErr.message);

	const totalPayments = (payData ?? []).reduce(
		(sum, r) => sum + Number(r.amount),
		0,
	);

	return {
		totalSales,
		totalPayments,
		orderCount: soCount ?? 0,
		paymentCount: payCount ?? 0,
	};
}

export type SaleItemTypeBreakdown = {
	item_type: string;
	total: number;
	count: number;
};

export async function getSaleItemBreakdownByType(
	ctx: Context,
	opts: { outletId?: string | null; from?: string; to?: string } = {},
): Promise<SaleItemTypeBreakdown[]> {
	const brandId = assertBrandId(ctx);
	if (opts.outletId) await assertOutletInBrand(ctx, opts.outletId);
	const today = new Date().toISOString().slice(0, 10);
	const from = opts.from ?? today;
	const to = opts.to ?? today;

	let q = ctx.db
		.from("sale_items")
		.select(
			`item_type, unit_price, quantity, discount, total,
			 _so:sales_orders!sale_items_sales_order_id_fkey!inner(
				 sold_at, status, outlet_id,
				 _brand_outlet:outlets!sales_orders_outlet_id_fkey!inner(brand_id)
			 )`,
		)
		.eq("_so._brand_outlet.brand_id", brandId)
		.gte("_so.sold_at", `${from}T00:00:00`)
		.lte("_so.sold_at", `${to}T23:59:59`)
		.neq("_so.status", "void");
	if (opts.outletId) q = q.eq("_so.outlet_id", opts.outletId);

	const { data, error } = await q;
	if (error) throw new ValidationError(error.message);

	const buckets = new Map<string, SaleItemTypeBreakdown>();
	for (const row of data ?? []) {
		const r = row as unknown as {
			item_type: string;
			unit_price: number | null;
			quantity: number | null;
			discount: number | null;
			total: number | null;
		};
		const lineTotal =
			r.total != null
				? Number(r.total)
				: Number(r.unit_price ?? 0) * Number(r.quantity ?? 0) -
					Number(r.discount ?? 0);
		const key = r.item_type ?? "other";
		const cur = buckets.get(key) ?? { item_type: key, total: 0, count: 0 };
		cur.total += lineTotal;
		cur.count += 1;
		buckets.set(key, cur);
	}
	return [...buckets.values()].sort((a, b) => b.total - a.total);
}

export type CashSummary = {
	cashMovement: number;
	paymentCollected: number;
	outstanding: number;
};

export async function getCashSummary(
	ctx: Context,
	opts: { outletId?: string | null; from?: string; to?: string } = {},
): Promise<CashSummary> {
	const brandId = assertBrandId(ctx);
	if (opts.outletId) await assertOutletInBrand(ctx, opts.outletId);
	const today = new Date().toISOString().slice(0, 10);
	const from = opts.from ?? today;
	const to = opts.to ?? today;

	let payQuery = ctx.db
		.from("payments")
		.select(
			"amount, payment_mode, _brand_outlet:outlets!payments_outlet_id_fkey!inner(brand_id)",
		)
		.eq("_brand_outlet.brand_id", brandId)
		.gte("paid_at", `${from}T00:00:00`)
		.lte("paid_at", `${to}T23:59:59`);
	if (opts.outletId) payQuery = payQuery.eq("outlet_id", opts.outletId);
	const { data: payRows, error: payErr } = await payQuery;
	if (payErr) throw new ValidationError(payErr.message);

	let paymentCollected = 0;
	let cashMovement = 0;
	for (const r of payRows ?? []) {
		const amt = Number((r as { amount: number }).amount);
		paymentCollected += amt;
		if ((r as { payment_mode: string }).payment_mode === "CASH") {
			cashMovement += amt;
		}
	}

	let soQuery = ctx.db
		.from("sales_orders")
		.select(
			"outstanding, _brand_outlet:outlets!sales_orders_outlet_id_fkey!inner(brand_id)",
		)
		.eq("_brand_outlet.brand_id", brandId)
		.gte("sold_at", `${from}T00:00:00`)
		.lte("sold_at", `${to}T23:59:59`)
		.neq("status", "void");
	if (opts.outletId) soQuery = soQuery.eq("outlet_id", opts.outletId);
	const { data: soRows, error: soErr } = await soQuery;
	if (soErr) throw new ValidationError(soErr.message);

	const outstanding = (soRows ?? []).reduce(
		(s, r) =>
			s + Number((r as { outstanding: number | null }).outstanding ?? 0),
		0,
	);

	return { cashMovement, paymentCollected, outstanding };
}

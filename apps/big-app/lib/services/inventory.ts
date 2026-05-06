import type { Context } from "@/lib/context/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import {
	brandInputSchema,
	categoryInputSchema,
	consumableCreateSchema,
	consumableUpdateSchema,
	type InventoryItemCreateInput,
	type InventoryItemOutletRow,
	medicationCreateSchema,
	medicationUpdateSchema,
	productCreateSchema,
	productUpdateSchema,
	STOCK_ADJUSTMENT_LEDGER_REASON,
	STOCK_ADJUSTMENT_REASON_LABELS,
	stockAdjustmentInputSchema,
	supplierInputSchema,
	uomInputSchema,
} from "@/lib/schemas/inventory";
import {
	listTaxIdsForInventoryItem,
	setTaxesForInventoryItem,
} from "@/lib/services/taxes";
import { assertBrandId } from "@/lib/supabase/query";
import type { Tables } from "@/lib/supabase/types";

export type InventoryItem = Tables<"inventory_items">;
export type InventoryUom = Tables<"inventory_uoms">;
export type InventoryBrand = Tables<"inventory_brands">;
export type InventoryCategory = Tables<"inventory_categories">;
export type Supplier = Tables<"suppliers">;
export type InventoryMovement = Tables<"inventory_movements">;
export type InventoryItemOutlet = Tables<"inventory_item_outlets">;

export type InventoryMovementWithRefs = InventoryMovement & {
	created_by_employee: { id: string; first_name: string; last_name: string | null } | null;
};

export type LowStockItem = {
	id: string;
	sku: string;
	name: string;
	kind: string;
	stock: number;
	stock_alert_count: number;
	stock_status: string;
	stock_uom: { id: string; name: string } | null;
};

export type InventoryItemWithRefs = InventoryItem & {
	brand: { id: string; name: string } | null;
	category: { id: string; name: string } | null;
	supplier: { id: string; name: string } | null;
	purchasing_uom: { id: string; name: string } | null;
	stock_uom: { id: string; name: string } | null;
	use_uom: { id: string; name: string } | null;
	tax_ids: string[];
	outlets: InventoryItemOutlet[];
	// When the query was scoped to a specific outlet, these are populated
	// from that outlet's row in `inventory_item_outlets`. Reads not scoped
	// to one outlet leave them at the legacy global values.
	stock: number;
	in_transit: number;
	locked: number;
	stock_alert_count: number;
	stock_status: string;
	cost_price: number;
	selling_price: number;
	location: string | null;
	is_sellable: boolean;
};

const SELECT_WITH_REFS = `
	*,
	brand:inventory_brands!inventory_items_manufacturer_brand_id_fkey(id, name),
	category:inventory_categories!inventory_items_category_id_fkey(id, name),
	supplier:suppliers!inventory_items_supplier_id_fkey(id, name),
	purchasing_uom:inventory_uoms!inventory_items_purchasing_uom_id_fkey(id, name),
	stock_uom:inventory_uoms!inventory_items_stock_uom_id_fkey(id, name),
	use_uom:inventory_uoms!inventory_items_use_uom_id_fkey(id, name),
	inventory_item_taxes(tax_id),
	outlets:inventory_item_outlets(*)
` as const;

// Collapses the per-outlet row for `outletId` (if any) onto the row's
// stock-shaped fields so the items table / forms can read them directly.
function shapeForOutlet(
	row: unknown,
	outletId: string | null,
): InventoryItemWithRefs {
	const r = row as InventoryItem & {
		brand: { id: string; name: string } | null;
		category: { id: string; name: string } | null;
		supplier: { id: string; name: string } | null;
		purchasing_uom: { id: string; name: string } | null;
		stock_uom: { id: string; name: string } | null;
		use_uom: { id: string; name: string } | null;
		inventory_item_taxes: { tax_id: string }[] | null;
		outlets: InventoryItemOutlet[] | null;
	};
	const { inventory_item_taxes, outlets: rawOutlets, ...rest } = r;
	const outlets = rawOutlets ?? [];
	const active = outletId ? outlets.find((o) => o.outlet_id === outletId) : null;
	const stock = active ? Number(active.stock) : Number(rest.stock);
	const alert = active
		? Number(active.stock_alert_count)
		: Number(rest.stock_alert_count);
	const status =
		active?.stock_status ?? rest.stock_status ?? "normal";
	return {
		...rest,
		brand: r.brand,
		category: r.category,
		supplier: r.supplier,
		purchasing_uom: r.purchasing_uom,
		stock_uom: r.stock_uom,
		use_uom: r.use_uom,
		tax_ids: (inventory_item_taxes ?? []).map((t) => t.tax_id),
		outlets,
		stock,
		in_transit: active ? Number(active.in_transit) : Number(rest.in_transit),
		locked: active ? Number(active.locked) : Number(rest.locked),
		stock_alert_count: alert,
		stock_status: status,
		cost_price: active ? Number(active.cost_price) : Number(rest.cost_price),
		selling_price: active
			? Number(active.selling_price)
			: Number(rest.selling_price),
		location: active ? (active.location ?? null) : (rest.location ?? null),
		is_sellable: active ? active.is_sellable : rest.is_sellable,
	} as InventoryItemWithRefs;
}

// ---------- Items ----------

export async function listInventoryItems(
	ctx: Context,
	outletId: string | null = null,
): Promise<InventoryItemWithRefs[]> {
	const { data, error } = await ctx.db
		.from("inventory_items")
		.select(SELECT_WITH_REFS)
		.eq("brand_id", assertBrandId(ctx))
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return (data ?? []).map((row) => shapeForOutlet(row, outletId));
}

// Sellable products only — used by the appointment billing item picker.
// Filters: kind='product', is_active=true. The is_sellable flag is now
// per-outlet, so when an outletId is provided we filter on the outlet row.
export async function listSellableProducts(
	ctx: Context,
	outletId: string | null = null,
): Promise<InventoryItemWithRefs[]> {
	const { data, error } = await ctx.db
		.from("inventory_items")
		.select(SELECT_WITH_REFS)
		.eq("brand_id", assertBrandId(ctx))
		.eq("kind", "product")
		.eq("is_active", true)
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	const shaped = (data ?? []).map((row) => shapeForOutlet(row, outletId));
	return shaped.filter((r) => r.is_sellable);
}

export async function getInventoryItem(
	ctx: Context,
	id: string,
	outletId: string | null = null,
): Promise<InventoryItemWithRefs> {
	const { data, error } = await ctx.db
		.from("inventory_items")
		.select(SELECT_WITH_REFS)
		.eq("id", id)
		.eq("brand_id", assertBrandId(ctx))
		.single();
	if (error || !data) throw new NotFoundError(`Inventory item ${id} not found`);
	return shapeForOutlet(data, outletId);
}

// Replaces every inventory_item_outlets row for this item with the given
// payload. Used by create/update — the form is the source of truth for
// per-outlet pricing & alert thresholds. Stock is intentionally NOT touched
// here: it's mutated by the Stock Adjustment dialog and the sale RPCs, never
// from the item edit form (which would be ambiguous and would bypass the
// movement ledger). On create, we DO accept the form's initial stock since
// no movement history exists yet.
async function persistOutletRows(
	ctx: Context,
	itemId: string,
	rows: InventoryItemOutletRow[],
	options: { allowStockOverwrite: boolean },
): Promise<void> {
	if (rows.length === 0) return;
	const cols: Array<keyof InventoryItemOutletRow> = options.allowStockOverwrite
		? [
				"cost_price",
				"selling_price",
				"stock",
				"in_transit",
				"locked",
				"stock_alert_count",
				"minimum_stock_level",
				"location",
				"is_sellable",
			]
		: [
				"cost_price",
				"selling_price",
				"stock_alert_count",
				"minimum_stock_level",
				"location",
				"is_sellable",
			];
	for (const row of rows) {
		const patch: Partial<InventoryItemOutlet> = {};
		for (const c of cols) {
			(patch as Record<string, unknown>)[c] = row[c];
		}
		const { error } = await ctx.db
			.from("inventory_item_outlets")
			.update(patch)
			.eq("item_id", itemId)
			.eq("outlet_id", row.outlet_id);
		if (error) throw new ValidationError(error.message);
	}
}

function buildItemRow(parsed: InventoryItemCreateInput) {
	const base = {
		sku: parsed.sku,
		name: parsed.name,
		kind: parsed.kind,
		barcode: parsed.barcode,
		is_sellable: parsed.is_sellable,
		is_active: parsed.is_active,
		manufacturer_brand_id: parsed.manufacturer_brand_id,
		category_id: parsed.category_id,
		supplier_id: parsed.supplier_id,
		purchasing_uom_id: parsed.purchasing_uom_id,
		stock_uom_id: parsed.stock_uom_id,
		purchasing_to_stock_factor: parsed.purchasing_to_stock_factor,
		cost_price: parsed.cost_price,
		selling_price: parsed.selling_price,
		stock: parsed.stock,
		in_transit: parsed.in_transit,
		locked: parsed.locked,
		stock_alert_count: parsed.stock_alert_count,
		discount_cap: parsed.discount_cap,
		location: parsed.location,
		external_code: parsed.external_code,
		image_path: parsed.image_path,
	};

	if (parsed.kind === "product") {
		return {
			...base,
			use_uom_id: null,
			stock_to_use_factor: null,
			is_controlled: null,
			needs_replenish_reminder: null,
			prescription_dosage: null,
			prescription_dosage_uom_id: null,
			prescription_frequency: null,
			prescription_duration: null,
			prescription_reason: null,
			prescription_notes: null,
			prescription_default_billing_qty: null,
		};
	}

	if (parsed.kind === "consumable") {
		return {
			...base,
			use_uom_id: parsed.use_uom_id,
			stock_to_use_factor: parsed.stock_to_use_factor,
			is_controlled: null,
			needs_replenish_reminder: null,
			prescription_dosage: null,
			prescription_dosage_uom_id: null,
			prescription_frequency: null,
			prescription_duration: null,
			prescription_reason: null,
			prescription_notes: null,
			prescription_default_billing_qty: null,
		};
	}

	return {
		...base,
		use_uom_id: parsed.use_uom_id,
		stock_to_use_factor: parsed.stock_to_use_factor,
		is_controlled: parsed.is_controlled,
		needs_replenish_reminder: parsed.needs_replenish_reminder,
		prescription_dosage: parsed.prescription_dosage,
		prescription_dosage_uom_id: parsed.prescription_dosage_uom_id,
		prescription_frequency: parsed.prescription_frequency,
		prescription_duration: parsed.prescription_duration,
		prescription_reason: parsed.prescription_reason,
		prescription_notes: parsed.prescription_notes,
		prescription_default_billing_qty: parsed.prescription_default_billing_qty,
	};
}

export async function createInventoryItem(
	ctx: Context,
	input: unknown,
): Promise<InventoryItem> {
	const parsed = parseCreate(input);
	const { data, error } = await ctx.db
		.from("inventory_items")
		.insert({ ...buildItemRow(parsed), brand_id: assertBrandId(ctx) })
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("An inventory item with that SKU already exists");
		throw new ValidationError(error.message);
	}
	// Trigger seeds inventory_item_outlets with the global template values.
	// If the form supplied per-outlet overrides, apply them now (initial
	// stock allowed because no movement history exists yet).
	if (parsed.outlets.length > 0) {
		await persistOutletRows(ctx, data.id, parsed.outlets, {
			allowStockOverwrite: true,
		});
	}
	await setTaxesForInventoryItem(ctx, data.id, parsed.tax_ids);
	return data;
}

export async function updateInventoryItem(
	ctx: Context,
	id: string,
	kind: "product" | "consumable" | "medication",
	input: unknown,
): Promise<InventoryItem> {
	await assertNotCashWallet(ctx, id);
	const parsed = parseUpdate(kind, input);
	// Re-construct a full create input shape so buildItemRow handles per-kind nulls
	const row = buildItemRow({
		...parsed,
		sku: "__placeholder__",
		kind,
	} as InventoryItemCreateInput);
	const { sku: _omit, ...updateRow } = row;
	const brandId = assertBrandId(ctx);

	const { data, error } = await ctx.db
		.from("inventory_items")
		.update(updateRow)
		.eq("id", id)
		.eq("brand_id", brandId)
		.select("*")
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Inventory item ${id} not found`);

	// Per-outlet pricing/alert/location/sellable overrides — stock is left
	// alone because the form's stock field becomes ambiguous once stock is
	// per-outlet. Use the Stock Adjustment dialog to mutate stock with a
	// reason; that path emits a proper movement row.
	if (parsed.outlets.length > 0) {
		await persistOutletRows(ctx, id, parsed.outlets, {
			allowStockOverwrite: false,
		});
	}

	await setTaxesForInventoryItem(ctx, id, parsed.tax_ids);
	return data;
}

export async function deleteInventoryItem(
	ctx: Context,
	id: string,
): Promise<void> {
	await assertNotCashWallet(ctx, id);
	const { error } = await ctx.db
		.from("inventory_items")
		.delete()
		.eq("id", id)
		.eq("brand_id", assertBrandId(ctx));
	if (error) {
		if (error.code === "23503")
			throw new ConflictError(
				"This item is referenced by existing records. Mark it inactive from the edit form instead.",
			);
		throw new ValidationError(error.message);
	}
}

// Block edits/deletes of the built-in Cash Wallet product. Seeded per brand
// by the wallet_fifo_pivot migration with sku='CASH_WALLET'.
async function assertNotCashWallet(ctx: Context, id: string): Promise<void> {
	const { data, error } = await ctx.db
		.from("inventory_items")
		.select("sku")
		.eq("id", id)
		.eq("brand_id", assertBrandId(ctx))
		.maybeSingle();
	if (error) throw new ValidationError(error.message);
	if (data?.sku === "CASH_WALLET") {
		throw new ConflictError(
			"Cash Wallet is a built-in product and cannot be modified or deleted.",
		);
	}
}

function parseCreate(input: unknown): InventoryItemCreateInput {
	if (typeof input !== "object" || input === null || !("kind" in input)) {
		throw new ValidationError("Inventory item kind is required");
	}
	const kind = (input as { kind: string }).kind;
	if (kind === "product") return productCreateSchema.parse(input);
	if (kind === "consumable") return consumableCreateSchema.parse(input);
	if (kind === "medication") return medicationCreateSchema.parse(input);
	throw new ValidationError(`Unknown inventory item kind: ${kind}`);
}

function parseUpdate(
	kind: "product" | "consumable" | "medication",
	input: unknown,
) {
	if (kind === "product") return productUpdateSchema.parse(input);
	if (kind === "consumable") return consumableUpdateSchema.parse(input);
	return medicationUpdateSchema.parse(input);
}

// ---------- UoMs ----------

export async function listUoms(ctx: Context): Promise<InventoryUom[]> {
	const { data, error } = await ctx.db
		.from("inventory_uoms")
		.select("*")
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function createUom(
	ctx: Context,
	input: unknown,
): Promise<InventoryUom> {
	const parsed = uomInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("inventory_uoms")
		.insert(parsed)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A UoM with that name already exists");
		throw new ValidationError(error.message);
	}
	return data;
}

export async function updateUom(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<InventoryUom> {
	const parsed = uomInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("inventory_uoms")
		.update(parsed)
		.eq("id", id)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A UoM with that name already exists");
		throw new ValidationError(error.message);
	}
	if (!data) throw new NotFoundError(`UoM ${id} not found`);
	return data;
}

export async function deleteUom(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db.from("inventory_uoms").delete().eq("id", id);
	if (error) {
		if (error.code === "23503")
			throw new ConflictError(
				"This UoM is used by inventory items and cannot be deleted.",
			);
		throw new ValidationError(error.message);
	}
}

// ---------- Brands ----------

export async function listBrands(ctx: Context): Promise<InventoryBrand[]> {
	const { data, error } = await ctx.db
		.from("inventory_brands")
		.select("*")
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function createBrand(
	ctx: Context,
	input: unknown,
): Promise<InventoryBrand> {
	const parsed = brandInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("inventory_brands")
		.insert(parsed)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A brand with that name already exists");
		throw new ValidationError(error.message);
	}
	return data;
}

export async function updateBrand(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<InventoryBrand> {
	const parsed = brandInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("inventory_brands")
		.update(parsed)
		.eq("id", id)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A brand with that name already exists");
		throw new ValidationError(error.message);
	}
	if (!data) throw new NotFoundError(`Brand ${id} not found`);
	return data;
}

export async function deleteBrand(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db.from("inventory_brands").delete().eq("id", id);
	if (error) {
		if (error.code === "23503")
			throw new ConflictError(
				"This brand is used by inventory items and cannot be deleted.",
			);
		throw new ValidationError(error.message);
	}
}

// ---------- Categories ----------

export async function listCategories(
	ctx: Context,
): Promise<InventoryCategory[]> {
	const { data, error } = await ctx.db
		.from("inventory_categories")
		.select("*")
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function createCategory(
	ctx: Context,
	input: unknown,
): Promise<InventoryCategory> {
	const parsed = categoryInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("inventory_categories")
		.insert(parsed)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A category with that name already exists");
		throw new ValidationError(error.message);
	}
	return data;
}

export async function updateCategory(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<InventoryCategory> {
	const parsed = categoryInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("inventory_categories")
		.update(parsed)
		.eq("id", id)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A category with that name already exists");
		throw new ValidationError(error.message);
	}
	if (!data) throw new NotFoundError(`Category ${id} not found`);
	return data;
}

export async function deleteCategory(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db
		.from("inventory_categories")
		.delete()
		.eq("id", id);
	if (error) {
		if (error.code === "23503")
			throw new ConflictError(
				"This category is used by inventory items and cannot be deleted.",
			);
		throw new ValidationError(error.message);
	}
}

// ---------- Suppliers ----------

export async function listSuppliers(ctx: Context): Promise<Supplier[]> {
	const { data, error } = await ctx.db
		.from("suppliers")
		.select("*")
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function createSupplier(
	ctx: Context,
	input: unknown,
): Promise<Supplier> {
	const parsed = supplierInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("suppliers")
		.insert(parsed)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A supplier with that name already exists");
		throw new ValidationError(error.message);
	}
	return data;
}

export async function updateSupplier(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<Supplier> {
	const parsed = supplierInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("suppliers")
		.update(parsed)
		.eq("id", id)
		.select("*")
		.single();
	if (error) {
		if (error.code === "23505")
			throw new ConflictError("A supplier with that name already exists");
		throw new ValidationError(error.message);
	}
	if (!data) throw new NotFoundError(`Supplier ${id} not found`);
	return data;
}

export async function deleteSupplier(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db.from("suppliers").delete().eq("id", id);
	if (error) {
		if (error.code === "23503")
			throw new ConflictError(
				"This supplier is used by inventory items and cannot be deleted.",
			);
		throw new ValidationError(error.message);
	}
}

// ---------- Stock adjustments ----------

// Manual stock adjustment from the Stock Details dialog. Mirrors the kumodent
// "Add new batch" flow but without batches (Phase 2). Targets a specific
// outlet's row in inventory_item_outlets; emits an `inventory_movements`
// row stamped with the same outlet_id so the per-item ledger filters cleanly.
export async function recordStockMovement(
	ctx: Context,
	itemId: string,
	outletId: string,
	input: unknown,
): Promise<InventoryItemOutlet> {
	await assertNotCashWallet(ctx, itemId);
	const parsed = stockAdjustmentInputSchema.parse(input);
	await assertOutletInBrand(ctx, outletId);

	const { data: prev, error: prevErr } = await ctx.db
		.from("inventory_item_outlets")
		.select("stock")
		.eq("item_id", itemId)
		.eq("outlet_id", outletId)
		.maybeSingle();
	if (prevErr) throw new ValidationError(prevErr.message);
	if (!prev) {
		throw new NotFoundError(
			`Item is not stocked at this outlet — open the item's per-outlet panel and seed it first.`,
		);
	}

	const signedDelta =
		parsed.direction === "in" ? parsed.quantity : -parsed.quantity;
	const newStock = Number(prev.stock) + signedDelta;
	if (newStock < 0) {
		throw new ValidationError(
			`Cannot remove ${parsed.quantity} — only ${Number(prev.stock)} on hand at this outlet.`,
		);
	}

	const ledgerReason = STOCK_ADJUSTMENT_LEDGER_REASON[parsed.reason];
	const reasonLabel = STOCK_ADJUSTMENT_REASON_LABELS[parsed.reason];
	const noteParts = [reasonLabel, parsed.notes].filter(Boolean) as string[];

	const { data, error } = await ctx.db
		.from("inventory_item_outlets")
		.update({ stock: newStock })
		.eq("item_id", itemId)
		.eq("outlet_id", outletId)
		.select("*")
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Outlet stock row not found`);

	const { error: mvErr } = await ctx.db.from("inventory_movements").insert({
		item_id: itemId,
		outlet_id: outletId,
		delta: signedDelta,
		reason: ledgerReason,
		ref_type: "manual",
		ref_id: null,
		notes: noteParts.join(" · "),
		created_by: ctx.currentUser?.employeeId ?? null,
	});
	if (mvErr) throw new ValidationError(mvErr.message);
	return data;
}

async function assertOutletInBrand(
	ctx: Context,
	outletId: string,
): Promise<void> {
	const { data, error } = await ctx.db
		.from("outlets")
		.select("id")
		.eq("id", outletId)
		.eq("brand_id", assertBrandId(ctx))
		.maybeSingle();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new ValidationError("Unknown outlet for this brand");
}

// ---------- Movements ----------

// Loaded on-demand by the StockDetails dialog. Brand scoping is enforced via
// the parent inventory_items row. When `outletId` is supplied the ledger is
// filtered to that outlet — matches the kumodent behaviour where each outlet
// has its own movement history.
export async function listMovementsForItem(
	ctx: Context,
	itemId: string,
	outletId: string | null = null,
): Promise<InventoryMovementWithRefs[]> {
	await getInventoryItem(ctx, itemId);
	let query = ctx.db
		.from("inventory_movements")
		.select(
			"*, created_by_employee:employees!inventory_movements_created_by_fkey(id, first_name, last_name)",
		)
		.eq("item_id", itemId);
	if (outletId) query = query.eq("outlet_id", outletId);
	const { data, error } = await query
		.order("created_at", { ascending: false })
		.limit(500);
	if (error) throw new ValidationError(error.message);
	return (data ?? []) as unknown as InventoryMovementWithRefs[];
}

// ---------- Dashboard ----------

// Per-outlet low-stock list. Reads inventory_item_outlets directly so the
// dashboard for an outlet only sees items low/out at THAT outlet — what
// staff actually need to restock locally. Cash Wallet is excluded.
export async function listLowStockItems(
	ctx: Context,
	outletId: string,
): Promise<LowStockItem[]> {
	await assertOutletInBrand(ctx, outletId);
	const { data, error } = await ctx.db
		.from("inventory_item_outlets")
		.select(
			"stock, stock_alert_count, stock_status, item:inventory_items!inventory_item_outlets_item_id_fkey!inner(id, sku, name, kind, is_active, brand_id, stock_uom:inventory_uoms!inventory_items_stock_uom_id_fkey(id, name))",
		)
		.eq("outlet_id", outletId)
		.in("stock_status", ["low", "out"]);
	if (error) throw new ValidationError(error.message);
	type Row = {
		stock: number;
		stock_alert_count: number;
		stock_status: string;
		item: {
			id: string;
			sku: string;
			name: string;
			kind: string;
			is_active: boolean;
			brand_id: string;
			stock_uom: { id: string; name: string } | null;
		};
	};
	const brandId = assertBrandId(ctx);
	return (data as unknown as Row[])
		.filter(
			(r) =>
				r.item.is_active &&
				r.item.brand_id === brandId &&
				r.item.sku !== "CASH_WALLET",
		)
		.map((r) => ({
			id: r.item.id,
			sku: r.item.sku,
			name: r.item.name,
			kind: r.item.kind,
			stock: Number(r.stock),
			stock_alert_count: Number(r.stock_alert_count),
			stock_status: r.stock_status,
			stock_uom: r.item.stock_uom,
		}))
		.sort((a, b) => {
			if (a.stock_status !== b.stock_status) {
				return a.stock_status === "out" ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});
}

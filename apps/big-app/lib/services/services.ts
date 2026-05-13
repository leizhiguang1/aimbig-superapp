import type { Context } from "@/lib/context/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
	type ServiceInventoryLinkInput,
	serviceCategoryInputSchema,
	serviceCreateSchema,
	serviceUpdateSchema,
} from "@/lib/schemas/services";
import { listTaxIdsForService, setTaxesForService } from "@/lib/services/taxes";
import { assertBrandId, throwDbError } from "@/lib/supabase/query";
import type { Tables } from "@/lib/supabase/types";

export type Service = Tables<"services">;
export type ServiceCategory = Tables<"service_categories">;

export type ServiceInventoryLink = {
	inventory_item_id: string;
	default_quantity: number;
	item: {
		id: string;
		sku: string;
		name: string;
		kind: "product" | "consumable" | "medication";
	} | null;
};

export type ServiceWithCategory = Service & {
	category: { id: string; name: string } | null;
	tax_ids: string[];
	inventory_links: ServiceInventoryLink[];
};

const LIST_SELECT =
	"*, category:service_categories(id, name), service_taxes(tax_id), service_inventory_items(inventory_item_id, default_quantity, item:inventory_items!service_inventory_items_inventory_item_id_fkey(id, sku, name, kind))";

type RawLinkRow = {
	inventory_item_id: string;
	default_quantity: number | string;
	item?: { id: string; sku: string; name: string; kind: string } | null;
};

function normalizeLinks(rows: RawLinkRow[] | null): ServiceInventoryLink[] {
	return (rows ?? []).map((r) => ({
		inventory_item_id: r.inventory_item_id,
		default_quantity: Number(r.default_quantity),
		item: r.item
			? {
					id: r.item.id,
					sku: r.item.sku,
					name: r.item.name,
					kind: r.item.kind as "product" | "consumable" | "medication",
				}
			: null,
	}));
}

export type PriceRangeCheckItem = {
	service_id: string | null;
	unit_price: number;
	item_name?: string;
};

// Server invariant: when a service has allow_cash_price_range = true, the
// unit_price on a line item must fall within [price_min, price_max]. The UI
// clamps on blur via MoneyInput; this is the matching server-side guard so a
// non-UI client cannot bypass it. Mirrors the discount-cap guard in sales.ts.
export async function assertUnitPriceInRange(
	ctx: Context,
	items: PriceRangeCheckItem[],
): Promise<void> {
	const serviceIds = Array.from(
		new Set(
			items.map((i) => i.service_id).filter((id): id is string => id != null),
		),
	);
	if (serviceIds.length === 0) return;
	const { data, error } = await ctx.db
		.from("services")
		.select("id, name, allow_cash_price_range, price_min, price_max")
		.eq("brand_id", assertBrandId(ctx))
		.in("id", serviceIds);
	if (error) throw new ValidationError(error.message);
	const map = new Map(
		(data ?? []).map((r) => [
			r.id,
			{
				name: r.name,
				allow: !!r.allow_cash_price_range,
				min: r.price_min == null ? null : Number(r.price_min),
				max: r.price_max == null ? null : Number(r.price_max),
			},
		]),
	);
	for (const item of items) {
		if (!item.service_id) continue;
		const svc = map.get(item.service_id);
		if (!svc || !svc.allow || svc.min == null || svc.max == null) continue;
		const price = Number(item.unit_price);
		if (price < svc.min - 0.005 || price > svc.max + 0.005) {
			const label = item.item_name ?? svc.name;
			throw new ValidationError(
				`"${label}" price RM ${price.toFixed(2)} is outside the allowed range RM ${svc.min.toFixed(2)} – RM ${svc.max.toFixed(2)}.`,
			);
		}
	}
}

export async function listServices(
	ctx: Context,
): Promise<ServiceWithCategory[]> {
	const { data, error } = await ctx.db
		.from("services")
		.select(LIST_SELECT)
		.eq("brand_id", assertBrandId(ctx))
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return (data ?? []).map((row) => {
		const r = row as typeof row & {
			service_taxes: { tax_id: string }[] | null;
			service_inventory_items:
				| { inventory_item_id: string; default_quantity: number | string }[]
				| null;
		};
		const { service_taxes, service_inventory_items, ...rest } = r;
		return {
			...rest,
			tax_ids: (service_taxes ?? []).map((t) => t.tax_id),
			inventory_links: normalizeLinks(service_inventory_items),
		} as ServiceWithCategory;
	});
}

export async function getService(
	ctx: Context,
	id: string,
): Promise<
	Service & { tax_ids: string[]; inventory_links: ServiceInventoryLink[] }
> {
	const { data, error } = await ctx.db
		.from("services")
		.select("*")
		.eq("id", id)
		.eq("brand_id", assertBrandId(ctx))
		.single();
	if (error || !data) throw new NotFoundError(`Service ${id} not found`);
	const tax_ids = await listTaxIdsForService(ctx, id);
	const inventory_links = await listInventoryLinksForService(ctx, id);
	return { ...data, tax_ids, inventory_links };
}

export async function listInventoryLinksForService(
	ctx: Context,
	serviceId: string,
): Promise<ServiceInventoryLink[]> {
	const { data, error } = await ctx.db
		.from("service_inventory_items")
		.select(
			"inventory_item_id, default_quantity, item:inventory_items!service_inventory_items_inventory_item_id_fkey(id, sku, name, kind)",
		)
		.eq("service_id", serviceId);
	if (error) throw new ValidationError(error.message);
	return normalizeLinks(data as RawLinkRow[] | null);
}

async function setInventoryLinksForService(
	ctx: Context,
	serviceId: string,
	links: ServiceInventoryLinkInput[],
): Promise<void> {
	const { error: delErr } = await ctx.db
		.from("service_inventory_items")
		.delete()
		.eq("service_id", serviceId);
	if (delErr) throw new ValidationError(delErr.message);
	if (links.length === 0) return;

	const rows = links.map((l) => ({
		service_id: serviceId,
		inventory_item_id: l.inventory_item_id,
		default_quantity: l.default_quantity,
	}));
	const { error: insErr } = await ctx.db
		.from("service_inventory_items")
		.insert(rows);
	if (insErr) throw new ValidationError(insErr.message);
}

export async function createService(
	ctx: Context,
	input: unknown,
): Promise<Service> {
	const parsed = serviceCreateSchema.parse(input);
	const { data, error } = await ctx.db
		.from("services")
		.insert({
			brand_id: assertBrandId(ctx),
			...(parsed.id ? { id: parsed.id } : {}),
			sku: parsed.sku,
			name: parsed.name,
			category_id: parsed.category_id,
			type: parsed.type,
			duration_min: parsed.duration_min,
			external_code: parsed.external_code,
			image_url: parsed.image_url,
			price: parsed.price,
			price_min: parsed.price_min,
			price_max: parsed.price_max,
			other_fees: parsed.other_fees,
			incentive_type: parsed.incentive_type,
			discount_cap: parsed.discount_cap,
			allow_redemption_without_payment: parsed.allow_redemption_without_payment,
			allow_cash_price_range: parsed.allow_cash_price_range,
			is_active: parsed.is_active,
		})
		.select("*")
		.single();
	if (error) {
		throwDbError(error, {
			uniqueMsg: "A service with that SKU already exists",
		});
	}
	await setTaxesForService(ctx, data.id, parsed.tax_ids);
	await setInventoryLinksForService(ctx, data.id, parsed.inventory_links);
	return data;
}

export async function updateService(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<Service> {
	const parsed = serviceUpdateSchema.parse(input);
	const brandId = assertBrandId(ctx);
	const { data, error } = await ctx.db
		.from("services")
		.update({
			name: parsed.name,
			category_id: parsed.category_id,
			type: parsed.type,
			duration_min: parsed.duration_min,
			external_code: parsed.external_code,
			image_url: parsed.image_url,
			price: parsed.price,
			price_min: parsed.price_min,
			price_max: parsed.price_max,
			other_fees: parsed.other_fees,
			incentive_type: parsed.incentive_type,
			discount_cap: parsed.discount_cap,
			allow_redemption_without_payment: parsed.allow_redemption_without_payment,
			allow_cash_price_range: parsed.allow_cash_price_range,
			is_active: parsed.is_active,
		})
		.eq("id", id)
		.eq("brand_id", brandId)
		.select("*")
		.single();
	if (error) throw new ValidationError(error.message);
	if (!data) throw new NotFoundError(`Service ${id} not found`);
	await setTaxesForService(ctx, id, parsed.tax_ids);
	await setInventoryLinksForService(ctx, id, parsed.inventory_links);
	return data;
}

export async function deleteService(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db
		.from("services")
		.delete()
		.eq("id", id)
		.eq("brand_id", assertBrandId(ctx));
	if (error) {
		throwDbError(error, {
			fkMsg:
				"This service is referenced by existing records (appointments, sales, etc.). Mark it inactive from the edit form instead.",
		});
	}
}

export async function listCategories(ctx: Context): Promise<ServiceCategory[]> {
	const { data, error } = await ctx.db
		.from("service_categories")
		.select("*")
		.order("sort_order", { ascending: true })
		.order("name", { ascending: true });
	if (error) throw new ValidationError(error.message);
	return data ?? [];
}

export async function createCategory(
	ctx: Context,
	input: unknown,
): Promise<ServiceCategory> {
	const parsed = serviceCategoryInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("service_categories")
		.insert({
			name: parsed.name,
			sort_order: parsed.sort_order,
			is_active: parsed.is_active,
		})
		.select("*")
		.single();
	if (error) {
		throwDbError(error, {
			uniqueMsg: "A category with that name already exists",
		});
	}
	return data;
}

export async function updateCategory(
	ctx: Context,
	id: string,
	input: unknown,
): Promise<ServiceCategory> {
	const parsed = serviceCategoryInputSchema.parse(input);
	const { data, error } = await ctx.db
		.from("service_categories")
		.update({
			name: parsed.name,
			sort_order: parsed.sort_order,
			is_active: parsed.is_active,
		})
		.eq("id", id)
		.select("*")
		.single();
	if (error) {
		throwDbError(error, {
			uniqueMsg: "A category with that name already exists",
		});
	}
	if (!data) throw new NotFoundError(`Category ${id} not found`);
	return data;
}

export async function deleteCategory(ctx: Context, id: string): Promise<void> {
	const { error } = await ctx.db
		.from("service_categories")
		.delete()
		.eq("id", id);
	if (error) {
		throwDbError(error, {
			fkMsg:
				"This category is still used by one or more services. Reassign them first.",
		});
	}
}

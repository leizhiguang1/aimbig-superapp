"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as inventoryService from "@/lib/services/inventory";

// ---------- Items ----------

export type RecordStockMovementResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.recordStockMovement>>;

export async function recordStockMovementAction(
	itemId: string,
	outletId: string,
	input: unknown,
): Promise<RecordStockMovementResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.adjust_stock");
		const item = await inventoryService.recordStockMovement(
			ctx,
			itemId,
			outletId,
			input,
		);
		revalidatePath("/o/[outlet]/inventory", "page");
		revalidatePath("/o/[outlet]/dashboard", "page");
		return item;
	} catch (err) {
		return toErr("[recordStockMovementAction]", err);
	}
}

export type ItemMovementsActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.listMovementsForItem>>;

export async function listItemMovementsAction(
	itemId: string,
	outletId: string | null = null,
): Promise<ItemMovementsActionResult> {
	try {
		const ctx = await getServerContext();
		return await inventoryService.listMovementsForItem(ctx, itemId, outletId);
	} catch (err) {
		return toErr("[listItemMovementsAction]", err);
	}
}

export type InventoryItemActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.createInventoryItem>>;

export async function createInventoryItemAction(
	input: unknown,
): Promise<InventoryItemActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const item = await inventoryService.createInventoryItem(ctx, input);
		revalidatePath("/o/[outlet]/inventory", "page");
		return item;
	} catch (err) {
		return toErr("[createInventoryItemAction]", err);
	}
}

export async function updateInventoryItemAction(
	id: string,
	kind: "product" | "consumable" | "medication",
	input: unknown,
): Promise<InventoryItemActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const item = await inventoryService.updateInventoryItem(ctx, id, kind, input);
		revalidatePath("/o/[outlet]/inventory", "page");
		return item;
	} catch (err) {
		return toErr("[updateInventoryItemAction]", err);
	}
}

export async function deleteInventoryItemAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		await inventoryService.deleteInventoryItem(ctx, id);
		revalidatePath("/o/[outlet]/inventory", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteInventoryItemAction]", err);
	}
}

// ---------- UoMs ----------

export type UomActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.createUom>>;

export async function createUomAction(input: unknown): Promise<UomActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.createUom(ctx, input);
		revalidatePath("/o/[outlet]/inventory/uom", "page");
		return row;
	} catch (err) {
		return toErr("[createUomAction]", err);
	}
}

export async function updateUomAction(
	id: string,
	input: unknown,
): Promise<UomActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.updateUom(ctx, id, input);
		revalidatePath("/o/[outlet]/inventory/uom", "page");
		return row;
	} catch (err) {
		return toErr("[updateUomAction]", err);
	}
}

export async function deleteUomAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		await inventoryService.deleteUom(ctx, id);
		revalidatePath("/o/[outlet]/inventory/uom", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteUomAction]", err);
	}
}

// ---------- Brands ----------

export type InventoryBrandActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.createBrand>>;

export async function createBrandAction(
	input: unknown,
): Promise<InventoryBrandActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.createBrand(ctx, input);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return row;
	} catch (err) {
		return toErr("[createBrandAction]", err);
	}
}

export async function updateBrandAction(
	id: string,
	input: unknown,
): Promise<InventoryBrandActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.updateBrand(ctx, id, input);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return row;
	} catch (err) {
		return toErr("[updateBrandAction]", err);
	}
}

export async function deleteBrandAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		await inventoryService.deleteBrand(ctx, id);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteBrandAction]", err);
	}
}

// ---------- Categories ----------

export type InventoryCategoryActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.createCategory>>;

export async function createCategoryAction(
	input: unknown,
): Promise<InventoryCategoryActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.createCategory(ctx, input);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return row;
	} catch (err) {
		return toErr("[createCategoryAction]", err);
	}
}

export async function updateCategoryAction(
	id: string,
	input: unknown,
): Promise<InventoryCategoryActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.updateCategory(ctx, id, input);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return row;
	} catch (err) {
		return toErr("[updateCategoryAction]", err);
	}
}

export async function deleteCategoryAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		await inventoryService.deleteCategory(ctx, id);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCategoryAction]", err);
	}
}

// ---------- Suppliers ----------

export type SupplierActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof inventoryService.createSupplier>>;

export async function createSupplierAction(
	input: unknown,
): Promise<SupplierActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.createSupplier(ctx, input);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return row;
	} catch (err) {
		return toErr("[createSupplierAction]", err);
	}
}

export async function updateSupplierAction(
	id: string,
	input: unknown,
): Promise<SupplierActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		const row = await inventoryService.updateSupplier(ctx, id, input);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return row;
	} catch (err) {
		return toErr("[updateSupplierAction]", err);
	}
}

export async function deleteSupplierAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "inventory.inventory_edit");
		await inventoryService.deleteSupplier(ctx, id);
		revalidatePath("/o/[outlet]/inventory/options", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteSupplierAction]", err);
	}
}

"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as servicesService from "@/lib/services/services";

export type ServiceActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof servicesService.createService>>;

export async function createServiceAction(
	input: unknown,
): Promise<ServiceActionResult> {
	try {
		const ctx = await getServerContext();
		const service = await servicesService.createService(ctx, input);
		revalidatePath("/o/[outlet]/services", "page");
		return service;
	} catch (err) {
		return toErr("[createServiceAction]", err);
	}
}

export async function updateServiceAction(
	id: string,
	input: unknown,
): Promise<ServiceActionResult> {
	try {
		const ctx = await getServerContext();
		const service = await servicesService.updateService(ctx, id, input);
		revalidatePath("/o/[outlet]/services", "page");
		return service;
	} catch (err) {
		return toErr("[updateServiceAction]", err);
	}
}

export async function deleteServiceAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await servicesService.deleteService(ctx, id);
		revalidatePath("/o/[outlet]/services", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteServiceAction]", err);
	}
}

export type ServiceCategoryActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof servicesService.createCategory>>;

export async function createCategoryAction(
	input: unknown,
): Promise<ServiceCategoryActionResult> {
	try {
		const ctx = await getServerContext();
		const category = await servicesService.createCategory(ctx, input);
		revalidatePath("/o/[outlet]/services", "page");
		return category;
	} catch (err) {
		return toErr("[createCategoryAction]", err);
	}
}

export async function updateCategoryAction(
	id: string,
	input: unknown,
): Promise<ServiceCategoryActionResult> {
	try {
		const ctx = await getServerContext();
		const category = await servicesService.updateCategory(ctx, id, input);
		revalidatePath("/o/[outlet]/services", "page");
		return category;
	} catch (err) {
		return toErr("[updateCategoryAction]", err);
	}
}

export async function deleteCategoryAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await servicesService.deleteCategory(ctx, id);
		revalidatePath("/o/[outlet]/services", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCategoryAction]", err);
	}
}

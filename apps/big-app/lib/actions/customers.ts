"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as customersService from "@/lib/services/customers";
import type { Customer } from "@/lib/services/customers";

export type CustomerActionResult = { error: string } | Customer;

export async function createCustomerAction(input: unknown): Promise<CustomerActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "customers.customers");
		const customer = await customersService.createCustomer(ctx, input);
		revalidatePath("/o/[outlet]/customers", "page");
		return customer;
	} catch (err) {
		return toErr("[createCustomerAction]", err);
	}
}

export async function updateCustomerAction(
	id: string,
	input: unknown,
): Promise<CustomerActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "customers.update");
		const customer = await customersService.updateCustomer(ctx, id, input);
		revalidatePath("/o/[outlet]/customers", "page");
		return customer;
	} catch (err) {
		return toErr("[updateCustomerAction]", err);
	}
}

export async function deleteCustomerAction(id: string): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "customers.update");
		await customersService.deleteCustomer(ctx, id);
		revalidatePath("/o/[outlet]/customers", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCustomerAction]", err);
	}
}

"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import type { Context } from "@/lib/context/types";
import { getServerContext } from "@/lib/context/server";
import { UnauthorizedError } from "@/lib/errors";
import * as customersService from "@/lib/services/customers";
import type { Customer } from "@/lib/services/customers";

async function assertCustomerTiedToActor(
	ctx: Context,
	customerId: string,
): Promise<void> {
	const canAll = await hasPermission(ctx, "customers.customer_transparency");
	if (canAll) return;
	const customer = await customersService.getCustomer(ctx, customerId);
	if (customer.consultant_id !== ctx.currentUser?.employeeId) {
		throw new UnauthorizedError(
			"You can only manage customers tied to you.",
		);
	}
}

export type CustomerActionResult = { error: string } | Customer;

export async function createCustomerAction(input: unknown): Promise<CustomerActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "customers.customers");
		const canAll = await hasPermission(ctx, "customers.customer_transparency");
		if (
			!canAll &&
			input &&
			typeof input === "object" &&
			"consultant_id" in input
		) {
			const consultantId = (input as { consultant_id?: string | null })
				.consultant_id;
			if (consultantId && consultantId !== ctx.currentUser?.employeeId) {
				throw new UnauthorizedError(
					"You can only create customers tied to yourself.",
				);
			}
		}
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
		await assertCustomerTiedToActor(ctx, id);
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
		await assertCustomerTiedToActor(ctx, id);
		await customersService.deleteCustomer(ctx, id);
		revalidatePath("/o/[outlet]/customers", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCustomerAction]", err);
	}
}

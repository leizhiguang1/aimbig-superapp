"use server";

import { revalidatePath } from "next/cache";
import { getServerContext } from "@/lib/context/server";
import { listCustomers } from "@/lib/services/customers";
import * as mtService from "@/lib/services/manual-transactions";
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import { listServices } from "@/lib/services/services";
import { listOutlets } from "@/lib/services/outlets";

export async function listManualTransactionsAction(opts?: {
	outletId?: string | null;
	customerId?: string | null;
}): Promise<ManualTransactionWithRelations[]> {
	const ctx = await getServerContext();
	return mtService.listManualTransactions(ctx, opts);
}

export async function getManualTransactionAction(
	id: string,
): Promise<ManualTransactionWithRelations> {
	const ctx = await getServerContext();
	return mtService.getManualTransaction(ctx, id);
}

export async function getNewManualTransactionDataAction() {
	const ctx = await getServerContext();
	const [customers, outlets, services] = await Promise.all([
		listCustomers(ctx),
		listOutlets(ctx),
		listServices(ctx),
	]);
	return { customers, outlets, services };
}

export async function createManualTransactionAction(input: unknown) {
	const ctx = await getServerContext();
	const result = await mtService.createManualTransaction(ctx, input);
	revalidatePath("/o/[outlet]/sales", "page");
	revalidatePath("/o/[outlet]/customers/[id]", "page");
	return result;
}

export async function cancelManualTransactionAction(
	id: string,
	input: unknown,
) {
	const ctx = await getServerContext();
	await mtService.cancelManualTransaction(ctx, id, input);
	revalidatePath("/o/[outlet]/sales", "page");
	revalidatePath("/o/[outlet]/customers/[id]", "page");
}

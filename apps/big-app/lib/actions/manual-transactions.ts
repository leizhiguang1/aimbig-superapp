"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import { listCustomers } from "@/lib/services/customers";
import * as mtService from "@/lib/services/manual-transactions";
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import { listOutlets } from "@/lib/services/outlets";
import { listServices } from "@/lib/services/services";

export async function listManualTransactionsAction(opts?: {
	outletId?: string | null;
	customerId?: string | null;
}): Promise<ManualTransactionWithRelations[]> {
	const ctx = await getServerContext();
	await requirePermission(ctx, "system.manual_transaction");
	return mtService.listManualTransactions(ctx, opts);
}

export async function getManualTransactionAction(
	id: string,
): Promise<ManualTransactionWithRelations> {
	const ctx = await getServerContext();
	await requirePermission(ctx, "system.manual_transaction");
	return mtService.getManualTransaction(ctx, id);
}

export async function getNewManualTransactionDataAction() {
	const ctx = await getServerContext();
	await requirePermission(ctx, "system.manual_transaction");
	const [customers, outlets, services] = await Promise.all([
		listCustomers(ctx),
		listOutlets(ctx),
		listServices(ctx),
	]);
	return { customers, outlets, services };
}

export type CreateManualTxResult =
	| { error: string }
	| Awaited<ReturnType<typeof mtService.createManualTransaction>>;

export async function createManualTransactionAction(
	input: unknown,
): Promise<CreateManualTxResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.manual_transaction");
		const result = await mtService.createManualTransaction(ctx, input);
		revalidatePath("/o/[outlet]/sales", "page");
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		return result;
	} catch (err) {
		return toErr("[createManualTransactionAction]", err);
	}
}

export async function cancelManualTransactionAction(
	id: string,
	input: unknown,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "system.manual_transaction");
		await mtService.cancelManualTransaction(ctx, id, input);
		revalidatePath("/o/[outlet]/sales", "page");
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[cancelManualTransactionAction]", err);
	}
}

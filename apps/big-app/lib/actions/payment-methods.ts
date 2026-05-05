"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as paymentMethodsService from "@/lib/services/payment-methods";

function revalidate() {
	revalidatePath("/o/[outlet]/config/sales/payment", "page");
	revalidatePath("/o/[outlet]/appointments", "page");
}

export type PaymentMethodActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof paymentMethodsService.createPaymentMethod>>;

export async function createPaymentMethodAction(
	input: unknown,
): Promise<PaymentMethodActionResult> {
	try {
		const ctx = await getServerContext();
		const method = await paymentMethodsService.createPaymentMethod(ctx, input);
		revalidate();
		return method;
	} catch (err) {
		return toErr("[createPaymentMethodAction]", err);
	}
}

export async function updatePaymentMethodAction(
	id: string,
	input: unknown,
): Promise<PaymentMethodActionResult> {
	try {
		const ctx = await getServerContext();
		const method = await paymentMethodsService.updatePaymentMethod(
			ctx,
			id,
			input,
		);
		revalidate();
		return method;
	} catch (err) {
		return toErr("[updatePaymentMethodAction]", err);
	}
}

export async function deletePaymentMethodAction(
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await paymentMethodsService.deletePaymentMethod(ctx, id);
		revalidate();
		return { ok: true };
	} catch (err) {
		return toErr("[deletePaymentMethodAction]", err);
	}
}

export async function listActivePaymentMethodsAction() {
	const ctx = await getServerContext();
	return paymentMethodsService.listActivePaymentMethods(ctx);
}

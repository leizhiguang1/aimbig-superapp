"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import { NotFoundError } from "@/lib/errors";
import type { EmployeeWithRelations } from "@/lib/services/employees";
import type {
	PaymentWithProcessedBy,
	SaleItem,
	SaleItemIncentiveRow,
	SalesOrderWithRelations,
} from "@/lib/services/sales";
import * as salesService from "@/lib/services/sales";

export type CollectPaymentResult =
	| { error: string }
	| Awaited<ReturnType<typeof salesService.collectAppointmentPayment>>;

export async function collectAppointmentPaymentAction(
	appointmentId: string,
	input: unknown,
): Promise<CollectPaymentResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		// Backdate (`sold_at` set) requires the dedicated flag — UI hides the
		// toggle, but a crafted action call could still send it.
		if ((input as { sold_at?: string | null } | null)?.sold_at) {
			await requirePermission(ctx, "sales.backdate_transactions");
		}
		const result = await salesService.collectAppointmentPayment(
			ctx,
			appointmentId,
			input,
		);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return result;
	} catch (err) {
		return toErr("[collectAppointmentPaymentAction]", err);
	}
}

export type CollectWalkInSaleResult =
	| { error: string }
	| Awaited<ReturnType<typeof salesService.collectWalkInSale>>;

export async function collectWalkInSaleAction(
	input: unknown,
): Promise<CollectWalkInSaleResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		if ((input as { sold_at?: string | null } | null)?.sold_at) {
			await requirePermission(ctx, "sales.backdate_transactions");
		}
		const restrictToOwnCustomer = !(await hasPermission(
			ctx,
			"sales.customer_transparency",
		));
		const result = await salesService.collectWalkInSale(ctx, input, {
			restrictToOwnCustomer,
		});
		revalidatePath("/o/[outlet]/sales", "page");
		revalidatePath("/o/[outlet]/inventory", "page");
		return result;
	} catch (err) {
		return toErr("[collectWalkInSaleAction]", err);
	}
}

export async function getNewSaleDataAction() {
	const ctx = await getServerContext();
	await requirePermission(ctx, "sales.create_sales");
	const canSalesAll = await hasPermission(ctx, "sales.customer_transparency");
	const consultantFilter = canSalesAll
		? null
		: (ctx.currentUser?.employeeId ?? null);
	const [data, canBackdate] = await Promise.all([
		salesService.getNewSaleData(ctx, { consultantFilter }),
		hasPermission(ctx, "sales.backdate_transactions"),
	]);
	return { ...data, canBackdate };
}

export type SalesOrderDetailResult =
	| {
			ok: true;
			order: SalesOrderWithRelations;
			items: SaleItem[];
			payments: PaymentWithProcessedBy[];
			incentives: SaleItemIncentiveRow[];
			employees: EmployeeWithRelations[];
	  }
	| { ok: false; reason: "not_found" };

export async function getSalesOrderDetailAction(
	id: string,
): Promise<SalesOrderDetailResult> {
	const ctx = await getServerContext();
	await requirePermission(ctx, "sales.sales");
	try {
		const detail = await salesService.getSalesOrderDetail(ctx, id);
		return { ok: true, ...detail };
	} catch (err) {
		if (err instanceof NotFoundError) return { ok: false, reason: "not_found" };
		throw err;
	}
}

export type VoidSalesOrderResult =
	| { error: string }
	| { cnNumber: string | null; rnNumber: string | null; returnAmount: number };

export async function voidSalesOrderAction(
	salesOrderId: string,
	input: unknown,
): Promise<VoidSalesOrderResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		const result = await salesService.voidSalesOrder(ctx, salesOrderId, input);
		revalidatePath("/o/[outlet]/sales", "page");
		revalidatePath(`/o/[outlet]/sales/${salesOrderId}`, "page");
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/inventory", "page");
		revalidatePath("/o/[outlet]/passcode", "page");
		return {
			cnNumber: result.cn_number,
			rnNumber: result.rn_number,
			returnAmount: result.refund_amount,
		};
	} catch (err) {
		return toErr("[voidSalesOrderAction]", err);
	}
}

export type IssueRefundResult =
	| { error: string }
	| { rnNumber: string | null; amount: number };

export async function issueRefundAction(
	salesOrderId: string,
	input: unknown,
): Promise<IssueRefundResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		const result = await salesService.issueRefund(ctx, salesOrderId, input);
		revalidatePath("/o/[outlet]/sales", "page");
		revalidatePath(`/o/[outlet]/sales/${salesOrderId}`, "page");
		revalidatePath("/o/[outlet]/appointments", "page");
		return {
			rnNumber: result.rn_number,
			amount: result.amount,
		};
	} catch (err) {
		return toErr("[issueRefundAction]", err);
	}
}

function revalidateSalesOrder(
	salesOrderId: string,
	appointmentRef?: string | null,
) {
	revalidatePath("/o/[outlet]/sales", "page");
	revalidatePath(`/o/[outlet]/sales/${salesOrderId}`, "page");
	revalidatePath("/o/[outlet]/appointments", "page");
	if (appointmentRef)
		revalidatePath(`/o/[outlet]/appointments/${appointmentRef}`, "page");
}

export type RevertLastPaymentResult =
	| { error: string }
	| { invoiceNo: string | null; amount: number; newStatus: string };

export async function revertLastPaymentAction(
	salesOrderId: string,
	appointmentRef?: string | null,
): Promise<RevertLastPaymentResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		const result = await salesService.revertLastPayment(ctx, salesOrderId);
		revalidateSalesOrder(salesOrderId, appointmentRef);
		return {
			invoiceNo: result.invoice_no,
			amount: Number(result.amount),
			newStatus: result.new_status,
		};
	} catch (err) {
		return toErr("[revertLastPaymentAction]", err);
	}
}

export type RecordAdditionalPaymentResult =
	| { error: string }
	| {
			invoiceNo: string | null;
			amount: number;
			newAmountPaid: number;
			newOutstanding: number;
	  };

export async function recordAdditionalPaymentAction(
	salesOrderId: string,
	input: unknown,
	appointmentRef?: string | null,
): Promise<RecordAdditionalPaymentResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		const result = await salesService.recordAdditionalPayment(
			ctx,
			salesOrderId,
			input,
		);
		revalidateSalesOrder(salesOrderId, appointmentRef);
		return {
			invoiceNo: result.invoice_no,
			amount: Number(result.amount),
			newAmountPaid: Number(result.new_amount_paid),
			newOutstanding: Number(result.new_outstanding),
		};
	} catch (err) {
		return toErr("[recordAdditionalPaymentAction]", err);
	}
}

export async function updatePaymentMethodAction(
	paymentId: string,
	salesOrderId: string,
	input: unknown,
	appointmentRef?: string | null,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		await salesService.updatePaymentMethod(ctx, paymentId, input);
		revalidateSalesOrder(salesOrderId, appointmentRef);
		return { ok: true };
	} catch (err) {
		return toErr("[updatePaymentMethodAction]", err);
	}
}

export async function updatePaymentAllocationsAction(
	salesOrderId: string,
	input: unknown,
	appointmentRef?: string | null,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		await salesService.updatePaymentAllocations(ctx, salesOrderId, input);
		revalidateSalesOrder(salesOrderId, appointmentRef);
		return { ok: true };
	} catch (err) {
		return toErr("[updatePaymentAllocationsAction]", err);
	}
}

export async function replaceSaleItemIncentivesAction(
	salesOrderId: string,
	input: unknown,
	appointmentRef?: string | null,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.sales_person_reallocation");
		await salesService.replaceSaleItemIncentives(ctx, input);
		revalidateSalesOrder(salesOrderId, appointmentRef);
		return { ok: true };
	} catch (err) {
		return toErr("[replaceSaleItemIncentivesAction]", err);
	}
}

export type WriteOffResult =
	| { error: string }
	| { invoiceNo: string | null; amount: number };

export async function writeOffOutstandingAction(
	salesOrderId: string,
	input: unknown,
	appointmentRef?: string | null,
): Promise<WriteOffResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "sales.create_sales");
		const result = await salesService.writeOffOutstanding(
			ctx,
			salesOrderId,
			input,
		);
		revalidateSalesOrder(salesOrderId, appointmentRef);
		return {
			invoiceNo: result.invoice_no,
			amount: Number(result.amount),
		};
	} catch (err) {
		return toErr("[writeOffOutstandingAction]", err);
	}
}

"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as lineItemsService from "@/lib/services/appointment-line-items";
import type {
	AppointmentLineItem,
	AppointmentLineItemIncentive,
} from "@/lib/services/appointment-line-items";
import type { Appointment } from "@/lib/services/appointments";
import * as appointmentsService from "@/lib/services/appointments";
import type { Tables } from "@/lib/supabase/types";

export type AppointmentActionResult = { error: string } | Appointment;

export async function createAppointmentAction(
	input: unknown,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.createAppointment(ctx, input);
		revalidatePath("/o/[outlet]/appointments", "page");
		return appointment;
	} catch (err) {
		return toErr("[createAppointmentAction]", err);
	}
}

export async function updateAppointmentAction(
	id: string,
	input: unknown,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.updateAppointment(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[updateAppointmentAction]", err);
	}
}

export async function rescheduleAppointmentAction(
	id: string,
	input: unknown,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.rescheduleAppointment(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments", "page");
		return appointment;
	} catch (err) {
		return toErr("[rescheduleAppointmentAction]", err);
	}
}

export async function setAppointmentStatusAction(
	id: string,
	input: unknown,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.setAppointmentStatus(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[setAppointmentStatusAction]", err);
	}
}

export async function markAppointmentCompletedAction(
	id: string,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.markAppointmentCompleted(ctx, id);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[markAppointmentCompletedAction]", err);
	}
}

export async function revertCompletedAppointmentAction(
	id: string,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.revertCompletedAppointment(ctx, id);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[revertCompletedAppointmentAction]", err);
	}
}

export async function setAppointmentTagsAction(
	id: string,
	input: unknown,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.setAppointmentTags(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[setAppointmentTagsAction]", err);
	}
}

export async function collectAppointmentPaymentAction(
	id: string,
	paidVia: string,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.setAppointmentPayment(ctx, id, {
			payment_status: "paid",
			paid_via: paidVia,
		});
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[collectAppointmentPaymentAction]", err);
	}
}

export async function undoAppointmentPaymentAction(
	id: string,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.setAppointmentPayment(ctx, id, {
			payment_status: "unpaid",
			paid_via: null,
		});
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[undoAppointmentPaymentAction]", err);
	}
}

export async function setAppointmentPaymentRemarkAction(
	id: string,
	remark: string | null,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.setAppointmentPaymentRemark(ctx, id, {
			payment_remark: remark,
		});
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[setAppointmentPaymentRemarkAction]", err);
	}
}

export async function setAppointmentFollowUpAction(
	id: string,
	followUp: string | null,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.setAppointmentFollowUp(ctx, id, {
			follow_up: followUp,
		});
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return appointment;
	} catch (err) {
		return toErr("[setAppointmentFollowUpAction]", err);
	}
}

export async function cancelAppointmentAction(
	id: string,
	reason: string,
): Promise<AppointmentActionResult> {
	try {
		const ctx = await getServerContext();
		const appointment = await appointmentsService.cancelAppointment(ctx, id, { reason });
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		if (appointment.customer_id)
			revalidatePath(`/o/[outlet]/customers/${appointment.customer_id}`, "page");
		return appointment;
	} catch (err) {
		return toErr("[cancelAppointmentAction]", err);
	}
}

export type ConvertLeadResult =
	| { error: string }
	| { customer: Tables<"customers">; linkedAppointments: number };

export async function convertLeadToCustomerAction(
	leadAppointmentId: string,
	input: unknown,
): Promise<ConvertLeadResult> {
	try {
		const ctx = await getServerContext();
		const result = await appointmentsService.convertLeadToCustomer(
			ctx,
			leadAppointmentId,
			input,
		);
		revalidatePath("/o/[outlet]/appointments", "page");
		revalidatePath("/o/[outlet]/customers", "page");
		return result;
	} catch (err) {
		return toErr("[convertLeadToCustomerAction]", err);
	}
}

// Saves the shared "Message to frontdesk" shown in BOTH the Billing tab
// (BillingSection) and the bottom-right of CollectPaymentDialog. Distinct
// from `appointments.notes` (the appointment-level notes edited in the
// create/edit dialog) and from per-line `appointment_line_items.notes`.
export async function saveFrontdeskMessageAction(
	id: string,
	message: string | null,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		const { error } = await ctx.db
			.from("appointments")
			.update({ frontdesk_message: message })
			.eq("id", id);
		if (error) throw new Error(error.message);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[saveFrontdeskMessageAction]", err);
	}
}

// ─── Appointment line items ─────────────────────────────────────────────────

export async function listLineItemsAction(appointmentId: string) {
	const ctx = await getServerContext();
	return lineItemsService.listLineItemsForAppointment(ctx, appointmentId);
}

export type LineItemActionResult = { error: string } | AppointmentLineItem;

export async function createLineItemAction(
	_appointmentId: string,
	input: unknown,
): Promise<LineItemActionResult> {
	try {
		const ctx = await getServerContext();
		const entry = await lineItemsService.createLineItem(ctx, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return entry;
	} catch (err) {
		return toErr("[createLineItemAction]", err);
	}
}

export type LineItemsBulkActionResult = { error: string } | AppointmentLineItem[];

export async function createLineItemsBulkAction(
	_appointmentId: string,
	inputs: unknown[],
): Promise<LineItemsBulkActionResult> {
	try {
		const ctx = await getServerContext();
		const entries = await lineItemsService.createLineItemsBulk(ctx, inputs);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return entries;
	} catch (err) {
		return toErr("[createLineItemsBulkAction]", err);
	}
}

export async function updateLineItemAction(
	_appointmentId: string,
	id: string,
	input: unknown,
): Promise<LineItemActionResult> {
	try {
		const ctx = await getServerContext();
		const entry = await lineItemsService.updateLineItem(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return entry;
	} catch (err) {
		return toErr("[updateLineItemAction]", err);
	}
}

export async function deleteLineItemAction(
	_appointmentId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await lineItemsService.deleteLineItem(ctx, id);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteLineItemAction]", err);
	}
}

export async function cancelBillingForAppointmentAction(
	_currentAppointmentId: string,
	targetAppointmentId: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await lineItemsService.cancelLineItemsForAppointment(ctx, targetAppointmentId);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[cancelBillingForAppointmentAction]", err);
	}
}

export async function revertBillingForAppointmentAction(
	_currentAppointmentId: string,
	targetAppointmentId: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await lineItemsService.revertLineItemsForAppointment(ctx, targetAppointmentId);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[revertBillingForAppointmentAction]", err);
	}
}

export async function cancelBillingForCustomerAction(
	customerId: string,
	targetAppointmentId: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await lineItemsService.cancelLineItemsForAppointment(ctx, targetAppointmentId);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[cancelBillingForCustomerAction]", err);
	}
}

export async function revertBillingForCustomerAction(
	customerId: string,
	targetAppointmentId: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await lineItemsService.revertLineItemsForAppointment(ctx, targetAppointmentId);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[revertBillingForCustomerAction]", err);
	}
}

export async function listPastLineItemsForCustomerAction(customerId: string) {
	const ctx = await getServerContext();
	return lineItemsService.listLineItemsForCustomer(ctx, customerId);
}

// ─── Incentives (hands-on attribution) ──────────────────────────────────────

export type LineItemIncentiveActionResult =
	| { error: string }
	| AppointmentLineItemIncentive;

export async function createLineItemIncentiveAction(
	_appointmentId: string,
	input: unknown,
): Promise<LineItemIncentiveActionResult> {
	try {
		const ctx = await getServerContext();
		const row = await lineItemsService.createIncentive(ctx, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return row;
	} catch (err) {
		return toErr("[createLineItemIncentiveAction]", err);
	}
}

export async function deleteLineItemIncentiveAction(
	_appointmentId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await lineItemsService.deleteIncentive(ctx, id);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteLineItemIncentiveAction]", err);
	}
}

export async function saveAllocationsForAppointmentAction(
	_appointmentId: string,
	allocations: {
		lineItemId: string;
		employees: { employee_id: string; percent: number }[];
	}[],
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		for (const a of allocations) {
			await lineItemsService.replaceIncentivesForLineItem(
				ctx,
				a.lineItemId,
				a.employees,
			);
		}
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[saveAllocationsForAppointmentAction]", err);
	}
}

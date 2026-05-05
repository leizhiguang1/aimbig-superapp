"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as followUpsService from "@/lib/services/follow-ups";

export type FollowUpActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof followUpsService.createFollowUp>>;

export async function createFollowUpAction(
	_appointmentId: string,
	input: unknown,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.createFollowUp(ctx, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return followUp;
	} catch (err) {
		return toErr("[createFollowUpAction]", err);
	}
}

export async function updateFollowUpAction(
	_appointmentId: string,
	id: string,
	input: unknown,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.updateFollowUp(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return followUp;
	} catch (err) {
		return toErr("[updateFollowUpAction]", err);
	}
}

export async function setFollowUpReminderDoneAction(
	_appointmentId: string,
	id: string,
	reminderDone: boolean,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.setFollowUpReminderDone(ctx, id, {
			reminder_done: reminderDone,
		});
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return followUp;
	} catch (err) {
		return toErr("[setFollowUpReminderDoneAction]", err);
	}
}

export async function setFollowUpPinAction(
	_appointmentId: string,
	id: string,
	pinned: boolean,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await followUpsService.setFollowUpPin(ctx, id, pinned);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[setFollowUpPinAction]", err);
	}
}

export async function deleteFollowUpAction(
	_appointmentId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await followUpsService.deleteFollowUp(ctx, id);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteFollowUpAction]", err);
	}
}

// Customer-scoped variants — same service calls, revalidate customer path

export async function createCustomerFollowUpAction(
	customerId: string,
	input: unknown,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.createFollowUp(ctx, input);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return followUp;
	} catch (err) {
		return toErr("[createCustomerFollowUpAction]", err);
	}
}

export async function updateCustomerFollowUpAction(
	customerId: string,
	id: string,
	input: unknown,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.updateFollowUp(ctx, id, input);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return followUp;
	} catch (err) {
		return toErr("[updateCustomerFollowUpAction]", err);
	}
}

export async function setCustomerFollowUpReminderDoneAction(
	customerId: string,
	id: string,
	reminderDone: boolean,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.setFollowUpReminderDone(ctx, id, {
			reminder_done: reminderDone,
		});
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return followUp;
	} catch (err) {
		return toErr("[setCustomerFollowUpReminderDoneAction]", err);
	}
}

export async function setCustomerFollowUpPinAction(
	customerId: string,
	id: string,
	pinned: boolean,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await followUpsService.setFollowUpPin(ctx, id, pinned);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[setCustomerFollowUpPinAction]", err);
	}
}

export async function deleteCustomerFollowUpAction(
	customerId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await followUpsService.deleteFollowUp(ctx, id);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCustomerFollowUpAction]", err);
	}
}

export async function setDashboardFollowUpReminderDoneAction(
	id: string,
	reminderDone: boolean,
): Promise<FollowUpActionResult> {
	try {
		const ctx = await getServerContext();
		const followUp = await followUpsService.setFollowUpReminderDone(ctx, id, {
			reminder_done: reminderDone,
		});
		revalidatePath("/o/[outlet]/dashboard", "page");
		return followUp;
	} catch (err) {
		return toErr("[setDashboardFollowUpReminderDoneAction]", err);
	}
}

"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { requirePermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import * as caseNotesService from "@/lib/services/case-notes";

export type CaseNoteActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof caseNotesService.createCaseNote>>;

export async function createCaseNoteAction(
	_appointmentId: string,
	input: unknown,
): Promise<CaseNoteActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		const note = await caseNotesService.createCaseNote(ctx, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return note;
	} catch (err) {
		return toErr("[createCaseNoteAction]", err);
	}
}

export async function updateCaseNoteAction(
	_appointmentId: string,
	id: string,
	input: unknown,
): Promise<CaseNoteActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		const note = await caseNotesService.updateCaseNote(ctx, id, input);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return note;
	} catch (err) {
		return toErr("[updateCaseNoteAction]", err);
	}
}

export async function deleteCaseNoteAction(
	_appointmentId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.deleteCaseNote(ctx, id);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCaseNoteAction]", err);
	}
}

// Customer-scoped variants — same service calls, revalidate customer path

export async function createCustomerCaseNoteAction(
	customerId: string,
	input: unknown,
): Promise<CaseNoteActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		const note = await caseNotesService.createCaseNote(ctx, input);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return note;
	} catch (err) {
		return toErr("[createCustomerCaseNoteAction]", err);
	}
}

export async function updateCustomerCaseNoteAction(
	customerId: string,
	id: string,
	input: unknown,
): Promise<CaseNoteActionResult> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		const note = await caseNotesService.updateCaseNote(ctx, id, input);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return note;
	} catch (err) {
		return toErr("[updateCustomerCaseNoteAction]", err);
	}
}

export async function cancelCaseNoteAction(
	_appointmentId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.cancelCaseNote(ctx, id);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[cancelCaseNoteAction]", err);
	}
}

export async function revertCaseNoteAction(
	_appointmentId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.revertCaseNote(ctx, id);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[revertCaseNoteAction]", err);
	}
}

export async function setCaseNotePinAction(
	_appointmentId: string,
	id: string,
	pinned: boolean,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.setCaseNotePin(ctx, id, pinned);
		revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[setCaseNotePinAction]", err);
	}
}

export async function deleteCustomerCaseNoteAction(
	customerId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.deleteCaseNote(ctx, id);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCustomerCaseNoteAction]", err);
	}
}

export async function cancelCustomerCaseNoteAction(
	customerId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.cancelCaseNote(ctx, id);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[cancelCustomerCaseNoteAction]", err);
	}
}

export async function revertCustomerCaseNoteAction(
	customerId: string,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.revertCaseNote(ctx, id);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[revertCustomerCaseNoteAction]", err);
	}
}

export async function setCustomerCaseNotePinAction(
	customerId: string,
	id: string,
	pinned: boolean,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		await requirePermission(ctx, "clinical.case_notes_edit");
		await caseNotesService.setCaseNotePin(ctx, id, pinned);
		revalidatePath(`/o/[outlet]/customers/${customerId}`, "page");
		return { ok: true };
	} catch (err) {
		return toErr("[setCustomerCaseNotePinAction]", err);
	}
}

"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import type { CustomerLetterInput } from "@/lib/schemas/customer-documents";
import * as customerDocumentsService from "@/lib/services/customer-documents";
import {
	buildCustomerDocumentPath,
	createSignedReadUrl,
	createSignedUploadUrl,
	deleteObject,
} from "@/lib/services/storage";

export async function requestCustomerDocumentUploadUrlAction(args: {
	customerId: string;
	filename: string;
	mime: string;
}) {
	const ctx = await getServerContext();
	const path = buildCustomerDocumentPath({
		customerId: args.customerId,
		filename: args.filename,
		mime: args.mime,
	});
	return createSignedUploadUrl(ctx, "documents", path);
}

export type CustomerDocumentActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof customerDocumentsService.createCustomerDocument>>;

export async function createCustomerDocumentAction(
	appointmentId: string | null,
	input: unknown,
): Promise<CustomerDocumentActionResult> {
	try {
		const ctx = await getServerContext();
		const doc = await customerDocumentsService.createCustomerDocument(ctx, input);
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		if (appointmentId) revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return doc;
	} catch (err) {
		return toErr("[createCustomerDocumentAction]", err);
	}
}

export async function getCustomerDocumentSignedUrlAction(
	id: string,
): Promise<string> {
	const ctx = await getServerContext();
	const doc = await customerDocumentsService.getCustomerDocument(ctx, id);
	return createSignedReadUrl(ctx, "documents", doc.storage_path, 60 * 10);
}

export async function deleteCustomerDocumentAction(
	appointmentId: string | null,
	id: string,
): Promise<{ error: string } | { ok: true }> {
	try {
		const ctx = await getServerContext();
		const { storage_path } =
			await customerDocumentsService.deleteCustomerDocument(ctx, id);
		if (storage_path) {
			await deleteObject(ctx, "documents", storage_path).catch(() => {
				// orphan blob — the row is already gone, a cleanup pass can sweep later
			});
		}
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		if (appointmentId) revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return { ok: true };
	} catch (err) {
		return toErr("[deleteCustomerDocumentAction]", err);
	}
}

export type CustomerLetterActionResult =
	| { error: string }
	| Awaited<ReturnType<typeof customerDocumentsService.createCustomerLetter>>;

export async function createCustomerLetterAction(
	appointmentId: string | null,
	input: CustomerLetterInput,
): Promise<CustomerLetterActionResult> {
	try {
		const ctx = await getServerContext();
		const doc = await customerDocumentsService.createCustomerLetter(ctx, input);
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		if (appointmentId) revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return doc;
	} catch (err) {
		return toErr("[createCustomerLetterAction]", err);
	}
}

export async function updateCustomerLetterAction(
	appointmentId: string | null,
	id: string,
	letter_body_html: string,
): Promise<CustomerLetterActionResult> {
	try {
		const ctx = await getServerContext();
		const doc = await customerDocumentsService.updateCustomerLetter(
			ctx,
			id,
			letter_body_html,
		);
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		if (appointmentId) revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		return doc;
	} catch (err) {
		return toErr("[updateCustomerLetterAction]", err);
	}
}

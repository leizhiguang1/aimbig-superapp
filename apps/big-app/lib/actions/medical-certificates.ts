"use server";

import { revalidatePath } from "next/cache";
import { toErr } from "@/lib/actions/_helpers";
import { getServerContext } from "@/lib/context/server";
import * as mcService from "@/lib/services/medical-certificates";

export type MedicalCertificateActionResult =
	| { error: string }
	| { id: string; code: string };

export async function createMedicalCertificateAction(
	input: unknown,
): Promise<MedicalCertificateActionResult> {
	try {
		const ctx = await getServerContext();
		const mc = await mcService.createMedicalCertificate(ctx, input);
		if (mc.appointment_id) {
			revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		}
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		return { id: mc.id, code: mc.code };
	} catch (err) {
		return toErr("[createMedicalCertificateAction]", err);
	}
}

export async function updateMedicalCertificateAction(
	id: string,
	input: unknown,
): Promise<MedicalCertificateActionResult> {
	try {
		const ctx = await getServerContext();
		const mc = await mcService.updateMedicalCertificate(ctx, id, input);
		if (mc.appointment_id) {
			revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		}
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		return { id: mc.id, code: mc.code };
	} catch (err) {
		return toErr("[updateMedicalCertificateAction]", err);
	}
}

export async function cancelMedicalCertificateAction(
	id: string,
): Promise<MedicalCertificateActionResult> {
	try {
		const ctx = await getServerContext();
		const mc = await mcService.cancelMedicalCertificate(ctx, id);
		if (mc.appointment_id) {
			revalidatePath("/o/[outlet]/appointments/[ref]", "page");
		}
		revalidatePath("/o/[outlet]/customers/[id]", "page");
		return { id: mc.id, code: mc.code };
	} catch (err) {
		return toErr("[cancelMedicalCertificateAction]", err);
	}
}

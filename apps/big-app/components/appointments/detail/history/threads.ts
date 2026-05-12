import type {
	AppointmentLineItem,
	CustomerLineItem,
} from "@/lib/services/appointment-line-items";
import type { CustomerAppointmentSummary } from "@/lib/services/appointments";
import type { CaseNoteWithContext } from "@/lib/services/case-notes";
import type {
	AppointmentMeta,
	ServiceChip,
	SummarizableItem,
	Thread,
} from "./types";

const SERVICE_SUMMARY_MAX = 120;

export function summarizeServices(items: SummarizableItem[]): ServiceChip[] {
	if (items.length === 0) return [];
	const grouped = new Map<string, number>();
	for (const it of items) {
		if (it.is_cancelled) continue;
		const desc = it.description.trim();
		if (!desc) continue;
		const qty = Number(it.quantity);
		grouped.set(
			desc,
			(grouped.get(desc) ?? 0) + (Number.isFinite(qty) ? qty : 0),
		);
	}
	const chips: ServiceChip[] = [];
	let length = 0;
	for (const [desc, qty] of grouped) {
		const piece = `${desc} ×${qty % 1 === 0 ? qty : qty.toFixed(2)}`;
		const sep = chips.length === 0 ? 0 : 3;
		if (length + sep + piece.length > SERVICE_SUMMARY_MAX) {
			chips.push({ label: "…", truncated: true });
			break;
		}
		chips.push({ label: piece });
		length += sep + piece.length;
	}
	return chips;
}

export function buildMetaByAppointment(
	customerHistory: CustomerAppointmentSummary[],
	billing: CustomerLineItem[],
	currentAppointmentId: string | null,
	currentAppointmentLineItems: AppointmentLineItem[] | undefined,
): Map<string, AppointmentMeta> {
	const meta = new Map<string, AppointmentMeta>();
	for (const a of customerHistory) {
		meta.set(a.id, {
			bookingRef: a.booking_ref,
			outletCode: a.outlet?.code ?? null,
			startAt: new Date(a.start_at),
			serviceSummary: [],
		});
	}

	const itemsByAppointment = new Map<string, CustomerLineItem[]>();
	for (const b of billing) {
		if (!b.appointment) continue;
		const list = itemsByAppointment.get(b.appointment.id);
		if (list) list.push(b);
		else itemsByAppointment.set(b.appointment.id, [b]);
	}
	for (const [aptId, items] of itemsByAppointment) {
		const existing = meta.get(aptId);
		const summary = summarizeServices(items);
		if (existing) {
			existing.serviceSummary = summary;
		} else {
			const first = items[0];
			meta.set(aptId, {
				bookingRef: first.appointment?.booking_ref ?? "",
				outletCode: null,
				startAt: first.appointment
					? new Date(first.appointment.start_at)
					: null,
				serviceSummary: summary,
			});
		}
	}

	if (currentAppointmentId && currentAppointmentLineItems?.length) {
		const summary = summarizeServices(currentAppointmentLineItems);
		const existing = meta.get(currentAppointmentId);
		if (existing) {
			if (summary.length) existing.serviceSummary = summary;
		} else if (summary.length) {
			meta.set(currentAppointmentId, {
				bookingRef: "",
				outletCode: null,
				startAt: null,
				serviceSummary: summary,
			});
		}
	}
	return meta;
}

export function buildThreads(
	caseNotes: CaseNoteWithContext[],
	billing: CustomerLineItem[],
	customerHistory: CustomerAppointmentSummary[],
	currentAppointmentId: string,
	pinnedBillingIds: Set<string>,
	currentAppointmentLineItems: AppointmentLineItem[] | undefined,
): { threads: Thread[]; noteCount: number; billingCount: number } {
	const meta = buildMetaByAppointment(
		customerHistory,
		billing,
		currentAppointmentId,
		currentAppointmentLineItems,
	);

	const byAppointment = new Map<
		string,
		{
			bookingRef: string;
			date: Date;
			paymentStatus: string;
			paidVia: string | null;
			servedBy: string | null;
			salesOrderNumber: string | null;
			items: CustomerLineItem[];
			total: number;
			allCancelled: boolean;
		}
	>();
	for (const b of billing) {
		if (!b.appointment) continue;
		const aptId = b.appointment.id;
		const total = Number(b.total ?? b.quantity * b.unit_price);
		const existing = byAppointment.get(aptId);
		if (existing) {
			existing.items.push(b);
			existing.total += total;
			if (!b.is_cancelled) existing.allCancelled = false;
		} else {
			const emp = b.appointment.employee;
			const activeSo = b.appointment.sales_orders?.find(
				(so) => so.status !== "cancelled",
			);
			byAppointment.set(aptId, {
				bookingRef: b.appointment.booking_ref,
				date: new Date(b.appointment.start_at),
				paymentStatus: b.appointment.payment_status,
				paidVia: b.appointment.paid_via,
				servedBy: emp ? `${emp.first_name} ${emp.last_name}`.trim() : null,
				salesOrderNumber: activeSo?.so_number ?? null,
				items: [b],
				total,
				allCancelled: b.is_cancelled,
			});
		}
	}

	const threads: Thread[] = [];
	for (const [appointmentId, g] of byAppointment) {
		const m = meta.get(appointmentId);
		threads.push({
			kind: "billing",
			id: `b-${appointmentId}`,
			date: g.date,
			appointmentId,
			bookingRef: g.bookingRef,
			outletCode: m?.outletCode ?? null,
			serviceSummary: summarizeServices(g.items),
			paymentStatus: g.paymentStatus,
			paidVia: g.paidVia,
			servedBy: g.servedBy,
			salesOrderNumber: g.salesOrderNumber,
			items: g.items,
			total: g.total,
			isCurrent: appointmentId === currentAppointmentId,
			isCancelled: g.allCancelled,
		});
	}

	for (const n of caseNotes) {
		const m = n.appointment_id ? meta.get(n.appointment_id) : null;
		threads.push({
			kind: "note",
			id: `n-${n.id}`,
			date: new Date(n.created_at),
			note: n,
			appointmentId: n.appointment_id ?? null,
			bookingRef: m?.bookingRef ?? null,
			outletCode: m?.outletCode ?? null,
			serviceSummary: m?.serviceSummary ?? [],
			appointmentDate: m?.startAt ?? null,
			isCurrent: n.appointment_id === currentAppointmentId,
			isPinned: n.is_pinned,
			isCancelled: n.is_cancelled,
		});
	}

	threads.sort((a, b) => {
		const aPinned =
			(a.kind === "note" && a.isPinned) ||
			(a.kind === "billing" && pinnedBillingIds.has(a.id))
				? 1
				: 0;
		const bPinned =
			(b.kind === "note" && b.isPinned) ||
			(b.kind === "billing" && pinnedBillingIds.has(b.id))
				? 1
				: 0;
		if (aPinned !== bPinned) return bPinned - aPinned;
		return b.date.getTime() - a.date.getTime();
	});
	return {
		threads,
		noteCount: caseNotes.length,
		billingCount: byAppointment.size,
	};
}

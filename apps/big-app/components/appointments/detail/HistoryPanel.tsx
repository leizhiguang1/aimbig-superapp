"use client";

import {
	BellRing,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	Layers,
	Maximize2,
	MessageSquare,
	Minimize2,
	Pencil,
	Phone,
	Pin,
	PinOff,
	Receipt,
	RotateCcw,
	StickyNote,
	Trash2,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import type { Toast } from "@/components/appointments/AppointmentToastStack";
import { BillingRow } from "@/components/appointments/detail/BillingRow";
import { FollowUpRow } from "@/components/appointments/detail/FollowUpRow";
import { IconBtn } from "@/components/appointments/detail/IconBtn";
import { NoteRow } from "@/components/appointments/detail/NoteRow";
import { usePermission } from "@/components/auth/PermissionsProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	cancelBillingForAppointmentAction,
	cancelBillingForCustomerAction,
	revertBillingForAppointmentAction,
	revertBillingForCustomerAction,
} from "@/lib/actions/appointments";
import {
	cancelCaseNoteAction,
	cancelCustomerCaseNoteAction,
	revertCaseNoteAction,
	revertCustomerCaseNoteAction,
	setCaseNotePinAction,
	setCustomerCaseNotePinAction,
} from "@/lib/actions/case-notes";
import {
	deleteCustomerFollowUpAction,
	deleteFollowUpAction,
	setCustomerFollowUpPinAction,
	setFollowUpPinAction,
} from "@/lib/actions/follow-ups";
import {
	APPOINTMENT_PAYMENT_MODE_LABEL,
	type AppointmentPaymentMode,
} from "@/lib/constants/appointment-status";
import type {
	AppointmentLineItem,
	CustomerLineItem,
} from "@/lib/services/appointment-line-items";
import type { CustomerAppointmentSummary } from "@/lib/services/appointments";
import type { CaseNoteWithContext } from "@/lib/services/case-notes";
import type { FollowUpWithRefs } from "@/lib/services/follow-ups";
import { cn } from "@/lib/utils";
import {
	formatDateTime24,
	formatDateTimeNumeric,
	formatDayMonthYear,
	formatHeaderDate,
	formatHeaderTime,
	formatWeekdayTime,
} from "@/lib/utils/format-date";

/* ------------------------------------------------------------------ */
/*  Shared compact appointment-context header                         */
/* ------------------------------------------------------------------ */

function Pipe() {
	return (
		<span aria-hidden className="font-semibold text-foreground/70">
			|
		</span>
	);
}

export function ContextHeader({
	bookingRef,
	outletCode,
	date,
	serviceSummary,
	onJump,
}: {
	bookingRef: string | null;
	outletCode: string | null;
	date: Date | null;
	serviceSummary: ServiceChip[];
	onJump?: () => void;
}) {
	const hasServices = serviceSummary.length > 0;
	if (!bookingRef && !outletCode && !date && !hasServices) return null;
	const segments: { key: string; node: React.ReactNode }[] = [];
	if (bookingRef) {
		segments.push({
			key: "bref",
			node: (
				<button
					type="button"
					onClick={onJump}
					disabled={!onJump}
					className="font-bold text-foreground tabular-nums hover:underline disabled:cursor-default disabled:no-underline"
				>
					{bookingRef}
				</button>
			),
		});
	}
	if (outletCode) {
		segments.push({
			key: "outlet",
			node: (
				<span className="font-semibold text-foreground uppercase tracking-wide">
					{outletCode}
				</span>
			),
		});
	}
	if (date) {
		segments.push({
			key: "date",
			node: (
				<span className="text-foreground tabular-nums">
					{formatDateTimeNumeric(date)}
				</span>
			),
		});
	}
	for (let i = 0; i < serviceSummary.length; i++) {
		const chip = serviceSummary[i];
		const color = chip.truncated ? "text-muted-foreground" : "text-sky-600";
		segments.push({
			key: `svc-${chip.label}-${i}`,
			node: <span className={cn("font-semibold", color)}>{chip.label}</span>,
		});
	}

	return (
		<div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10px] leading-tight">
			{segments.map((seg, i) => (
				<Fragment key={seg.key}>
					{i > 0 && <Pipe />}
					{seg.node}
				</Fragment>
			))}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type HistoryMode = "all" | "casenotes" | "billing";

export type BillingThread = {
	kind: "billing";
	id: string;
	date: Date;
	appointmentId: string;
	bookingRef: string;
	outletCode: string | null;
	serviceSummary: ServiceChip[];
	paymentStatus: string;
	paidVia: string | null;
	servedBy: string | null;
	salesOrderNumber: string | null;
	items: CustomerLineItem[];
	total: number;
	isCurrent: boolean;
	isCancelled: boolean;
};

export type NoteThread = {
	kind: "note";
	id: string;
	date: Date;
	note: CaseNoteWithContext;
	bookingRef: string | null;
	outletCode: string | null;
	serviceSummary: ServiceChip[];
	appointmentDate: Date | null;
	appointmentId: string | null;
	isCurrent: boolean;
	isPinned: boolean;
	isCancelled: boolean;
};

type Thread = BillingThread | NoteThread;

export type HistoryScope =
	| { kind: "appointment"; appointmentId: string }
	| { kind: "customer"; customerId: string };

type Props = {
	scope: HistoryScope;
	caseNotes: CaseNoteWithContext[];
	customerBillingHistory: CustomerLineItem[];
	customerHistory: CustomerAppointmentSummary[];
	currentAppointmentLineItems?: AppointmentLineItem[];
	onToast: (message: string, variant?: Toast["variant"]) => void;
	onEditNote?: (noteId: string, content: string) => void;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const SERVICE_SUMMARY_MAX = 120;

type SummarizableItem = {
	description: string;
	quantity: number | string;
	is_cancelled?: boolean;
};

export type ServiceChip = { label: string; truncated?: true };

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

type AppointmentMeta = {
	bookingRef: string;
	outletCode: string | null;
	startAt: Date | null;
	serviceSummary: ServiceChip[];
};

function buildMetaByAppointment(
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

function buildThreads(
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

/* ------------------------------------------------------------------ */
/*  HistoryPanel (case notes + billing)                               */
/* ------------------------------------------------------------------ */

export function HistoryPanel({
	scope,
	caseNotes,
	customerBillingHistory,
	customerHistory,
	currentAppointmentLineItems,
	onToast,
	onEditNote,
}: Props) {
	const router = useRouter();
	const [mode, setMode] = useState<HistoryMode>("all");
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
	const [pinnedBillingIds, setPinnedBillingIds] = useState<Set<string>>(
		new Set(),
	);
	const [pending, startTransition] = useTransition();
	const currentAppointmentId =
		scope.kind === "appointment" ? scope.appointmentId : "";

	const toggleBillingPin = (id: string) =>
		setPinnedBillingIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const { threads, noteCount, billingCount } = useMemo(
		() =>
			buildThreads(
				caseNotes,
				customerBillingHistory,
				customerHistory,
				currentAppointmentId,
				pinnedBillingIds,
				currentAppointmentLineItems,
			),
		[
			caseNotes,
			customerBillingHistory,
			customerHistory,
			currentAppointmentId,
			pinnedBillingIds,
			currentAppointmentLineItems,
		],
	);

	const visible = useMemo(() => {
		return threads.filter((t) => {
			if (mode === "casenotes") return t.kind === "note";
			if (mode === "billing") return t.kind === "billing";
			return true;
		});
	}, [threads, mode]);

	const allCollapsed =
		visible.length > 0 && visible.every((t) => collapsedIds.has(t.id));

	const toggleCollapse = (id: string) =>
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const cycleMode = () =>
		setMode((m) =>
			m === "all" ? "casenotes" : m === "casenotes" ? "billing" : "all",
		);

	const toggleAll = () => {
		if (allCollapsed) setCollapsedIds(new Set());
		else setCollapsedIds(new Set(visible.map((v) => v.id)));
	};

	const handleToggleNotePin = (noteId: string, currentPinned: boolean) => {
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await setCaseNotePinAction(
						scope.appointmentId,
						noteId,
						!currentPinned,
					);
				} else {
					await setCustomerCaseNotePinAction(
						scope.customerId,
						noteId,
						!currentPinned,
					);
				}
				onToast(currentPinned ? "Unpinned" : "Pinned to top", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not update pin",
					"error",
				);
			}
		});
	};

	const handleCancelNote = (noteId: string) => {
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await cancelCaseNoteAction(scope.appointmentId, noteId);
				} else {
					await cancelCustomerCaseNoteAction(scope.customerId, noteId);
				}
				onToast("Note cancelled", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not cancel note",
					"error",
				);
			}
		});
	};

	const handleRevertNote = (noteId: string) => {
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await revertCaseNoteAction(scope.appointmentId, noteId);
				} else {
					await revertCustomerCaseNoteAction(scope.customerId, noteId);
				}
				onToast("Note restored", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not restore note",
					"error",
				);
			}
		});
	};

	const handleCancelBilling = (targetAppointmentId: string) => {
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await cancelBillingForAppointmentAction(
						scope.appointmentId,
						targetAppointmentId,
					);
				} else {
					await cancelBillingForCustomerAction(
						scope.customerId,
						targetAppointmentId,
					);
				}
				onToast("Billing cancelled", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not cancel billing",
					"error",
				);
			}
		});
	};

	const handleRevertBilling = (targetAppointmentId: string) => {
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await revertBillingForAppointmentAction(
						scope.appointmentId,
						targetAppointmentId,
					);
				} else {
					await revertBillingForCustomerAction(
						scope.customerId,
						targetAppointmentId,
					);
				}
				onToast("Billing restored", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not restore billing",
					"error",
				);
			}
		});
	};

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-md border bg-card">
			<div className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
				<div className="font-bold text-[12px] text-foreground tracking-wide">
					HISTORY
				</div>
				<div className="ml-auto flex items-center gap-1">
					<button
						type="button"
						aria-label="Cycle timeline filter"
						onClick={cycleMode}
						disabled={threads.length === 0}
						title={
							mode === "all"
								? `All · ${noteCount} notes, ${billingCount} billing`
								: mode === "casenotes"
									? `Case notes only · ${noteCount}`
									: `Billing only · ${billingCount}`
						}
						className={cn(
							"flex h-7 items-center gap-1 rounded border px-1.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
							mode === "casenotes" &&
								"border-amber-300 bg-amber-50 text-amber-700",
							mode === "billing" &&
								"border-emerald-300 bg-emerald-50 text-emerald-700",
							mode === "all" &&
								"border-border bg-muted/40 text-muted-foreground",
						)}
					>
						{mode === "all" ? (
							<>
								<Layers className="size-[14px]" />
								<span className="tabular-nums">{noteCount + billingCount}</span>
							</>
						) : mode === "casenotes" ? (
							<>
								<StickyNote className="size-[14px]" />
								<span className="tabular-nums">{noteCount}</span>
							</>
						) : (
							<>
								<Receipt className="size-[14px]" />
								<span className="tabular-nums">{billingCount}</span>
							</>
						)}
					</button>
					<button
						type="button"
						aria-label={allCollapsed ? "Expand all" : "Collapse all"}
						title={allCollapsed ? "Expand all" : "Collapse all"}
						onClick={toggleAll}
						disabled={visible.length === 0}
						className="flex size-7 items-center justify-center rounded border border-border bg-muted/40 text-muted-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
					>
						{allCollapsed ? (
							<Maximize2 className="size-[14px]" />
						) : (
							<Minimize2 className="size-[14px]" />
						)}
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{threads.length === 0 ? (
					<div className="p-5 text-center text-muted-foreground text-sm">
						No history
					</div>
				) : visible.length === 0 ? (
					<div className="p-5 text-center text-muted-foreground text-xs leading-relaxed">
						Nothing for this view.
						<div className="mt-2">
							Use the timeline icon to change the filter.
						</div>
					</div>
				) : (
					visible.map((t) =>
						t.kind === "billing" ? (
							<BillingRow
								key={t.id}
								item={t}
								collapsed={collapsedIds.has(t.id)}
								pinned={pinnedBillingIds.has(t.id)}
								onToggle={() => toggleCollapse(t.id)}
								onTogglePin={() => toggleBillingPin(t.id)}
								onCancel={() => handleCancelBilling(t.appointmentId)}
								onRevert={() => handleRevertBilling(t.appointmentId)}
								onJump={
									t.isCurrent
										? undefined
										: () =>
												router.push(
													`/appointments/${t.bookingRef ?? t.appointmentId}`,
												)
								}
							/>
						) : (
							<NoteRow
								key={t.id}
								item={t}
								collapsed={collapsedIds.has(t.id)}
								onToggle={() => toggleCollapse(t.id)}
								onTogglePin={() => handleToggleNotePin(t.note.id, t.isPinned)}
								onEdit={
									onEditNote && !t.isCancelled
										? () => onEditNote(t.note.id, t.note.content)
										: undefined
								}
								onCancel={() => handleCancelNote(t.note.id)}
								onRevert={() => handleRevertNote(t.note.id)}
								onJump={
									t.appointmentId && !t.isCurrent
										? () =>
												router.push(
													`/appointments/${t.bookingRef ?? t.appointmentId}`,
												)
										: undefined
								}
							/>
						),
					)
				)}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  FollowUpHistoryPanel                                              */
/* ------------------------------------------------------------------ */

export type FollowUpThread = {
	id: string;
	date: Date;
	followUp: FollowUpWithRefs;
	bookingRef: string | null;
	outletCode: string | null;
	serviceSummary: ServiceChip[];
	appointmentDate: Date | null;
	appointmentId: string | null;
	isCurrent: boolean;
	isPinned: boolean;
};

type FollowUpHistoryPanelProps = {
	scope: HistoryScope;
	followUps: FollowUpWithRefs[];
	customerHistory: CustomerAppointmentSummary[];
	customerBillingHistory?: CustomerLineItem[];
	currentAppointmentLineItems?: AppointmentLineItem[];
	onToast: (message: string, variant?: Toast["variant"]) => void;
	onEdit: (followUp: FollowUpWithRefs) => void;
};

export function FollowUpHistoryPanel({
	scope,
	followUps,
	customerHistory,
	customerBillingHistory,
	currentAppointmentLineItems,
	onToast,
	onEdit,
}: FollowUpHistoryPanelProps) {
	const router = useRouter();
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const currentAppointmentId =
		scope.kind === "appointment" ? scope.appointmentId : null;

	const threads = useMemo<FollowUpThread[]>(() => {
		const meta = buildMetaByAppointment(
			customerHistory,
			customerBillingHistory ?? [],
			currentAppointmentId,
			currentAppointmentLineItems,
		);
		return followUps
			.map((f) => {
				const m = f.appointment_id ? meta.get(f.appointment_id) : null;
				return {
					id: `f-${f.id}`,
					date: new Date(f.created_at),
					followUp: f,
					appointmentId: f.appointment_id,
					bookingRef: m?.bookingRef ?? null,
					outletCode: m?.outletCode ?? null,
					serviceSummary: m?.serviceSummary ?? [],
					appointmentDate: m?.startAt ?? null,
					isCurrent:
						f.appointment_id != null &&
						f.appointment_id === currentAppointmentId,
					isPinned: f.is_pinned,
				};
			})
			.sort((a, b) => {
				const aPinned = a.isPinned ? 1 : 0;
				const bPinned = b.isPinned ? 1 : 0;
				if (aPinned !== bPinned) return bPinned - aPinned;
				return b.date.getTime() - a.date.getTime();
			});
	}, [
		followUps,
		customerHistory,
		customerBillingHistory,
		currentAppointmentLineItems,
		currentAppointmentId,
	]);

	const allCollapsed =
		threads.length > 0 && threads.every((t) => collapsedIds.has(t.id));

	const toggleCollapse = (id: string) =>
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const toggleAll = () => {
		if (allCollapsed) setCollapsedIds(new Set());
		else setCollapsedIds(new Set(threads.map((t) => t.id)));
	};

	const handleTogglePin = (followUpId: string, currentPinned: boolean) => {
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await setFollowUpPinAction(
						scope.appointmentId,
						followUpId,
						!currentPinned,
					);
				} else {
					await setCustomerFollowUpPinAction(
						scope.customerId,
						followUpId,
						!currentPinned,
					);
				}
				onToast(currentPinned ? "Unpinned" : "Pinned to top", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not update pin",
					"error",
				);
			}
		});
	};

	const handleDelete = () => {
		if (!deleteId) return;
		startTransition(async () => {
			try {
				if (scope.kind === "appointment") {
					await deleteFollowUpAction(scope.appointmentId, deleteId);
				} else {
					await deleteCustomerFollowUpAction(scope.customerId, deleteId);
				}
				setDeleteId(null);
				onToast("Follow-up deleted", "success");
				router.refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not delete follow-up",
					"error",
				);
			}
		});
	};

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-md border bg-card">
			<div className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
				<div className="font-bold text-[12px] text-foreground tracking-wide">
					FOLLOW-UPS
				</div>
				<div className="ml-auto flex items-center gap-1">
					<div
						title={`${threads.length} follow-up${threads.length === 1 ? "" : "s"}`}
						className="flex h-7 items-center gap-1 rounded border border-violet-300 bg-violet-50 px-1.5 font-semibold text-[10px] text-violet-700"
					>
						<Layers className="size-[14px]" />
						<span className="tabular-nums">{threads.length}</span>
					</div>
					<button
						type="button"
						aria-label={allCollapsed ? "Expand all" : "Collapse all"}
						title={allCollapsed ? "Expand all" : "Collapse all"}
						onClick={toggleAll}
						disabled={threads.length === 0}
						className="flex size-7 items-center justify-center rounded border border-border bg-muted/40 text-muted-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
					>
						{allCollapsed ? (
							<Maximize2 className="size-[14px]" />
						) : (
							<Minimize2 className="size-[14px]" />
						)}
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{threads.length === 0 ? (
					<div className="p-5 text-center text-muted-foreground text-sm">
						No follow-ups yet
					</div>
				) : (
					threads.map((t) => (
						<FollowUpRow
							key={t.id}
							item={t}
							collapsed={collapsedIds.has(t.id)}
							onToggle={() => toggleCollapse(t.id)}
							onTogglePin={() => handleTogglePin(t.followUp.id, t.isPinned)}
							onEdit={() => onEdit(t.followUp)}
							onDelete={() => setDeleteId(t.followUp.id)}
							onJump={
								t.isCurrent || t.appointmentId == null
									? undefined
									: () =>
											router.push(
												`/appointments/${t.bookingRef ?? t.appointmentId}`,
											)
							}
						/>
					))
				)}
			</div>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(o) => !o && setDeleteId(null)}
				title="Delete this follow-up?"
				description="This removes the follow-up permanently."
				confirmLabel="Delete"
				pending={pending}
				onConfirm={handleDelete}
			/>
		</div>
	);
}

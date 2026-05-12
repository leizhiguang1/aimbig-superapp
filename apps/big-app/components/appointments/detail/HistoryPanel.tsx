"use client";

import { Layers, Maximize2, Minimize2, Receipt, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Toast } from "@/components/appointments/AppointmentToastStack";
import { BillingRow } from "@/components/appointments/detail/BillingRow";
import { buildThreads } from "@/components/appointments/detail/history/threads";
import type {
	HistoryMode,
	HistoryScope,
} from "@/components/appointments/detail/history/types";
import { NoteRow } from "@/components/appointments/detail/NoteRow";
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
import type {
	AppointmentLineItem,
	CustomerLineItem,
} from "@/lib/services/appointment-line-items";
import type { CustomerAppointmentSummary } from "@/lib/services/appointments";
import type { CaseNoteWithContext } from "@/lib/services/case-notes";
import { cn } from "@/lib/utils";

type Props = {
	scope: HistoryScope;
	caseNotes: CaseNoteWithContext[];
	customerBillingHistory: CustomerLineItem[];
	customerHistory: CustomerAppointmentSummary[];
	currentAppointmentLineItems?: AppointmentLineItem[];
	onToast: (message: string, variant?: Toast["variant"]) => void;
	onEditNote?: (noteId: string, content: string) => void;
};

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
	const [, startTransition] = useTransition();
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

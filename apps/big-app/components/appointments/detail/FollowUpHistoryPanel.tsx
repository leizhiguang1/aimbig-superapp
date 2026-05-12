"use client";

import { Layers, Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Toast } from "@/components/appointments/AppointmentToastStack";
import { FollowUpRow } from "@/components/appointments/detail/FollowUpRow";
import { buildMetaByAppointment } from "@/components/appointments/detail/history/threads";
import type {
	FollowUpThread,
	HistoryScope,
} from "@/components/appointments/detail/history/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	deleteCustomerFollowUpAction,
	deleteFollowUpAction,
	setCustomerFollowUpPinAction,
	setFollowUpPinAction,
} from "@/lib/actions/follow-ups";
import type {
	AppointmentLineItem,
	CustomerLineItem,
} from "@/lib/services/appointment-line-items";
import type { CustomerAppointmentSummary } from "@/lib/services/appointments";
import type { FollowUpWithRefs } from "@/lib/services/follow-ups";

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

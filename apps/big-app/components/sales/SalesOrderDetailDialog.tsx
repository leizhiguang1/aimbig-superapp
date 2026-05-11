"use client";

import { Ban, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { redistribute } from "@/components/appointments/detail/collect-payment/helpers";
import type { Allocation } from "@/components/appointments/detail/collect-payment/types";
import { usePermission } from "@/components/auth/PermissionsProvider";
import { ChangePaymentMethodDialog } from "@/components/sales/ChangePaymentMethodDialog";
import { PayOutstandingDialog } from "@/components/sales/PayOutstandingDialog";
import {
	LeftPanel,
	LoadingSkeleton,
	RightPanel,
} from "@/components/sales/SalesOrderDetailParts";
import { VoidSalesOrderDialog } from "@/components/sales/VoidSalesOrderDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	getSalesOrderDetailAction,
	replaceSaleItemIncentivesAction,
	type SalesOrderDetailResult,
} from "@/lib/actions/sales";
import type { EmployeeWithRelations } from "@/lib/services/employees";
import type {
	PaymentWithProcessedBy,
	SaleItem,
	SaleItemIncentiveRow,
	SalesOrderWithRelations,
} from "@/lib/services/sales";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	salesOrderId: string | null;
};

type LoadState =
	| { status: "idle" }
	| { status: "loading" }
	| {
			status: "ready";
			order: SalesOrderWithRelations;
			items: SaleItem[];
			payments: PaymentWithProcessedBy[];
			incentives: SaleItemIncentiveRow[];
			employees: EmployeeWithRelations[];
	  }
	| { status: "not_found" }
	| { status: "error"; message: string };

export function SalesOrderDetailDialog({
	open,
	onOpenChange,
	salesOrderId,
}: Props) {
	const router = useRouter();
	const canCreateSales = usePermission("sales.create_sales");
	const [state, setState] = useState<LoadState>({ status: "idle" });
	const [voidOpen, setVoidOpen] = useState(false);
	const [recordPayOpen, setRecordPayOpen] = useState(false);
	const [changeMethodPayment, setChangeMethodPayment] =
		useState<PaymentWithProcessedBy | null>(null);
	const [editAllocMode, setEditAllocMode] = useState(false);
	const [editSlots, setEditSlots] = useState<Map<string, Allocation[]>>(
		() => new Map(),
	);
	const [isSavingAlloc, startSaveAlloc] = useTransition();
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	const reload = () => {
		setReloadKey((k) => k + 1);
		router.refresh();
	};

	const buildEditSlotsFromIncentives = (
		items: SaleItem[],
		incentives: SaleItemIncentiveRow[],
		fallbackEmployeeId: string | null,
	): Map<string, Allocation[]> => {
		const map = new Map<string, Allocation[]>();
		for (const item of items) {
			const lineIncentives = incentives.filter(
				(i) => i.sale_item_id === item.id,
			);
			const slots: Allocation[] = [];
			for (let i = 0; i < 3; i++) {
				const inc = lineIncentives[i];
				slots.push({
					employeeId: inc?.employee_id ?? "",
					percent: inc ? Number(inc.percent) : 0,
				});
			}
			if (lineIncentives.length === 0 && fallbackEmployeeId) {
				slots[0] = { employeeId: fallbackEmployeeId, percent: 100 };
			}
			map.set(item.id, slots);
		}
		return map;
	};

	const setLineEmployee = (
		lineId: string,
		idx: number,
		empId: string | null,
	) => {
		setEditSlots((prev) => {
			const cur = prev.get(lineId) ?? [
				{ employeeId: "", percent: 0 },
				{ employeeId: "", percent: 0 },
				{ employeeId: "", percent: 0 },
			];
			const next = redistribute(
				cur.map((a, i) => (i === idx ? { ...a, employeeId: empId ?? "" } : a)),
			);
			return new Map(prev).set(lineId, next);
		});
	};

	const setLinePercent = (lineId: string, idx: number, pct: number) => {
		setEditSlots((prev) => {
			const cur = prev.get(lineId);
			if (!cur) return prev;
			const next = cur.map((a, i) => (i === idx ? { ...a, percent: pct } : a));
			return new Map(prev).set(lineId, next);
		});
	};

	const applyLineToAll = (fromLineId: string) => {
		setEditSlots((prev) => {
			const source = prev.get(fromLineId);
			if (!source) return prev;
			const next = new Map(prev);
			for (const key of next.keys()) {
				next.set(
					key,
					source.map((a) => ({ ...a })),
				);
			}
			return next;
		});
	};

	const balanceLine = (lineId: string) => {
		setEditSlots((prev) => {
			const cur = prev.get(lineId);
			if (!cur) return prev;
			const filledIdx = cur.findIndex((a) => a.employeeId);
			if (filledIdx === -1) return prev;
			const sum = cur
				.filter((a) => a.employeeId)
				.reduce((s, a) => s + (a.percent || 0), 0);
			const delta = 100 - sum;
			const next = cur.map((a, i) =>
				i === filledIdx
					? {
							...a,
							percent: Math.max(0, Math.min(100, (a.percent || 0) + delta)),
						}
					: a,
			);
			return new Map(prev).set(lineId, next);
		});
	};

	useEffect(() => {
		if (!open || !salesOrderId) {
			setState({ status: "idle" });
			setFeedback(null);
			setEditAllocMode(false);
			setEditSlots(new Map());
			return;
		}
		let cancelled = false;
		setState((prev) =>
			prev.status === "ready" ? prev : { status: "loading" },
		);
		getSalesOrderDetailAction(salesOrderId)
			.then((res: SalesOrderDetailResult) => {
				if (cancelled) return;
				if (!res.ok) {
					setState({ status: "not_found" });
					return;
				}
				setState({
					status: "ready",
					order: res.order,
					items: res.items,
					payments: res.payments,
					incentives: res.incentives,
					employees: res.employees,
				});
			})
			.catch((err) => {
				if (cancelled) return;
				setState({
					status: "error",
					message: err instanceof Error ? err.message : "Failed to load order",
				});
			});
		return () => {
			cancelled = true;
		};
	}, [open, salesOrderId, reloadKey]);

	const order = state.status === "ready" ? state.order : null;
	const isCancellable =
		order !== null &&
		(order.status === "completed" || order.status === "draft");
	const isCancelled = order?.status === "cancelled";
	const appointmentRef = order?.appointment?.booking_ref ?? null;
	const outstanding = Number(order?.outstanding ?? 0);
	const canRecordPayment =
		order !== null && !isCancelled && outstanding > 0.005;

	const startEditAlloc = () => {
		if (state.status !== "ready") return;
		setEditSlots(
			buildEditSlotsFromIncentives(
				state.items,
				state.incentives,
				state.order.consultant?.id ?? null,
			),
		);
		setFeedback(null);
		setEditAllocMode(true);
	};

	const cancelEditAlloc = () => {
		setEditAllocMode(false);
		setEditSlots(new Map());
	};

	const saveEditAlloc = () => {
		if (state.status !== "ready" || !salesOrderId) return;
		for (const [lineId, slots] of editSlots.entries()) {
			const filled = slots.filter((a) => a.employeeId);
			if (filled.length === 0) continue;
			const sum = filled.reduce((s, a) => s + (a.percent || 0), 0);
			if (Math.abs(sum - 100) > 0.01) {
				const item = state.items.find((it) => it.id === lineId);
				setFeedback({
					type: "error",
					message: `${item?.item_name ?? "An item"} allocation must sum to 100%`,
				});
				return;
			}
		}
		startSaveAlloc(async () => {
			try {
				await Promise.all(
					Array.from(editSlots.entries()).map(([lineId, slots]) => {
						const filled = slots.filter((a) => a.employeeId);
						return replaceSaleItemIncentivesAction(
							salesOrderId,
							{
								sale_item_id: lineId,
								employees: filled.map((a) => ({
									employee_id: a.employeeId,
									percent: a.percent,
								})),
							},
							appointmentRef,
						);
					}),
				);
				setFeedback({ type: "success", message: "Allocation updated" });
				setEditAllocMode(false);
				setEditSlots(new Map());
				reload();
			} catch (err) {
				setFeedback({
					type: "error",
					message:
						err instanceof Error ? err.message : "Failed to save allocation",
				});
			}
		});
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
					<DialogHeader className="sr-only">
						<DialogTitle>Sales order detail</DialogTitle>
						<DialogDescription>
							Items, payment details and payment history for this sales order.
						</DialogDescription>
					</DialogHeader>
					{order !== null && (
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-white px-4 py-2.5 sm:px-6">
							<span className="font-mono font-semibold text-base">
								{order.so_number}
							</span>
							{order.outlet && (
								<span className="text-muted-foreground text-xs">
									<span className="font-mono font-medium uppercase">
										{order.outlet.code}
									</span>{" "}
									· {order.outlet.name}
								</span>
							)}
						</div>
					)}
					{order?.status === "cancelled" && (
						<div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5 text-red-800 text-sm sm:px-6">
							<Ban className="size-4 shrink-0" />
							<span className="font-semibold uppercase tracking-wide">
								Voided
							</span>
							<span className="text-red-700/80">
								· This sales order has been cancelled.
							</span>
						</div>
					)}
					<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4 sm:flex-row sm:p-6">
						{state.status === "loading" && <LoadingSkeleton />}
						{state.status === "not_found" && (
							<div className="flex flex-1 items-center justify-center rounded-md border bg-white p-12 text-muted-foreground text-sm">
								Sales order not found.
							</div>
						)}
						{state.status === "error" && (
							<div className="flex flex-1 items-center justify-center rounded-md border border-red-200 bg-red-50 p-12 text-red-800 text-sm">
								{state.message}
							</div>
						)}
						{state.status === "ready" && (
							<TooltipProvider delayDuration={200}>
								<LeftPanel
									order={state.order}
									items={state.items}
									incentives={state.incentives}
									employees={state.employees}
									isCancelled={isCancelled}
									editAllocMode={editAllocMode}
									editSlots={editSlots}
									isSavingAlloc={isSavingAlloc}
									onStartEditAlloc={startEditAlloc}
									onCancelEditAlloc={cancelEditAlloc}
									onSaveEditAlloc={saveEditAlloc}
									onLineEmployeeChange={setLineEmployee}
									onLinePercentChange={setLinePercent}
									onLineBalance={balanceLine}
									onLineApplyToAll={applyLineToAll}
									canApplyToAll={state.items.length > 1}
								/>
								<RightPanel
									order={state.order}
									payments={state.payments}
									isCancelled={isCancelled}
									onChangeMethod={setChangeMethodPayment}
									onPayNow={() => {
										setFeedback(null);
										setRecordPayOpen(true);
									}}
								/>
							</TooltipProvider>
						)}
					</div>
					{order !== null && (
						<div className="flex flex-col gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
							<div className="min-h-[20px] text-sm">
								{feedback && (
									<span
										className={
											feedback.type === "success"
												? "text-green-700"
												: "text-red-700"
										}
									>
										{feedback.message}
									</span>
								)}
								{!feedback && order.status === "cancelled" && (
									<span className="text-muted-foreground">
										This sales order is cancelled.
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 self-end sm:self-auto">
								{canCreateSales && canRecordPayment && (
									<Button
										size="sm"
										className="bg-green-600 text-white hover:bg-green-700"
										onClick={() => {
											setFeedback(null);
											setRecordPayOpen(true);
										}}
									>
										<CreditCard className="mr-2 size-4" />
										Pay Now
									</Button>
								)}
								{canCreateSales && isCancellable && (
									<Button
										variant="outline"
										size="sm"
										className="text-red-600 hover:bg-red-50 hover:text-red-700"
										onClick={() => {
											setFeedback(null);
											setVoidOpen(true);
										}}
									>
										<Ban className="mr-2 size-4" />
										Void
									</Button>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{state.status === "ready" && (
				<>
					<VoidSalesOrderDialog
						open={voidOpen}
						onOpenChange={setVoidOpen}
						salesOrderId={state.order.id}
						soNumber={state.order.so_number}
						outletName={state.order.outlet?.name ?? null}
						orderTotal={Number(state.order.total ?? 0)}
						amountPaid={Number(state.order.amount_paid ?? 0)}
						writeOffPaid={state.payments
							.filter((p) => p.payment_mode === "WRITEOFF")
							.reduce((s, p) => s + Number(p.amount), 0)}
						items={state.items}
						onSuccess={({ cnNumber, rnNumber, returnAmount }) => {
							setFeedback({
								type: "success",
								message: `Voided. CN ${cnNumber} · RN ${rnNumber} · Return MYR ${returnAmount.toFixed(2)}`,
							});
							setReloadKey((k) => k + 1);
							router.refresh();
						}}
						onError={(msg) => setFeedback({ type: "error", message: msg })}
					/>
					<ChangePaymentMethodDialog
						open={changeMethodPayment != null}
						onOpenChange={(v) => {
							if (!v) setChangeMethodPayment(null);
						}}
						salesOrderId={state.order.id}
						appointmentRef={appointmentRef}
						payment={changeMethodPayment}
						onSuccess={(msg) => {
							setFeedback({ type: "success", message: msg });
							reload();
						}}
						onError={(msg) => setFeedback({ type: "error", message: msg })}
					/>
					<PayOutstandingDialog
						open={recordPayOpen}
						onOpenChange={setRecordPayOpen}
						salesOrderId={state.order.id}
						soNumber={state.order.so_number}
						outstanding={outstanding}
						total={Number(state.order.total ?? 0)}
						amountPaid={Number(state.order.amount_paid ?? 0)}
						items={state.items}
						existingPayments={state.payments}
						incentives={state.incentives}
						outletName={state.order.outlet?.name ?? null}
						appointmentRef={appointmentRef}
						onSuccess={(msg) => {
							setFeedback({ type: "success", message: msg });
							reload();
						}}
						onError={(msg) => setFeedback({ type: "error", message: msg })}
					/>
				</>
			)}
		</>
	);
}

"use client";

import { ExternalLink, Pin, PinOff, RotateCcw, XCircle } from "lucide-react";
import { ContextHeader } from "@/components/appointments/detail/HistoryPanel";
import type { BillingThread } from "@/components/appointments/detail/HistoryPanel";
import { IconBtn } from "@/components/appointments/detail/IconBtn";
import { usePermission } from "@/components/auth/PermissionsProvider";
import {
	APPOINTMENT_PAYMENT_MODE_LABEL,
	type AppointmentPaymentMode,
} from "@/lib/constants/appointment-status";
import { cn } from "@/lib/utils";
import {
	formatDateTime24,
	formatHeaderDate,
	formatHeaderTime,
} from "@/lib/utils/format-date";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
	paid: "bg-emerald-600 text-white",
	partial: "bg-amber-500 text-white",
	unpaid: "bg-slate-400 text-white",
};

function paymentModeLabel(mode: string | null): string | null {
	if (!mode) return null;
	return APPOINTMENT_PAYMENT_MODE_LABEL[mode as AppointmentPaymentMode] ?? mode;
}

type Props = {
	item: BillingThread;
	collapsed: boolean;
	pinned: boolean;
	onToggle: () => void;
	onTogglePin: () => void;
	onCancel: () => void;
	onRevert: () => void;
	onJump?: () => void;
};

export function BillingRow({
	item,
	collapsed,
	pinned,
	onToggle,
	onTogglePin,
	onCancel,
	onRevert,
	onJump,
}: Props) {
	const canRevert = usePermission("appointments.revert_appointment");
	const paymentStatusClass =
		PAYMENT_STATUS_STYLES[item.paymentStatus] ?? "bg-slate-400 text-white";
	const payMode = paymentModeLabel(item.paidVia);
	const cancelled = item.isCancelled;

	return (
		<div
			className={cn(
				"border-b border-border/60 bg-card px-2 py-2",
				item.isCurrent &&
					"border-l-[3px] border-l-emerald-600 bg-emerald-50/40",
				pinned && !cancelled && "bg-amber-50/50",
				cancelled && "opacity-60",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<button
					type="button"
					onClick={onToggle}
					aria-expanded={!collapsed}
					className="min-w-0 flex-1 text-left"
				>
					<div
						className={cn(
							"font-bold text-[12px] text-foreground",
							cancelled && "line-through",
						)}
					>
						{formatHeaderDate(item.date)}
					</div>
					<div className="text-[10px] text-muted-foreground">
						{formatHeaderTime(item.date)}
					</div>
				</button>
				<div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
					{pinned && <Pin className="size-[10px] text-amber-600" />}
					{cancelled && (
						<span className="rounded bg-slate-400 px-1.5 py-px font-bold text-[9px] text-white">
							CANCELLED
						</span>
					)}
					{!cancelled && (
						<span
							className={cn(
								"rounded px-1.5 py-px font-bold text-[9px] uppercase tracking-wide",
								paymentStatusClass,
							)}
						>
							{item.paymentStatus}
						</span>
					)}
					<IconBtn
						label={pinned ? "Unpin" : "Pin to top"}
						onClick={onTogglePin}
						className={
							pinned
								? "bg-amber-500 text-white hover:bg-amber-600"
								: "border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
						}
					>
						{pinned ? (
							<PinOff className="size-[11px]" />
						) : (
							<Pin className="size-[11px]" />
						)}
					</IconBtn>
					{onJump && (
						<IconBtn
							label="Go to appointment"
							onClick={onJump}
							className="bg-emerald-500 text-white hover:bg-emerald-600"
						>
							<ExternalLink className="size-[11px]" />
						</IconBtn>
					)}
					{canRevert ? (
						cancelled ? (
							<IconBtn
								label="Restore billing"
								onClick={onRevert}
								className="bg-blue-500 text-white hover:bg-blue-600"
							>
								<RotateCcw className="size-[11px]" />
							</IconBtn>
						) : (
							<IconBtn
								label="Cancel billing"
								onClick={onCancel}
								className="bg-rose-500 text-white hover:bg-rose-600"
							>
								<XCircle className="size-[11px]" />
							</IconBtn>
						)
					) : null}
				</div>
			</div>

			<ContextHeader
				bookingRef={item.bookingRef}
				outletCode={item.outletCode}
				date={item.date}
				serviceSummary={item.serviceSummary}
				onJump={onJump}
			/>

			{!collapsed && (
				<>
					<dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px]">
						{item.salesOrderNumber && (
							<>
								<dt className="text-muted-foreground">Sales Order # :</dt>
								<dd className="text-right font-bold tabular-nums">
									{item.salesOrderNumber}
								</dd>
							</>
						)}
						<dt className="text-muted-foreground">Date :</dt>
						<dd className="text-right tabular-nums">
							{formatDateTime24(item.date)}
						</dd>
						{item.servedBy && (
							<>
								<dt className="text-muted-foreground">Served By :</dt>
								<dd className="truncate text-right uppercase tracking-wide">
									{item.servedBy}
								</dd>
							</>
						)}
					</dl>

					<div className="mt-2 grid grid-cols-[minmax(0,1fr)_38px_24px_52px_52px_52px] gap-x-1 border-border border-b pb-1 font-semibold text-[9px] text-muted-foreground uppercase leading-tight tracking-wide">
						<span>Description</span>
						<span className="text-center">Item Code</span>
						<span className="text-center">Qty</span>
						<span className="text-right">U/Price</span>
						<span className="text-right">Discount</span>
						<span className="text-right">Amount</span>
					</div>
					<div className="divide-y divide-border/40">
						{item.items.map((bi) => {
							const qty = Number(bi.quantity);
							const price = Number(bi.unit_price);
							const lineTotal = Number(bi.total ?? qty * price);
							const discount = Math.max(0, qty * price - lineTotal);
							const itemCancelled = bi.is_cancelled;
							return (
								<div
									key={bi.id}
									className={cn(
										"grid grid-cols-[minmax(0,1fr)_38px_24px_52px_52px_52px] gap-x-1 py-1.5 text-[11px] leading-tight",
										itemCancelled && "line-through opacity-50",
									)}
								>
									<div className="min-w-0 wrap-break-word">
										{bi.description}
									</div>
									<div className="break-all text-center text-[10px] text-muted-foreground tabular-nums">
										{bi.service?.sku ?? "—"}
									</div>
									<div className="text-center tabular-nums">
										{qty % 1 === 0 ? qty : qty.toFixed(2)}
									</div>
									<div className="text-right tabular-nums">
										{price.toFixed(2)}
									</div>
									<div className="text-right tabular-nums">
										<div>{discount.toFixed(2)}</div>
										<div className="wrap-break-word text-[9px] text-muted-foreground">
											(LOCAL 0%): 0.00
										</div>
									</div>
									<div className="text-right font-semibold tabular-nums">
										{lineTotal.toFixed(2)}
									</div>
								</div>
							);
						})}
					</div>

					<dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 text-[11px]">
						<dt className="font-bold uppercase tracking-wide">
							Sub Total (MYR)
						</dt>
						<dd
							className={cn(
								"text-right font-bold tabular-nums",
								cancelled && "line-through",
							)}
						>
							{item.total.toFixed(2)}
						</dd>
					</dl>

					<div className="mt-2">
						<div className="border-foreground/40 border-b pb-0.5 font-semibold text-[10px] uppercase tracking-wide">
							Discounts
						</div>
						<dl className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 text-[11px]">
							<dt className="text-muted-foreground">Voucher (MYR)</dt>
							<dd className="text-right tabular-nums">0.00</dd>
						</dl>
					</div>

					<dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 text-[11px]">
						<dt className="font-bold uppercase tracking-wide">
							Gross Total (MYR)
						</dt>
						<dd
							className={cn(
								"text-right font-bold tabular-nums",
								cancelled && "line-through",
							)}
						>
							{item.total.toFixed(2)}
						</dd>
					</dl>

					<div className="mt-2">
						<div className="border-foreground/40 border-b pb-0.5 font-semibold text-[10px] uppercase tracking-wide">
							Payment Details
						</div>
						<dl className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 text-[11px]">
							<dt className="text-muted-foreground">
								Tendered Amount (before Tax) (MYR)
							</dt>
							<dd
								className={cn(
									"text-right tabular-nums",
									cancelled && "line-through",
								)}
							>
								{item.total.toFixed(2)}
							</dd>
							<dt className="text-muted-foreground">Total Tax Amount (MYR)</dt>
							<dd className="text-right tabular-nums">0.00</dd>
							<dt className="text-muted-foreground">Payment Type</dt>
							<dd className="text-right">{payMode ?? "—"}</dd>
						</dl>
					</div>
				</>
			)}

			{collapsed && (
				<div className="mt-2 flex justify-between text-[11px]">
					<span className="text-muted-foreground">
						{item.items.length} line{item.items.length !== 1 ? "s" : ""}
						{payMode && !cancelled && ` · ${payMode}`}
					</span>
					<span
						className={cn(
							"font-bold tabular-nums",
							cancelled && "line-through",
						)}
					>
						RM {item.total.toFixed(2)}
					</span>
				</div>
			)}
		</div>
	);
}

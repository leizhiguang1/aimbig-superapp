"use client";

import { UserRound, X } from "lucide-react";
import { money } from "@/components/appointments/detail/collect-payment/helpers";
import type { Allocation } from "@/components/appointments/detail/collect-payment/types";
import { Toggle } from "@/components/appointments/detail/collect-payment/ui-primitives";
import { EmployeePicker } from "@/components/employees/EmployeePicker";
import { PercentInput } from "@/components/ui/numeric-input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CustomerWithRelations } from "@/lib/services/customers";
import type { EmployeeWithRelations } from "@/lib/services/employees";
import type { OutletWithRoomCount } from "@/lib/services/outlets";
import { cn } from "@/lib/utils";

type Props = {
	customer: CustomerWithRelations | null;
	onClearCustomer: () => void;
	onOpenCustomerPicker: () => void;
	outlets: OutletWithRoomCount[];
	outletId: string | null;
	onOutletChange: (id: string) => void;
	employees: EmployeeWithRelations[];
	total: number;
	itemized: boolean;
	onItemizedChange: (v: boolean) => void;
	globalAlloc: Allocation[];
	onGlobalEmpChange: (idx: number, empId: string | null) => void;
	onGlobalPercentChange: (idx: number, pct: number) => void;
	onBalanceGlobal: () => void;
	onClose: () => void;
	closeDisabled: boolean;
};

export function WalkInHeader({
	customer,
	onClearCustomer,
	onOpenCustomerPicker,
	outlets,
	outletId,
	onOutletChange,
	employees,
	total,
	itemized,
	onItemizedChange,
	globalAlloc,
	onGlobalEmpChange,
	onGlobalPercentChange,
	onBalanceGlobal,
	onClose,
	closeDisabled,
}: Props) {
	const customerName = customer
		? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
			"Customer"
		: null;

	const filled = globalAlloc.filter((a) => a.employeeId);
	const allocSum = filled.reduce((s, a) => s + a.percent, 0);
	const sumInvalid = filled.length > 0 && Math.abs(allocSum - 100) > 0.01;

	return (
		<div className="shrink-0 border-b bg-white">
			{/* Row 1: customer + total + close */}
			<div className="flex items-start gap-3 px-5 pt-3 pb-2">
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
						New sale
					</div>
					{customer ? (
						<div className="mt-0.5 flex items-center gap-2">
							<button
								type="button"
								onClick={onOpenCustomerPicker}
								className="group flex min-w-0 items-center gap-2 text-left"
							>
								<span className="truncate text-lg font-semibold tracking-wide text-blue-600 group-hover:underline">
									{(customerName ?? "Customer").toUpperCase()}
								</span>
								<span className="shrink-0 text-xs text-muted-foreground">
									{customer.code}
								</span>
							</button>
							<button
								type="button"
								onClick={onClearCustomer}
								className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								aria-label="Clear customer"
							>
								<X className="size-3" />
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={onOpenCustomerPicker}
							className="mt-1 inline-flex items-center gap-2 rounded-md border-2 border-dashed border-blue-400 bg-blue-50 px-4 py-2 text-base font-semibold text-blue-700 shadow-sm hover:border-blue-500 hover:bg-blue-100"
						>
							<UserRound className="size-5" />
							Select customer
						</button>
					)}
					<div className="mt-0.5 text-xs text-muted-foreground">
						MYR {money(total)}
					</div>
				</div>

				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={onClose}
								disabled={closeDisabled}
								aria-label="Close"
								className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
							>
								<X className="size-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Close</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			{/* Row 2: outlet + itemised toggle + employee allocation */}
			<div className="flex flex-wrap items-end gap-x-4 gap-y-2 px-5 pb-3">
				<label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
					Outlet
					<select
						value={outletId ?? ""}
						onChange={(e) => onOutletChange(e.target.value)}
						className="h-8 w-40 rounded-md border bg-background px-2 text-xs outline-none focus-visible:border-ring"
					>
						{outlets.map((o) => (
							<option key={o.id} value={o.id}>
								{o.name}
							</option>
						))}
					</select>
				</label>

				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">Itemised?</span>
					<Toggle checked={itemized} onCheckedChange={onItemizedChange} />
				</div>

				<div
					className={cn("flex items-end gap-2", itemized && "invisible")}
					aria-hidden={itemized}
				>
					{globalAlloc.map((slot, idx) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed 3-slot array
							key={`walkin-global-${idx}`}
							className="flex flex-col items-center gap-1"
						>
							<EmployeePicker
								employees={employees}
								value={slot.employeeId || null}
								onChange={(id) => onGlobalEmpChange(idx, id)}
								size="sm"
								placeholder={`Employee ${idx + 1}`}
							/>
							{slot.employeeId ? (
								<div className="flex items-center gap-0.5">
									<PercentInput
										value={slot.percent}
										onChange={(n) => onGlobalPercentChange(idx, n)}
										className="h-5 w-14 px-1 text-center text-[10px] tabular-nums"
										aria-label="Employee percent"
									/>
									<span className="text-[10px] text-muted-foreground">%</span>
								</div>
							) : (
								<div className="h-5" />
							)}
						</div>
					))}
					{filled.length > 0 && (
						<div className="flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground">
							<span className={cn(sumInvalid && "text-red-600 font-medium")}>
								{allocSum.toFixed(0)}%
							</span>
							{sumInvalid && (
								<button
									type="button"
									onClick={onBalanceGlobal}
									className="rounded border border-amber-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-amber-900 hover:bg-amber-50"
								>
									Balance
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

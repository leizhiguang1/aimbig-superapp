"use client";

import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { listActiveBrandConfigItemsAction } from "@/lib/actions/brand-config";
import { listActivePaymentMethodsAction } from "@/lib/actions/payment-methods";
import { voidSalesOrderAction } from "@/lib/actions/sales";
import type { BrandConfigItem } from "@/lib/services/brand-config";
import type { SaleItem } from "@/lib/services/sales";
import type { Tables } from "@/lib/supabase/types";
import { money } from "@/lib/utils/money";

type PaymentMethod = Tables<"payment_methods">;

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	salesOrderId: string;
	soNumber: string;
	outletName: string | null;
	orderTotal: number;
	amountPaid: number;
	writeOffPaid?: number;
	items: SaleItem[];
	onSuccess?: (result: {
		cnNumber: string | null;
		rnNumber: string | null;
		returnAmount: number;
	}) => void;
	onError?: (message: string) => void;
};

type Step = 1 | 2 | 3;

export function VoidSalesOrderDialog({
	open,
	onOpenChange,
	salesOrderId,
	soNumber,
	outletName,
	orderTotal,
	amountPaid,
	writeOffPaid = 0,
	items,
	onSuccess,
	onError,
}: Props) {
	const router = useRouter();
	const [step, setStep] = useState<Step>(1);
	const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
		new Set(),
	);
	const [reason, setReason] = useState<string>("");
	const [passcode, setPasscode] = useState("");
	const [returnMethod, setReturnMethod] = useState<string>("");
	const [includeAdminFee, setIncludeAdminFee] = useState(false);
	const [adminFee, setAdminFee] = useState<string>("0");
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
	const [voidReasons, setVoidReasons] = useState<BrandConfigItem[]>([]);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const nonVoidedItems = useMemo(
		() => items.filter((i) => !i.is_voided),
		[items],
	);

	useEffect(() => {
		if (!open) return;
		setStep(1);
		// Pre-select all non-voided items by default
		setSelectedItemIds(new Set(nonVoidedItems.map((i) => i.id)));
		setReason("");
		setPasscode("");
		setReturnMethod("");
		setIncludeAdminFee(false);
		setAdminFee("0");
		setSubmitError(null);
	}, [open, nonVoidedItems]);

	useEffect(() => {
		if (!open) return;
		listActivePaymentMethodsAction()
			.then(setPaymentMethods)
			.catch(() => setPaymentMethods([]));
		listActiveBrandConfigItemsAction("void_reason")
			.then(setVoidReasons)
			.catch(() => setVoidReasons([]));
	}, [open]);

	const adminFeeNum = Number.parseFloat(adminFee || "0") || 0;
	const effectiveAdminFee = includeAdminFee ? Math.max(0, adminFeeNum) : 0;

	const selectedTotal = useMemo(
		() =>
			items
				.filter((i) => selectedItemIds.has(i.id))
				.reduce(
					(sum, i) => sum + Number(i.total ?? 0) + Number(i.tax_amount ?? 0),
					0,
				),
		[items, selectedItemIds],
	);

	// Return amount mirrors the RPC formula:
	//   real_cash = amount_paid - wallet_paid - writeoff_paid  (non-refundable amounts)
	//   full void:   real_cash - admin
	//   partial void: real_cash - (so_total - selected_grand) - admin
	// writeOffPaid is the sum of WRITEOFF payment rows on this SO.
	const returnAmount = useMemo(
		() =>
			Math.max(
				0,
				amountPaid -
					writeOffPaid -
					(orderTotal - selectedTotal) -
					effectiveAdminFee,
			),
		[amountPaid, writeOffPaid, orderTotal, selectedTotal, effectiveAdminFee],
	);

	const isFullVoid =
		nonVoidedItems.length > 0 && selectedItemIds.size === nonVoidedItems.length;

	const canAdvanceFromItems = selectedItemIds.size > 0;
	const canSubmit =
		reason !== "" &&
		/^\d{4}$/.test(passcode) &&
		(returnAmount === 0 || returnMethod !== "") &&
		(!includeAdminFee || adminFeeNum >= 0);

	const toggleItem = (id: string, checked: boolean) => {
		setSelectedItemIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const toggleAll = (checked: boolean) => {
		setSelectedItemIds(
			checked ? new Set(nonVoidedItems.map((i) => i.id)) : new Set(),
		);
	};

	const submit = () => {
		if (!canSubmit) return;
		setSubmitError(null);
		startTransition(async () => {
			try {
				const result = await voidSalesOrderAction(salesOrderId, {
					reason,
					passcode,
					refund_method: returnMethod || "",
					include_admin_fee: includeAdminFee,
					admin_fee: effectiveAdminFee,
					sale_item_ids: Array.from(selectedItemIds),
				});
				if ("error" in result) {
					setSubmitError(result.error);
					onError?.(result.error);
					return;
				}
				onOpenChange(false);
				onSuccess?.({
					cnNumber: result.cnNumber,
					rnNumber: result.rnNumber,
					returnAmount: result.returnAmount,
				});
				router.refresh();
			} catch (e) {
				const msg =
					e instanceof Error ? e.message : "Failed to void sales order";
				setSubmitError(msg);
				onError?.(msg);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				preventOutsideClose
				className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl"
			>
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle className="text-center font-semibold text-red-700">
						{step === 1 && `Void Items for ${soNumber}`}
						{step === 2 && `Void ${soNumber} — Confirm`}
						{step === 3 && "Authorize Void"}
					</DialogTitle>
					<DialogDescription className="text-center text-xs">
						Step {step} of 3
						{outletName && (
							<>
								{" · "}
								Outlet: <span className="font-medium">{outletName}</span>
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-6 py-5">
					{submitError && (
						<div
							role="alert"
							className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm"
						>
							<AlertTriangle className="mt-0.5 size-4 shrink-0" />
							<span>{submitError}</span>
						</div>
					)}
					{step === 1 && (
						<Step1Items
							items={items}
							nonVoidedItems={nonVoidedItems}
							selectedIds={selectedItemIds}
							amountPaid={amountPaid}
							selectedTotal={selectedTotal}
							returnAmount={returnAmount}
							onToggle={toggleItem}
							onToggleAll={toggleAll}
						/>
					)}
					{step === 2 && (
						<Step2Confirm
							soNumber={soNumber}
							returnAmount={returnAmount}
							selectedTotal={selectedTotal}
							adminFee={effectiveAdminFee}
							isFullVoid={isFullVoid}
							selectedCount={selectedItemIds.size}
						/>
					)}
					{step === 3 && (
						<Step3Authorize
							outletName={outletName}
							reason={reason}
							setReason={setReason}
							passcode={passcode}
							setPasscode={(v) => {
								setPasscode(v);
								if (submitError) setSubmitError(null);
							}}
							returnMethod={returnMethod}
							setReturnMethod={setReturnMethod}
							paymentMethods={paymentMethods}
							voidReasons={voidReasons}
							includeAdminFee={includeAdminFee}
							setIncludeAdminFee={setIncludeAdminFee}
							adminFee={adminFee}
							setAdminFee={setAdminFee}
							returnAmount={returnAmount}
							disabled={isPending}
						/>
					)}
				</div>

				<DialogFooter className="border-t px-6 py-3">
					{step === 1 && (
						<Button
							type="button"
							variant="destructive"
							onClick={() => setStep(2)}
							disabled={!canAdvanceFromItems || isPending}
						>
							Next
						</Button>
					)}
					{step === 2 && (
						<>
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep(1)}
								disabled={isPending}
							>
								Back
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={() => setStep(3)}
								disabled={isPending}
							>
								Proceed
							</Button>
						</>
					)}
					{step === 3 && (
						<>
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep(2)}
								disabled={isPending}
							>
								Back
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={submit}
								disabled={!canSubmit || isPending}
							>
								{isPending ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Voiding…
									</>
								) : isFullVoid ? (
									"Void order"
								) : (
									`Void ${selectedItemIds.size} item${selectedItemIds.size !== 1 ? "s" : ""}`
								)}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function Step1Items({
	items,
	nonVoidedItems,
	selectedIds,
	amountPaid,
	selectedTotal,
	returnAmount,
	onToggle,
	onToggleAll,
}: {
	items: SaleItem[];
	nonVoidedItems: SaleItem[];
	selectedIds: Set<string>;
	amountPaid: number;
	selectedTotal: number;
	returnAmount: number;
	onToggle: (id: string, checked: boolean) => void;
	onToggleAll: (checked: boolean) => void;
}) {
	const allSelected =
		nonVoidedItems.length > 0 &&
		nonVoidedItems.every((i) => selectedIds.has(i.id));
	const someSelected = nonVoidedItems.some((i) => selectedIds.has(i.id));

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border">
				<div className="grid grid-cols-[1fr_80px_120px_40px] items-center border-b bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">
					<div>Item</div>
					<div className="text-right">Qty</div>
					<div className="text-right">Total (MYR)</div>
					<div className="flex justify-end">
						<Checkbox
							checked={
								allSelected ? true : someSelected ? "indeterminate" : false
							}
							onCheckedChange={(v) => onToggleAll(v === true)}
							aria-label="Select all items"
						/>
					</div>
				</div>
				<div className="divide-y">
					{items.map((item) => {
						const itemGrandTotal =
							Number(item.total ?? 0) + Number(item.tax_amount ?? 0);
						if (item.is_voided) {
							return (
								<div
									key={item.id}
									className="grid grid-cols-[1fr_80px_120px_40px] items-center px-4 py-3 text-sm opacity-50"
								>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium line-through">
												{item.item_name}
											</span>
											<span className="rounded border border-red-300 px-1 py-0.5 text-[10px] font-medium text-red-600 uppercase tracking-wide">
												Voided
											</span>
										</div>
										{item.sku && (
											<div className="text-[11px] text-muted-foreground">
												{item.sku}
											</div>
										)}
									</div>
									<div className="text-right tabular-nums line-through">
										{item.quantity}
									</div>
									<div className="text-right tabular-nums line-through">
										{money(itemGrandTotal)}
									</div>
									<div />
								</div>
							);
						}
						return (
							<div
								key={item.id}
								className="grid grid-cols-[1fr_80px_120px_40px] items-center px-4 py-3 text-sm"
							>
								<div>
									<div className="font-medium">{item.item_name}</div>
									{item.sku && (
										<div className="text-[11px] text-muted-foreground">
											{item.sku}
										</div>
									)}
								</div>
								<div className="text-right tabular-nums">{item.quantity}</div>
								<div className="text-right tabular-nums">
									{money(itemGrandTotal)}
								</div>
								<div className="flex justify-end">
									<Checkbox
										checked={selectedIds.has(item.id)}
										onCheckedChange={(v) => onToggle(item.id, v === true)}
										aria-label={`Void ${item.item_name}`}
									/>
								</div>
							</div>
						);
					})}
					{items.length === 0 && (
						<div className="px-4 py-6 text-center text-muted-foreground text-sm">
							No line items on this order.
						</div>
					)}
				</div>
				<div className="divide-y border-t bg-muted/20">
					<div className="flex items-center justify-between px-4 py-2 text-sm">
						<span className="text-muted-foreground">Amount paid</span>
						<span className="tabular-nums">MYR {money(amountPaid)}</span>
					</div>
					<div className="flex items-center justify-between px-4 py-2.5 text-sm">
						<span className="font-medium">Amount to return</span>
						<span className="font-semibold tabular-nums text-red-700">
							MYR {money(returnAmount)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function Step2Confirm({
	soNumber,
	returnAmount,
	selectedTotal,
	adminFee,
	isFullVoid,
	selectedCount,
}: {
	soNumber: string;
	returnAmount: number;
	selectedTotal: number;
	adminFee: number;
	isFullVoid: boolean;
	selectedCount: number;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-4 text-center">
			<AlertTriangle className="size-12 text-amber-500" />
			<p className="font-semibold text-lg">
				{returnAmount > 0
					? `MYR ${money(returnAmount)} will be returned to the customer.`
					: "No amount will be returned to the customer."}
			</p>
			<div className="space-y-1 text-muted-foreground text-sm">
				<p>The following will happen when you proceed:</p>
				<ol className="mt-2 list-decimal space-y-1 pl-6 text-left">
					<li>
						{isFullVoid ? (
							<>
								<span className="font-medium">{soNumber}</span> will be tagged
								as <span className="font-medium">Cancelled</span>.
							</>
						) : (
							<>
								<span className="font-medium">
									{selectedCount} item{selectedCount !== 1 ? "s" : ""}
								</span>{" "}
								will be voided. The order will remain active.
							</>
						)}
					</li>
					{returnAmount > 0 && (
						<li>
							A Return Note (RN-XXXXXX) will be generated for{" "}
							<span className="font-medium">MYR {money(returnAmount)}</span>
							{adminFee > 0 && <> (after MYR {money(adminFee)} admin fee)</>}.
						</li>
					)}
					<li>
						A Cancellation Note (CN-XXXXXX) will be created for{" "}
						<span className="font-medium">MYR {money(selectedTotal)}</span>.
					</li>
					<li>Product stock movements will be reversed.</li>
				</ol>
			</div>
			<p className="font-semibold text-red-600 text-sm">
				This cannot be reversed.
			</p>
		</div>
	);
}

function Step3Authorize({
	outletName,
	reason,
	setReason,
	passcode,
	setPasscode,
	returnMethod,
	setReturnMethod,
	paymentMethods,
	voidReasons,
	includeAdminFee,
	setIncludeAdminFee,
	adminFee,
	setAdminFee,
	returnAmount,
	disabled,
}: {
	outletName: string | null;
	reason: string;
	setReason: (v: string) => void;
	passcode: string;
	setPasscode: (v: string) => void;
	returnMethod: string;
	setReturnMethod: (v: string) => void;
	paymentMethods: PaymentMethod[];
	voidReasons: BrandConfigItem[];
	includeAdminFee: boolean;
	setIncludeAdminFee: (v: boolean) => void;
	adminFee: string;
	setAdminFee: (v: string) => void;
	returnAmount: number;
	disabled: boolean;
}) {
	return (
		<div className="space-y-4">
			<div>
				<Label htmlFor="void-passcode">
					Passcode <span className="text-red-500">*</span>
				</Label>
				<Input
					id="void-passcode"
					type="text"
					inputMode="numeric"
					pattern="\d{4}"
					maxLength={4}
					autoComplete="off"
					placeholder="4-digit code"
					value={passcode}
					onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
					disabled={disabled}
					className="mt-1.5 w-32 text-center font-mono text-base tracking-widest"
				/>
				<p className="mt-1 text-[11px] text-muted-foreground">
					Generate at <span className="font-medium">/passcode</span> with
					function [VOID/REVERT] Sales Order/Invoice for outlet{" "}
					<span className="font-medium">{outletName ?? "—"}</span>. Passcode is
					outlet-specific and single-use.
				</p>
			</div>

			<div>
				<Label htmlFor="void-reason">
					Remarks <span className="text-red-500">*</span>
				</Label>
				<Select value={reason} onValueChange={setReason} disabled={disabled}>
					<SelectTrigger id="void-reason" className="mt-1.5 w-full">
						<SelectValue placeholder="Please select a remark" />
					</SelectTrigger>
					<SelectContent>
						{voidReasons.map((r) => (
							<SelectItem key={r.code} value={r.code}>
								{r.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{returnAmount > 0 ? (
				<div>
					<Label htmlFor="return-method">
						Return MYR {money(returnAmount)} as{" "}
						<span className="text-red-500">*</span>
					</Label>
					<Select
						value={returnMethod}
						onValueChange={setReturnMethod}
						disabled={disabled}
					>
						<SelectTrigger id="return-method" className="mt-1.5 w-full">
							<SelectValue placeholder="Select return method" />
						</SelectTrigger>
						<SelectContent>
							{paymentMethods.map((pm) => (
								<SelectItem key={pm.code} value={pm.code}>
									{pm.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : (
				<div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 text-sm">
					<Info className="mt-0.5 size-4 shrink-0" />
					<span>
						No cash return for this void. The customer's outstanding balance
						will be reduced.
					</span>
				</div>
			)}

			<div className="rounded-md border p-3">
				<div className="flex items-center gap-2">
					<Checkbox
						id="include-admin-fee"
						checked={includeAdminFee}
						onCheckedChange={(v) => setIncludeAdminFee(v === true)}
						disabled={disabled}
					/>
					<Label htmlFor="include-admin-fee" className="font-medium text-sm">
						Include Admin Fee?
					</Label>
				</div>
				{includeAdminFee && (
					<div className="mt-2 pl-6">
						<Label htmlFor="admin-fee" className="text-xs">
							Admin fee (MYR)
						</Label>
						<Input
							id="admin-fee"
							type="number"
							min="0"
							step="0.01"
							value={adminFee}
							onChange={(e) => setAdminFee(e.target.value)}
							disabled={disabled}
							className="mt-1 w-32 tabular-nums"
						/>
						<p className="mt-1 text-[11px] text-muted-foreground">
							Deducted from the return amount.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

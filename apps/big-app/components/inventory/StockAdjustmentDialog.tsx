"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { recordStockMovementAction } from "@/lib/actions/inventory";
import {
	STOCK_ADJUSTMENT_REASON_LABELS,
	STOCK_ADJUSTMENT_REASONS,
	type StockAdjustmentReason,
} from "@/lib/schemas/inventory";
import type { InventoryItemWithRefs } from "@/lib/services/inventory";
import type { Outlet } from "@/lib/services/outlets";
import { cn } from "@/lib/utils";

type Direction = "in" | "out";

type Props = {
	open: boolean;
	item: InventoryItemWithRefs | null;
	outlets: Outlet[];
	activeOutletId: string | null;
	onClose: () => void;
	onSaved?: () => void;
};

export function StockAdjustmentDialog({
	open,
	item,
	outlets,
	activeOutletId,
	onClose,
	onSaved,
}: Props) {
	const [direction, setDirection] = useState<Direction>("in");
	const [quantity, setQuantity] = useState<string>("");
	const [reason, setReason] = useState<StockAdjustmentReason>(
		"new_stock_from_supplier",
	);
	const [notes, setNotes] = useState<string>("");
	const [outletId, setOutletId] = useState<string>(activeOutletId ?? "");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		if (!open) return;
		setDirection("in");
		setQuantity("");
		setReason("new_stock_from_supplier");
		setNotes("");
		setOutletId(activeOutletId ?? outlets[0]?.id ?? "");
		setError(null);
	}, [open, activeOutletId, outlets]);

	if (!item) return null;

	const uom = item.stock_uom?.name ?? "";
	const outletRow = item.outlets.find((o) => o.outlet_id === outletId);
	const onHand = outletRow ? Number(outletRow.stock) : 0;
	const qtyNum = Number(quantity);
	const qtyValid = Number.isFinite(qtyNum) && qtyNum > 0;
	const projected = onHand + (direction === "in" ? qtyNum : -qtyNum);
	const projectedInvalid = qtyValid && direction === "out" && projected < 0;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!outletId) {
			setError("Pick an outlet first.");
			return;
		}
		if (!qtyValid) {
			setError("Enter a quantity greater than 0.");
			return;
		}
		if (projectedInvalid) {
			setError(`Cannot remove ${qtyNum} — only ${onHand} ${uom} on hand.`);
			return;
		}
		setError(null);
		startTransition(async () => {
			const res = await recordStockMovementAction(item.id, outletId, {
				direction,
				quantity: qtyNum,
				reason,
				notes: notes.trim() || undefined,
			});
			if ("error" in res) {
				setError(res.error);
				return;
			}
			onSaved?.();
			onClose();
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && !pending && onClose()}>
			<DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col gap-0 p-0">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>Adjust stock</DialogTitle>
					<DialogDescription className="truncate">
						{item.name} ·{" "}
						<span className="font-mono text-xs">{item.sku}</span>
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
					{outlets.length > 1 && (
						<div className="flex flex-col gap-2">
							<Label htmlFor="adjust-outlet">Outlet</Label>
							<Select
								value={outletId}
								onValueChange={(v) => setOutletId(v)}
							>
								<SelectTrigger id="adjust-outlet">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{outlets.map((o) => (
										<SelectItem key={o.id} value={o.id}>
											{o.name} ({o.code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
						<span className="text-muted-foreground">On hand</span>
						<span className="font-semibold tabular-nums">
							{onHand} {uom}
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<Label>Direction</Label>
						<div className="grid grid-cols-2 gap-2">
							<DirectionButton
								active={direction === "in"}
								onClick={() => setDirection("in")}
								icon={<Plus className="size-4" />}
								label="Add stock"
								tone="emerald"
							/>
							<DirectionButton
								active={direction === "out"}
								onClick={() => setDirection("out")}
								icon={<Minus className="size-4" />}
								label="Remove stock"
								tone="rose"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="adjust-qty">
							Quantity{uom ? ` (${uom})` : ""}
						</Label>
						<Input
							id="adjust-qty"
							type="number"
							inputMode="decimal"
							step="any"
							min="0"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							placeholder="0"
							autoFocus
						/>
						{qtyValid && (
							<p
								className={cn(
									"text-xs tabular-nums",
									projectedInvalid
										? "text-rose-600"
										: "text-muted-foreground",
								)}
							>
								New on hand:{" "}
								<span className="font-semibold">
									{projected} {uom}
								</span>
							</p>
						)}
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="adjust-reason">Reason</Label>
						<Select
							value={reason}
							onValueChange={(v) => setReason(v as StockAdjustmentReason)}
						>
							<SelectTrigger id="adjust-reason">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{STOCK_ADJUSTMENT_REASONS.map((r) => (
									<SelectItem key={r} value={r}>
										{STOCK_ADJUSTMENT_REASON_LABELS[r]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="adjust-notes">Notes (optional)</Label>
						<Textarea
							id="adjust-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={2}
							maxLength={400}
							placeholder="e.g. delivery #1234, batch expiry"
						/>
					</div>

					{error && (
						<div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700 text-sm ring-1 ring-rose-200">
							{error}
						</div>
					)}

					<DialogFooter className="px-0">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={pending || !qtyValid || projectedInvalid}
						>
							{pending && <Loader2 className="mr-2 size-4 animate-spin" />}
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function DirectionButton({
	active,
	onClick,
	icon,
	label,
	tone,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
	tone: "emerald" | "rose";
}) {
	const activeTone =
		tone === "emerald"
			? "border-emerald-500 bg-emerald-50 text-emerald-700"
			: "border-rose-500 bg-rose-50 text-rose-700";
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center justify-center gap-2 rounded-md border px-3 py-2 font-medium text-sm transition",
				active
					? activeTone
					: "border-border bg-background text-muted-foreground hover:bg-muted",
			)}
		>
			{icon}
			{label}
		</button>
	);
}

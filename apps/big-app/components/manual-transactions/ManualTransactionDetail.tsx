"use client";

import { format } from "date-fns";
import { ArrowLeft, Ban } from "lucide-react";
import { useState, useTransition } from "react";
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ManualTransactionDetail({
	record,
	onBack,
	onCancel,
}: {
	record: ManualTransactionWithRelations;
	onBack: () => void;
	onCancel: (id: string, input: unknown) => Promise<void>;
}) {
	const [cancelOpen, setCancelOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const cancelled = record.status === "cancelled";
	const total = record.items.reduce((sum, i) => sum + (i.total_price ?? 0), 0);
	const customerName = record.customer
		? `${record.customer.first_name}${record.customer.last_name ? ` ${record.customer.last_name}` : ""}`
		: "—";
	const createdBy = record.created_by_employee
		? `${record.created_by_employee.first_name} ${record.created_by_employee.last_name}`
		: "—";

	function handleConfirmCancel() {
		if (!reason.trim()) {
			setError("Please enter a reason");
			return;
		}
		setError(null);
		startTransition(async () => {
			await onCancel(record.id, { reason: reason.trim() });
			setCancelOpen(false);
		});
	}

	return (
		<div className="flex flex-col">
			<div className="flex items-center gap-3 border-b px-6 py-3">
				<Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
					<ArrowLeft className="size-4" />
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<span className="font-mono text-sm font-semibold">{record.code}</span>
						<span
							className={cn(
								"rounded-full px-2 py-0.5 text-xs font-medium",
								cancelled
									? "bg-destructive/10 text-destructive"
									: "bg-green-500/10 text-green-700",
							)}
						>
							{cancelled ? "Cancelled" : "Active"}
						</span>
					</div>
					<p className="text-xs text-muted-foreground">
						{format(new Date(record.created_at), "d MMM yyyy, h:mm a")}
					</p>
				</div>
				{!cancelled && (
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setCancelOpen(true)}
					>
						<Ban className="mr-1 size-3.5" />
						Cancel
					</Button>
				)}
			</div>

			<div className="space-y-5 px-6 py-5">
				{/* Customer & staff */}
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-xs font-medium uppercase text-muted-foreground">
							Customer
						</p>
						<p className="mt-1 font-medium">{customerName}</p>
						{record.customer?.code && (
							<p className="text-xs text-muted-foreground">
								{record.customer.code}
							</p>
						)}
					</div>
					<div>
						<p className="text-xs font-medium uppercase text-muted-foreground">
							Created by
						</p>
						<p className="mt-1">{createdBy}</p>
					</div>
				</div>

				{/* Remarks */}
				{record.remarks && (
					<div className="rounded-md bg-muted px-4 py-3 text-sm">
						<p className="text-xs font-medium uppercase text-muted-foreground">
							Remarks
						</p>
						<p className="mt-1">{record.remarks}</p>
					</div>
				)}

				{/* Cancel info */}
				{cancelled && record.cancel_reason && (
					<div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
						<p className="text-xs font-medium uppercase text-destructive/70">
							Cancel reason
						</p>
						<p className="mt-1">{record.cancel_reason}</p>
					</div>
				)}

				{/* Line items */}
				<div>
					<p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
						Items
					</p>
					<div className="divide-y rounded-md border">
						{record.items.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between px-4 py-3 text-sm"
							>
								<div className="min-w-0">
									<p className="font-medium">{item.item_name}</p>
									<p className="text-xs text-muted-foreground">
										{item.item_type === "service" ? "Service" : "Product"}
										{item.item_code ? ` · ${item.item_code}` : ""} · Qty{" "}
										{item.quantity}
									</p>
								</div>
								<div className="shrink-0 text-right">
									<p>MYR {(item.total_price ?? 0).toFixed(2)}</p>
									<p className="text-xs text-muted-foreground">
										@ {item.unit_price.toFixed(2)}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Total */}
				<div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
					<span>Total</span>
					<span>MYR {total.toFixed(2)}</span>
				</div>
			</div>

			{/* Cancel dialog */}
			<Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Cancel Manual Transaction</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<p className="text-sm text-muted-foreground">
							This action cannot be undone. The transaction will be marked as
							cancelled.
						</p>
						<div className="space-y-1.5">
							<Label htmlFor="cancel-reason">Reason</Label>
							<Textarea
								id="cancel-reason"
								placeholder="Enter reason for cancellation…"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								rows={3}
							/>
							{error && <p className="text-xs text-destructive">{error}</p>}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCancelOpen(false)}
							disabled={isPending}
						>
							Keep
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmCancel}
							disabled={isPending}
						>
							{isPending ? "Cancelling…" : "Confirm Cancel"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

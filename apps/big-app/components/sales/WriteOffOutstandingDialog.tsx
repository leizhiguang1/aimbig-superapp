"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { writeOffOutstandingAction } from "@/lib/actions/sales";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	salesOrderId: string;
	soNumber: string;
	outstanding: number;
	appointmentRef?: string | null;
	onSuccess?: (msg: string) => void;
	onError?: (msg: string) => void;
};

function money(n: number) {
	return n.toLocaleString("en-MY", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function WriteOffOutstandingDialog({
	open,
	onOpenChange,
	salesOrderId,
	soNumber,
	outstanding,
	appointmentRef,
	onSuccess,
	onError,
}: Props) {
	const [reason, setReason] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleSubmit() {
		if (!reason.trim()) return;
		startTransition(async () => {
			try {
				const result = await writeOffOutstandingAction(
					salesOrderId,
					{ reason },
					appointmentRef,
				);
				if ("error" in result) {
					onError?.(result.error);
					return;
				}
				onOpenChange(false);
				setReason("");
				onSuccess?.(
					`Write-off recorded · MYR ${money(result.amount)} · ${result.invoiceNo}`,
				);
			} catch (err) {
				onError?.(err instanceof Error ? err.message : "Failed to write off");
			}
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!isPending) onOpenChange(v);
			}}
		>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-md">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>Write Off Outstanding Balance</DialogTitle>
					<DialogDescription>
						Write off MYR {money(outstanding)} on {soNumber}. This cannot be
						undone.
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
					<p className="text-muted-foreground text-sm">
						The outstanding amount will be cleared and the order marked as fully
						paid. A write-off entry will appear in the payment history.
					</p>
					<div className="space-y-1.5">
						<Label htmlFor="wo-reason">
							Reason <span className="text-red-500">*</span>
						</Label>
						<Textarea
							id="wo-reason"
							placeholder="e.g. Bad debt, management approval, goodwill..."
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
					</div>
				</div>
				<DialogFooter className="border-t px-6 py-4">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isPending || !reason.trim()}
						className="bg-orange-600 text-white hover:bg-orange-700"
					>
						{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
						Write off MYR {money(outstanding)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

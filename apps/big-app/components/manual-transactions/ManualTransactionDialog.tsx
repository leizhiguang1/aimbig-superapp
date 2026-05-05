"use client";

import { Receipt } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
	cancelManualTransactionAction,
	createManualTransactionAction,
	getNewManualTransactionDataAction,
	listManualTransactionsAction,
} from "@/lib/actions/manual-transactions";
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import type { ServiceWithCategory } from "@/lib/services/services";
import type { CustomerWithRelations } from "@/lib/services/customers";
import type { InventoryItemWithRefs } from "@/lib/services/inventory";
import type { OutletWithRoomCount } from "@/lib/services/outlets";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { ManualTransactionList } from "./ManualTransactionList";
import { ManualTransactionDetail } from "./ManualTransactionDetail";
import { ManualTransactionForm } from "./ManualTransactionForm";

type View =
	| { type: "list" }
	| { type: "detail"; id: string }
	| { type: "create" };

type FormData = {
	customers: CustomerWithRelations[];
	outlets: OutletWithRoomCount[];
	services: ServiceWithCategory[];
	products: InventoryItemWithRefs[];
};

export function ManualTransactionDialog({
	open,
	onOpenChange,
	outletId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	outletId: string | null;
}) {
	const [view, setView] = useState<View>({ type: "list" });
	const [records, setRecords] = useState<ManualTransactionWithRelations[]>([]);
	const [formData, setFormData] = useState<FormData | null>(null);
	const [isPending, startTransition] = useTransition();

	// Reset to list when dialog opens
	useEffect(() => {
		if (open) {
			setView({ type: "list" });
			startTransition(async () => {
				const data = await listManualTransactionsAction(
					outletId ? { outletId } : {},
				);
				setRecords(data);
			});
		}
	}, [open, outletId]);

	function refreshList() {
		startTransition(async () => {
			const data = await listManualTransactionsAction(
				outletId ? { outletId } : {},
			);
			setRecords(data);
		});
	}

	function handleCreateClick() {
		if (!formData) {
			startTransition(async () => {
				const data = await getNewManualTransactionDataAction();
				setFormData({
					customers: data.customers as CustomerWithRelations[],
					outlets: data.outlets as OutletWithRoomCount[],
					services: data.services as ServiceWithCategory[],
					products: [],
				});
				setView({ type: "create" });
			});
		} else {
			setView({ type: "create" });
		}
	}

	async function handleCreate(input: unknown) {
		const result = await createManualTransactionAction(input);
		if ("error" in result) throw new Error(result.error);
		refreshList();
		setView({ type: "detail", id: result.id });
		return result;
	}

	async function handleCancel(id: string, input: unknown) {
		const result = await cancelManualTransactionAction(id, input);
		if ("error" in result) throw new Error(result.error);
		refreshList();
		setView({ type: "list" });
	}

	const selected =
		view.type === "detail"
			? records.find((r) => r.id === view.id) ?? null
			: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
				<div className="flex shrink-0 items-center gap-2 border-b px-6 py-4">
					<Receipt className="size-4 text-muted-foreground" />
					<DialogTitle className="text-base font-semibold">
						{view.type === "list" && "Manual Transactions"}
						{view.type === "create" && "New Manual Transaction"}
						{view.type === "detail" && "Manual Transaction Detail"}
					</DialogTitle>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{view.type === "list" && (
						<ManualTransactionList
							records={records}
							isLoading={isPending}
							onCreateClick={handleCreateClick}
							onSelectRecord={(id) => setView({ type: "detail", id })}
						/>
					)}
					{view.type === "detail" && selected && (
						<ManualTransactionDetail
							record={selected}
							onBack={() => setView({ type: "list" })}
							onCancel={handleCancel}
						/>
					)}
					{view.type === "create" && formData && (
						<ManualTransactionForm
							customers={formData.customers}
							outlets={formData.outlets}
							services={formData.services}
							defaultOutletId={outletId}
							onBack={() => setView({ type: "list" })}
							onCreate={handleCreate}
						/>
					)}
					{view.type === "create" && !formData && (
						<div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
							Loading…
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

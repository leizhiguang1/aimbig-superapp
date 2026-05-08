"use client";

import { Package, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePermission } from "@/components/auth/PermissionsProvider";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { listItemMovementsAction } from "@/lib/actions/inventory";
import {
	type InventoryKind,
	INVENTORY_KIND_LABELS,
} from "@/lib/schemas/inventory";
import type {
	InventoryItemWithRefs,
	InventoryMovementWithRefs,
} from "@/lib/services/inventory";
import type { Outlet } from "@/lib/services/outlets";
import { publicMediaUrl } from "@/lib/services/storage";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";

const REASON_LABELS: Record<string, string> = {
	sale: "Sale",
	service_use: "Service",
	cancellation: "Void",
	adjustment: "Adjustment",
	initial: "Initial",
	restock: "Restock",
};

function formatDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function staffNameOf(m: InventoryMovementWithRefs): string | null {
	if (!m.created_by_employee) return null;
	return `${m.created_by_employee.first_name} ${m.created_by_employee.last_name ?? ""}`.trim();
}

const priceFormatter = new Intl.NumberFormat("en-MY", {
	style: "currency",
	currency: "MYR",
});

const KIND_PILL: Record<InventoryKind, string> = {
	product: "bg-blue-50 text-blue-700 ring-blue-200",
	consumable: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	medication: "bg-violet-50 text-violet-700 ring-violet-200",
};

type MovementRow = {
	id: string;
	date: string;
	reason: string;
	notes: string | null;
	in_qty: number;
	out_qty: number;
	balance: number;
	staff_name: string | null;
};

const dash = <span className="text-muted-foreground">—</span>;

const REASON_PILL: Record<string, string> = {
	sale: "bg-rose-50 text-rose-700 ring-rose-200",
	service_use: "bg-amber-50 text-amber-700 ring-amber-200",
	cancellation: "bg-slate-50 text-slate-700 ring-slate-200",
	adjustment: "bg-sky-50 text-sky-700 ring-sky-200",
	initial: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	restock: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const movementColumns: DataTableColumn<MovementRow>[] = [
	{
		key: "date",
		header: "DATE",
		sortable: true,
		sortValue: (r) => r.date,
		cell: (r) => (
			<span className="whitespace-nowrap text-muted-foreground text-xs">
				{r.date}
			</span>
		),
	},
	{
		key: "reason",
		header: "TYPE",
		cell: (r) => (
			<span
				className={cn(
					"inline-flex rounded-full px-2 py-0.5 font-medium text-xs ring-1 ring-inset",
					REASON_PILL[r.reason] ?? "bg-muted text-muted-foreground ring-border",
				)}
			>
				{REASON_LABELS[r.reason] ?? r.reason}
			</span>
		),
	},
	{
		key: "notes",
		header: "NOTES",
		cell: (r) =>
			r.notes ? (
				<span className="text-muted-foreground text-xs">{r.notes}</span>
			) : (
				dash
			),
	},
	{
		key: "in_qty",
		header: "IN",
		align: "right",
		cell: (r) =>
			r.in_qty > 0 ? (
				<span className="tabular-nums text-emerald-700 text-xs">
					+{r.in_qty}
				</span>
			) : (
				dash
			),
	},
	{
		key: "out_qty",
		header: "OUT",
		align: "right",
		cell: (r) =>
			r.out_qty > 0 ? (
				<span className="tabular-nums text-rose-700 text-xs">
					−{r.out_qty}
				</span>
			) : (
				dash
			),
	},
	{
		key: "balance",
		header: "BALANCE",
		align: "right",
		cell: (r) => (
			<span className="font-medium tabular-nums text-xs">{r.balance}</span>
		),
	},
	{
		key: "staff_name",
		header: "STAFF",
		cell: (r) =>
			r.staff_name ? (
				<span className="text-muted-foreground text-xs uppercase">
					{r.staff_name}
				</span>
			) : (
				dash
			),
	},
];

type Props = {
	open: boolean;
	item: InventoryItemWithRefs | null;
	outlets: Outlet[];
	activeOutletId: string | null;
	onClose: () => void;
};

export function StockDetailsDialog({
	open,
	item,
	outlets,
	activeOutletId,
	onClose,
}: Props) {
	const router = useRouter();
	const [outletId, setOutletId] = useState<string>(activeOutletId ?? "");
	const [movements, setMovements] = useState<InventoryMovementWithRefs[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [adjusting, setAdjusting] = useState(false);
	const canAdjustStock = usePermission("inventory.adjust_stock");

	useEffect(() => {
		if (open) setOutletId(activeOutletId ?? outlets[0]?.id ?? "");
	}, [open, activeOutletId, outlets]);

	const reload = useCallback(async () => {
		if (!item) return;
		setLoading(true);
		setLoadError(null);
		const res = await listItemMovementsAction(item.id, outletId || null);
		if ("error" in res) {
			setLoadError(res.error);
			setMovements([]);
		} else {
			setMovements(res);
		}
		setLoading(false);
	}, [item, outletId]);

	useEffect(() => {
		if (!open || !item) return;
		let cancelled = false;
		setLoading(true);
		setLoadError(null);
		listItemMovementsAction(item.id, outletId || null).then((res) => {
			if (cancelled) return;
			if ("error" in res) {
				setLoadError(res.error);
				setMovements([]);
			} else {
				setMovements(res);
			}
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [open, item, outletId]);

	if (!item) return null;

	const outletRow = item.outlets.find((o) => o.outlet_id === outletId);
	const onHand = outletRow ? Number(outletRow.stock) : Number(item.stock);
	const rows = buildMovementRows(movements, onHand);

	const kind = item.kind as InventoryKind;
	const kindCode = kind.charAt(0).toUpperCase();
	const sellableCode = item.is_sellable ? "R" : "NR";

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[95vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1400px,95vw)]">
				<DialogHeader className="border-b bg-muted/30 px-6 py-3">
					<div className="flex items-center justify-between gap-4">
						<DialogTitle className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide">
							<span className="text-primary">
								{INVENTORY_KIND_LABELS[kind]}s
							</span>
							<span className="text-muted-foreground">/</span>
							<span className="text-primary">
								{kindCode} ({sellableCode})
							</span>
						</DialogTitle>
						{outlets.length > 1 && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-xs uppercase">
									Outlet
								</span>
								<Select
									value={outletId}
									onValueChange={(v) => setOutletId(v)}
								>
									<SelectTrigger className="h-8 w-[220px]">
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
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-auto bg-muted/20 p-6">
					<div className="grid gap-6 lg:grid-cols-[340px_1fr]">
						<div className="flex flex-col gap-6">
							<ItemCard item={item} kind={kind} />
							<StockTiles item={item} outletRow={outletRow} />
						</div>

						<div className="flex flex-col gap-6">
							<div className="grid gap-4 sm:grid-cols-3">
								<InfoTile label="Brand" value={item.brand?.name ?? null} />
								<InfoTile
									label="Supplier"
									value={item.supplier?.name ?? null}
								/>
								<InfoTile
									label="Category"
									value={item.category?.name ?? null}
								/>
							</div>

							<section className="rounded-lg border bg-background p-4 shadow-sm">
								<div className="mb-3 flex items-center justify-between">
									<h3 className="font-semibold text-sm">Stock Details</h3>
									{canAdjustStock ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="default"
													size="icon-sm"
													className="rounded-full bg-emerald-500 hover:bg-emerald-600"
													onClick={() => setAdjusting(true)}
													aria-label="Adjust stock"
												>
													<Plus className="size-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Add or remove stock</TooltipContent>
										</Tooltip>
									) : null}
								</div>
								{loadError && (
									<div className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-rose-700 text-xs ring-1 ring-rose-200">
										{loadError}
									</div>
								)}
								<DataTable
									data={rows}
									columns={movementColumns}
									getRowKey={(m) => m.id}
									searchKeys={["reason", "notes", "staff_name"]}
									searchPlaceholder="Search:"
									emptyMessage={
										<div className="px-6 py-12 text-sm">
											{loading
												? "Loading movements…"
												: "No stock movements recorded yet."}
										</div>
									}
									minWidth={780}
								/>
								<div className="mt-3 flex items-center justify-between text-muted-foreground text-xs">
									<span>
										{rows.length} movement{rows.length === 1 ? "" : "s"}
									</span>
								</div>
							</section>
						</div>
					</div>
				</div>
			</DialogContent>
			<StockAdjustmentDialog
				open={adjusting}
				item={item}
				outlets={outlets}
				activeOutletId={outletId || activeOutletId}
				onClose={() => setAdjusting(false)}
				onSaved={() => {
					reload();
					router.refresh();
				}}
			/>
		</Dialog>
	);
}

// Walks the ledger newest-first and reconstructs the running balance using
// current on-hand as the anchor (balance after the newest row = current stock).
function buildMovementRows(
	ms: InventoryMovementWithRefs[],
	currentStock: number,
): MovementRow[] {
	let runningAfter = currentStock;
	return ms.map((m) => {
		const delta = Number(m.delta);
		const balanceAfter = runningAfter;
		runningAfter = runningAfter - delta;
		return {
			id: m.id,
			date: formatDate(m.created_at),
			reason: m.reason,
			notes: m.notes,
			in_qty: delta > 0 ? delta : 0,
			out_qty: delta < 0 ? -delta : 0,
			balance: balanceAfter,
			staff_name: staffNameOf(m),
		};
	});
}

function StockTiles({
	item,
	outletRow,
}: {
	item: InventoryItemWithRefs;
	outletRow?: { stock: number; in_transit: number; locked: number; stock_alert_count: number; stock_status: string | null } | undefined;
}) {
	const uom = item.stock_uom?.name ?? "";
	const stock = outletRow ? Number(outletRow.stock) : Number(item.stock);
	const inTransit = outletRow ? Number(outletRow.in_transit) : Number(item.in_transit);
	const locked = outletRow ? Number(outletRow.locked) : Number(item.locked);
	const alert = outletRow
		? Number(outletRow.stock_alert_count)
		: Number(item.stock_alert_count);
	const status = outletRow?.stock_status ?? item.stock_status;
	const tiles = [
		{
			label: "On Hand",
			value: stock,
			tone:
				status === "out"
					? "bg-rose-50 text-rose-700 ring-rose-200"
					: status === "low"
						? "bg-amber-50 text-amber-700 ring-amber-200"
						: "bg-emerald-50 text-emerald-700 ring-emerald-200",
		},
		{
			label: "In Transit",
			value: inTransit,
			tone: "bg-muted text-foreground ring-border",
		},
		{
			label: "Locked",
			value: locked,
			tone: "bg-muted text-foreground ring-border",
		},
		{
			label: "Low Alert",
			value: alert,
			tone: "bg-muted text-foreground ring-border",
		},
	];
	return (
		<section className="grid grid-cols-2 gap-3 rounded-lg border bg-background p-4 shadow-sm">
			{tiles.map((t) => (
				<div
					key={t.label}
					className={cn("rounded-md px-3 py-2 ring-1 ring-inset", t.tone)}
				>
					<div className="text-[10px] uppercase tracking-wide opacity-80">
						{t.label}
					</div>
					<div className="mt-1 font-bold text-lg tabular-nums">
						{t.value} <span className="font-normal text-xs">{uom}</span>
					</div>
				</div>
			))}
		</section>
	);
}

function ItemCard({
	item,
	kind,
}: {
	item: InventoryItemWithRefs;
	kind: InventoryKind;
}) {
	const useUomName = item.use_uom?.name ?? item.stock_uom?.name ?? "";
	const factor =
		item.stock_to_use_factor != null
			? Number(item.stock_to_use_factor)
			: Number(item.purchasing_to_stock_factor);
	return (
		<section className="rounded-lg border bg-background p-5 shadow-sm">
			<div className="relative mx-auto flex size-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed bg-muted">
				{item.image_path ? (
					// biome-ignore lint/performance/noImgElement: Supabase Storage public URL, no Next.js image optimizer
					<img
						src={publicMediaUrl(item.image_path) ?? undefined}
						alt={item.name}
						className="size-full object-cover"
					/>
				) : (
					<Package className="size-10 text-muted-foreground" />
				)}
			</div>
			<div className="mt-4 text-center">
				<div
					className={cn(
						"mb-2 inline-flex rounded-full px-2 py-0.5 font-mono text-xs ring-1 ring-inset",
						KIND_PILL[kind],
					)}
				>
					{factor} {useUomName}
				</div>
				<div className="font-semibold text-base leading-tight">{item.name}</div>
			</div>
			<div className="mt-4 border-t pt-3 text-center">
				<div className="text-muted-foreground text-xs">Selling Price</div>
				<div className="mt-1 font-bold text-2xl tabular-nums text-primary">
					{priceFormatter.format(Number(item.selling_price))}
				</div>
			</div>
		</section>
	);
}

function InfoTile({
	label,
	value,
}: {
	label: string;
	value: string | null;
}) {
	return (
		<div className="rounded-lg border bg-background p-4 shadow-sm">
			<div className="text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</div>
			<div className="mt-1 truncate font-semibold text-base uppercase">
				{value ?? <span className="text-muted-foreground">—</span>}
			</div>
		</div>
	);
}

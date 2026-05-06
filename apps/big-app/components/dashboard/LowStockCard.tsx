import { PackageX } from "lucide-react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type InventoryKind,
	INVENTORY_KIND_LABELS,
} from "@/lib/schemas/inventory";
import type { LowStockItem } from "@/lib/services/inventory";
import { cn } from "@/lib/utils";

type Props = {
	items: LowStockItem[];
	outletSlug: string;
};

const KIND_PILL: Record<InventoryKind, string> = {
	product: "bg-blue-50 text-blue-700 ring-blue-200",
	consumable: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	medication: "bg-violet-50 text-violet-700 ring-violet-200",
};

const PREVIEW = 6;

export function LowStockCard({ items, outletSlug }: Props) {
	const out = items.filter((i) => i.stock_status === "out");
	const low = items.filter((i) => i.stock_status === "low");
	const visible = items.slice(0, PREVIEW);
	const overflow = items.length - visible.length;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<PackageX className="size-4 text-rose-600" />
					Low stock
				</CardTitle>
				<CardDescription>
					{items.length === 0
						? "All items are above their alert threshold"
						: `${out.length} out · ${low.length} low`}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{items.length === 0 ? (
					<div className="rounded-md border border-dashed p-5 text-center text-muted-foreground text-sm">
						Nothing to restock right now.
					</div>
				) : (
					<>
						{visible.map((i) => (
							<LowStockRow key={i.id} item={i} />
						))}
						{overflow > 0 && (
							<Link
								href={`/o/${outletSlug}/inventory`}
								className="mt-1 text-center text-muted-foreground text-xs hover:text-foreground hover:underline"
							>
								View {overflow} more in inventory →
							</Link>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

function LowStockRow({ item }: { item: LowStockItem }) {
	const isOut = item.stock_status === "out";
	const kind = item.kind as InventoryKind;
	const uom = item.stock_uom?.name ?? "";
	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-md border p-3",
				isOut ? "border-rose-300 bg-rose-50/50" : "border-amber-300 bg-amber-50/40",
			)}
		>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2 text-sm">
					<span
						className={cn(
							"inline-flex rounded-full px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-inset",
							KIND_PILL[kind],
						)}
					>
						{INVENTORY_KIND_LABELS[kind]}
					</span>
					<span className="truncate font-semibold">{item.name}</span>
					<span className="rounded bg-foreground/5 px-1.5 py-px font-mono text-[10px] text-muted-foreground">
						{item.sku}
					</span>
					{isOut ? (
						<span className="rounded bg-rose-500 px-1.5 py-px font-bold text-[9px] text-white uppercase tracking-wide">
							Out
						</span>
					) : (
						<span className="rounded bg-amber-500 px-1.5 py-px font-bold text-[9px] text-white uppercase tracking-wide">
							Low
						</span>
					)}
				</div>
				<div className="mt-1 text-muted-foreground text-xs tabular-nums">
					On hand: <strong>{Number(item.stock)}</strong> {uom} · alert at{" "}
					{Number(item.stock_alert_count)} {uom}
				</div>
			</div>
		</div>
	);
}

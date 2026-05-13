"use client";

import { Package, Stethoscope, Trophy } from "lucide-react";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { fmtValue } from "@/components/dashboard/formatters";
import type { TopSellerKind, TopSellerRow } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";

type Props = {
	services: TopSellerRow[];
	products: TopSellerRow[];
};

const TAB_CONFIG: Record<TopSellerKind, { label: string; Icon: typeof Package }> = {
	service: { label: "Services", Icon: Stethoscope },
	product: { label: "Products", Icon: Package },
};

export function TopSellersCard({ services, products }: Props) {
	const [active, setActive] = useState<TopSellerKind>("service");
	const rows = active === "service" ? services : products;
	const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
				<div>
					<CardTitle className="flex items-center gap-2 text-base">
						<Trophy className="size-4 text-amber-500" />
						Top 10 sellers
					</CardTitle>
					<CardDescription>
						Last 30 days · ranked by revenue
					</CardDescription>
				</div>
				<div
					role="tablist"
					aria-label="Top sellers category"
					className="inline-flex shrink-0 rounded-full border bg-muted/40 p-0.5"
				>
					{(["service", "product"] as const).map((kind) => {
						const { label, Icon } = TAB_CONFIG[kind];
						const isActive = active === kind;
						return (
							<button
								key={kind}
								type="button"
								role="tab"
								aria-selected={isActive}
								onClick={() => setActive(kind)}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs transition",
									isActive
										? "bg-card text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="size-3.5" />
								{label}
							</button>
						);
					})}
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{rows.length === 0 ? (
					<div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
						No {TAB_CONFIG[active].label.toLowerCase()} sold in the last 30 days.
					</div>
				) : (
					<>
						<div className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3 px-1 pb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
							<span className="text-center">#</span>
							<span>Item</span>
							<span className="text-right">Units</span>
							<span className="text-right">Revenue</span>
						</div>
						{rows.map((row) => (
							<TopSellerRowItem key={row.itemId ?? row.name} row={row} />
						))}
						<div className="mt-1 flex items-center justify-end gap-2 border-t pt-2 text-muted-foreground text-xs tabular-nums">
							<span>Total (top {rows.length}):</span>
							<strong className="text-foreground">
								{fmtValue(totalRevenue, "myr")}
							</strong>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

function TopSellerRowItem({ row }: { row: TopSellerRow }) {
	return (
		<div className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-x-3 rounded-md border bg-card/50 px-2 py-1.5 text-sm">
			<span
				className={cn(
					"flex size-6 items-center justify-center rounded-full font-mono font-semibold text-[10px]",
					row.rank === 1
						? "bg-amber-100 text-amber-700"
						: row.rank === 2
							? "bg-zinc-200 text-zinc-700"
							: row.rank === 3
								? "bg-orange-100 text-orange-700"
								: "bg-muted text-muted-foreground",
				)}
			>
				{row.rank}
			</span>
			<div className="min-w-0">
				<div className="truncate font-medium">{row.name}</div>
				{row.sku && (
					<div className="truncate font-mono text-[10px] text-muted-foreground">
						{row.sku}
					</div>
				)}
			</div>
			<div className="text-right text-muted-foreground text-xs tabular-nums">
				{row.units.toLocaleString()}
			</div>
			<div className="text-right font-semibold tabular-nums">
				{fmtValue(row.revenue, "myr")}
			</div>
		</div>
	);
}

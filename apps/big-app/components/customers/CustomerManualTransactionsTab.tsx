"use client";

import { format } from "date-fns";
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import { cn } from "@/lib/utils";

export function CustomerManualTransactionsTab({
	records,
}: {
	records: ManualTransactionWithRelations[];
}) {
	if (records.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
				<p>No manual transactions for this customer.</p>
			</div>
		);
	}

	return (
		<div className="divide-y">
			{records.map((r) => {
				const cancelled = r.status === "cancelled";
				const total = r.items.reduce(
					(sum, i) => sum + (i.total_price ?? 0),
					0,
				);
				const createdBy = r.created_by_employee
					? `${r.created_by_employee.first_name} ${r.created_by_employee.last_name}`
					: "—";
				return (
					<div key={r.id} className="px-4 py-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"mt-1 size-2 shrink-0 rounded-full",
										cancelled ? "bg-destructive" : "bg-green-500",
									)}
								/>
								<div>
									<div className="flex items-center gap-2">
										<span className="font-mono text-sm font-medium">
											{r.code}
										</span>
										{cancelled && (
											<span className="text-xs text-destructive">Cancelled</span>
										)}
									</div>
									<p className="text-xs text-muted-foreground">
										{format(new Date(r.created_at), "d MMM yyyy, h:mm a")} ·{" "}
										{createdBy}
									</p>
								</div>
							</div>
							<div className="shrink-0 text-right">
								<p className="font-medium">MYR {total.toFixed(2)}</p>
								<p className="text-xs text-muted-foreground">
									{r.items.length} item{r.items.length !== 1 ? "s" : ""}
								</p>
							</div>
						</div>

						{r.remarks && (
							<p className="ml-4 mt-1.5 text-xs text-muted-foreground">
								{r.remarks}
							</p>
						)}

						<div className="ml-4 mt-2 space-y-1">
							{r.items.map((item) => (
								<div
									key={item.id}
									className="flex justify-between text-xs text-muted-foreground"
								>
									<span>
										{item.item_name} × {item.quantity}
									</span>
									<span>MYR {(item.total_price ?? 0).toFixed(2)}</span>
								</div>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

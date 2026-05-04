"use client";

import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ManualTransactionList({
	records,
	isLoading,
	onCreateClick,
	onSelectRecord,
}: {
	records: ManualTransactionWithRelations[];
	isLoading: boolean;
	onCreateClick: () => void;
	onSelectRecord: (id: string) => void;
}) {
	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between border-b px-6 py-3">
				<span className="text-sm text-muted-foreground">
					{records.length} record{records.length !== 1 ? "s" : ""}
				</span>
				<Button size="sm" onClick={onCreateClick} disabled={isLoading}>
					<Plus className="mr-1 size-3.5" />
					New
				</Button>
			</div>

			{isLoading && records.length === 0 ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="size-5 animate-spin text-muted-foreground" />
				</div>
			) : records.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
					<p>No manual transactions yet.</p>
				</div>
			) : (
				<ul className="divide-y">
					{records.map((r) => {
						const cancelled = r.status === "cancelled";
						const total = r.items.reduce(
							(sum, i) => sum + (i.total_price ?? 0),
							0,
						);
						const customerName = r.customer
							? `${r.customer.first_name}${r.customer.last_name ? ` ${r.customer.last_name}` : ""}`
							: "—";
						const createdBy = r.created_by_employee
							? `${r.created_by_employee.first_name} ${r.created_by_employee.last_name}`
							: "—";
						return (
							<li key={r.id}>
								<button
									type="button"
									className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-muted/50"
									onClick={() => onSelectRecord(r.id)}
								>
									<span
										className={cn(
											"mt-0.5 size-2 shrink-0 rounded-full",
											cancelled ? "bg-destructive" : "bg-green-500",
										)}
									/>
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline gap-2">
											<span className="font-mono text-sm font-medium">
												{r.code}
											</span>
											{cancelled && (
												<span className="text-xs text-destructive">
													Cancelled
												</span>
											)}
										</div>
										<div className="mt-0.5 text-xs text-muted-foreground">
											{customerName}
											{r.customer?.code ? ` · ${r.customer.code}` : ""} ·{" "}
											{createdBy}
										</div>
									</div>
									<div className="shrink-0 text-right">
										<div className="text-sm font-medium">
											MYR {total.toFixed(2)}
										</div>
										<div className="mt-0.5 text-xs text-muted-foreground">
											{format(new Date(r.created_at), "d MMM yyyy")}
										</div>
									</div>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

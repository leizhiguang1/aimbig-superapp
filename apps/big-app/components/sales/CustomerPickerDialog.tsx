"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CustomerWithRelations } from "@/lib/services/customers";

type Props = {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	customers: CustomerWithRelations[];
	onPick: (id: string) => void;
};

export function CustomerPickerDialog({
	open,
	onOpenChange,
	customers,
	onPick,
}: Props) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return customers.slice(0, 200);
		return customers
			.filter((c) => {
				const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
				return [name, c.code, c.phone ?? "", c.id_number ?? ""]
					.join(" ")
					.toLowerCase()
					.includes(q);
			})
			.slice(0, 200);
	}, [customers, query]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-0 p-0">
				<div className="border-b px-5 py-4">
					<DialogTitle className="text-base">Pick customer</DialogTitle>
					<DialogDescription className="sr-only">
						Search and select a customer for this walk-in sale.
					</DialogDescription>
					<div className="relative mt-3">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by name, code, phone, or ID…"
							className="h-10 pl-9"
						/>
					</div>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{filtered.length === 0 ? (
						<div className="p-10 text-center text-sm text-muted-foreground">
							{query
								? `No customers match "${query}".`
								: "No customers available."}
						</div>
					) : (
						<ul className="divide-y">
							{filtered.map((c) => {
								const name = [c.first_name, c.last_name]
									.filter(Boolean)
									.join(" ");
								return (
									<li key={c.id}>
										<button
											type="button"
											onClick={() => onPick(c.id)}
											className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-muted/60"
										>
											<div className="flex min-w-0 flex-col gap-0.5">
												<div className="flex items-center gap-2">
													<span className="truncate font-semibold text-sm">
														{name || "Unnamed customer"}
													</span>
													{c.is_staff && (
														<span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
															STAFF
														</span>
													)}
													{c.is_vip && (
														<span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">
															VIP
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<span className="font-mono">{c.code}</span>
													{c.phone && <span>· {c.phone}</span>}
												</div>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

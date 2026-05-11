"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { InfoTip } from "@/components/services/InfoTip";
import type { InventoryItemChoice } from "@/components/services/ServiceForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ServiceCreateInput } from "@/lib/schemas/services";

const KIND_LABEL: Record<InventoryItemChoice["kind"], string> = {
	product: "Product",
	consumable: "Consumable",
	medication: "Medication",
};

const KIND_BADGE: Record<
	InventoryItemChoice["kind"],
	"info" | "secondary" | "outline"
> = {
	consumable: "info",
	medication: "secondary",
	product: "outline",
};

export function InventoryLinksSection({
	control,
	inventoryItems,
}: {
	control: Control<ServiceCreateInput>;
	inventoryItems: InventoryItemChoice[];
}) {
	const itemsById = useMemo(
		() => new Map(inventoryItems.map((i) => [i.id, i])),
		[inventoryItems],
	);
	const [pickerOpen, setPickerOpen] = useState(false);

	return (
		<Controller
			control={control}
			name="inventory_links"
			render={({ field }) => {
				const selectedIds = new Set(
					field.value.map((l) => l.inventory_item_id),
				);
				const available = inventoryItems.filter((i) => !selectedIds.has(i.id));
				return (
					<section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<h3 className="font-medium text-foreground text-sm">
									Consumables &amp; Medications
								</h3>
								<InfoTip tooltipKey="consumables" />
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setPickerOpen(true)}
								disabled={available.length === 0}
							>
								<Plus className="mr-1 size-3.5" /> Add item
							</Button>
						</div>

						{field.value.length === 0 ? (
							<p className="rounded-md border border-dashed py-3 text-center text-muted-foreground text-xs">
								No items linked. Add consumables or medications used when this
								service is performed — they'll auto-deduct from stock on Collect
								Payment.
							</p>
						) : (
							<ul className="flex flex-col divide-y divide-border/60">
								{field.value.map((link, idx) => {
									const item = itemsById.get(link.inventory_item_id);
									return (
										<li
											key={link.inventory_item_id}
											className="flex items-center gap-2 py-2"
										>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<Badge
														variant={item ? KIND_BADGE[item.kind] : "outline"}
														className="px-1.5 py-0 text-[9px]"
													>
														{item ? KIND_LABEL[item.kind] : "Unknown"}
													</Badge>
													<span className="truncate font-medium text-sm">
														{item?.name ?? "Item removed"}
													</span>
												</div>
												<span className="font-mono text-muted-foreground text-xs">
													{item?.sku ?? link.inventory_item_id.slice(0, 8)}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<span className="text-muted-foreground text-xs">
													Qty
												</span>
												<Input
													type="number"
													min={0}
													step="any"
													className="h-8 w-20"
													value={link.default_quantity}
													onChange={(e) => {
														const next = [...field.value];
														const raw = e.target.value;
														next[idx] = {
															...next[idx],
															default_quantity: raw === "" ? 0 : Number(raw),
														};
														field.onChange(next);
													}}
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Remove"
												onClick={() =>
													field.onChange(
														field.value.filter((_, i) => i !== idx),
													)
												}
											>
												<Trash2 className="size-3.5" />
											</Button>
										</li>
									);
								})}
							</ul>
						)}

						<InventoryItemPicker
							open={pickerOpen}
							items={available}
							onClose={() => setPickerOpen(false)}
							onPick={(item) => {
								field.onChange([
									...field.value,
									{ inventory_item_id: item.id, default_quantity: 1 },
								]);
								setPickerOpen(false);
							}}
						/>
					</section>
				);
			}}
		/>
	);
}

function InventoryItemPicker({
	open,
	items,
	onClose,
	onPick,
}: {
	open: boolean;
	items: InventoryItemChoice[];
	onClose: () => void;
	onPick: (item: InventoryItemChoice) => void;
}) {
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (!open) setQuery("");
	}, [open]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter(
			(i) =>
				i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
		);
	}, [items, query]);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[70vh] flex-col gap-0 p-0 sm:max-w-md">
				<DialogHeader className="border-b px-4 py-3">
					<DialogTitle className="text-sm">Pick an inventory item</DialogTitle>
					<DialogDescription className="sr-only">
						Inventory item picker
					</DialogDescription>
				</DialogHeader>
				<div className="border-b p-3">
					<Input
						autoFocus
						placeholder="Search by name or SKU…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{filtered.length === 0 ? (
						<p className="p-6 text-center text-muted-foreground text-xs">
							{items.length === 0
								? "All matching inventory items are already linked."
								: "No items match."}
						</p>
					) : (
						<ul className="divide-y divide-border/60">
							{filtered.map((i) => (
								<li key={i.id}>
									<button
										type="button"
										onClick={() => onPick(i)}
										className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
									>
										<Badge
											variant={KIND_BADGE[i.kind]}
											className="px-1.5 py-0 text-[9px]"
										>
											{KIND_LABEL[i.kind]}
										</Badge>
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm">{i.name}</div>
											<div className="font-mono text-muted-foreground text-xs">
												{i.sku}
											</div>
										</div>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

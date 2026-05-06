"use client";

import { Info, Plus, Trash2 } from "lucide-react";
import { startTransition, useOptimistic, useState } from "react";
import { BrandConfigItemDialog } from "@/components/brand-config/BrandConfigItemDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	archiveBrandConfigItemAction,
	deleteBrandConfigItemAction,
	updateBrandConfigItemAction,
} from "@/lib/actions/brand-config";
import {
	type BrandConfigCategory,
	getCategoryDef,
} from "@/lib/brand-config/categories";
import type { BrandConfigItem } from "@/lib/services/brand-config";

type Props = {
	category: BrandConfigCategory;
	items: BrandConfigItem[];
};

type OptimisticAction =
	| { kind: "toggle"; id: string; next: boolean }
	| { kind: "delete"; id: string };

export function RemarkCategoryCard({ category, items }: Props) {
	const def = getCategoryDef(category);
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<BrandConfigItem | null>(null);
	const [deleting, setDeleting] = useState<BrandConfigItem | null>(null);
	const [optimisticItems, applyOptimistic] = useOptimistic(
		items,
		(current: BrandConfigItem[], action: OptimisticAction) => {
			if (action.kind === "toggle") {
				return current.map((r) =>
					r.id === action.id ? { ...r, is_active: action.next } : r,
				);
			}
			return current.filter((r) => r.id !== action.id);
		},
	);

	const toggle = (row: BrandConfigItem, next: boolean) => {
		startTransition(async () => {
			applyOptimistic({ kind: "toggle", id: row.id, next });
			await updateBrandConfigItemAction(row.id, { is_active: next });
		});
	};

	const confirmDelete = () => {
		if (!deleting) return;
		const id = deleting.id;
		setDeleting(null);
		startTransition(async () => {
			applyOptimistic({ kind: "delete", id });
			const res = await deleteBrandConfigItemAction(id);
			if ("error" in res) {
				await archiveBrandConfigItemAction(id);
			}
		});
	};

	return (
		<>
			<Card className="flex h-full flex-col">
				<CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
					<div className="flex min-w-0 items-center gap-1.5">
						<CardTitle className="truncate text-sm font-semibold">
							{def.label}
						</CardTitle>
						{def.usage && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="shrink-0 text-muted-foreground hover:text-foreground"
										aria-label="Where this list is used"
									>
										<Info className="size-3.5" />
									</button>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs space-y-1 text-xs">
									<p>{def.usage.description}</p>
									{def.usage.wired ? (
										def.usage.consumer && (
											<p className="text-muted-foreground">
												Used in <code>{def.usage.consumer}</code>
											</p>
										)
									) : (
										<p className="text-amber-300">
											Not yet wired — consumer still reads
											{def.usage.replacesEnum
												? ` ${def.usage.replacesEnum}`
												: " a hardcoded enum"}
											.
										</p>
									)}
								</TooltipContent>
							</Tooltip>
						)}
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setCreating(true)}
							>
								<Plus />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Add {def.singularLabel ?? "item"}</TooltipContent>
					</Tooltip>
				</CardHeader>
				<CardContent className="flex-1 pt-0">
					{optimisticItems.length === 0 ? (
						<p className="py-2 text-center text-muted-foreground text-xs">
							No items yet. Click + to add one.
						</p>
					) : (
						<ul className="divide-y">
							{optimisticItems.map((item) => (
								<li
									key={item.id}
									className="flex items-center justify-between gap-2 py-2"
								>
									<button
										type="button"
										onClick={() => setEditing(item)}
										className="flex-1 truncate text-left font-medium text-primary text-sm uppercase hover:underline"
									>
										{item.label}
									</button>
									<div className="flex items-center gap-1">
										<Switch
											checked={item.is_active}
											onCheckedChange={(v) => toggle(item, v)}
										/>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() => setDeleting(item)}
													className="text-destructive hover:text-destructive"
												>
													<Trash2 />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Delete</TooltipContent>
										</Tooltip>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
			{creating && (
				<BrandConfigItemDialog
					open={creating}
					onClose={() => setCreating(false)}
					category={category}
				/>
			)}
			{editing && (
				<BrandConfigItemDialog
					open={!!editing}
					onClose={() => setEditing(null)}
					category={category}
					item={editing}
				/>
			)}
			{deleting && (
				<ConfirmDialog
					open={!!deleting}
					onOpenChange={(o) => !o && setDeleting(null)}
					title={`Delete "${deleting.label}"?`}
					description={
						def.storage === "live"
							? "Existing records keep displaying it; it just stops appearing as an option for future entries."
							: "Past records keep their original wording. Removing this only stops it from showing up as a future option."
					}
					confirmLabel="Delete"
					onConfirm={confirmDelete}
				/>
			)}
		</>
	);
}

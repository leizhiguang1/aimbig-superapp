"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createBrandConfigItemAction,
	updateBrandConfigItemAction,
} from "@/lib/actions/brand-config";
import {
	type BrandConfigCategory,
	getCategoryDef,
} from "@/lib/brand-config/categories";
import type { BrandConfigItem } from "@/lib/services/brand-config";

type Props = {
	open: boolean;
	onClose: () => void;
	category: BrandConfigCategory;
	item?: BrandConfigItem | null;
};

const DEFAULT_COLOR = "#60a5fa";

// Accepts "abc", "abcdef", "#abc", "#abcdef", "##abcdef" plus surrounding
// whitespace. Anything else returns null. The native <input type="color">
// only renders a non-black swatch when fed an exact "#rrggbb" string, so
// we centralize the cleanup here instead of relying on the browser to
// silently fall back.
function normalizeHex(input: string): string | null {
	const m = input.trim().match(/^#{0,2}([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
	if (!m) return null;
	let h = m[1].toLowerCase();
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	return `#${h}`;
}

export function BrandConfigItemDialog({
	open,
	onClose,
	category,
	item,
}: Props) {
	const def = getCategoryDef(category);
	const isEdit = !!item;
	const [label, setLabel] = useState("");
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [colorText, setColorText] = useState(DEFAULT_COLOR);
	const [serverError, setServerError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		if (!open) return;
		setServerError(null);
		if (item) {
			setLabel(item.label);
			const seeded = normalizeHex(item.color ?? "") ?? DEFAULT_COLOR;
			setColor(seeded);
			setColorText(seeded);
		} else {
			setLabel("");
			setColor(DEFAULT_COLOR);
			setColorText(DEFAULT_COLOR);
		}
	}, [open, item]);

	const commitColorText = () => {
		const next = normalizeHex(colorText);
		if (next) {
			setColor(next);
			setColorText(next);
		} else {
			setColorText(color);
		}
	};

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const finalColor = def.hasColor
			? (normalizeHex(colorText) ?? color)
			: null;
		if (def.hasColor && finalColor !== colorText) setColorText(finalColor!);
		if (def.hasColor && finalColor !== color && finalColor) setColor(finalColor);
		startTransition(async () => {
			try {
				if (isEdit && item) {
					await updateBrandConfigItemAction(item.id, {
						label,
						color: finalColor,
					});
				} else {
					await createBrandConfigItemAction({
						category,
						label,
						color: finalColor,
					});
				}
				onClose();
			} catch (err) {
				setServerError(
					err instanceof Error ? err.message : "Something went wrong",
				);
			}
		});
	};

	const noun = (def.singularLabel ?? def.label).toLowerCase();

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? `Edit ${noun}` : `New ${noun}`}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? def.storage === "live"
								? "Renames apply to every existing record using this item."
								: `Rename this ${noun}. Past records keep their original wording.`
							: (def.hint ?? `Type the ${noun} and save.`)}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
					<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="bc-label">
								{def.singularLabel ?? "Label"}
							</Label>
							<Input
								id="bc-label"
								value={label}
								onChange={(e) => setLabel(e.target.value)}
								placeholder={`e.g. ${def.singularLabel ?? def.label}`}
								required
							/>
						</div>
						{def.hasColor && (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="bc-color">Color</Label>
								<div className="flex items-center gap-2">
									<input
										id="bc-color"
										type="color"
										value={color}
										onChange={(e) => {
											setColor(e.target.value);
											setColorText(e.target.value);
										}}
										className="h-9 w-12 cursor-pointer rounded border"
									/>
									<Input
										value={colorText}
										onChange={(e) => setColorText(e.target.value)}
										onBlur={commitColorText}
										placeholder="#60a5fa"
										className="font-mono"
										maxLength={9}
									/>
								</div>
							</div>
						)}
						{serverError && (
							<p className="text-destructive text-sm">{serverError}</p>
						)}
					</div>
					<DialogFooter className="border-t">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={pending}>
							{pending ? "Saving…" : isEdit ? "Save" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

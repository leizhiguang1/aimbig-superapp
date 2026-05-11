import { Plus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { BrandConfigItem } from "@/lib/services/brand-config";

type Props = {
	value: string[];
	options: BrandConfigItem[];
	onChange: (next: string[]) => void;
};

export function CustomerTagsPicker({ value, options, onChange }: Props) {
	const [draft, setDraft] = useState("");
	const selected = new Set(value);
	const optionByCode = new Map(options.map((o) => [o.code, o]));

	const addRaw = (raw: string) => {
		const v = raw.trim();
		if (!v) return;
		// Prefer the brand-managed code when the typed value matches a
		// known label (case-insensitive). Falls back to free-text
		// otherwise — those render as plain chips.
		const match = options.find(
			(o) => o.label.toLowerCase() === v.toLowerCase(),
		);
		const next = match ? match.code : v;
		if (selected.has(next)) return;
		onChange([...value, next]);
		setDraft("");
	};

	const toggle = (code: string) => {
		if (selected.has(code)) onChange(value.filter((c) => c !== code));
		else onChange([...value, code]);
	};

	const remove = (code: string) => onChange(value.filter((c) => c !== code));

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addRaw(draft);
		} else if (
			e.key === "Backspace" &&
			draft.length === 0 &&
			value.length > 0
		) {
			e.preventDefault();
			onChange(value.slice(0, -1));
		}
	};

	const unselectedSuggestions = options.filter((o) => !selected.has(o.code));

	return (
		<div className="flex flex-col gap-2 rounded-md border bg-background p-2">
			<div className="flex flex-wrap items-center gap-1.5">
				{value.map((code) => {
					const opt = optionByCode.get(code);
					const color = opt?.color ?? null;
					return (
						<span
							key={code}
							className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
							style={
								color
									? {
											backgroundColor: `${color}1f`,
											borderColor: `${color}66`,
											color,
										}
									: undefined
							}
						>
							{color && (
								<span
									className="size-1.5 rounded-full"
									style={{ backgroundColor: color }}
								/>
							)}
							{opt?.label ?? code}
							<button
								type="button"
								aria-label={`Remove ${opt?.label ?? code}`}
								onClick={() => remove(code)}
								className="-mr-1 ml-0.5 rounded-full p-0.5 hover:bg-black/10"
							>
								<X className="size-3" />
							</button>
						</span>
					);
				})}
				<input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={onKeyDown}
					onBlur={() => addRaw(draft)}
					placeholder={
						value.length === 0
							? "Add a tag — pick from below or type your own"
							: ""
					}
					className="min-w-[10rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				/>
			</div>
			{unselectedSuggestions.length > 0 && (
				<div className="flex flex-wrap gap-1.5 border-t pt-2">
					{unselectedSuggestions.map((o) => {
						const color = o.color ?? null;
						return (
							<button
								key={o.id}
								type="button"
								onClick={() => toggle(o.code)}
								className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
							>
								{color && (
									<span
										className="size-1.5 rounded-full"
										style={{ backgroundColor: color }}
									/>
								)}
								<Plus className="size-3" />
								{o.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

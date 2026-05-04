"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	ACTION_TYPES,
	TRIGGER_TYPES,
} from "@/components/automations/automation-constants";

type Props = {
	mode: "triggers" | "actions";
	onPick: (type: string) => void;
};

export function ActionLibraryPanel({ mode, onPick }: Props) {
	const [query, setQuery] = useState("");

	const catalog = mode === "triggers" ? TRIGGER_TYPES : ACTION_TYPES;

	const groups = useMemo(() => {
		const q = query.trim().toLowerCase();
		const map = new Map<string, Array<{ key: string; label: string; icon: string }>>();
		for (const [key, def] of Object.entries(catalog)) {
			if (q && !def.label.toLowerCase().includes(q) && !key.toLowerCase().includes(q))
				continue;
			const arr = map.get(def.group) ?? [];
			arr.push({ key, label: def.label, icon: def.icon });
			map.set(def.group, arr);
		}
		return Array.from(map.entries());
	}, [catalog, query]);

	return (
		<div className="flex h-full flex-col">
			<div className="border-b px-3 py-3">
				<p className="mb-2 font-semibold text-sm">
					{mode === "triggers" ? "Choose a trigger" : "Choose an action"}
				</p>
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={`Search ${mode}…`}
						className="h-8 pl-8 text-xs"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
							aria-label="Clear"
						>
							<X className="size-3" />
						</button>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-2 pb-3">
				{groups.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground text-xs">
						No {mode} match "{query}"
					</p>
				) : (
					groups.map(([group, items]) => (
						<div key={group} className="mt-3">
							<div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
								{group}
							</div>
							<div className="flex flex-col gap-0.5">
								{items.map((it) => (
									<button
										type="button"
										key={it.key}
										onClick={() => onPick(it.key)}
										className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted/60"
									>
										<span className="shrink-0 text-base leading-none" aria-hidden>
											{it.icon}
										</span>
										<span className="font-medium">{it.label}</span>
									</button>
								))}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

import type { ReactNode } from "react";

export function Section({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<fieldset className="flex flex-col gap-3 rounded-lg border p-3">
			<legend className="px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
				{title}
			</legend>
			{children}
		</fieldset>
	);
}

export function Two({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="font-medium text-sm">{label}</label>
			{children}
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}

export function Check({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<label className="flex items-center gap-2 text-sm">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="size-4"
			/>
			{label}
		</label>
	);
}

export function SelectInput({
	value,
	onChange,
	options,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	options: Array<{ value: string; label: string }>;
	placeholder?: string;
}) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="h-9 rounded-md border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
		>
			<option value="">{placeholder ?? "Choose…"}</option>
			{options.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	);
}

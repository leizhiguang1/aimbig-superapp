import { cn } from "@/lib/utils";

type Props = {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
};

export function SidebarToggle({ label, checked, onChange }: Props) {
	return (
		<label className="flex items-center gap-2.5 text-sm">
			<input
				type="checkbox"
				className="size-4 accent-emerald-500"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span
				className={cn(
					"transition",
					checked ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{label}
			</span>
		</label>
	);
}

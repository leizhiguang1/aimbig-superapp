import { Mars, Venus } from "lucide-react";
import type { Gender } from "@/lib/schemas/customers";
import { cn } from "@/lib/utils";

type Props = {
	value: Gender | null | undefined;
	onChange: (g: Gender | null) => void;
};

export function GenderPicker({ value, onChange }: Props) {
	return (
		<div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2">
			<button
				type="button"
				aria-label="Male"
				aria-pressed={value === "male"}
				onClick={() => onChange(value === "male" ? null : "male")}
				className={cn(
					"flex h-7 flex-1 items-center justify-center gap-1.5 rounded text-xs font-medium transition",
					value === "male"
						? "bg-sky-100 text-sky-700 ring-1 ring-sky-300"
						: "text-muted-foreground hover:bg-muted",
				)}
			>
				<Mars className="size-4" />
				Male
			</button>
			<button
				type="button"
				aria-label="Female"
				aria-pressed={value === "female"}
				onClick={() => onChange(value === "female" ? null : "female")}
				className={cn(
					"flex h-7 flex-1 items-center justify-center gap-1.5 rounded text-xs font-medium transition",
					value === "female"
						? "bg-pink-100 text-pink-700 ring-1 ring-pink-300"
						: "text-muted-foreground hover:bg-muted",
				)}
			>
				<Venus className="size-4" />
				Female
			</button>
		</div>
	);
}

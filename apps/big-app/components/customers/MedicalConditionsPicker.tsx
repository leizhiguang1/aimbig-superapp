import {
	MEDICAL_CONDITIONS,
	type MedicalCondition,
} from "@/lib/constants/medical";
import { cn } from "@/lib/utils";

type Props = {
	value: MedicalCondition[];
	onChange: (v: MedicalCondition[]) => void;
};

export function MedicalConditionsPicker({ value, onChange }: Props) {
	const selected = new Set(value);
	const toggle = (c: MedicalCondition) => {
		const next = new Set(selected);
		if (next.has(c)) next.delete(c);
		else next.add(c);
		onChange(MEDICAL_CONDITIONS.filter((x) => next.has(x)));
	};
	return (
		<div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-2">
			{MEDICAL_CONDITIONS.map((c) => {
				const on = selected.has(c);
				return (
					<button
						key={c}
						type="button"
						onClick={() => toggle(c)}
						aria-pressed={on}
						className={cn(
							"rounded-full border px-2.5 py-1 font-medium text-[11px] transition",
							on
								? "border-amber-300 bg-amber-100 text-amber-900"
								: "border-border bg-background text-muted-foreground hover:bg-muted",
						)}
					>
						{c}
					</button>
				);
			})}
		</div>
	);
}

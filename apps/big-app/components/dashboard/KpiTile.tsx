import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fmtValue, type ValueKind } from "./formatters";

type Props = {
	label: string;
	value: number;
	valueKind?: ValueKind;
	compareTo?: { value: number; label?: string };
	hint?: string;
};

export function KpiTile({
	label,
	value,
	valueKind = "number",
	compareTo,
	hint,
}: Props) {
	const display = value === 0 ? "—" : fmtValue(value, valueKind);
	const delta = compareTo ? value - compareTo.value : null;
	const trendUp = delta != null && delta >= 0;
	const TrendIcon = trendUp ? TrendingUp : TrendingDown;

	return (
		<Card size="sm">
			<CardContent className="flex flex-col gap-1">
				<div className="text-muted-foreground text-xs uppercase tracking-wide">
					{label}
				</div>
				<div className="font-semibold text-2xl tabular-nums leading-tight">
					{display}
				</div>
				{compareTo && delta != null ? (
					<div className="flex items-center gap-1 text-xs">
						<span
							className={cn(
								"inline-flex items-center gap-0.5 font-medium",
								trendUp ? "text-emerald-600" : "text-rose-600",
							)}
						>
							<TrendIcon className="size-3" />
							{trendUp ? "+" : ""}
							{fmtValue(Math.abs(delta), valueKind)}
						</span>
						<span className="text-muted-foreground">
							{compareTo.label ?? "vs yesterday"}
						</span>
					</div>
				) : hint ? (
					<div className="text-muted-foreground text-xs">{hint}</div>
				) : null}
			</CardContent>
		</Card>
	);
}

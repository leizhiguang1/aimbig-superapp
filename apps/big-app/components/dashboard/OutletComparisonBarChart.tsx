"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { OutletComparisonPoint } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";
import { fmtValue, type ValueKind } from "./formatters";

const CONFIG: ChartConfig = {
	yesterday: { label: "Yesterday", color: "var(--chart-2)" },
	today: { label: "Today", color: "var(--chart-1)" },
};

type SeriesKey = "yesterday" | "today";

type Props = {
	title: string;
	subtitle?: string;
	data: OutletComparisonPoint[];
	valueKind?: ValueKind;
};

export function OutletComparisonBarChart({
	title,
	subtitle,
	data,
	valueKind = "number",
}: Props) {
	const formatValue = (n: number) => fmtValue(n, valueKind);
	const [hidden, setHidden] = useState<Record<SeriesKey, boolean>>({
		yesterday: false,
		today: false,
	});
	const toggle = (k: SeriesKey) =>
		setHidden((h) => ({ ...h, [k]: !h[k] }));

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{subtitle && <CardDescription>{subtitle}</CardDescription>}
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<ChartContainer
					config={CONFIG}
					className="aspect-auto h-[220px] w-full"
				>
					<BarChart
						data={data}
						margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="outletCode"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							width={40}
							allowDecimals={false}
							tickFormatter={(v) => formatValue(Number(v))}
						/>
						<ChartTooltip
							cursor={{ fill: "var(--muted)", opacity: 0.4 }}
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) => {
										const p = payload?.[0]?.payload as
											| OutletComparisonPoint
											| undefined;
										return p?.outletName ?? p?.outletCode ?? "";
									}}
									formatter={(value, name) => (
										<div className="flex w-full items-center justify-between gap-4">
											<span className="text-muted-foreground">
												{CONFIG[name as SeriesKey]?.label ?? name}
											</span>
											<span className="font-medium font-mono tabular-nums">
												{formatValue(Number(value))}
											</span>
										</div>
									)}
								/>
							}
						/>
						<Bar
							dataKey="yesterday"
							fill="var(--color-yesterday)"
							radius={[4, 4, 0, 0]}
							maxBarSize={40}
							hide={hidden.yesterday}
						/>
						<Bar
							dataKey="today"
							fill="var(--color-today)"
							radius={[4, 4, 0, 0]}
							maxBarSize={40}
							hide={hidden.today}
						/>
					</BarChart>
				</ChartContainer>

				<div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground text-xs">
					<LegendButton
						color="var(--chart-2)"
						label="Yesterday"
						hidden={hidden.yesterday}
						onClick={() => toggle("yesterday")}
					/>
					<LegendButton
						color="var(--chart-1)"
						label="Today"
						hidden={hidden.today}
						onClick={() => toggle("today")}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function LegendButton({
	color,
	label,
	hidden,
	onClick,
}: {
	color: string;
	label: string;
	hidden: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={!hidden}
			className={cn(
				"inline-flex items-center gap-1.5 rounded px-2 py-1 transition select-none",
				"hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				hidden && "opacity-40 line-through",
			)}
		>
			<span className="size-2 rounded-full" style={{ background: color }} />
			{label}
		</button>
	);
}

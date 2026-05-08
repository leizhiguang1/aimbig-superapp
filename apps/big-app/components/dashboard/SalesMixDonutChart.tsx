"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { DonutSlice } from "@/lib/services/dashboard";

const PALETTE = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--muted-foreground)",
];

export function SalesMixDonutChart({ slices }: { slices: DonutSlice[] }) {
	const total = slices.reduce((s, v) => s + v.value, 0);

	if (total === 0) {
		return (
			<div className="flex aspect-square w-full max-w-[260px] items-center justify-center text-muted-foreground text-sm">
				No sales in last 30 days
			</div>
		);
	}

	const config: ChartConfig = {
		value: { label: "Quantity" },
		...Object.fromEntries(
			slices.map((s, i) => [
				s.key,
				{ label: s.label, color: PALETTE[i % PALETTE.length] },
			]),
		),
	};

	return (
		<ChartContainer
			config={config}
			className="mx-auto aspect-square w-full max-w-[260px]"
		>
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							hideLabel
							formatter={(value, name) => (
								<div className="flex w-full items-center justify-between gap-4">
									<span className="text-muted-foreground">
										{config[name as string]?.label ?? name}
									</span>
									<span className="font-medium font-mono tabular-nums">
										{Number(value).toLocaleString()}
									</span>
								</div>
							)}
						/>
					}
				/>
				<Pie
					data={slices.map((s) => ({ ...s, fill: `var(--color-${s.key})` }))}
					dataKey="value"
					nameKey="key"
					innerRadius={64}
					outerRadius={96}
					strokeWidth={2}
					stroke="var(--background)"
				>
					{slices.map((s) => (
						<Cell key={s.key} fill={`var(--color-${s.key})`} />
					))}
					<Label
						content={({ viewBox }) => {
							if (
								viewBox &&
								"cx" in viewBox &&
								"cy" in viewBox &&
								typeof viewBox.cx === "number" &&
								typeof viewBox.cy === "number"
							) {
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor="middle"
										dominantBaseline="middle"
									>
										<tspan
											x={viewBox.cx}
											y={viewBox.cy - 8}
											className="fill-muted-foreground text-[11px]"
										>
											Total qty
										</tspan>
										<tspan
											x={viewBox.cx}
											y={viewBox.cy + 12}
											className="fill-foreground font-semibold text-lg"
										>
											{total.toLocaleString()}
										</tspan>
									</text>
								);
							}
							return null;
						}}
					/>
				</Pie>
				<ChartLegend
					content={<ChartLegendContent nameKey="key" />}
					verticalAlign="bottom"
				/>
			</PieChart>
		</ChartContainer>
	);
}

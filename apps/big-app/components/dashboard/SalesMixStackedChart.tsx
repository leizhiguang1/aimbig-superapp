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
import type { SalesMixSeries } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";
import { fmtAxisShort, fmtValue, type ValueKind } from "./formatters";

const PALETTE = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--muted-foreground)",
];

type Props = {
	title: string;
	subtitle?: string;
	data: SalesMixSeries;
	valueKind?: ValueKind;
};

function humanize(s: string): string {
	return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SalesMixStackedChart({
	title,
	subtitle,
	data,
	valueKind = "number",
}: Props) {
	const formatValue = (n: number) => fmtValue(n, valueKind);
	const formatAxis = (n: number) => fmtAxisShort(n);
	const [hidden, setHidden] = useState<Record<string, boolean>>({});
	const toggle = (k: string) =>
		setHidden((h) => ({ ...h, [k]: !h[k] }));

	const config: ChartConfig = Object.fromEntries(
		data.categories.map((cat, i) => [
			cat,
			{ label: humanize(cat), color: PALETTE[i % PALETTE.length] },
		]),
	);

	if (data.categories.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{subtitle && <CardDescription>{subtitle}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className="flex h-[240px] items-center justify-center text-muted-foreground text-sm">
						No sales in this window
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{subtitle && <CardDescription>{subtitle}</CardDescription>}
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<ChartContainer
					config={config}
					className="aspect-auto h-[240px] w-full"
				>
					<BarChart
						data={data.points}
						margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="label"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							width={48}
							tickFormatter={formatAxis}
						/>
						<ChartTooltip
							cursor={{ fill: "var(--muted)", opacity: 0.4 }}
							content={
								<ChartTooltipContent
									formatter={(value, name) => (
										<div className="flex w-full items-center justify-between gap-4">
											<span className="text-muted-foreground">
												{config[name as string]?.label ?? name}
											</span>
											<span className="font-medium font-mono tabular-nums">
												{formatValue(Number(value))}
											</span>
										</div>
									)}
								/>
							}
						/>
						{data.categories.map((cat) => (
							<Bar
								key={cat}
								dataKey={cat}
								stackId="mix"
								fill={`var(--color-${cat})`}
								maxBarSize={48}
								hide={hidden[cat]}
							/>
						))}
					</BarChart>
				</ChartContainer>

				<div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground text-xs">
					{data.categories.map((cat, i) => (
						<button
							key={cat}
							type="button"
							onClick={() => toggle(cat)}
							aria-pressed={!hidden[cat]}
							className={cn(
								"inline-flex items-center gap-1.5 rounded px-2 py-1 transition select-none",
								"hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								hidden[cat] && "opacity-40 line-through",
							)}
						>
							<span
								className="size-2 rounded-full"
								style={{ background: PALETTE[i % PALETTE.length] }}
							/>
							{humanize(cat)}
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

"use client";

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
import type { TimeSeriesPoint } from "@/lib/services/dashboard";
import { fmtAxisShort, fmtValue, type ValueKind } from "./formatters";

type Props = {
	title: string;
	subtitle?: string;
	data: TimeSeriesPoint[];
	valueKind?: ValueKind;
	color?: string;
};

export function TimeSeriesBarChart({
	title,
	subtitle,
	data,
	valueKind = "number",
	color = "var(--chart-1)",
}: Props) {
	const config: ChartConfig = {
		value: { label: "Value", color },
	};
	const formatValue = (n: number) => fmtValue(n, valueKind);
	const formatAxis = (n: number) => fmtAxisShort(n);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{subtitle && <CardDescription>{subtitle}</CardDescription>}
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={config}
					className="aspect-[4/3] w-full max-h-[280px]"
				>
					<BarChart
						data={data}
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
									hideLabel={false}
									formatter={(value, _name, item) => (
										<div className="flex w-full items-center justify-between gap-4">
											<span className="text-muted-foreground">
												{String(item.payload?.label ?? "")}
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
							dataKey="value"
							fill="var(--color-value)"
							radius={[4, 4, 0, 0]}
							maxBarSize={48}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

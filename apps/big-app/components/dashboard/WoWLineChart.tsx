"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
import type { DateRange, WoWResult } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";

const CONFIG: ChartConfig = {
	thisWeek: { label: "This week", color: "var(--chart-1)" },
	priorWeek: { label: "Last week", color: "var(--chart-2)" },
};

type SeriesKey = "thisWeek" | "priorWeek";

function fmtRange(r: DateRange) {
	const fmt = (s: string) => {
		const [y, m, d] = s.split("-");
		return `${d}/${m}/${y}`;
	};
	return `${fmt(r.start)} – ${fmt(r.end)}`;
}

type Props = {
	title: string;
	subtitle?: ReactNode;
	data: WoWResult;
};

export function WoWLineChart({ title, subtitle, data }: Props) {
	const { ranges } = data;
	const [hidden, setHidden] = useState<Record<SeriesKey, boolean>>({
		thisWeek: false,
		priorWeek: false,
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
					className="aspect-[4/3] w-full max-h-[260px]"
				>
					<LineChart
						data={data.points}
						margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							width={32}
							allowDecimals={false}
						/>
						<ChartTooltip
							cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
							content={<ChartTooltipContent indicator="dot" />}
						/>
						<Line
							type="monotone"
							dataKey="priorWeek"
							stroke="var(--color-priorWeek)"
							strokeWidth={2}
							dot={{ r: 3 }}
							activeDot={{ r: 5 }}
							hide={hidden.priorWeek}
						/>
						<Line
							type="monotone"
							dataKey="thisWeek"
							stroke="var(--color-thisWeek)"
							strokeWidth={2}
							dot={{ r: 3 }}
							activeDot={{ r: 5 }}
							connectNulls={false}
							hide={hidden.thisWeek}
						/>
					</LineChart>
				</ChartContainer>

				<div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground text-xs">
					<LegendButton
						color="var(--chart-2)"
						label={fmtRange(ranges.priorWeek)}
						hidden={hidden.priorWeek}
						onClick={() => toggle("priorWeek")}
					/>
					<LegendButton
						color="var(--chart-1)"
						label={fmtRange(ranges.thisWeek)}
						hidden={hidden.thisWeek}
						onClick={() => toggle("thisWeek")}
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
			<span
				className="size-2 rounded-full"
				style={{ background: color }}
			/>
			{label}
		</button>
	);
}

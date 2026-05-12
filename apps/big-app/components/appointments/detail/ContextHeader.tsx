"use client";

import { Fragment } from "react";
import type { ServiceChip } from "@/components/appointments/detail/history/types";
import { cn } from "@/lib/utils";
import { formatDateTimeNumeric } from "@/lib/utils/format-date";

function Pipe() {
	return (
		<span aria-hidden className="font-semibold text-foreground/70">
			|
		</span>
	);
}

export function ContextHeader({
	bookingRef,
	outletCode,
	date,
	serviceSummary,
	onJump,
}: {
	bookingRef: string | null;
	outletCode: string | null;
	date: Date | null;
	serviceSummary: ServiceChip[];
	onJump?: () => void;
}) {
	const hasServices = serviceSummary.length > 0;
	if (!bookingRef && !outletCode && !date && !hasServices) return null;
	const segments: { key: string; node: React.ReactNode }[] = [];
	if (bookingRef) {
		segments.push({
			key: "bref",
			node: (
				<button
					type="button"
					onClick={onJump}
					disabled={!onJump}
					className="font-bold text-foreground tabular-nums hover:underline disabled:cursor-default disabled:no-underline"
				>
					{bookingRef}
				</button>
			),
		});
	}
	if (outletCode) {
		segments.push({
			key: "outlet",
			node: (
				<span className="font-semibold text-foreground uppercase tracking-wide">
					{outletCode}
				</span>
			),
		});
	}
	if (date) {
		segments.push({
			key: "date",
			node: (
				<span className="text-foreground tabular-nums">
					{formatDateTimeNumeric(date)}
				</span>
			),
		});
	}
	for (let i = 0; i < serviceSummary.length; i++) {
		const chip = serviceSummary[i];
		const color = chip.truncated ? "text-muted-foreground" : "text-sky-600";
		segments.push({
			key: `svc-${chip.label}-${i}`,
			node: <span className={cn("font-semibold", color)}>{chip.label}</span>,
		});
	}

	return (
		<div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10px] leading-tight">
			{segments.map((seg, i) => (
				<Fragment key={seg.key}>
					{i > 0 && <Pipe />}
					{seg.node}
				</Fragment>
			))}
		</div>
	);
}

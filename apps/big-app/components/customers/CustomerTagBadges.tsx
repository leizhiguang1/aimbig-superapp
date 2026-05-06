"use client";

import { Tag as TagIcon } from "lucide-react";
import { useCustomerTag } from "@/components/brand-config/CustomerTagsProvider";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const SIZE: Record<
	Size,
	{ chip: string; dot: string; icon: string; iconWrap: string }
> = {
	sm: {
		chip: "px-1.5 py-0.5 text-[10px]",
		dot: "size-1.5",
		icon: "size-2.5",
		iconWrap: "gap-0.5",
	},
	md: {
		chip: "px-2 py-0.5 text-xs",
		dot: "size-2",
		icon: "size-3",
		iconWrap: "gap-1",
	},
};

function CustomerTagChip({
	value,
	size = "md",
	withIcon = false,
}: {
	value: string;
	size?: Size;
	withIcon?: boolean;
}) {
	const cfg = useCustomerTag(value);
	const sz = SIZE[size];
	const color = cfg?.color ?? null;
	const label = cfg?.label ?? value;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border font-medium",
				sz.chip,
				sz.iconWrap,
				color
					? ""
					: "border-violet-200 bg-violet-100 text-violet-700",
			)}
			style={
				color
					? {
							backgroundColor: `${color}1f`,
							borderColor: `${color}66`,
							color,
						}
					: undefined
			}
		>
			{color ? (
				<span
					className={cn("rounded-full", sz.dot)}
					style={{ backgroundColor: color }}
				/>
			) : withIcon ? (
				<TagIcon className={sz.icon} />
			) : null}
			{label}
		</span>
	);
}

export function CustomerTagBadges({
	tags,
	size = "md",
	withIcon = false,
	className,
}: {
	tags: string[] | null | undefined;
	size?: Size;
	withIcon?: boolean;
	className?: string;
}) {
	if (!tags || tags.length === 0) return null;
	return (
		<div className={cn("flex flex-wrap gap-1", className)}>
			{tags.map((t) => (
				<CustomerTagChip key={t} value={t} size={size} withIcon={withIcon} />
			))}
		</div>
	);
}

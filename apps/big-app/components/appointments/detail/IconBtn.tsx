import type { ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
	label: string;
	onClick: () => void;
	className: string;
	disabled?: boolean;
	children: ReactNode;
};

export function IconBtn({
	label,
	onClick,
	className,
	disabled,
	children,
}: Props) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					disabled={disabled}
					aria-label={label}
					className={cn(
						"flex size-[22px] items-center justify-center rounded-full transition disabled:opacity-50",
						className,
					)}
				>
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent side="top">{label}</TooltipContent>
		</Tooltip>
	);
}

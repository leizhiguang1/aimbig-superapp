import { Info } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	SERVICE_FORM_TOOLTIPS,
	type ServiceFormTooltipKey,
} from "@/lib/constants/service-form-tooltips";

export function InfoTip({ tooltipKey }: { tooltipKey: ServiceFormTooltipKey }) {
	const paragraphs = SERVICE_FORM_TOOLTIPS[tooltipKey];
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label="More info"
					className="inline-flex size-3.5 items-center justify-center rounded-full text-muted-foreground/80 hover:text-foreground"
				>
					<Info className="size-3.5" />
				</button>
			</TooltipTrigger>
			<TooltipContent
				side="top"
				className="max-w-sm whitespace-normal text-left leading-snug"
			>
				<div className="flex flex-col gap-1.5">
					{paragraphs.map((p) => (
						<p key={p}>{p}</p>
					))}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

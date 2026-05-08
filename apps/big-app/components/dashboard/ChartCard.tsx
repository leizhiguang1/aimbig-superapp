import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
	title: string;
	description?: string;
	height?: number;
	hint?: string;
	className?: string;
	contentClassName?: string;
};

export function ChartCard({
	title,
	description,
	height = 220,
	hint = "Chart placeholder",
	className,
	contentClassName,
}: Props) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className={contentClassName}>
				<div
					className={cn(
						"flex items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs",
					)}
					style={{ height }}
				>
					{hint}
				</div>
			</CardContent>
		</Card>
	);
}

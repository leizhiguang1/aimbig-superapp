import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
	label: string;
	htmlFor?: string;
	error?: string;
	required?: boolean;
	full?: boolean;
	className?: string;
	children: ReactNode;
};

export function Field({
	label,
	htmlFor,
	error,
	required,
	full,
	className,
	children,
}: FieldProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-1.5",
				full && "sm:col-span-2",
				className,
			)}
		>
			<label
				htmlFor={htmlFor}
				className="font-medium text-muted-foreground text-xs uppercase tracking-wide"
			>
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</label>
			{children}
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}

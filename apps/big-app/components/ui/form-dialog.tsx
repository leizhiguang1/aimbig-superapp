"use client";

import * as React from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIZE_CLASS: Record<NonNullable<FormDialogProps["size"]>, string> = {
	sm: "sm:max-w-md",
	md: "sm:max-w-lg",
	lg: "sm:max-w-2xl",
	xl: "sm:max-w-4xl",
	"2xl": "sm:max-w-6xl",
};

type FormDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description?: React.ReactNode;
	footer: React.ReactNode;
	children: React.ReactNode;
	size?: "sm" | "md" | "lg" | "xl" | "2xl";
	preventOutsideClose?: boolean;
	showCloseButton?: boolean;
	contentClassName?: string;
	headerClassName?: string;
	bodyClassName?: string;
	footerClassName?: string;
};

export function FormDialog({
	open,
	onOpenChange,
	title,
	description,
	footer,
	children,
	size = "lg",
	preventOutsideClose,
	showCloseButton,
	contentClassName,
	headerClassName,
	bodyClassName,
	footerClassName,
}: FormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"flex max-h-[90vh] flex-col gap-0 p-0",
					SIZE_CLASS[size],
					contentClassName,
				)}
				preventOutsideClose={preventOutsideClose}
				showCloseButton={showCloseButton}
			>
				<DialogHeader className={cn("border-b px-6 py-4", headerClassName)}>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>
				<div
					className={cn(
						"flex-1 space-y-4 overflow-y-auto px-6 py-4",
						bodyClassName,
					)}
				>
					{children}
				</div>
				<DialogFooter className={cn("border-t px-6 py-4", footerClassName)}>
					{footer}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

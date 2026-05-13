"use client";

import { CalendarDays, ChevronDown, Lock, Plus, UserPlus } from "lucide-react";
import type { CreateMode } from "@/components/appointments/AppointmentDialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
	onSelect: (mode: CreateMode) => void;
};

export function CreateAppointmentMenu({ onSelect }: Props) {
	return (
		<div className="inline-flex overflow-hidden rounded-md shadow-xs">
			<Button
				type="button"
				size="sm"
				variant="success"
				className="rounded-r-none border-r border-r-white/20"
				onClick={() => onSelect("booking")}
			>
				<Plus />
				New appointment
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						size="sm"
						variant="success"
						aria-label="More create options"
						className="rounded-l-none px-2"
					>
						<ChevronDown className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={4} className="w-48">
					<DropdownMenuItem onSelect={() => onSelect("booking")}>
						<CalendarDays className="size-4" />
						New appointment
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => onSelect("walkin")}>
						<UserPlus className="size-4" />
						Walk-in
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => onSelect("block")}>
						<Lock className="size-4" />
						Time block
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

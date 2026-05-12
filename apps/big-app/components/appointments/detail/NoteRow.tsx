"use client";

import {
	ChevronDown,
	ChevronUp,
	ExternalLink,
	Pencil,
	Pin,
	PinOff,
	RotateCcw,
	StickyNote,
	XCircle,
} from "lucide-react";
import { ContextHeader } from "@/components/appointments/detail/ContextHeader";
import type { NoteThread } from "@/components/appointments/detail/history/types";
import { IconBtn } from "@/components/appointments/detail/IconBtn";
import { usePermission } from "@/components/auth/PermissionsProvider";
import type { CaseNoteWithContext } from "@/lib/services/case-notes";
import { cn } from "@/lib/utils";
import { formatDayMonthYear, formatWeekdayTime } from "@/lib/utils/format-date";

function authorLabel(n: CaseNoteWithContext): string {
	if (!n.employee) return "—";
	return `${n.employee.first_name} ${n.employee.last_name}`.trim();
}

type Props = {
	item: NoteThread;
	collapsed: boolean;
	onToggle: () => void;
	onTogglePin: () => void;
	onEdit?: () => void;
	onCancel: () => void;
	onRevert: () => void;
	onJump?: () => void;
};

export function NoteRow({
	item,
	collapsed,
	onToggle,
	onTogglePin,
	onEdit,
	onCancel,
	onRevert,
	onJump,
}: Props) {
	const canEditNotes = usePermission("clinical.case_notes_edit");
	const content = item.note.content ?? "";
	const pinned = item.isPinned;
	const cancelled = item.isCancelled;
	return (
		<div
			className={cn(
				"border-b border-border/60 px-3.5 py-2.5",
				item.isCurrent && "border-l-[3px] border-l-blue-600 bg-blue-50/50",
				pinned && !cancelled && "bg-amber-50/50",
				cancelled && "opacity-60",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div>
					<div className="flex items-center gap-1.5">
						<StickyNote className="size-[12px] text-blue-600" />
						<span
							className={cn(
								"font-bold text-[12px] text-foreground",
								cancelled && "line-through",
							)}
						>
							{formatDayMonthYear(item.date)}
						</span>
						{pinned && <Pin className="size-[10px] text-amber-600" />}
						{cancelled && (
							<span className="rounded bg-slate-400 px-1.5 py-px font-bold text-[9px] text-white">
								CANCELLED
							</span>
						)}
						{item.isCurrent && !cancelled && (
							<span className="rounded bg-blue-600 px-1.5 py-px font-bold text-[9px] text-white">
								CURRENT
							</span>
						)}
					</div>
					<div className="mt-0.5 text-[11px] text-muted-foreground">
						{formatWeekdayTime(item.date)}
					</div>
				</div>
				<div className="flex items-center gap-1">
					{cancelled ? (
						canEditNotes ? (
							<IconBtn
								label="Restore note"
								onClick={onRevert}
								className="bg-blue-500 text-white hover:bg-blue-600"
							>
								<RotateCcw className="size-[11px]" />
							</IconBtn>
						) : null
					) : (
						<>
							{canEditNotes ? (
								<IconBtn
									label={pinned ? "Unpin" : "Pin to top"}
									onClick={onTogglePin}
									className={
										pinned
											? "bg-amber-500 text-white hover:bg-amber-600"
											: "border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
									}
								>
									{pinned ? (
										<PinOff className="size-[11px]" />
									) : (
										<Pin className="size-[11px]" />
									)}
								</IconBtn>
							) : null}
							{onJump && (
								<IconBtn
									label="Go to appointment"
									onClick={onJump}
									className="bg-blue-500 text-white hover:bg-blue-600"
								>
									<ExternalLink className="size-[11px]" />
								</IconBtn>
							)}
							{canEditNotes && onEdit && (
								<IconBtn
									label="Edit"
									onClick={onEdit}
									className="bg-emerald-500 text-white hover:bg-emerald-600"
								>
									<Pencil className="size-[11px]" />
								</IconBtn>
							)}
							{canEditNotes ? (
								<IconBtn
									label="Cancel note"
									onClick={onCancel}
									className="bg-rose-500 text-white hover:bg-rose-600"
								>
									<XCircle className="size-[11px]" />
								</IconBtn>
							) : null}
						</>
					)}
				</div>
			</div>
			<ContextHeader
				bookingRef={item.bookingRef}
				outletCode={item.outletCode}
				date={item.appointmentDate}
				serviceSummary={item.serviceSummary}
				onJump={onJump}
			/>
			<button
				type="button"
				aria-expanded={!collapsed}
				onClick={onToggle}
				className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
			>
				{collapsed ? (
					<ChevronDown className="size-[11px]" />
				) : (
					<ChevronUp className="size-[11px]" />
				)}
				<span>{collapsed ? "Show" : "Hide"} note</span>
			</button>
			{!collapsed && (
				<p
					className={cn(
						"mt-1 whitespace-pre-wrap wrap-break-word text-[11px] text-muted-foreground leading-snug",
						cancelled && "line-through",
					)}
				>
					{content === "" ? (
						<span className="text-muted-foreground/50">(empty note)</span>
					) : (
						content
					)}
				</p>
			)}
			<div className="mt-1.5 text-[9px] text-muted-foreground/80">
				Last updated by: {authorLabel(item.note)}
			</div>
		</div>
	);
}

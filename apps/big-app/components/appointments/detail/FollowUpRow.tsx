"use client";

import {
	BellRing,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	MessageSquare,
	Pencil,
	Phone,
	Pin,
	PinOff,
	Trash2,
} from "lucide-react";
import { ContextHeader } from "@/components/appointments/detail/HistoryPanel";
import type { FollowUpThread } from "@/components/appointments/detail/HistoryPanel";
import { IconBtn } from "@/components/appointments/detail/IconBtn";
import type { FollowUpWithRefs } from "@/lib/services/follow-ups";
import { cn } from "@/lib/utils";
import { formatDayMonthYear, formatWeekdayTime } from "@/lib/utils/format-date";

function followUpAuthorLabel(f: FollowUpWithRefs): string {
	if (!f.author) return "—";
	return `${f.author.first_name} ${f.author.last_name}`.trim();
}

function reminderEmployeeLabel(f: FollowUpWithRefs): string | null {
	if (!f.reminder_employee) return null;
	return `${f.reminder_employee.first_name} ${f.reminder_employee.last_name}`.trim();
}

function formatReminderDate(iso: string): string {
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return iso;
	return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

type Props = {
	item: FollowUpThread;
	collapsed: boolean;
	onToggle: () => void;
	onTogglePin: () => void;
	onEdit: () => void;
	onDelete: () => void;
	onJump?: () => void;
};

export function FollowUpRow({
	item,
	collapsed,
	onToggle,
	onTogglePin,
	onEdit,
	onDelete,
	onJump,
}: Props) {
	const f = item.followUp;
	const pinned = item.isPinned;
	const ReminderIcon = f.reminder_method === "whatsapp" ? MessageSquare : Phone;
	const reminderLabel = f.reminder_method === "whatsapp" ? "WhatsApp" : "Call";
	const reminderEmp = reminderEmployeeLabel(f);
	return (
		<div
			className={cn(
				"border-b border-border/60 px-3.5 py-2.5",
				item.isCurrent && "border-l-[3px] border-l-violet-600 bg-violet-50/40",
				pinned && "bg-amber-50/50",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div>
					<div className="flex items-center gap-1.5">
						<BellRing className="size-[12px] text-violet-600" />
						<span className="font-bold text-[12px] text-foreground">
							{formatDayMonthYear(item.date)}
						</span>
						{pinned && <Pin className="size-[10px] text-amber-600" />}
						{item.isCurrent && (
							<span className="rounded bg-violet-600 px-1.5 py-px font-bold text-[9px] text-white">
								CURRENT
							</span>
						)}
					</div>
					<div className="mt-0.5 text-[11px] text-muted-foreground">
						{formatWeekdayTime(item.date)}
					</div>
				</div>
				<div className="flex items-center gap-1">
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
					{onJump && (
						<IconBtn
							label="Go to appointment"
							onClick={onJump}
							className="bg-violet-500 text-white hover:bg-violet-600"
						>
							<ExternalLink className="size-[11px]" />
						</IconBtn>
					)}
					<IconBtn
						label="Edit follow-up"
						onClick={onEdit}
						className="bg-emerald-500 text-white hover:bg-emerald-600"
					>
						<Pencil className="size-[11px]" />
					</IconBtn>
					<IconBtn
						label="Delete follow-up"
						onClick={onDelete}
						className="bg-rose-500 text-white hover:bg-rose-600"
					>
						<Trash2 className="size-[11px]" />
					</IconBtn>
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
				<span>{collapsed ? "Show" : "Hide"} details</span>
			</button>
			{!collapsed && (
				<>
					<p className="mt-1 whitespace-pre-wrap wrap-break-word text-[11px] text-muted-foreground leading-snug">
						{f.content === "" ? (
							<span className="text-muted-foreground/50">(empty)</span>
						) : (
							f.content
						)}
					</p>
					{f.has_reminder && f.reminder_date && (
						<div
							className={cn(
								"mt-2 flex items-start gap-1.5 rounded border px-2 py-1.5 text-[10px]",
								f.reminder_done
									? "border-emerald-200 bg-emerald-50 text-emerald-700"
									: "border-amber-200 bg-amber-50 text-amber-800",
							)}
						>
							<ReminderIcon className="mt-px size-[11px] shrink-0" />
							<div className="flex-1">
								<div className="font-semibold">
									{reminderLabel} · {formatReminderDate(f.reminder_date)}
									{f.reminder_done && " · done"}
								</div>
								{reminderEmp && (
									<div className="mt-px text-[9px] opacity-80">
										Assigned to {reminderEmp}
									</div>
								)}
							</div>
						</div>
					)}
				</>
			)}
			<div className="mt-1.5 text-[9px] text-muted-foreground/80">
				Last updated by: {followUpAuthorLabel(f)}
			</div>
		</div>
	);
}

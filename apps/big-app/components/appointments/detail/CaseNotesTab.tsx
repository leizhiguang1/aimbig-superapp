"use client";

import {
	BookMarked,
	FileBadge,
	FileCheck,
	FileText,
	Grid3x3,
	ImagePlus,
	Pill,
	Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Toast } from "@/components/appointments/AppointmentToastStack";
import { usePermission } from "@/components/auth/PermissionsProvider";
import { AddMcDialog } from "@/components/medical-certificates/AddMcDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	createCaseNoteAction,
	updateCaseNoteAction,
} from "@/lib/actions/case-notes";
import type { AppointmentWithRelations } from "@/lib/services/appointments";
import type { MedicalCertificateWithRefs } from "@/lib/services/medical-certificates";
import { cn } from "@/lib/utils";

type PendingEdit = { noteId: string; content: string };

type Props = {
	appointment: AppointmentWithRelations;
	medicalCertificates: MedicalCertificateWithRefs[];
	onToast: (
		message: string,
		variant?: Toast["variant"],
		durationMs?: number,
	) => void;
	pendingEdit?: PendingEdit | null;
	onPendingEditHandled?: () => void;
};

export function CaseNotesTab({
	appointment,
	medicalCertificates,
	onToast,
	pendingEdit,
	onPendingEditHandled,
}: Props) {
	const router = useRouter();
	const [draft, setDraft] = useState("");
	const [editingFromHistoryId, setEditingFromHistoryId] = useState<
		string | null
	>(null);
	const [mcDialogOpen, setMcDialogOpen] = useState(false);
	const canIssueMc = usePermission("clinical.medical_certificates");
	const canEditNotes = usePermission("clinical.case_notes_edit");
	const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false);
	const [, startTransition] = useTransition();

	useEffect(() => {
		if (pendingEdit == null) return;
		if (draft.trim()) {
			setOverwriteConfirmOpen(true);
		} else {
			setDraft(pendingEdit.content);
			setEditingFromHistoryId(pendingEdit.noteId);
			onPendingEditHandled?.();
		}
	}, [pendingEdit]); // eslint-disable-line react-hooks/exhaustive-deps

	const isLead = !appointment.is_time_block && !appointment.customer_id;
	const isBlock = appointment.is_time_block;
	const customerId = appointment.customer_id;

	const refresh = () => startTransition(() => router.refresh());

	const clearDraft = () => {
		setDraft("");
		setEditingFromHistoryId(null);
	};

	const handleSave = () => {
		if (!draft.trim()) return;
		const content = draft.trim();

		if (editingFromHistoryId) {
			const id = editingFromHistoryId;
			clearDraft();
			startTransition(async () => {
				try {
					await updateCaseNoteAction(appointment.id, id, { content });
					onToast("Note updated", "success");
					refresh();
				} catch (err) {
					onToast(
						err instanceof Error ? err.message : "Could not update note",
						"error",
					);
					refresh();
				}
			});
			return;
		}

		if (!customerId) return;
		clearDraft();
		startTransition(async () => {
			try {
				await createCaseNoteAction(appointment.id, {
					appointment_id: appointment.id,
					customer_id: customerId,
					employee_id: appointment.employee_id ?? null,
					content,
				});
				onToast("Note saved", "success");
				refresh();
			} catch (err) {
				setDraft(content);
				onToast(
					err instanceof Error ? err.message : "Could not save note",
					"error",
				);
			}
		});
	};

	if (isBlock) {
		return (
			<div className="rounded-md border bg-muted/20 p-6 text-center text-muted-foreground text-sm">
				Case notes don't apply to time blocks.
			</div>
		);
	}

	if (isLead) {
		return (
			<div className="rounded-md border bg-amber-50 p-6 text-center text-amber-900 text-sm">
				Register this walk-in lead as a customer to start recording case notes.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{canEditNotes ? (
				<div
					className={cn(
						"rounded-md border bg-card p-4",
						editingFromHistoryId && "border-amber-300 bg-amber-50/30",
					)}
				>
					<div className="flex items-center justify-between">
						<div className="text-muted-foreground text-xs uppercase tracking-wide">
							{editingFromHistoryId ? "Editing note" : "New case note"}
						</div>
						<CaseNoteToolbar
							onAddMc={() => setMcDialogOpen(true)}
							mcCount={medicalCertificates.length}
							canIssueMc={canIssueMc}
						/>
					</div>
					<textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						rows={6}
						placeholder="Chief complaint, findings, procedure details, medication…"
						className="mt-3 w-full resize-y rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					/>
					<div className="mt-3 flex items-center justify-end gap-2">
						{editingFromHistoryId && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={clearDraft}
							>
								Cancel
							</Button>
						)}
						<Button
							type="button"
							size="sm"
							onClick={handleSave}
							disabled={!draft.trim()}
						>
							<Save className="size-3.5" />
							{editingFromHistoryId ? "Update note" : "Save note"}
						</Button>
					</div>
				</div>
			) : null}

			{medicalCertificates.length > 0 && (
				<MedicalCertificateStrip items={medicalCertificates} />
			)}

			{customerId && (
				<AddMcDialog
					open={mcDialogOpen}
					onClose={() => setMcDialogOpen(false)}
					appointmentId={appointment.id}
					customerId={customerId}
					outletId={appointment.outlet_id}
					issuingEmployeeId={appointment.employee_id ?? null}
					defaultStartDate={new Date(appointment.start_at)
						.toISOString()
						.slice(0, 10)}
					onCreated={(result) => {
						onToast(
							`Medical certificate ${result.code} saved`,
							"success",
							5000,
						);
						refresh();
					}}
				/>
			)}

			<ConfirmDialog
				open={overwriteConfirmOpen}
				onOpenChange={(o) => {
					if (!o) {
						setOverwriteConfirmOpen(false);
						onPendingEditHandled?.();
					}
				}}
				title="Overwrite current draft?"
				description="The editor already has text. Loading this note will replace it."
				confirmLabel="Replace"
				onConfirm={() => {
					setDraft(pendingEdit?.content ?? "");
					setEditingFromHistoryId(pendingEdit?.noteId ?? null);
					setOverwriteConfirmOpen(false);
					onPendingEditHandled?.();
				}}
			/>
		</div>
	);
}

function CaseNoteToolbar({
	onAddMc,
	mcCount,
	canIssueMc,
}: {
	onAddMc: () => void;
	mcCount: number;
	canIssueMc: boolean;
}) {
	return (
		<div className="flex items-center gap-1">
			<StubButton
				icon={ImagePlus}
				label="Annotate image"
				description="Draw arrows, circles, and notes on an x-ray or intra-oral photo, then attach it to this case note."
			/>
			<StubButton
				icon={FileText}
				label="Note templates"
				description="Insert a pre-written clinical template (scaling, extraction, consult, etc.) to avoid re-typing the same structure."
			/>
			<StubButton
				icon={Pill}
				label="Prescription"
				description="Write, save, and print a prescription slip for this visit."
			/>
			{canIssueMc ? (
				<ToolbarButton
					icon={FileBadge}
					label={
						mcCount > 0
							? `Add medical certificate (${mcCount} issued for this visit)`
							: "Add medical certificate"
					}
					onClick={onAddMc}
					badge={mcCount}
				/>
			) : null}
			<StubButton
				icon={BookMarked}
				label="ICD-10 lookup"
				description="Search the ICD-10 catalogue and attach standardised diagnosis codes to this case note."
			/>
			<StubButton
				icon={Grid3x3}
				label="Dental chart"
				description="Open the interactive tooth chart to record findings, treatments, and restorations per tooth."
			/>
		</div>
	);
}

function ToolbarButton({
	icon: Icon,
	label,
	onClick,
	badge,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	onClick: () => void;
	badge?: number;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					aria-label={label}
					className="relative flex size-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
				>
					<Icon className="size-4" />
					{badge !== undefined && badge > 0 && (
						<span className="-right-0.5 -top-0.5 absolute flex min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold leading-4 text-blue-950 ring-2 ring-white">
							{badge}
						</span>
					)}
				</button>
			</TooltipTrigger>
			<TooltipContent side="top">{label}</TooltipContent>
		</Tooltip>
	);
}

function formatDmy(iso: string): string {
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

function formatHhmm(t: string | null): string {
	if (!t) return "";
	return t.slice(0, 5);
}

function formatDayOffDuration(
	days: number | null,
	halfPeriod: string | null,
): string {
	if (days == null) return "";
	const whole = Math.floor(days);
	const hasHalf = Math.abs(days - whole) > 0.01;
	const base = `${whole} day${whole === 1 ? "" : "s"}`;
	if (!hasHalf) return base;
	return `${base} + ½${halfPeriod ? ` (${halfPeriod})` : ""}`;
}

function MedicalCertificateStrip({
	items,
}: {
	items: MedicalCertificateWithRefs[];
}) {
	return (
		<div className="rounded-md border bg-sky-50/40">
			<div className="flex items-center justify-between border-b border-sky-100 px-4 py-2.5">
				<div className="flex items-center gap-2 text-sky-700 text-xs uppercase tracking-wide">
					<FileCheck className="size-3.5" />
					<span>Medical certificates on this visit</span>
				</div>
				<span className="text-[10px] font-medium tabular-nums text-sky-700/70">
					×{items.length}
				</span>
			</div>
			<div className="flex flex-col divide-y divide-sky-100">
				{items.map((mc) => (
					<Link
						key={mc.id}
						href={`/medical-certificates/${mc.id}`}
						className="flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-sky-100/40"
					>
						<FileCheck className="size-4 shrink-0 text-sky-600" />
						<span className="font-mono font-semibold">{mc.code}</span>
						<span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium uppercase text-sky-700">
							{mc.slip_type === "day_off" ? "Day-off" : "Time-off"}
						</span>
						<span className="min-w-0 flex-1 truncate text-muted-foreground text-xs">
							{mc.slip_type === "day_off"
								? `${formatDmy(mc.start_date)} → ${formatDmy(mc.end_date)} · ${formatDayOffDuration(
										mc.duration_days == null ? null : Number(mc.duration_days),
										mc.half_day_period,
									)}`
								: `${formatDmy(mc.start_date)} · ${formatHhmm(mc.start_time)}–${formatHhmm(mc.end_time)} · ${Number(mc.duration_hours ?? 0)}h`}
						</span>
						{mc.issuing_employee && (
							<span className="hidden text-muted-foreground text-xs sm:inline">
								{mc.issuing_employee.first_name} {mc.issuing_employee.last_name}
							</span>
						)}
					</Link>
				))}
			</div>
		</div>
	);
}

function StubButton({
	icon: Icon,
	label,
	description,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	description: string;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label={label}
					aria-disabled="true"
					data-stub="true"
					onClick={() => {}}
					className="flex size-8 cursor-not-allowed items-center justify-center rounded-md bg-blue-600/50 text-white shadow-sm transition hover:bg-blue-600/60"
				>
					<Icon className="size-4" />
				</button>
			</TooltipTrigger>
			<TooltipContent side="top" className="max-w-xs items-start px-3 py-2">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<span className="font-semibold">{label}</span>
						<span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-900">
							Coming soon
						</span>
					</div>
					<p className="text-[11px] leading-snug text-background/75">
						{description}
					</p>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

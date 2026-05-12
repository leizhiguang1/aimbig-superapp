"use client";

import {
	Building2,
	CalendarDays,
	Cigarette,
	FileText,
	Heart,
	Pill,
	Plus,
	Stethoscope,
	User,
	UserX,
	Wallet,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useOutletPath } from "@/hooks/use-outlet-path";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	APPOINTMENT_STATUS_CONFIG,
	type AppointmentStatus,
} from "@/lib/constants/appointment-status";
import {
	countryNameForCode,
	DEFAULT_COUNTRY_CODE,
	flagForCountryCode,
	nationalityForCode,
} from "@/lib/constants/countries";
import type { CustomerLineItem } from "@/lib/services/appointment-line-items";
import type { CustomerTimelineAppointment } from "@/lib/services/appointments";
import type { CustomerWithRelations } from "@/lib/services/customers";
import { cn } from "@/lib/utils";
import { money } from "@/lib/utils/money";

export function StatPill({
	dotClass,
	label,
	value,
	valueClass,
}: {
	dotClass: string;
	label: string;
	value: string;
	valueClass: string;
}) {
	return (
		<div className="flex flex-col items-center gap-0.5 rounded-full border bg-background px-3 py-2 shadow-sm">
			<div className="flex items-center gap-1.5">
				<span className={cn("size-2 rounded-full", dotClass)} />
				<span className={cn("font-semibold text-sm tabular-nums", valueClass)}>
					{value}
				</span>
			</div>
			<span className="text-[10px] text-muted-foreground uppercase">
				{label}
			</span>
		</div>
	);
}

export function OriginRows({
	addressCountryCode,
	nationalityCode,
}: {
	addressCountryCode: string | null | undefined;
	nationalityCode: string | null | undefined;
}) {
	const resolvedAddressCode = addressCountryCode || DEFAULT_COUNTRY_CODE;
	const addressFlag = flagForCountryCode(resolvedAddressCode);
	const addressName = countryNameForCode(resolvedAddressCode);
	const showNationality = !!nationalityCode;
	const nationalityFlag = showNationality
		? flagForCountryCode(nationalityCode)
		: "";
	const nationalityName = showNationality
		? nationalityForCode(nationalityCode)
		: "";

	return (
		<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="flex cursor-default items-center gap-1">
						{addressFlag && (
							<span className="text-sm leading-none">{addressFlag}</span>
						)}
						<span>{addressName}</span>
					</span>
				</TooltipTrigger>
				<TooltipContent>Country</TooltipContent>
			</Tooltip>
			{showNationality && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="flex cursor-default items-center gap-1">
							{nationalityFlag && (
								<span className="text-sm leading-none">{nationalityFlag}</span>
							)}
							<span>{nationalityName}</span>
						</span>
					</TooltipTrigger>
					<TooltipContent>Nationality</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}

export function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<span className="text-[10px] text-muted-foreground uppercase">
				{label}
			</span>
			<span className="font-semibold text-[13px]">{value}</span>
		</div>
	);
}

export function TimelineTab({
	groupedTimeline,
	stats,
	lineItemsByAppointment,
	onAdd,
}: {
	groupedTimeline: {
		key: string;
		appointments: CustomerTimelineAppointment[];
	}[];
	stats: {
		total: number;
		completed: number;
		cancelled: number;
		noShow: number;
	};
	lineItemsByAppointment: Map<string, CustomerLineItem[]>;
	onAdd: () => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-start justify-between gap-3">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
							aria-label="New appointment"
							onClick={onAdd}
						>
							<Plus className="size-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent>New appointment</TooltipContent>
				</Tooltip>
				<div className="flex flex-col items-end gap-2">
					<div className="font-semibold text-muted-foreground/70 text-sm uppercase tracking-wide">
						Summary
					</div>
					<div className="flex flex-wrap items-center justify-end gap-1.5">
						<SummaryChip
							dotClass="bg-sky-500"
							label="Appointments"
							value={stats.total}
						/>
						<SummaryChip
							dotClass="bg-emerald-500"
							label="Completed"
							value={stats.completed}
						/>
						<SummaryChip
							dotClass="bg-rose-500"
							label="Cancelled"
							value={stats.cancelled}
						/>
						<SummaryChip
							dotClass="bg-slate-400"
							label="No Show"
							value={stats.noShow}
						/>
					</div>
				</div>
			</div>

			{groupedTimeline.length === 0 ? (
				<div className="rounded-md border bg-muted/30 p-12 text-center text-muted-foreground text-sm">
					No appointments yet.
				</div>
			) : (
				<div className="relative flex flex-col gap-4 pl-4">
					<div className="absolute top-0 bottom-0 left-[5px] w-px bg-border" />
					{groupedTimeline.map((group) => (
						<div key={group.key} className="flex flex-col gap-3">
							<div className="relative flex">
								<span className="-left-[2px] absolute top-2 size-2.5 rounded-full bg-sky-500 ring-4 ring-background" />
								<span className="ml-2 inline-flex items-center rounded-full bg-sky-500 px-3 py-1 font-semibold text-white text-xs">
									{group.key}
								</span>
							</div>
							<div className="flex flex-col gap-3 pl-2">
								{group.appointments.map((a) => (
									<AppointmentTimelineCard
										key={a.id}
										appointment={a}
										lineItems={lineItemsByAppointment.get(a.id) ?? []}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function SummaryChip({
	dotClass,
	label,
	value,
}: {
	dotClass: string;
	label: string;
	value: number;
}) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px]">
			<span className={cn("size-2 rounded-full", dotClass)} />
			<span className="font-medium">{label}</span>
			<span className="text-muted-foreground">:</span>
			<span className="font-semibold tabular-nums">{value}</span>
		</span>
	);
}

function AppointmentTimelineCard({
	appointment,
	lineItems,
}: {
	appointment: CustomerTimelineAppointment;
	lineItems: CustomerLineItem[];
}) {
	const path = useOutletPath();
	const d = new Date(appointment.start_at);
	const day = d.getDate();
	const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
	const monthYear = d.toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});
	const time = d.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	const total = lineItems.reduce(
		(sum, li) => sum + Number(li.unit_price) * Number(li.quantity),
		0,
	);

	const serviceSummary = lineItems
		.filter((li) => li.service)
		.map(
			(li) =>
				`${li.service?.name?.toUpperCase() ?? li.description?.toUpperCase() ?? ""} x ${li.quantity}`,
		)
		.join(", ");

	const employee = appointment.employee
		? `${appointment.employee.first_name} ${appointment.employee.last_name}`.toUpperCase()
		: null;

	const outletRoom = [
		appointment.outlet?.name?.toUpperCase(),
		appointment.room?.name?.toUpperCase(),
	]
		.filter(Boolean)
		.join(" @ ");

	const statusKey = (appointment.status as AppointmentStatus) ?? "pending";
	const statusCfg = APPOINTMENT_STATUS_CONFIG[statusKey];
	const isCancelled = statusKey === "cancelled";
	const cancelledByName = appointment.cancelled_by_employee
		? `${appointment.cancelled_by_employee.first_name} ${appointment.cancelled_by_employee.last_name}`.toUpperCase()
		: null;

	return (
		<div
			className={cn(
				"rounded-xl border bg-card p-4 shadow-sm",
				isCancelled && "border-rose-200 bg-rose-50/30",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"font-bold text-3xl leading-none tabular-nums",
							isCancelled && "text-muted-foreground line-through",
						)}
					>
						{day}
					</div>
					<div className="flex flex-col leading-tight">
						<span className="font-medium text-sm">{weekday}</span>
						<span className="text-[11px] text-muted-foreground">
							{monthYear} | {time}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Link
						href={path(`/appointments/${appointment.booking_ref}`)}
						className="flex size-9 items-center justify-center rounded-full bg-sky-600 font-semibold text-[11px] text-white shadow-sm transition hover:bg-sky-700"
					>
						Go
					</Link>
					<span
						className={cn(
							"inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold text-[11px]",
							statusCfg.badge,
						)}
					>
						<statusCfg.Icon className="size-3" />
						{statusCfg.label}
					</span>
				</div>
			</div>

			<div className="mt-3 flex flex-col gap-1.5 text-[12px]">
				<div className="flex items-center gap-1 text-muted-foreground">
					<CalendarDays className="size-3" />
					<span className="font-mono">{appointment.booking_ref}</span>
				</div>
				{serviceSummary && (
					<div className="flex items-start gap-1 font-semibold uppercase leading-snug">
						<Stethoscope className="mt-[2px] size-3 shrink-0 text-muted-foreground" />
						<span>{serviceSummary}</span>
					</div>
				)}
				{total > 0 && (
					<div className="flex items-center gap-1 font-semibold text-emerald-600">
						<Wallet className="size-3.5" />
						<span className="tabular-nums">MYR {money(total)}</span>
					</div>
				)}
				{outletRoom && (
					<div className="flex items-center gap-1 text-muted-foreground uppercase">
						<Building2 className="size-3" />
						<span>{outletRoom}</span>
					</div>
				)}
				{employee && (
					<div className="flex items-center gap-1 text-muted-foreground">
						<User className="size-3" />
						<span>{employee}</span>
					</div>
				)}
				{appointment.notes && (
					<div className="flex items-start gap-1 text-muted-foreground">
						<FileText className="mt-[2px] size-3 shrink-0" />
						<span>
							<span className="font-semibold">Remarks:</span>{" "}
							{appointment.notes}
						</span>
					</div>
				)}
				{isCancelled && (
					<div className="mt-1 flex flex-col gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-700">
						{appointment.cancellation_reason && (
							<div className="flex items-start gap-1">
								<XCircle className="mt-[2px] size-3 shrink-0" />
								<span>
									<span className="font-semibold">Cancelled Reason:</span>{" "}
									{appointment.cancellation_reason}
								</span>
							</div>
						)}
						{cancelledByName && (
							<div className="flex items-center gap-1">
								<UserX className="size-3" />
								<span>
									<span className="font-semibold">Cancelled By:</span>{" "}
									{cancelledByName}
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export function MedicalInfoCard({
	customer,
}: {
	customer: CustomerWithRelations;
}) {
	const hasMedical =
		customer.smoker ||
		customer.drug_allergies ||
		(customer.medical_conditions && customer.medical_conditions.length > 0);

	if (!hasMedical) return null;

	return (
		<div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
			<div className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground uppercase">
				<Heart className="size-3.5" />
				Medical Information
			</div>

			{customer.smoker && (
				<div className="flex items-center gap-2 text-xs">
					<Cigarette className="size-3.5 shrink-0 text-muted-foreground" />
					<span className="text-[10px] text-muted-foreground uppercase">
						Smoker:
					</span>
					<span className="font-medium capitalize">{customer.smoker}</span>
				</div>
			)}

			{customer.drug_allergies && (
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
						<Pill className="size-3 shrink-0" />
						Drug Allergies
					</div>
					<span className="text-xs leading-snug">
						{customer.drug_allergies}
					</span>
				</div>
			)}

			{customer.medical_conditions &&
				customer.medical_conditions.length > 0 && (
					<div className="flex flex-col gap-1">
						<span className="text-[10px] text-muted-foreground uppercase">
							Conditions
						</span>
						<div className="flex flex-wrap gap-1">
							{customer.medical_conditions.map((c) => (
								<span
									key={c}
									className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
								>
									{c}
								</span>
							))}
						</div>
					</div>
				)}
		</div>
	);
}

export function PlaceholderTab({ label }: { label: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 rounded-md border bg-muted/30 p-16 text-center">
			<div className="font-medium text-base">{label}</div>
			<div className="text-muted-foreground text-sm">
				This section will be built in a future phase.
			</div>
		</div>
	);
}

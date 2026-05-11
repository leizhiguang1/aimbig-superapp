"use client";

import { UserPlus } from "lucide-react";
import { useAppointmentTagList } from "@/components/brand-config/AppointmentConfigProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	APPOINTMENT_STATUS_CONFIG,
	type AppointmentStatus,
} from "@/lib/constants/appointment-status";
import {
	LEAD_SOURCE_LABEL,
	LEAD_SOURCES,
	type LeadSource,
} from "@/lib/schemas/appointments";
import type { CustomerWithRelations } from "@/lib/services/customers";
import type { RosterEmployee } from "@/lib/services/employee-shifts";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
	"h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type CustomerSectionProps = {
	isLead: boolean;
	onToggleLead: (v: boolean) => void;
	customerError?: string;
	leadNameError?: string;
	leadPhoneError?: string;
	leadSourceError?: string;
	leadAttendedByError?: string;
	selectedCustomer: CustomerWithRelations | null;
	leadName: string;
	leadPhone: string;
	leadSource: LeadSource | null;
	leadAttendedById: string | null;
	search: string;
	pickerOpen: boolean;
	setPickerOpen: (v: boolean) => void;
	setSearch: (v: string) => void;
	candidates: CustomerWithRelations[];
	employees: RosterEmployee[];
	showRegisterLead: boolean;
	onPickCustomer: (id: string) => void;
	onClear: () => void;
	onLeadNameChange: (v: string) => void;
	onLeadPhoneChange: (v: string) => void;
	onLeadSourceChange: (v: LeadSource) => void;
	onLeadAttendedByChange: (v: string | null) => void;
	onRegister: () => void;
	onNewCustomer: () => void;
};

export function CustomerSection({
	isLead,
	onToggleLead,
	customerError,
	leadNameError,
	leadPhoneError,
	leadSourceError,
	leadAttendedByError,
	selectedCustomer,
	leadName,
	leadPhone,
	leadSource,
	leadAttendedById,
	search,
	pickerOpen,
	setPickerOpen,
	setSearch,
	candidates,
	employees,
	showRegisterLead,
	onPickCustomer,
	onClear,
	onLeadNameChange,
	onLeadPhoneChange,
	onLeadSourceChange,
	onLeadAttendedByChange,
	onRegister,
	onNewCustomer,
}: CustomerSectionProps) {
	return (
		<div className="flex flex-col gap-3">
			<label
				htmlFor="appointment-is-lead"
				className={cn(
					"flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
					isLead
						? "border-amber-300 bg-amber-50 text-amber-900"
						: "border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/40",
				)}
			>
				<Checkbox
					id="appointment-is-lead"
					checked={isLead}
					onCheckedChange={(v) => onToggleLead(v === true)}
				/>
				<span className="font-medium">This is a walk-in lead</span>
				<span className="text-[11px] opacity-80">(no customer record yet)</span>
			</label>

			{isLead ? (
				<div className="flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50/40 p-3">
					<Field label="Lead name" required error={leadNameError}>
						<Input
							placeholder="Walk-in customer name"
							value={leadName}
							onChange={(e) => onLeadNameChange(e.target.value)}
						/>
					</Field>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<Field label="Phone" required error={leadPhoneError}>
							<Input
								placeholder="+60 12-345 6789"
								value={leadPhone}
								onChange={(e) =>
									onLeadPhoneChange(e.target.value.replace(/[^0-9+\- ]/g, ""))
								}
							/>
						</Field>
						<Field label="Source" required error={leadSourceError}>
							<select
								className={SELECT_CLASS}
								value={leadSource ?? ""}
								onChange={(e) =>
									onLeadSourceChange(e.target.value as LeadSource)
								}
							>
								<option value="">Please choose…</option>
								{LEAD_SOURCES.map((s) => (
									<option key={s} value={s}>
										{LEAD_SOURCE_LABEL[s]}
									</option>
								))}
							</select>
						</Field>
					</div>
					<Field label="Lead attended by" required error={leadAttendedByError}>
						<select
							className={SELECT_CLASS}
							value={leadAttendedById ?? ""}
							onChange={(e) => onLeadAttendedByChange(e.target.value || null)}
						>
							<option value="">Please choose…</option>
							{employees.map((e) => (
								<option key={e.id} value={e.id}>
									{e.first_name} {e.last_name}
								</option>
							))}
						</select>
					</Field>
					{showRegisterLead && (
						<button
							type="button"
							onClick={onRegister}
							className="group mt-1 inline-flex w-full items-center justify-between gap-3 rounded-md border border-emerald-500 bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
						>
							<span className="flex items-center gap-2.5">
								<UserPlus className="size-4" />
								<span className="flex flex-col">
									<span>Register as Customer</span>
									<span className="font-normal text-[11px] text-emerald-50/90">
										Convert this walk-in lead into a permanent record
									</span>
								</span>
							</span>
							<span
								aria-hidden
								className="text-lg leading-none transition-transform group-hover:translate-x-0.5"
							>
								→
							</span>
						</button>
					)}
				</div>
			) : selectedCustomer ? (
				<Field label="Customer" required>
					<div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
						<div className="flex flex-col">
							<span className="font-medium">
								{selectedCustomer.first_name} {selectedCustomer.last_name ?? ""}
							</span>
							<span className="text-muted-foreground text-xs">
								{selectedCustomer.code} · {selectedCustomer.phone}
							</span>
						</div>
						<Button type="button" variant="ghost" size="sm" onClick={onClear}>
							Change
						</Button>
					</div>
				</Field>
			) : (
				<Field label="Customer" required error={customerError}>
					<div className="flex items-start gap-2">
						<div className="relative flex-1">
							<Input
								type="search"
								autoComplete="off"
								placeholder="Search customer by name, code, phone or IC…"
								value={search}
								onFocus={() => setPickerOpen(true)}
								onBlur={() => setPickerOpen(false)}
								onChange={(e) => {
									setSearch(e.target.value);
									setPickerOpen(true);
								}}
							/>
							{pickerOpen && candidates.length > 0 && (
								<div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-lg">
									{candidates.map((c) => (
										<button
											key={c.id}
											type="button"
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => onPickCustomer(c.id)}
											className="flex w-full flex-col items-start border-b px-3 py-2 text-left text-sm transition last:border-b-0 hover:bg-muted"
										>
											<span className="font-medium">
												{c.first_name} {c.last_name ?? ""}
											</span>
											<span className="text-muted-foreground text-xs">
												{c.code} · {c.phone}
											</span>
										</button>
									))}
								</div>
							)}
							{pickerOpen && search.trim() && candidates.length === 0 && (
								<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border bg-popover p-3 text-muted-foreground text-xs shadow-lg">
									No matches. Tick &ldquo;walk-in lead&rdquo; above, or click{" "}
									<span className="font-semibold text-emerald-700">New</span> to
									create a customer.
								</div>
							)}
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="shrink-0 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
							onMouseDown={(e) => e.preventDefault()}
							onClick={onNewCustomer}
						>
							<UserPlus className="size-3.5" />
							New
						</Button>
					</div>
				</Field>
			)}
		</div>
	);
}

export function StatusButton({
	status,
	active,
	onClick,
}: {
	status: AppointmentStatus;
	active: boolean;
	onClick: () => void;
}) {
	const cfg = APPOINTMENT_STATUS_CONFIG[status];
	const Icon = cfg.Icon;
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition",
				active ? cfg.badge : "bg-muted text-muted-foreground hover:bg-muted/80",
			)}
		>
			<Icon className="size-3.5" />
			{cfg.label}
		</button>
	);
}

export function TagPicker({
	activeCode,
	onSelect,
}: {
	activeCode: string | undefined;
	onSelect: (code: string) => void;
}) {
	const tags = useAppointmentTagList();
	return (
		<div className="flex flex-wrap gap-1.5">
			{tags.map(({ code, config }) => {
				const active = activeCode === code;
				return (
					<button
						key={code}
						type="button"
						onClick={() => onSelect(code)}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition",
							active
								? "border-transparent text-zinc-900"
								: "border-muted text-muted-foreground hover:bg-muted/60",
						)}
						style={active ? { backgroundColor: config.bg } : undefined}
					>
						<span
							className="inline-block size-2 rounded-full"
							style={{ backgroundColor: config.dot }}
						/>
						{config.label}
					</button>
				);
			})}
		</div>
	);
}

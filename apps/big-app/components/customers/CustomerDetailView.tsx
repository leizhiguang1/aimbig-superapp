"use client";

import {
	AlertTriangle,
	ArrowLeft,
	Bell,
	CalendarDays,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Crown,
	Mail,
	MapPin,
	Megaphone,
	Pencil,
	Phone,
	Star,
	Tag,
	User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog";
import { CustomerTagBadges } from "@/components/customers/CustomerTagBadges";
import { CustomerCaseNotesTab } from "@/components/customers/CustomerCaseNotesTab";
import {
	DetailRow,
	MedicalInfoCard,
	OriginRows,
	PlaceholderTab,
	StatPill,
	TimelineTab,
} from "@/components/customers/CustomerDetailParts";
import { CustomerCashWalletTab } from "@/components/customers/CustomerCashWalletTab";
import { CustomerDocumentsTab } from "@/components/customers/CustomerDocumentsTab";
import { CustomerManualTransactionsTab } from "@/components/customers/CustomerManualTransactionsTab";
import { CustomerFollowUpsTab } from "@/components/customers/CustomerFollowUpsTab";
import { CustomerMedicalCertificatesTab } from "@/components/customers/CustomerMedicalCertificatesTab";
import { CustomerPaymentsTab } from "@/components/customers/CustomerPaymentsTab";
import { CustomerProductsTab } from "@/components/customers/CustomerProductsTab";
import { CustomerSalesTab } from "@/components/customers/CustomerSalesTab";
import { CustomerServicesTab } from "@/components/customers/CustomerServicesTab";
import { CustomerVisualsTab } from "@/components/customers/CustomerVisualsTab";
import { Button } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
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
import type { ManualTransactionWithRelations } from "@/lib/services/manual-transactions";
import type { CustomerTimelineAppointment } from "@/lib/services/appointments";
import type { CaseNoteWithContext } from "@/lib/services/case-notes";
import type { CustomerDocumentWithRefs } from "@/lib/services/customer-documents";
import type { LetterTemplate } from "@/lib/services/letter-templates";
import type { FormTemplateWithSections } from "@/lib/services/form-templates";
import type { FormResponse } from "@/lib/services/form-responses";
import type {
	CustomerServiceBalance,
	CustomerServiceRedemption,
} from "@/lib/services/customer-services";
import type { CustomerWithRelations } from "@/lib/services/customers";
import type {
	EmployeeShift,
	RosterEmployee,
} from "@/lib/services/employee-shifts";
import type { EmployeeWithRelations } from "@/lib/services/employees";
import type { FollowUpWithRefs } from "@/lib/services/follow-ups";
import type { MedicalCertificateWithRefs } from "@/lib/services/medical-certificates";
import type { OutletWithRoomCount, Room } from "@/lib/services/outlets";
import type {
	CancellationWithRelations,
	PaymentWithRelations,
	SalesOrderWithRelations,
} from "@/lib/services/sales";
import type {
	CustomerWallet,
	WalletTransactionWithRefs,
} from "@/lib/services/wallet";
import { useOutletPath } from "@/hooks/use-outlet-path";
import { mediaPublicUrl } from "@/lib/storage/urls";
import { cn } from "@/lib/utils";
import { money } from "@/lib/utils/money";
import { CustomerFormDialog } from "./CustomerForm";

type Props = {
	customer: CustomerWithRelations;
	timeline: CustomerTimelineAppointment[];
	lineItems: CustomerLineItem[];
	caseNotes: CaseNoteWithContext[];
	salesOrders: SalesOrderWithRelations[];
	cancellations: CancellationWithRelations[];
	payments: PaymentWithRelations[];
	followUps: FollowUpWithRefs[];
	documents: CustomerDocumentWithRefs[];
	medicalCertificates: MedicalCertificateWithRefs[];
	outlets: OutletWithRoomCount[];
	employees: EmployeeWithRelations[];
	defaultConsultantId: string | null;
	wallet: CustomerWallet | null;
	walletTransactions: WalletTransactionWithRefs[];
	serviceRedemptions: CustomerServiceRedemption[];
	serviceBalances: CustomerServiceBalance[];
	homeOutletId: string;
	rosterEmployees: RosterEmployee[];
	rooms: Room[];
	shifts: EmployeeShift[];
	allOutlets: OutletWithRoomCount[];
	allEmployees: EmployeeWithRelations[];
	letterTemplates: LetterTemplate[];
	formTemplates: FormTemplateWithSections[];
	formResponses: FormResponse[];
	manualTransactions: ManualTransactionWithRelations[];
	canSeeContact?: boolean;
	canSeeCaseNotes?: boolean;
	canSeeManualTransactions?: boolean;
};

type TabKey =
	| "timeline"
	| "casenotes"
	| "dental-assessment"
	| "periodontal-charting"
	| "followup"
	| "documents"
	| "visuals"
	| "medical-certificate"
	| "prescriptions"
	| "laboratory"
	| "vaccinations"
	| "sales"
	| "payments"
	| "services"
	| "products"
	| "cash-wallet"
	| "manual-transactions";

const TABS: { key: TabKey; label: string }[] = [
	{ key: "timeline", label: "Timeline" },
	{ key: "casenotes", label: "Case Notes" },
	{ key: "dental-assessment", label: "Dental Assessment" },
	{ key: "periodontal-charting", label: "Periodontal Charting" },
	{ key: "followup", label: "Follow Up" },
	{ key: "documents", label: "Documents" },
	{ key: "visuals", label: "Visuals" },
	{ key: "medical-certificate", label: "Medical Certificate" },
	{ key: "prescriptions", label: "Prescriptions" },
	{ key: "laboratory", label: "Laboratory" },
	{ key: "vaccinations", label: "Vaccinations" },
	{ key: "sales", label: "Sales" },
	{ key: "payments", label: "Payments" },
	{ key: "services", label: "Services" },
	{ key: "products", label: "Products" },
	{ key: "cash-wallet", label: "Cash Wallet" },
	{ key: "manual-transactions", label: "Manual Transactions" },
];

function computeAge(dob: string | null): string | null {
	if (!dob) return null;
	const d = new Date(dob);
	if (Number.isNaN(d.getTime())) return null;
	const now = new Date();
	let years = now.getFullYear() - d.getFullYear();
	let months = now.getMonth() - d.getMonth();
	if (now.getDate() < d.getDate()) months--;
	if (months < 0) {
		years--;
		months += 12;
	}
	return `${years} YEARS ${Math.max(months, 0)} MONTHS`;
}

function formatDob(dob: string | null): string | null {
	if (!dob) return null;
	const d = new Date(dob);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function monthKey(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function CustomerDetailView({
	customer,
	timeline,
	lineItems,
	caseNotes,
	salesOrders,
	cancellations,
	payments,
	followUps,
	documents,
	medicalCertificates,
	outlets,
	employees,
	defaultConsultantId,
	wallet,
	walletTransactions,
	serviceRedemptions,
	serviceBalances,
	homeOutletId,
	rosterEmployees,
	rooms,
	shifts,
	allOutlets,
	allEmployees,
	letterTemplates,
	formTemplates,
	formResponses,
	manualTransactions,
	canSeeContact = false,
	canSeeCaseNotes = true,
	canSeeManualTransactions = true,
}: Props) {
	const path = useOutletPath();
	const [activeTab, setActiveTab] = useState<TabKey>("timeline");
	const [paymentsSubTab, setPaymentsSubTab] = useState<
		"history" | "outstanding"
	>("history");
	const [editing, setEditing] = useState(false);
	const [cardCollapsed, setCardCollapsed] = useState(false);
	const [creatingAppointment, setCreatingAppointment] = useState<{
		startAt: string;
		endAt: string;
	} | null>(null);

	const openCreateAppointment = () => {
		const start = new Date();
		start.setMinutes(0, 0, 0);
		start.setHours(start.getHours() + 1);
		const end = new Date(start);
		end.setMinutes(end.getMinutes() + 30);
		setCreatingAppointment({
			startAt: start.toISOString(),
			endAt: end.toISOString(),
		});
	};

	const displayName = `${customer.first_name} ${customer.last_name ?? ""}`
		.trim()
		.toUpperCase();
	const salutation = customer.salutation?.toUpperCase() ?? "";
	const age = computeAge(customer.date_of_birth);
	const dob = formatDob(customer.date_of_birth);
	const imageUrl = mediaPublicUrl(customer.profile_image_path ?? null);
	const joinDate = customer.join_date
		? new Date(customer.join_date).toLocaleDateString("en-GB")
		: null;

	const lineItemsByAppointment = useMemo(() => {
		const map = new Map<string, CustomerLineItem[]>();
		for (const li of lineItems) {
			const key = li.appointment_id;
			const arr = map.get(key) ?? [];
			arr.push(li);
			map.set(key, arr);
		}
		return map;
	}, [lineItems]);

	const totalSpent = useMemo(
		() =>
			lineItems.reduce(
				(sum, li) => sum + Number(li.unit_price) * Number(li.quantity),
				0,
			),
		[lineItems],
	);

	const outstandingSalesOrders = useMemo(
		() =>
			salesOrders.filter(
				(so) => so.status !== "cancelled" && Number(so.outstanding ?? 0) > 0,
			),
		[salesOrders],
	);

	const totalOutstanding = useMemo(
		() =>
			outstandingSalesOrders.reduce(
				(sum, so) => sum + Number(so.outstanding ?? 0),
				0,
			),
		[outstandingSalesOrders],
	);

	const stats = useMemo(() => {
		let completed = 0;
		let cancelled = 0;
		let noShow = 0;
		for (const a of timeline) {
			if (a.status === "completed") completed++;
			else if (a.status === "cancelled") cancelled++;
			else if (a.status === "noshow") noShow++;
		}
		return {
			total: timeline.length,
			completed,
			cancelled,
			noShow,
		};
	}, [timeline]);

	const leadAttendedBy = useMemo(() => {
		// `lead_attended_by_id` is filled only on the appointment created during
		// the walk-in lead flow — it is NOT the appointment's doctor/employee
		// and NOT derived from anywhere else. We just read the value stored at
		// lead creation; if nothing was stored (older customers, customers not
		// created from a lead), we render "—" and leave it at that.
		for (let i = timeline.length - 1; i >= 0; i--) {
			const a = timeline[i];
			if (a.lead_attended_by) return a.lead_attended_by;
		}
		return null;
	}, [timeline]);

	const groupedTimeline = useMemo(() => {
		const groups: {
			key: string;
			appointments: CustomerTimelineAppointment[];
		}[] = [];
		for (const a of timeline) {
			const key = monthKey(a.start_at);
			const last = groups[groups.length - 1];
			if (last && last.key === key) last.appointments.push(a);
			else groups.push({ key, appointments: [a] });
		}
		return groups;
	}, [timeline]);

	return (
		<div className="flex flex-col gap-3">
			<SegmentedTabs
				tabs={TABS.filter((t) => {
					if (t.key === "casenotes" && !canSeeCaseNotes) return false;
					if (t.key === "manual-transactions" && !canSeeManualTransactions)
						return false;
					return true;
				})}
				active={activeTab}
				onChange={(key) => setActiveTab(key as TabKey)}
				size="sm"
				aria-label="Customer sections"
			/>
			<div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 lg:flex-row">
				<aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[320px]">
					<div className="flex items-center gap-2">
						<Link
							href={path("/customers")}
							className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition hover:bg-muted"
							aria-label="Back to customers"
						>
							<ArrowLeft className="size-4" />
						</Link>
						<div className="font-mono text-muted-foreground text-xs">
							{customer.code}
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									className="ml-auto"
									onClick={() => setEditing(true)}
									aria-label="Edit customer"
								>
									<Pencil />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Edit customer</TooltipContent>
						</Tooltip>
					</div>

					{cardCollapsed ? (
						<button
							type="button"
							onClick={() => setCardCollapsed(false)}
							className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition hover:bg-muted/30"
						>
							<div className="relative size-9 shrink-0 overflow-hidden rounded-full border bg-muted">
								{imageUrl ? (
									// biome-ignore lint/performance/noImgElement: simple avatar
									<img
										src={imageUrl}
										alt={displayName}
										className="size-full object-cover"
									/>
								) : (
									<div className="flex size-full items-center justify-center font-semibold text-muted-foreground text-xs">
										{initials(displayName)}
									</div>
								)}
							</div>
							<div className="flex min-w-0 flex-1 flex-col">
								<div className="flex items-center gap-1.5">
									<span className="truncate font-semibold text-sm text-sky-800">
										{displayName}
									</span>
									{customer.is_vip && (
										<span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
											<Crown className="size-3" />
											VIP
										</span>
									)}
								</div>
								{canSeeContact && customer.phone && (
									<span className="text-[11px] text-muted-foreground tabular-nums">
										{customer.phone}
									</span>
								)}
							</div>
							<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
						</button>
					) : (
						<>
							<div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
								<div className="flex items-start gap-3">
									<div className="flex flex-col items-center gap-1">
										<div className="relative size-16 overflow-hidden rounded-full border bg-muted">
											{imageUrl ? (
												// biome-ignore lint/performance/noImgElement: simple avatar
												<img
													src={imageUrl}
													alt={displayName}
													className="size-full object-cover"
												/>
											) : (
												<div className="flex size-full items-center justify-center font-semibold text-muted-foreground text-sm">
													{initials(displayName)}
												</div>
											)}
										</div>
										<div className="flex items-center gap-0.5 text-muted-foreground">
											<Star className="size-3" />
											<Star className="size-3" />
											<Star className="size-3" />
											<Star className="size-3" />
											<Star className="size-3" />
										</div>
										<div className="text-[10px] text-muted-foreground">
											No Rating
										</div>
										<button
											type="button"
											className="text-[10px] text-sky-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
											disabled
										>
											Generate link
										</button>
									</div>

									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<div className="flex items-center gap-1.5">
											<User className="size-3.5 text-sky-600" />
											<div className="min-w-0 truncate font-semibold text-[15px] text-sky-800">
												{displayName} ({salutation})
											</div>
											{customer.is_vip && (
												<span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
													<Crown className="size-3" />
													VIP
												</span>
											)}
										</div>
										{customer.gender && (
											<div className="text-[11px] text-muted-foreground capitalize">
												{customer.gender}
											</div>
										)}
										<CustomerTagBadges
											tags={customer.tags}
											size="sm"
											withIcon
											className="w-fit"
										/>
										{(customer.address1 || customer.city || customer.state) && (
											<div className="flex items-start gap-1 text-[11px] text-muted-foreground">
												<MapPin className="mt-0.5 size-3 shrink-0" />
												<span className="line-clamp-2">
													{[
														customer.address1,
														customer.address2,
														customer.postcode,
														customer.city,
														customer.state,
													]
														.filter(Boolean)
														.join(", ")}
												</span>
											</div>
										)}
										<OriginRows
											addressCountryCode={
												(customer as { address_country?: string | null })
													.address_country ?? null
											}
											nationalityCode={customer.country_of_origin}
										/>
										{age && (
											<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
												<CalendarDays className="size-3 shrink-0" />
												<span>AGED {age}</span>
											</div>
										)}
										{canSeeContact && customer.phone && (
											<div className="flex items-center gap-1 text-[11px] text-emerald-600">
												<Phone className="size-3 shrink-0" />
												<span className="tabular-nums">{customer.phone}</span>
											</div>
										)}
										{canSeeContact && customer.phone2 && (
											<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
												<Phone className="size-3 shrink-0" />
												<span className="tabular-nums">{customer.phone2}</span>
											</div>
										)}
										{canSeeContact && customer.email && (
											<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
												<Mail className="size-3 shrink-0" />
												<span className="truncate">{customer.email}</span>
											</div>
										)}
									</div>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className="shrink-0 self-start"
												onClick={() => setCardCollapsed(true)}
												aria-label="Collapse customer card"
											>
												<ChevronUp />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Collapse</TooltipContent>
									</Tooltip>
								</div>

								<div className="flex items-center justify-between text-[10px] text-muted-foreground">
									<span>Joined on {joinDate ?? "—"}</span>
									<span className="truncate">
										{customer.home_outlet?.name ?? "—"}
									</span>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => {
											setPaymentsSubTab("history");
											setActiveTab("payments");
										}}
										className="rounded-full text-left transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
										aria-label="View payment history"
									>
										<StatPill
											dotClass="bg-sky-500"
											label="Spent"
											value={`MYR ${money(totalSpent)}`}
											valueClass="text-sky-700"
										/>
									</button>
									<button
										type="button"
										onClick={() => {
											setPaymentsSubTab("outstanding");
											setActiveTab("payments");
										}}
										className="rounded-full text-left transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
										aria-label="View outstanding sales orders"
									>
										<StatPill
											dotClass="bg-rose-500"
											label="Outstanding"
											value={`MYR ${money(totalOutstanding)}`}
											valueClass="text-rose-600"
										/>
									</button>
								</div>

								<div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
									<div className="flex flex-col">
										<span className="text-[10px] text-muted-foreground uppercase">
											Lead Attended By
										</span>
										<span
											className={
												leadAttendedBy
													? "font-medium text-xs"
													: "font-medium text-xs text-muted-foreground/70"
											}
										>
											{leadAttendedBy
												? `${leadAttendedBy.first_name} ${leadAttendedBy.last_name}`.toUpperCase()
												: "—"}
										</span>
									</div>
									<div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
										<User className="size-3.5" />
									</div>
								</div>

								<div className="flex flex-col gap-2 text-xs">
									<DetailRow
										label={
											customer.id_type === "passport" ? "Passport" : "IC Number"
										}
										value={customer.id_number ?? "—"}
									/>
									<DetailRow label="Birthday" value={dob ?? "—"} />
									<DetailRow
										label="Consultant"
										value={
											customer.consultant
												? `${customer.consultant.first_name} ${customer.consultant.last_name}`.toUpperCase()
												: "—"
										}
									/>
									<DetailRow
										label="Source"
										value={(customer.source ?? "—").toUpperCase()}
									/>
									<DetailRow label="Visits" value={String(timeline.length)} />
									{customer.external_code && (
										<DetailRow
											label="External Code"
											value={customer.external_code}
										/>
									)}
								</div>

								{customer.medical_alert && (
									<div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
										<AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
										<div className="flex flex-col gap-0.5">
											<span className="font-semibold text-[10px] text-amber-700 uppercase">
												Medical Alert
											</span>
											<span className="text-[11px] text-amber-800 leading-snug">
												{customer.medical_alert}
											</span>
										</div>
									</div>
								)}

								<button
									type="button"
									onClick={() => setActiveTab("cash-wallet")}
									className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-left transition hover:bg-muted/40"
								>
									<div className="flex items-center gap-2">
										<div className="flex size-8 items-center justify-center rounded-full bg-teal-500 font-semibold text-[10px] text-white">
											MYR
										</div>
										<div className="flex flex-col">
											<span className="font-semibold text-xs">Wallet</span>
											<span className="text-[10px] text-muted-foreground tabular-nums">
												{money(Number(wallet?.balance ?? 0))}
											</span>
										</div>
									</div>
									<ChevronRight className="size-4 text-muted-foreground" />
								</button>
							</div>

							<MedicalInfoCard customer={customer} />

							<div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
								<div className="flex items-center gap-1.5 text-[11px]">
									<Bell className="size-3 text-muted-foreground" />
									<span className="text-muted-foreground">Notifications</span>
									<span
										className={cn(
											"font-semibold",
											customer.opt_in_notifications
												? "text-emerald-600"
												: "text-muted-foreground",
										)}
									>
										{customer.opt_in_notifications ? "ON" : "OFF"}
									</span>
								</div>
								<span className="text-border">|</span>
								<div className="flex items-center gap-1.5 text-[11px]">
									<Megaphone className="size-3 text-muted-foreground" />
									<span className="text-muted-foreground">Marketing</span>
									<span
										className={cn(
											"font-semibold",
											customer.opt_in_marketing
												? "text-emerald-600"
												: "text-muted-foreground",
										)}
									>
										{customer.opt_in_marketing ? "ON" : "OFF"}
									</span>
								</div>
							</div>
						</>
					)}
				</aside>

				<main className="flex min-w-0 flex-1 flex-col gap-4">
					{activeTab === "timeline" ? (
						<TimelineTab
							groupedTimeline={groupedTimeline}
							stats={stats}
							lineItemsByAppointment={lineItemsByAppointment}
							onAdd={openCreateAppointment}
						/>
					) : activeTab === "casenotes" ? (
						<CustomerCaseNotesTab
							customerId={customer.id}
							caseNotes={caseNotes}
							lineItems={lineItems}
							customerHistory={timeline}
							outletId={homeOutletId}
							issuingEmployeeId={defaultConsultantId}
						/>
					) : activeTab === "sales" ? (
						<CustomerSalesTab
							salesOrders={salesOrders}
							cancellations={cancellations}
						/>
					) : activeTab === "payments" ? (
						<CustomerPaymentsTab
							payments={payments}
							outstandingSalesOrders={outstandingSalesOrders}
							subTab={paymentsSubTab}
							onSubTabChange={setPaymentsSubTab}
						/>
					) : activeTab === "followup" ? (
						<CustomerFollowUpsTab
							customerId={customer.id}
							followUps={followUps}
							customerHistory={timeline}
							lineItems={lineItems}
							allEmployees={employees}
						/>
					) : activeTab === "documents" ? (
						<CustomerDocumentsTab
							customerId={customer.id}
							defaultUploaderId={defaultConsultantId}
							documents={documents}
							customer={{
								name: [customer.first_name, customer.last_name]
									.filter(Boolean)
									.join(" "),
								idNumber: customer.id_number ?? null,
								age: customer.date_of_birth
									? (() => {
											const dob = new Date(customer.date_of_birth);
											const now = new Date();
											const years = now.getFullYear() - dob.getFullYear();
											const months = now.getMonth() - dob.getMonth();
											const adj =
												months < 0 ||
												(months === 0 && now.getDate() < dob.getDate())
													? -1
													: 0;
											return `${years + adj} years old`;
										})()
									: null,
							}}
							letterTemplates={letterTemplates}
							formTemplates={formTemplates}
							formResponses={formResponses}
						/>
					) : activeTab === "medical-certificate" ? (
						<CustomerMedicalCertificatesTab
							customerId={customer.id}
							outletId={homeOutletId}
							issuingEmployeeId={defaultConsultantId}
							medicalCertificates={medicalCertificates}
						/>
					) : activeTab === "services" ? (
						<CustomerServicesTab
							redemptions={serviceRedemptions}
							balances={serviceBalances}
						/>
					) : activeTab === "products" ? (
						<CustomerProductsTab lineItems={lineItems} />
					) : activeTab === "visuals" ? (
						<CustomerVisualsTab documents={documents} />
					) : activeTab === "cash-wallet" ? (
						<CustomerCashWalletTab
							wallet={wallet}
							transactions={walletTransactions}
						/>
					) : activeTab === "manual-transactions" ? (
						<CustomerManualTransactionsTab records={manualTransactions} />
					) : (
						<PlaceholderTab
							label={TABS.find((t) => t.key === activeTab)?.label ?? ""}
						/>
					)}
				</main>
			</div>
			<CustomerFormDialog
				open={editing}
				customer={editing ? customer : null}
				outlets={outlets}
				employees={employees}
				defaultConsultantId={defaultConsultantId}
				onClose={() => setEditing(false)}
			/>
			{creatingAppointment && (
				<AppointmentDialog
					open
					onClose={() => setCreatingAppointment(null)}
					outletId={homeOutletId}
					appointment={null}
					prefill={{
						startAt: creatingAppointment.startAt,
						endAt: creatingAppointment.endAt,
						employeeId: null,
						roomId: rooms[0]?.id ?? null,
						customerId: customer.id,
					}}
					customers={[customer]}
					employees={rosterEmployees}
					rooms={rooms}
					allOutlets={allOutlets}
					allEmployees={allEmployees}
					shifts={shifts}
				/>
			)}
		</div>
	);
}

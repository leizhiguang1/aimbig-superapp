import { z } from "zod";

export type PermissionSectionKey =
	| "clinical"
	| "appointments"
	| "customers"
	| "sales"
	| "roster"
	| "services"
	| "inventory"
	| "staff"
	| "system";

export type PermissionFlag = {
	key: string;
	label: string;
	description: string;
	/**
	 * The feature this flag would gate isn't built yet. Toggling the flag
	 * has no effect today. Surfaced in the role-matrix UI as a subtle
	 * "(soon)" hint so admins don't think their setting changes nothing
	 * because of a bug.
	 */
	deferred?: boolean;
};
export type PermissionSection = {
	key: PermissionSectionKey;
	label: string;
	flags: readonly PermissionFlag[];
};

// Descriptions are sourced from the Aoikumo role-matrix tooltips
// (captured 2026-05-08). See docs/PERMISSIONS_GLOSSARY.md for the
// verbatim originals and any places we've adapted the wording.
export const PERMISSION_SECTIONS = [
	{
		key: "clinical",
		label: "Clinical",
		flags: [
			{
				key: "case_notes",
				label: "Case notes",
				description:
					"Read access to the Case Notes tab on customer and appointment detail. Off = the tab is hidden and case-note data isn't sent to the client.",
			},
			{
				key: "case_notes_edit",
				label: "Case notes — edit",
				description:
					"Create / edit / cancel / pin case notes. Off = the case-note editor and per-row edit/cancel/pin icons are hidden; users can still read existing notes if they have Case notes.",
			},
			{
				key: "case_notes_billing",
				label: "Case notes — billing",
				description:
					"Use the Billing tab inside Appointments and edit the items list (To Purchase / Case Notes Billing). Off = Billing tab hidden and add/edit/remove line-item actions rejected.",
			},
			{
				key: "medical_certificates",
				label: "Medical certificates & letters",
				description:
					"Issue, edit, and cancel medical certificates and customer letters. Off = New MC + per-row Edit/Cancel hidden; Letters action button hidden in Documents panel. Existing MCs remain visible.",
			},
			{
				key: "prescriptions",
				label: "Prescriptions",
				description:
					"Issue, edit, and cancel prescriptions. Affects both Appointments and Customer modules. (Module deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "document_edit",
				label: "Document — edit",
				description:
					"Upload customer documents and submit consent forms. Off = Files (upload) and Forms (consent) buttons hidden in the Documents panel; signed-upload-URL action rejected.",
			},
			{
				key: "document_delete",
				label: "Document — delete",
				description:
					"Delete customer documents and form responses. Off = the Delete column in the Documents panel is hidden and delete actions rejected.",
			},
		],
	},
	{
		key: "appointments",
		label: "Appointments",
		flags: [
			{
				key: "appointments",
				label: "Appointments",
				description:
					"Master access to the Appointments module — see / edit / cancel appointments, manage status, and add line items.",
			},
			{
				key: "customer_transparency",
				label: "Customer transparency",
				description:
					"When ON, users can create appointments for any customer. When OFF, the New Appointment customer search is restricted to customers tied to them (consultant_id = me).",
			},
			{
				key: "consumable_selection",
				label: "Consumable selection",
				description:
					"Change consumables when completing appointments. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "view_all_appointments",
				label: "View all appointments",
				description:
					"When ON, users see every appointment in the outlet. When OFF, the calendar / list shows only appointments where employee_id = me.",
			},
			{
				key: "lead_list_creation",
				label: "Lead list creation",
				description:
					"Convert a walk-in lead into a registered customer. Off = the Register-to-Customer button on lead appointments is hidden.",
			},
			{
				key: "revert_appointment",
				label: "Revert appointment",
				description:
					"Revert a completed appointment back to pending and cancel/restore billing line items. Off = the revert button and per-row Cancel/Restore billing icons are hidden.",
			},
			{
				key: "queue",
				label: "Queue",
				description:
					"Use the queue display screen to manage walk-in flow. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "appointment_approval",
				label: "Appointment approval",
				description:
					"Approve appointments that require sign-off before confirmation. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "customer_contact_email",
				label: "Customer contact & email",
				description:
					"See customer phone and email on calendar cards, hover popover, and appointment list rows. Off = those fields are masked. The customer-search picker in the New Appointment dialog still shows phone for identification.",
			},
		],
	},
	{
		key: "customers",
		label: "Customers",
		flags: [
			{
				key: "customers",
				label: "Customers",
				description:
					"Master access to the Customers listing page and the New Customer flow.",
			},
			{
				key: "view",
				label: "View",
				description:
					"Open the customer detail page. (In Aoikumo this flag is for viewing Google reviews; we've repurposed it as the customer-detail page gate. See PERMISSIONS_GLOSSARY.md.)",
			},
			{
				key: "update",
				label: "Update",
				description:
					"Edit and delete customer records. Off = Edit/Delete column on the customer table is hidden. (In Aoikumo this flag is for replying to Google reviews; we've repurposed it.)",
			},
			{
				key: "internal_review",
				label: "Internal review",
				description:
					"View internal reviews submitted for ratings below the threshold set in Config. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "review_assignment",
				label: "Review assignment",
				description:
					"Assign internal reviews to employees for follow-up. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "customer_transparency",
				label: "Customer transparency",
				description:
					"When ON, users see all customers. When OFF, the customer list and detail pages are filtered to customers where consultant_id = me.",
			},
			{
				key: "customer_merging",
				label: "Customer merging",
				description:
					"Merge duplicate customer records. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "revert_products",
				label: "Revert products",
				description:
					"Reverse a sold product back to its consumable line. (Currently overlaps with appointments.revert_appointment — kept inert.)",
				deferred: true,
			},
			{
				key: "customers_contact",
				label: "Customers contact",
				description:
					"See customer phone and email on the customer list and detail. Off = phone column hidden, search no longer matches contact fields, phone/email rows hidden in customer detail.",
			},
		],
	},
	{
		key: "sales",
		label: "Sales",
		flags: [
			{
				key: "sales",
				label: "Sales",
				description: "Master access to the Sales listing and order detail.",
			},
			{
				key: "customer_transparency",
				label: "Customer transparency",
				description:
					"When ON, users can create and view sales of any customer. When OFF, the sales list and the new-sale customer picker are restricted to customers tied to them.",
			},
			{
				key: "create_sales",
				label: "Create sales",
				description:
					"Create / void sales orders, collect payments, record additional payments, refund, write-off, and reallocate payments.",
			},
			{
				key: "adjust_co_payment",
				label: "Adjust co-payment",
				description:
					"Adjust Co-Payment and Claimable amount on insurance / claim invoices. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "sales_person_reallocation",
				label: "Salesperson reallocation",
				description:
					"Move sales credit between staff after a sale is finalized. Off = the per-line Set-allocation button on a sales-order is disabled.",
			},
			{
				key: "backdate_transactions",
				label: "Backdate transactions",
				description:
					"Backdate sales, payments, sales cancellations, credit-voucher top-ups, and claim invoices. Off = the backdate field is hidden in payment dialogs and rejected server-side.",
			},
			{
				key: "view_petty_cash",
				label: "View petty cash",
				description:
					"See the Petty Cash tab. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "edit_petty_cash",
				label: "Edit petty cash",
				description:
					"Add / edit / delete petty-cash entries. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
		],
	},
	{
		key: "roster",
		label: "Roster",
		flags: [
			{
				key: "roster",
				label: "Roster",
				description: "Read access to the Roster page (shifts schedule).",
			},
			{
				key: "roster_edit",
				label: "Roster — edit",
				description:
					"Add / edit / delete shifts. Off = roster cells become read-only — empty cells render as “—”, shifts show without a click handler.",
			},
		],
	},
	{
		key: "services",
		label: "Services",
		flags: [
			{
				key: "services",
				label: "Services",
				description:
					"Master access to the Services module — view services + categories, and create / edit / delete them.",
			},
		],
	},
	{
		key: "inventory",
		label: "Inventory",
		flags: [
			{
				key: "inventory",
				label: "Inventory",
				description:
					"Master access to the Inventory module (items, brands, categories, suppliers, UoM).",
			},
			{
				key: "purchase_orders",
				label: "Purchase orders",
				description:
					"Manage purchase orders. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "returned_stock",
				label: "Returned stock",
				description:
					"View / process returned stock. (Feature deferred — flag is inert today.)",
				deferred: true,
			},
			{
				key: "inventory_edit",
				label: "Inventory — edit",
				description:
					"Create / edit / delete inventory items, brands, categories, suppliers, and UoM. Off = Add / Edit / Delete affordances hidden across all inventory sub-pages.",
			},
			{
				key: "inventory_cost",
				label: "Inventory — cost",
				description:
					"See product Cost Price and WAC in inventory forms, stock requests, transfer orders, and inventory logs. Off = the Cost Price field and per-outlet cost column are hidden.",
			},
			{
				key: "adjust_stock",
				label: "Adjust stock",
				description:
					"Record stock movements (manual adjustments, transfers, write-offs). Off = the Adjust-stock icon in Stock Details is hidden.",
			},
		],
	},
	{
		key: "staff",
		label: "Staff",
		flags: [
			{
				key: "employees",
				label: "Employees",
				description:
					"Create / edit / delete employees and reset their credentials (password, PIN, email).",
			},
			{
				key: "roles",
				label: "Roles",
				description:
					"Manage role definitions and the permission matrix on this page.",
			},
			{
				key: "position",
				label: "Position",
				description: "Manage positions used for grouping employees.",
			},
			{
				key: "commissions",
				label: "Commissions",
				description: "Access the Commissions report.",
			},
			{
				key: "employee_listing",
				label: "Employee listing",
				description:
					"See the Employees listing page. Without this, the listing nav item is hidden and the Edit/Reset/Delete actions column is hidden even with the Employees write flag.",
			},
		],
	},
	{
		key: "system",
		label: "System",
		flags: [
			{
				key: "passcode",
				label: "Passcode",
				description:
					"Manage shared override passcodes used for restricted actions.",
			},
			{
				key: "reports",
				label: "Reports",
				description: "Access the Reports section.",
			},
			{
				key: "config",
				label: "Config",
				description:
					"Access and edit Config settings — billing, brand, outlets, rooms, payment methods, taxes, letter templates, and e-document templates.",
			},
			{
				key: "manual_transaction",
				label: "Manual transaction",
				description:
					"Create / cancel manual transactions and see the Manual Transactions tab on customer detail.",
			},
			{
				key: "webstore",
				label: "Webstore",
				description: "Access the Webstore configuration page.",
			},
		],
	},
] as const satisfies readonly PermissionSection[];

export const TOTAL_PERMISSION_FLAGS = PERMISSION_SECTIONS.reduce(
	(n, s) => n + s.flags.length,
	0,
);

const sectionShape = (section: PermissionSection) =>
	z.object(
		Object.fromEntries(
			section.flags.map((f) => [f.key, z.boolean()] as const),
		) as Record<string, z.ZodBoolean>,
	);

export const permissionsSchema = z.object({
	all: z.boolean(),
	clinical: sectionShape(PERMISSION_SECTIONS[0]),
	appointments: sectionShape(PERMISSION_SECTIONS[1]),
	customers: sectionShape(PERMISSION_SECTIONS[2]),
	sales: sectionShape(PERMISSION_SECTIONS[3]),
	roster: sectionShape(PERMISSION_SECTIONS[4]),
	services: sectionShape(PERMISSION_SECTIONS[5]),
	inventory: sectionShape(PERMISSION_SECTIONS[6]),
	staff: sectionShape(PERMISSION_SECTIONS[7]),
	system: sectionShape(PERMISSION_SECTIONS[8]),
});

export type RolePermissions = z.infer<typeof permissionsSchema>;

function emptySection(section: PermissionSection): Record<string, boolean> {
	return Object.fromEntries(section.flags.map((f) => [f.key, false]));
}

export function emptyPermissions(): RolePermissions {
	const base: Record<string, unknown> = { all: false };
	for (const section of PERMISSION_SECTIONS) {
		base[section.key] = emptySection(section);
	}
	return base as RolePermissions;
}

export function countEnabledFlags(p: RolePermissions): number {
	if (p.all) return TOTAL_PERMISSION_FLAGS;
	let n = 0;
	for (const section of PERMISSION_SECTIONS) {
		const bucket = p[section.key] as Record<string, boolean>;
		for (const flag of section.flags) if (bucket[flag.key]) n++;
	}
	return n;
}

export function normalizePermissions(raw: unknown): RolePermissions {
	const base = emptyPermissions();
	if (!raw || typeof raw !== "object") return base;
	const src = raw as Record<string, unknown>;
	const merged: Record<string, unknown> = {
		all: typeof src.all === "boolean" ? src.all : false,
	};
	for (const section of PERMISSION_SECTIONS) {
		const existing = (src[section.key] as Record<string, boolean>) ?? {};
		merged[section.key] = {
			...(base[section.key] as Record<string, boolean>),
			...existing,
		};
	}
	const parsed = permissionsSchema.safeParse(merged);
	return parsed.success ? parsed.data : base;
}

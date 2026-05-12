// The authoritative registry of shape-1 categories stored in
// `brand_config_items`. Adding a new list-type configurable is a one-line
// change here — no migration needed. See docs/modules/12-config.md for
// the full tier register across all configurable surfaces.
//
// Rule of thumb: categories here are **brand-editable business vocabulary**
// (reasons, tag sets, picklists). App-UI concerns (status codes, their
// labels + colors + icons, payment-status visuals) are NOT here — they
// stay hardcoded in `lib/constants/` so every brand reads the same visual
// language.

export type BrandConfigCategoryDef = {
	label: string;
	// Singular form used in the create/edit dialog title and the input label
	// (e.g. "Cancel reason" so the dialog reads "New cancel reason"). Falls
	// back to `label` if not set.
	singularLabel?: string;
	// True = brand can add/remove codes freely.
	codeEditable: boolean;
	// Color support (shown as swatch in admin UI and passed through to
	// transactional renders). Categories without color leave the column null.
	hasColor: boolean;
	// Human-readable hint under the section header in the admin page.
	hint?: string;
	// How the chosen label is stored on dependent rows.
	//
	// - "live": dependent columns hold the current label; renaming the item
	//   cascades the new label across history. Use for current-state /
	//   display attributes (salutation, language, religion, current tag set).
	//   The brand says "from now on we address Ms as Miss" → every customer
	//   updates.
	//
	// - "snapshot": dependent columns hold the label that was current at
	//   write-time; renaming does not touch history. Use for historical
	//   facts (cancel reason, void reason, customer source — captured at
	//   that moment). Renaming "Customer changed mind" → "Customer
	//   reconsidered" must NOT silently rewrite the audit trail.
	//
	// Cascade for live categories is implemented in
	// lib/services/brand-config.ts (cascadeLiveRename).
	storage: "live" | "snapshot";
	// Where these items show up in the app. Surfaced as a tooltip on the
	// admin card so brand admins know what they're editing, and so we can
	// see at a glance which categories are "registry only" (CRUD works,
	// but no consumer reads the list yet — the matching hardcoded enum is
	// still the source of truth).
	usage?: {
		// One sentence: which UI surface picks from this list.
		description: string;
		// Whether a real consumer reads from brand_config_items today. False
		// means the admin can edit the list but nothing in the app uses it
		// yet — typically because the consumer still reads a hardcoded enum.
		wired: boolean;
		// Path to the dropdown/picker that consumes the list (when wired).
		consumer?: string;
		// The hardcoded TS enum this category is intended to replace (when
		// not yet wired). Lets us audit the migration backlog.
		replacesEnum?: string;
	};
};

export const BRAND_CONFIG_CATEGORIES = {
	// ── promoted (admin UI live) ──────────────────────────────────────────
	void_reason: {
		label: "Void / cancel reasons",
		codeEditable: true,
		hasColor: false,
		hint: "Reasons shown in the Void Sales Order flow.",
		storage: "snapshot",
		usage: {
			description: "Reason picker shown in the Void Sales Order dialog.",
			wired: true,
			consumer: "components/sales/VoidSalesOrderDialog.tsx",
		},
	},
	appointment_tag: {
		label: "Appointment tags",
		codeEditable: true,
		hasColor: true,
		hint: "Color-coded tags shown on appointment cards and the calendar.",
		storage: "live",
	},
	customer_tag: {
		label: "Customer tag vocabulary",
		codeEditable: true,
		hasColor: true,
		hint: "Color-coded tags shown on customer profiles, lists, and appointment cards. Free-text entries are still accepted (rendered as plain chips).",
		storage: "live",
		usage: {
			description:
				"Multi-select picker on the customer form; rendered as chips on every customer surface.",
			wired: true,
			consumer: "components/customers/CustomerForm.tsx",
		},
	},
	customer_emergency_relationship: {
		label: "Emergency contact relationships",
		singularLabel: "Relationship",
		codeEditable: true,
		hasColor: false,
		hint: "Options shown in the customer emergency contact picker (Spouse, Parent, Child, etc.). Free-text entries are also accepted.",
		storage: "live",
		usage: {
			description:
				"Relationship picker on the customer form's Emergency Contact block.",
			wired: true,
			consumer: "components/customers/CustomerForm.tsx",
		},
	},
	salutation: {
		label: "Salutations",
		codeEditable: true,
		hasColor: false,
		hint: "How customers and employees are addressed (Mr, Ms, Datuk, Encik…). Renames apply to all existing records.",
		storage: "live",
	},

	// ── registered but UI not wired yet ───────────────────────────────────
	// Each one lights up when its owning module migrates its hardcoded
	// usage to read from brand_config_items.
	customer_language: {
		label: "Languages",
		codeEditable: true,
		hasColor: false,
		storage: "live",
	},
	customer_race: {
		label: "Races",
		codeEditable: true,
		hasColor: false,
		storage: "live",
	},
	customer_religion: {
		label: "Religions",
		codeEditable: true,
		hasColor: false,
		storage: "live",
	},
	customer_occupation: {
		label: "Occupations",
		codeEditable: true,
		hasColor: false,
		storage: "live",
	},
	customer_source: {
		label: "Customer sources",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
	},
	customer_reminder_method: {
		label: "Reminder methods",
		codeEditable: true,
		hasColor: false,
		storage: "live",
	},
	"reason.stock_add": {
		label: "Add Stock",
		singularLabel: "Add-stock reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown when adjusting stock IN (receiving from supplier, transfer in, etc.).",
			wired: false,
			replacesEnum: "STOCK_ADJUSTMENT_REASONS in lib/schemas/inventory.ts",
		},
	},
	"reason.stock_reduce": {
		label: "Reduce Stock",
		singularLabel: "Reduce-stock reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown when adjusting stock OUT (damage, sample, staff use, etc.).",
			wired: false,
			replacesEnum: "STOCK_ADJUSTMENT_REASONS in lib/schemas/inventory.ts",
		},
	},
	"reason.stock_return": {
		label: "Return Stock",
		singularLabel: "Return-stock reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description: "Reason picker shown when returning stock to a supplier.",
			wired: false,
			replacesEnum: "STOCK_ADJUSTMENT_REASONS in lib/schemas/inventory.ts",
		},
	},
	"reason.receipt": {
		label: "Receipt Remark",
		singularLabel: "Receipt remark",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description: "Remark picker shown on the printed/e-mailed sales receipt.",
			wired: false,
		},
	},
	"reason.attendance": {
		label: "Attendance",
		singularLabel: "Attendance reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown on the employee clock in/out (attendance) flow.",
			wired: false,
		},
	},
	"reason.appointment_consumable": {
		label: "Appointment Consumable",
		singularLabel: "Consumable reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown when adding consumables to an appointment.",
			wired: false,
		},
	},
	"reason.appointment_cancel": {
		label: "Cancel Appointment",
		singularLabel: "Cancel reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description: "Reason picker shown in the Cancel Appointment dialog.",
			wired: true,
			consumer: "components/appointments/CancelAppointmentDialog.tsx",
		},
	},
	"reason.appointment_revert": {
		label: "Revert Appointment",
		singularLabel: "Revert reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown when reverting an appointment back to a previous status.",
			wired: false,
		},
	},
	"reason.employee_edit": {
		label: "Edit Employee",
		singularLabel: "Edit-employee reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown when an admin edits another employee's profile (audit trail).",
			wired: false,
		},
	},
	"reason.lead_unsuccessful": {
		label: "Lead Unsuccessful",
		singularLabel: "Lead-unsuccessful reason",
		codeEditable: true,
		hasColor: false,
		storage: "snapshot",
		usage: {
			description:
				"Reason picker shown when marking a customer lead as unsuccessful.",
			wired: false,
		},
	},
	lead_contact_preference: {
		label: "Customer Lead List",
		singularLabel: "Contact preference",
		codeEditable: true,
		hasColor: false,
		storage: "live",
		usage: {
			description:
				"Tag set for how a lead prefers to be contacted (call / message / etc.) on the lead list.",
			wired: false,
		},
	},
} as const satisfies Record<string, BrandConfigCategoryDef>;

export type BrandConfigCategory = keyof typeof BRAND_CONFIG_CATEGORIES;

export function getCategoryDef(
	category: BrandConfigCategory,
): BrandConfigCategoryDef {
	return BRAND_CONFIG_CATEGORIES[category];
}

export function isBrandConfigCategory(v: string): v is BrandConfigCategory {
	return v in BRAND_CONFIG_CATEGORIES;
}

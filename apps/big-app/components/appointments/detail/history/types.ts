import type {
	AppointmentLineItem,
	CustomerLineItem,
} from "@/lib/services/appointment-line-items";
import type { CaseNoteWithContext } from "@/lib/services/case-notes";
import type { FollowUpWithRefs } from "@/lib/services/follow-ups";

export type ServiceChip = { label: string; truncated?: true };

export type SummarizableItem = {
	description: string;
	quantity: number | string;
	is_cancelled?: boolean;
};

export type AppointmentMeta = {
	bookingRef: string;
	outletCode: string | null;
	startAt: Date | null;
	serviceSummary: ServiceChip[];
};

export type HistoryScope =
	| { kind: "appointment"; appointmentId: string }
	| { kind: "customer"; customerId: string };

export type BillingThread = {
	kind: "billing";
	id: string;
	date: Date;
	appointmentId: string;
	bookingRef: string;
	outletCode: string | null;
	serviceSummary: ServiceChip[];
	paymentStatus: string;
	paidVia: string | null;
	servedBy: string | null;
	salesOrderNumber: string | null;
	items: CustomerLineItem[];
	total: number;
	isCurrent: boolean;
	isCancelled: boolean;
};

export type NoteThread = {
	kind: "note";
	id: string;
	date: Date;
	note: CaseNoteWithContext;
	bookingRef: string | null;
	outletCode: string | null;
	serviceSummary: ServiceChip[];
	appointmentDate: Date | null;
	appointmentId: string | null;
	isCurrent: boolean;
	isPinned: boolean;
	isCancelled: boolean;
};

export type Thread = BillingThread | NoteThread;

export type FollowUpThread = {
	id: string;
	date: Date;
	followUp: FollowUpWithRefs;
	bookingRef: string | null;
	outletCode: string | null;
	serviceSummary: ServiceChip[];
	appointmentDate: Date | null;
	appointmentId: string | null;
	isCurrent: boolean;
	isPinned: boolean;
};

export type HistoryMode = "all" | "casenotes" | "billing";

export type { AppointmentLineItem, CustomerLineItem };

"use client";

import type { Toast } from "@/components/appointments/AppointmentToastStack";
import { CustomerDocumentsPanel } from "@/components/customer-documents/CustomerDocumentsPanel";
import type { AppointmentWithRelations } from "@/lib/services/appointments";
import type { CustomerDocumentWithRefs } from "@/lib/services/customer-documents";
import type { LetterTemplate } from "@/lib/services/letter-templates";
import type { FormTemplateWithSections } from "@/lib/services/form-templates";
import type { FormResponse } from "@/lib/services/form-responses";

type Props = {
	appointment: AppointmentWithRelations;
	documents: CustomerDocumentWithRefs[];
	letterTemplates: LetterTemplate[];
	formTemplates: FormTemplateWithSections[];
	formResponses: FormResponse[];
	onToast: (message: string, variant?: Toast["variant"]) => void;
};

function calcAge(dob: string): string {
	const birth = new Date(dob);
	const now = new Date();
	const years = now.getFullYear() - birth.getFullYear();
	const months = now.getMonth() - birth.getMonth();
	const adj = months < 0 || (months === 0 && now.getDate() < birth.getDate()) ? 1 : 0;
	const y = years - adj;
	const m = ((months + 12) % 12);
	return m > 0 ? `${y} years ${m} months` : `${y} years`;
}

export function DocumentsTab({ appointment, documents, letterTemplates, formTemplates, formResponses, onToast }: Props) {
	if (appointment.is_time_block) {
		return (
			<div className="rounded-md border bg-muted/20 p-6 text-center text-muted-foreground text-sm">
				Documents don't apply to time blocks.
			</div>
		);
	}

	if (!appointment.customer_id || !appointment.customer) {
		return (
			<div className="rounded-md border bg-amber-50 p-6 text-center text-amber-900 text-sm">
				Register this walk-in lead as a customer to attach documents.
			</div>
		);
	}

	const c = appointment.customer;
	const customerMergeData = {
		name: [c.first_name, c.last_name].filter(Boolean).join(" "),
		idNumber: c.id_number ?? null,
		age: c.date_of_birth ? calcAge(c.date_of_birth) : null,
	};

	return (
		<CustomerDocumentsPanel
			customerId={appointment.customer_id}
			appointmentId={appointment.id}
			defaultUploaderId={appointment.employee_id ?? null}
			documents={documents}
			customer={customerMergeData}
			letterTemplates={letterTemplates}
			formTemplates={formTemplates}
			formResponses={formResponses}
			onToast={onToast}
		/>
	);
}

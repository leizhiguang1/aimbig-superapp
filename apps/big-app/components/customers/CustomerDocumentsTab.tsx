"use client";

import { useCallback, useState } from "react";
import {
	AppointmentToastStack,
	type Toast,
} from "@/components/appointments/AppointmentToastStack";
import { CustomerDocumentsPanel } from "@/components/customer-documents/CustomerDocumentsPanel";
import type { CustomerMergeData } from "@/components/customer-documents/LetterEditorDialog";
import type { CustomerDocumentWithRefs } from "@/lib/services/customer-documents";
import type { LetterTemplate } from "@/lib/services/letter-templates";
import type { FormTemplateWithSections } from "@/lib/services/form-templates";
import type { FormResponse } from "@/lib/services/form-responses";

type Props = {
	customerId: string;
	defaultUploaderId: string | null;
	documents: CustomerDocumentWithRefs[];
	customer: CustomerMergeData;
	letterTemplates: LetterTemplate[];
	formTemplates: FormTemplateWithSections[];
	formResponses: FormResponse[];
};

export function CustomerDocumentsTab({
	customerId,
	defaultUploaderId,
	documents,
	customer,
	letterTemplates,
	formTemplates,
	formResponses,
}: Props) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback(
		(message: string, variant: Toast["variant"] = "default") => {
			const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			setToasts((prev) => [...prev, { id, message, variant }]);
			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== id));
			}, 2000);
		},
		[],
	);

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<>
			<CustomerDocumentsPanel
				customerId={customerId}
				appointmentId={null}
				defaultUploaderId={defaultUploaderId}
				documents={documents}
				customer={customer}
				letterTemplates={letterTemplates}
				formTemplates={formTemplates}
				formResponses={formResponses}
				onToast={showToast}
			/>
			<AppointmentToastStack toasts={toasts} onDismiss={dismissToast} />
		</>
	);
}

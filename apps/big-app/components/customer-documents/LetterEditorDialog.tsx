"use client";

import { ChevronDown, ChevronRight, Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	createCustomerLetterAction,
	updateCustomerLetterAction,
} from "@/lib/actions/customer-documents";
import type { CustomerDocumentWithRefs } from "@/lib/services/customer-documents";
import type { LetterTemplate } from "@/lib/services/letter-templates";
import { cn } from "@/lib/utils";

export type CustomerMergeData = {
	name: string;
	idNumber: string | null;
	age: string | null;
};

type Props = {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	customerId: string;
	appointmentId?: string | null;
	customer: CustomerMergeData;
	templates: LetterTemplate[];
	editDoc?: CustomerDocumentWithRefs | null;
	onToast: (msg: string, variant?: "success" | "error" | "default") => void;
};

const MERGE_FIELDS = [
	{ label: "Name", token: "{{customer_name}}" },
	{ label: "ID No.", token: "{{customer_id_number}}" },
	{ label: "Age", token: "{{customer_age}}" },
	{ label: "Date", token: "{{date}}" },
];

function mergePlaceholders(html: string, customer: CustomerMergeData): string {
	const today = new Date().toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
	return html
		.replaceAll("{{customer_name}}", customer.name)
		.replaceAll("{{customer_id_number}}", customer.idNumber ?? "")
		.replaceAll("{{customer_age}}", customer.age ?? "")
		.replaceAll("{{date}}", today);
}

export function LetterEditorDialog({
	open,
	onOpenChange,
	customerId,
	appointmentId = null,
	customer,
	templates,
	editDoc = null,
	onToast,
}: Props) {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [editorHtml, setEditorHtml] = useState("");
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		if (!open) return;
		if (editDoc) {
			setSelectedId(editDoc.letter_template_id ?? null);
			setEditorHtml(editDoc.letter_body_html ?? "");
		} else {
			setSelectedId(null);
			setEditorHtml("");
		}
	}, [open, editDoc]);

	const selectTemplate = (tpl: LetterTemplate) => {
		setSelectedId(tpl.id);
		setEditorHtml(mergePlaceholders(tpl.body_html, customer));
	};

	const selectedTemplate = templates.find((t) => t.id === selectedId);

	const handleSave = () => {
		if (!editorHtml.trim() || editorHtml === "<p></p>") {
			onToast("Letter content is empty", "error");
			return;
		}
		const name = selectedTemplate?.name ?? "Letter";

		startTransition(async () => {
			if (editDoc) {
				const result = await updateCustomerLetterAction(
					appointmentId,
					editDoc.id,
					editorHtml,
				);
				if ("error" in result) {
					onToast(result.error, "error");
					return;
				}
				onToast("Letter saved", "success");
				router.refresh();
				onOpenChange(false);
			} else {
				const doc = await createCustomerLetterAction(appointmentId, {
					customer_id: customerId,
					appointment_id: appointmentId,
					letter_template_id: selectedId,
					file_name: name,
					letter_body_html: editorHtml,
				});
				if ("error" in doc) {
					onToast(doc.error, "error");
					return;
				}
				onToast("Letter created", "success");
				onOpenChange(false);
				router.refresh();
				window.open(`/documents/letters/${doc.id}`, "_blank");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] w-full max-w-5xl flex-col gap-0 p-0">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>{editDoc ? "Edit Letter" : "New Letter"}</DialogTitle>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 overflow-hidden">
					{/* Left: template picker */}
					<div className="flex w-64 shrink-0 flex-col border-r bg-muted/30">
						<div className="border-b px-4 py-2.5">
							<p className="font-medium text-sm">Templates</p>
						</div>
						<div className="flex-1 overflow-y-auto p-2">
							{templates.length === 0 ? (
								<p className="px-2 py-4 text-center text-muted-foreground text-xs">
									No letter templates yet.
									<br />
									Add one in Config → E-Documents.
								</p>
							) : (
								templates.map((tpl) => (
									<button
										key={tpl.id}
										type="button"
										onClick={() => selectTemplate(tpl)}
										className={cn(
											"flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
											selectedId === tpl.id
												? "bg-primary text-primary-foreground"
												: "hover:bg-accent",
										)}
									>
										{selectedId === tpl.id ? (
											<ChevronDown className="size-3.5 shrink-0" />
										) : (
											<ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
										)}
										<span className="truncate font-medium uppercase tracking-wide">
											{tpl.name}
										</span>
									</button>
								))
							)}
						</div>
					</div>

					{/* Right: editor */}
					<div className="flex flex-1 flex-col overflow-hidden">
						{selectedId === null ? (
							<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
								Select a template on the left to begin
							</div>
						) : (
							<div className="flex flex-1 flex-col overflow-hidden">
								<div className="flex items-center justify-between border-b px-4 py-2">
									<p className="font-semibold text-sm uppercase tracking-wide">
										{selectedTemplate?.name ?? "Letter"}
									</p>
								</div>
								<div className="flex-1 overflow-y-auto p-4">
									<RichTextEditor
										value={editorHtml}
										onChange={setEditorHtml}
										mergeFields={MERGE_FIELDS}
										minHeight={300}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
					<p className="text-muted-foreground text-xs">
						Customer:{" "}
						<span className="font-medium text-foreground">{customer.name}</span>
						{customer.idNumber && (
							<span className="ml-1 text-muted-foreground">
								({customer.idNumber})
							</span>
						)}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={selectedId === null || pending}
						>
							{pending ? (
								<Loader2 className="size-4 animate-spin" />
							) : editDoc ? (
								"Save Changes"
							) : (
								"Create & Print"
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

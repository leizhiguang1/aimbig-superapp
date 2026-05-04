"use client";

import { CheckSquare, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFormResponseAction } from "@/lib/actions/form-responses";
import type { FormSectionResponse } from "@/lib/schemas/form-templates";
import type { FormTemplateWithSections } from "@/lib/services/form-templates";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	customerId: string;
	appointmentId?: string | null;
	formTemplates: FormTemplateWithSections[];
	onToast: (msg: string, variant?: "success" | "error" | "default") => void;
};

export function FormFillDialog({
	open,
	onOpenChange,
	customerId,
	appointmentId = null,
	formTemplates,
	onToast,
}: Props) {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [signedByName, setSignedByName] = useState("");
	const [sectionResponses, setSectionResponses] = useState<Record<string, FormSectionResponse>>({});
	const [pending, startTransition] = useTransition();

	const selectedTemplate = formTemplates.find((t) => t.id === selectedId);

	useEffect(() => {
		if (!open) return;
		setSelectedId(null);
		setSignedByName("");
		setSectionResponses({});
	}, [open]);

	const selectTemplate = (tpl: FormTemplateWithSections) => {
		setSelectedId(tpl.id);
		// Pre-fill responses from template defaults
		const prefilled: Record<string, FormSectionResponse> = {};
		for (const s of tpl.sections) {
			prefilled[s.id] = {
				section_id: s.id,
				section_type: s.section_type as FormSectionResponse["section_type"],
				title: s.title ?? null,
				response_html: s.body_html ?? null,
				checked: s.section_type === "tnc" ? false : undefined,
				signed: false,
			};
		}
		setSectionResponses(prefilled);
	};

	const updateResponse = (sectionId: string, patch: Partial<FormSectionResponse>) => {
		setSectionResponses((prev) => ({
			...prev,
			[sectionId]: { ...prev[sectionId], ...patch },
		}));
	};

	const canSubmit = () => {
		if (!selectedTemplate) return false;
		for (const s of selectedTemplate.sections) {
			if (!s.required) continue;
			const resp = sectionResponses[s.id];
			if (!resp) return false;
			if (s.section_type === "tnc" && !resp.checked) return false;
			if (s.section_type === "signature" && !signedByName.trim()) return false;
		}
		return true;
	};

	const handleSubmit = () => {
		if (!selectedTemplate) return;
		const sections = selectedTemplate.sections.map((s) => ({
			...sectionResponses[s.id],
			section_id: s.id,
		}));

		startTransition(async () => {
			try {
				await createFormResponseAction({
					customer_id: customerId,
					appointment_id: appointmentId,
					form_template_id: selectedTemplate.id,
					form_name: selectedTemplate.name,
					signed_by_name: signedByName.trim() || null,
					sections,
				});
				onToast("Form submitted", "success");
				onOpenChange(false);
				router.refresh();
			} catch (err) {
				onToast(err instanceof Error ? err.message : "Could not submit form", "error");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>New Form</DialogTitle>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 overflow-hidden">
					{/* Left: template picker */}
					<div className="flex w-56 shrink-0 flex-col border-r bg-muted/30">
						<div className="border-b px-4 py-2.5">
							<p className="font-medium text-sm">Select Form</p>
						</div>
						<div className="flex-1 overflow-y-auto p-2">
							{formTemplates.length === 0 ? (
								<p className="px-2 py-4 text-center text-muted-foreground text-xs">
									No form templates.
									<br />Add one in Config → E-Documents.
								</p>
							) : (
								formTemplates.map((tpl) => (
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
										<span className="truncate font-medium">{tpl.name}</span>
									</button>
								))
							)}
						</div>
					</div>

					{/* Right: fill sections */}
					<div className="flex flex-1 flex-col overflow-hidden">
						{!selectedTemplate ? (
							<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
								Select a form on the left to begin
							</div>
						) : (
							<div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
								<p className="font-semibold text-base">{selectedTemplate.name}</p>

								{selectedTemplate.sections.map((sec) => {
									const resp = sectionResponses[sec.id];
									return (
										<div key={sec.id} className="space-y-2">
											{sec.title && (
												<div className="flex items-center gap-2">
													<p className="font-medium text-sm">{sec.title}</p>
													{sec.required && (
														<span className="text-destructive text-xs">*</span>
													)}
												</div>
											)}

											{/* Open text: editable rich text */}
											{sec.section_type === "open_text" && (
												<RichTextEditor
													value={resp?.response_html ?? ""}
													onChange={(html) => updateResponse(sec.id, { response_html: html })}
													minHeight={140}
												/>
											)}

											{/* T&C: read-only display + agree checkbox */}
											{sec.section_type === "tnc" && (
												<div className="space-y-3 rounded-md border bg-muted/20 p-4">
													{sec.body_html && (
														<div
															className="prose prose-sm max-w-none text-sm leading-relaxed"
															// eslint-disable-next-line react/no-danger
															dangerouslySetInnerHTML={{ __html: sec.body_html }}
														/>
													)}
													<label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
														<input
															type="checkbox"
															checked={resp?.checked ?? false}
															onChange={(e) => updateResponse(sec.id, { checked: e.target.checked })}
															className="size-4 rounded"
														/>
														I have read and agree to the above
													</label>
												</div>
											)}

											{/* Checkbox: simple agree */}
											{sec.section_type === "checkbox" && (
												<label className="flex cursor-pointer items-start gap-2 rounded-md border bg-muted/20 p-4 text-sm">
													<input
														type="checkbox"
														checked={resp?.checked ?? false}
														onChange={(e) => updateResponse(sec.id, { checked: e.target.checked })}
														className="mt-0.5 size-4 rounded"
													/>
													<span>{sec.body_html ?? sec.title}</span>
												</label>
											)}

											{/* Short answer */}
											{sec.section_type === "short_answer" && (
												<Input
													placeholder="Enter your answer…"
													value={resp?.response_html ?? ""}
													onChange={(e) => updateResponse(sec.id, { response_html: e.target.value })}
												/>
											)}
										</div>
									);
								})}

								{/* Signature */}
								<div className="space-y-1.5 rounded-md border-t pt-4">
									<Label htmlFor="sig-name">
										Patient / Customer Name{" "}
										<span className="text-muted-foreground font-normal">(signature)</span>
									</Label>
									<Input
										id="sig-name"
										placeholder="Full name"
										value={signedByName}
										onChange={(e) => setSignedByName(e.target.value)}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-6 py-3">
					<Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
						Cancel
					</Button>
					<Button size="sm" onClick={handleSubmit} disabled={!canSubmit() || pending}>
						{pending ? <Loader2 className="size-4 animate-spin" /> : (
							<><CheckSquare className="size-4" /> Submit Form</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

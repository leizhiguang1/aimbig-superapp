"use client";

import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	createLetterTemplateAction,
	deleteLetterTemplateAction,
	updateLetterTemplateAction,
} from "@/lib/actions/letter-templates";
import {
	createFormTemplateAction,
	deleteFormTemplateAction,
	updateFormTemplateAction,
} from "@/lib/actions/form-templates";
import type { LetterTemplate } from "@/lib/services/letter-templates";
import type { FormTemplateWithSections } from "@/lib/services/form-templates";
import {
	SECTION_TYPE_LABELS,
	type SectionType,
	SECTION_TYPES,
} from "@/lib/schemas/form-templates";
import { cn } from "@/lib/utils";

type Tab = "letters" | "forms";

type Props = {
	letterTemplates: LetterTemplate[];
	formTemplates: FormTemplateWithSections[];
};

// ─── Letter state ────────────────────────────────────────────────────────────

type LetterFormState = { name: string; body_html: string; is_active: boolean };

const MERGE_FIELDS = [
	{ label: "Name", token: "{{customer_name}}" },
	{ label: "ID No.", token: "{{customer_id_number}}" },
	{ label: "Age", token: "{{customer_age}}" },
	{ label: "Date", token: "{{date}}" },
];

// ─── Form section state ───────────────────────────────────────────────────────

type SectionDraft = {
	_key: string;
	section_type: SectionType;
	title: string;
	body_html: string;
	required: boolean;
};

type FormFormState = { name: string; is_active: boolean; sections: SectionDraft[] };

function newSectionDraft(type: SectionType): SectionDraft {
	return { _key: crypto.randomUUID(), section_type: type, title: "", body_html: "", required: true };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EDocumentsManager({ letterTemplates, formTemplates }: Props) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<Tab>("letters");
	const [pending, startTransition] = useTransition();

	// Letter state
	const [letterDialogOpen, setLetterDialogOpen] = useState(false);
	const [editLetter, setEditLetter] = useState<LetterTemplate | null>(null);
	const [deleteLetter, setDeleteLetter] = useState<LetterTemplate | null>(null);
	const [letterForm, setLetterForm] = useState<LetterFormState>({ name: "", body_html: "", is_active: true });

	// Form state
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [editForm, setEditForm] = useState<FormTemplateWithSections | null>(null);
	const [deleteForm, setDeleteForm] = useState<FormTemplateWithSections | null>(null);
	const [formForm, setFormForm] = useState<FormFormState>({ name: "", is_active: true, sections: [] });

	// ── Letter handlers ──────────────────────────────────────────────────────
	const openCreateLetter = () => {
		setEditLetter(null);
		setLetterForm({ name: "", body_html: "", is_active: true });
		setLetterDialogOpen(true);
	};

	const openEditLetter = (t: LetterTemplate) => {
		setEditLetter(t);
		setLetterForm({ name: t.name, body_html: t.body_html, is_active: t.is_active });
		setLetterDialogOpen(true);
	};

	const handleSaveLetter = () => {
		startTransition(async () => {
			if (editLetter) {
				await updateLetterTemplateAction(editLetter.id, letterForm);
			} else {
				await createLetterTemplateAction(letterForm);
			}
			setLetterDialogOpen(false);
			router.refresh();
		});
	};

	const handleDeleteLetter = () => {
		if (!deleteLetter) return;
		startTransition(async () => {
			await deleteLetterTemplateAction(deleteLetter.id);
			setDeleteLetter(null);
			router.refresh();
		});
	};

	// ── Form handlers ────────────────────────────────────────────────────────
	const openCreateForm = () => {
		setEditForm(null);
		setFormForm({ name: "", is_active: true, sections: [] });
		setFormDialogOpen(true);
	};

	const openEditForm = (t: FormTemplateWithSections) => {
		setEditForm(t);
		setFormForm({
			name: t.name,
			is_active: t.is_active,
			sections: t.sections.map((s) => ({
				_key: s.id,
				section_type: s.section_type as SectionType,
				title: s.title ?? "",
				body_html: s.body_html ?? "",
				required: s.required,
			})),
		});
		setFormDialogOpen(true);
	};

	const addSection = (type: SectionType) => {
		setFormForm((f) => ({
			...f,
			sections: [
				...f.sections,
				{ ...newSectionDraft(type), sort_order: f.sections.length },
			],
		}));
	};

	const removeSection = (key: string) => {
		setFormForm((f) => ({ ...f, sections: f.sections.filter((s) => s._key !== key) }));
	};

	const updateSection = (key: string, patch: Partial<SectionDraft>) => {
		setFormForm((f) => ({
			...f,
			sections: f.sections.map((s) => (s._key === key ? { ...s, ...patch } : s)),
		}));
	};

	const handleSaveForm = () => {
		startTransition(async () => {
			const payload = {
				name: formForm.name,
				is_active: formForm.is_active,
				sections: formForm.sections.map((s, i) => ({
					sort_order: i,
					section_type: s.section_type,
					title: s.title || null,
					body_html: s.body_html || null,
					required: s.required,
				})),
			};
			if (editForm) {
				await updateFormTemplateAction(editForm.id, payload);
			} else {
				await createFormTemplateAction(payload);
			}
			setFormDialogOpen(false);
			router.refresh();
		});
	};

	const handleDeleteForm = () => {
		if (!deleteForm) return;
		startTransition(async () => {
			await deleteFormTemplateAction(deleteForm.id);
			setDeleteForm(null);
			router.refresh();
		});
	};

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<div className="space-y-6 p-6">
			<div>
				<h2 className="font-semibold text-lg">E-Documents</h2>
				<p className="text-muted-foreground text-sm">
					Manage letter templates and consent forms used across customer records and appointments.
				</p>
			</div>

			<div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
				{([{ key: "letters", label: "Letters" }, { key: "forms", label: "Forms" }] as { key: Tab; label: string }[]).map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setActiveTab(t.key)}
						className={cn(
							"rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
							activeTab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
						)}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* ── Letters tab ─────────────────────────────────────────────── */}
			{activeTab === "letters" && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-sm">Reusable letter templates for referrals and other correspondence.</p>
						<Button size="sm" onClick={openCreateLetter} className="gap-1.5">
							<Plus className="size-4" /> Add Template
						</Button>
					</div>
					{letterTemplates.length === 0 ? (
						<div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
							No letter templates yet. Click &ldquo;Add Template&rdquo; to create your first one.
						</div>
					) : (
						<div className="divide-y rounded-lg border">
							{letterTemplates.map((tpl) => (
								<div key={tpl.id} className="flex items-center justify-between px-4 py-3">
									<div className="flex min-w-0 items-center gap-3">
										<FileText className="size-4 shrink-0 text-muted-foreground" />
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className={cn("font-medium text-sm", !tpl.is_active && "text-muted-foreground line-through")}>
												{tpl.name}
											</span>
											<span className="truncate text-muted-foreground text-xs">
												{tpl.body_html ? `${tpl.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90)}…` : "No content"}
											</span>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{!tpl.is_active && (
											<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">Inactive</span>
										)}
										<Button variant="ghost" size="icon" className="size-8" onClick={() => openEditLetter(tpl)}>
											<Pencil className="size-3.5" />
										</Button>
										<Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteLetter(tpl)}>
											<Trash2 className="size-3.5" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* ── Forms tab ───────────────────────────────────────────────── */}
			{activeTab === "forms" && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-sm">Consent forms and other document forms sent to customers.</p>
						<Button size="sm" onClick={openCreateForm} className="gap-1.5">
							<Plus className="size-4" /> Add Form
						</Button>
					</div>
					{formTemplates.length === 0 ? (
						<div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
							No form templates yet. Click &ldquo;Add Form&rdquo; to create your first one.
						</div>
					) : (
						<div className="divide-y rounded-lg border">
							{formTemplates.map((tpl) => (
								<div key={tpl.id} className="flex items-center justify-between px-4 py-3">
									<div className="flex min-w-0 items-center gap-3">
										<FileText className="size-4 shrink-0 text-muted-foreground" />
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className={cn("font-medium text-sm", !tpl.is_active && "text-muted-foreground line-through")}>
												{tpl.name}
											</span>
											<span className="text-muted-foreground text-xs">
												{tpl.sections.length} section{tpl.sections.length !== 1 ? "s" : ""} —{" "}
												{tpl.sections.map((s) => SECTION_TYPE_LABELS[s.section_type as SectionType]).join(", ")}
											</span>
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										{!tpl.is_active && (
											<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">Inactive</span>
										)}
										<Button variant="ghost" size="icon" className="size-8" onClick={() => openEditForm(tpl)}>
											<Pencil className="size-3.5" />
										</Button>
										<Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteForm(tpl)}>
											<Trash2 className="size-3.5" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* ── Letter dialog ────────────────────────────────────────────── */}
			<Dialog open={letterDialogOpen} onOpenChange={setLetterDialogOpen}>
				<DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
					<DialogHeader className="border-b px-6 py-4">
						<DialogTitle>{editLetter ? "Edit Letter Template" : "New Letter Template"}</DialogTitle>
					</DialogHeader>
					<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
						<div className="space-y-1.5">
							<Label htmlFor="ltr-name">Template name</Label>
							<Input id="ltr-name" placeholder="e.g. Referral Letter" value={letterForm.name}
								onChange={(e) => setLetterForm((f) => ({ ...f, name: e.target.value }))} />
						</div>
						<div className="space-y-1.5">
							<Label>Letter body</Label>
							<p className="text-muted-foreground text-xs">Click a merge field button in the toolbar to insert customer data automatically.</p>
							<RichTextEditor value={letterForm.body_html} onChange={(html) => setLetterForm((f) => ({ ...f, body_html: html }))}
								placeholder="Start typing your letter content here…" mergeFields={MERGE_FIELDS} minHeight={280} />
						</div>
						<div className="flex items-center gap-3">
							<Switch id="ltr-active" checked={letterForm.is_active}
								onCheckedChange={(v) => setLetterForm((f) => ({ ...f, is_active: v }))} />
							<Label htmlFor="ltr-active">Active (visible when creating letters)</Label>
						</div>
					</div>
					<DialogFooter className="border-t px-6 py-4">
						<Button variant="outline" onClick={() => setLetterDialogOpen(false)} disabled={pending}>Cancel</Button>
						<Button onClick={handleSaveLetter} disabled={pending || !letterForm.name.trim()}>
							{pending ? <Loader2 className="size-4 animate-spin" /> : editLetter ? "Save Changes" : "Create Template"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Form template dialog ─────────────────────────────────────── */}
			<Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
				<DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
					<DialogHeader className="border-b px-6 py-4">
						<DialogTitle>{editForm ? "Edit Form Template" : "New Form Template"}</DialogTitle>
					</DialogHeader>
					<div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
						<div className="flex gap-4">
							<div className="flex-1 space-y-1.5">
								<Label htmlFor="frm-name">Form name</Label>
								<Input id="frm-name" placeholder="e.g. Consent Form" value={formForm.name}
									onChange={(e) => setFormForm((f) => ({ ...f, name: e.target.value }))} />
							</div>
							<div className="flex items-end gap-2 pb-0.5">
								<Switch id="frm-active" checked={formForm.is_active}
									onCheckedChange={(v) => setFormForm((f) => ({ ...f, is_active: v }))} />
								<Label htmlFor="frm-active">Active</Label>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Sections</Label>
								<div className="flex gap-1.5">
									{(["open_text", "tnc", "signature", "checkbox"] as SectionType[]).map((type) => (
										<button
											key={type}
											type="button"
											onClick={() => addSection(type)}
											className="rounded border border-dashed border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
										>
											+ {SECTION_TYPE_LABELS[type]}
										</button>
									))}
								</div>
							</div>

							{formForm.sections.length === 0 && (
								<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
									Click a section type above to add sections to this form.
								</div>
							)}

							{formForm.sections.map((sec, idx) => (
								<div key={sec._key} className="rounded-lg border bg-muted/10 p-4 space-y-3">
									<div className="flex items-center justify-between">
										<span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs font-medium">
											{idx + 1}. {SECTION_TYPE_LABELS[sec.section_type]}
										</span>
										<div className="flex items-center gap-3">
											<label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
												<input
													type="checkbox"
													checked={sec.required}
													onChange={(e) => updateSection(sec._key, { required: e.target.checked })}
													className="rounded"
												/>
												Required
											</label>
											<button type="button" onClick={() => removeSection(sec._key)}
												className="text-muted-foreground hover:text-destructive transition-colors">
												<Trash2 className="size-3.5" />
											</button>
										</div>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs">Section title</Label>
										<Input placeholder={SECTION_TYPE_LABELS[sec.section_type]} value={sec.title}
											onChange={(e) => updateSection(sec._key, { title: e.target.value })} />
									</div>
									{(sec.section_type === "open_text" || sec.section_type === "tnc") && (
										<div className="space-y-1.5">
											<Label className="text-xs">Default content</Label>
											<RichTextEditor value={sec.body_html}
												onChange={(html) => updateSection(sec._key, { body_html: html })}
												placeholder="Enter the default content for this section…"
												minHeight={160} />
										</div>
									)}
									{sec.section_type === "checkbox" && (
										<div className="space-y-1.5">
											<Label className="text-xs">Checkbox label</Label>
											<Input placeholder="I agree to the above terms" value={sec.body_html}
												onChange={(e) => updateSection(sec._key, { body_html: e.target.value })} />
										</div>
									)}
								</div>
							))}
						</div>
					</div>
					<DialogFooter className="border-t px-6 py-4">
						<Button variant="outline" onClick={() => setFormDialogOpen(false)} disabled={pending}>Cancel</Button>
						<Button onClick={handleSaveForm} disabled={pending || !formForm.name.trim()}>
							{pending ? <Loader2 className="size-4 animate-spin" /> : editForm ? "Save Changes" : "Create Form"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm deletes */}
			<ConfirmDialog open={deleteLetter !== null} onOpenChange={(o) => !o && setDeleteLetter(null)}
				title="Delete this template?" description={`"${deleteLetter?.name}" will be removed. Existing letters are not affected.`}
				confirmLabel="Delete" pending={pending} onConfirm={handleDeleteLetter} />
			<ConfirmDialog open={deleteForm !== null} onOpenChange={(o) => !o && setDeleteForm(null)}
				title="Delete this form?" description={`"${deleteForm?.name}" will be removed. Existing responses are not affected.`}
				confirmLabel="Delete" pending={pending} onConfirm={handleDeleteForm} />
		</div>
	);
}

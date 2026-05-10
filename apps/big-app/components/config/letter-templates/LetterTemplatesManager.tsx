"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	createLetterTemplateAction,
	deleteLetterTemplateAction,
	updateLetterTemplateAction,
} from "@/lib/actions/letter-templates";
import type { LetterTemplate } from "@/lib/services/letter-templates";

type Props = {
	templates: LetterTemplate[];
};

type FormState = {
	name: string;
	body_html: string;
	is_active: boolean;
};

const MERGE_HINT = `Available merge fields: {{customer_name}}  {{customer_id_number}}  {{customer_age}}  {{date}}`;

export function LetterTemplatesManager({ templates }: Props) {
	const router = useRouter();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<LetterTemplate | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<LetterTemplate | null>(null);
	const [form, setForm] = useState<FormState>({
		name: "",
		body_html: "",
		is_active: true,
	});
	const [pending, startTransition] = useTransition();

	const openCreate = () => {
		setEditTarget(null);
		setForm({ name: "", body_html: "", is_active: true });
		setDialogOpen(true);
	};

	const openEdit = (tpl: LetterTemplate) => {
		setEditTarget(tpl);
		setForm({
			name: tpl.name,
			body_html: tpl.body_html,
			is_active: tpl.is_active,
		});
		setDialogOpen(true);
	};

	const handleSave = () => {
		startTransition(async () => {
			try {
				if (editTarget) {
					await updateLetterTemplateAction(editTarget.id, form);
				} else {
					await createLetterTemplateAction(form);
				}
				setDialogOpen(false);
				router.refresh();
			} catch {
				// error surfaced via validation
			}
		});
	};

	const handleDelete = () => {
		if (!deleteTarget) return;
		const id = deleteTarget.id;
		startTransition(async () => {
			await deleteLetterTemplateAction(id);
			setDeleteTarget(null);
			router.refresh();
		});
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">Letter Templates</h2>
					<p className="text-muted-foreground text-sm">
						Define reusable letter templates for referrals, consent forms, and
						other correspondence.
					</p>
				</div>
				<Button size="sm" onClick={openCreate} className="gap-1.5">
					<Plus className="size-4" />
					Add Template
				</Button>
			</div>

			{templates.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
					No letter templates yet. Click &ldquo;Add Template&rdquo; to create
					your first one.
				</div>
			) : (
				<div className="divide-y rounded-lg border">
					{templates.map((tpl) => (
						<div
							key={tpl.id}
							className="flex items-center justify-between px-4 py-3"
						>
							<div className="flex min-w-0 flex-col gap-0.5">
								<span
									className={`font-medium text-sm ${!tpl.is_active ? "text-muted-foreground line-through" : ""}`}
								>
									{tpl.name}
								</span>
								<span className="text-muted-foreground text-xs">
									{tpl.body_html
										? `${tpl.body_html
												.replace(/<[^>]+>/g, " ")
												.trim()
												.slice(0, 80)}…`
										: "No content"}
								</span>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								{!tpl.is_active && (
									<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
										Inactive
									</span>
								)}
								<Button
									variant="ghost"
									size="icon"
									className="size-8"
									onClick={() => openEdit(tpl)}
								>
									<Pencil className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground hover:text-destructive"
									onClick={() => setDeleteTarget(tpl)}
								>
									<Trash2 className="size-3.5" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Create / Edit dialog */}
			<FormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				size="lg"
				title={editTarget ? "Edit Template" : "New Letter Template"}
				footer={
					<>
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={pending || !form.name.trim()}
						>
							{pending ? (
								<Loader2 className="size-4 animate-spin" />
							) : editTarget ? (
								"Save Changes"
							) : (
								"Create Template"
							)}
						</Button>
					</>
				}
			>
				<div className="space-y-1.5">
					<Label htmlFor="tpl-name">Template name</Label>
					<Input
						id="tpl-name"
						placeholder="e.g. Referral Letter"
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="tpl-body">
						Body HTML{" "}
						<span className="font-normal text-muted-foreground text-xs">
							— supports basic HTML tags
						</span>
					</Label>
					<p className="text-muted-foreground text-xs">{MERGE_HINT}</p>
					<textarea
						id="tpl-body"
						rows={18}
						className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed shadow-sm outline-none focus:ring-2 focus:ring-ring/50 resize-y"
						placeholder={`<p>Dear *Insert Doctor Name*,</p>\n\n<p>Re: {{customer_name}} ({{customer_id_number}})</p>\n\n<p>Thank you for seeing {{customer_name}} regarding ...</p>`}
						value={form.body_html}
						onChange={(e) =>
							setForm((f) => ({ ...f, body_html: e.target.value }))
						}
					/>
				</div>

				<div className="flex items-center gap-3">
					<Switch
						id="tpl-active"
						checked={form.is_active}
						onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
					/>
					<Label htmlFor="tpl-active">
						Active (visible when creating letters)
					</Label>
				</div>
			</FormDialog>

			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title="Delete this template?"
				description={`"${deleteTarget?.name}" will be removed. Existing letters already generated from it are not affected.`}
				confirmLabel="Delete"
				pending={pending}
				onConfirm={handleDelete}
			/>
		</div>
	);
}

"use client";

import {
	Download,
	FileText,
	Image as ImageIcon,
	Images,
	Mail,
	NotebookPen,
	Pencil,
	Plus,
	Printer,
	ScanLine,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Toast } from "@/components/appointments/AppointmentToastStack";
import { usePermission } from "@/components/auth/PermissionsProvider";
import {
	LetterEditorDialog,
	type CustomerMergeData,
} from "@/components/customer-documents/LetterEditorDialog";
import { FormFillDialog } from "@/components/customer-documents/FormFillDialog";
import { DocumentPreviewDialog } from "@/components/customer-documents/DocumentPreviewDialog";
import { UploadDocumentDialog } from "@/components/customer-documents/UploadDocumentDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	createCustomerDocumentAction,
	deleteCustomerDocumentAction,
	getCustomerDocumentSignedUrlAction,
	requestCustomerDocumentUploadUrlAction,
} from "@/lib/actions/customer-documents";
import {
	CUSTOMER_DOCUMENT_MAX_BYTES,
	CUSTOMER_DOCUMENT_MIME_TYPES,
} from "@/lib/schemas/customer-documents";
import type { CustomerDocumentWithRefs } from "@/lib/services/customer-documents";
import type { LetterTemplate } from "@/lib/services/letter-templates";
import type { FormTemplateWithSections } from "@/lib/services/form-templates";
import type { FormResponse } from "@/lib/services/form-responses";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
	customerId: string;
	appointmentId?: string | null;
	defaultUploaderId: string | null;
	documents: CustomerDocumentWithRefs[];
	customer: CustomerMergeData;
	letterTemplates: LetterTemplate[];
	formTemplates: FormTemplateWithSections[];
	formResponses: FormResponse[];
	onToast: (message: string, variant?: Toast["variant"]) => void;
};

const ACCEPT_ATTR = CUSTOMER_DOCUMENT_MIME_TYPES.join(",");

function formatBytes(n: number): string {
	if (n === 0) return "—";
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso: string): string {
	const d = new Date(iso);
	const date = d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
	const time = d.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	return `${date} ${time}`;
}

function fileExtension(name: string, mime: string): string {
	if (mime === "text/html") return "LETTER";
	const dot = name.lastIndexOf(".");
	if (dot >= 0 && dot < name.length - 1) {
		return name.slice(dot + 1).toUpperCase();
	}
	const slash = mime.lastIndexOf("/");
	return slash >= 0 ? mime.slice(slash + 1).toUpperCase() : "FILE";
}

function fileKind(mime: string): "image" | "pdf" | "letter" {
	if (mime === "text/html") return "letter";
	return mime === "application/pdf" ? "pdf" : "image";
}

type Row = CustomerDocumentWithRefs & {
	_searchAppointment: string;
	_isCurrentVisit: boolean;
};

export function CustomerDocumentsPanel({
	customerId,
	appointmentId = null,
	defaultUploaderId,
	documents,
	customer,
	letterTemplates,
	formTemplates,
	formResponses,
	onToast,
}: Props) {
	const canEditDocument = usePermission("clinical.document_edit");
	const canDeleteDocument = usePermission("clinical.document_delete");
	const canWriteLetter = usePermission("clinical.medical_certificates");
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [previewDoc, setPreviewDoc] = useState<CustomerDocumentWithRefs | null>(
		null,
	);
	const [letterEditorOpen, setLetterEditorOpen] = useState(false);
	const [editingLetter, setEditingLetter] = useState<CustomerDocumentWithRefs | null>(null);
	const [formFillOpen, setFormFillOpen] = useState(false);

	const refresh = () => router.refresh();

	const stageFile = (file: File) => {
		if (!CUSTOMER_DOCUMENT_MIME_TYPES.includes(file.type as never)) {
			onToast("Use JPG, PNG, WebP, or PDF", "error");
			if (inputRef.current) inputRef.current.value = "";
			return;
		}
		if (file.size > CUSTOMER_DOCUMENT_MAX_BYTES) {
			onToast("Max file size is 20 MB", "error");
			if (inputRef.current) inputRef.current.value = "";
			return;
		}
		setPendingFile(file);
	};

	const clearPending = () => {
		setPendingFile(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	const handleUploadConfirm = async (displayName: string) => {
		if (!pendingFile) return;
		const file = pendingFile;
		setUploading(true);
		try {
			const { token, path } = await requestCustomerDocumentUploadUrlAction({
				customerId,
				filename: file.name,
				mime: file.type,
			});
			const supabase = createClient();
			const { error: upErr } = await supabase.storage
				.from("documents")
				.uploadToSignedUrl(path, token, file, {
					contentType: file.type,
					upsert: false,
				});
			if (upErr) throw upErr;

			await createCustomerDocumentAction(appointmentId, {
				customer_id: customerId,
				appointment_id: appointmentId,
				uploaded_by_id: defaultUploaderId,
				storage_path: path,
				file_name: displayName,
				mime_type: file.type,
				size_bytes: file.size,
			});
			onToast("Document uploaded", "success");
			clearPending();
			refresh();
		} catch (err) {
			onToast(err instanceof Error ? err.message : "Upload failed", "error");
		} finally {
			setUploading(false);
		}
	};

	const handleDownload = async (doc: CustomerDocumentWithRefs) => {
		try {
			const url = await getCustomerDocumentSignedUrlAction(doc.id);
			const a = document.createElement("a");
			a.href = url;
			a.download = doc.file_name;
			a.rel = "noopener noreferrer";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch (err) {
			onToast(
				err instanceof Error ? err.message : "Could not download",
				"error",
			);
		}
	};

	const handleDelete = () => {
		if (!deleteId) return;
		const id = deleteId;
		startTransition(async () => {
			try {
				await deleteCustomerDocumentAction(appointmentId, id);
				setDeleteId(null);
				onToast("Document deleted", "success");
				refresh();
			} catch (err) {
				onToast(
					err instanceof Error ? err.message : "Could not delete document",
					"error",
				);
			}
		});
	};

	const visible: Row[] = documents.map((d) => ({
		...d,
		_isCurrentVisit: appointmentId !== null && d.appointment_id === appointmentId,
		_searchAppointment: d.appointment?.booking_ref ?? "",
	}));

	const columns: DataTableColumn<Row>[] = [
		{
			key: "name",
			header: "Name",
			sortable: true,
			sortValue: (r) => r.file_name.toLowerCase(),
			cell: (r) =>
				r.doc_type === "letter" ? (
					<LetterNameCell
						doc={r}
						onEdit={() => {
							setEditingLetter(r);
							setLetterEditorOpen(true);
						}}
					/>
				) : (
					<NameCell doc={r} onView={() => setPreviewDoc(r)} />
				),
		},
		{
			key: "type",
			header: "Type",
			sortable: true,
			sortValue: (r) => fileExtension(r.file_name, r.mime_type),
			cell: (r) => (
				<span
					className={cn(
						"text-xs uppercase tracking-wide",
						r.doc_type === "letter"
							? "font-semibold text-rose-600"
							: "text-muted-foreground",
					)}
				>
					{fileExtension(r.file_name, r.mime_type)}
				</span>
			),
			className: "w-24",
		},
		{
			key: "size",
			header: "Size",
			sortable: true,
			sortValue: (r) => r.size_bytes,
			cell: (r) => (
				<span className="text-muted-foreground text-xs tabular-nums">
					{formatBytes(r.size_bytes)}
				</span>
			),
			align: "right",
			className: "w-24",
		},
		{
			key: "uploaded",
			header: "Uploaded",
			sortable: true,
			sortValue: (r) => r.created_at,
			cell: (r) => (
				<span className="text-muted-foreground text-xs tabular-nums">
					{formatDateTime(r.created_at)}
				</span>
			),
			className: "w-40",
		},
		{
			key: "appointment",
			header: "Appointment",
			sortable: true,
			sortValue: (r) => r.appointment?.booking_ref ?? "",
			cell: (r) =>
				r.appointment ? (
					<div className="flex flex-col gap-0.5">
						<span className="font-mono text-xs tabular-nums">
							{r.appointment.booking_ref}
						</span>
						{r._isCurrentVisit && (
							<span className="w-fit rounded bg-blue-600 px-1.5 py-px font-bold text-[9px] text-white uppercase tracking-wide">
								This visit
							</span>
						)}
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				),
			className: "w-40",
		},
		{
			key: "actions",
			header: <span className="sr-only">Actions</span>,
			cell: (r) =>
				r.doc_type === "letter" ? (
					<LetterActionsCell docId={r.id} />
				) : (
					<ActionsCell onDownload={() => handleDownload(r)} />
				),
			className: "w-24",
			align: "center",
		},
		...(canDeleteDocument
			? [
					{
						key: "delete",
						header: <span className="sr-only">Delete</span>,
						cell: (r: Row) => (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => setDeleteId(r.id)}
										aria-label="Delete"
										className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 className="size-4" />
									</button>
								</TooltipTrigger>
								<TooltipContent side="left">Delete</TooltipContent>
							</Tooltip>
						),
						className: "w-12",
						align: "center" as const,
					} satisfies DataTableColumn<Row>,
				]
			: []),
	];

	const helperText = appointmentId
		? "JPG, PNG, WebP, or PDF · max 20 MB · attached to this visit"
		: "JPG, PNG, WebP, or PDF · max 20 MB";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-3">
				<div className="flex items-center gap-1.5">
					{canEditDocument ? (
						<>
							<AddActionButton
								label="Files"
								tooltip="Upload a file (image or PDF)"
								color="emerald"
								icon={<Plus className="size-4" />}
								onClick={() => inputRef.current?.click()}
								disabled={uploading}
							/>
							<AddActionButton
								label="Forms"
								tooltip="Fill a consent form"
								color="amber"
								icon={<NotebookPen className="size-4" />}
								onClick={() => setFormFillOpen(true)}
							/>
						</>
					) : null}
					{canWriteLetter ? (
						<AddActionButton
							label="Letters"
							tooltip="Generate a letter for this customer"
							color="rose"
							icon={<Mail className="size-4" />}
							onClick={() => {
								setEditingLetter(null);
								setLetterEditorOpen(true);
							}}
						/>
					) : null}
					<AddActionButton
						label="Collages"
						tooltip="Collages — coming soon"
						color="sky"
						icon={<Images className="size-4" />}
						disabled
					/>
					<AddActionButton
						label="Scan"
						tooltip="Scan to upload — coming soon"
						color="violet"
						icon={<ScanLine className="size-4" />}
						disabled
					/>
				</div>
				<p className="text-muted-foreground text-xs">{helperText}</p>
				<input
					ref={inputRef}
					type="file"
					accept={ACCEPT_ATTR}
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) stageFile(file);
					}}
				/>
			</div>

			<DataTable
				data={visible}
				columns={columns}
				getRowKey={(r) => r.id}
				searchKeys={["file_name", "_searchAppointment"]}
				searchPlaceholder="Search documents…"
				emptyMessage="No documents for this customer yet."
				defaultPageSize={10}
				minWidth={760}
			/>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(o) => !o && setDeleteId(null)}
				title="Delete this document?"
				description="The file will be removed and can't be recovered."
				confirmLabel="Delete"
				pending={pending}
				onConfirm={handleDelete}
			/>

			<UploadDocumentDialog
				open={pendingFile !== null}
				onOpenChange={(o) => {
					if (!o) clearPending();
				}}
				file={pendingFile}
				uploading={uploading}
				onConfirm={(name) => void handleUploadConfirm(name)}
			/>

			<DocumentPreviewDialog
				doc={previewDoc}
				onOpenChange={(o) => {
					if (!o) setPreviewDoc(null);
				}}
				onError={(msg) => onToast(msg, "error")}
			/>

			<LetterEditorDialog
				open={letterEditorOpen}
				onOpenChange={(o) => {
					setLetterEditorOpen(o);
					if (!o) setEditingLetter(null);
				}}
				customerId={customerId}
				appointmentId={appointmentId}
				customer={customer}
				templates={letterTemplates}
				editDoc={editingLetter}
				onToast={onToast}
			/>

			<FormFillDialog
				open={formFillOpen}
				onOpenChange={setFormFillOpen}
				customerId={customerId}
				appointmentId={appointmentId}
				formTemplates={formTemplates}
				onToast={onToast}
			/>

			{/* Form responses */}
			{formResponses.length > 0 && (
				<FormResponsesSection
					responses={formResponses}
					appointmentId={appointmentId}
					onToast={onToast}
				/>
			)}
		</div>
	);
}

const COLOR_CLASSES: Record<
	"emerald" | "amber" | "rose" | "sky" | "violet",
	{ enabled: string; disabled: string }
> = {
	emerald: {
		enabled:
			"border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
		disabled: "border-emerald-100 bg-emerald-50/50 text-emerald-400",
	},
	amber: {
		enabled: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
		disabled: "border-amber-100 bg-amber-50/50 text-amber-400",
	},
	rose: {
		enabled: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
		disabled: "border-rose-100 bg-rose-50/50 text-rose-400",
	},
	sky: {
		enabled: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
		disabled: "border-sky-100 bg-sky-50/50 text-sky-400",
	},
	violet: {
		enabled:
			"border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
		disabled: "border-violet-100 bg-violet-50/50 text-violet-400",
	},
};

function AddActionButton({
	label,
	tooltip,
	icon,
	color,
	onClick,
	disabled,
}: {
	label: string;
	tooltip: string;
	icon: React.ReactNode;
	color: keyof typeof COLOR_CLASSES;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const cls = COLOR_CLASSES[color];
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					disabled={disabled}
					aria-label={label}
					className={cn(
						"flex flex-col items-center gap-0.5 rounded-md border px-2.5 py-1.5 transition",
						disabled
							? `${cls.disabled} cursor-not-allowed opacity-70`
							: cls.enabled,
					)}
				>
					{icon}
					<span className="font-medium text-[10px] uppercase tracking-wide">
						{label}
					</span>
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{tooltip}</TooltipContent>
		</Tooltip>
	);
}

function NameCell({
	doc,
	onView,
}: {
	doc: CustomerDocumentWithRefs;
	onView: () => void;
}) {
	const kind = fileKind(doc.mime_type);
	const hasThumb = kind === "image" && doc.preview_url;
	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={onView}
				aria-label={`Preview ${doc.file_name}`}
				className={cn(
					"flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border transition hover:ring-2 hover:ring-ring/50",
					!hasThumb && kind === "image" && "bg-sky-50 text-sky-600",
					!hasThumb && kind === "pdf" && "bg-rose-50 text-rose-600",
				)}
			>
				{hasThumb ? (
					// eslint-disable-next-line @next/next/no-img-element -- signed URL, short TTL
					<img
						src={doc.preview_url as string}
						alt={doc.file_name}
						className="size-full object-cover"
						loading="lazy"
					/>
				) : kind === "image" ? (
					<ImageIcon className="size-7" />
				) : (
					<FileText className="size-7" />
				)}
			</button>
			<button
				type="button"
				onClick={onView}
				className="min-w-0 truncate text-left font-medium text-sm hover:underline"
				title={doc.file_name}
			>
				{doc.file_name}
			</button>
		</div>
	);
}

function LetterNameCell({
	doc,
	onEdit,
}: {
	doc: CustomerDocumentWithRefs;
	onEdit: () => void;
}) {
	return (
		<div className="flex items-center gap-3">
			{/* Letter icon thumbnail */}
			<div className="flex size-20 shrink-0 items-center justify-center rounded-md border bg-rose-50 text-rose-600">
				<Mail className="size-7" />
			</div>
			<div className="flex min-w-0 flex-col gap-1">
				<span className="truncate font-medium text-sm" title={doc.file_name}>
					{doc.file_name.toUpperCase()}
				</span>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={onEdit}
							aria-label="Edit letter"
							className="inline-flex w-fit items-center gap-1 rounded text-muted-foreground text-xs hover:text-foreground"
						>
							<Pencil className="size-3" />
							Edit
						</button>
					</TooltipTrigger>
					<TooltipContent>Edit letter content</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}

function LetterActionsCell({ docId }: { docId: string }) {
	return (
		<div className="flex items-center justify-center gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={() =>
							window.open(`/documents/letters/${docId}`, "_blank")
						}
						aria-label="Print letter"
						className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<Printer className="size-4" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="left">Print / View</TooltipContent>
			</Tooltip>
		</div>
	);
}

function ActionsCell({ onDownload }: { onDownload: () => void }) {
	return (
		<div className="flex items-center justify-center gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={onDownload}
						aria-label="Download"
						className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						<Download className="size-4" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="left">Download</TooltipContent>
			</Tooltip>
		</div>
	);
}

function FormResponsesSection({
	responses,
	appointmentId,
	onToast,
}: {
	responses: FormResponse[];
	appointmentId: string | null;
	onToast: (msg: string, variant?: Toast["variant"]) => void;
}) {
	const router = useRouter();
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const handleDelete = () => {
		if (!deleteId) return;
		const id = deleteId;
		startTransition(async () => {
			try {
				const { deleteFormResponseAction } = await import("@/lib/actions/form-responses");
				await deleteFormResponseAction(id);
				setDeleteId(null);
				onToast("Form response deleted", "success");
				router.refresh();
			} catch (err) {
				onToast(err instanceof Error ? err.message : "Could not delete", "error");
			}
		});
	};

	const visible = appointmentId
		? responses.filter((r) => !r.appointment_id || r.appointment_id === appointmentId)
		: responses;

	if (visible.length === 0) return null;

	return (
		<>
			<div className="rounded-md border">
				<div className="border-b bg-muted/30 px-4 py-2">
					<p className="font-medium text-sm">Submitted Forms</p>
				</div>
				<div className="divide-y">
					{visible.map((resp) => {
						const date = new Date(resp.created_at).toLocaleDateString("en-GB", {
							day: "2-digit", month: "short", year: "numeric",
						});
						return (
							<div key={resp.id} className="flex items-center justify-between px-4 py-3">
								<div className="flex min-w-0 items-center gap-3">
									<NotebookPen className="size-4 shrink-0 text-amber-600" />
									<div className="flex min-w-0 flex-col gap-0.5">
										<span className="font-medium text-sm">{resp.form_name}</span>
										<span className="text-muted-foreground text-xs">
											{date}
											{resp.signed_by_name && ` · Signed: ${resp.signed_by_name}`}
											{resp.appointment_id === appointmentId && appointmentId && (
												<span className="ml-1.5 rounded bg-blue-600 px-1.5 py-px font-bold text-[9px] text-white uppercase tracking-wide">
													This visit
												</span>
											)}
										</span>
									</div>
								</div>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => setDeleteId(resp.id)}
											aria-label="Delete"
											className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										>
											<Trash2 className="size-4" />
										</button>
									</TooltipTrigger>
									<TooltipContent side="left">Delete response</TooltipContent>
								</Tooltip>
							</div>
						);
					})}
				</div>
			</div>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(o) => !o && setDeleteId(null)}
				title="Delete this form response?"
				description="This will permanently remove the submitted form response."
				confirmLabel="Delete"
				pending={pending}
				onConfirm={handleDelete}
			/>
		</>
	);
}

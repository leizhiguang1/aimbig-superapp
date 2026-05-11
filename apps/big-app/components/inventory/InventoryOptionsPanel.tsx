"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { usePermission } from "@/components/auth/PermissionsProvider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateButton } from "@/components/ui/create-button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { SupplierDialog } from "@/components/inventory/SupplierDialog";
import {
	createBrandAction,
	createCategoryAction,
	createSupplierAction,
	deleteBrandAction,
	deleteCategoryAction,
	deleteSupplierAction,
	updateBrandAction,
	updateCategoryAction,
	updateSupplierAction,
} from "@/lib/actions/inventory";
import type {
	InventoryBrand,
	InventoryCategory,
	Supplier,
} from "@/lib/services/inventory";

type Props = {
	brands: InventoryBrand[];
	categories: InventoryCategory[];
	suppliers: Supplier[];
	brandCounts: Record<string, number>;
	categoryCounts: Record<string, number>;
	supplierCounts: Record<string, number>;
};

export function InventoryOptionsPanel({
	brands,
	categories,
	suppliers,
	brandCounts,
	categoryCounts,
	supplierCounts,
}: Props) {
	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-4 lg:grid-cols-2">
				<BrandsPanel brands={brands} counts={brandCounts} />
				<CategoriesPanel categories={categories} counts={categoryCounts} />
			</div>
			<SuppliersPanel suppliers={suppliers} counts={supplierCounts} />
		</div>
	);
}

// ---------- Brands ----------

function BrandsPanel({
	brands,
	counts,
}: {
	brands: InventoryBrand[];
	counts: Record<string, number>;
}) {
	const canEdit = usePermission("inventory.inventory_edit");
	const [editing, setEditing] = useState<InventoryBrand | "new" | null>(null);
	const [deleting, setDeleting] = useState<InventoryBrand | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	return (
		<PanelCard
			title="Brands"
			onAdd={canEdit ? () => setEditing("new") : null}
			emptyMessage="No brands yet."
			rows={brands}
		>
			{brands.map((b) => (
				<Row
					key={b.id}
					left={b.name}
					right={`${counts[b.id] ?? 0} items`}
					onEdit={canEdit ? () => setEditing(b) : null}
					onDelete={
						canEdit
							? () => {
									setDeleteError(null);
									setDeleting(b);
								}
							: null
					}
				/>
			))}
			{editing && (
				<SimpleNameDialog
					mode={editing === "new" ? "create" : "edit"}
					title={editing === "new" ? "New brand" : "Edit brand"}
					initial={editing === "new" ? { name: "" } : { name: editing.name }}
					onSubmit={async (data) => {
						if (editing === "new") {
							await createBrandAction(data);
						} else {
							await updateBrandAction(editing.id, data);
						}
						setEditing(null);
					}}
					onClose={() => setEditing(null)}
				/>
			)}
			<ConfirmDialog
				open={!!deleting}
				onOpenChange={(o) => {
					if (!o) setDeleting(null);
				}}
				title="Delete brand?"
				description={
					deleting
						? `"${deleting.name}" will be permanently removed.${deleteError ? ` — ${deleteError}` : ""}`
						: undefined
				}
				confirmLabel="Delete"
				pending={pending}
				onConfirm={() => {
					if (!deleting) return;
					const target = deleting;
					setDeleteError(null);
					startTransition(async () => {
						try {
							await deleteBrandAction(target.id);
							setDeleting(null);
						} catch (err) {
							setDeleteError(
								err instanceof Error ? err.message : "Failed to delete",
							);
						}
					});
				}}
			/>
		</PanelCard>
	);
}

// ---------- Categories ----------

function CategoriesPanel({
	categories,
	counts,
}: {
	categories: InventoryCategory[];
	counts: Record<string, number>;
}) {
	const canEdit = usePermission("inventory.inventory_edit");
	const [editing, setEditing] = useState<InventoryCategory | "new" | null>(
		null,
	);
	const [deleting, setDeleting] = useState<InventoryCategory | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	return (
		<PanelCard
			title="Categories"
			onAdd={canEdit ? () => setEditing("new") : null}
			emptyMessage="No categories yet."
			rows={categories}
		>
			{categories.map((c) => (
				<Row
					key={c.id}
					left={c.name}
					right={`${counts[c.id] ?? 0} items`}
					sub={c.external_code ?? undefined}
					onEdit={canEdit ? () => setEditing(c) : null}
					onDelete={
						canEdit
							? () => {
									setDeleteError(null);
									setDeleting(c);
								}
							: null
					}
				/>
			))}
			{editing && (
				<CategoryDialog
					mode={editing === "new" ? "create" : "edit"}
					initial={
						editing === "new"
							? { name: "", external_code: "" }
							: {
									name: editing.name,
									external_code: editing.external_code ?? "",
								}
					}
					onSubmit={async (data) => {
						if (editing === "new") {
							await createCategoryAction(data);
						} else {
							await updateCategoryAction(editing.id, data);
						}
						setEditing(null);
					}}
					onClose={() => setEditing(null)}
				/>
			)}
			<ConfirmDialog
				open={!!deleting}
				onOpenChange={(o) => {
					if (!o) setDeleting(null);
				}}
				title="Delete category?"
				description={
					deleting
						? `"${deleting.name}" will be permanently removed.${deleteError ? ` — ${deleteError}` : ""}`
						: undefined
				}
				confirmLabel="Delete"
				pending={pending}
				onConfirm={() => {
					if (!deleting) return;
					const target = deleting;
					setDeleteError(null);
					startTransition(async () => {
						try {
							await deleteCategoryAction(target.id);
							setDeleting(null);
						} catch (err) {
							setDeleteError(
								err instanceof Error ? err.message : "Failed to delete",
							);
						}
					});
				}}
			/>
		</PanelCard>
	);
}

// ---------- Suppliers ----------

function SuppliersPanel({
	suppliers,
	counts: _counts,
}: {
	suppliers: Supplier[];
	counts: Record<string, number>;
}) {
	const canEdit = usePermission("inventory.inventory_edit");
	const [editing, setEditing] = useState<Supplier | "new" | null>(null);
	const [deleting, setDeleting] = useState<Supplier | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const dash = <span className="text-muted-foreground">—</span>;

	const fullName = (s: Supplier) =>
		[s.first_name, s.last_name].filter(Boolean).join(" ").trim();

	const formatTerms = (s: Supplier) => {
		if (s.payment_terms_value == null) return "";
		const unit = s.payment_terms_unit ?? "days";
		return `${s.payment_terms_value} ${unit}`;
	};

	const formatAddress = (s: Supplier) =>
		[s.address_1, s.address_2, s.city, s.state, s.postcode, s.country]
			.filter(Boolean)
			.join(", ");

	const columns: DataTableColumn<Supplier>[] = [
		{
			key: "name",
			header: "NAME",
			sortable: true,
			sortValue: (s) => s.name,
			cell: (s) => <span className="font-medium">{s.name}</span>,
		},
		{
			key: "description",
			header: "DESCRIPTION",
			cell: (s) => s.description || dash,
		},
		{
			key: "account_number",
			header: "ACCOUNT #",
			cell: (s) => s.account_number || dash,
		},
		{
			key: "terms",
			header: "TERMS",
			cell: (s) => formatTerms(s) || dash,
		},
		{
			key: "pic",
			header: "PIC",
			cell: (s) => fullName(s) || dash,
		},
		{
			key: "mobile_number",
			header: "CONTACT #",
			cell: (s) => s.mobile_number || dash,
		},
		{
			key: "office_phone",
			header: "OFFICE #",
			cell: (s) => s.office_phone || dash,
		},
		{
			key: "email",
			header: "E-MAIL",
			cell: (s) => s.email || dash,
		},
		{
			key: "website",
			header: "WEBSITE",
			cell: (s) => s.website || dash,
		},
		{
			key: "address",
			header: "ADDRESS",
			cell: (s) => {
				const addr = formatAddress(s);
				return addr ? (
					<span className="line-clamp-2 max-w-[18rem]">{addr}</span>
				) : (
					dash
				);
			},
		},
		{
			key: "barcode",
			header: "BARCODE",
			cell: () => dash,
		},
		...(canEdit
			? [
					{
						key: "actions",
						header: "",
						align: "right" as const,
						cell: (s: Supplier) => (
							<div className="flex justify-end gap-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => setEditing(s)}
											aria-label="Edit"
										>
											<Pencil />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Edit</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => {
												setDeleteError(null);
												setDeleting(s);
											}}
											aria-label="Delete"
										>
											<Trash2 />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Delete</TooltipContent>
								</Tooltip>
							</div>
						),
					} satisfies DataTableColumn<Supplier>,
				]
			: []),
	];

	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-sm">Suppliers</h2>
				{canEdit ? (
					<CreateButton size="sm" onClick={() => setEditing("new")}>
						Add
					</CreateButton>
				) : null}
			</div>
			<DataTable
				data={suppliers}
				columns={columns}
				getRowKey={(s) => s.id}
				searchKeys={["name", "description", "email", "mobile_number"]}
				searchPlaceholder="Search suppliers…"
				emptyMessage="No suppliers yet."
				minWidth={1400}
			/>
			{editing && (
				<SupplierDialog
					mode={editing === "new" ? "create" : "edit"}
					initial={editing === "new" ? null : editing}
					onSubmit={async (data) => {
						if (editing === "new") {
							await createSupplierAction(data);
						} else {
							await updateSupplierAction(editing.id, data);
						}
						setEditing(null);
					}}
					onClose={() => setEditing(null)}
				/>
			)}
			<ConfirmDialog
				open={!!deleting}
				onOpenChange={(o) => {
					if (!o) setDeleting(null);
				}}
				title="Delete supplier?"
				description={
					deleting
						? `"${deleting.name}" will be permanently removed.${deleteError ? ` — ${deleteError}` : ""}`
						: undefined
				}
				confirmLabel="Delete"
				pending={pending}
				onConfirm={() => {
					if (!deleting) return;
					const target = deleting;
					setDeleteError(null);
					startTransition(async () => {
						try {
							await deleteSupplierAction(target.id);
							setDeleting(null);
						} catch (err) {
							setDeleteError(
								err instanceof Error ? err.message : "Failed to delete",
							);
						}
					});
				}}
			/>
		</div>
	);
}

// ---------- Shared shells ----------

function PanelCard({
	title,
	onAdd,
	emptyMessage,
	rows,
	children,
	className,
}: {
	title: string;
	onAdd: (() => void) | null;
	emptyMessage: string;
	rows: unknown[];
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm ${className ?? ""}`}
		>
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-sm">{title}</h2>
				{onAdd ? (
					<CreateButton size="sm" onClick={onAdd}>
						Add
					</CreateButton>
				) : null}
			</div>
			{rows.length === 0 ? (
				<p className="py-6 text-center text-muted-foreground text-sm">
					{emptyMessage}
				</p>
			) : (
				<ul className="flex flex-col divide-y">{children}</ul>
			)}
		</div>
	);
}

function Row({
	left,
	right,
	sub,
	onEdit,
	onDelete,
}: {
	left: string;
	right: string;
	sub?: string;
	onEdit: (() => void) | null;
	onDelete: (() => void) | null;
}) {
	return (
		<li className="flex items-center justify-between gap-3 py-2">
			<div className="min-w-0 flex-1">
				<div className="truncate font-medium text-sm">{left}</div>
				{sub && (
					<div className="truncate text-muted-foreground text-xs">{sub}</div>
				)}
			</div>
			<div className="text-muted-foreground text-xs">{right}</div>
			{(onEdit || onDelete) && (
				<div className="flex gap-1">
					{onEdit && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={onEdit}
									aria-label="Edit"
								>
									<Pencil />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Edit</TooltipContent>
						</Tooltip>
					)}
					{onDelete && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={onDelete}
									aria-label="Delete"
								>
									<Trash2 />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					)}
				</div>
			)}
		</li>
	);
}

// ---------- Dialogs ----------

function SimpleNameDialog({
	mode,
	title,
	initial,
	onSubmit,
	onClose,
}: {
	mode: "create" | "edit";
	title: string;
	initial: { name: string };
	onSubmit: (data: { name: string }) => Promise<void>;
	onClose: () => void;
}) {
	const [name, setName] = useState(initial.name);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => setName(initial.name), [initial.name]);

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						setError(null);
						startTransition(async () => {
							try {
								await onSubmit({ name: name.trim() });
							} catch (err) {
								setError(err instanceof Error ? err.message : "Failed");
							}
						});
					}}
					className="flex flex-col gap-3"
				>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Name"
						autoFocus
					/>
					{error && <p className="text-destructive text-xs">{error}</p>}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={pending || name.trim() === ""}>
							{pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function CategoryDialog({
	mode,
	initial,
	onSubmit,
	onClose,
}: {
	mode: "create" | "edit";
	initial: { name: string; external_code: string };
	onSubmit: (data: {
		name: string;
		external_code: string | null;
	}) => Promise<void>;
	onClose: () => void;
}) {
	const [name, setName] = useState(initial.name);
	const [externalCode, setExternalCode] = useState(initial.external_code);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "New category" : "Edit category"}
					</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						setError(null);
						startTransition(async () => {
							try {
								await onSubmit({
									name: name.trim(),
									external_code:
										externalCode.trim() === "" ? null : externalCode.trim(),
								});
							} catch (err) {
								setError(err instanceof Error ? err.message : "Failed");
							}
						});
					}}
					className="flex flex-col gap-3"
				>
					<div className="flex flex-col gap-1.5">
						<label className="font-medium text-sm">Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="font-medium text-sm">External code</label>
						<Input
							value={externalCode}
							onChange={(e) => setExternalCode(e.target.value)}
							placeholder="optional"
						/>
					</div>
					{error && <p className="text-destructive text-xs">{error}</p>}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={pending || name.trim() === ""}>
							{pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

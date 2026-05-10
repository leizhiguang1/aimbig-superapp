"use client";

import { FileText, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function splitName(name: string): { base: string; ext: string } {
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return { base: name, ext: "" };
	return { base: name.slice(0, dot), ext: name.slice(dot) };
}

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	file: File | null;
	uploading: boolean;
	onConfirm: (displayName: string) => void;
};

export function UploadDocumentDialog({
	open,
	onOpenChange,
	file,
	uploading,
	onConfirm,
}: Props) {
	const [base, setBase] = useState("");
	const ext = useMemo(() => (file ? splitName(file.name).ext : ""), [file]);
	const isPdf = file?.type === "application/pdf";

	const previewUrl = useMemo(() => {
		if (!file || isPdf) return null;
		return URL.createObjectURL(file);
	}, [file, isPdf]);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	useEffect(() => {
		if (file) setBase(splitName(file.name).base);
	}, [file]);

	const displayName = `${base.trim() || "untitled"}${ext}`;
	const canSubmit = !!file && base.trim().length > 0 && !uploading;

	return (
		<FormDialog
			open={open}
			onOpenChange={uploading ? () => {} : onOpenChange}
			size="md"
			title="Upload document"
			description="Review the file and give it a name before uploading."
			footer={
				<>
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={uploading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => onConfirm(displayName)}
						disabled={!canSubmit}
					>
						{uploading ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Upload className="size-3.5" />
						)}
						{uploading ? "Uploading…" : "Upload"}
					</Button>
				</>
			}
		>
			{file ? (
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-center rounded-md border bg-muted/30 p-4">
						{previewUrl ? (
							<img
								src={previewUrl}
								alt={file.name}
								className="max-h-64 w-auto rounded object-contain"
							/>
						) : isPdf ? (
							<div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
								<FileText className="size-12 text-rose-500" />
								<span className="text-xs uppercase tracking-wide">
									PDF document
								</span>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
								<ImageIcon className="size-12" />
								<span className="text-xs">No preview</span>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="doc-display-name">Display name</Label>
						<div className="flex items-center gap-2">
							<Input
								id="doc-display-name"
								value={base}
								onChange={(e) => setBase(e.target.value)}
								placeholder="Document name"
								disabled={uploading}
								autoFocus
							/>
							{ext && (
								<span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-muted-foreground text-xs">
									{ext}
								</span>
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							This is how staff see the file in the list. Extension is kept.
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3 text-xs">
						<div className="rounded-md border bg-muted/20 px-3 py-2">
							<div className="text-muted-foreground">Size</div>
							<div className="mt-0.5 font-medium tabular-nums">
								{formatBytes(file.size)}
							</div>
						</div>
						<div className="rounded-md border bg-muted/20 px-3 py-2">
							<div className="text-muted-foreground">Type</div>
							<div className="mt-0.5 font-mono">{file.type || "—"}</div>
						</div>
					</div>
				</div>
			) : (
				<div className="py-12 text-center text-muted-foreground text-sm">
					No file selected.
				</div>
			)}
		</FormDialog>
	);
}

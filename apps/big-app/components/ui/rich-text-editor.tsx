"use client";

import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Italic,
	List,
	Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	mergeFields?: { label: string; token: string }[];
	className?: string;
	minHeight?: number;
};

const TOOLBAR_ITEMS = [
	{ cmd: "bold", icon: Bold, label: "Bold" },
	{ cmd: "italic", icon: Italic, label: "Italic" },
	{ cmd: "underline", icon: UnderlineIcon, label: "Underline" },
] as const;

export function RichTextEditor({
	value,
	onChange,
	placeholder,
	mergeFields,
	className,
	minHeight = 220,
}: Props) {
	const editor = useEditor({
		extensions: [StarterKit, Underline],
		content: value,
		immediatelyRender: false,
		onUpdate({ editor }) {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "outline-none",
			},
		},
	});

	// sync value in from outside (e.g. when a template is selected)
	useEffect(() => {
		if (!editor) return;
		if (editor.getHTML() === value) return;
		editor.commands.setContent(value);
	}, [editor, value]);

	const insertMergeField = (token: string) => {
		editor?.chain().focus().insertContent(token).run();
	};

	return (
		<div className={cn("flex flex-col rounded-md border bg-background shadow-sm", className)}>
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
				{TOOLBAR_ITEMS.map(({ cmd, icon: Icon, label }) => (
					<button
						key={cmd}
						type="button"
						onMouseDown={(e) => {
							e.preventDefault();
							if (cmd === "bold") editor?.chain().focus().toggleBold().run();
							if (cmd === "italic") editor?.chain().focus().toggleItalic().run();
							if (cmd === "underline") editor?.chain().focus().toggleUnderline().run();
						}}
						className={cn(
							"inline-flex size-7 items-center justify-center rounded text-sm transition-colors hover:bg-accent",
							cmd === "bold" && editor?.isActive("bold") && "bg-accent",
							cmd === "italic" && editor?.isActive("italic") && "bg-accent",
							cmd === "underline" && editor?.isActive("underline") && "bg-accent",
						)}
						aria-label={label}
					>
						<Icon className="size-3.5" />
					</button>
				))}

				<button
					type="button"
					onMouseDown={(e) => {
						e.preventDefault();
						editor?.chain().focus().toggleBulletList().run();
					}}
					className={cn(
						"inline-flex size-7 items-center justify-center rounded text-sm transition-colors hover:bg-accent",
						editor?.isActive("bulletList") && "bg-accent",
					)}
					aria-label="Bullet list"
				>
					<List className="size-3.5" />
				</button>

				{mergeFields && mergeFields.length > 0 && (
					<>
						<div className="mx-1.5 h-4 w-px bg-border" />
						<span className="mr-1 text-muted-foreground text-xs">Insert:</span>
						{mergeFields.map((f) => (
							<button
								key={f.token}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									insertMergeField(f.token);
								}}
								className="rounded border border-dashed border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10"
							>
								{f.label}
							</button>
						))}
					</>
				)}
			</div>

			{/* Editor area */}
			<div className="relative flex-1">
				{!editor?.getText() && placeholder && (
					<p
						className="pointer-events-none absolute left-4 top-3 text-muted-foreground text-sm"
						aria-hidden
					>
						{placeholder}
					</p>
				)}
				<EditorContent
					editor={editor}
					className="px-4 py-3 text-sm leading-relaxed [&_.ProseMirror]:outline-none"
					style={{ minHeight }}
				/>
			</div>
		</div>
	);
}

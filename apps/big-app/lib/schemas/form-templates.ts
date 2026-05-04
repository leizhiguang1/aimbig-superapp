import { z } from "zod";

export const SECTION_TYPES = ["open_text", "tnc", "signature", "checkbox", "short_answer"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
	open_text: "Open Text",
	tnc: "Terms & Conditions",
	signature: "Signature",
	checkbox: "Checkbox",
	short_answer: "Short Answer",
};

export const formTemplateSectionInputSchema = z.object({
	sort_order: z.number().int().default(0),
	section_type: z.enum(SECTION_TYPES),
	title: z.string().max(200).optional().nullable(),
	body_html: z.string().optional().nullable(),
	required: z.boolean().default(false),
});
export type FormTemplateSectionInput = z.infer<typeof formTemplateSectionInputSchema>;

export const formTemplateInputSchema = z.object({
	name: z.string().min(1).max(200),
	is_active: z.boolean().default(true),
	sections: z.array(formTemplateSectionInputSchema).default([]),
});
export type FormTemplateInput = z.infer<typeof formTemplateInputSchema>;

// A single section's response captured when a customer fills a form
export const formSectionResponseSchema = z.object({
	section_id: z.string().uuid(),
	section_type: z.enum(SECTION_TYPES),
	title: z.string().nullable(),
	response_html: z.string().nullable(),
	checked: z.boolean().optional(),
	signed: z.boolean().optional(),
});
export type FormSectionResponse = z.infer<typeof formSectionResponseSchema>;

export const formResponseInputSchema = z.object({
	customer_id: z.string().uuid(),
	appointment_id: z.string().uuid().nullable().optional(),
	form_template_id: z.string().uuid().nullable().optional(),
	form_name: z.string().min(1),
	signed_by_name: z.string().nullable().optional(),
	sections: z.array(formSectionResponseSchema).default([]),
});
export type FormResponseInput = z.infer<typeof formResponseInputSchema>;

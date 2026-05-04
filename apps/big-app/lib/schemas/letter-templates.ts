import { z } from "zod";

export const letterTemplateInputSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100),
	body_html: z.string().max(50_000),
	is_active: z.boolean().default(true),
});
export type LetterTemplateInput = z.infer<typeof letterTemplateInputSchema>;

import { z } from "zod";

export const manualTransactionItemInputSchema = z.object({
	item_type: z.enum(["service", "product"]),
	service_id: z.string().uuid().nullish(),
	inventory_item_id: z.string().uuid().nullish(),
	item_name: z.string().trim().min(1, "Item name is required").max(200),
	item_code: z.string().trim().max(80).nullish(),
	unit_price: z.coerce.number().min(0, "Price cannot be negative"),
	quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});
export type ManualTransactionItemInput = z.infer<
	typeof manualTransactionItemInputSchema
>;

export const createManualTransactionInputSchema = z.object({
	customer_id: z.string().uuid("Select a customer"),
	outlet_id: z.string().uuid("Select an outlet"),
	remarks: z
		.string()
		.trim()
		.max(500)
		.nullish()
		.transform((v) => (v && v.length > 0 ? v : null)),
	items: z
		.array(manualTransactionItemInputSchema)
		.min(1, "At least one item is required"),
});
export type CreateManualTransactionInput = z.infer<
	typeof createManualTransactionInputSchema
>;

export const cancelManualTransactionInputSchema = z.object({
	reason: z
		.string()
		.trim()
		.min(1, "Reason is required")
		.max(500, "Reason must be 500 characters or fewer"),
});
export type CancelManualTransactionInput = z.infer<
	typeof cancelManualTransactionInputSchema
>;

export const SALES_ORDER_STATUSES = [
	"draft",
	"completed",
	"cancelled",
	"void",
] as const;

export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export type SalesOrderStatusConfig = {
	label: string;
	dot: string;
	badge: string;
};

export function getSalesOrderStatusConfig(
	status: string | null | undefined,
): SalesOrderStatusConfig | null {
	if (!status) return null;
	return SALES_ORDER_STATUS_CONFIG[status as SalesOrderStatus] ?? null;
}

export const SALES_ORDER_STATUS_CONFIG: Record<
	SalesOrderStatus,
	SalesOrderStatusConfig
> = {
	draft: {
		label: "Draft",
		dot: "bg-amber-500",
		badge: "bg-amber-100 text-amber-800",
	},
	completed: {
		label: "Completed",
		dot: "bg-emerald-500",
		badge: "bg-emerald-100 text-emerald-800",
	},
	cancelled: {
		label: "Cancelled",
		dot: "bg-red-500",
		badge: "bg-red-100 text-red-800",
	},
	void: {
		label: "Void",
		dot: "bg-red-500",
		badge: "bg-red-100 text-red-800",
	},
};

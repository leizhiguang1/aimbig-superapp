import {
	APPOINTMENT_STATUS_CONFIG,
	type AppointmentStatus,
	PAYMENT_STATUS_CONFIG,
	type PaymentStatus,
} from "@/lib/constants/appointment-status";
import { getSalesOrderStatusConfig } from "@/lib/constants/sales-status";
import { cn } from "@/lib/utils";

export function AppointmentStatusBadge({
	status,
	className,
}: {
	status: AppointmentStatus;
	className?: string;
}) {
	const sc =
		APPOINTMENT_STATUS_CONFIG[status] ?? APPOINTMENT_STATUS_CONFIG.pending;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold text-[10px]",
				sc.badge,
				className,
			)}
		>
			<sc.Icon className="size-3" />
			{sc.label}
		</span>
	);
}

export function PaymentStatusBadge({
	status,
	className,
}: {
	status: PaymentStatus;
	className?: string;
}) {
	const pc = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.unpaid;
	return (
		<span
			className={cn(
				"inline-flex rounded px-2 py-0.5 font-semibold text-[10px] uppercase",
				pc.badge,
				className,
			)}
		>
			{pc.label}
		</span>
	);
}

export function SalesOrderStatusBadge({
	status,
	className,
}: {
	status: string | null | undefined;
	className?: string;
}) {
	const sc = getSalesOrderStatusConfig(status);
	if (!sc) {
		return (
			<span
				className={cn(
					"inline-flex items-center gap-1.5 text-muted-foreground text-xs",
					className,
				)}
			>
				<span className="size-1.5 rounded-full bg-muted-foreground/50" />—
			</span>
		);
	}
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-medium text-xs",
				className,
			)}
		>
			<span className={cn("size-1.5 rounded-full", sc.dot)} />
			{sc.label}
		</span>
	);
}

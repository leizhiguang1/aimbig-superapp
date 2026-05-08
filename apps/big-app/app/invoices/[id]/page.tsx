import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintableInvoice } from "@/components/sales/PrintableInvoice";
import { PrintableReceipt } from "@/components/sales/PrintableReceipt";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerContext } from "@/lib/context/server";
import { NotFoundError } from "@/lib/errors";
import { getBrand } from "@/lib/services/brands";
import { getCustomer } from "@/lib/services/customers";
import { getOutlet } from "@/lib/services/outlets";
import { getReceiptByPaymentId } from "@/lib/services/receipts";
import {
	getSalesOrder,
	listPaymentsForOrder,
	listSaleItems,
} from "@/lib/services/sales";
import { AutoPrint, PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

type Variant = "invoice" | "receipt";

export default async function InvoicePrintPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ autoPrint?: string; variant?: string }>;
}) {
	const { id } = await params;
	const { autoPrint, variant } = await searchParams;
	const shouldAutoPrint = autoPrint === "1";
	const isReceipt = variant === "receipt";

	return (
		<div className="min-h-screen bg-muted/30 print:bg-white">
			<style>{`
				@media print {
					.no-print { display: none !important; }
				}
			`}</style>

			<div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
				<div className="text-sm font-semibold">
					{isReceipt ? "Receipt" : "Invoice"}
				</div>
				<PrintButton />
			</div>

			<div className="mx-auto my-8 w-fit px-4 print:my-0 print:px-0">
				<Suspense fallback={<DocSkeleton />}>
					<DocContent
						id={id}
						variant={isReceipt ? "receipt" : "invoice"}
						autoPrint={shouldAutoPrint}
					/>
				</Suspense>
			</div>
		</div>
	);
}

async function DocContent({
	id,
	variant,
	autoPrint,
}: {
	id: string;
	variant: Variant;
	autoPrint: boolean;
}) {
	const ctx = await getServerContext();
	if (!ctx.currentUser) redirect("/login");

	if (variant === "receipt") {
		try {
			const [receipt, brand] = await Promise.all([
				getReceiptByPaymentId(ctx, id),
				getBrand(ctx).catch(() => null),
			]);
			return (
				<>
					<PrintableReceipt receipt={receipt} brand={brand} />
					<AutoPrint enabled={autoPrint} />
				</>
			);
		} catch (err) {
			if (err instanceof NotFoundError) {
				return <NotFoundCard label="Receipt" />;
			}
			throw err;
		}
	}

	try {
		const [order, items, payments] = await Promise.all([
			getSalesOrder(ctx, id),
			listSaleItems(ctx, id),
			listPaymentsForOrder(ctx, id),
		]);

		const [outlet, customer, brand] = await Promise.all([
			order.outlet ? getOutlet(ctx, order.outlet.id) : Promise.resolve(null),
			order.customer
				? getCustomer(ctx, order.customer.id).catch(() => null)
				: Promise.resolve(null),
			getBrand(ctx).catch(() => null),
		]);

		return (
			<>
				<PrintableInvoice
					order={order}
					items={items}
					payments={payments}
					outlet={outlet}
					customer={customer}
					brand={brand}
				/>
				<AutoPrint enabled={autoPrint} />
			</>
		);
	} catch (err) {
		if (err instanceof NotFoundError) {
			return <NotFoundCard label="Invoice" />;
		}
		throw err;
	}
}

function NotFoundCard({ label }: { label: string }) {
	return (
		<div className="mx-auto max-w-xl rounded-md border bg-white p-12 text-center">
			<h1 className="font-semibold text-xl">{label} not found</h1>
		</div>
	);
}

function DocSkeleton() {
	return (
		<div className="rounded-md border bg-white p-8 shadow-sm">
			<Skeleton className="mb-4 h-8 w-48" />
			<Skeleton className="mb-2 h-4 w-full" />
			<Skeleton className="mb-2 h-4 w-3/4" />
			<Skeleton className="mb-6 h-4 w-1/2" />
			<Skeleton className="h-64 w-full" />
		</div>
	);
}

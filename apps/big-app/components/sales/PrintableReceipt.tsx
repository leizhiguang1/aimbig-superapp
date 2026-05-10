import type { ReactNode } from "react";
import type { Brand } from "@/lib/services/brands";
import {
	defaultBeingPaymentOf,
	defaultCustomerName,
	type ReceiptDetail,
} from "@/lib/services/receipts";
import { publicMediaUrl } from "@/lib/services/storage";
import { money } from "@/lib/utils/money";

type Props = {
	receipt: ReceiptDetail;
	brand: Brand | null;
	customerNameOverride?: string;
	remarksOverride?: string;
	bare?: boolean;
};

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function fullName(
	first: string | null | undefined,
	last: string | null | undefined,
	salutation?: string | null,
): string {
	return [salutation, first, last]
		.filter(Boolean)
		.map((p) => String(p).trim())
		.join(" ")
		.toUpperCase();
}

function customerAddressLine(
	c: ReceiptDetail["salesOrder"]["customer"],
): string {
	if (!c) return "";
	const parts = [
		c.address1,
		c.address2,
		[c.postcode, c.city, c.state].filter(Boolean).join(" ").trim(),
		c.address_country,
	]
		.filter(Boolean)
		.map((p) => String(p).trim())
		.filter(Boolean);
	return parts.join(", ").toUpperCase();
}

function outletAddressLines(outlet: ReceiptDetail["outlet"]): string[] {
	const lines: string[] = [];
	if (outlet.address1) lines.push(outlet.address1.toUpperCase());
	if (outlet.address2) lines.push(outlet.address2.toUpperCase());
	const cityLine = [outlet.postcode, outlet.city, outlet.state]
		.filter(Boolean)
		.join(", ")
		.trim();
	if (cityLine) lines.push(`${cityLine}.`.toUpperCase());
	return lines;
}

export function PrintableReceipt({
	receipt,
	brand,
	customerNameOverride,
	remarksOverride,
	bare,
}: Props) {
	const logoSrc =
		publicMediaUrl(receipt.outlet.logo_url) ?? publicMediaUrl(brand?.logo_url);
	const showRegNumber = receipt.outlet.show_reg_number_on_invoice;
	const showTaxNumber = receipt.outlet.show_tax_number_on_invoice;
	const regName =
		receipt.outlet.company_reg_name ??
		brand?.registered_name ??
		brand?.name ??
		null;
	const regNumber =
		(showRegNumber ? receipt.outlet.company_reg_number : null) ??
		brand?.registration_number ??
		null;
	const taxNumber =
		(showTaxNumber ? receipt.outlet.tax_number : null) ?? brand?.tax_id ?? null;
	const customerName =
		customerNameOverride ??
		receipt.customer_name_override ??
		defaultCustomerName(receipt.salesOrder.customer);

	const beingPaymentOf =
		remarksOverride ??
		receipt.remarks_override ??
		defaultBeingPaymentOf(receipt.salesOrder.items);

	const consultant = receipt.salesOrder.consultant
		? fullName(
				receipt.salesOrder.consultant.first_name,
				receipt.salesOrder.consultant.last_name,
			)
		: "—";

	const servedBy = receipt.payment.processed_by
		? fullName(
				receipt.payment.processed_by.first_name,
				receipt.payment.processed_by.last_name,
			)
		: "—";

	const paymentMode =
		receipt.payment.method?.name ?? receipt.payment.payment_mode;

	const balance = receipt.salesOrder.outstanding;
	const ordinalSuffix = ordinal(receipt.payment.ordinal);

	const customerAddress = customerAddressLine(receipt.salesOrder.customer);

	const sheet = (
		<div className="receipt-sheet mx-auto flex w-[210mm] min-h-[148mm] flex-col bg-white p-[10mm] text-[11px] text-zinc-900 shadow-sm print:p-0 print:text-[10.5px] print:shadow-none">
			<div className="rounded-md bg-gradient-to-b from-sky-100/80 to-sky-50/40 px-4 py-3">
				<header className="grid grid-cols-[64px_minmax(0,1fr)_110px] items-start gap-4">
					<HeaderLogo
						src={logoSrc}
						alt={receipt.outlet.name ?? brand?.name ?? "Logo"}
					/>
					<div className="flex flex-col items-center text-center">
						<div className="font-semibold text-[14px] uppercase tracking-wide">
							{receipt.outlet.name}
						</div>
						{regName && (
							<div className="mt-0.5 font-semibold text-[11px] uppercase">
								{regName}
								{regNumber ? ` (${regNumber})` : ""}
							</div>
						)}
						<div className="mt-1 space-y-0.5 text-[10px] text-zinc-700">
							{outletAddressLines(receipt.outlet).map((line) => (
								<div key={line}>{line}</div>
							))}
							{receipt.outlet.email && (
								<div>EMAIL: {receipt.outlet.email.toUpperCase()}</div>
							)}
							{receipt.outlet.phone && <div>TEL: {receipt.outlet.phone}</div>}
						</div>
					</div>
					<div className="text-right text-[10px] text-zinc-700">
						DATE: {formatDate(receipt.payment.paid_at)}
					</div>
				</header>

				<div className="mt-3 flex items-end justify-between border-sky-200/80 border-t pt-2">
					<div className="font-semibold text-[13px] underline">
						Official Receipt
					</div>
					<div className="text-[10.5px] text-zinc-700">
						RECEIPT #: {receipt.receipt_no}
					</div>
				</div>
			</div>

			<dl className="mt-4 grid grid-cols-[140px_10px_minmax(0,1fr)] items-baseline gap-x-2 gap-y-2.5 px-2 text-[11px]">
				<DtLabel>Received From</DtLabel>
				<Colon />
				<dd>
					<div>{customerName}</div>
					{customerAddress && (
						<div className="mt-0.5 text-zinc-700">{customerAddress}</div>
					)}
				</dd>

				<DtLabel>The Sum of</DtLabel>
				<Colon />
				<dd>
					MYR {money(receipt.payment.amount)} No.{receipt.payment.ordinal}
					{ordinalSuffix} Payment. (Balance: MYR {money(balance)})
				</dd>

				<DtLabel className="self-start">Being Payment of</DtLabel>
				<Colon />
				<dd className="whitespace-pre-wrap">{beingPaymentOf}</dd>

				<DtLabel>Payment Mode</DtLabel>
				<Colon />
				<dd>{paymentMode}</dd>

				<DtLabel>Served By</DtLabel>
				<Colon />
				<dd>{servedBy}</dd>

				<DtLabel>Consultant</DtLabel>
				<Colon />
				<dd>{consultant}</dd>

				<div className="col-span-3 h-1" aria-hidden />

				<DtLabel>Terms &amp; Conditions</DtLabel>
				<Colon />
				<dd>Goods sold are not refundable.</dd>

				<div className="col-span-3 h-1" aria-hidden />

				<DtLabel>Company Registration</DtLabel>
				<Colon />
				<dd>{regNumber ?? "—"}</dd>

				<DtLabel>Tax Number</DtLabel>
				<Colon />
				<dd>{taxNumber ?? "NA"}</dd>
			</dl>
		</div>
	);

	if (bare) return sheet;

	return (
		<>
			{sheet}
			<style>{`
				@media print {
					@page { size: A5 landscape; margin: 8mm; }
					html, body { background: white !important; }
					body * { visibility: hidden !important; }
					.receipt-sheet, .receipt-sheet * { visibility: visible !important; }
					.receipt-sheet {
						position: absolute; top: 0; left: 0;
						width: 100% !important; min-height: 0 !important;
						box-shadow: none !important; margin: 0 !important; padding: 0 !important;
					}
				}
			`}</style>
		</>
	);
}

function ordinal(n: number): string {
	const v = n % 100;
	if (v >= 11 && v <= 13) return "th";
	switch (n % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}

function DtLabel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<dt
			className={`font-semibold text-zinc-800${className ? ` ${className}` : ""}`}
		>
			{children}
		</dt>
	);
}

function Colon() {
	return (
		<span className="text-zinc-500" aria-hidden>
			:
		</span>
	);
}

function HeaderLogo({ src, alt }: { src: string | null; alt: string }) {
	if (src) {
		return (
			// biome-ignore lint/performance/noImgElement: print page, native img is fine
			<img
				src={src}
				alt={alt}
				className="size-[56px] shrink-0 object-contain"
			/>
		);
	}
	return (
		<div className="flex size-[56px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-white/60 text-zinc-300">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				className="size-7"
				aria-hidden
			>
				<title>Logo placeholder</title>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<path d="m3 16 5-5 4 4 3-3 6 6" />
				<circle cx="9" cy="9" r="1.5" />
			</svg>
		</div>
	);
}

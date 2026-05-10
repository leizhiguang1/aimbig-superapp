import { Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/services/brands";
import type { CustomerWithRelations } from "@/lib/services/customers";
import type { Outlet } from "@/lib/services/outlets";
import type {
	PaymentWithProcessedBy,
	SaleItem,
	SalesOrderWithRelations,
} from "@/lib/services/sales";
import { publicMediaUrl } from "@/lib/services/storage";
import { money } from "@/lib/utils/money";

type Props = {
	order: SalesOrderWithRelations;
	items: SaleItem[];
	payments: PaymentWithProcessedBy[];
	outlet: Outlet | null;
	customer: CustomerWithRelations | null;
	brand: Brand | null;
};

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "—";
	const d = new Date(iso);
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function customerAddressLine(c: CustomerWithRelations | null): string {
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

function outletAddressLine(outlet: Outlet | null): string {
	if (!outlet) return "";
	const parts = [
		outlet.address1,
		outlet.address2,
		[outlet.postcode, outlet.city, outlet.state]
			.filter(Boolean)
			.join(" ")
			.trim(),
		outlet.country,
	]
		.filter(Boolean)
		.map((p) => String(p).trim())
		.filter(Boolean);
	return parts.join(", ").toUpperCase();
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

export function PrintableInvoice({
	order,
	items,
	payments,
	outlet,
	customer,
	brand,
}: Props) {
	const customerName = customer
		? fullName(customer.first_name, customer.last_name, customer.salutation)
		: order.customer
			? fullName(order.customer.first_name, order.customer.last_name)
			: "WALK-IN";

	const subtotal = Number(order.subtotal ?? 0);
	const discount = Number(order.discount ?? 0);
	const total = Number(order.total ?? 0);
	const amountPaid = Number(order.amount_paid ?? 0);
	const outstanding = Number(order.outstanding ?? 0);

	const latestPayment = payments[payments.length - 1] ?? null;
	const headerInvoiceNo = latestPayment?.invoice_no ?? "—";

	const tendered = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);

	const servedBy = latestPayment?.processed_by_employee
		? fullName(
				latestPayment.processed_by_employee.first_name,
				latestPayment.processed_by_employee.last_name,
			)
		: order.consultant
			? fullName(order.consultant.first_name, order.consultant.last_name)
			: "—";

	const showRegNumber = outlet?.show_reg_number_on_invoice ?? true;
	const showTaxNumber = outlet?.show_tax_number_on_invoice ?? true;

	const logoSrc =
		publicMediaUrl(outlet?.logo_url) ?? publicMediaUrl(brand?.logo_url);
	const regName =
		outlet?.company_reg_name ?? brand?.registered_name ?? brand?.name ?? null;
	const regNumber =
		(showRegNumber ? outlet?.company_reg_number : null) ??
		brand?.registration_number ??
		null;
	const taxNumber =
		(showTaxNumber ? outlet?.tax_number : null) ?? brand?.tax_id ?? null;

	const paymentTypeSummary =
		payments.length === 0
			? "—"
			: payments.length === 1
				? formatMethodLabel(payments[0])
				: payments
						.map((p) => `${formatMethodLabel(p)} (${money(p.amount)})`)
						.join(", ");

	return (
		<div className="invoice-sheet mx-auto flex w-[210mm] min-h-[297mm] flex-col bg-white p-[16mm] text-[12px] text-zinc-900 shadow-sm print:p-0 print:text-[11px] print:shadow-none">
			<div className="flex items-end gap-3">
				<div className="h-[18px] flex-1 border-zinc-500 border-b" aria-hidden />
				<div className="font-semibold text-[20px] leading-none tracking-wide">
					INVOICE
				</div>
			</div>

			<header className="flex items-start gap-8 border-zinc-400 border-b py-7">
				<HeaderLogo src={logoSrc} alt={outlet?.name ?? brand?.name ?? "Logo"} />
				<div className="grid flex-1 grid-cols-[125px_10px_minmax(0,1fr)_2.5rem_115px_10px_minmax(0,1fr)] items-baseline gap-x-2 gap-y-3">
					<InfoLabel>Customer Name</InfoLabel>
					<Colon />
					<InfoValue>{customerName}</InfoValue>
					<span aria-hidden />
					<InfoLabel>Invoice #</InfoLabel>
					<Colon />
					<InfoValue>{headerInvoiceNo}</InfoValue>

					<InfoLabel>Identification #</InfoLabel>
					<Colon />
					<InfoValue>{customer?.id_number ?? "—"}</InfoValue>
					<span aria-hidden />
					<InfoLabel>Sales Order #</InfoLabel>
					<Colon />
					<InfoValue>{order.so_number}</InfoValue>

					<InfoLabel>Membership #</InfoLabel>
					<Colon />
					<InfoValue>{customer?.code ?? "—"}</InfoValue>
					<span aria-hidden />
					<InfoLabel>Date</InfoLabel>
					<Colon />
					<InfoValue>{formatDate(order.sold_at)}</InfoValue>

					<InfoLabel>Phone #</InfoLabel>
					<Colon />
					<InfoValue>{customer?.phone ?? "—"}</InfoValue>
					<span aria-hidden />
					<InfoLabel>Served By</InfoLabel>
					<Colon />
					<InfoValue>{servedBy}</InfoValue>

					<InfoLabel>Customer Address</InfoLabel>
					<Colon />
					<InfoValue className="col-span-5 whitespace-pre-wrap">
						{customerAddressLine(customer) || "—"}
					</InfoValue>
				</div>
			</header>

			<section className="mt-6">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-zinc-300 border-y bg-zinc-50 text-left">
							<th className="py-3 pl-2 font-semibold">Description</th>
							<th className="w-[100px] py-3 font-semibold">Item Code</th>
							<th className="w-[55px] py-3 text-center font-semibold">Qty</th>
							<th className="w-[105px] py-3 text-right font-semibold">
								U/Price (MYR)
							</th>
							<th className="w-[110px] py-3 text-right font-semibold">
								Discount (MYR)
							</th>
							<th className="w-[115px] py-3 pr-2 text-right font-semibold">
								Amount (MYR)
							</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item) => {
							const qty = Number(item.quantity ?? 0);
							const unitPrice = Number(item.unit_price ?? 0);
							const itemDiscount = Number(item.discount ?? 0);
							const lineAmount = Number(item.total ?? 0);
							const grossLine = qty * unitPrice;
							const taxRate = Number(item.tax_rate_pct ?? 0);
							const taxLineAmount =
								taxRate > 0 ? ((grossLine - itemDiscount) * taxRate) / 100 : 0;
							const isFoc = lineAmount === 0 && qty > 0;
							return (
								<tr
									key={item.id}
									className="border-zinc-200 border-b align-top"
								>
									<td className="py-3 pl-2">
										<div>{item.item_name}</div>
										{isFoc && <div className="text-zinc-700">FOC</div>}
									</td>
									<td className="py-3">{item.sku ?? "—"}</td>
									<td className="py-3 text-center tabular-nums">{qty}</td>
									<td className="py-3 text-right tabular-nums">
										{money(unitPrice)}
									</td>
									<td className="py-3 text-right tabular-nums">
										{money(itemDiscount)}
									</td>
									<td className="py-3 pr-2 text-right tabular-nums">
										<div>{money(lineAmount)}</div>
										<div className="text-[10px] text-zinc-500">
											(LOCAL) ({taxRate}%): {money(taxLineAmount)}
										</div>
									</td>
								</tr>
							);
						})}
						{items.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="py-8 text-center text-zinc-500 italic"
								>
									No line items
								</td>
							</tr>
						)}
						<tr className="border-zinc-300 border-t-2">
							<td colSpan={3} className="py-3 pl-2 font-semibold">
								Sub Total (MYR)
							</td>
							<td className="py-3 text-right font-semibold tabular-nums">
								{money(subtotal)}
							</td>
							<td className="py-3 text-right font-semibold tabular-nums">
								{money(discount)}
							</td>
							<td className="py-3 pr-2 text-right font-semibold tabular-nums">
								{money(total)}
							</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section className="mt-8 flex items-center justify-between border-zinc-300 border-y py-3">
				<span className="font-semibold">Gross Total (MYR)</span>
				<span className="font-semibold tabular-nums">{money(total)}</span>
			</section>

			<section className="mt-8">
				<div className="font-semibold underline">Payment Details</div>
				<div className="mt-3 flex items-baseline justify-between">
					<span>Tendered Amount (MYR)</span>
					<span className="tabular-nums">{money(tendered)}</span>
				</div>
				<div className="mt-2 flex items-baseline justify-between gap-6">
					<span>Payment Type</span>
					<span className="text-right">{paymentTypeSummary}</span>
				</div>
				{payments.some(
					(p) =>
						p.trace_no?.trim() ||
						p.approval_code?.trim() ||
						p.reference_no?.trim(),
				) && (
					<div className="mt-2 space-y-0.5 text-[10px] text-zinc-500">
						{payments.map((p) => {
							const trace = p.trace_no?.trim();
							const approval = p.approval_code?.trim();
							const reference = p.reference_no?.trim();
							if (!(trace || approval || reference)) return null;
							return (
								<div key={p.id} className="flex flex-wrap gap-x-4">
									{payments.length > 1 && <span>{formatMethodLabel(p)}:</span>}
									{trace && <span>Trace No: {trace}</span>}
									{approval && <span>Approval Code: {approval}</span>}
									{reference && <span>Ref: {reference}</span>}
								</div>
							);
						})}
					</div>
				)}
			</section>

			<section className="mt-8">
				<div className="font-semibold underline">Payment Summary</div>
				<div className="mt-3 flex items-baseline justify-between">
					<span>Total Paid to date (MYR)</span>
					<span className="tabular-nums">{money(amountPaid)}</span>
				</div>
				<div className="mt-2 flex items-baseline justify-between">
					<span>Outstanding (MYR)</span>
					<span className="tabular-nums">{money(outstanding)}</span>
				</div>
			</section>

			<section className="mt-8">
				<div className="font-semibold underline">Terms &amp; Conditions</div>
				<div className="mt-3">Goods sold are not refundable.</div>
			</section>

			<footer className="mt-auto border-zinc-400 border-t pt-4">
				<div className="grid grid-cols-[16px_1fr] items-start gap-x-3 gap-y-2 text-[10px]">
					<MapPin className="mt-0.5 size-3.5 text-zinc-500" aria-hidden />
					<div>
						<div className="font-semibold">
							{outlet?.name?.toUpperCase() ?? ""}
							{regName ? ` ${regName.toUpperCase()}` : ""}
							{regNumber ? ` (${regNumber})` : ""}
						</div>
						<div>{outletAddressLine(outlet) || "—"}</div>
					</div>
					{outlet?.phone && (
						<>
							<Phone className="mt-0.5 size-3.5 text-zinc-500" aria-hidden />
							<div>{outlet.phone}</div>
						</>
					)}
					{outlet?.email && (
						<>
							<Mail className="mt-0.5 size-3.5 text-zinc-500" aria-hidden />
							<div>{outlet.email.toUpperCase()}</div>
						</>
					)}
					{taxNumber && (
						<>
							<span aria-hidden />
							<div className="font-semibold">Tax No.{taxNumber}</div>
						</>
					)}
				</div>
			</footer>

			<style>{`
				@media print {
					@page { size: A4; margin: 14mm; }
					html, body { background: white !important; }
					body * { visibility: hidden !important; }
					.invoice-sheet, .invoice-sheet * { visibility: visible !important; }
					.invoice-sheet {
						position: absolute; top: 0; left: 0;
						width: 100% !important; min-height: 0 !important;
						box-shadow: none !important; margin: 0 !important; padding: 0 !important;
					}
				}
			`}</style>
		</div>
	);
}

function InfoLabel({ children }: { children: ReactNode }) {
	return <span className="font-semibold">{children}</span>;
}

function Colon() {
	return (
		<span className="text-zinc-500" aria-hidden>
			:
		</span>
	);
}

function InfoValue({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <span className={className}>{children}</span>;
}

function HeaderLogo({ src, alt }: { src: string | null; alt: string }) {
	if (src) {
		return (
			// biome-ignore lint/performance/noImgElement: print page, native img is fine
			<img src={src} alt={alt} className="size-20 shrink-0 object-contain" />
		);
	}
	return (
		<div className="flex size-20 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 text-zinc-300">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				aria-hidden
				className="size-10"
			>
				<title>Logo placeholder</title>
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<path d="m3 16 5-5 4 4 3-3 6 6" />
				<circle cx="9" cy="9" r="1.5" />
			</svg>
		</div>
	);
}

function formatMethodLabel(p: PaymentWithProcessedBy): string {
	const base = p.method?.name ?? p.payment_mode;
	const meta: string[] = [];
	if (p.card_type) meta.push(p.card_type);
	if (p.bank) meta.push(p.bank);
	if (meta.length > 0) return `${base} (${meta.join(",")})`;
	return base;
}

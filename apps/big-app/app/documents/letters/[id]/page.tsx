import { redirect } from "next/navigation";
import { getServerContext } from "@/lib/context/server";
import { NotFoundError } from "@/lib/errors";
import { getBrand } from "@/lib/services/brands";
import { getCustomerDocument } from "@/lib/services/customer-documents";
import { getCustomer } from "@/lib/services/customers";
import { listOutlets } from "@/lib/services/outlets";
import { publicMediaUrl } from "@/lib/services/storage";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function LetterPrintPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const ctx = await getServerContext();
	if (!ctx.currentUser) redirect("/login");

	let doc: Awaited<ReturnType<typeof getCustomerDocument>>;
	try {
		doc = await getCustomerDocument(ctx, id);
	} catch (err) {
		if (err instanceof NotFoundError) {
			return (
				<div className="mx-auto max-w-xl p-12 text-center">
					<h1 className="font-semibold text-xl">Letter not found</h1>
				</div>
			);
		}
		throw err;
	}

	if (doc.doc_type !== "letter" || !doc.letter_body_html) {
		return (
			<div className="mx-auto max-w-xl p-12 text-center">
				<h1 className="font-semibold text-xl">This document is not a letter</h1>
			</div>
		);
	}

	const [customer, brand, outlets] = await Promise.all([
		getCustomer(ctx, doc.customer_id),
		getBrand(ctx),
		listOutlets(ctx),
	]);

	const outlet =
		outlets.find((o) => o.id === customer.home_outlet_id) ?? outlets[0];

	const logoSrc =
		publicMediaUrl(outlet?.logo_url ?? null) ??
		publicMediaUrl(brand.logo_url) ??
		null;

	const groupName = (brand.registered_name || brand.name || "").toUpperCase();
	const regNumber = brand.registration_number ?? "";

	const addressLine = outlet
		? [
				outlet.address1,
				outlet.address2,
				[outlet.postcode, outlet.city].filter(Boolean).join(" "),
				outlet.state,
				outlet.country,
			]
				.filter(Boolean)
				.join(", ")
		: "";

	const today = new Date().toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="min-h-screen bg-muted/30 print:bg-white">
			<style>{`
				@media print {
					.no-print { display: none !important; }
					@page { margin: 16mm; }
					body { background: white !important; }
				}
			`}</style>

			<div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
				<div className="text-sm">
					<span className="font-semibold">{doc.file_name.toUpperCase()}</span>
				</div>
				<PrintButton />
			</div>

			<div className="mx-auto my-8 max-w-3xl bg-white p-12 shadow-sm print:my-0 print:max-w-full print:p-0 print:shadow-none">
				{/* Letterhead */}
				<div className="flex items-start justify-between border-b pb-6">
					<div className="flex items-center gap-4">
						{logoSrc && (
							// biome-ignore lint/performance/noImgElement: print page
							<img
								src={logoSrc}
								alt="Clinic logo"
								className="size-20 object-contain"
							/>
						)}
						<div className="text-xs">
							{outlet && (
								<div className="font-bold text-sm uppercase">{outlet.name}</div>
							)}
							<div className="font-semibold">
								{groupName}
								{regNumber ? ` (${regNumber})` : ""}
							</div>
							{brand.tagline && (
								<div className="italic text-muted-foreground">{brand.tagline}</div>
							)}
							{addressLine && (
								<div className="mt-1 max-w-md text-muted-foreground">
									{addressLine}
								</div>
							)}
							{outlet && (outlet.phone || outlet.email) && (
								<div className="mt-1 text-muted-foreground">
									{outlet.phone && <>TEL: {outlet.phone}</>}
									{outlet.phone && outlet.email && " · "}
									{outlet.email && <>EMAIL: {outlet.email}</>}
								</div>
							)}
						</div>
					</div>
					<div className="text-right text-xs text-muted-foreground">
						Date: {today}
					</div>
				</div>

				{/* Letter body */}
				<div
					className="mt-8 text-sm leading-relaxed"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML saved by authenticated staff
					dangerouslySetInnerHTML={{ __html: doc.letter_body_html }}
				/>
			</div>
		</div>
	);
}

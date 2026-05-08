import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentConfigProvider } from "@/components/brand-config/AppointmentConfigProvider";
import { CustomerDetailView } from "@/components/customers/CustomerDetailView";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/auth/permissions";
import { getServerContext } from "@/lib/context/server";
import { NotFoundError } from "@/lib/errors";
import { addDays, fmtDate } from "@/lib/roster/week";
import { listLineItemsForCustomer } from "@/lib/services/appointment-line-items";
import { listCustomerTimeline } from "@/lib/services/appointments";
import { listAppointmentTags } from "@/lib/services/brand-config";
import {
	type CaseNoteWithContext,
	listCaseNotesWithContext,
} from "@/lib/services/case-notes";
import { listCustomerDocuments } from "@/lib/services/customer-documents";
import { listLetterTemplates } from "@/lib/services/letter-templates";
import { listFormTemplates } from "@/lib/services/form-templates";
import { listFormResponsesForCustomer } from "@/lib/services/form-responses";
import {
	listCustomerServiceBalances,
	listCustomerServiceRedemptions,
} from "@/lib/services/customer-services";
import { getCustomer } from "@/lib/services/customers";
import {
	listBookableEmployeesForOutlet,
	listShiftsForRange,
} from "@/lib/services/employee-shifts";
import { listEmployees } from "@/lib/services/employees";
import { listFollowUpsForCustomer } from "@/lib/services/follow-ups";
import { listMedicalCertificatesForCustomer } from "@/lib/services/medical-certificates";
import { listOutlets, listRooms } from "@/lib/services/outlets";
import { listManualTransactions } from "@/lib/services/manual-transactions";
import {
	listCancellations,
	listPayments,
	listSalesOrders,
} from "@/lib/services/sales";
import {
	getWalletByCustomer,
	listWalletTransactions,
} from "@/lib/services/wallet";
import { outletPath } from "@/lib/outlet-path";

export async function CustomerDetailContent({
	id,
	outletCode,
}: {
	id: string;
	outletCode: string;
}) {
	const ctx = await getServerContext();
	if (!(await hasPermission(ctx, "customers.view"))) notFound();
	const [
		canSeeContact,
		canSeeCaseNotes,
		canSeeManualTransactions,
		canCustomerAll,
	] = await Promise.all([
		hasPermission(ctx, "customers.customers_contact"),
		hasPermission(ctx, "clinical.case_notes"),
		hasPermission(ctx, "system.manual_transaction"),
		hasPermission(ctx, "customers.customer_transparency"),
	]);

	try {
		const customer = await getCustomer(ctx, id);
		if (
			!canCustomerAll &&
			customer.consultant_id !== ctx.currentUser?.employeeId
		) {
			return <NotFoundPanel outletCode={outletCode} />;
		}
		const homeOutletId = customer.home_outlet_id;
		const today = new Date();
		const fromStr = fmtDate(addDays(today, -1));
		const toStr = fmtDate(addDays(today, 14));
		const [
			timeline,
			lineItems,
			caseNotes,
			salesOrders,
			cancellations,
			payments,
			followUps,
			documents,
			medicalCertificates,
			outlets,
			employees,
			rosterEmployees,
			rooms,
			shifts,
			brandTags,
			wallet,
			walletTransactions,
			serviceRedemptions,
			serviceBalances,
			letterTemplates,
			formTemplates,
			formResponses,
			manualTransactions,
		] = await Promise.all([
			listCustomerTimeline(ctx, id),
			listLineItemsForCustomer(ctx, id),
			canSeeCaseNotes
				? listCaseNotesWithContext(ctx, id)
				: Promise.resolve([] as CaseNoteWithContext[]),
			listSalesOrders(ctx, { customerId: id }),
			listCancellations(ctx, { customerId: id }),
			listPayments(ctx, { customerId: id }),
			listFollowUpsForCustomer(ctx, id),
			listCustomerDocuments(ctx, id),
			listMedicalCertificatesForCustomer(ctx, id),
			listOutlets(ctx),
			listEmployees(ctx),
			listBookableEmployeesForOutlet(ctx, homeOutletId),
			listRooms(ctx, homeOutletId),
			listShiftsForRange(ctx, {
				outletId: homeOutletId,
				from: fromStr,
				to: toStr,
			}),
			listAppointmentTags(ctx),
			getWalletByCustomer(ctx, id),
			listWalletTransactions(ctx, id),
			listCustomerServiceRedemptions(ctx, id),
			listCustomerServiceBalances(ctx, id),
			listLetterTemplates(ctx, { activeOnly: true }),
			listFormTemplates(ctx, { activeOnly: true }),
			listFormResponsesForCustomer(ctx, id),
			canSeeManualTransactions
				? listManualTransactions(ctx, { customerId: id })
				: Promise.resolve([] as Awaited<ReturnType<typeof listManualTransactions>>),
		]);
		const defaultConsultantId = ctx.currentUser?.employeeId ?? null;
		const activeOutlets = outlets.filter((o) => o.is_active);
		const activeRooms = rooms.filter((r) => r.is_active);
		const activeAllEmployees = employees.filter((e) => e.is_active);
		return (
			<AppointmentConfigProvider tags={brandTags}>
				<CustomerDetailView
					customer={customer}
					timeline={timeline}
					lineItems={lineItems}
					caseNotes={caseNotes}
					salesOrders={salesOrders}
					cancellations={cancellations}
					payments={payments}
					followUps={followUps}
					documents={documents}
					medicalCertificates={medicalCertificates}
					outlets={outlets}
					employees={employees}
					defaultConsultantId={defaultConsultantId}
					wallet={wallet}
					walletTransactions={walletTransactions}
					serviceRedemptions={serviceRedemptions}
					serviceBalances={serviceBalances}
					homeOutletId={homeOutletId}
					rosterEmployees={rosterEmployees}
					rooms={activeRooms}
					shifts={shifts}
					allOutlets={activeOutlets}
					allEmployees={activeAllEmployees}
					letterTemplates={letterTemplates}
					formTemplates={formTemplates}
					formResponses={formResponses}
					manualTransactions={manualTransactions}
					canSeeContact={canSeeContact}
					canSeeCaseNotes={canSeeCaseNotes}
					canSeeManualTransactions={canSeeManualTransactions}
				/>
			</AppointmentConfigProvider>
		);
	} catch (err) {
		if (err instanceof NotFoundError) {
			return <NotFoundPanel outletCode={outletCode} />;
		}
		throw err;
	}
}

function NotFoundPanel({ outletCode }: { outletCode: string }) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-md border bg-muted/30 p-12 text-center">
			<div className="font-medium text-base">Customer not found</div>
			<div className="max-w-md text-muted-foreground text-sm">
				The customer you're looking for has been deleted, or the link is no
				longer valid.
			</div>
			<Button asChild size="sm">
				<Link href={outletPath(outletCode, "/customers")}>Back to customers</Link>
			</Button>
		</div>
	);
}

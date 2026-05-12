// Read-side assemblies — packaged for the New Sale dialog and the Sales Order
// detail view. Compose multiple service reads and apply the active-row filters
// the UI expects. Permissions stay in the action layer; this is pure data.

import type { Context } from "@/lib/context/types";
import { listCustomers } from "@/lib/services/customers";
import {
	type EmployeeWithRelations,
	listEmployees,
} from "@/lib/services/employees";
import { listSellableProducts } from "@/lib/services/inventory";
import { listOutlets } from "@/lib/services/outlets";
import { listActivePaymentMethods } from "@/lib/services/payment-methods";
import {
	getSalesOrder,
	listIncentivesForOrder,
	listPaymentsForOrder,
	listSaleItems,
	type PaymentWithProcessedBy,
	type SaleItem,
	type SaleItemIncentiveRow,
	type SalesOrderWithRelations,
} from "@/lib/services/sales";
import { listServices } from "@/lib/services/services";
import { listTaxes } from "@/lib/services/taxes";

export type NewSaleData = Awaited<ReturnType<typeof getNewSaleData>>;

export async function getNewSaleData(
	ctx: Context,
	opts: { consultantFilter: string | null },
) {
	const [
		customers,
		outlets,
		allEmployees,
		services,
		products,
		taxes,
		paymentMethods,
	] = await Promise.all([
		listCustomers(ctx, { consultantIdFilter: opts.consultantFilter }),
		listOutlets(ctx),
		listEmployees(ctx),
		listServices(ctx),
		listSellableProducts(ctx),
		listTaxes(ctx),
		listActivePaymentMethods(ctx),
	]);
	return {
		customers,
		outlets: outlets.filter((o) => o.is_active),
		employees: allEmployees.filter((e) => e.is_active),
		services: services.filter((s) => s.is_active),
		products,
		taxes,
		paymentMethods,
		currentEmployeeId: ctx.currentUser?.employeeId ?? null,
	};
}

export type SalesOrderDetail = {
	order: SalesOrderWithRelations;
	items: SaleItem[];
	payments: PaymentWithProcessedBy[];
	incentives: SaleItemIncentiveRow[];
	employees: EmployeeWithRelations[];
};

export async function getSalesOrderDetail(
	ctx: Context,
	id: string,
): Promise<SalesOrderDetail> {
	const [order, items, payments, incentives, employees] = await Promise.all([
		getSalesOrder(ctx, id),
		listSaleItems(ctx, id),
		listPaymentsForOrder(ctx, id),
		listIncentivesForOrder(ctx, id),
		listEmployees(ctx),
	]);
	return {
		order,
		items,
		payments,
		incentives,
		employees: employees.filter((e) => e.is_active),
	};
}

import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DashboardRemindersCard } from "@/components/dashboard/DashboardRemindersCard";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { LowStockCard } from "@/components/dashboard/LowStockCard";
import { OutletComparisonBarChart } from "@/components/dashboard/OutletComparisonBarChart";
import { SalesMixDonutChart } from "@/components/dashboard/SalesMixDonutChart";
import { SalesMixStackedChart } from "@/components/dashboard/SalesMixStackedChart";
import { TimeSeriesBarChart } from "@/components/dashboard/TimeSeriesBarChart";
import { WoWLineChart } from "@/components/dashboard/WoWLineChart";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getServerContext } from "@/lib/context/server";
import {
	getAppointmentsWeekOverWeek,
	getCollectionTimeSeries,
	getDashboardKpis,
	getNewCustomersWeekOverWeek,
	getOutletComparisonAppointments,
	getOutletComparisonNewCustomers,
	getOutletComparisonTransactions,
	getSalesMixDonut,
	getSalesMixTimeSeries,
	getTodayBirthdays,
	getTransactionsWeekOverWeek,
} from "@/lib/services/dashboard";
import { listRemindersForEmployee } from "@/lib/services/follow-ups";
import { listLowStockItems } from "@/lib/services/inventory";
import { listOutlets } from "@/lib/services/outlets";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ outlet: string }>;
}) {
	const ctx = await getServerContext();
	const { outlet } = await params;
	const outlets = await listOutlets(ctx);
	const activeOutletId = outlets.find((o) => o.code === outlet)?.id ?? null;

	const outletIds = outlets.map((o) => o.id);
	const outletDescs = outlets.map((o) => ({
		id: o.id,
		code: o.code,
		name: o.name,
	}));

	const [
		reminders,
		lowStock,
		kpis,
		appointmentsWoW,
		newCustomersWoW,
		transactionsWoW,
		outletAppointments,
		outletNewCustomers,
		outletTransactions,
		collectionByDay,
		collectionByMonth,
		collectionByYear,
		salesMixByDay,
		salesMixByMonth,
		salesMixByYear,
		salesMixDonut,
		birthdays,
	] = await Promise.all([
		ctx.currentUser?.employeeId
			? listRemindersForEmployee(ctx, ctx.currentUser.employeeId)
			: Promise.resolve([]),
		activeOutletId
			? listLowStockItems(ctx, activeOutletId)
			: Promise.resolve([]),
		getDashboardKpis(ctx, outletIds),
		getAppointmentsWeekOverWeek(ctx, outletIds),
		getNewCustomersWeekOverWeek(ctx, outletIds),
		getTransactionsWeekOverWeek(ctx, outletIds),
		getOutletComparisonAppointments(ctx, outletDescs),
		getOutletComparisonNewCustomers(ctx, outletDescs),
		getOutletComparisonTransactions(ctx, outletDescs),
		getCollectionTimeSeries(ctx, outletIds, "day"),
		getCollectionTimeSeries(ctx, outletIds, "month"),
		getCollectionTimeSeries(ctx, outletIds, "year"),
		getSalesMixTimeSeries(ctx, outletIds, "day"),
		getSalesMixTimeSeries(ctx, outletIds, "month"),
		getSalesMixTimeSeries(ctx, outletIds, "year"),
		getSalesMixDonut(ctx, outletIds),
		getTodayBirthdays(ctx, outletDescs),
	]);

	const today = new Date().toLocaleDateString("en-MY", {
		weekday: "long",
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground text-sm">As of {today}</p>
			</div>

			<section className="grid gap-4 lg:grid-cols-2">
				<DashboardRemindersCard reminders={reminders} />
				<LowStockCard items={lowStock} outletSlug={outlet} />
			</section>

			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<KpiTile
					label="Today's appointments"
					value={kpis.appointments.today}
					compareTo={{ value: kpis.appointments.yesterday }}
				/>
				<KpiTile
					label="New customers (today)"
					value={kpis.newCustomers.today}
					compareTo={{ value: kpis.newCustomers.yesterday }}
				/>
				<KpiTile
					label="Collection (today)"
					value={kpis.collectionMyr.today}
					valueKind="myr"
					compareTo={{ value: kpis.collectionMyr.yesterday }}
				/>
				<KpiTile
					label="Outstanding balance"
					value={kpis.outstandingMyr}
					valueKind="myr"
					hint="all open invoices"
				/>
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				<WoWLineChart
					title="All outlets' appointments"
					subtitle={
						<>
							Total appointment(s) for {appointmentsWoW.today.dayName}:{" "}
							{appointmentsWoW.today.total}
							{appointmentsWoW.today.total > 0 && (
								<>
									{" · "}
									{appointmentsWoW.today.customers} customer
									{appointmentsWoW.today.customers === 1 ? "" : "s"}
									{" · "}
									{appointmentsWoW.today.leads} lead
									{appointmentsWoW.today.leads === 1 ? "" : "s"}
								</>
							)}
						</>
					}
					data={appointmentsWoW}
				/>
				<WoWLineChart
					title="All outlets' new customers"
					subtitle={
						<>
							Total new customer(s) for {newCustomersWoW.today.dayName}:{" "}
							{newCustomersWoW.today.total}
						</>
					}
					data={newCustomersWoW}
				/>
				<WoWLineChart
					title="All outlets' transactions"
					subtitle={
						<>
							Total transaction(s) for {transactionsWoW.today.dayName}:{" "}
							{transactionsWoW.today.total}
						</>
					}
					data={transactionsWoW}
				/>
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				<OutletComparisonBarChart
					title="Appointments by outlet"
					subtitle="Yesterday vs today"
					data={outletAppointments}
				/>
				<OutletComparisonBarChart
					title="New customers by outlet"
					subtitle="Yesterday vs today"
					data={outletNewCustomers}
				/>
				<OutletComparisonBarChart
					title="Transactions by outlet"
					subtitle="Yesterday vs today"
					data={outletTransactions}
				/>
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				<TimeSeriesBarChart
					title="Collection by day"
					subtitle="Last 7 days · MYR"
					data={collectionByDay}
					valueKind="myr"
					color="var(--chart-1)"
				/>
				<TimeSeriesBarChart
					title="Collection by month"
					subtitle="Last 12 months · MYR"
					data={collectionByMonth}
					valueKind="myr"
					color="var(--chart-2)"
				/>
				<TimeSeriesBarChart
					title="Collection by year"
					subtitle="Last 5 years · MYR"
					data={collectionByYear}
					valueKind="myr"
					color="var(--chart-3)"
				/>
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				<SalesMixStackedChart
					title="Sales by day"
					subtitle="Last 7 days · MYR · stacked by sale type"
					data={salesMixByDay}
					valueKind="myr"
				/>
				<SalesMixStackedChart
					title="Sales by month"
					subtitle="Last 12 months · MYR · stacked by sale type"
					data={salesMixByMonth}
					valueKind="myr"
				/>
				<SalesMixStackedChart
					title="Sales by year"
					subtitle="Last 5 years · MYR · stacked by sale type"
					data={salesMixByYear}
					valueKind="myr"
				/>
			</section>

			<section className="grid gap-4 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Sales mix</CardTitle>
						<CardDescription>Quantity sold · last 30 days</CardDescription>
					</CardHeader>
					<CardContent>
						<SalesMixDonutChart slices={salesMixDonut} />
					</CardContent>
				</Card>
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Top 10 sellers</CardTitle>
						<CardDescription>
							Tabbed: Services · Products — coming next
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div
							className="flex items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs"
							style={{ height: 260 }}
						>
							Top sellers table placeholder — period semantics pending
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="grid gap-4 lg:grid-cols-2">
				<BirthdaysCard customers={birthdays} />
				<ChartCard
					title="Employee collection"
					description="Ranking by collection · MTD / YTD"
					hint="Attribution model pending — see docs/modules/10-dashboard.md"
				/>
			</section>
		</div>
	);
}

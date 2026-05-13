import type { Context } from "@/lib/context/types";
import { ValidationError } from "@/lib/errors";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type DayOfWeek = (typeof DAYS)[number];

export type WeekOverWeekPoint = {
	day: DayOfWeek;
	thisWeek: number | null;
	priorWeek: number;
};

export type DateRange = { start: string; end: string };

export type WoWResult = {
	points: WeekOverWeekPoint[];
	totals: { thisWeek: number; priorWeek: number };
	ranges: { thisWeek: DateRange; priorWeek: DateRange };
	today: { dayName: string; total: number };
};

export type AppointmentsWoWResult = WoWResult & {
	today: WoWResult["today"] & { customers: number; leads: number };
};

const FULL_DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

function isoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${dd}`;
}

function startOfWeek(asOf: Date): Date {
	const d = new Date(asOf);
	d.setHours(0, 0, 0, 0);
	const offset = (d.getDay() + 1) % 7;
	d.setDate(d.getDate() - offset);
	return d;
}

function addDays(d: Date, n: number): Date {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}

function dowIndex(d: Date): number {
	return (d.getDay() + 1) % 7;
}

function parseLocalDate(s: string | null | undefined): Date | null {
	if (!s) return null;
	const [y, m, d] = s.split("-").map(Number);
	if (!y || !m || !d) return null;
	return new Date(y, m - 1, d);
}

type WeekFrame = {
	thisWeekStart: Date;
	thisWeekEnd: Date;
	priorWeekStart: Date;
	ranges: { thisWeek: DateRange; priorWeek: DateRange };
};

function buildWeekFrame(asOf: Date): WeekFrame {
	const thisWeekStart = startOfWeek(asOf);
	const thisWeekEnd = addDays(thisWeekStart, 7);
	const priorWeekStart = addDays(thisWeekStart, -7);
	return {
		thisWeekStart,
		thisWeekEnd,
		priorWeekStart,
		ranges: {
			thisWeek: {
				start: isoDate(thisWeekStart),
				end: isoDate(addDays(thisWeekEnd, -1)),
			},
			priorWeek: {
				start: isoDate(priorWeekStart),
				end: isoDate(addDays(thisWeekStart, -1)),
			},
		},
	};
}

function emptyPoints(asOf: Date, thisWeekStart: Date): WeekOverWeekPoint[] {
	return DAYS.map((day, idx) => {
		const dayDate = addDays(thisWeekStart, idx);
		const isFuture = dayDate > asOf;
		return { day, thisWeek: isFuture ? null : 0, priorWeek: 0 };
	});
}

function bucketize(
	dates: Date[],
	thisWeekStart: Date,
	thisWeekEnd: Date,
): number[][] {
	const buckets: number[][] = DAYS.map(() => [0, 0]);
	for (const d of dates) {
		const idx = dowIndex(d);
		const slot = d >= thisWeekStart && d < thisWeekEnd ? 0 : 1;
		buckets[idx][slot] += 1;
	}
	return buckets;
}

function pointsFromBuckets(
	buckets: number[][],
	asOf: Date,
	thisWeekStart: Date,
): WeekOverWeekPoint[] {
	return DAYS.map((day, idx) => {
		const dayDate = addDays(thisWeekStart, idx);
		const isFuture = dayDate > asOf;
		return {
			day,
			thisWeek: isFuture ? null : buckets[idx][0],
			priorWeek: buckets[idx][1],
		};
	});
}

function totalsFrom(points: WeekOverWeekPoint[]) {
	return points.reduce(
		(acc, p) => ({
			thisWeek: acc.thisWeek + (p.thisWeek ?? 0),
			priorWeek: acc.priorWeek + p.priorWeek,
		}),
		{ thisWeek: 0, priorWeek: 0 },
	);
}

function emptyResult(asOf: Date): WoWResult {
	const frame = buildWeekFrame(asOf);
	return {
		points: emptyPoints(asOf, frame.thisWeekStart),
		totals: { thisWeek: 0, priorWeek: 0 },
		ranges: frame.ranges,
		today: { dayName: FULL_DAY_NAMES[asOf.getDay()], total: 0 },
	};
}

export async function getAppointmentsWeekOverWeek(
	ctx: Context,
	outletIds: string[],
	asOf: Date = new Date(),
): Promise<AppointmentsWoWResult> {
	const frame = buildWeekFrame(asOf);
	const dayName = FULL_DAY_NAMES[asOf.getDay()];

	if (outletIds.length === 0) {
		return {
			...emptyResult(asOf),
			today: { dayName, total: 0, customers: 0, leads: 0 },
		};
	}

	const { data, error } = await ctx.db
		.from("appointments")
		.select("start_at, customer_id, lead_name")
		.in("outlet_id", outletIds)
		.eq("is_time_block", false)
		.gte("start_at", frame.priorWeekStart.toISOString())
		.lt("start_at", frame.thisWeekEnd.toISOString());
	if (error) throw new ValidationError(error.message);

	const todayKey = isoDate(asOf);
	let todayTotal = 0;
	let todayCustomers = 0;
	let todayLeads = 0;
	const dates: Date[] = [];

	for (const row of data ?? []) {
		const ts = new Date(row.start_at);
		dates.push(ts);
		const inThisWeek = ts >= frame.thisWeekStart && ts < frame.thisWeekEnd;
		if (inThisWeek && isoDate(ts) === todayKey) {
			todayTotal += 1;
			if (row.customer_id) todayCustomers += 1;
			else todayLeads += 1;
		}
	}

	const buckets = bucketize(dates, frame.thisWeekStart, frame.thisWeekEnd);
	const points = pointsFromBuckets(buckets, asOf, frame.thisWeekStart);
	const totals = totalsFrom(points);

	return {
		points,
		totals,
		ranges: frame.ranges,
		today: {
			dayName,
			total: todayTotal,
			customers: todayCustomers,
			leads: todayLeads,
		},
	};
}

export async function getNewCustomersWeekOverWeek(
	ctx: Context,
	outletIds: string[],
	asOf: Date = new Date(),
): Promise<WoWResult> {
	const frame = buildWeekFrame(asOf);
	const dayName = FULL_DAY_NAMES[asOf.getDay()];

	if (outletIds.length === 0) return emptyResult(asOf);

	const { data, error } = await ctx.db
		.from("customers")
		.select("join_date")
		.in("home_outlet_id", outletIds)
		.gte("join_date", isoDate(frame.priorWeekStart))
		.lt("join_date", isoDate(frame.thisWeekEnd));
	if (error) throw new ValidationError(error.message);

	const dates = (data ?? [])
		.map((r) => parseLocalDate(r.join_date))
		.filter((d): d is Date => d !== null);

	const buckets = bucketize(dates, frame.thisWeekStart, frame.thisWeekEnd);
	const points = pointsFromBuckets(buckets, asOf, frame.thisWeekStart);
	const totals = totalsFrom(points);
	const todayKey = isoDate(asOf);
	const todayTotal = dates.filter((d) => isoDate(d) === todayKey).length;

	return {
		points,
		totals,
		ranges: frame.ranges,
		today: { dayName, total: todayTotal },
	};
}

export async function getTransactionsWeekOverWeek(
	ctx: Context,
	outletIds: string[],
	asOf: Date = new Date(),
): Promise<WoWResult> {
	const frame = buildWeekFrame(asOf);
	const dayName = FULL_DAY_NAMES[asOf.getDay()];

	if (outletIds.length === 0) return emptyResult(asOf);

	const { data, error } = await ctx.db
		.from("sales_orders")
		.select("sold_at")
		.in("outlet_id", outletIds)
		.neq("status", "cancelled")
		.gte("sold_at", frame.priorWeekStart.toISOString())
		.lt("sold_at", frame.thisWeekEnd.toISOString());
	if (error) throw new ValidationError(error.message);

	const dates = (data ?? []).map((r) => new Date(r.sold_at));

	const buckets = bucketize(dates, frame.thisWeekStart, frame.thisWeekEnd);
	const points = pointsFromBuckets(buckets, asOf, frame.thisWeekStart);
	const totals = totalsFrom(points);
	const todayKey = isoDate(asOf);
	const todayTotal = dates.filter((d) => isoDate(d) === todayKey).length;

	return {
		points,
		totals,
		ranges: frame.ranges,
		today: { dayName, total: todayTotal },
	};
}

// ---- KPI tiles ---------------------------------------------------------

export type DashboardKpis = {
	appointments: { today: number; yesterday: number };
	newCustomers: { today: number; yesterday: number };
	collectionMyr: { today: number; yesterday: number };
	outstandingMyr: number;
};

function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

export async function getDashboardKpis(
	ctx: Context,
	outletIds: string[],
	asOf: Date = new Date(),
): Promise<DashboardKpis> {
	const empty: DashboardKpis = {
		appointments: { today: 0, yesterday: 0 },
		newCustomers: { today: 0, yesterday: 0 },
		collectionMyr: { today: 0, yesterday: 0 },
		outstandingMyr: 0,
	};
	if (outletIds.length === 0) return empty;

	const todayStart = startOfDay(asOf);
	const tomorrowStart = addDays(todayStart, 1);
	const yesterdayStart = addDays(todayStart, -1);
	const todayKey = isoDate(todayStart);
	const yesterdayKey = isoDate(yesterdayStart);

	const [
		appointmentsToday,
		appointmentsYesterday,
		newCustomersToday,
		newCustomersYesterday,
		paymentsToday,
		paymentsYesterday,
		outstandingRows,
	] = await Promise.all([
		ctx.db
			.from("appointments")
			.select("*", { count: "exact", head: true })
			.in("outlet_id", outletIds)
			.eq("is_time_block", false)
			.gte("start_at", todayStart.toISOString())
			.lt("start_at", tomorrowStart.toISOString()),
		ctx.db
			.from("appointments")
			.select("*", { count: "exact", head: true })
			.in("outlet_id", outletIds)
			.eq("is_time_block", false)
			.gte("start_at", yesterdayStart.toISOString())
			.lt("start_at", todayStart.toISOString()),
		ctx.db
			.from("customers")
			.select("*", { count: "exact", head: true })
			.in("home_outlet_id", outletIds)
			.eq("join_date", todayKey),
		ctx.db
			.from("customers")
			.select("*", { count: "exact", head: true })
			.in("home_outlet_id", outletIds)
			.eq("join_date", yesterdayKey),
		ctx.db
			.from("payments")
			.select("amount")
			.in("outlet_id", outletIds)
			.gte("paid_at", todayStart.toISOString())
			.lt("paid_at", tomorrowStart.toISOString()),
		ctx.db
			.from("payments")
			.select("amount")
			.in("outlet_id", outletIds)
			.gte("paid_at", yesterdayStart.toISOString())
			.lt("paid_at", todayStart.toISOString()),
		ctx.db
			.from("sales_orders")
			.select("outstanding")
			.in("outlet_id", outletIds)
			.gt("outstanding", 0)
			.neq("status", "cancelled"),
	]);

	if (appointmentsToday.error) throw new ValidationError(appointmentsToday.error.message);
	if (appointmentsYesterday.error) throw new ValidationError(appointmentsYesterday.error.message);
	if (newCustomersToday.error) throw new ValidationError(newCustomersToday.error.message);
	if (newCustomersYesterday.error) throw new ValidationError(newCustomersYesterday.error.message);
	if (paymentsToday.error) throw new ValidationError(paymentsToday.error.message);
	if (paymentsYesterday.error) throw new ValidationError(paymentsYesterday.error.message);
	if (outstandingRows.error) throw new ValidationError(outstandingRows.error.message);

	const sumAmount = (rows: { amount: number }[] | null) =>
		(rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

	return {
		appointments: {
			today: appointmentsToday.count ?? 0,
			yesterday: appointmentsYesterday.count ?? 0,
		},
		newCustomers: {
			today: newCustomersToday.count ?? 0,
			yesterday: newCustomersYesterday.count ?? 0,
		},
		collectionMyr: {
			today: sumAmount(paymentsToday.data),
			yesterday: sumAmount(paymentsYesterday.data),
		},
		outstandingMyr: (outstandingRows.data ?? []).reduce(
			(s, r) => s + Number(r.outstanding ?? 0),
			0,
		),
	};
}

// ---- Outlet comparison (Yesterday vs Today) ---------------------------

export type OutletComparisonPoint = {
	outletCode: string;
	outletName: string;
	yesterday: number;
	today: number;
};

type OutletDescriptor = { id: string; code: string; name: string };

function compareOutletAggregator(
	outlets: OutletDescriptor[],
	rows: { outlet_id: string | null; ts: Date }[],
	todayStart: Date,
	tomorrowStart: Date,
	yesterdayStart: Date,
): OutletComparisonPoint[] {
	const byId = new Map<string, { yesterday: number; today: number }>();
	for (const o of outlets) byId.set(o.id, { yesterday: 0, today: 0 });
	for (const r of rows) {
		if (!r.outlet_id) continue;
		const slot = byId.get(r.outlet_id);
		if (!slot) continue;
		if (r.ts >= todayStart && r.ts < tomorrowStart) slot.today += 1;
		else if (r.ts >= yesterdayStart && r.ts < todayStart) slot.yesterday += 1;
	}
	return outlets.map((o) => ({
		outletCode: o.code,
		outletName: o.name,
		...(byId.get(o.id) ?? { yesterday: 0, today: 0 }),
	}));
}

export async function getOutletComparisonAppointments(
	ctx: Context,
	outlets: OutletDescriptor[],
	asOf: Date = new Date(),
): Promise<OutletComparisonPoint[]> {
	if (outlets.length === 0) return [];
	const todayStart = startOfDay(asOf);
	const tomorrowStart = addDays(todayStart, 1);
	const yesterdayStart = addDays(todayStart, -1);

	const { data, error } = await ctx.db
		.from("appointments")
		.select("outlet_id, start_at")
		.in(
			"outlet_id",
			outlets.map((o) => o.id),
		)
		.eq("is_time_block", false)
		.gte("start_at", yesterdayStart.toISOString())
		.lt("start_at", tomorrowStart.toISOString());
	if (error) throw new ValidationError(error.message);

	const rows = (data ?? []).map((r) => ({
		outlet_id: r.outlet_id,
		ts: new Date(r.start_at),
	}));
	return compareOutletAggregator(outlets, rows, todayStart, tomorrowStart, yesterdayStart);
}

export async function getOutletComparisonNewCustomers(
	ctx: Context,
	outlets: OutletDescriptor[],
	asOf: Date = new Date(),
): Promise<OutletComparisonPoint[]> {
	if (outlets.length === 0) return [];
	const todayStart = startOfDay(asOf);
	const yesterdayStart = addDays(todayStart, -1);

	const { data, error } = await ctx.db
		.from("customers")
		.select("home_outlet_id, join_date")
		.in(
			"home_outlet_id",
			outlets.map((o) => o.id),
		)
		.gte("join_date", isoDate(yesterdayStart))
		.lte("join_date", isoDate(todayStart));
	if (error) throw new ValidationError(error.message);

	const byId = new Map<string, { yesterday: number; today: number }>();
	for (const o of outlets) byId.set(o.id, { yesterday: 0, today: 0 });
	const todayKey = isoDate(todayStart);
	const yesterdayKey = isoDate(yesterdayStart);

	for (const r of data ?? []) {
		const slot = byId.get(r.home_outlet_id);
		if (!slot) continue;
		if (r.join_date === todayKey) slot.today += 1;
		else if (r.join_date === yesterdayKey) slot.yesterday += 1;
	}
	return outlets.map((o) => ({
		outletCode: o.code,
		outletName: o.name,
		...(byId.get(o.id) ?? { yesterday: 0, today: 0 }),
	}));
}

export async function getOutletComparisonTransactions(
	ctx: Context,
	outlets: OutletDescriptor[],
	asOf: Date = new Date(),
): Promise<OutletComparisonPoint[]> {
	if (outlets.length === 0) return [];
	const todayStart = startOfDay(asOf);
	const tomorrowStart = addDays(todayStart, 1);
	const yesterdayStart = addDays(todayStart, -1);

	const { data, error } = await ctx.db
		.from("sales_orders")
		.select("outlet_id, sold_at")
		.in(
			"outlet_id",
			outlets.map((o) => o.id),
		)
		.neq("status", "cancelled")
		.gte("sold_at", yesterdayStart.toISOString())
		.lt("sold_at", tomorrowStart.toISOString());
	if (error) throw new ValidationError(error.message);

	const rows = (data ?? []).map((r) => ({
		outlet_id: r.outlet_id,
		ts: new Date(r.sold_at),
	}));
	return compareOutletAggregator(outlets, rows, todayStart, tomorrowStart, yesterdayStart);
}

// ---- Collection time series (day / month / year) ----------------------

export type TimeSeriesPoint = { label: string; value: number };
export type TimeSeriesGranularity = "day" | "month" | "year";

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

function generateBuckets(
	granularity: TimeSeriesGranularity,
	asOf: Date,
): { label: string; key: string }[] {
	if (granularity === "day") {
		return Array.from({ length: 7 }, (_, i) => {
			const d = addDays(startOfDay(asOf), -(6 - i));
			return {
				label: DAYS[(d.getDay() + 1) % 7],
				key: isoDate(d),
			};
		});
	}
	if (granularity === "month") {
		const buckets: { label: string; key: string }[] = [];
		const start = new Date(asOf.getFullYear(), asOf.getMonth() - 11, 1);
		for (let i = 0; i < 12; i++) {
			const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
			const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			buckets.push({ label: MONTH_SHORT[d.getMonth()], key: monthKey });
		}
		return buckets;
	}
	const year = asOf.getFullYear();
	return Array.from({ length: 5 }, (_, i) => {
		const y = year - 4 + i;
		return { label: String(y), key: String(y) };
	});
}

function bucketKeyFor(date: Date, granularity: TimeSeriesGranularity): string {
	if (granularity === "day") return isoDate(date);
	if (granularity === "month") {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
	}
	return String(date.getFullYear());
}

function rangeStartFor(
	granularity: TimeSeriesGranularity,
	asOf: Date,
): Date {
	if (granularity === "day") return addDays(startOfDay(asOf), -6);
	if (granularity === "month") {
		return new Date(asOf.getFullYear(), asOf.getMonth() - 11, 1);
	}
	return new Date(asOf.getFullYear() - 4, 0, 1);
}

export async function getCollectionTimeSeries(
	ctx: Context,
	outletIds: string[],
	granularity: TimeSeriesGranularity,
	asOf: Date = new Date(),
): Promise<TimeSeriesPoint[]> {
	const buckets = generateBuckets(granularity, asOf);
	if (outletIds.length === 0) {
		return buckets.map((b) => ({ label: b.label, value: 0 }));
	}

	const start = rangeStartFor(granularity, asOf);
	const end = addDays(startOfDay(asOf), 1);

	const { data, error } = await ctx.db
		.from("payments")
		.select("amount, paid_at")
		.in("outlet_id", outletIds)
		.gte("paid_at", start.toISOString())
		.lt("paid_at", end.toISOString());
	if (error) throw new ValidationError(error.message);

	const totals = new Map<string, number>();
	for (const b of buckets) totals.set(b.key, 0);
	for (const r of data ?? []) {
		const key = bucketKeyFor(new Date(r.paid_at), granularity);
		if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + Number(r.amount));
	}

	return buckets.map((b) => ({ label: b.label, value: totals.get(b.key) ?? 0 }));
}

// ---- Sales mix stacked (day / month / year) ---------------------------

export type SalesMixPoint = { label: string } & Record<string, number | string>;

export type SalesMixSeries = {
	categories: string[];
	points: SalesMixPoint[];
};

export async function getSalesMixTimeSeries(
	ctx: Context,
	outletIds: string[],
	granularity: TimeSeriesGranularity,
	asOf: Date = new Date(),
): Promise<SalesMixSeries> {
	const buckets = generateBuckets(granularity, asOf);
	const emptySeries = (): SalesMixSeries => ({
		categories: [],
		points: buckets.map((b) => ({ label: b.label })),
	});

	if (outletIds.length === 0) return emptySeries();

	const start = rangeStartFor(granularity, asOf);
	const end = addDays(startOfDay(asOf), 1);

	const { data, error } = await ctx.db
		.from("sale_items")
		.select("item_type, total, sales_orders!inner(sold_at, outlet_id, status)")
		.eq("is_voided", false)
		.in("sales_orders.outlet_id", outletIds)
		.neq("sales_orders.status", "cancelled")
		.gte("sales_orders.sold_at", start.toISOString())
		.lt("sales_orders.sold_at", end.toISOString());
	if (error) throw new ValidationError(error.message);

	type Row = {
		item_type: string;
		total: number | null;
		sales_orders: { sold_at: string } | { sold_at: string }[] | null;
	};
	const rows = (data ?? []) as unknown as Row[];

	const categorySet = new Set<string>();
	const totalsByBucket = new Map<string, Map<string, number>>();
	for (const b of buckets) totalsByBucket.set(b.key, new Map());

	for (const r of rows) {
		if (!r.item_type) continue;
		const so = Array.isArray(r.sales_orders) ? r.sales_orders[0] : r.sales_orders;
		if (!so) continue;
		const date = new Date(so.sold_at);
		const key = bucketKeyFor(date, granularity);
		const bucket = totalsByBucket.get(key);
		if (!bucket) continue;
		categorySet.add(r.item_type);
		const amt = Number(r.total ?? 0);
		bucket.set(r.item_type, (bucket.get(r.item_type) ?? 0) + amt);
	}

	const categories = Array.from(categorySet).sort();
	const points: SalesMixPoint[] = buckets.map((b) => {
		const point: SalesMixPoint = { label: b.label };
		const bucket = totalsByBucket.get(b.key);
		for (const cat of categories) {
			point[cat] = bucket?.get(cat) ?? 0;
		}
		return point;
	});
	return { categories, points };
}

// ---- Sales mix donut (last 30 days, by quantity) ----------------------

export type DonutSlice = { key: string; label: string; value: number };

export async function getSalesMixDonut(
	ctx: Context,
	outletIds: string[],
	asOf: Date = new Date(),
	periodDays = 30,
): Promise<DonutSlice[]> {
	if (outletIds.length === 0) return [];
	const end = addDays(startOfDay(asOf), 1);
	const start = addDays(startOfDay(asOf), -(periodDays - 1));

	const { data, error } = await ctx.db
		.from("sale_items")
		.select("item_type, quantity, sales_orders!inner(sold_at, outlet_id, status)")
		.eq("is_voided", false)
		.in("sales_orders.outlet_id", outletIds)
		.neq("sales_orders.status", "cancelled")
		.gte("sales_orders.sold_at", start.toISOString())
		.lt("sales_orders.sold_at", end.toISOString());
	if (error) throw new ValidationError(error.message);

	type Row = { item_type: string; quantity: number | null };
	const totals = new Map<string, number>();
	for (const r of (data ?? []) as Row[]) {
		if (!r.item_type) continue;
		totals.set(r.item_type, (totals.get(r.item_type) ?? 0) + Number(r.quantity ?? 0));
	}
	return Array.from(totals.entries())
		.map(([key, value]) => ({
			key,
			label: humanizeCategory(key),
			value,
		}))
		.sort((a, b) => b.value - a.value);
}

function humanizeCategory(s: string): string {
	return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- Top sellers (revenue, last 30 days) -------------------------------

export type TopSellerKind = "service" | "product";

export type TopSellerRow = {
	rank: number;
	itemId: string | null;
	name: string;
	sku: string | null;
	units: number;
	revenue: number;
};

export async function getTopSellers(
	ctx: Context,
	outletIds: string[],
	kind: TopSellerKind,
	asOf: Date = new Date(),
	periodDays = 30,
	limit = 10,
): Promise<TopSellerRow[]> {
	if (outletIds.length === 0) return [];
	const end = addDays(startOfDay(asOf), 1);
	const start = addDays(startOfDay(asOf), -(periodDays - 1));

	const idColumn = kind === "service" ? "service_id" : "inventory_item_id";

	const { data, error } = await ctx.db
		.from("sale_items")
		.select(
			`id, ${idColumn}, item_name, sku, quantity, total, sales_orders!inner(sold_at, outlet_id, status)`,
		)
		.eq("is_voided", false)
		.eq("item_type", kind)
		.in("sales_orders.outlet_id", outletIds)
		.neq("sales_orders.status", "cancelled")
		.gte("sales_orders.sold_at", start.toISOString())
		.lt("sales_orders.sold_at", end.toISOString());
	if (error) throw new ValidationError(error.message);

	type Row = {
		service_id?: string | null;
		inventory_item_id?: string | null;
		item_name: string;
		sku: string | null;
		quantity: number | null;
		total: number | null;
	};

	type Agg = { itemId: string | null; name: string; sku: string | null; units: number; revenue: number };
	const buckets = new Map<string, Agg>();
	for (const r of (data ?? []) as unknown as Row[]) {
		const itemId =
			(kind === "service" ? r.service_id : r.inventory_item_id) ?? null;
		const key = itemId ?? `__${r.item_name}`;
		const existing = buckets.get(key);
		const units = Number(r.quantity ?? 0);
		const revenue = Number(r.total ?? 0);
		if (existing) {
			existing.units += units;
			existing.revenue += revenue;
		} else {
			buckets.set(key, {
				itemId,
				name: r.item_name,
				sku: r.sku,
				units,
				revenue,
			});
		}
	}

	return Array.from(buckets.values())
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, limit)
		.map((row, idx) => ({ rank: idx + 1, ...row }));
}

// ---- Today's birthdays ------------------------------------------------

export type BirthdayCustomer = {
	id: string;
	code: string;
	firstName: string;
	lastName: string | null;
	phone: string | null;
	homeOutletCode: string;
	homeOutletName: string;
};

export async function getTodayBirthdays(
	ctx: Context,
	outlets: OutletDescriptor[],
	asOf: Date = new Date(),
	limit = 50,
): Promise<BirthdayCustomer[]> {
	if (outlets.length === 0) return [];
	const month = asOf.getMonth() + 1;
	const day = asOf.getDate();

	const { data, error } = await ctx.db
		.from("customers")
		.select("id, code, first_name, last_name, phone, home_outlet_id, date_of_birth")
		.in(
			"home_outlet_id",
			outlets.map((o) => o.id),
		)
		.not("date_of_birth", "is", null)
		.limit(2000);
	if (error) throw new ValidationError(error.message);

	const outletById = new Map(outlets.map((o) => [o.id, o] as const));
	const matches: BirthdayCustomer[] = [];
	for (const c of data ?? []) {
		const dob = c.date_of_birth;
		if (!dob) continue;
		const [, m, d] = dob.split("-").map(Number);
		if (m === month && d === day) {
			const outlet = outletById.get(c.home_outlet_id);
			if (!outlet) continue;
			matches.push({
				id: c.id,
				code: c.code,
				firstName: c.first_name,
				lastName: c.last_name,
				phone: c.phone,
				homeOutletCode: outlet.code,
				homeOutletName: outlet.name,
			});
			if (matches.length >= limit) break;
		}
	}
	return matches;
}

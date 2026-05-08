# Module: Dashboard

> Status: In progress

## Overview

The Dashboard is the landing page after an employee picks an outlet
(`/o/[outlet]/dashboard`). It surfaces the workload and sales pulse for the
**brand** (across all outlets) and shows two operational, per-outlet cards
that need action — reminders and low-stock alerts.

Two kinds of panels live here:

1. **Operational cards** — actionable things one employee must do *today*
   (call this customer back, restock that item). Per-outlet or per-employee.
2. **Trend charts and summaries** — read-only situational awareness for the
   brand as a whole.

The dashboard is **pull-based**: nothing pushes notifications. Users see
fresh numbers when they load the page.

## Architecture

- **Page:** [`app/(app)/o/[outlet]/dashboard/page.tsx`](../../app/(app)/o/[outlet]/dashboard/page.tsx)
  is a React Server Component. It runs `Promise.all([…])` of service calls,
  then renders the layout. No client-side data fetching.
- **Service layer:** [`lib/services/dashboard.ts`](../../lib/services/dashboard.ts)
  is pure TypeScript (no `next/*` imports). Each fetcher returns a typed
  result shape, brand/outlet-scoped.
- **Charts:** rendered by **recharts** (`^3.8.1`), wrapped by shadcn's
  `ChartContainer` / `ChartTooltipContent` in
  [`components/ui/chart.tsx`](../../components/ui/chart.tsx). Colors come
  from the `--chart-1..5` CSS variables in
  [`app/globals.css`](../../app/globals.css), not hardcoded literals.
- **Loading state:** [`loading.tsx`](../../app/(app)/o/[outlet]/dashboard/loading.tsx)
  shows skeletons matching the section grid. Streamed with React Suspense.

## Layout (top to bottom)

| # | Section | Component(s) | Status |
|---|---|---|---|
| 1 | Reminders + Low Stock | `DashboardRemindersCard`, `LowStockCard` | ✅ Live |
| 2 | KPI tiles (4) | `KpiTile` × 4 | ✅ Live |
| 3 | WoW line charts (3) | `WoWLineChart` × 3 | ✅ Live |
| 4 | Per-outlet bars Yesterday vs Today (3) | `OutletComparisonBarChart` × 3 | ✅ Live |
| 5 | Collection by Day / Month / Year (3) | `TimeSeriesBarChart` × 3 | ✅ Live |
| 6 | Sales mix stacked Day / Month / Year (3) | `SalesMixStackedChart` × 3 | ✅ Live |
| 7 | Sales mix donut + Top 10 sellers | `SalesMixDonutChart`, *(top sellers deferred)* | partial |
| 8 | Today's birthdays + Employee collection | `BirthdaysCard`, *(employee collection deferred)* | partial |

### 1. Reminders + Low Stock (operational)

These are the only panels scoped to **one outlet** (the active outlet from
the URL) and **one employee** (the logged-in user).

**My reminders** — reads `appointment_follow_ups` where
`reminder_employee_id = current employee` and `has_reminder = true`. Pending
rows are sorted by `reminder_date`; done rows collapse under a `<details>`.
A row is resolved by ticking the circular checkbox, which calls
`setDashboardFollowUpReminderDoneAction` to flip `reminder_done`. The flow
is documented in detail elsewhere — see `lib/services/follow-ups.ts`.

**Low stock** — reads inventory rows whose `stock <= stock_alert_count` for
the active outlet. Action button links into the inventory module.

### 2. KPI tiles

Four small tiles reading "today" plus a comparison hint:

| Label | Source | Comparison hint |
|---|---|---|
| Today's appointments | `appointments` (`is_time_block = false`, today, brand outlets) | vs yesterday |
| New customers (today) | `customers.join_date = today`, `home_outlet_id IN outlets` | vs yesterday |
| Collection (today) | `SUM(payments.amount)` `paid_at::date = today` | vs yesterday |
| Outstanding | `SUM(sales_orders.outstanding)` `outstanding > 0`, `status != 'cancelled'` | total open |

Tiles render `—` when zero so empty days don't look broken.

### 3. WoW line charts

Three cards: **Appointments / New customers / Transactions** by day-of-week,
with two series (this week vs last week). All-outlets aggregated.

**Week anchor:** Saturday → Friday, matching the reference clinic's
operating week. The `startOfWeek` helper in `dashboard.ts` does
`offset = (getDay() + 1) % 7`.

**Future-day handling:** the `thisWeek` series is `null` for days after the
as-of date so the line stops at today instead of dropping to zero.
`<Line connectNulls={false}>` produces the visual stop.

**Subtitle:** shows today's total. The Appointments chart additionally
splits today into `customers` (rows with `customer_id`) vs `leads` (rows
with `customer_id IS NULL` and a `lead_name`).

**Interactivity:** clicking a legend item hides that line. State is local
component state (`useState`). Y-axis auto-rescales when only one line is
visible.

**Service:** `getAppointmentsWeekOverWeek`, `getNewCustomersWeekOverWeek`,
`getTransactionsWeekOverWeek`. All take `outletIds: string[]` and an
optional `asOf: Date` (defaults to now). They return the same shape
(`WoWResult`); appointments extends it with the customer/lead split.

**Special filters:**
- Appointments excludes time-blocks (`is_time_block = true`).
- Transactions excludes cancelled SOs (`status = 'cancelled'`).

### 4. Per-outlet bar charts (Yesterday vs Today)

Three grouped-bar charts mirroring the WoW row, but the x-axis is each
outlet (BDK / BDJ / BDS for the reference brand) and the two series are
**Yesterday** and **Today**. Useful to see which outlet is busy today
relative to the rest of the brand.

**Service:** `getOutletComparison{Appointments,NewCustomers,Transactions}`.
Returns `{ outletCode, outletName, yesterday, today }[]`.

### 5. Collection bar charts (Day / Month / Year)

Single-series bars summing `payments.amount` over rolling windows:

| Card | Window | Bucket |
|---|---|---|
| By day | last 7 calendar days | day |
| By month | last 12 calendar months | month |
| By year | last 5 calendar years | year |

**Service:** `getCollectionByDay/Month/Year`. Returns
`{ label, value }[]`. Aggregation done in TypeScript over a date-range
query (one round trip per granularity).

### 6. Sales mix stacked bars (Day / Month / Year)

Same time windows as Row 5, but stacked by `sale_items.item_type`. The
visible categories come from whatever `item_type` strings exist in the
data — the chart discovers them dynamically rather than hardcoding a list.
This avoids drift if the vocabulary expands later (per the
"no CHECK constraints that mirror enums" rule in CLAUDE.md).

**Source:** sums `sale_items.total` joined to `sales_orders.sold_at` for
the date filter. Excludes voided line items (`is_voided = true`) and
cancelled SOs.

### 7. Sales mix donut

A single donut showing **quantity sold by sale type** for the last 30 days
(brand-wide). Same source as Row 6 but `SUM(quantity)` instead of
`SUM(total)`, single bucket.

### 7b. Top 10 sellers

**Status: deferred.** Reference shows MTD / Previous Month / YTD columns
per item, tabbed Services vs Products. We have the data
(`sale_items` joined to `services` / `inventory_items`) but the period
semantics and table layout deserve a separate decision pass. Tracked as a
follow-up.

### 8. Birthdays today

Lists customers (across the brand) whose `date_of_birth` month + day match
the as-of date. Each row shows name, phone, home outlet, and a "Wish on
WhatsApp" link that opens a deep link to wa.me with a templated message.
Capped at 50 to avoid pathological lists.

### 8b. Employee collection ranking

**Status: deferred — needs an attribution decision.** Three candidate
models give different numbers:

| Model | Source | Meaning |
|---|---|---|
| Cashier | `payments.processed_by` | Who keyed the payment. Useful for a cashier audit, **wrong** for commission. |
| Consultant | `sales_orders.consultant_id` | Whose customer / whose sale. Closest to what the reference shows. |
| Per-line incentives | `sale_item_incentives` | True commission attribution; handles two employees on one SO. Right for a Commission **report**, overkill for a dashboard tile. |

Recommendation when we revisit: dashboard uses **Consultant**; a separate
Commission report uses per-line incentives.

## Data scoping rules

- **Brand scope:** all queries filter by `outlet_id IN ctx.outletIds`
  (the dashboard page hands the service every outlet the current brand
  owns). For tables that don't have `outlet_id` (e.g. `customers`,
  `appointment_follow_ups`), the equivalent column is used
  (`home_outlet_id`, or via FK chain through `customers.brand_id`).
- **Outlet drilldown:** only the operational cards (reminders, low stock)
  are scoped to the active outlet from the URL. Charts and KPIs are always
  brand-wide. There is currently no "all outlets" route — the URL is
  always `/o/<some-outlet>/dashboard`. A future enhancement could add an
  outlet filter pill above the chart sections.
- **As-of:** every fetcher accepts an optional `asOf: Date` (defaults to
  `new Date()`). Currently always passed as "now"; a `?as_of=YYYY-MM-DD`
  query param is a future enhancement for time-travel.

## Week math

```
DAYS = ['Sat','Sun','Mon','Tue','Wed','Thu','Fri']

startOfWeek(d):
  offset = (d.getDay() + 1) % 7   // Sat → 0, Fri → 6
  return d minus offset days, set to local 00:00

dowIndex(d):
  return (d.getDay() + 1) % 7     // index into DAYS
```

If the reference clinic ever switches to a Mon-anchored week, change the
helper in one place. Don't sprinkle conditional offsets through services.

## Adding a new chart

1. **Add a fetcher to `lib/services/dashboard.ts`.** Pure TS; takes `ctx`,
   `outletIds`, optional `asOf`. Returns a typed result shape.
2. **Reuse a chart primitive.** The current set:
   - `WoWLineChart` — line, two series, day-of-week x-axis, toggleable legend
   - `OutletComparisonBarChart` — grouped bars, two series per outlet
   - `TimeSeriesBarChart` — single-series bars over a time window
   - `SalesMixStackedChart` — stacked bars, dynamic categories
   - `SalesMixDonutChart` — donut, dynamic categories
3. **Wire into the page.** Replace a `<ChartCard>` placeholder with the real
   component. Run `Promise.all` for fetchers in the page header to keep the
   single round-trip shape.
4. **Update this doc.** New section under "Layout" + bump status.

## Gaps & follow-ups

- **Top 10 sellers** (Row 7b) — period definition + table layout decision.
- **Employee Collection** (Row 8b) — attribution model decision (see table
  above).
- **All-outlets route** — currently every URL pins one outlet, even though
  most charts are brand-wide. A `?o=all` param or `/dashboard` route would
  let users compare brand-wide trends without picking a specific outlet
  first.
- **Time travel** — `?as_of=YYYY-MM-DD` for retrospective views.
- **No push notifications.** Reminders are pull-only.
- **No auto-resolution.** Reminders aren't ticked when the WhatsApp message
  is actually sent via wa-crm.
- **Caching.** All fetchers run on every page load. If we get hot-path
  pressure, the simple wins are (a) `unstable_cache` with a 30s TTL on
  trend queries, or (b) a `dashboard_overview()` Postgres RPC returning
  one JSON.

## Schema notes

No new tables. The dashboard is purely a read view over existing modules:
appointments, sales (orders + items + payments), customers, inventory,
employees, follow-ups.

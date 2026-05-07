# Permissions — what's done & what's left

Status as of 2026-05-07. Phase 1 enforcement (server-action guards + page
guards via `notFound()` + sidebar/topbar UI hiding + targeted field masking
+ targeted button gating) is in place across the modules listed in the
"Done" section.

The pattern, in case the convention drifts:

- **Server actions** call `await requirePermission(ctx, "<section>.<flag>")`
  before the service call. On failure they throw `UnauthorizedError`, caught
  by `toErr()` and returned as `{ error: "Missing permission: ..." }`.
- **Pages** call `if (!(await hasPermission(ctx, "<section>.<flag>"))) notFound()`
  in the RSC. The route looks 404 instead of leaking "this exists but you
  can't see it."
- **UI hiding** in the sidebar / topbar / tables — props are computed in
  `[outlet]/layout.tsx` from `getCurrentUserPermissions(ctx)` (cached) and
  passed down. Buttons / columns / tabs render conditionally.
- **Admin escape hatch:** the SYSTEM ADMIN role has `permissions.all = true`,
  which `checkPermission()` short-circuits before per-flag checks. Login as
  `admin@gmail.com` keeps full access regardless of new gates.

Source of truth for flags: `apps/big-app/lib/schemas/role-permissions.ts`.

---

## Done

| Module | Flags actually enforced |
|---|---|
| **staff** | `employees`, `employee_listing`, `roles`, `position`, `commissions` |
| **system** | `passcode`, `reports`, `config`, `webstore`, `manual_transaction` |
| **customers** | `customers`, `view`, `update` (for create/update/delete), `customers_contact` (phone/email field masking on CustomersTable + CustomerDetailView) |
| **appointments** | `appointments` (CRUD + line items), `revert_appointment` (reverts), `lead_list_creation` |
| **sales** | `sales` (read), `create_sales` (writes), `sales_person_reallocation` (incentive replacement), `backdate_transactions` (UI hide on NewSaleDialog + CollectPaymentDialog + SO-detail PayOutstandingDialog) |
| **inventory** | `inventory` (page), `inventory_edit` (CRUD), `adjust_stock` (movements) |
| **services** | `services` |
| **roster** | `roster` (page), `roster_edit` (writes) |
| **clinical** | `case_notes` (CustomerDetailView tab visibility), `case_notes_edit` (case-note writes), `medical_certificates` (MCs + letters), `document_edit`, `document_delete` |

Sidebar nav hides for: customers, appointments, sales, inventory, services,
roster, employees, passcode, reports, config, webstore. Topbar buttons hide
for: New Sale, Manual Transaction.

---

## Easy refinements — partly done, partly remaining

### Done in the second pass

- **`customers.customers_contact`** — `CustomersTable` hides the Phone
  column + drops phone/email from `searchKeys` and search placeholder
  when off. `CustomerDetailView` hides the inline phone (collapsed
  header), expanded phone, phone2, and email rows. Server still returns
  the data — pure render gate.
- **`clinical.case_notes`** (read) — `CustomerDetailView` filters out the
  `casenotes` tab when off. (Appointment-detail tab not gated yet —
  see remaining below.)
- **`sales.backdate_transactions`** — `PaymentSection` (used in
  `NewSaleDialog` and `CollectPaymentDialog`) hides the Backdate Invoice
  toggle + date input when `canBackdate` is false. `PayOutstandingDialog`
  same. Wired through `getNewSaleDataAction` (NewSale flow), and through
  `appointment-detail-content.tsx → AppointmentDetailView →
  AppointmentActionBar` (CollectPayment flow), and through
  `sales-order-detail-content.tsx → SalesOrderDetailView` (SO-detail
  PayOutstanding flow).

### Remaining easy items

#### Contact masking — appointments side

- **Flag:** `appointments.customer_contact_email`
- **What:** hide phone / email when shown alongside appointments
- **Where to touch:**
  - `components/appointments/AppointmentCard.tsx` — the small phone line
    rendered in calendar cards (line ~270)
  - `components/appointments/AppointmentHoverCard.tsx` — the phone /
    phone2 block in the hover popover (lines ~216-226)
  - `components/appointments/column-registry.tsx` — the `phone` and
    `email` cell renderers (lines 100-119), used by the appointments
    table-list view. Could also filter at the *column-config* layer so
    these columns don't appear at all in the column picker.
- **Why deferred:** these surfaces are how staff identify "which Mr Tan
  is in front of me." Hiding contact in the calendar may break daily
  workflow. Confirm with stakeholder which surfaces really need to be
  masked vs. which are operational tools that should stay visible to all
  staff. The customer-side masking we did is the safer half.
- **Note on AppointmentDialog customer search:** the dialog's customer
  picker shows phone next to each candidate (line 1033). **Don't gate
  this** — staff need it to pick the right customer. If the user can
  open the picker at all, they can already see contact info there.

#### Case-notes tab on AppointmentDetailView

- **Flag:** `clinical.case_notes` (read)
- **What:** `CustomerDetailView` already filters its case-notes tab.
  `AppointmentDetailView` has a similar tab structure that still shows
  the case-notes section unconditionally.
- **Where to touch:** `components/appointments/AppointmentDetailView.tsx`
  — find the case-notes section/tab and gate via a `canSeeCaseNotes`
  prop. Pass from `appointment-detail-content.tsx`
  (already fetches permissions via `hasPermission(ctx, ...)`).

#### `sales.adjust_co_payment` — no UI yet

- The flag exists, but there's no co-payment override field anywhere in
  the codebase (grep for `co.payment`, `copay`, `insurance_amount`,
  `payor_amount` returns nothing in components). Add the gate in the
  same PR that ships the co-payment feature.

#### `appointments.consumable_selection` — no clear write surface

- `ConsumablesCard.tsx` is read-only. There's no separate consumable
  picker outside the service-definition flow (which is gated by
  `services.services`). If line items grow a "swap consumable" action
  later, gate that action with `appointments.consumable_selection` and
  validate `consumable_id` server-side in
  `lib/services/appointment-line-items.ts → createLineItem`.

#### `sales.backdate_transactions` — server-side enforcement

- The UI is hidden, but the server doesn't reject backdated input from a
  user without the flag. To close this:
  - In each action that accepts a transaction date
    (`collectAppointmentPaymentAction`, `collectWalkInSaleAction`,
    `recordAdditionalPaymentAction`, `revertLastPaymentAction` — wherever
    `paid_at` / `transaction_date` flows in), compare the input date to
    today (date-only, brand timezone). If different, require
    `sales.backdate_transactions`.
  - Or push it into the service layer so it's enforced regardless of
    caller.

#### Backdate not yet wired through `SalesOrderDetailDialog`

- `SalesOrderDetailDialog` is the popup variant used in 5 customer-detail
  tabs and the sales payments table. It opens `PayOutstandingDialog`
  internally without forwarding `canBackdate`, so the toggle is hidden
  there for everyone (admin included). Either:
  - Thread `canBackdate` through the dialog (medium prop drilling), or
  - Use a context provider for permission flags so deep components can
    consume directly without prop drilling.
- Low priority — admin still has the toggle in NewSale, CollectPayment,
  and the standalone SO-detail page.

#### `appointments.queue` / `appointments.appointment_approval`

- **Skip until UI exists.** No queue-display page or approval workflow
  is built yet. Add the gate in the same PR that ships the feature.

---

## Hard — design needed before coding

These look like one-line changes but aren't. They're **query-level filters**,
not UI gates. Getting them wrong silently hides legitimate data — a doctor
opens the app, sees zero appointments, and you have a stress event on your
hands.

Before touching any of these:

1. Decide what "mine" means for each entity. Different entities have
   different candidates:
   - Appointments: `employee_id` (the consultant), or `created_by_id`?
   - Customers: `consultant_employee_id`, or `home_outlet` membership?
   - Sales orders: the salesperson on the order, or the consultant on the
     underlying appointment?
2. Write a Vitest unit test on the service-layer filter so a future tweak
   can't accidentally widen it.
3. Roll out one module at a time. Use `test role` + a non-admin login to
   verify expected rows show, then move on.

### `appointments.view_all_appointments`

- Default behavior today: `listAppointmentsForRange` returns everything in
  the range for the outlet
- With this flag off: filter to rows where the actor is a participant
  (`employee_id` = current employee, or in the assignment-many table if
  multi-staff bookings exist)
- Touch: `lib/services/appointments.ts → listAppointmentsForRange`,
  `listCustomerTimeline`, possibly `getAppointmentByBookingRef` for
  detail-page access (probably keep detail open if the user has a direct
  link — but verify with stakeholder)

### `appointments.customer_transparency` / `customers.customer_transparency` / `sales.customer_transparency`

- Three separate flags, three separate filters, but the same shape: filter
  reads to customers/appointments/sales the actor is tied to
- Decide: is "tied to" the same definition across the three? Probably yes,
  but confirm
- Touch: `lib/services/customers.ts → listCustomers`, `getCustomer`;
  `lib/services/sales.ts → listSalesOrders`, `listPayments`,
  `listCancellations`. Each filter takes the current employee from `ctx`.

### `customers.customer_merging`

- **What:** ability to merge duplicate customers
- **Status:** no merge UI exists yet. Add the flag-gate in the same PR
  that ships the merge feature.

### `customers.internal_review` / `customers.review_assignment`

- No internal-review UI exists yet. Skip until built.

### `customers.revert_products`

- Today, billing reverts on the customer side use
  `appointments.revert_appointment` (see
  `cancelBillingForCustomerAction` / `revertBillingForCustomerAction` in
  `lib/actions/appointments.ts`). Decide whether those should switch to
  `customers.revert_products`, or whether the appointments flag is correct.
  Probably the latter, but worth a stakeholder check.

### Inventory sub-flags

- `inventory.purchase_orders` — no PO module yet (Phase 2). Skip.
- `inventory.returned_stock` — no returned-stock UI (Phase 2). Skip.
- `inventory.inventory_cost` — should hide cost columns / cost field on
  item form for users without the flag. Field-masking pattern, easy.
  Move to "Easy" section if you decide to do it.

### Sales sub-flags

- `sales.view_petty_cash` / `sales.edit_petty_cash` — petty-cash tab is
  already deferred (`DEFERRED_TABS` in `app/(app)/o/[outlet]/sales/page.tsx`).
  Add the gate when the tab actually ships.

### `clinical.case_notes_billing`

- The `case_notes_edit` flag we wired covers create/update/delete of case
  notes themselves. Billing-on-case-notes is a separate concern: it's about
  whether an actor can attach billable line items via the case-notes flow.
  Probably maps to a write path inside the case-note editor that calls
  `appointment-line-items.createLineItem` — that path is already gated by
  `appointments.appointments`. Decide if `case_notes_billing` should be a
  *narrower* gate (case-note-context billing only) or redundant.

### `clinical.prescriptions`

- No prescription module yet (Phase 2). Skip.

---

## Won't gate (no matching flag)

Schema doesn't define flags for these surfaces. They're left fully visible
to all authenticated users. If you later want them gated, the schema in
`lib/schemas/role-permissions.ts` has to grow first.

- Dashboard (top-level)
- Voucher
- Whatsapp group: Inbox, WhatsApp, Contacts, Automations, AI Bot,
  Knowledge Base, WA Lines
- Follow-ups (cross-cuts customer + appointment; no flag fits)
- Wallet
- Form templates / responses

---

## The big one — RLS

Server-action guards we built **don't** stop a user from opening devtools
and using `supabase.from('roles').update(...)` directly with the anon key.
Per `CLAUDE.md` rule 6, RLS is currently `for all using (true) with check (true)`
on every table — the temp permissive policy.

The privilege-escalation hole that matters most:

```js
// browser console, any logged-in user can do this today
await supabase.from('employees')
  .update({ role_id: '<SYSTEM_ADMIN_ID>' })
  .eq('id', '<their_employee_id>')
```

Closing this hole = lock down RLS on `employees` and `roles` first, then
work outward. The plan is in CLAUDE.md as "Phase 2 tightening" — done
module-by-module.

When you do this, follow the dual-policy rule (anon AND authenticated, see
the `feedback_rls_dual_policies` memory) so logged-in sessions don't go
blank.

---

## Recommended order if you pick this back up

1. **Easy refinements** (this doc, top section). One PR. Mechanical.
2. **One "mine vs all" filter** — pick `appointments.view_all_appointments`
   first, since "view only mine" is the most asked-for behavior. Spec
   what "mine" means before coding.
3. **RLS on `employees` + `roles` only** — closes the self-promotion hole.
   Two RLS policies + one `BEFORE UPDATE` trigger on `employees` to block
   `role_id` changes by non-admins.
4. **Everything else** — only when a stakeholder asks for it. The remaining
   flags exist on paper because the prototype has them, not because users
   have requested the behavior.

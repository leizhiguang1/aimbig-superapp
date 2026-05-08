# Permissions — status & next steps

Status as of 2026-05-08.

> **Read [PERMISSIONS_GLOSSARY.md](PERMISSIONS_GLOSSARY.md) before
> wiring any flag.** It captures the verbatim Aoikumo tooltips for every
> column in the role matrix and calls out where our usage has drifted
> from Aoikumo's original meaning (notably `customers.view` /
> `customers.update` — those are Google-review flags in Aoikumo, not
> customer-record CRUD).

## How to read this doc

Every flag in `apps/big-app/lib/schemas/role-permissions.ts` is listed
below with a status checkbox.

**Status legend:**

- [x] = **Done.** Server action and/or page guarded; UI hidden where
  appropriate. The flag actually controls what users can do.
- [~] = **Partial.** Some surfaces gated, others not. Notes call out
  which surfaces are still uncovered.
- [ ] = **Not done — but feature exists.** A real surface ships in the
  app and the flag is supposed to control it, but we haven't wired it
  yet. These are the actionable TODOs.
- [-] = **Skipped — no UI.** Flag exists in the schema, but the feature
  it would gate hasn't been built (Phase 2, deferred, or kumodent-style
  workflow we never imported). Wire it the same PR that ships the
  feature.

## The pattern (don't drift)

- **Server actions:** `await requirePermission(ctx, "<section>.<flag>")`
  before the service call. Failure throws `UnauthorizedError`, caught by
  `toErr()`, returned as `{ error: "Missing permission: ..." }`.
- **Pages:** `if (!(await hasPermission(ctx, "<section>.<flag>"))) notFound()`
  in the RSC. Looks 404 instead of leaking that the page exists.
- **UI hiding:** props computed in `[outlet]/layout.tsx` from
  `getCurrentUserPermissions(ctx)` (cached) and passed down. Buttons /
  columns / tabs render conditionally.
- **Admin escape hatch:** `SYSTEM ADMIN` role has `permissions.all = true`,
  short-circuited inside `checkPermission()`. Login as `admin@gmail.com`
  keeps full access regardless of new gates.
- **Client-side reads:** `<PermissionsProvider>` wraps the [outlet] layout
  and exposes `usePermission("section.flag")` to any client component.
  Use this instead of prop-drilling when a deep component needs to
  conditionally render based on a flag. Example:
  `PayOutstandingDialog` reads `sales.backdate_transactions` directly
  via the hook so the 5 callers (4 customer-detail tabs + sales
  payments table) don't have to forward the flag.

---

## Flag-by-flag status

### clinical (7)

- [x] **case_notes** — read access.
  - **Tab filter:** `CustomerDetailView` and `AppointmentDetailView`
    (via `DetailTabs`) both filter out the `casenotes` tab when off.
  - **Data leak fix (2026-05-08):** previously the page-level RSC
    always called `listCaseNotesWithContext()` and passed the result
    to the client component, so SSR HTML / React props leaked the
    notes even with the tab hidden. Now both
    `customer-detail-content.tsx` and `appointment-detail-content.tsx`
    skip the fetch when `canSeeCaseNotes` is false and pass an empty
    array. Same fix applied to `manualTransactions` on the customer
    detail page (was leaking the same way).
- [x] **case_notes_edit** — all case-note write actions gated
  server-side (`apps/big-app/lib/actions/case-notes.ts`). UI: the
  case-note editor block (textarea + Save / Update / Cancel buttons)
  is hidden in both `CustomerCaseNotesTab` and the appointment-detail
  `CaseNotesTab` when off. The HistoryPanel per-row Pin / Edit /
  Cancel / Restore note icons also hide when off — read-only viewers
  see the case-note history without any edit affordances.
- [x] **case_notes_billing** — wired 2026-05-08.
  - **UI:** the "Billing" tab on `AppointmentDetail` is hidden when off.
    `DetailTabs` filters it out alongside the case-notes tab. Read-only
    summaries (BookingInfoCard, AppointmentServicesList,
    HandsOnIncentivesCard, HistoryPanel, hover-card) stay visible —
    Aoikumo's flag is specifically the "edit items in the billing list"
    action, not visibility of past line items.
  - **Server:** the four line-item CRUD actions in `appointments.ts`
    (`createLineItemAction`, `createLineItemsBulkAction`,
    `updateLineItemAction`, `deleteLineItemAction`) switched from
    `appointments.appointments` to `clinical.case_notes_billing`.
    Incentive create/delete and `saveAllocationsForAppointmentAction`
    stay on `appointments.appointments` (they cover the hands-on
    attribution + payment-allocation flows, distinct from billing).
  - **Cancel/revert** stays on `appointments.revert_appointment` (more
    specific permission).
- [x] **medical_certificates** — verified 2026-05-08 (clinical sweep).
  Server: MC create/update/cancel (`medical-certificates.ts`) + customer
  letter create/update (`customer-documents.ts`) all gated. UI:
  - `CustomerMedicalCertificatesTab` — `+` New MC button hidden,
    Edit/Cancel actions column hidden when `canManageMc` off
  - `CustomerCaseNotesTab` toolbar — MC icon hidden
  - `AppointmentDetail` `CaseNotesTab` toolbar — same icon hidden
  - `CustomerDocumentsPanel` — Letters action button hidden
    (`canWriteLetter` shares the MC flag)
  - **MC tab itself stays visible** — Aoikumo's tooltip confirms the
    flag is "ADD MC & Letters" (write only), so read access is
    implicit and the existing-MC list is fine to show.
- [-] **prescriptions** — no prescription module yet (Phase 2). The
  Customer Detail "Prescriptions" tab exists but renders a
  `PlaceholderTab`. Aoikumo's flag is "ADD Prescriptions" (write),
  not "view prescriptions" — read access is implicit, so the
  placeholder being visible is fine. Wire write actions + the
  add-button visibility when the module ships.
- [x] **document_edit** — verified 2026-05-08 (clinical sweep).
  Server: `customer-documents.ts` (`requestUploadUrl`, `createDoc`),
  `form-responses.ts` (`createFormResponse`), `storage.ts` (per-entity
  map covers customer paths). UI: `CustomerDocumentsPanel` — **Files**
  (upload) and **Forms** (consent) action buttons hide when
  `canEditDocument` off.
- [x] **document_delete** — verified 2026-05-08. Server:
  `deleteCustomerDocumentAction`, `deleteFormResponseAction`,
  `deleteMediaObjectAction` (for relevant entities) all gated. UI: the
  per-row Delete column in `CustomerDocumentsPanel` hides when
  `canDeleteDocument` off.

### appointments (9)

- [x] **appointments** — `/appointments` page + detail page +
  CRUD/line-item actions gated. Sidebar nav hides when off.
- [x] **customer_transparency** — wired 2026-05-08. **Filters the
  customer search in the New Appointment dialog**, per Aoikumo's
  tooltip: "When checked, users within this role will be able to
  create appointments for any customer. When unchecked, users within
  this role will be able to create appointments only for customers
  tied to them." Implementation:
  - `listCustomers(ctx, { consultantIdFilter })` accepts an optional
    employee filter; both appointments-content and
    appointment-detail-content compute it from
    `appointments.customer_transparency` and pass through.
  - **Not a list filter** — that's `view_all_appointments` below.
  - Server-side: `createAppointmentAction` rejects when the chosen
    `customer_id` doesn't belong to the actor (consultant_id mismatch)
    and the actor lacks the flag. Stops devtools-driven bypass.
- [-] **consumable_selection** — no separate write surface beyond
  service-definition (already covered by `services.services`). Add the
  gate when "swap consumable on a line item" feature ships.
- [x] **view_all_appointments** — wired 2026-05-08. List filter on
  `listAppointmentsForRange` — when off, restricted to
  `appointment.employee_id = ctx.currentUser.employeeId`.
  - Service signature gained an optional `employeeIdFilter`; the
    appointments-content RSC computes it from this flag.
  - Detail page `/appointments/[ref]` returns NotFoundPanel when the
    flag is off and the appointment's `employee_id` doesn't match the
    actor — closes the URL-typing leak.
- [x] **lead_list_creation** — `convertLeadToCustomerAction` gated
  server-side. UI: the "Register to Customer" green button on
  appointment detail's `CustomerCard` (visible when the appointment is
  a lead) hides when off. Same flag also gates the in-dialog
  Register button inside `AppointmentDialog`.
- [x] **revert_appointment** — `revertCompletedAppointmentAction` and
  the four billing-revert actions (`cancelBilling*`, `revertBilling*`)
  gated server-side. UI: the "Revert to pending" icon button on
  `AppointmentActionBar` hides when off. The HistoryPanel per-row
  "Cancel billing" / "Restore billing" icons also hide when off.
- [-] **queue** — no queue-display page yet
- [-] **appointment_approval** — no approval workflow yet
- [x] **customer_contact_email** — appointment-side contact masking.
  All three calendar surfaces gated via `usePermission()` from
  `PermissionsProvider`:
  - `AppointmentCard.tsx` — phone line under each calendar card
  - `AppointmentHoverCard.tsx` — phone + phone2 in hover popover
  - `column-registry.tsx` — `phone` and `email` cell renderers (now
    `<PhoneCell>` and `<EmailCell>` components) in the appointment list
    view
  - **Note:** `AppointmentDialog`'s customer search picker
    (intentionally NOT gated) — staff need phone to pick the right
    customer when booking.
  - **Operational note:** when assigning roles, ensure front-desk /
    doctor / receptionist roles get this flag ON, otherwise calendar
    cards will lose phone numbers and staff will struggle to identify
    customers at a glance.

### customers (9)

- [x] **customers** — `/customers` page + create action gated. Sidebar
  hides when off. **Note (2026-05-07 fix):** sidebar now requires this
  master flag specifically; `customers.view` alone (used for opening
  individual customer URLs from appointments etc.) no longer shows the
  nav, since clicking it would 404.
- [x] **view** — `/customers/[id]` detail page gated
- [x] **update** — update/delete actions gated. Edit/Delete column
  hidden in `CustomersTable` when off.
- [-] **internal_review** — no internal-review UI yet
- [-] **review_assignment** — no review-assignment UI yet
- [x] **customer_transparency** — wired 2026-05-08. Aoikumo: "When
  checked, users within this role will be able to view all customer
  information. When unchecked, users within this role will only be
  able to view customers tied to them."
  - **Listing:** `customers-content.tsx` passes
    `consultantIdFilter = ctx.employeeId` to `listCustomers` when off.
  - **Detail page:** `customer-detail-content.tsx` returns the
    NotFoundPanel when off and the customer's `consultant_id` doesn't
    match the actor — closes URL-typing leak.
  - **Server-side enforcement:** `updateCustomerAction` and
    `deleteCustomerAction` reject when off and the target customer
    isn't tied to the actor (`assertCustomerTiedToActor` helper).
    `createCustomerAction` rejects when off if the form submits a
    `consultant_id` that isn't the actor.
- [-] **customer_merging** — no merge UI yet
- [-] **revert_products** — overlaps with `appointments.revert_appointment`.
  Today, customer-side billing reverts (`cancelBillingForCustomerAction`,
  `revertBillingForCustomerAction`) use the appointments flag. Decide
  whether they should switch to `customers.revert_products`. Probably
  the appointments flag is correct — confirm with stakeholder.
- [x] **customers_contact** — phone column hidden in `CustomersTable`,
  search keys collapse to non-contact fields, phone/phone2/email rows
  hidden in `CustomerDetailView` (collapsed and expanded). Server
  always returns the data — pure render gate.

### sales (8)

- [x] **sales** — `/sales` + `/sales/[id]` pages gated. Sidebar hides
  when off. **Note (2026-05-07 fix):** sidebar now requires this master
  flag specifically; `sales.create_sales` alone only enables the topbar
  New Sale button, not the listing nav.
- [x] **customer_transparency** — wired 2026-05-08. Aoikumo: "When
  checked, users within this role will be able to create and view
  sales of all customers. When unchecked, users within this role will
  be able to create and view sales, only for customers tied to them."
  - **Listing:** `sales-content.tsx` passes
    `customerConsultantIdFilter = ctx.employeeId` to `listSalesOrders`
    when off. Walk-in sales (no customer) are excluded from restricted
    views by definition.
  - **Detail page:** `sales-order-detail-content.tsx` returns
    `notFound` when off and the order's customer's `consultant_id`
    doesn't match the actor.
  - **Server-side:** `collectWalkInSaleAction` rejects when off and
    the chosen `customer_id` isn't tied to the actor.
    `getNewSaleDataAction` filters the customer picker the same way.
    `collectAppointmentPaymentAction` doesn't need a separate check —
    it inherits the appointment's customer, which is already gated by
    `appointments.customer_transparency` at the booking step.
- [x] **create_sales** — all payment + sale-creation actions gated
  server-side (`collectAppointmentPaymentAction`, `collectWalkInSaleAction`,
  `voidSalesOrderAction`, `issueRefundAction`,
  `revertLastPaymentAction`, `recordAdditionalPaymentAction`,
  `updatePaymentMethodAction`, `updatePaymentAllocationsAction`,
  `writeOffOutstandingAction`, plus the appointment-side payment
  shortcuts). UI: on `SalesOrderDetailView` the **Record payment**,
  **Write off**, **Reallocate payments**, **Void**, **Change payment
  method**, and **Revert last payment** buttons all hide when off.
  Topbar **New Sale** button also already hidden.
- [-] **adjust_co_payment** — no co-payment override UI exists yet
  (grep returns nothing for `co.payment` / `copay` / `insurance_amount`
  in components). Add the gate when the feature ships.
- [x] **sales_person_reallocation** — `replaceSaleItemIncentivesAction`
  gated server-side. UI: the "Set allocation" / employee-pill button on
  each sale item row in `SalesOrderDetailView` is disabled (greys out)
  when off.
- [x] **backdate_transactions** — UI hidden in `PaymentSection` (used by
  `NewSaleDialog` and `CollectPaymentDialog`) and `PayOutstandingDialog`
  on the standalone SO-detail page. The popup-variant `SalesOrderDetailDialog`
  + 5 callers now read the flag from `PermissionsProvider` (no prop
  drilling needed). Server-side: actions
  `collectAppointmentPaymentAction` and `collectWalkInSaleAction` reject
  when `input.sold_at` is set and the actor lacks the flag, blocking
  devtools/replay attacks. (`recordAdditionalPaymentAction` doesn't
  accept a backdate field, so no check needed there.)
- [-] **view_petty_cash** — petty-cash tab deferred
  (`DEFERRED_TABS` in `app/(app)/o/[outlet]/sales/page.tsx`)
- [-] **edit_petty_cash** — same as above

### roster (2)

- [x] **roster** — `/roster` page gated
- [x] **roster_edit** — `createShiftAction`, `updateShiftAction`,
  `deleteShiftAction` gated server-side. UI: `RosterGrid` cells become
  read-only when off — empty cells render as "—" (no Add button), shifts
  display the time without a clickable handler. Read-only viewers can
  see the schedule but can't open the ShiftDialog.

### services (1)

- [x] **services** — `/services` page + service/category CRUD gated

### inventory (6)

- [x] **inventory** — `/inventory` (and all sub-pages, gated at
  layout) gated
- [-] **purchase_orders** — no PO module yet (Phase 2)
- [-] **returned_stock** — no returned-stock UI yet (Phase 2)
- [x] **inventory_edit** — items + UoM + Brand + Category + Supplier
  CRUD gated server-side. UI fully gated:
  - `/inventory`: **Add Item** button + per-row Edit/Delete column hide
    when off
  - `/inventory/options`: Brands / Categories / Suppliers panels each
    hide their **Add** button + per-row Edit/Delete actions when off
  - `/inventory/uom`: UoM List **Add** button + per-row Edit/Delete
    actions hide when off
- [x] **inventory_cost** — `ItemForm` hides the Cost Price field +
  per-outlet cost column (header + input cell) when off. Wired through
  `inventory-content.tsx → AddItemButton + ItemsTable → ItemFormDialog`.
  `ItemsTable` itself has no cost column today; nothing to hide there.
  `StockDetailsDialog` doesn't display cost, so no change needed.
- [x] **adjust_stock** — `recordStockMovementAction` gated server-side.
  UI: the "Adjust stock" `+` icon in `StockDetailsDialog` hides when off.

### staff (5)

- [x] **employees** — employee CRUD + reset-credentials actions gated
- [x] **roles** — role CRUD + `/employees/roles` page gated
- [x] **position** — position CRUD + `/employees/positions` page gated
- [x] **commissions** — `/employees/commission` page gated (placeholder)
- [x] **employee_listing** — `/employees` listing page gated. Edit/Reset/
  Delete actions column on `EmployeesTable` hides when `staff.employees`
  off. **Note (2026-05-07 fix):** if a user has another staff sub-flag
  (e.g. `staff.roles`) but NOT `staff.employee_listing`, `/employees`
  redirects to the first sub-page they CAN see (`roles` → `positions` →
  `commission`) instead of 404'ing. The sidebar nav also no longer
  surfaces for a write-only `staff.employees` flag without one of the
  page-gating flags.

### system (5)

- [x] **passcode** — `/passcode` page + create/delete actions gated
- [x] **reports** — `/reports` page gated (placeholder)
- [x] **config** — `/config/*` (gated at layout) + all config write
  actions gated (brand-config, brand-settings, billing-settings, outlets,
  rooms, payment-methods, taxes, letter-templates)
- [x] **manual_transaction** — manual-transaction actions gated, topbar
  button hidden when off, Manual Transactions tab on Customer Detail
  hidden when off (was previously visible to anyone who could see the
  customer record).
- [x] **webstore** — `/webstore` page gated (placeholder)

---

## Surfaces with no flag (won't gate without schema growth)

These nav items / surfaces have **no matching permission** in
`role-permissions.ts`. They're left visible to all authenticated users.
If they ever need gating, the schema has to grow first.

- [ ] **Dashboard** — top-level. Per-widget gating would need a finer
  schema.
- [ ] **Voucher** — no flag exists. Probably belongs in `sales` section
  if it ever gets one.
- [ ] **WhatsApp group** (Inbox / WhatsApp / Contacts / Automations /
  AI Bot / Knowledge Base / WA Lines) — messaging stack lives in wa-crm,
  no flags in our schema.
- [ ] **Wallet** — no flag. Reads display under customer detail.

---

## Action-layer orphans (audit 2026-05-08)

Actions that ship today but skip `requirePermission`. Anyone authenticated
can call them via the form-action wire. These are real holes, not
"feature not built yet" entries.

- [x] **`lib/actions/follow-ups.ts`** — **Done 2026-05-08.** All 11
  exports gated with `appointments.appointments` (appointment-scoped,
  customer-scoped, and dashboard variants alike). Follow-ups are
  appointment-bound data; one consistent gate keeps the model simple.
- [x] **`lib/actions/form-templates.ts`** — **Done 2026-05-08.** All
  three (`create / update / delete`) gated with `system.config`. They
  manage e-document templates under `/config/e-documents`.
- [x] **`lib/actions/form-responses.ts`** — **Done 2026-05-08.**
  `createFormResponseAction` gated with `clinical.document_edit`,
  `deleteFormResponseAction` with `clinical.document_delete` — same
  gates as `customer-documents.ts`.
- [x] **`lib/actions/storage.ts`** — **Done 2026-05-08.** Per-entity
  gate via the `ENTITY_PERMISSION` map in the action file:
  `employees → staff.employees`, `customers → customers.update`,
  `services → services.services`, `outlets/brands → system.config`,
  `products → inventory.inventory_edit`. `requestMediaUploadUrlAction`
  resolves from `args.entity`; `deleteMediaObjectAction` parses the
  path's first segment and falls back to a `ValidationError` on an
  unrecognized prefix.
- [x] **`lib/actions/receipts.ts`** — **Done 2026-05-08.**
  `saveReceiptAction` gated with `sales.create_sales`.
  `loadReceiptForPaymentAction` is read-only and stays open behind
  login.
- [x] **`lib/actions/brands.ts`** — **Done 2026-05-08.**
  `updateBrandAction` (tenant-side brand settings) gated with
  `system.config`.
- [-] **`lib/actions/admin-brands.ts`** — uses `assertPlatformAdmin(ctx)`
  instead of `requirePermission`. That is correct (these are apex-only
  platform-admin actions, not employee-permission actions) — listed
  here only so the next audit doesn't flag it as missing.

---

## The big remaining hole — RLS

**Server-action guards we built do NOT stop a user from opening devtools
and using the Supabase anon key directly.** Per
[CLAUDE.md](../CLAUDE.md) rule 6, RLS is currently
`for all using (true) with check (true)` on every table.

Privilege escalation that matters:

```js
// any logged-in user, browser console
await supabase.from('employees')
  .update({ role_id: '<SYSTEM_ADMIN_ID>' })
  .eq('id', '<their_employee_id>')
```

- [ ] **RLS on `employees` + `roles` — ROLLED BACK (2026-05-07)** —
  triggers were applied then removed the same day. Reason: the
  triggers fired against existing deployed code that didn't have the
  new action-layer `requirePermission()` gate, so users whose roles
  historically managed employees but didn't have `staff.employees: true`
  set were getting `Permission denied` on legitimate operations.
  **To re-apply safely:**
  1. Deploy the new client + action code first (so action layer gates
     mutations *before* the trigger sees them — duplicate check)
  2. Audit existing roles: any role that should manage employees needs
     `staff.employees: true`; any role that should manage roles needs
     `staff.roles: true`. Seed via SQL.
  3. Then re-apply the triggers (the migration body is preserved in
     the migrations history under `guard_employee_role_change_and_role_permissions`
     and `guard_employee_insert`).
  - In the meantime, the privilege-escalation hole stays open (a user
    can `supabase.from('employees').update({ role_id: ADMIN }).eq(mine)`
    from DevTools). The action-layer gate stops normal use; only
    deliberate console-driven attacks bypass it.
  - `trg_guard_employee_role_change` (`employees` BEFORE UPDATE): if
    `role_id` actually changes and the caller (`auth.uid()`) lacks
    `all` or `staff.employees`, raise `42501`. Service-role callers
    (auth.uid() null) are exempt.
  - `trg_guard_employee_insert` (`employees` BEFORE INSERT): same
    permission gate. Stops a user from inserting a fresh row with
    their own `auth_user_id` and `role_id = admin`.
  - `trg_guard_roles_mutation` (`roles` BEFORE INSERT/UPDATE/DELETE):
    requires `all` or `staff.roles`. UPDATE has a no-op fast-path:
    only enforces when `permissions` or `is_active` changes.
  - **What this blocks:** a logged-in user opening DevTools and
    running `supabase.from('employees').update({ role_id: ADMIN }).eq(...)`
    or `supabase.from('roles').update({ permissions: { all: true }}).eq(...)`
    is now rejected with `Permission denied: ...` errcode 42501.
  - **What this does NOT do:** general per-table RLS tightening. Any
    other table is still `for all using (true)`. That's the next
    module-by-module sweep.
- [ ] **RLS on the rest** — module by module, in the same PR that
  needs it.

---

## How to proceed — recommended order

Pick from the top down. Each item is a discrete PR.

1. ~~**Easy mop-up: appointment-side `clinical.case_notes` tab gating.**~~
   **Done 2026-05-07** — gated via `DetailTabs` `canSeeCaseNotes` prop.

2. ~~**Easy mop-up: `inventory.inventory_cost` field masking.**~~
   **Done 2026-05-07** — Cost Price field + per-outlet cost column hidden
   in `ItemForm`.

3. ~~**Server-side `sales.backdate_transactions` enforcement.**~~
   **Done 2026-05-07** — `collectAppointmentPaymentAction` and
   `collectWalkInSaleAction` reject when `input.sold_at` is set and the
   actor lacks the flag. Note: the check lives in the action layer, not
   the service, because services are framework-pure (can't import
   `permissions.ts` which depends on `react.cache`).

4. ~~**Stakeholder call — appointment-side contact masking.**~~
   **Done 2026-05-07** — implemented via `usePermission()`. Stakeholder
   decision moved to "configure the role" step: any role that should see
   contact info gets `appointments.customer_contact_email` toggled ON.
   Front-desk / doctor / receptionist roles will need this on by default;
   audit / accounting roles can leave it off.

5. ~~**Backdate via `SalesOrderDetailDialog`.**~~
   **Done 2026-05-07** — built `PermissionsProvider` + `usePermission()`
   hook. `PayOutstandingDialog` and `PaymentSection` now fall back to
   the provider when no `canBackdate` prop is passed. The 5 indirect
   callers don't have to thread anything.

6. ~~**RLS — `employees` + `roles` only.**~~ **Done then rolled back
   2026-05-07** — guard triggers were applied and removed the same
   day; deployed code didn't yet have the action-layer
   `requirePermission()` gates, so legitimate writes hit
   `Permission denied`. The action-layer gates are now live (a789f05,
   57d7be3), so the prerequisite is satisfied. Re-applying is the
   cheapest next security win.

7. ~~**Action-layer orphan cleanup.**~~ **Done 2026-05-08** — six files
   gated in one pass (`follow-ups`, `form-templates`, `form-responses`,
   `storage`, `receipts`, `brands`). See the "Action-layer orphans"
   section above for the chosen flag per file.

8. **Re-apply `employees` + `roles` RLS triggers.** Now that the
   action-layer gates ship, follow the playbook in the RLS bullet:
   audit + seed roles (`staff.employees`, `staff.roles` flags) on
   anyone who legitimately manages those entities, then re-apply the
   `guard_*` triggers. Closes the `supabase.from('employees').update`
   self-promotion path that DevTools currently bypasses.

9. **Stakeholder call — "view only mine" semantics.** Before touching
   `view_all_appointments` / the three `customer_transparency` flags,
   nail down what "mine" means for each entity. Document the answer in
   `docs/modules/02-appointments.md`, `03-customers.md`, `04-sales.md`.
   Then do one entity at a time; each is a small service-layer PR
   plus a Vitest test on the filter.

10. **Eventually: full RLS sweep.** Module by module, only when a
    stakeholder asks for it.

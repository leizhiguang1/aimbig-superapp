# Permissions test plan

A practical checklist to verify the permission system works end-to-end.
Estimated time: **30-45 min** if nothing breaks.

The flow is: smoke-test as admin → verify lockdown as no-flags user →
toggle each flag → confirm the right thing appears.

---

## Phase 0 — setup (do not skip)

You need **two separate browser sessions** — admin in one, test user in
the other. Use two browsers (Chrome + Firefox) or one + an Incognito
window.

- [ ] **Browser A (admin):** open `http://bigdental.localhost:3000` and
  log in as `admin@gmail.com`. This is your safety net — keep this tab
  open the entire test. SYSTEM ADMIN role with `all: true` means every
  flag is on, so admin should see everything.
- [ ] **Browser B (test user):** open same URL, log in as
  `testlei@gmail.com`. This account has the `LOCUM DOCTOR` role with
  zero flags, perfect for verifying the locked-down state.
- [ ] In Browser A, navigate to `/o/BDK/employees` → `Test admin` /
  `LOCUM DOCTOR` row → reassign `testlei` to the existing **`test role`**
  (already in your DB, also has zero flags). This way you can toggle
  flags via the role and see the effect on Browser B by reloading.
- [ ] Verify Browser A still has full sidebar (everything visible) and
  Browser B sidebar shows only **Dashboard**, **Voucher**, and the
  WhatsApp group items. ← if Browser A is missing items, stop and
  ping me, something's wrong.

---

## Phase 1 — admin smoke test (do this first)

Before testing the gates, confirm we didn't break anything for the
person who has full access. **All actions below should succeed in
Browser A (admin).**

- [ ] `/o/BDK/dashboard` loads
- [ ] `/o/BDK/appointments` loads with appointments visible
- [ ] Click an appointment → detail page loads with all tabs (Overview,
  Case notes, Billing, etc.) visible
- [ ] `/o/BDK/customers` loads with customer list, phone column visible,
  Edit/Delete column visible
- [ ] Open a customer → detail page loads, phone/email visible, Case
  Notes tab visible
- [ ] `/o/BDK/sales` loads with the Sales tabs (Sales / Payment /
  Cancelled / Summary)
- [ ] Open a sales order → detail loads
- [ ] `/o/BDK/inventory` loads → click "Add Item" → Cost Price field
  visible in form
- [ ] `/o/BDK/services` loads
- [ ] `/o/BDK/roster` loads
- [ ] `/o/BDK/employees` loads → all four tabs visible (Listing, Roles,
  Positions, Commission)
- [ ] `/o/BDK/passcode`, `/reports`, `/webstore`, `/config` all load
- [ ] **Topbar:** New Sale (cart icon), Manual Transaction (receipt
  icon) buttons both visible

If any of these is missing **for admin**, stop. Don't continue. Ping
with a screenshot.

---

## Phase 2 — empty-role lockdown (Browser B, test role with zero flags)

Browser B should be locked down hard. Each item below is "the user
should NOT see / NOT be able to do this."

- [ ] **Sidebar visible items:** Dashboard, Voucher, and the WhatsApp
  group ONLY. (Customers / Appointments / Sales / Inventory / Services /
  Roster / Employees / Passcode / Reports / Config / Webstore should
  ALL be hidden.)
- [ ] **Topbar:** New Sale + Manual Transaction buttons should NOT be
  visible
- [ ] Hand-type these URLs — each should show the **standard 404 page**
  (not a "no access" page, not a redirect):
  - [ ] `/o/BDK/customers` → 404
  - [ ] `/o/BDK/customers/<any-real-customer-id>` → 404
  - [ ] `/o/BDK/appointments` → 404
  - [ ] `/o/BDK/sales` → 404
  - [ ] `/o/BDK/inventory` → 404
  - [ ] `/o/BDK/services` → 404
  - [ ] `/o/BDK/roster` → 404
  - [ ] `/o/BDK/employees` → 404
  - [ ] `/o/BDK/passcode` → 404
  - [ ] `/o/BDK/reports` → 404
  - [ ] `/o/BDK/webstore` → 404
  - [ ] `/o/BDK/config` → 404

If any of those URLs renders content for the test user, stop. That's a
real bug.

---

## Phase 3 — flag-by-flag verification

For each flag below, toggle it ON in Browser A (`/o/BDK/employees/roles`
→ edit `test role` → enable the flag → save), then **fully reload**
Browser B and verify the expected surface appears.

After verifying, **turn the flag back off** before moving to the next
one. This isolates each flag's effect.

### Staff (5)

- [ ] **`staff.employee_listing`** ON → `Employees` appears in sidebar.
  `/employees` page shows the employee list. Edit/Delete column on each
  row is **NOT** visible. New Employee button is **NOT** visible.
- [ ] **`staff.roles` ONLY** (no `employee_listing`) → `Employees`
  appears in sidebar. Clicking it should redirect to `/employees/roles`
  (the first sub-tab the user can access), NOT 404.
- [ ] **`staff.position` ONLY** (no `employee_listing`, no `roles`) →
  Clicking sidebar should land on `/employees/positions`, NOT 404.
- [ ] **`staff.employees`** ON (with `employee_listing` also on) →
  Edit/Delete column appears, New Employee button appears
- [ ] **`staff.roles`** ON → `Roles` tab appears in employees sub-nav,
  `/employees/roles` page works
- [ ] **`staff.position`** ON → `Positions` tab appears,
  `/employees/positions` works
- [ ] **`staff.commissions`** ON → `Commission` tab appears,
  `/employees/commission` works (placeholder content)

### System (5)

- [ ] **`system.passcode`** ON → `Passcode` in sidebar, `/passcode` works
- [ ] **`system.reports`** ON → `Reports` in sidebar, `/reports` works
- [ ] **`system.config`** ON → `Config` in sidebar, `/config` works
- [ ] **`system.webstore`** ON → `Webstore` in sidebar, `/webstore` works
- [ ] **`system.manual_transaction`** ON →
  - Manual Transaction (receipt icon) appears in topbar
  - On any customer detail page, the `Manual Transactions` tab appears
    in the customer's section tabs (was previously visible to anyone
    with `customers.view`)

### Customers (4 active)

- [ ] **`customers.customers`** ON → `Customers` in sidebar, list page
  loads. **No phone column**, **no Edit/Delete column**, **no New
  customer button**.
- [ ] **`customers.view` ONLY** (no `customers.customers`) → `Customers`
  nav should NOT appear in sidebar (it would 404 anyway). User can
  still open a specific `/customers/<id>` URL directly (e.g. from an
  appointment detail link).
- [ ] **`customers.view`** ON (also need `customers.customers`) → can
  open `/customers/<id>` for individual customers
- [ ] **`customers.update`** ON → New customer button + Edit/Delete
  column appear; clicking Edit / Delete actually works
- [ ] **`customers.customers_contact`** ON →
  - Phone column appears in customer list
  - Search bar accepts phone/email keywords
  - Customer detail shows phone, phone2, email rows
  - Customer detail collapsed-header shows phone

### Appointments (4 active)

- [ ] **`appointments.appointments`** ON → `Appointments` in sidebar,
  calendar loads, can open detail page, can create / edit / cancel
  appointments
- [ ] **`appointments.customer_contact_email`** ON →
  - Calendar cards show phone under each appointment
  - Hover over an appointment → hover popup shows phone + phone2
  - Switch to List view (if your build has it) → phone + email columns
    show data instead of dashes
- [ ] **`appointments.lead_list_creation`** ON → "Convert lead" works
  on a lead-typed appointment
- [ ] **`appointments.revert_appointment`** ON →
  - On a completed appointment, the "Revert to pending" icon button
    appears in the action bar
  - Cancel/revert billing actions inside HistoryPanel succeed
  - With flag OFF, the Revert button is hidden

### Sales (4 active)

- [ ] **`sales.sales`** ON → `Sales` in sidebar, all sales tabs work
- [ ] **`sales.create_sales` ONLY** (no `sales.sales`) → `Sales` nav
  should NOT appear in sidebar (it would 404). New Sale button in
  topbar SHOULD appear.
- [ ] **`sales.create_sales`** ON →
  - New Sale (cart icon) appears in topbar
  - Collect Payment dialog can be opened on appointments
  - On `/sales/[id]` detail page: **Record payment**, **Write off**,
    **Reallocate payments**, **Void**, **Change payment method**, and
    **Revert last payment** buttons are visible and work
  - With flag OFF (but `sales.sales` ON), the buttons above are hidden;
    Print + view-only is still available
- [ ] **`sales.sales_person_reallocation`** ON → "Set allocation" /
  employee-pill button on each sale item row in `SalesOrderDetailView`
  is clickable; with flag OFF the button greys out
- [ ] **`sales.backdate_transactions`** ON →
  - "Backdate Invoice?" toggle visible in NewSale dialog
  - Same toggle visible in Collect Payment dialog
  - Same toggle visible in PayOutstanding dialog (on `/sales/[id]` AND
    when opened from customer detail tabs)

### Inventory (4 active)

- [ ] **`inventory.inventory`** ON → `Inventory` in sidebar, page loads
- [ ] **`inventory.inventory_edit`** ON → on `/inventory`, **Add Item**
  button appears + per-row Edit/Delete column appears; New Item /
  Edit Item / Delete all succeed. UoM/Brand/Category/Supplier CRUD
  works (note: their own panel buttons aren't UI-gated yet, but
  server-side actions do require this flag).
- [ ] **`inventory.inventory_cost`** ON →
  - Cost Price field appears in the item form
  - Per-outlet "Cost" column appears in the per-outlet table inside
    the item form
- [ ] **`inventory.adjust_stock`** ON → on `StockDetailsDialog`, the
  green `+` "Adjust stock" button appears (hidden when off)

### Services (1)

- [ ] **`services.services`** ON → `Services` in sidebar, CRUD works
  for services + categories

### Roster (2)

- [ ] **`roster.roster`** ON (without `roster_edit`) → `Roster` in
  sidebar, page loads. **Cells are read-only**: empty cells show "—"
  (no `+ Add` button), shifts show their time but clicking does nothing.
- [ ] **`roster.roster_edit`** ON (with `roster.roster`) → empty cells
  show `+ Add`, clicking opens ShiftDialog, create / update / delete
  succeeds

### Clinical (5 active)

- [ ] **`clinical.case_notes`** ON →
  - Customer detail: `Case Notes` tab visible
  - Appointment detail: `Case notes` tab visible
- [ ] **`clinical.case_notes_edit`** ON →
  - On customer detail Case Notes tab + appointment detail Case Notes
    tab, the editor block (textarea + Save/Update buttons) appears
  - With flag OFF (but `case_notes` ON), the tab still shows but the
    editor block is hidden — only the case-note history reads
- [ ] **`clinical.medical_certificates`** ON →
  - On customer detail Medical Certificates tab: `+` New MC button
    appears; per-row Edit / Cancel buttons appear
  - On customer detail Case Notes tab toolbar: MC icon (FileBadge)
    appears
  - On appointment detail Case Notes tab toolbar: same MC icon appears
  - On customer detail Documents tab: Letters action button appears
- [ ] **`clinical.document_edit`** ON → on Documents tab, **Files**
  (upload) + **Forms** (consent) buttons appear
- [ ] **`clinical.document_delete`** ON → on Documents tab, per-row
  Delete column appears (otherwise rows have no Delete affordance)

---

## Phase 4 — server-side bypass check

This verifies that even if a user manipulates the UI in devtools, the
server still rejects the action. Pick **one or two** of the most
sensitive ones to spot-check.

- [ ] **Action guard:** in Browser B (test role with zero flags), open
  the DevTools console while on the dashboard. Try to call a guarded
  action by simulating a server-action POST. Easiest indirect test:
  - In Browser A, give test role only `staff.employee_listing` (so
    they can SEE employees but not manage)
  - Reload Browser B → `/employees` should load
  - In DevTools, find the row with the (now hidden) edit button and
    force-show it via the inspector / element panel
  - Click it → fill in the form → save
  - **Expected:** form shows the error
    `Missing permission: staff.employees` (or similar)

- [ ] **Backdate server enforcement:** in Browser B, give test role
  `sales.create_sales` ONLY (NOT `sales.backdate_transactions`)
  - Open New Sale dialog → backdate toggle is hidden ✓
  - In DevTools, manually set the dialog state to include a backdated
    `sold_at` (or just inspect the React Query → invoke
    `collectWalkInSaleAction` with `sold_at` in the input)
  - **Expected:** server returns
    `Missing permission: sales.backdate_transactions`

If both server-side checks pass, you're solid against the bypass.

---

## What "verify it works" looks like

For each item above, the verification is:

- **For "ON" items:** the surface APPEARS where it didn't before.
  Concrete check: the URL/button/tab is now visible AND clicking it
  produces the expected page/dialog.
- **For "OFF / 404" items:** the surface DOES NOT appear. Concrete
  check: the URL renders the standard Next.js not-found page; the
  button is not in the DOM (inspect element → not present, not just
  CSS-hidden).
- **For server-side checks:** the action that should fail returns an
  error message starting with `Missing permission: `. The form should
  show this message inline (not crash with a generic "An error
  occurred" 500).

---

## Things that can go wrong (and how to recover)

- **You accidentally locked yourself out.** Browser A admin login still
  works because SYSTEM ADMIN role has `all: true`. As long as that role
  exists in the DB and your employee row has it, you're safe. If you
  accidentally edit the SYSTEM ADMIN role itself and turn `all` off
  → re-enable via the Supabase MCP / dashboard:
  ```sql
  update roles
    set permissions = jsonb_set(permissions, '{all}', 'true'::jsonb)
    where name = 'SYSTEM ADMIN';
  ```

- **Sidebar nav stuck after toggling a flag.** Hard-reload the page in
  Browser B (Cmd+Shift+R). Permissions are cached per request via
  React `cache()`, but should rebuild on full reload.

- **404 instead of expected content even with flag on.** Check the
  flag is actually saved on the role (open in Browser A, verify the
  toggle is checked). Check Browser B is logged in as the right user
  (`testlei@gmail.com`) and that user is assigned to the right role.

- **Action returns "An error occurred in the Server Components render"
  instead of a real error message.** That's the production-mode error
  sanitization. Run dev server with `NODE_ENV=development` (default for
  `pnpm dev:big`) — you should see the real
  `Missing permission: ...` message.

---

## After testing — what to report back

If you hit a problem, the most useful info is:

1. Which checkbox failed (e.g. "`customers.update` ON, but Edit column
   still hidden")
2. Which user you were logged in as
3. What you saw vs. what you expected
4. A screenshot of the surface in question if visual

If everything passes, just say so and I'll move on to:
- **RLS hardening** on `employees` + `roles` (closes the
  promote-myself-to-admin hole), or
- The deferred-feature backlog (Prescriptions, Petty Cash, etc.) when
  you're ready to pick up the next one.

---

## Appendix — flag-by-flag walkthrough (32 implemented flags)

Use this for a slower, exhaustive pass — one toggle, one verification.
For each row: in Browser A, toggle the flag OFF on `test role` → in
Browser B, hard-reload and run the test → confirm the result. Then
toggle ON and confirm the inverse.

> "Tied to me" means `consultant_id = testlei.employee_id` on the
> customer (or appointment.employee_id where noted). Make sure at
> least one customer has `testlei` as consultant **and** at least one
> doesn't, so you can see the filter in action.

### Clinical (6)

- [ ] **1. `clinical.case_notes`** — Open a customer detail. OFF → Case
  Notes tab is missing from the tab strip; view-source shows no
  case-note text in the HTML. ON → tab and notes return.
- [ ] **2. `clinical.case_notes_edit`** — Customer Detail → Case Notes
  tab. OFF → editor block (textarea + Save) is gone; History panel
  per-row Pin/Edit/Cancel/Restore icons hidden. ON → all return.
- [ ] **3. `clinical.case_notes_billing`** — Open an appointment
  detail. OFF → Billing tab is hidden from the tab strip. Try to call
  `createLineItemAction` (devtools or attempt to add an item via
  hidden tab) → server rejects with "Missing permission". ON → tab
  returns, line items add normally.
- [ ] **4. `clinical.medical_certificates`** — Customer Detail → MC
  tab + Documents panel. OFF → "+ New MC" hidden, per-row Edit/Cancel
  hidden, Letters action button hidden in Documents. Existing MCs
  still listed (read-only). ON → all entry buttons return.
- [ ] **5. `clinical.document_edit`** — Customer Detail → Documents
  panel. OFF → Files (upload) and Forms (consent) action buttons are
  gone. Try a direct `requestMediaUploadUrlAction` or
  `createCustomerDocumentAction` → rejected. ON → buttons return.
- [ ] **6. `clinical.document_delete`** — Customer Detail → Documents
  panel. OFF → per-row Delete column hidden. ON → returns.

### Appointments (6)

- [ ] **7. `appointments.appointments`** — sidebar nav + page gate.
  OFF → Appointments item disappears from sidebar; navigating to
  `/o/BDK/appointments` 404s; same for `/o/BDK/appointments/<ref>`.
  Action calls (e.g. create appointment) reject. ON → all return.
- [ ] **8. `appointments.customer_transparency`** — *not a list
  filter*. Open the New Appointment dialog. OFF → customer search
  picker only shows customers tied to me; trying to create an
  appointment with a customer not tied to me (via crafted action
  call) → "You can only book appointments for customers tied to you."
  ON → search shows everyone.
- [ ] **9. `appointments.view_all_appointments`** — list filter. OFF →
  calendar / list shows ONLY appointments where `employee_id = me`.
  Direct URL `/o/BDK/appointments/<other-staff-ref>` → NotFoundPanel.
  ON → all appointments visible.
- [ ] **10. `appointments.lead_list_creation`** — open a lead-type
  appointment. OFF → "Register to Customer" button on `CustomerCard`
  hidden; in-dialog Register button inside `AppointmentDialog` hidden;
  `convertLeadToCustomerAction` rejects on direct call. ON → returns.
- [ ] **11. `appointments.revert_appointment`** — open a completed
  appointment. OFF → "Revert to pending" icon on action bar hidden;
  History panel "Cancel billing" / "Restore billing" icons hidden;
  the four billing-revert actions reject server-side. ON → returns.
- [ ] **12. `appointments.customer_contact_email`** — appointment
  surfaces. OFF → phone is masked on calendar cards, hover popover,
  list rows. New Appointment dialog's customer search **still** shows
  phone (intentional — needed for booking). ON → masks lift.

### Customers (5)

- [ ] **13. `customers.customers`** — master listing. OFF → sidebar
  Customers item hidden; `/o/BDK/customers` 404s. New Customer button
  + create action rejected. ON → all return.
- [ ] **14. `customers.view`** — detail-page gate. OFF → opening any
  `/o/BDK/customers/<id>` 404s. ON → loads.
- [ ] **15. `customers.update`** — write actions. OFF → Edit/Delete
  column hidden in `CustomersTable`; `updateCustomerAction` /
  `deleteCustomerAction` reject. ON → return.
- [ ] **16. `customers.customer_transparency`** — list + detail
  filter. OFF → customers list shows only those tied to me; opening
  someone-else's customer URL directly → NotFoundPanel. Editing /
  deleting a not-tied customer (e.g. via crafted action) →
  "You can only manage customers tied to you." Creating a customer
  with a different `consultant_id` → rejected. ON → all visible /
  editable.
- [ ] **17. `customers.customers_contact`** — render gate. OFF →
  phone column hidden in CustomersTable; phone/email rows hidden in
  customer detail (collapsed and expanded views); search no longer
  matches phone/email. ON → all visible.

### Sales (5)

- [ ] **18. `sales.sales`** — listing + detail gate. OFF → sidebar
  Sales item hidden; `/o/BDK/sales` and `/o/BDK/sales/<id>` 404. ON →
  all load.
- [ ] **19. `sales.customer_transparency`** — list + detail filter.
  OFF → sales table shows only orders for customers tied to me;
  opening someone-else's sale URL → notFound. New Sale dialog's
  customer picker shows only tied customers; creating a walk-in sale
  for a customer not tied to me → "You can only create sales for
  customers tied to you." Walk-ins (no customer) are excluded from
  the list when off. ON → all visible.
- [ ] **20. `sales.create_sales`** — write actions. OFF → topbar
  "New sale" button hidden; on a sales-order detail Record payment /
  Write off / Reallocate / Void / Change payment method / Revert last
  payment buttons all hidden; appointment-side payment shortcuts
  hidden; all the related actions reject server-side. ON → return.
- [ ] **21. `sales.sales_person_reallocation`** — incentive
  reallocation. OFF → "Set allocation" / employee-pill button on
  each sale item row in `SalesOrderDetailView` is disabled (greyed).
  `replaceSaleItemIncentivesAction` rejects. ON → returns.
- [ ] **22. `sales.backdate_transactions`** — backdate field. OFF →
  backdate (sold_at) toggle hidden in PaymentSection,
  PayOutstandingDialog, and the popup-variant SalesOrderDetailDialog.
  `collectAppointmentPaymentAction` and `collectWalkInSaleAction`
  reject when `sold_at` is set. ON → toggle returns and date is
  honored.

### Roster (2)

- [ ] **23. `roster.roster`** — page gate. OFF → sidebar hidden;
  `/o/BDK/roster` 404s. ON → loads.
- [ ] **24. `roster.roster_edit`** — RosterGrid edit. OFF → empty
  cells render as "—" (no Add button); shifts display the time
  without a clickable handler; create/update/delete shift actions
  reject. ON → all return.

### Services (1)

- [ ] **25. `services.services`** — page + CRUD. OFF → sidebar
  hidden; `/o/BDK/services` 404; service / category create / update /
  delete actions reject. ON → all return.

### Inventory (4)

- [ ] **26. `inventory.inventory`** — module gate. OFF → sidebar
  hidden; `/o/BDK/inventory` 404 (and all sub-pages). ON → all return.
- [ ] **27. `inventory.inventory_edit`** — write across items / UoM /
  brands / categories / suppliers. OFF → on `/inventory`: Add Item +
  per-row Edit/Delete hidden; on `/inventory/options`: each panel's
  Add and per-row Edit/Delete hidden; on `/inventory/uom`: Add + per-
  row Edit/Delete hidden. ON → all return.
- [ ] **28. `inventory.inventory_cost`** — cost masking. OFF → in
  ItemForm Cost Price field is hidden; per-outlet Cost column
  (header + input) is hidden. ON → return.
- [ ] **29. `inventory.adjust_stock`** — stock adjust. OFF → "Adjust
  stock" `+` icon in `StockDetailsDialog` is hidden;
  `recordStockMovementAction` rejects. ON → returns.

### Staff (5)

- [ ] **30. `staff.employees`** — write actions on employees. OFF →
  on `/employees`, the per-row Edit / Reset / Delete actions column
  is hidden; create/update/delete/admin-set-password/admin-set-pin
  actions reject. ON → return.
- [ ] **31. `staff.roles`** — `/employees/roles` page + role CRUD.
  OFF → page 404s; role action calls reject. ON → return.
- [ ] **32. `staff.position`** — `/employees/positions` page + CRUD.
  Same shape as roles. OFF → 404. ON → return.
- [ ] **33. `staff.commissions`** — `/employees/commission` page.
  OFF → 404. ON → loads (placeholder).
- [ ] **34. `staff.employee_listing`** — listing page. OFF → sidebar
  Employees item hidden; `/employees` listing redirects to first
  sub-page user can see (roles → positions → commission); if no sub
  flag is on, 404. ON → returns.

### System (5)

- [ ] **35. `system.passcode`** — `/passcode` page + create/delete.
  OFF → sidebar hidden, page 404; create/delete actions reject.
  ON → return.
- [ ] **36. `system.reports`** — `/reports` page. OFF → sidebar
  hidden, page 404. ON → loads (placeholder).
- [ ] **37. `system.config`** — `/config/*` (gated at layout) + all
  config write actions (brand-config, brand-settings,
  billing-settings, outlets, rooms, payment-methods, taxes,
  letter-templates, form-templates, brands). OFF → sidebar hidden,
  page 404, every config action rejects. ON → return.
- [ ] **38. `system.manual_transaction`** — module + tab. OFF →
  topbar Manual Transactions button hidden; Manual Transactions tab
  on Customer Detail hidden; manual-tx CRUD actions reject.
  ON → return.
- [ ] **39. `system.webstore`** — `/webstore` page. OFF → sidebar
  hidden, page 404. ON → loads (placeholder).

### What you should NOT see when toggling deferred flags (sanity)

The following flags carry a "Coming soon *" badge in the matrix. They
should have **no observable effect** when toggled — feature isn't
built yet. If toggling one of these breaks a working surface, that's
a bug:

`clinical.prescriptions`, `appointments.consumable_selection`,
`appointments.queue`, `appointments.appointment_approval`,
`customers.internal_review`, `customers.review_assignment`,
`customers.customer_merging`, `customers.revert_products`,
`sales.adjust_co_payment`, `sales.view_petty_cash`,
`sales.edit_petty_cash`, `inventory.purchase_orders`,
`inventory.returned_stock`.

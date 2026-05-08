# Permissions glossary — Aoikumo source-of-truth definitions

Captured 2026-05-08 by walking the live Aoikumo role-matrix tooltips at
`https://bigdental.aoikumo.com/employee#!#panel_roles` (the source product
our flag set was copied from). Each row below is the **verbatim Aoikumo
tooltip** for the column with the same heading.

This is the authoritative meaning to use when wiring or renaming a flag.
Where our codebase has drifted from the Aoikumo meaning, the
"**Our usage**" line calls it out.

> "kumoSan" in the tooltips is Aoikumo's mobile staff app — we don't have
> a kumoSan equivalent today, so any "in kumoSan" qualifier collapses to
> "in the appointments listing UI" for us.

---

## Clinical

### `clinical.case_notes`
**Aoikumo:** *This access would affect both Appointments and Customer modules.*
*(Master "can read case notes" — the same flag is checked on both the
Appointments-detail and Customer-detail tabs.)*
**Our usage:** matches — read access to the case-notes tab in both surfaces.

### `clinical.case_notes_edit`
**Aoikumo:** *This access would affect both Appointments and Customer modules.*
*(Master "can edit case notes" across both surfaces.)*
**Our usage:** matches.

### `clinical.case_notes_billing`
**Aoikumo:** "When enabled, users in this role will have access to Case
Notes Billing within Appointments and will also be able to edit items in
the list during the billing process (To Purchase / Case Notes Billing)."
**Our usage:** **`[-]` (no UI yet).** Aoikumo's "Case Notes Billing" is a
separate billing entry-point inside the case-notes screen — distinct from
the appointment-billing flow we ship today. Wire when that flow ships.

### `clinical.medical_certificates`
**Aoikumo:** *This access would affect both Appointments and Customer modules.*
**Our usage:** matches — gates MC + customer-letter create/update across
both surfaces.

### `clinical.prescriptions`
**Aoikumo:** *This access would affect both Appointments and Customer modules.*
**Our usage:** **`[-]` (no UI yet).** No prescription module — Phase 2.

### `clinical.document_edit`
**Aoikumo:** "When enabled, user will be able to edit the document name."
**Our usage:** broader — we use it to gate customer-document upload + form
submission. The Aoikumo definition is **only renaming**; the upload/delete
verbs are presumably under document_delete and an implicit "have document
access" master we don't have. Our broader use is safe (more restrictive)
but worth noting if a stakeholder asks why uploads are blocked.

### `clinical.document_delete`
**Aoikumo:** "When enabled, user will be able to delete the document."
**Our usage:** matches.

---

## Appointments

### `appointments.appointments`
**Aoikumo:** "If disabled, user will only be able to view their own
appointments in kumoSan."
*(Master access. Without it, even the mobile app shows only your own
appointments — the web list is fully gated by this + the section perms.)*
**Our usage:** broader — we use this as the master "can see /appointments
at all" page gate. Aoikumo's per-flag tooltip implies the flag really means
"can see others' in kumoSan"; the web list is implicitly always available
to anyone with login. We've collapsed those two into one. **Note this when
deciding what `view_all_appointments` should do for us** — see below.

### `appointments.customer_transparency`
**Aoikumo:** "When checked, users within this role will be able to create
appointments for any customer. When unchecked, users within this role will
be able to create appointments only for customers tied to them."
**This flag is about the create-appointment customer picker, not the list.**
The list filter is `view_all_appointments`. So:
- `customer_transparency` OFF → in the "New appointment" dialog, customer
  search is restricted to customers where `customers.consultant_id = me`.
- `view_all_appointments` OFF → the calendar / list shows only appointments
  where `appointment.employee_id = me`.

These are **two different filters**, not redundant.

### `appointments.consumable_selection`
**Aoikumo:** "When checked, users within the role will be able to change
consumables when completing appointments."
**Our usage:** **`[-]` (no UI).** Wire when the swap-consumable feature ships.

### `appointments.view_all_appointments`
**Aoikumo:** "When checked, user will be able to view all appointment list.
When unchecked, user will be able to only view appointments under his/her
role."
**Our usage:** **`[ ]` not yet wired.** Filter `listAppointmentsForRange`
to `employee_id = me` when off.

### `appointments.lead_list_creation`
**Aoikumo:** *(no tooltip in matrix)*
**Our usage:** gates `convertLeadToCustomerAction`. Reasonable.

### `appointments.revert_appointment`
**Aoikumo:** *(no tooltip)*
**Our usage:** gates revert-completed-appointment + billing-revert actions.

### `appointments.queue`
**Aoikumo:** *(no tooltip)*
**Our usage:** **`[-]` (no UI yet).**

### `appointments.appointment_approval`
**Aoikumo:** *(no tooltip)*
**Our usage:** **`[-]` (no UI yet).**

### `appointments.customer_contact_email`
**Aoikumo:** *(no tooltip)*
**Our usage:** wired — masks phone/email on calendar cards, hover, list cells.

---

## Customers — **major naming surprise**

In Aoikumo's matrix the Customers section is:

| Column | Tooltip | What it actually controls |
|---|---|---|
| **CUSTOMERS** | (no tooltip) | Master access to /customers |
| **VIEW** | "Permit users within this role to access and view **Google reviews** submitted by customers." | Google review reading |
| **UPDATE** | "Grant users with this role the ability to **submit, edit, or delete replies to Google reviews**." | Google review reply CRUD |
| **INTERNAL REVIEW** | "Grant users with this role access to view internal reviews submitted for ratings below the threshold set in Config." | Low-rating internal review visibility |
| **REVIEW ASSIGNMENT** | "Permit users with this role to assign internal reviews to employees for follow-up actions." | Assign reviews to staff |
| **CUSTOMER TRANSPARENCY** | "When checked, users within this role will be able to view all customer information. When unchecked, users within this role will only be able to view customers tied to them." | List/detail visibility filter |
| **CUSTOMER MERGING** | (no tooltip) | Merge duplicate customers |
| **REVERT PRODUCTS** | (no tooltip) | Reverse a sold product (overlap with `appointments.revert_appointment`) |
| **CUSTOMERS CONTACT** | (no tooltip) | Phone/email visibility on customer rows |

### What this means for our schema

We've been using `customers.view` as "open the customer detail page" and
`customers.update` as "edit the customer record" — that's **not what they
mean in Aoikumo**. Aoikumo's `view`/`update` are about **Google reviews**.

We have three options going forward:

1. **Rename in our schema** to `customers.review_view` and
   `customers.review_update` so the names reflect the Aoikumo intent.
   Then add new flags `customers.detail_view` / `customers.detail_update`
   for what we actually use today. Cleanest but requires a schema +
   UI matrix update.
2. **Document the divergence and keep our usage.** Our `customers.view` /
   `customers.update` are simply repurposed — Aoikumo's review flow is
   deferred for us anyway.
3. **Drop Aoikumo's review-flag intent entirely.** We don't (and may
   never) have Google-review integration. Treat `view`/`update` as ours.

**Recommendation: option 2** for now (cheapest, keeps wiring stable).
Revisit if/when we ever build a review-management surface.

### `customers.customer_transparency`
Real meaning: **list/detail filter** — only show customers where
`customers.consultant_id = me` when off.
**Our usage:** **`[ ]` not yet wired.**

### `customers.customer_merging`
**Aoikumo:** (no tooltip — the column exists but no tooltip set)
**Our usage:** **`[-]` (no UI yet).**

### `customers.revert_products`
**Aoikumo:** (no tooltip)
**Our usage:** overlaps with `appointments.revert_appointment`. The
customer-side billing reverts use the appointment flag today. Decision:
keep as-is (`[-]` "use appointments flag").

### `customers.customers_contact`
**Aoikumo:** (no tooltip)
**Our usage:** wired — hides phone column + phone/email rows in
customer-detail.

---

## Sales

### `sales.sales`
**Aoikumo:** (no tooltip) — master listing access.
**Our usage:** matches.

### `sales.customer_transparency`
**Aoikumo:** "When checked, users within this role will be able to create
and view sales of all customers. When unchecked, users within this role
will be able to create and view sales, only for customers tied to them."
**Filter scope: BOTH list view AND create.** "Tied to" presumably means
the customer's `consultant_id = me` (matches the customers-section flag).
**Our usage:** **`[ ]` not yet wired.**

### `sales.create_sales`
**Aoikumo:** (no tooltip)
**Our usage:** wired — gates all sales-mutation actions.

### `sales.adjust_co_payment`
**Aoikumo:** "When checked, user will be able to adjust Co-Payment &
Claimable amount."
**Our usage:** **`[-]` (no UI).** Insurance / claim feature deferred.

### `sales.sales_person_reallocation`
**Aoikumo:** (no tooltip)
**Our usage:** wired — gates incentive replacement.

### `sales.backdate_transactions`
**Aoikumo:** "When checked, users within the Role will be able to backdate
sales, payments, sales cancellations, credit voucher top ups, and claim
invoices."
**Our usage:** matches the spirit. Today we gate the
`sold_at` parameter on `collectAppointmentPaymentAction` and
`collectWalkInSaleAction`. We don't yet have credit-voucher top-ups or
claim invoices, so those branches are inert.

### `sales.view_petty_cash` / `sales.edit_petty_cash`
**Aoikumo:** (no tooltip)
**Our usage:** **`[-]` (no UI).** Petty-cash deferred.

---

## Roster

### `roster.roster` / `roster.roster_edit`
**Aoikumo:** (no tooltip)
**Our usage:** matches — read vs. write split.

---

## Services

### `services.services`
**Aoikumo:** (no tooltip)
**Our usage:** matches — master access to the services module.

---

## Inventory

### `inventory.inventory`
Master access. (no tooltip)

### `inventory.purchase_orders` / `inventory.returned_stock`
**`[-]` (no UI).**

### `inventory.inventory_edit`
Item / brand / category / supplier CRUD. (no tooltip)
**Our usage:** matches.

### `inventory.inventory_cost`
**Aoikumo:** "Enable the display of Cost Price and WAC in Stock Requests,
Transfer Orders (Tax and Total), and Inventory Logs. Note: Users with
access to Purchase Orders will still be able to view the product cost and
WAC price within the Purchase Order."
**Our usage:** matches the spirit — we hide Cost Price field + per-outlet
cost column in `ItemForm`. Aoikumo also wants it hidden in Stock Requests
and Transfer Orders (we don't have those screens yet) and Inventory Logs
(we don't have those either). The PO carve-out doesn't apply (no PO
module).

### `inventory.adjust_stock`
**Aoikumo:** (no tooltip)
**Our usage:** matches — gates `recordStockMovementAction`.

---

## Staff

(no tooltips in Aoikumo for this section — the column names are taken as
self-explanatory)

| Flag | Aoikumo intent | Our usage |
|---|---|---|
| `staff.employees` | manage employees CRUD | matches |
| `staff.roles` | manage roles | matches |
| `staff.position` | manage positions | matches |
| `staff.commissions` | view commissions report | matches (placeholder page) |
| `staff.employee_listing` | see /employees listing | matches |

---

## System

(no tooltips in Aoikumo for this section)

| Flag | Aoikumo intent | Our usage |
|---|---|---|
| `system.passcode` | passcode management | matches |
| `system.reports` | reports access | matches (placeholder) |
| `system.config` | config / settings | matches |
| `system.manual_transaction` | manual-transaction module | matches |
| `system.webstore` | webstore config access | matches (placeholder) |

---

## What this means for the four remaining `[ ]` flags

Aoikumo's tooltips give us **clear, non-overlapping definitions**:

1. **`appointments.view_all_appointments` OFF** →
   `appointment.employee_id = me` filter on the list.
2. **`appointments.customer_transparency` OFF** →
   `New appointment` customer search restricted to
   `customers.consultant_id = me`. **Not a list filter.**
3. **`customers.customer_transparency` OFF** →
   List + detail filter to `customers.consultant_id = me`.
4. **`sales.customer_transparency` OFF** →
   List filter + create-sale customer picker filter to
   `customer.consultant_id = me`.

The previous "view-only-mine" framing was a misread — Aoikumo splits
"who can I create things for" from "what can I see in lists" into
two separate flags. We should mirror that.

---

## Captured by

Lei Zhi Guang via Playwright MCP, hovering each underlined column header
on the Aoikumo Roles tab. Source DOM ids: `tooltip_inventorycost`,
`tooltip-medical-access-cn[b|mc|pr]`, `tooltip-document-edit/delete`,
`tooltip_appointmentrole`, `appointmentcustomertransparency`,
`apptConsumable`, `tooltip_viewallappointment`, `tooltip_googlereview`,
`tooltip_reviewupdate`, `tooltip_internalreview`,
`tooltip_internalreviewassignment`, `customercustomertransparency`,
`salescustomertransparency`, `tooltip_adjustcopayment`,
`tooltip_backdatesales`.

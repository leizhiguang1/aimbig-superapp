# BIG — Completion Checklist (KumoDent parity)

Living checklist for finishing feature depth across all modules before
multi-tenant / RLS tightening. Tick items as they land. Each phase finishes
before the next — see rationale at the bottom.

For module-level scope and fields, always consult the matching
`docs/modules/NN-*.md` — this file is the **order** and known-backlog
punch list, not a spec.

---

## Recently shipped (2026-05-07 → 2026-05-11)

These didn't have their own checklist item but landed in this window and
are now load-bearing for downstream work. Captured here so the checklist
reflects reality before the next refactor pass.

- **Outlet-scoped routing** — every app surface moved under
  `/o/[outlet]/...`. Server actions and services accept `outletId` via
  ctx. (commits `9fec4b4`, `1252ff0`)
- **RBAC / granular permissions** — `lib/auth/permissions.ts` +
  `PermissionsProvider`; `hasPermission` checks wired through actions,
  sensitive customer tabs, and sales/appointment surfaces. (commits
  `a789f05`, `57d7be3`, `36e0ea0`)
- **Action error-handling sweep** — all 29 `lib/actions/*.ts` files now
  use `toErr` + try/catch via `lib/actions/_helpers.ts`. Resolves the
  tech-debt item flagged 2026-05-05. (commit `73ba9e0`)
- **Dashboard infrastructure** — `components/dashboard/` with KpiTile,
  ChartCard, 4 chart components (OutletComparison / SalesMix stacked +
  donut / TimeSeries / WoW), BirthdaysCard, LowStockCard,
  DashboardRemindersCard, and `lib/services/dashboard.ts` service layer.
  (commit `9711bb6`) — see Phase C1 below; queries + tile copy still to
  finalize.
- **Chats / Inbox UI** — `components/chats/` ChatWindow, ChatList,
  MessageInput, ContactInfoSheet, QRScreen, push notifications, multi-WA
  hook. `components/inbox/` thread + composer + channel badge. Pure
  Socket.IO; no mirror tables. (commits `fdec40f`, `da38211`)
- **Automations builder scaffold** — `components/automations/` with
  WorkflowBuilder, FolderTabs, TemplatesGallery, NewWorkflowDialog.
  Engine location still undecided (see D3).
- **Letter templates + e-documents + manual transactions** — new modules,
  no checklist line yet. (commit `da38211`)
- **Brand-scoped remark categories + stock adjustment dialog** — remark
  vocabulary now dynamic per brand. (commit `699600e`)
- **Server-side payment allocation validation** — moved from client.
  (commit `c7dc87d`)
- **Server-action error helper** — `lib/actions/_helpers.ts` provides
  `toErr`; pattern adopted across all actions. (commit `73ba9e0`)

---

## Phase A — Lock down the money path

The shape of `sales_orders` / `sale_items` / `payments` / `appointments`
governs every downstream read. Stabilize these first.

### A1. Sales / Collect Payment depth — `docs/modules/04-sales.md`
- [x] Invoice print (PDF/printable view) from sales order detail
- [x] Staff-discount auto-detect — wires `customers.is_staff` + `billing.staff_discount_percent` brand setting (default 10%) into the "Apply Auto Discount" button; respects per-service `discount_cap`. (2026-04-24)
- [x] Service pricing range (`price_min`/`price_max` + `allow_cash_price_range`) — schema + LineItemRow UI live
- [x] Service discount cap (`discount_cap`) — schema + LineItemRow UI live (`capPct`, "apply max" button, on-blur clamp)
- ~~Credit note / standalone refund~~ — **removed 2026-05-02.** Not in KumoDent. Void SO is the only cancellation path; wallet credit is handled by the void flow's `refund_method` selection.
- [x] Partial-item void — **shipped 2026-05-02.** RPC fully handles partial void: marks selected `sale_items.is_voided = true`, reduces SO `total`/`subtotal`/`tax`, reverses inventory for selected items only, blocks partial void on wallet-payment orders. UI checkboxes live; already-voided items show strikethrough + badge. Known limitation: Step 1 "Amount to return" preview does not subtract wallet payments from `amount_paid` (RPC result in success toast is always correct).
- [x] Payment methods config — already shipped at `/config/sales/payment` (list, toggle, add custom, remarks-only for custom methods).
- [x] ~~Structured card fields on `payments`~~ — **dropped 2026-04-24.** Already structured: `card_type` (Visa/Master/Amex/Others), `approval_code` (= auth_code), `reference_no`, `trace_no`, `bank`, `months`. Renaming to `card_brand`/`auth_code` was churn; `card_last4` isn't captured by KumoDent either. Revisit only if a clinic asks for statement reconciliation.
- [x] Write-off outstanding balance — **shipped 2026-05-02.** `write_off_outstanding` RPC inserts a `WRITEOFF` payment row and zeros `outstanding`; void RPC updated to exclude write-off amounts from refund calculation. See `docs/modules/04-sales.md` §Write-off.
- [x] Unit tests on `collectPayment` happy path + rollback (per ARCHITECTURE §9) — **shipped 2026-04-24.** [lib/services/__tests__/sales.test.ts](../lib/services/__tests__/sales.test.ts) covers schema validation, happy path, DB-error → ValidationError mapping, null-return handling, and cap enforcement short-circuit. Also covers `voidSalesOrder` and `issueRefund`. Run via `pnpm test` or `npx vitest run`.

### A2. Appointments fixes — `docs/modules/02-appointments.md`
- [ ] Outstanding appointment bugs from backlog (2026-04-15 entry)
- [ ] Payment-dialog loose ends (follow-up after recent `1f3c643`)
- [ ] Status progression edge cases (no-show, rescheduled, cancelled)
- [ ] Block-out / leave overlays on calendar
- [ ] Walk-in creation from calendar

---

## Phase B — Fill in entity depth

### B1. Customer detail sub-tabs — `docs/modules/03-customers.md`
- [ ] Visit history (appointments + sales, unified timeline)
- [ ] Documents (upload + view)
- [ ] Packages & vouchers (balance, redemption history)
- [ ] Credit notes issued
- [ ] Account balance / outstanding
- [ ] IC / NRIC reader integration
- [ ] Customer code freeze at creation (already per-outlet prefix — verify)

### B2. Services depth — `docs/modules/06-services.md`
- [ ] Service packages / bundles
- [ ] Variants (duration/price tiers)
- [ ] Per-outlet pricing overrides
- [ ] Pricing rules (time-of-day, promo)
- [ ] Service category management polish

### B3. Inventory — `docs/modules/07-inventory.md`  ✓ COMPLETE (incl. per-outlet)
- [x] Product master — three-kind catalog (product / consumable / medication) shipped 2026-04-15; Brands / Categories / Suppliers / UoMs as full lookup tables
- [x] Stock movements (in / out / adjustment) — `inventory_movements` ledger live since 2026-04-15. Live ledger view in Stock Details dialog (2026-05-06), outlet-scoped. Stock Adjustment dialog with kumodent-aligned reasons (2026-05-06)
- [x] Deduction on sale (link product to service) — `service_inventory_items` BOM (2026-04-17) + `collect_appointment_payment` / `collect_walkin_sale` / `void_sales_order` RPCs deduct from `inventory_item_outlets.stock` per outlet and emit movements stamped with `outlet_id` (`sale`, `service_use`, `cancellation` reasons)
- [x] Low-stock surface on dashboard — `LowStockCard` reads per-outlet stock_status from `inventory_item_outlets` (2026-05-06)
- [x] **Per-outlet pricing + stock + alert + location + sellable** — `inventory_item_outlets` junction (2026-05-06). Item form's "Outlets" section + "Apply above prices, stocks to all outlets" master toggle, kumodent-style. Auto-seed triggers handle new items + new outlets
- [x] `discount_cap` enforcement on sale — UI + service guard + DB trigger `sale_items_enforce_discount_cap` (2026-05-06)
- [ ] Defer to dedicated workflow modules (Phase 2): Purchase Orders, Stock Request, Transfer Orders, Returned Stock, Coverage Payor, Loyalty BP/Points

### B4. Employees — `docs/modules/08-employees.md`
- [x] Admin password + PIN reset on employee row — **shipped 2026-05-06.** `KeyRound` row action opens `ResetCredentialsDialog` with three flows: set new password directly (`adminSetPasswordAction`), generate copy-paste recovery link (`resetPasswordAction`), set new 6-digit PIN (`adminSetPinAction`). Brand-scoped service helpers verify employee ownership before writing.
- [ ] Employee PIN (login / clock-in auth)
- [ ] Clock in / clock out
- [ ] Commission rules (per-service, per-category, per-employee)
- [ ] Commission calculation on payment
- [ ] Payslip generation
- [ ] Leave management

---

## Phase C — Surface & peripherals

### C1. Reports / Dashboard
- [~] **Infra landed (2026-05-11):** `components/dashboard/` (KpiTile,
  ChartCard, OutletComparison/SalesMix/TimeSeries/WoW charts,
  BirthdaysCard, LowStockCard, DashboardRemindersCard) +
  `lib/services/dashboard.ts`. Remaining is data wiring and copy:
- [ ] Daily takings
- [ ] Appointments summary
- [ ] Sales by service / employee / outlet
- [ ] Outstanding balances
- [ ] Commission payable
- [ ] Dashboard KPI tiles fed by real queries (currently scaffolding)

### C2. Webstore
- [ ] Public booking flow (services → slot → customer → confirm)
- [ ] Public customer self-service (reschedule / cancel)
- [ ] Webstore → appointment creation wiring

### C3. Config polish — `docs/modules/12-config.md`
- [ ] Outlets CRUD polish (`docs/modules/12.9-outlets.md`)
- [ ] Rooms per outlet
- [ ] Business hours / blackout dates
- [ ] Tax / currency settings
- [ ] Receipt / invoice template config

### C4. Passcode hardening — `docs/modules/09-passcode.md`
- [ ] Passcode scopes (void, refund, discount override, admin)
- [ ] Audit trail on passcode-gated actions

---

## Phase D — Messaging stack (wa-crm seam)

Lives in a separate repo; thin Socket.IO integration. Do last so core
churn doesn't invalidate it.

### D1. Conversations — `docs/modules/11-conversations.md`
- [x] **Chats UI shipped (2026-05-09):** `components/chats/`
  (ChatWindow, ChatList, MessageInput, ContactInfoSheet, QRScreen,
  multi-WA hook, push notifications). Pure Socket.IO; no big-app DB
  writes. `components/inbox/` thread + composer also shipped.
- [ ] Chats polish (labels from wa-crm, pinned, archived)
- [ ] Chat → customer link (match by phone)
- [ ] Decide mirror-table plan (currently deferred per CLAUDE.md)

### D2. CRM — `docs/modules/13-crm.md`
- [ ] Business-relationship CRM on `customers` (notes, follow-ups, tags)
- [ ] Keep chat-originated CRM in wa-crm

### D3. Automations — `docs/modules/14-automations.md`
- [~] **Builder scaffold shipped:** `components/automations/`
  (WorkflowBuilder, FolderTabs, TemplatesGallery, NewWorkflowDialog,
  AutomationExecutionLog). UI exists; engine wiring still open.
- [ ] Decide engine location (wa-crm vs big-app)
- [ ] Appointment reminder send (T-24h, T-2h)
- [ ] Post-visit follow-up
- [ ] Birthday / recall campaigns
- [ ] Single `notifications.ts` seam in big-app calling wa-crm send endpoint

---

## Phase E — Infra

### E1. Auth & RLS tightening
- [x] **RBAC/permissions enforcement (2026-05-08):** granular
  `hasPermission(...)` checks wired through actions and sensitive
  customer/sales/appointment views via `PermissionsProvider` +
  `lib/auth/permissions.ts`. Foundation for per-role RLS later.
- [ ] Drop temp `anon/authenticated all` policies table-by-table
- [ ] Per-role policies (admin / manager / staff / customer)
- [ ] Auth email change polish (see memory `project_auth_email_change`)

### E2. Multi-tenant
- [x] **Outlet-scoped routing (2026-05-07):** every app surface moved to
  `/o/[outlet]/...`; ctx carries `outletId`.
- [ ] `brand_id` filtering on reads (currently stamped on write only)
- [ ] Brand switcher in UI
- [ ] Per-brand config / settings isolation

---

## Phase R — Refactor / code-health (added 2026-05-11)

Pre-emptive cleanup before pushing into A2/B1/C1. Mostly mechanical, no
behavior changes. Rule from CLAUDE.md: components > 300 lines should split.
Today: 13 files > 1000 lines, 4 services > 800 lines. Target the worst
ones first.

### R1. Split mega-files (>1000 lines)
Order is "ROI first" — large extractions that unblock downstream reuse.
- [ ] `components/appointments/detail/HistoryPanel.tsx` (1705) — extract
  `BillingRow`, `NoteRow`, `FollowUpRow` rows; move date/currency
  formatters to `lib/utils/`.
- [ ] `components/sales/NewSaleDialog.tsx` (1349) — extract
  `WalkInCartSection`, `PaymentFormSection`, `CustomerPicker`.
- [ ] `components/customers/CustomerDetailView.tsx` (1287) — inlined
  tabs already have sibling components elsewhere; finish the extraction.
- [ ] `components/sales/SalesOrderDetailDialog.tsx` (1184) — separate
  header / lines / payments / actions blocks.
- [ ] `components/customers/CustomerForm.tsx` (1183) — extract
  `MedicalHistorySection`, `AddressSection`, `ContactSection`.
- [ ] `components/appointments/AppointmentDialog.tsx` (1154) — same
  treatment as NewSaleDialog (sections + helpers).
- [ ] `components/inventory/InventoryOptionsPanel.tsx` (1135) — split
  per-tab.
- [ ] `lib/services/sales.ts` (1109) — extract `_helpers/sales-assert.ts`
  and `_helpers/sales-queries.ts` (select strings, join templates).
- [ ] `components/employees/EmployeeForm.tsx` (1100) — reuse the
  shared form-sections from R3.
- [ ] `components/appointments/detail/CollectPaymentDialog.tsx` (1074).
- [ ] `components/inventory/ItemForm.tsx` (1067).
- [ ] `components/services/ServiceForm.tsx` (1055).
- [ ] `components/chats/ChatWindow.tsx` (1009).

### R2. Shared primitives (currently reinvented)
- [ ] `components/ui/form-dialog.tsx` — the
  `DialogContent + scrollable body + DialogFooter` skeleton appears in
  ~25 places. One wrapper, props `title` / `footer` / children.
- [ ] `components/ui/status-badge.tsx` — replaces ~15 ad-hoc
  badge-with-color blocks for `payment_status`, `appointment_status`,
  `sale_status`.
- [ ] `components/shared/line-item-row.tsx` — appointment, sale, and
  inventory line rows share structure; one generic row.

### R3. Shared form sections
- [ ] `components/shared/form-sections/MedicalHistorySection.tsx`
- [ ] `components/shared/form-sections/AddressSection.tsx`
- [ ] `components/shared/form-sections/ContactSection.tsx`
Used today in `CustomerForm` and `EmployeeForm` independently; should
become single source of truth.

### R4. Service-layer query helpers
- [ ] Audit all 21 services in `lib/services/` for repeated `select(...)`
  string constants and brand-id filter patterns.
- [ ] Extract `lib/services/_helpers/crud-query-builder.ts` (extend
  `lib/supabase/query.ts`) with `withBrandFilter`, common error mapping.
- [ ] Estimated savings: ~30 lines per service, ~600 lines workspace-wide.

### R5. Server-action 10-line-rule violations
Inline permission/auth logic in some actions makes them grow past the
budget. Move into service signatures (services already have ctx with
permissions).
- [ ] `lib/actions/sales.ts` — `collectAppointmentPaymentAction`,
  `collectWalkInSaleAction`, `getNewSaleDataAction` each >20 lines.
- [ ] `lib/actions/appointments.ts` — review for the same pattern.
- [ ] `lib/actions/inventory.ts` — review for the same pattern.

### R6. Documentation hygiene
- [ ] Add a `docs/modules/15-letter-templates.md`,
  `docs/modules/16-e-documents.md`,
  `docs/modules/17-manual-transactions.md` — three modules shipped
  without their deep-dive doc.
- [ ] Refresh `docs/modules/12-config.md` configurable-surface register
  for the brand-scoped remark categories that landed in `699600e`.

---

## Why this order

"Write-path first, read-path second." Every report, sub-tab, and
automation reads from `appointments` + `sales_orders` + `payments` — so
stabilizing those two tables' shape before building dependents avoids
re-doing downstream views when a column name changes. The cost: Reports
and Dashboard look empty longer. If that's demotivating, pull **C1**
forward right after A1.

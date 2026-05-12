# Customer Emergency Contact — Design

Date: 2026-05-12
Scope: `apps/big-app` only
Status: Approved, ready to implement

## Goal

Capture an emergency contact on each customer record. Visible and editable in
the Customer form's **Personal Information** tab. Displayed on the customer
detail view when set.

## Decisions

| Question | Choice | Rationale |
| --- | --- | --- |
| How many contacts per customer? | **One** | Matches the simple use case; columns on `customers`. No child table. |
| Relationship field shape | **Brand-config registry dropdown** | Same pattern as customer tags / salutations. Editable per brand. |
| Required vs optional | **All optional** | Matches the rest of the customer form; easy to tighten later. |

## Fields

Three new columns on `public.customers`:

| Column | Type | Notes |
| --- | --- | --- |
| `emergency_contact_name` | `text` nullable | Free text, max 120 chars at the Zod layer |
| `emergency_contact_phone` | `text` nullable | Free text, max 40 chars (mirrors existing `phone` storage — no format validation) |
| `emergency_contact_relationship` | `text` nullable | Stored as a `brand_config_items.code` from the `customer_emergency_relationship` category. Free text is also accepted (same pattern as `customer_tag`). Max 60 chars. |

No CHECK constraints on `relationship` (per CLAUDE.md rule 8 — vocabulary
owned by the brand-config registry, not the DB).

## Implementation pieces

### 1. Migration (via Supabase MCP, no local SQL file)

```sql
alter table public.customers
  add column emergency_contact_name text,
  add column emergency_contact_phone text,
  add column emergency_contact_relationship text;
```

Applied via `mcp__big-supabase__apply_migration`. Existing rows get NULL —
no backfill needed.

After applying: regenerate
[apps/big-app/lib/supabase/types.ts](../../apps/big-app/lib/supabase/types.ts)
via `mcp__big-supabase__generate_typescript_types`.

### 2. Brand-config registry entry (TS-only, no migration)

Add to
[apps/big-app/lib/brand-config/categories.ts](../../apps/big-app/lib/brand-config/categories.ts)
under the "promoted (admin UI live)" block (since it has a real consumer
from day one):

```ts
customer_emergency_relationship: {
  label: "Emergency contact relationships",
  singularLabel: "Relationship",
  codeEditable: true,
  hasColor: false,
  hint: "Options shown in the customer emergency contact picker.",
  storage: "live",
  usage: {
    description:
      "Relationship picker on the customer form's emergency contact block.",
    wired: true,
    consumer: "components/customers/CustomerForm.tsx",
  },
},
```

Default seeds (Spouse, Parent, Child, Sibling, Friend, Other) are NOT
inserted by code — the brand admin populates the list under
Config → Customers. Until they do, the picker renders an empty list and
the user falls back to free-text entry (same behaviour as the tag picker).

### 3. Zod schema

Append three fields to `customerInputSchema` in
[apps/big-app/lib/schemas/customers.ts](../../apps/big-app/lib/schemas/customers.ts):

```ts
// Emergency contact (all optional)
emergency_contact_name: optionalText(120),
emergency_contact_phone: optionalText(40),
emergency_contact_relationship: optionalText(60),
```

`optionalText` already exists in the file and normalizes `""` → `undefined`,
which is what we want.

### 4. Form UI

In
[apps/big-app/components/customers/CustomerForm.tsx](../../apps/big-app/components/customers/CustomerForm.tsx),
at the bottom of the `personal` panel, append a sub-section:

- A divider (`border-t`) plus heading: **Emergency Contact** with
  small "(optional)" tag.
- Three inputs in a `grid grid-cols-1 md:grid-cols-3 gap-3` row:
  - **Name** — plain `<Input>`
  - **Phone** — plain `<Input type="tel">`
  - **Relationship** — single-value brand-config picker reading the
    `customer_emergency_relationship` category. Free-text entries are
    allowed (same UX as the customer-tag picker). If a suitable single-value
    picker doesn't exist yet, build one alongside this work — keep it in
    `components/customers/` so it's co-located with consumers.

Defaults in the `EMPTY` constant and `fromCustomer` helper get the three
new fields set to `null`/`undefined` accordingly.

### 5. Customer detail view

In
[apps/big-app/components/customers/CustomerDetailView.tsx](../../apps/big-app/components/customers/CustomerDetailView.tsx),
in the personal info section, render an **Emergency Contact** row only
when at least one of the three fields is non-null/non-empty.

Format: `Name (Relationship) — Phone`, with the phone wrapped as
`<a href="tel:...">`. Missing parts collapse gracefully (e.g. just
`Phone` if only phone is set).

### 6. Service layer

[apps/big-app/lib/services/customers.ts](../../apps/big-app/lib/services/customers.ts)
already passes the validated Zod payload through to the Supabase
`upsert`/`update` call. Including the three new fields in the payload is
the only change. No new RPC. No transactional concerns.

## Out of scope

- Multiple contacts / primary + secondary slots
- Phone format validation (the main `phone` field is also unvalidated;
  changing both is a separate task)
- Required-field rules
- Surfacing emergency contact on appointment, billing, or printable
  surfaces (can be added later by reading the same columns)
- An audit trail for emergency-contact edits (no separate history table)
- CHECK constraints (vocabulary lives in TS/brand-config)

## Risks / open questions

None blocking. Two minor notes:

- If we later decide a customer can have multiple emergency contacts,
  we migrate to a child table — the three columns become "primary" or
  get dropped after backfill. Cheap to revisit.
- The single-value brand-config picker may need to be built; the multi
  picker (`CustomerTagsPicker`) is close in shape and is the reference.

# Repayment History Design

## Goal

Replace the bill-level cumulative payment fields with an independent repayment history so partial, minimum, installment, and multi-stage repayments can be recorded, edited, and deleted without losing financial detail.

The feature must preserve all existing cards, shared credit accounts, monthly bills, fee records, loyalty accounts, reminders, backup data, and cloud data.

## Current Problem

Each bill currently stores only one cumulative `paidAmount`, one `paidDate`, and one `repaymentMethod`. This creates several limitations:

- Multiple repayments cannot retain their individual dates, amounts, methods, or notes.
- Editing the cumulative amount overwrites history.
- Deleting one mistaken repayment is impossible.
- `标记还清` mutates the bill instead of recording a financial event.
- Dashboard totals, bill status, and reminders depend on mutable duplicate payment state.

## Scope

This iteration adds repayment records, repayment entry and history interfaces, legacy migration, derived bill calculations, deletion rules, backup support, and cloud synchronization.

The following remain unchanged:

- Credit-limit and shared-credit-account calculations.
- Bill amount, minimum payment, due date, statement month, and bill note semantics.
- Fee-record calculations and fee-dashboard filters.
- Loyalty-account calculations.
- The one-row-per-user Supabase snapshot architecture and its RLS policies.

## Data Model

Add a `repayments` collection persisted under:

```js
const REPAYMENTS_KEY = "pointsLedger_repayments_v1";
```

Each repayment contains:

- `id`: stable unique identifier.
- `billId`: identifier of the related monthly bill.
- `cardId`: card identifier copied from the bill for filtering and historical context.
- `amount`: positive repayment amount.
- `date`: actual repayment date in `YYYY-MM-DD` format.
- `method`: `full`, `minimum`, `installment`, `partial`, or `other`.
- `note`: optional user note.
- `createdAt`: ISO creation timestamp.
- `updatedAt`: ISO last-update timestamp.

`billId` is the authoritative relationship. `cardId` is denormalized for convenient filtering and remains a historical snapshot if the card is later removed.

## Source Of Truth

Repayment records become the only source of truth for paid and remaining amounts:

```text
paid total = sum of repayments whose billId matches the bill
remaining = max(bill amount - paid total, 0)
```

After migration, bills no longer persist or calculate from `paidAmount`, `paidDate`, or `repaymentMethod`. Those legacy fields are accepted only while importing or migrating version 3 data.

All UI views must use the same repayment model helpers. No dashboard, reminder, bill row, card statement, or export path may recalculate payment totals from legacy bill fields.

## Bill Status Rules

Bill status is derived from bill facts, repayment totals, the due date, and the current local date in this order:

1. `pending / 待出账`: bill amount is not greater than zero.
2. `paid / 已还清`: paid total is greater than or equal to the bill amount.
3. `overdue / 已逾期`: remaining is positive and the due date has passed.
4. `partial / 部分已还`: paid total is positive and remaining is positive.
5. `due / 待还`: bill amount is positive and no repayment has been recorded.

An overdue bill remains `已逾期` after a partial repayment until it is fully paid. This preserves the current urgency behavior.

## Validation Rules

- A repayment requires an existing bill.
- Amount must be finite and greater than zero.
- Date and method are required.
- A new repayment cannot exceed the bill's current remaining amount.
- When editing a repayment, the maximum permitted amount is the current remaining amount plus that repayment's original amount.
- Editing a bill cannot reduce its amount below the bill's current paid total.
- A bill with zero remaining cannot accept another repayment.
- Amount comparisons use normalized two-decimal currency values to avoid floating-point drift.
- The save action is disabled while processing to prevent duplicate submissions.

The app must show a specific inline or toast error, including the maximum permitted amount, instead of silently clamping user-entered repayment amounts.

## Legacy Migration

Advance the local, backup, cloud snapshot, and Supabase schema version from 3 to 4.

For each version 3 bill with `paidAmount > 0` and `amount > 0`, create one migration repayment:

```text
id = deterministic legacy identifier derived from bill.id
billId = bill.id
cardId = bill.cardId
amount = min(max(bill.paidAmount, 0), bill.amount)
date = bill.paidDate, otherwise updatedAt date, otherwise createdAt date, otherwise today
method = bill.repaymentMethod, otherwise full when completely paid, otherwise partial
note = 由旧版累计已还金额迁移
```

If a legacy paid amount exceeds its bill amount, migrate only the bill amount and include the original legacy amount in the migration note. This keeps the new ledger valid while preserving an audit clue.

Migration must be idempotent:

- Use a deterministic migration repayment ID for each bill.
- Do not create the repayment if that ID already exists.
- Strip `paidAmount`, `paidDate`, and `repaymentMethod` from the migrated bill after the repayment is safely created.
- Mark the resulting local state and exported snapshot as schema version 4.
- Importing a version 3 backup or cloud snapshot runs the same migration even when the current browser has already migrated its own local data.

Payloads without a `repayments` array are treated as version 3-compatible input with an empty repayment collection before migration. Version 4 payloads must contain a valid repayments array; malformed version 4 data is rejected before replacing current local state.

## Repayment Entry Interface

Each bill row gains a primary `记一笔还款` action. It opens a dedicated repayment drawer consistent with the existing card and bill drawers.

The drawer contains:

- Card name, last four digits, and bill month as read-only context.
- Bill amount, paid total, and remaining amount as read-only summary values.
- Repayment amount, defaulting to the full remaining amount.
- Repayment date, defaulting to today.
- Repayment method selector.
- Optional note.
- Save and cancel actions.

The same drawer edits an existing repayment. In edit mode it shows the existing values and calculates the allowed maximum using the edit rule above.

On phones, the drawer follows the existing full-viewport mobile drawer pattern with a fixed header, independently scrolling body, sticky actions, safe-area spacing, and no horizontal overflow.

## Repayment History Interface

Each bill row contains one compact, collapsed disclosure labeled with the number of repayments, for example `还款流水 2 笔`.

Expanding it shows a divider-based list rather than nested cards. Each repayment row displays:

- Repayment date.
- Amount.
- Method label.
- Optional note.
- Edit action.
- Delete action.

The history is sorted by repayment date descending, then creation time descending. Empty bills do not show an expanded empty panel.

The bill row summary continues to show:

- Bill amount.
- Paid total derived from repayment history.
- Remaining amount.
- Minimum payment.

The bill metadata replaces the old single repayment-method label with the bill month, due date, and repayment count.

## Quick Mark-Paid Action

Keep `标记还清` as a shortcut while the bill has a positive remaining amount.

The action creates one repayment rather than mutating the bill:

- `amount`: exact remaining amount.
- `date`: today.
- `method`: `full`.
- `note`: `快捷标记还清`.

The shortcut is hidden for pending or fully paid bills. A duplicate click must not create an overpayment.

## Bill Form Changes

The bill form remains responsible only for bill facts:

- Card.
- Bill month.
- Bill amount.
- Minimum payment.
- Due date.
- Bill note.

Remove cumulative `已还金额`, `实际还款日`, and the bill-level repayment-method selector after migration. The live bill preview uses existing repayments when editing a bill and shows the resulting status and remaining amount.

## Mutation And Deletion Behavior

After adding, editing, or deleting a repayment, immediately refresh:

- Bill paid total, remaining amount, status, and repayment count.
- Monthly dashboard due, paid, and remaining totals.
- Card and account summaries that display repayment information.
- Due and overdue reminders.
- Backup counts where repayment count is displayed.
- Scheduled cloud synchronization.

Deleting a repayment requires confirmation and can move a bill from `已还清` back to `部分已还`, `待还`, or `已逾期`.

Deleting a bill requires confirmation that names the number of associated repayment records. Confirming deletes the bill and all repayments whose `billId` matches it in one local operation before rendering and scheduling cloud sync.

Deleting a card retains the existing historical-data behavior: fee records, bills, and repayments are not silently deleted merely because their card is no longer active.

## Dashboard And Reminder Integration

For the selected period:

- Bill amount totals continue to come from monthly bills.
- Paid totals come from repayments linked to those bills, regardless of the repayment transaction's calendar month.
- Remaining totals are the sum of each bill's non-negative remaining amount.
- Due and overdue reminders use derived status and remaining amount.

Repayment dates do not change which statement month owns the repayment. A payment made in a later calendar month still reduces the bill to which it is linked.

Credit utilization and available-credit calculations remain unchanged in this iteration and continue to use the existing selected-period bill model.

## Backup And Cloud Sync

Add `repayments` to all state boundaries:

- Full JSON backup export and import.
- `window.ledgerStateApi.exportSnapshot()` and `applySnapshot()`.
- Cloud empty snapshot.
- Meaningful-data detection.
- Local save and restore paths.

Set backup and cloud snapshot `version` to 4 and send `schema_version: 4` to Supabase. Update `supabase/schema.sql` so new rows default to version 4. No new Supabase table or RLS policy is required because repayments remain inside the user's JSON snapshot.

Backward compatibility requirements:

- Version 3 backups remain importable.
- Version 3 cloud snapshots remain loadable and are migrated locally before use.
- A migrated version 4 state is uploaded only through the existing explicit or scheduled synchronization path.
- Import confirmation includes the number of repayment records that will be replaced.

## Implementation Boundary

Create a pure `repayment-model.js` module loaded before `app.js`. It owns normalization, currency rounding, totals, remaining amount, status, create/edit limits, legacy migration, sorting, and bill-cascade helpers.

Keep persistence, drawers, event handling, rendering, reminders, backup, and cloud wiring in `app.js`, `index.html`, `organic-liquid.css`, and `cloud-sync.js`, following the current project structure.

Do not introduce a framework, build step, new runtime dependency, or separate database table.

## Accessibility And Motion

- Disclosure controls expose `aria-expanded` and reference the history container with `aria-controls`.
- Icon-only edit and delete controls have accessible names and tooltips.
- Keyboard focus moves into the repayment drawer when opened and returns to the invoking action when closed.
- Validation messages are available to assistive technology.
- Touch targets follow the existing minimum 44px mobile rule.
- Drawer and disclosure motion respects `prefers-reduced-motion`.

## Verification

Add `tests/repayment-model.test.cjs` covering:

- Summing multiple repayments for one bill without including another bill.
- Two-decimal currency normalization.
- Remaining amount calculation.
- Pending, due, partial, paid, and overdue statuses.
- Overdue status after a partial repayment.
- Create and edit maximum-amount validation.
- Rejecting zero, negative, non-finite, missing-bill, and overpayment inputs.
- Rejecting a bill amount below its paid total.
- Legacy version 3 migration.
- Migration clamping and audit note for an excessive legacy paid amount.
- Migration idempotency.
- Quick mark-paid creating only the exact remaining amount.
- Repayment ordering.
- Bill deletion cascading to only the related repayments.

Add integration and structure checks covering:

- Repayment drawer fields and required attributes.
- Bill form no longer containing cumulative payment fields.
- Bill row repayment action and accessible disclosure.
- Dashboard and reminder calculations using repayment totals.
- Backup and cloud snapshots containing repayments and version 4.
- Version 3 backup and cloud import migration.
- Desktop and mobile drawer/history layout in light and dark themes.
- No horizontal overflow at 390x844, 360x800, and 430x932.

## Acceptance Criteria

- A user can record two or more repayments against one bill and see each one independently.
- Adding, editing, or deleting a repayment produces correct paid, remaining, status, dashboard, and reminder values immediately.
- No normal UI action can overpay a bill or reduce its amount below the paid total.
- `标记还清` creates an auditable repayment for only the remaining amount.
- Existing version 3 payment data appears as repayment history exactly once after migration.
- Full backup and cloud sync round-trip all repayment data without loss.
- Bill deletion removes associated repayments only after explicit confirmation.
- The interaction remains readable and operable on desktop, phone, light theme, and dark theme.

# Shared Credit Accounts Design

## Goal

Represent one bank credit line once even when several physical cards share it, while preserving each card's independent statement, repayment, annual-fee, and transaction history.

## Data Model

Add a `creditAccounts` collection. Each account contains:

- `id`: stable internal identifier.
- `name`: user-facing name such as `浦发共享额度`.
- `fixedLimit`: permanent credit limit.
- `tempLimit`: temporary total limit, not an increment above the fixed limit.
- `tempExpiry`: temporary-limit expiry date.
- `createdAt` and `updatedAt`.

Each card stores `creditAccountId`. Card-specific fields remain on the card: name, last four digits, statement day, due day, annual-fee policy, annual-fee type, and annual target.

## Financial Rules

- Total granted credit is the sum of unique credit-account totals.
- An account total is `max(fixedLimit, tempLimit)`.
- Account usage for a selected month is the sum of monthly bill amounts for all cards linked to that account.
- Available credit is `max(account total - account usage, 0)`.
- Cash-out amounts remain analytical children of bill consumption and are never added to usage again.
- Statements and repayments remain card-specific.

## Card Workflow

The card drawer gains an `额度归属` selector and an `额度账户名称` field.

- `创建新的额度账户` creates a new independent account using the entered limits.
- Selecting an existing account links the card to that account and loads the account limits for editing.
- Editing a second card and selecting the first card's account merges their credit lines without adding the two old limits together.
- If a card leaves an account and no cards remain linked to it, the orphan account is removed.

## Display

Each card remains a separate row. Its limit section shows the linked account name and whether the account is shared. Cards in the same account display the same account usage, available credit, and usage rate. Dashboard and card-summary totals count each account once.

## Migration

Data schema version advances from 2 to 3.

- Each legacy card without `creditAccountId` receives a new account initialized from that card's existing limit fields.
- Existing cards, bills, fee records, and loyalty data keep their identifiers.
- Legacy card limit fields remain readable during migration but the credit account becomes the source of truth.
- Backups and cloud snapshots include `creditAccounts`; imports without it are migrated automatically.

## Security And Sync

The existing per-user `ledger_state` RLS model remains unchanged. The JSON snapshot and database `schema_version` advance to 3. No new public table is required.

## Verification

- Unit-test account totals, migration, shared usage, and orphan cleanup.
- Create two cards with separate accounts and merge the second into the first.
- Register separate monthly bills and confirm pool usage equals their sum.
- Confirm dashboard total counts the shared limit once.
- Confirm backup/cloud snapshots contain the account collection.
- Verify desktop and mobile layouts and both color themes.


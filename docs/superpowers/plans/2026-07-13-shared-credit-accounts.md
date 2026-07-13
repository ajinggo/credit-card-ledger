# Shared Credit Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared credit-line accounts so multiple cards can share one limit without double-counting total credit or available credit.

**Architecture:** Put pure account migration and usage calculations in `credit-account-model.js`, exposed to the existing classic browser script and CommonJS tests. Integrate the account collection into card editing, dashboard calculations, reminders, backups, and Supabase JSON snapshots while preserving card-level bills and records.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner, Local Storage, Supabase JSONB snapshots

---

### Task 1: Credit-account model

**Files:**
- Create: `credit-account-model.js`
- Create: `tests/credit-account-model.test.cjs`

- [x] Write failing tests for unique totals, two-card pooled usage, legacy-card migration, and orphan removal.
- [x] Run `node --test tests/credit-account-model.test.cjs` and confirm the tests fail because the module does not exist.
- [x] Implement `accountTotal`, `usageForAccount`, `migrateCreditAccounts`, and `removeOrphanAccounts`.
- [x] Run the tests and confirm all model tests pass.

### Task 2: Local data and cloud snapshots

**Files:**
- Modify: `app.js`
- Modify: `cloud-sync.js`
- Modify: `supabase/schema.sql`
- Modify: `index.html`

- [x] Load and save `creditAccounts` under `pointsLedger_credit_accounts_v1`.
- [x] Run version-3 migration before bill and record migration.
- [x] Include accounts in local backups, imports, cloud exports, and cloud imports.
- [x] Advance client and database schema versions to 3.
- [x] Load `credit-account-model.js` before `app.js`.

### Task 3: Card form and calculations

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `organic-liquid.css`

- [x] Add account selector and account-name controls to the card drawer.
- [x] Populate account controls for new cards and existing cards.
- [x] Save account changes and remove orphan accounts after reassignment or deletion.
- [x] Calculate card usage from all bills in the linked account.
- [x] Deduplicate dashboard totals, temporary-limit reminders, and card-summary totals.
- [x] Label shared and independent accounts in card rows and the card summary.

### Task 4: Verification and publication

**Files:**
- Modify: `README.md`
- Verify: all changed runtime files

- [x] Run model, toast, syntax, and whitespace checks.
- [x] Verify two cards sharing one account in the real browser at desktop and mobile sizes.
- [x] Confirm two card bills sum into one pool usage and the dashboard counts the limit once.
- [x] Commit, merge to `main`, push GitHub, deploy Vercel, and verify production assets.

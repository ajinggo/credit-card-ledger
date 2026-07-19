# Repayment History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cumulative bill payment fields with an auditable repayment history that supports multiple payments, editing, deletion, derived bill status, safe version-3 migration, backup, and cloud synchronization.

**Architecture:** Add a UMD-style pure `repayment-model.js` beside the existing account and sorting models, then make `app.js` the integration layer for persistence, migration orchestration, drawers, rendering, reminders, and snapshots. Keep repayments inside the existing local-storage and Supabase JSON snapshot architecture, advance all data boundaries to schema version 4, and retain the current static HTML/CSS/vanilla-JavaScript stack.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner, Local Storage, Supabase JSONB snapshots, in-app browser verification

---

## File Map

- `repayment-model.js`: pure currency, totals, status, validation, sorting, quick-payment, migration, and cascade helpers. It must not access DOM, Local Storage, time globals, or Supabase directly.
- `tests/repayment-model.test.cjs`: executable unit coverage for every financial and migration rule.
- `tests/repayment-state.test.mjs`: source-contract coverage for local persistence, version-4 backup/cloud boundaries, and the removal of runtime reliance on bill-level paid fields.
- `tests/repayment-ui.test.mjs`: source-contract coverage for the repayment drawer, bill-row actions, accessible history disclosure, responsive styling, and asset cache versions.
- `index.html`: remove cumulative payment controls from the bill form, add the repayment drawer, add the repayment backup count, and load the model before `app.js`.
- `app.js`: load/save repayments, orchestrate migration, derive bill state, validate bill edits, implement repayment CRUD, render history, update reminders/dashboard/statements, and include repayments in every snapshot.
- `organic-liquid.css`: add one final `Repayment History V83` layer for the drawer and divider-based history in desktop, phone, light, dark, and reduced-motion modes.
- `cloud-sync.js`: create and upload version-4 snapshots containing repayments.
- `supabase/schema.sql`: set the JSON snapshot schema default to 4 without adding a table or changing RLS.
- Existing source-contract tests: update only their cache/build assertions from CSS 81/app 73 to CSS 83/app 75.

### Task 1: Build The Pure Repayment Model

**Files:**
- Create: `repayment-model.js`
- Create: `tests/repayment-model.test.cjs`

- [ ] **Step 1: Write the complete failing model contract**

Create `tests/repayment-model.test.cjs`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeCurrency,
  isDateOnly,
  paidTotal,
  remainingAmount,
  statusForBill,
  maximumRepaymentAmount,
  validateRepayment,
  validateBillAmount,
  createMarkPaidRepayment,
  sortForBill,
  removeForBill,
  legacyRepaymentId,
  migrateLegacyBills,
} = require("../repayment-model.js");

const bill = {
  id: "bill-2026-07",
  cardId: "card-a",
  amount: 1000,
  dueDate: "2026-07-20",
};

const payments = [
  { id: "p-1", billId: bill.id, cardId: bill.cardId, amount: 300, date: "2026-07-10", createdAt: "2026-07-10T08:00:00.000Z" },
  { id: "p-2", billId: bill.id, cardId: bill.cardId, amount: 200, date: "2026-07-12", createdAt: "2026-07-12T08:00:00.000Z" },
  { id: "other", billId: "bill-other", cardId: "card-b", amount: 900, date: "2026-07-01", createdAt: "2026-07-01T08:00:00.000Z" },
];

test("normalizes currency to two decimals without carrying floating-point noise", () => {
  assert.equal(normalizeCurrency(0.1 + 0.2), 0.3);
  assert.equal(normalizeCurrency("12.345"), 12.35);
  assert.equal(normalizeCurrency(Number.POSITIVE_INFINITY), 0);
  assert.equal(normalizeCurrency(Number.MAX_VALUE), 0);
  assert.equal(isDateOnly("2026-02-28"), true);
  assert.equal(isDateOnly("2026-02-31"), false);
});

test("sums only repayments linked to the requested bill", () => {
  assert.equal(paidTotal(payments, bill.id), 500);
  assert.equal(remainingAmount(bill, payments), 500);
});

test("attributes a later-calendar-month repayment to its linked statement bill", () => {
  const laterPayment = { id: "later", billId: bill.id, amount: 125, date: "2026-08-03" };
  assert.equal(paidTotal([...payments, laterPayment], bill.id), 625);
  assert.equal(remainingAmount(bill, [...payments, laterPayment]), 375);
});

test("derives pending, due, partial, paid, and overdue statuses", () => {
  assert.equal(statusForBill({ bill: { ...bill, amount: 0 }, repayments: [], today: "2026-07-19" }).key, "pending");
  assert.equal(statusForBill({ bill, repayments: [], today: "2026-07-19" }).key, "due");
  assert.equal(statusForBill({ bill, repayments: [payments[0]], today: "2026-07-19" }).key, "partial");
  assert.equal(statusForBill({ bill, repayments: [{ ...payments[0], amount: 1000 }], today: "2026-07-19" }).key, "paid");
  assert.equal(statusForBill({ bill, repayments: [payments[0]], today: "2026-07-21" }).key, "overdue");
});

test("calculates different maximums for a new payment and an edited payment", () => {
  assert.equal(maximumRepaymentAmount({ bill, repayments: payments }), 500);
  assert.equal(maximumRepaymentAmount({ bill, repayments: payments, repaymentId: "p-1" }), 800);
});

test("validates required fields and rejects overpayment", () => {
  assert.equal(validateRepayment({ bill: null, repayments: [], repayment: {} }).code, "missing-bill");
  assert.equal(validateRepayment({ bill, repayments: payments, repayment: { amount: 0, date: "2026-07-19", method: "partial" } }).code, "invalid-amount");
  assert.equal(validateRepayment({ bill, repayments: payments, repayment: { amount: Number.NaN, date: "2026-07-19", method: "partial" } }).code, "invalid-amount");
  assert.equal(validateRepayment({ bill, repayments: payments, repayment: { amount: 100, date: "", method: "partial" } }).code, "invalid-date");
  assert.equal(validateRepayment({ bill, repayments: payments, repayment: { amount: 100, date: "2026-02-31", method: "partial" } }).code, "invalid-date");
  assert.equal(validateRepayment({ bill, repayments: payments, repayment: { amount: 100, date: "2026-07-19", method: "unknown" } }).code, "invalid-method");
  const overpayment = validateRepayment({ bill, repayments: payments, repayment: { amount: 500.01, date: "2026-07-19", method: "partial" } });
  assert.equal(overpayment.code, "overpayment");
  assert.equal(overpayment.maximum, 500);
  assert.deepEqual(
    validateRepayment({ bill, repayments: payments, repayment: { amount: 500, date: "2026-07-19", method: "partial" } }),
    { ok: true, amount: 500, maximum: 500 },
  );
});

test("prevents reducing a bill below its paid total", () => {
  assert.deepEqual(
    validateBillAmount({ billId: bill.id, amount: 499.99, repayments: payments }),
    { ok: false, code: "below-paid", minimum: 500 },
  );
  assert.deepEqual(
    validateBillAmount({ billId: bill.id, amount: 500, repayments: payments }),
    { ok: true, amount: 500, minimum: 500 },
  );
});

test("quick mark-paid creates only the exact remaining amount", () => {
  assert.deepEqual(
    createMarkPaidRepayment({
      bill,
      repayments: payments,
      id: "p-final",
      date: "2026-07-19",
      now: "2026-07-19T10:00:00.000Z",
    }),
    {
      id: "p-final",
      billId: bill.id,
      cardId: bill.cardId,
      amount: 500,
      date: "2026-07-19",
      method: "full",
      note: "快捷标记还清",
      createdAt: "2026-07-19T10:00:00.000Z",
      updatedAt: "2026-07-19T10:00:00.000Z",
    },
  );
  assert.equal(createMarkPaidRepayment({ bill: { ...bill, amount: 500 }, repayments: payments, id: "none", date: "2026-07-19", now: "2026-07-19T10:00:00.000Z" }), null);
});

test("sorts one bill's history by date and creation time descending", () => {
  const ordered = sortForBill([
    ...payments,
    { id: "p-3", billId: bill.id, amount: 10, date: "2026-07-12", createdAt: "2026-07-12T12:00:00.000Z" },
  ], bill.id);
  assert.deepEqual(ordered.map((item) => item.id), ["p-3", "p-2", "p-1"]);
});

test("bill cascade removes only related repayments", () => {
  assert.deepEqual(removeForBill(payments, bill.id).map((item) => item.id), ["other"]);
});

test("migrates one legacy cumulative payment and strips legacy bill fields", () => {
  const legacyBill = {
    ...bill,
    paidAmount: 400,
    paidDate: "2026-07-15",
    repaymentMethod: "partial",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  };
  const result = migrateLegacyBills({
    bills: [legacyBill],
    repayments: [],
    today: "2026-07-19",
    now: "2026-07-19T10:00:00.000Z",
  });
  assert.equal(result.changed, true);
  assert.equal(result.repayments.length, 1);
  assert.equal(result.repayments[0].id, legacyRepaymentId(bill.id));
  assert.equal(result.repayments[0].amount, 400);
  assert.equal(result.repayments[0].date, "2026-07-15");
  assert.equal(result.repayments[0].method, "partial");
  assert.equal(result.repayments[0].note, "由旧版累计已还金额迁移");
  assert.equal("paidAmount" in result.bills[0], false);
  assert.equal("paidDate" in result.bills[0], false);
  assert.equal("repaymentMethod" in result.bills[0], false);
});

test("clamps excessive legacy paid amounts and keeps an audit note", () => {
  const result = migrateLegacyBills({
    bills: [{ ...bill, paidAmount: 1200, updatedAt: "2026-07-18T09:00:00.000Z" }],
    repayments: [],
    today: "2026-07-19",
    now: "2026-07-19T10:00:00.000Z",
  });
  assert.equal(result.repayments[0].amount, 1000);
  assert.equal(result.repayments[0].date, "2026-07-18");
  assert.equal(result.repayments[0].method, "full");
  assert.match(result.repayments[0].note, /原累计 1200/);
  assert.match(result.repayments[0].note, /账单金额 1000/);
});

test("falls back to today and infers partial method for sparse legacy data", () => {
  const result = migrateLegacyBills({
    bills: [{ ...bill, paidAmount: 125 }],
    repayments: [],
    today: "2026-07-19",
    now: "2026-07-19T10:00:00.000Z",
  });
  assert.equal(result.repayments[0].date, "2026-07-19");
  assert.equal(result.repayments[0].method, "partial");
});

test("legacy migration is idempotent", () => {
  const first = migrateLegacyBills({
    bills: [{ ...bill, paidAmount: 300, paidDate: "2026-07-10" }],
    repayments: [],
    today: "2026-07-19",
    now: "2026-07-19T10:00:00.000Z",
  });
  const second = migrateLegacyBills({
    bills: first.bills,
    repayments: first.repayments,
    today: "2026-07-19",
    now: "2026-07-19T10:00:00.000Z",
  });
  assert.equal(second.changed, false);
  assert.deepEqual(second, { ...first, changed: false });
});
```

- [ ] **Step 2: Run the test and verify the intended failure**

Run:

```bash
node --test tests/repayment-model.test.cjs
```

Expected: FAIL with `Cannot find module '../repayment-model.js'`.

- [ ] **Step 3: Implement the pure model**

Create `repayment-model.js`:

```js
(function initializeRepaymentModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RepaymentModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRepaymentModel() {
  const supportedMethods = new Set(["full", "minimum", "installment", "partial", "other"]);
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  function normalizeCurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    const rounded = Math.round((number + Number.EPSILON) * 100) / 100;
    return Number.isFinite(rounded) ? rounded : 0;
  }

  const toCents = (value) => Math.round(normalizeCurrency(value) * 100);
  const fromCents = (value) => value / 100;
  const sourceList = (value) => Array.isArray(value) ? value : [];

  function isDateOnly(value) {
    const text = String(value || "");
    if (!datePattern.test(text)) return false;
    const [year, month, day] = text.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day;
  }

  function paidTotal(repayments, billId) {
    const cents = sourceList(repayments).reduce((total, repayment) => {
      if (!billId || repayment?.billId !== billId) return total;
      return total + Math.max(toCents(repayment.amount), 0);
    }, 0);
    return fromCents(cents);
  }

  function remainingAmount(bill, repayments) {
    const amountCents = Math.max(toCents(bill?.amount), 0);
    const paidCents = toCents(paidTotal(repayments, bill?.id));
    return fromCents(Math.max(amountCents - paidCents, 0));
  }

  function statusForBill({ bill, repayments, today }) {
    const amount = Math.max(normalizeCurrency(bill?.amount), 0);
    const paid = paidTotal(repayments, bill?.id);
    if (!(amount > 0)) return { key: "pending", label: "待出账", tone: "muted" };
    if (paid >= amount) return { key: "paid", label: "已还清", tone: "success" };
    if (bill?.dueDate && today && bill.dueDate < today) return { key: "overdue", label: "已逾期", tone: "danger" };
    if (paid > 0) return { key: "partial", label: "部分已还", tone: "warning" };
    return { key: "due", label: "待还", tone: "info" };
  }

  function maximumRepaymentAmount({ bill, repayments, repaymentId = "" }) {
    const original = sourceList(repayments).find((item) => item.id === repaymentId && item.billId === bill?.id);
    return normalizeCurrency(remainingAmount(bill, repayments) + Math.max(normalizeCurrency(original?.amount), 0));
  }

  function validateRepayment({ bill, repayments, repayment }) {
    if (!bill?.id) return { ok: false, code: "missing-bill", maximum: 0 };
    const rawAmount = Number(repayment?.amount);
    const amount = normalizeCurrency(rawAmount);
    const maximum = maximumRepaymentAmount({ bill, repayments, repaymentId: repayment?.id || "" });
    if (!Number.isFinite(rawAmount) || !(amount > 0)) return { ok: false, code: "invalid-amount", maximum };
    if (!isDateOnly(repayment?.date)) return { ok: false, code: "invalid-date", maximum };
    if (!supportedMethods.has(repayment?.method)) return { ok: false, code: "invalid-method", maximum };
    if (toCents(amount) > toCents(maximum)) return { ok: false, code: "overpayment", maximum };
    return { ok: true, amount, maximum };
  }

  function validateBillAmount({ billId, amount, repayments }) {
    const rawAmount = Number(amount);
    const normalized = normalizeCurrency(rawAmount);
    const minimum = paidTotal(repayments, billId);
    if (!Number.isFinite(rawAmount) || normalized < 0) return { ok: false, code: "invalid-amount", minimum };
    if (toCents(normalized) < toCents(minimum)) return { ok: false, code: "below-paid", minimum };
    return { ok: true, amount: normalized, minimum };
  }

  function createMarkPaidRepayment({ bill, repayments, id, date, now }) {
    const amount = remainingAmount(bill, repayments);
    if (!bill?.id || !(amount > 0)) return null;
    return {
      id,
      billId: bill.id,
      cardId: bill.cardId || "",
      amount,
      date,
      method: "full",
      note: "快捷标记还清",
      createdAt: now,
      updatedAt: now,
    };
  }

  function sortForBill(repayments, billId) {
    return sourceList(repayments)
      .filter((item) => item.billId === billId)
      .slice()
      .sort((left, right) => String(right.date || "").localeCompare(String(left.date || ""))
        || String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
        || String(right.id || "").localeCompare(String(left.id || "")));
  }

  function removeForBill(repayments, billId) {
    return sourceList(repayments).filter((item) => item.billId !== billId);
  }

  const legacyRepaymentId = (billId) => `legacy-repayment:${billId}`;

  function migrationDate(bill, fallback) {
    const candidates = [bill?.paidDate, String(bill?.updatedAt || "").slice(0, 10), String(bill?.createdAt || "").slice(0, 10), fallback];
    return candidates.find((value) => isDateOnly(value)) || fallback;
  }

  function migrateLegacyBills({ bills, repayments, today, now }) {
    const sourceBills = sourceList(bills);
    const sourceRepayments = sourceList(repayments);
    let changed = !Array.isArray(bills) || !Array.isArray(repayments);
    const nextRepayments = sourceRepayments.map((repayment) => {
      const amount = normalizeCurrency(repayment?.amount);
      if (amount !== repayment?.amount) changed = true;
      return { ...repayment, amount };
    });
    const repaymentIds = new Set(nextRepayments.map((item) => item.id).filter(Boolean));

    const nextBills = sourceBills.map((sourceBill) => {
      const bill = { ...sourceBill };
      const rawPaid = Number(bill.paidAmount || 0);
      const amount = Math.max(normalizeCurrency(bill.amount), 0);
      const migrationId = bill.id ? legacyRepaymentId(bill.id) : "";
      if (migrationId && Number.isFinite(rawPaid) && rawPaid > 0 && amount > 0 && !repaymentIds.has(migrationId)) {
        const normalizedLegacyPaid = Math.max(normalizeCurrency(rawPaid), 0);
        const migratedAmount = Math.min(normalizedLegacyPaid, amount);
        const overflowed = normalizedLegacyPaid > amount;
        const method = supportedMethods.has(bill.repaymentMethod)
          ? bill.repaymentMethod
          : migratedAmount >= amount ? "full" : "partial";
        nextRepayments.push({
          id: migrationId,
          billId: bill.id,
          cardId: bill.cardId || "",
          amount: migratedAmount,
          date: migrationDate(bill, today),
          method,
          note: overflowed
            ? `由旧版累计已还金额迁移（原累计 ${normalizedLegacyPaid}，按账单金额 ${amount} 迁移）`
            : "由旧版累计已还金额迁移",
          createdAt: bill.updatedAt || bill.createdAt || now,
          updatedAt: now,
        });
        repaymentIds.add(migrationId);
        changed = true;
      }
      ["paidAmount", "paidDate", "repaymentMethod"].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(bill, key)) {
          delete bill[key];
          changed = true;
        }
      });
      return bill;
    });

    return { bills: nextBills, repayments: nextRepayments, changed };
  }

  return Object.freeze({
    normalizeCurrency,
    isDateOnly,
    paidTotal,
    remainingAmount,
    statusForBill,
    maximumRepaymentAmount,
    validateRepayment,
    validateBillAmount,
    createMarkPaidRepayment,
    sortForBill,
    removeForBill,
    legacyRepaymentId,
    migrateLegacyBills,
  });
});
```

- [ ] **Step 4: Run the focused model tests**

Run:

```bash
node --test tests/repayment-model.test.cjs
```

Expected: 14 tests PASS and 0 tests FAIL.

- [ ] **Step 5: Commit the model**

```bash
git add repayment-model.js tests/repayment-model.test.cjs
git commit -m "feat: add repayment history model"
```

### Task 2: Lock Version-4 State And Runtime Contracts

**Files:**
- Create: `tests/repayment-state.test.mjs`

- [ ] **Step 1: Write the failing state contract**

Create `tests/repayment-state.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const cloudSync = await readFile(new URL("cloud-sync.js", root), "utf8");
const schemaSql = await readFile(new URL("supabase/schema.sql", root), "utf8");
const migrationFunctionIndex = appJs.indexOf("function migrateDataModel()");
const initialMigrationCallIndex = appJs.indexOf("migrateDataModel();", migrationFunctionIndex);
const runtimeAfterMigration = appJs.slice(initialMigrationCallIndex + "migrateDataModel();".length);

test("repayment model loads before the application", () => {
  const modelIndex = indexHtml.indexOf("repayment-model.js?v=1");
  const appIndex = indexHtml.indexOf("app.js?v=");
  assert.ok(modelIndex > -1 && appIndex > modelIndex);
  assert.match(appJs, /const RepaymentModel = window\.RepaymentModel/);
});

test("local state persists an independent repayment collection", () => {
  assert.match(appJs, /const REPAYMENTS_KEY = "pointsLedger_repayments_v1"/);
  assert.match(appJs, /const SCHEMA_KEY = "pointsLedger_schema_v4"/);
  assert.match(appJs, /let repayments = load\(REPAYMENTS_KEY\)/);
  assert.match(appJs, /if \(!Array\.isArray\(repayments\)\) repayments = \[\]/);
  assert.match(appJs, /function saveRepayments\(\)[\s\S]*localStorage\.setItem\(REPAYMENTS_KEY, JSON\.stringify\(repayments\)\)/);
  assert.match(appJs, /RepaymentModel\.migrateLegacyBills\(/);
  assert.match(appJs, /localStorage\.setItem\(SCHEMA_KEY, "4"\)/);
});

test("normal bill runtime derives paid, remaining, and status from repayments", () => {
  assert.match(appJs, /function billPaidTotal\(bill\)[\s\S]*RepaymentModel\.paidTotal\(repayments, bill\?\.id\)/);
  assert.match(appJs, /function billRemaining\(bill\)[\s\S]*RepaymentModel\.remainingAmount\(bill, repayments\)/);
  assert.match(appJs, /function billStatus\(bill\)[\s\S]*RepaymentModel\.statusForBill\(\{ bill, repayments, today: today\(\) \}\)/);
  assert.doesNotMatch(runtimeAfterMigration, /\.(?:paidAmount|paidDate|repaymentMethod)\b/);
});

test("full backup and cloud snapshots include repayments at version 4", () => {
  assert.ok((appJs.match(/data:\s*\{[^}]*repayments/gs) || []).length >= 2);
  assert.ok((appJs.match(/version:\s*4/g) || []).length >= 2);
  assert.match(appJs, /const nextData = prepareLedgerPayload\(backup, "credit-card-ledger-backup", "备份文件无效"\)/);
  assert.match(appJs, /const nextData = prepareLedgerPayload\(snapshot, "credit-card-ledger-cloud", "云端账本格式无效"\)/);
  assert.match(appJs, /repayments = nextData\.repayments/);
  assert.match(appJs, /hasMeaningfulData: \(\) => cards\.length \+ bills\.length \+ repayments\.length/);
});

test("cloud and Supabase boundaries use schema version 4", () => {
  assert.match(cloudSync, /version:\s*4/);
  assert.match(cloudSync, /data:\s*\{ cards: \[\], creditAccounts: \[\], bills: \[\], repayments: \[\]/);
  assert.match(cloudSync, /schema_version:\s*4/);
  assert.match(schemaSql, /schema_version smallint not null default 4/);
  assert.match(schemaSql, /alter column schema_version set default 4/);
});
```

- [ ] **Step 2: Run the contract and confirm the intended failures**

Run:

```bash
node --test tests/repayment-state.test.mjs
```

Expected: FAIL because repayment persistence, derived runtime helpers, and schema version 4 are not wired yet.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/repayment-state.test.mjs
git commit -m "test: define repayment state contracts"
```

### Task 3: Integrate Repayments Into Bills, Migration, And Snapshots

**Files:**
- Modify: `index.html:767-771`
- Modify: `app.js:6-19`
- Modify: `app.js:180-228`
- Modify: `app.js:317-327`
- Modify: `app.js:416-428`
- Modify: `app.js:533-584`
- Modify: `app.js:741-786`
- Modify: `app.js:932-1080`
- Modify: `app.js:1310-1355`
- Modify: `app.js:1478-1701`
- Modify: `app.js:1844-1870`
- Modify: `app.js:2307-2361`
- Modify: `index.html:255-306`
- Modify: `index.html:204-230`
- Modify: `cloud-sync.js:70-74`
- Modify: `cloud-sync.js:135-139`
- Modify: `supabase/schema.sql:1-10`
- Test: `tests/repayment-state.test.mjs`
- Test: `tests/repayment-model.test.cjs`

- [ ] **Step 1: Load the model and initialize version-4 repayment state**

Load the model immediately before the other model scripts:

```html
<script src="./repayment-model.js?v=1"></script>
<script src="./credit-account-model.js?v=1"></script>
```

Add and replace the application constants:

```js
const BILLS_KEY = "pointsLedger_bills_v1";
const REPAYMENTS_KEY = "pointsLedger_repayments_v1";
const LOYALTY_KEY = "pointsLedger_loyalty_v1";
const SCHEMA_KEY = "pointsLedger_schema_v4";
const RepaymentModel = window.RepaymentModel;
```

Load, normalize, and save the collection beside `bills`:

```js
let bills = load(BILLS_KEY);
let repayments = load(REPAYMENTS_KEY);
let loyaltyAccounts = load(LOYALTY_KEY);

if (!Array.isArray(bills)) bills = [];
if (!Array.isArray(repayments)) repayments = [];

function saveBills() { localStorage.setItem(BILLS_KEY, JSON.stringify(bills)); window.ledgerCloud?.schedulePush(); }
function saveRepayments() { localStorage.setItem(REPAYMENTS_KEY, JSON.stringify(repayments)); window.ledgerCloud?.schedulePush(); }
```

- [ ] **Step 2: Replace bill calculations with model-backed helpers**

Replace the current `billStatus` and `billRemaining` functions with:

```js
function billPaidTotal(bill) {
  return RepaymentModel.paidTotal(repayments, bill?.id);
}

function billStatus(bill) {
  return RepaymentModel.statusForBill({ bill, repayments, today: today() });
}

function billRemaining(bill) {
  return RepaymentModel.remainingAmount(bill, repayments);
}
```

- [ ] **Step 3: Run legacy repayment migration after existing bill deduplication**

Keep the existing bill normalization and duplicate merge, but do not manufacture legacy payment fields on already migrated version-4 bills. Replace the current `next` normalization with:

```js
const next = {
  ...bill,
  id: bill.id || makeId(),
  amount: Number(bill.amount || 0),
  minimumPayment: Number(bill.minimumPayment || 0),
  createdAt: bill.createdAt || now,
  updatedAt: bill.updatedAt || bill.createdAt || now,
};
if (Object.prototype.hasOwnProperty.call(bill, "paidAmount")) next.paidAmount = Number(bill.paidAmount || 0);
if (Object.prototype.hasOwnProperty.call(bill, "paidDate")) next.paidDate = bill.paidDate || "";
if (Object.prototype.hasOwnProperty.call(bill, "repaymentMethod")) next.repaymentMethod = bill.repaymentMethod || "full";
```

Change the normalization change check to avoid comparing absent legacy fields:

```js
if (!bill.id || next.amount !== bill.amount || next.minimumPayment !== bill.minimumPayment) changed = true;
```

When duplicate bills merge, copy legacy payment state only if either duplicate still has it:

```js
if ("paidAmount" in merged || "paidAmount" in next) {
  merged.paidAmount = Math.max(Number(merged.paidAmount || 0), Number(next.paidAmount || 0));
  merged.paidDate = merged.paidDate || next.paidDate || "";
  merged.repaymentMethod = merged.repaymentMethod || next.repaymentMethod || "full";
}
```

For bills newly created from old fee records, omit `paidAmount`, `paidDate`, and `repaymentMethod`; they are new unpaid bills, not version-3 payment state.

Immediately after assigning `bills = migratedBills`, add:

```js
const repaymentMigration = RepaymentModel.migrateLegacyBills({
  bills,
  repayments,
  today: today(),
  now,
});
bills = repaymentMigration.bills;
repayments = repaymentMigration.repayments;
if (repaymentMigration.changed) changed = true;

if (localStorage.getItem(SCHEMA_KEY) !== "4") {
  localStorage.setItem(SCHEMA_KEY, "4");
  changed = true;
}
if (changed) {
  saveCards();
  saveCreditAccounts();
  saveRecords();
  saveBills();
  saveRepayments();
}
```

Delete the old schema-version-3 block. Do not delete the old `pointsLedger_schema_v3` key; it is harmless historical metadata and is not a calculation source.

- [ ] **Step 4: Make the bill form maintain bill facts only**

Replace the form body between the amount row and note with:

```html
<div class="field-row">
  <label class="field"><span>账单金额 ¥</span><input id="billAmountInput" type="number" min="0" step="0.01" placeholder="银行实际出账金额" /></label>
  <label class="field"><span>最低还款额 ¥</span><input id="billMinimumInput" type="number" min="0" step="0.01" placeholder="最低还款金额" /></label>
</div>
<label class="field"><span>应还日期</span><input id="billDueDateInput" type="date" /></label>
<label class="field"><span>备注</span><textarea id="billNoteInput" rows="2" placeholder="优惠、延期、争议账单或分期说明"></textarea></label>
```

Remove `repaymentMethod`, `paidAmount`, and `paidDate` from `billInputs`. Replace bill draft collection with:

```js
function billDraftFromForm() {
  return {
    id: editingBillId || "",
    cardId: billInputs.cardId.value,
    month: billInputs.month.value,
    amount: n(billInputs.amount),
    minimumPayment: n(billInputs.minimumPayment),
    dueDate: billInputs.dueDate.value || "",
    note: billInputs.note.value.trim(),
  };
}
```

Remove all assignments to the deleted inputs from `openBillDrawer`. Replace `collectBillPayload` with:

```js
function collectBillPayload(existing = null) {
  const card = cardById(billInputs.cardId.value);
  return {
    id: existing?.id || makeId(),
    cardId: card?.id || "",
    cardNameSnapshot: card?.name || existing?.cardNameSnapshot || "",
    month: billInputs.month.value,
    amount: RepaymentModel.normalizeCurrency(n(billInputs.amount)),
    minimumPayment: Math.max(RepaymentModel.normalizeCurrency(n(billInputs.minimumPayment)), 0),
    dueDate: billInputs.dueDate.value || dueDateForBillMonth(card, billInputs.month.value),
    note: billInputs.note.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

Before saving the payload in `saveBillFromForm`, validate its amount and synchronize denormalized repayment card IDs when a bill is reassigned:

```js
const payload = collectBillPayload(existingEditing || duplicate || null);
const amountValidation = RepaymentModel.validateBillAmount({
  billId: payload.id,
  amount: payload.amount,
  repayments,
});
if (!amountValidation.ok) {
  const message = amountValidation.code === "below-paid"
    ? `账单金额不能低于累计已还 ${money(amountValidation.minimum)}`
    : "请输入有效的账单金额";
  showToast(message, "error");
  return;
}
const cardChanged = existingEditing && existingEditing.cardId !== payload.cardId;
if (cardChanged) {
  const now = new Date().toISOString();
  repayments = repayments.map((item) => item.billId === payload.id
    ? { ...item, cardId: payload.cardId, updatedAt: now }
    : item);
  saveRepayments();
}
```

Limit live-status listeners to existing bill fields:

```js
[billInputs.amount, billInputs.minimumPayment, billInputs.dueDate].forEach((input) => {
  input.addEventListener("input", updateBillLiveStatus);
  input.addEventListener("change", updateBillLiveStatus);
});
```

- [ ] **Step 5: Convert every bill consumer to derived repayment totals**

Apply these exact replacements:

```js
// buildReminders()
const paid = billPaidTotal(bill);
const remaining = billRemaining(bill);
// Use paid in the reminder ID:
id: `bill-due:${bill.id}:${bill.dueDate}:${paid}`,

// openStatement()
const paidAmount = Math.min(billPaidTotal(bill), billAmount);

// renderDashboard()
const monthPaidTotal = monthBills.reduce((total, bill) => total + Math.min(billPaidTotal(bill), Number(bill.amount || 0)), 0);
const monthRemainingTotal = monthBills.reduce((total, bill) => total + billRemaining(bill), 0);

// interim renderBills(), before Task 5 replaces the complete row renderer
const interimPaid = Math.min(billPaidTotal(bill), Number(bill.amount || 0));
const interimRepaymentCount = RepaymentModel.sortForBill(repayments, bill.id).length;
row.querySelector(".bill-meta").textContent = `${bill.month || "未设置月份"} · ${bill.dueDate || "未设置应还日"} · ${interimRepaymentCount} 笔还款`;
```

Use this exact fragment for the interim paid metric inside the existing `row.innerHTML` template:

```html
<span><small>已还金额</small><strong>${money(interimPaid)}</strong></span>
```

In the first card-level reminder scan, keep the existing condition but let `billStatus(bill)` use the model-backed helper. In record rows and CSV export, keep the existing `billStatus(linkedBill)` calls unchanged because the helper is now derived.

Delete the now-unused legacy `methodLabel` helper. Task 4 introduces `repaymentMethodLabel` for individual repayment rows, where the label belongs.

- [ ] **Step 6: Make quick mark-paid and bill deletion mutate repayments**

Replace `markBillPaid` with:

```js
function markBillPaid(id) {
  const bill = bills.find((item) => item.id === id);
  if (!bill) return;
  const now = new Date().toISOString();
  const repayment = RepaymentModel.createMarkPaidRepayment({
    bill,
    repayments,
    id: makeId(),
    date: today(),
    now,
  });
  if (!repayment) {
    showToast("该账单当前没有待还金额", "error");
    return;
  }
  const validation = RepaymentModel.validateRepayment({ bill, repayments, repayment });
  if (!validation.ok) {
    showToast("账单金额刚刚发生变化，请重新操作", "error");
    return;
  }
  repayments = [repayment, ...repayments];
  saveRepayments();
  render();
  showToast("已记录剩余金额并标记还清");
}
```

Replace `deleteBill` with:

```js
async function deleteBill(id) {
  const bill = bills.find((item) => item.id === id);
  if (!bill) return;
  const repaymentCount = RepaymentModel.sortForBill(repayments, id).length;
  const suffix = repaymentCount > 0 ? `，并同时删除 ${repaymentCount} 条还款流水` : "";
  if (!(await askConfirm(`确定删除 ${monthDisplay(bill.month)} 的账单${suffix}吗？`))) return;
  bills = bills.filter((item) => item.id !== id);
  repayments = RepaymentModel.removeForBill(repayments, id);
  saveBills();
  saveRepayments();
  render();
  showToast("账单已删除");
}
```

- [ ] **Step 7: Add repayments to full backup and cloud state boundaries**

Add a strict compatibility reader before the backup functions:

```js
function readSnapshotRepayments(snapshot, snapshotBills, errorMessage = "账本格式无效") {
  const version = snapshot?.version === undefined ? 3 : Number(snapshot.version);
  const value = snapshot?.data?.repayments;
  if (!Number.isInteger(version) || version < 1 || version > 4) throw new Error(errorMessage);
  if (version < 4) return [];
  if (version >= 4 && !Array.isArray(value)) throw new Error(errorMessage);
  const billById = new Map((Array.isArray(snapshotBills) ? snapshotBills : []).map((bill) => [bill.id, bill]));
  const seenIds = new Set();
  const next = value.map((item) => {
    const bill = billById.get(item?.billId);
    const amount = RepaymentModel.normalizeCurrency(item?.amount);
    const valid = item && typeof item === "object"
      && item.id && !seenIds.has(item.id)
      && bill
      && amount > 0
      && RepaymentModel.isDateOnly(item.date)
      && ["full", "minimum", "installment", "partial", "other"].includes(item.method)
      && typeof item.createdAt === "string"
      && Number.isFinite(Date.parse(item.createdAt))
      && typeof item.updatedAt === "string"
      && Number.isFinite(Date.parse(item.updatedAt));
    if (!valid) throw new Error(errorMessage);
    seenIds.add(item.id);
    return { ...item, cardId: bill.cardId || item.cardId || "", amount };
  });
  for (const bill of billById.values()) {
    if (RepaymentModel.paidTotal(next, bill.id) > RepaymentModel.normalizeCurrency(bill.amount)) {
      throw new Error(errorMessage);
    }
  }
  return next;
}

function prepareLedgerPayload(snapshot, expectedFormat, errorMessage = "账本格式无效") {
  const payload = snapshot?.data;
  const version = snapshot?.version === undefined ? 3 : Number(snapshot.version);
  if (snapshot?.format !== expectedFormat) throw new Error(errorMessage);
  const validCore = payload
    && Array.isArray(payload.cards)
    && Array.isArray(payload.records)
    && Array.isArray(payload.loyaltyAccounts);
  if (!validCore || (version >= 4 && !Array.isArray(payload.bills))) throw new Error(errorMessage);
  const nextBills = Array.isArray(payload.bills) ? payload.bills : [];
  if (version >= 4) {
    const billIds = new Set();
    const billKeys = new Set();
    const validBills = nextBills.every((bill) => {
      if (!bill || typeof bill !== "object" || !bill.id || billIds.has(bill.id)) return false;
      const monthText = String(bill.month || "");
      const monthNumber = Number(monthText.slice(5, 7));
      if (!bill.cardId || !/^\d{4}-\d{2}$/.test(monthText) || monthNumber < 1 || monthNumber > 12) return false;
      if (["paidAmount", "paidDate", "repaymentMethod"].some((key) => Object.prototype.hasOwnProperty.call(bill, key))) return false;
      const key = `${bill.cardId}::${bill.month}`;
      if (billKeys.has(key)) return false;
      const amount = Number(bill.amount || 0);
      const minimumPayment = Number(bill.minimumPayment || 0);
      if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(minimumPayment) || minimumPayment < 0) return false;
      billIds.add(bill.id);
      billKeys.add(key);
      return true;
    });
    if (!validBills) throw new Error(errorMessage);
  }
  return {
    cards: payload.cards,
    creditAccounts: Array.isArray(payload.creditAccounts) ? payload.creditAccounts : [],
    bills: nextBills,
    repayments: readSnapshotRepayments(snapshot, nextBills, errorMessage),
    records: payload.records,
    loyaltyAccounts: payload.loyaltyAccounts,
    recentRates: Array.isArray(payload.recentRates) ? payload.recentRates : [],
  };
}
```

Use version 4 and include repayments in both exports:

```js
version: 4,
data: { cards, creditAccounts, bills, repayments, records, loyaltyAccounts, recentRates },
```

During full-backup import, parse and validate every candidate collection before the confirmation and before changing any application state:

```js
const nextData = prepareLedgerPayload(backup, "credit-card-ledger-backup", "备份文件无效");
const confirmed = await askConfirm(
  `导入后会覆盖当前 ${cards.length} 张卡、${bills.length} 条账单、${repayments.length} 条还款流水、${records.length} 条手续费记录和 ${loyaltyAccounts.length} 个积分账户，确定继续吗？`,
  "确认导入",
);
if (!confirmed) return;
cards = nextData.cards;
creditAccounts = nextData.creditAccounts;
bills = nextData.bills;
repayments = nextData.repayments;
records = nextData.records;
loyaltyAccounts = nextData.loyaltyAccounts;
recentRates = nextData.recentRates;
migrateDataModel();
saveCards(); saveCreditAccounts(); saveBills(); saveRepayments(); saveRecords(); saveLoyaltyAccounts(); saveRecentRates();
```

During cloud snapshot application, prepare the complete candidate before assigning any collection:

```js
const nextData = prepareLedgerPayload(snapshot, "credit-card-ledger-cloud", "云端账本格式无效");
cards = nextData.cards;
creditAccounts = nextData.creditAccounts;
bills = nextData.bills;
repayments = nextData.repayments;
records = nextData.records;
loyaltyAccounts = nextData.loyaltyAccounts;
recentRates = nextData.recentRates;
migrateDataModel();
saveCards();
saveCreditAccounts();
saveBills();
saveRepayments();
saveRecords();
```

Change meaningful-data detection to:

```js
hasMeaningfulData: () => cards.length + bills.length + repayments.length + records.length + loyaltyAccounts.length > 0,
```

Add a repayment count to the data-tools health grid:

```html
<span><small>还款流水</small><strong id="backupRepaymentCount">0</strong></span>
```

Update the count. The import confirmation is the candidate-first block above and must not be duplicated later in `importFullBackup`:

```js
$("#backupRepaymentCount").textContent = String(repayments.length);
```

- [ ] **Step 8: Advance cloud and SQL schema versions**

Use this cloud empty snapshot and upload version:

```js
const emptySnapshot = () => ({
  format: "credit-card-ledger-cloud",
  version: 4,
  data: { cards: [], creditAccounts: [], bills: [], repayments: [], records: [], loyaltyAccounts: [], recentRates: [] },
  settings: { theme: document.documentElement.dataset.theme || "light", privacy: false, view: "cards", reminderReadIds: [] },
});

// pushSnapshot payload
schema_version: 4,
```

Change both defaults in `supabase/schema.sql` from 3 to 4. Do not change the table shape, grants, or RLS policies.

Replace the existing `useCloudButton` listener so a malformed version-4 cloud snapshot restores the first-sync choice instead of leaving the drawer in a half-finished state:

```js
useCloudButton?.addEventListener("click", async () => {
  migrationOverlay.hidden = true;
  try {
    await applyRemoteRow(pendingRemoteRow, { notify: true });
    pendingRemoteRow = null;
    localStorage.setItem(`pointsLedger_cloud_ready_${session.user.id}`, "true");
    localStorage.setItem(CLOUD_OWNER_KEY, session.user.id);
    document.documentElement.classList.remove("cloud-auth-locked");
  } catch (error) {
    migrationOverlay.hidden = false;
    setSyncState("error", "云端数据无效");
    window.showToast?.(`云端账本无法载入：${error.message}`, "error");
  }
});
```

- [ ] **Step 9: Run state, model, syntax, and whitespace checks**

Run:

```bash
node --test tests/repayment-model.test.cjs tests/repayment-state.test.mjs
node --check repayment-model.js
node --check app.js
node --check cloud-sync.js
git diff --check
```

Expected: all tests PASS, all syntax checks exit 0, and `git diff --check` prints no errors.

- [ ] **Step 10: Commit the version-4 data integration**

```bash
git add index.html app.js cloud-sync.js supabase/schema.sql tests/repayment-state.test.mjs
git commit -m "feat: migrate bills to repayment history"
```

### Task 4: Add The Repayment Entry And Edit Drawer

**Files:**
- Create: `tests/repayment-ui.test.mjs`
- Modify: `index.html:307`
- Modify: `app.js:170-230`
- Modify: `app.js:1164-1183`
- Modify: `app.js:1475-1710`
- Test: `tests/repayment-ui.test.mjs`

- [ ] **Step 1: Write the failing drawer and history contract**

Create `tests/repayment-ui.test.mjs` with the first two drawer-focused tests:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");

test("bill form owns bill facts and the repayment drawer owns payment facts", () => {
  assert.doesNotMatch(indexHtml, /billPaidAmountInput|billPaidDateInput|billRepaymentMethodInput/);
  for (const id of [
    "repaymentFormOverlay", "repaymentForm", "repaymentContextCard", "repaymentContextMonth",
    "repaymentBillAmount", "repaymentPaidTotal", "repaymentRemaining", "repaymentAmountInput",
    "repaymentDateInput", "repaymentMethodInput", "repaymentNoteInput", "repaymentValidation",
    "repaymentSubmitLabel", "repaymentDrawerCloseButton", "repaymentCancelButton",
  ]) assert.match(indexHtml, new RegExp(`id="${id}"`));
  assert.match(indexHtml, /id="repaymentForm"[^>]+role="dialog"[^>]+aria-modal="true"[^>]+aria-labelledby="repaymentFormTitle"/);
  assert.match(indexHtml, /id="repaymentAmountInput"[^>]+min="0\.01"[^>]+step="0\.01"[^>]+required/);
  assert.match(indexHtml, /id="repaymentDateInput"[^>]+required/);
  assert.match(indexHtml, /id="repaymentMethodInput"[^>]+required/);
  assert.match(indexHtml, /<option value="other">其他<\/option>/);
});

test("repayment drawer supports open, save, validation, close, and focus return", () => {
  assert.match(appJs, /function openRepaymentDrawer\(\{ billId, repaymentId = null, trigger = null \} = \{\}\)/);
  assert.match(appJs, /function saveRepaymentFromForm\(\)/);
  assert.match(appJs, /RepaymentModel\.validateRepayment\(/);
  assert.match(appJs, /repaymentSubmitButton\.disabled = true/);
  assert.match(appJs, /repaymentReturnFocus\?\.isConnected/);
  assert.match(appJs, /repaymentFormOverlay\.addEventListener\("click"/);
  assert.match(appJs, /repaymentForm\.addEventListener\("submit"/);
});
```

- [ ] **Step 2: Run the UI contract and verify the intended failures**

Run:

```bash
node --test tests/repayment-ui.test.mjs
```

Expected: both tests FAIL because the repayment drawer markup and behavior have not been implemented yet; the bill-form legacy-field assertion already passes from Task 3.

- [ ] **Step 3: Add the repayment drawer markup**

Insert after `billFormOverlay`. Keep this overlay as a sibling of the bill drawer; later `applyLedgerSnapshot` may close it through the function declaration before the UI section is reached at runtime:

```html
<div id="repaymentFormOverlay" class="drawer-overlay repayment-form-overlay" hidden>
  <form id="repaymentForm" class="card-form repayment-form" action="javascript:void(0)" autocomplete="off" role="dialog" aria-modal="true" aria-labelledby="repaymentFormTitle">
    <div class="drawer-head">
      <div><span>Repayment Record</span><h3 id="repaymentFormTitle">记一笔还款</h3></div>
      <button id="repaymentDrawerCloseButton" class="btn-ghost" type="button">关闭</button>
    </div>
    <div class="repayment-form-body">
      <div class="repayment-context">
        <span><small>信用卡</small><strong id="repaymentContextCard">未选择</strong></span>
        <span><small>账单月份</small><strong id="repaymentContextMonth">未选择</strong></span>
      </div>
      <div class="repayment-summary" aria-label="账单还款概览">
        <span><small>账单金额</small><strong id="repaymentBillAmount">¥0.00</strong></span>
        <span><small>累计已还</small><strong id="repaymentPaidTotal">¥0.00</strong></span>
        <span><small>剩余待还</small><strong id="repaymentRemaining">¥0.00</strong></span>
      </div>
      <div class="field-row">
        <label class="field"><span>本次还款金额 ¥</span><input id="repaymentAmountInput" type="number" min="0.01" step="0.01" required /></label>
        <label class="field"><span>实际还款日期</span><input id="repaymentDateInput" type="date" required /></label>
      </div>
      <label class="field">
        <span>还款方式</span>
        <select id="repaymentMethodInput" required>
          <option value="full">全额</option>
          <option value="minimum">最低</option>
          <option value="installment">分期</option>
          <option value="partial">部分</option>
          <option value="other">其他</option>
        </select>
      </label>
      <label class="field"><span>备注</span><textarea id="repaymentNoteInput" rows="2" placeholder="如：提前还款、分期第 2 期或银行渠道"></textarea></label>
      <p id="repaymentValidation" class="repayment-validation" role="alert" hidden></p>
    </div>
    <div class="card-form-actions">
      <button id="repaymentSubmitButton" class="btn-primary" type="submit"><span id="repaymentSubmitLabel">保存还款</span></button>
      <button id="repaymentCancelButton" class="btn-ghost" type="button">取消</button>
    </div>
  </form>
</div>
```

- [ ] **Step 4: Add drawer references and state**

Add beside the bill references:

```js
const repaymentFormOverlay = $("#repaymentFormOverlay");
const repaymentForm = $("#repaymentForm");
const repaymentFormTitle = $("#repaymentFormTitle");
const repaymentDrawerCloseButton = $("#repaymentDrawerCloseButton");
const repaymentSubmitButton = $("#repaymentSubmitButton");
const repaymentSubmitLabel = $("#repaymentSubmitLabel");
const repaymentCancelButton = $("#repaymentCancelButton");
const repaymentValidation = $("#repaymentValidation");
const repaymentInputs = {
  amount: $("#repaymentAmountInput"),
  date: $("#repaymentDateInput"),
  method: $("#repaymentMethodInput"),
  note: $("#repaymentNoteInput"),
};
const repaymentContext = {
  card: $("#repaymentContextCard"),
  month: $("#repaymentContextMonth"),
  billAmount: $("#repaymentBillAmount"),
  paidTotal: $("#repaymentPaidTotal"),
  remaining: $("#repaymentRemaining"),
};

let editingRepaymentId = null;
let activeRepaymentBillId = null;
let repaymentReturnFocus = null;
let repaymentSaving = false;
```

- [ ] **Step 5: Implement open, validation, save, and close behavior**

Add after the bill drawer helpers:

```js
const repaymentMethodLabel = (value) => ({
  full: "全额",
  minimum: "最低",
  installment: "分期",
  partial: "部分",
  other: "其他",
}[value] || "其他");

function showRepaymentValidation(message = "") {
  repaymentValidation.textContent = message;
  repaymentValidation.hidden = !message;
}

function closeRepaymentDrawer({ restoreFocus = true } = {}) {
  repaymentFormOverlay.hidden = true;
  editingRepaymentId = null;
  activeRepaymentBillId = null;
  showRepaymentValidation();
  if (restoreFocus && repaymentReturnFocus?.isConnected) repaymentReturnFocus.focus();
  repaymentReturnFocus = null;
}

function openRepaymentDrawer({ billId, repaymentId = null, trigger = null } = {}) {
  const bill = bills.find((item) => item.id === billId);
  if (!bill) {
    showToast("账单不存在或已被删除", "error");
    closeRepaymentDrawer({ restoreFocus: false });
    return;
  }
  const existing = repaymentId
    ? repayments.find((item) => item.id === repaymentId && item.billId === billId)
    : null;
  if (repaymentId && !existing) {
    showToast("还款流水不存在或已被删除", "error");
    closeRepaymentDrawer({ restoreFocus: false });
    return;
  }

  repaymentForm.reset();
  editingRepaymentId = existing?.id || null;
  activeRepaymentBillId = bill.id;
  repaymentReturnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
  repaymentFormTitle.textContent = existing ? "编辑还款流水" : "记一笔还款";
  repaymentSubmitLabel.textContent = existing ? "更新还款" : "保存还款";
  repaymentContext.card.textContent = cardLabel(cardById(bill.cardId) || { name: bill.cardNameSnapshot || "未命名卡片" });
  repaymentContext.month.textContent = monthDisplay(bill.month);
  repaymentContext.billAmount.textContent = money(bill.amount);
  repaymentContext.paidTotal.textContent = money(billPaidTotal(bill));
  repaymentContext.remaining.textContent = money(billRemaining(bill));
  const maximum = RepaymentModel.maximumRepaymentAmount({ bill, repayments, repaymentId: existing?.id || "" });
  repaymentInputs.amount.max = String(maximum);
  repaymentInputs.amount.value = existing?.amount || maximum || "";
  repaymentInputs.date.value = existing?.date || today();
  repaymentInputs.method.value = existing?.method || "full";
  repaymentInputs.note.value = existing?.note || "";
  showRepaymentValidation();
  repaymentFormOverlay.hidden = false;
  repaymentInputs.amount.focus();
}

function repaymentErrorMessage(result) {
  if (result.code === "missing-bill") return "账单不存在，请关闭后重新选择";
  if (result.code === "invalid-amount") return "请输入大于 0 的有效还款金额";
  if (result.code === "invalid-date") return "请选择实际还款日期";
  if (result.code === "invalid-method") return "请选择还款方式";
  if (result.code === "overpayment") return `本次最多可登记 ${money(result.maximum)}`;
  return "还款信息无法保存，请检查后重试";
}

function saveRepaymentFromForm() {
  if (repaymentSaving) return;
  const bill = bills.find((item) => item.id === activeRepaymentBillId);
  const existing = editingRepaymentId
    ? repayments.find((item) => item.id === editingRepaymentId && item.billId === activeRepaymentBillId)
    : null;
  if (!bill) {
    showToast("账单不存在或已被删除", "error");
    closeRepaymentDrawer();
    return;
  }
  if (editingRepaymentId && !existing) {
    showToast("还款流水不存在或已被删除", "error");
    closeRepaymentDrawer();
    return;
  }
  const draft = {
    id: existing?.id || "",
    amount: repaymentInputs.amount.value,
    date: repaymentInputs.date.value,
    method: repaymentInputs.method.value,
    note: repaymentInputs.note.value.trim(),
  };
  const result = RepaymentModel.validateRepayment({ bill, repayments, repayment: draft });
  if (!result.ok) {
    showRepaymentValidation(repaymentErrorMessage(result));
    return;
  }

  repaymentSaving = true;
  repaymentSubmitButton.disabled = true;
  try {
    const now = new Date().toISOString();
    const payload = {
      id: existing?.id || makeId(),
      billId: bill.id,
      cardId: bill.cardId || "",
      amount: result.amount,
      date: draft.date,
      method: draft.method,
      note: draft.note,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    repayments = existing
      ? repayments.map((item) => item.id === existing.id ? payload : item)
      : [payload, ...repayments];
    saveRepayments();
    repaymentReturnFocus = null;
    closeRepaymentDrawer({ restoreFocus: false });
    render();
    requestAnimationFrame(() => {
      const selector = `.bill-row[data-id="${CSS.escape(bill.id)}"] .edit-bill`;
      billsList.querySelector(selector)?.focus();
    });
    showToast(existing ? "还款流水已更新" : "还款流水已保存");
  } finally {
    repaymentSaving = false;
    repaymentSubmitButton.disabled = false;
  }
}
```

- [ ] **Step 6: Wire drawer events and Escape behavior**

Add:

```js
repaymentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveRepaymentFromForm();
});
repaymentDrawerCloseButton.addEventListener("click", () => closeRepaymentDrawer());
repaymentCancelButton.addEventListener("click", () => closeRepaymentDrawer());
repaymentFormOverlay.addEventListener("click", (event) => {
  if (event.target === repaymentFormOverlay) closeRepaymentDrawer();
});
[repaymentInputs.amount, repaymentInputs.date, repaymentInputs.method].forEach((input) => {
  input.addEventListener("input", () => showRepaymentValidation());
  input.addEventListener("change", () => showRepaymentValidation());
});
```

Insert the repayment drawer before the bill drawer in the existing Escape chain:

```js
} else if (e.key === "Escape" && !repaymentFormOverlay.hidden) {
  closeRepaymentDrawer();
} else if (e.key === "Escape" && !billFormOverlay.hidden) {
```

At the start of `applyLedgerSnapshot`, immediately after `prepareLedgerPayload` succeeds and before assigning `cards`, close an open repayment drawer so a remote replacement cannot leave stale bill context visible:

```js
if (!repaymentFormOverlay.hidden) closeRepaymentDrawer({ restoreFocus: false });
```

- [ ] **Step 7: Run syntax and the focused UI contract**

Run:

```bash
node --check app.js
node --test tests/repayment-ui.test.mjs
```

Expected: both repayment-drawer tests PASS.

- [ ] **Step 8: Commit the repayment drawer**

```bash
git add index.html app.js tests/repayment-ui.test.mjs
git commit -m "feat: add repayment entry drawer"
```

### Task 5: Render Editable Repayment History In Bill Rows

**Files:**
- Modify: `app.js:225-245`
- Modify: `app.js:1595-1705`
- Test: `tests/repayment-ui.test.mjs`

- [ ] **Step 1: Extend the UI contract with the failing history test**

Append this test to `tests/repayment-ui.test.mjs`:

```js
test("bill rows expose repayment entry, quick paid, and accessible history", () => {
  assert.match(appJs, /class="record-repayment"/);
  assert.match(appJs, /class="mark-bill-paid"/);
  assert.match(appJs, /class="repayment-disclosure"[^>]+aria-expanded=/);
  assert.match(appJs, /aria-controls="\$\{historyId\}"/);
  assert.match(appJs, /class="repayment-history"[^>]+id="\$\{historyId\}"/);
  assert.match(appJs, /function renderRepaymentHistory\(/);
  assert.match(appJs, /function deleteRepayment\(/);
});
```

- [ ] **Step 2: Run the focused test and confirm the history failure**

Run:

```bash
node --test tests/repayment-ui.test.mjs
```

Expected: the two drawer tests PASS and the new bill-history test FAILS because the history controls do not exist.

- [ ] **Step 3: Track expanded histories**

Add with the other UI state:

```js
const expandedRepaymentBillIds = new Set();
```

- [ ] **Step 4: Add safe divider-list rendering**

Add before `renderBills`:

```js
function repaymentHistoryId(billId) {
  return `bill-repayment-history-${String(billId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function renderRepaymentHistory(container, bill) {
  const items = RepaymentModel.sortForBill(repayments, bill.id);
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "repayment-history-item";
    row.dataset.repaymentId = item.id;
    row.innerHTML = `
      <div class="repayment-history-main">
        <strong class="repayment-history-amount"></strong>
        <span class="repayment-history-meta"></span>
        <p class="repayment-history-note" hidden></p>
      </div>
      <div class="repayment-history-actions">
        <button class="edit-repayment" type="button">编辑</button>
        <button class="delete-repayment danger" type="button">删除</button>
      </div>`;
    row.querySelector(".repayment-history-amount").textContent = money(item.amount);
    row.querySelector(".repayment-history-meta").textContent = `${item.date || "未设置日期"} · ${repaymentMethodLabel(item.method)}`;
    const note = row.querySelector(".repayment-history-note");
    note.textContent = item.note || "";
    note.hidden = !item.note;
    row.querySelector(".edit-repayment").setAttribute("aria-label", `编辑 ${item.date || "未设置日期"} 的还款 ${money(item.amount)}`);
    row.querySelector(".delete-repayment").setAttribute("aria-label", `删除 ${item.date || "未设置日期"} 的还款 ${money(item.amount)}`);
    row.querySelector(".edit-repayment").title = "编辑还款流水";
    row.querySelector(".delete-repayment").title = "删除还款流水";
    container.append(row);
  });
}
```

- [ ] **Step 5: Replace `renderBills` with repayment-aware markup**

Use the existing period filtering and sorting, then build each row with this body:

```js
periodBills.forEach((bill) => {
  const status = billStatus(bill);
  const card = cardById(bill.cardId);
  const billRepayments = RepaymentModel.sortForBill(repayments, bill.id);
  const paid = Math.min(billPaidTotal(bill), Number(bill.amount || 0));
  const remaining = billRemaining(bill);
  const historyId = repaymentHistoryId(bill.id);
  const expanded = expandedRepaymentBillIds.has(bill.id) && billRepayments.length > 0;
  const row = document.createElement("article");
  row.className = `bill-row ${status.tone}`;
  row.dataset.id = bill.id;
  row.innerHTML = `
    <div class="bill-row-main"><div><strong class="bill-card"></strong><span class="bill-meta"></span></div></div>
    <span class="bill-status"></span>
    <div class="bill-row-grid">
      <span><small>账单金额</small><strong>${money(bill.amount)}</strong></span>
      <span><small>已还金额</small><strong>${money(paid)}</strong></span>
      <span><small>剩余待还</small><strong>${money(remaining)}</strong></span>
      <span><small>最低还款</small><strong>${money(bill.minimumPayment)}</strong></span>
    </div>
    <p class="bill-note" hidden></p>
    <div class="bill-actions">
      <button class="record-repayment" type="button"${remaining > 0 && status.key !== "pending" ? "" : " hidden"}>记一笔还款</button>
      <button class="mark-bill-paid" type="button"${remaining > 0 && status.key !== "pending" ? "" : " hidden"}>标记还清</button>
      <button class="edit-bill" type="button">编辑账单</button>
      <button class="delete-bill" type="button">删除</button>
    </div>
    <button class="repayment-disclosure" type="button" aria-expanded="${expanded}" aria-controls="${historyId}"${billRepayments.length ? "" : " hidden"}>
      <span>还款流水 ${billRepayments.length} 笔</span><span class="repayment-disclosure-icon" aria-hidden="true">⌄</span>
    </button>
    <div class="repayment-history" id="${historyId}"${expanded ? "" : " hidden"}></div>`;
  row.querySelector(".bill-card").textContent = cardLabel(card || { name: bill.cardNameSnapshot || "未命名卡片" });
  row.querySelector(".bill-meta").textContent = `${bill.month || "未设置月份"} · ${bill.dueDate || "未设置应还日"} · ${billRepayments.length} 笔还款`;
  row.querySelector(".bill-status").textContent = status.label;
  row.querySelector(".bill-status").dataset.tone = status.tone;
  const note = row.querySelector(".bill-note");
  note.textContent = bill.note || "";
  note.hidden = !bill.note;
  renderRepaymentHistory(row.querySelector(".repayment-history"), bill);
  billsList.append(row);
});
```

- [ ] **Step 6: Add edit, delete, disclosure, and entry delegation**

Add:

```js
async function deleteRepayment(id, billId) {
  const repayment = repayments.find((item) => item.id === id && item.billId === billId);
  if (!repayment) return;
  if (!(await askConfirm(`确定删除 ${repayment.date} 的还款 ${money(repayment.amount)} 吗？`))) return;
  repayments = repayments.filter((item) => item.id !== id);
  if (!RepaymentModel.sortForBill(repayments, billId).length) expandedRepaymentBillIds.delete(billId);
  saveRepayments();
  render();
  showToast("还款流水已删除");
}
```

Replace the bill-list click handler with:

```js
billsList.addEventListener("click", (event) => {
  const row = event.target.closest(".bill-row");
  if (!row) return;
  const billId = row.dataset.id;
  const repaymentRow = event.target.closest(".repayment-history-item");
  if (event.target.closest(".edit-repayment") && repaymentRow) {
    openRepaymentDrawer({ billId, repaymentId: repaymentRow.dataset.repaymentId, trigger: event.target.closest("button") });
    return;
  }
  if (event.target.closest(".delete-repayment") && repaymentRow) {
    deleteRepayment(repaymentRow.dataset.repaymentId, billId);
    return;
  }
  const disclosure = event.target.closest(".repayment-disclosure");
  if (disclosure) {
    const expanded = disclosure.getAttribute("aria-expanded") !== "true";
    disclosure.setAttribute("aria-expanded", String(expanded));
    row.querySelector(".repayment-history").hidden = !expanded;
    if (expanded) expandedRepaymentBillIds.add(billId);
    else expandedRepaymentBillIds.delete(billId);
    return;
  }
  if (event.target.closest(".record-repayment")) {
    openRepaymentDrawer({ billId, trigger: event.target.closest("button") });
    return;
  }
  if (event.target.closest(".edit-bill")) openBillDrawer({ billId });
  if (event.target.closest(".mark-bill-paid")) {
    expandedRepaymentBillIds.add(billId);
    markBillPaid(billId);
  }
  if (event.target.closest(".delete-bill")) deleteBill(billId);
});
```

In `saveRepaymentFromForm`, replace the Task 4 `render()` and `.edit-bill` focus block with the history-aware version below. This keeps Task 4 independently runnable and upgrades the focus target only after history rows exist:

```js
expandedRepaymentBillIds.add(bill.id);
render();
requestAnimationFrame(() => {
  const selector = `.bill-row[data-id="${CSS.escape(bill.id)}"] .repayment-history-item[data-repayment-id="${CSS.escape(payload.id)}"] .edit-repayment`;
  billsList.querySelector(selector)?.focus();
});
```

When deleting a bill, add:

```js
expandedRepaymentBillIds.delete(id);
```

- [ ] **Step 7: Verify history behavior at the source level**

Run:

```bash
node --check app.js
node --test tests/repayment-model.test.cjs tests/repayment-state.test.mjs tests/repayment-ui.test.mjs
```

Expected: all model, state, drawer, and history assertions PASS.

- [ ] **Step 8: Commit repayment history rendering**

```bash
git add app.js tests/repayment-ui.test.mjs
git commit -m "feat: render editable repayment history"
```

### Task 6: Add Responsive Styling And Fresh Asset Versions

**Files:**
- Modify: `organic-liquid.css`
- Modify: `index.html:14-16`
- Modify: `index.html:767-771`
- Modify: `app.js:15`
- Modify: `tests/dashboard-drawer-adaptation.test.mjs`
- Modify: `tests/fee-dashboard-total-fees.test.mjs`
- Modify: `tests/fee-visibility-ui.test.mjs`
- Modify: `tests/mobile-responsive-layout.test.mjs`
- Test: `tests/repayment-ui.test.mjs`

- [ ] **Step 1: Extend the UI contract with failing style and cache tests**

Add this read and these tests to `tests/repayment-ui.test.mjs`:

```js
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");
const marker = "Repayment History V83";
const repaymentCss = organicCss.slice(organicCss.indexOf(marker));

test("repayment styles cover desktop, phone, dark mode, and reduced motion", () => {
  assert.notEqual(organicCss.indexOf(marker), -1);
  assert.match(repaymentCss, /\.repayment-form-overlay/);
  assert.match(repaymentCss, /\.repayment-history-item/);
  assert.match(repaymentCss, /@media \(max-width:\s*760px\)[\s\S]*\.repayment-form-overlay[\s\S]*height:\s*100dvh/);
  assert.match(repaymentCss, /data-theme="dark"[\s\S]*\.repayment-form/);
  assert.match(repaymentCss, /body\.privacy-mode[\s\S]*\.repayment-history-amount/);
  assert.match(repaymentCss, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.repayment-disclosure/);
});

test("repayment build uses fresh cache versions", () => {
  assert.match(indexHtml, /organic-liquid\.css\?v=83/);
  assert.match(indexHtml, /app\.js\?v=75/);
  assert.match(indexHtml, /cloud-sync\.js\?v=3/);
  assert.match(appJs, /window\.__pointsLedgerBuild = "repayment-history-v75"/);
});
```

- [ ] **Step 2: Run the focused test and confirm style/cache failures**

Run:

```bash
node --test tests/repayment-ui.test.mjs
```

Expected: drawer and history tests PASS; the two new style/cache tests FAIL.

- [ ] **Step 3: Append the final repayment style layer**

Append to `organic-liquid.css`:

```css
/* Repayment History V83 */
html[data-ui="organic-v41"] .repayment-form-overlay {
  position: fixed;
  inset: 0;
  z-index: 230;
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  padding: 0;
  background: rgba(31, 39, 29, 0.18);
}

html[data-ui="organic-v41"] .repayment-form-overlay[hidden],
html[data-ui="organic-v41"] .repayment-history[hidden],
html[data-ui="organic-v41"] .repayment-validation[hidden],
html[data-ui="organic-v41"] .repayment-disclosure[hidden] {
  display: none !important;
}

html[data-ui="organic-v41"] .repayment-form {
  width: min(35rem, 100vw);
  height: 100dvh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 0;
  border-right: 1px solid rgba(91, 111, 80, 0.18);
  border-radius: 0;
  background: rgba(249, 250, 246, 0.96);
  box-shadow: 24px 0 64px rgba(40, 51, 36, 0.16);
}

html[data-ui="organic-v41"] .repayment-form-body {
  min-height: 0;
  padding: 1rem 1.1rem 1.4rem;
  overflow-x: hidden;
  overflow-y: auto;
}

html[data-ui="organic-v41"] .repayment-form :is(.drawer-head, .card-form-actions) {
  border-color: rgba(91, 111, 80, 0.16);
  background: rgba(249, 250, 246, 0.98);
}

html[data-ui="organic-v41"] .repayment-context,
html[data-ui="organic-v41"] .repayment-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgba(91, 111, 80, 0.16);
}

html[data-ui="organic-v41"] .repayment-summary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

html[data-ui="organic-v41"] :is(.repayment-context, .repayment-summary) > span {
  min-width: 0;
  display: grid;
  gap: 0.24rem;
}

html[data-ui="organic-v41"] :is(.repayment-context, .repayment-summary) small {
  color: var(--muted-foreground);
  font-size: 0.68rem;
  font-weight: 700;
}

html[data-ui="organic-v41"] :is(.repayment-context, .repayment-summary) strong {
  color: var(--foreground);
  font-size: 0.95rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

html[data-ui="organic-v41"] .repayment-validation {
  margin: 0.75rem 0 0;
  color: var(--danger, #a53c36);
  font-size: 0.78rem;
  font-weight: 700;
}

html[data-ui="organic-v41"] .bill-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

html[data-ui="organic-v41"] .repayment-disclosure {
  width: 100%;
  min-height: 2.65rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding: 0.55rem 0;
  border: 0;
  border-top: 1px solid rgba(91, 111, 80, 0.15);
  border-radius: 0;
  color: var(--foreground);
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

html[data-ui="organic-v41"] .repayment-disclosure-icon {
  transition: transform 160ms ease;
}

html[data-ui="organic-v41"] .repayment-disclosure[aria-expanded="true"] .repayment-disclosure-icon {
  transform: rotate(180deg);
}

html[data-ui="organic-v41"] .repayment-history {
  border-bottom: 1px solid rgba(91, 111, 80, 0.12);
}

html[data-ui="organic-v41"] .repayment-history-item {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(91, 111, 80, 0.11);
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

html[data-ui="organic-v41"] .repayment-history-main {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

html[data-ui="organic-v41"] .repayment-history-amount {
  color: var(--foreground);
  font-size: 0.96rem;
}

html[data-ui="organic-v41"] :is(.repayment-history-meta, .repayment-history-note) {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.72rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

html[data-ui="organic-v41"] .repayment-history-actions {
  display: flex;
  gap: 0.35rem;
}

html[data-ui="organic-v41"] .repayment-history-actions button {
  min-height: 2.25rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid rgba(91, 111, 80, 0.18);
  border-radius: 6px;
  color: var(--foreground);
  background: transparent;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 700;
}

html[data-ui="organic-v41"] body.privacy-mode :is(
  .repayment-context strong,
  .repayment-summary strong,
  .repayment-history-amount,
  .repayment-history-note
) {
  filter: blur(7px);
  user-select: none;
}

html[data-ui="organic-v41"][data-theme="dark"] .repayment-form {
  border-color: rgba(218, 228, 211, 0.13);
  background: rgba(25, 31, 24, 0.98);
  box-shadow: 24px 0 64px rgba(0, 0, 0, 0.32);
}

html[data-ui="organic-v41"][data-theme="dark"] .repayment-form :is(.drawer-head, .card-form-actions) {
  border-color: rgba(218, 228, 211, 0.12);
  background: rgba(25, 31, 24, 0.99);
}

html[data-ui="organic-v41"][data-theme="dark"] :is(
  .repayment-context,
  .repayment-summary,
  .repayment-disclosure,
  .repayment-history,
  .repayment-history-item
) {
  border-color: rgba(218, 228, 211, 0.12);
}

@media (max-width: 760px) {
  html[data-ui="organic-v41"] .repayment-form-overlay {
    width: 100vw;
    height: 100dvh;
    align-items: stretch;
    overflow: hidden;
  }

  html[data-ui="organic-v41"] .repayment-form {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border: 0;
  }

  html[data-ui="organic-v41"] .repayment-form .drawer-head {
    min-height: calc(58px + env(safe-area-inset-top));
    padding: calc(8px + env(safe-area-inset-top)) 12px 8px;
  }

  html[data-ui="organic-v41"] .repayment-form-body {
    padding: 12px 12px calc(16px + env(safe-area-inset-bottom));
  }

  html[data-ui="organic-v41"] .repayment-form .card-form-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  }

  html[data-ui="organic-v41"] .repayment-form .card-form-actions button,
  html[data-ui="organic-v41"] .repayment-history-actions button,
  html[data-ui="organic-v41"] .repayment-disclosure {
    min-height: 44px;
  }

  html[data-ui="organic-v41"] .repayment-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  html[data-ui="organic-v41"] .repayment-summary > span:last-child {
    grid-column: 1 / -1;
  }

  html[data-ui="organic-v41"] .repayment-history-item {
    grid-template-columns: minmax(0, 1fr);
  }

  html[data-ui="organic-v41"] .repayment-history-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 430px) {
  html[data-ui="organic-v41"] .repayment-context,
  html[data-ui="organic-v41"] .repayment-summary {
    grid-template-columns: minmax(0, 1fr);
  }

  html[data-ui="organic-v41"] .repayment-summary > span:last-child {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  html[data-ui="organic-v41"] :is(.repayment-form-overlay, .repayment-form, .repayment-disclosure, .repayment-disclosure-icon) {
    transition: none !important;
    animation: none !important;
  }
}
```

- [ ] **Step 4: Advance cache versions and the runtime marker**

Use:

```html
<link rel="stylesheet" href="./organic-liquid.css?v=83" />
<script src="./app.js?v=75"></script>
<script src="./cloud-sync.js?v=3"></script>
```

Set:

```js
window.__pointsLedgerBuild = "repayment-history-v75";
```

- [ ] **Step 5: Update existing exact cache assertions only**

In the four existing source-contract tests, change:

```js
assert.match(indexHtml, /organic-liquid\.css\?v=83/);
assert.match(indexHtml, /app\.js\?v=75/);
assert.match(appJs, /window\.__pointsLedgerBuild = "repayment-history-v75"/);
```

Do not alter any non-cache assertions.

- [ ] **Step 6: Run the complete source and unit suite**

Run:

```bash
node --test tests/*.test.cjs tests/*.test.mjs
node --check repayment-model.js
node --check app.js
node --check cloud-sync.js
git diff --check
```

Expected: all tests PASS, all syntax checks exit 0, and the whitespace check is silent.

- [ ] **Step 7: Commit styling and cache updates**

```bash
git add organic-liquid.css index.html app.js tests/dashboard-drawer-adaptation.test.mjs tests/fee-dashboard-total-fees.test.mjs tests/fee-visibility-ui.test.mjs tests/mobile-responsive-layout.test.mjs tests/repayment-ui.test.mjs
git commit -m "style: finish repayment history interface"
```

### Task 7: Verify Migration, Interaction, And Data Safety End To End

**Files:**
- Verify: `repayment-model.js`
- Verify: `index.html`
- Verify: `app.js`
- Verify: `organic-liquid.css`
- Verify: `cloud-sync.js`
- Verify: `supabase/schema.sql`
- Verify: all files under `tests/`

- [ ] **Step 1: Run the final automated regression suite from a clean command**

Run:

```bash
node --test tests/*.test.cjs tests/*.test.mjs
node --check repayment-model.js
node --check credit-account-model.js
node --check card-sort-model.js
node --check fee-visibility-model.js
node --check app.js
node --check cloud-sync.js
git diff --check
```

Expected: zero failed tests, zero syntax errors, and no whitespace errors.

- [ ] **Step 2: Audit legacy and version references**

Run:

```bash
rg -n "billPaidAmountInput|billPaidDateInput|billRepaymentMethodInput|pointsLedger_schema_v3|version:\s*3|schema_version:\s*3|default 3" index.html app.js cloud-sync.js supabase/schema.sql
rg -n "repayments|version:\s*4|schema_version:\s*4|default 4" app.js cloud-sync.js supabase/schema.sql
```

Expected: the first command prints no matches because it searches runtime files only. The second command shows repayments in local, backup, cloud, and SQL paths.

- [ ] **Step 3: Verify legacy migration with isolated data**

Use the pure model test fixture, not the user's browser data. Run:

```bash
node --test --test-name-pattern="migrates|clamps|idempotent" tests/repayment-model.test.cjs
```

Expected: all selected migration tests PASS and the second migration creates no duplicate repayment.

- [ ] **Step 4: Start an isolated browser fixture with cloud sync disabled**

Run this temporary local server from the project root in a long-running terminal session. It serves the real project files but replaces only the HTTP response for `supabase-config.js`, giving the fixture a separate Local Storage origin and no cloud connection:

```bash
node -e '
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".sql": "text/plain; charset=utf-8" };
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  if (pathname === "/supabase-config.js") {
    response.writeHead(200, { "content-type": types[".js"], "cache-control": "no-store" });
    response.end(`window.SUPABASE_CONFIG = Object.freeze({ url: "", publishableKey: "" });`);
    return;
  }
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(root, relative);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500).end(error.code || "Error");
      return;
    }
    response.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    response.end(data);
  });
}).listen(4177, "127.0.0.1", () => console.log("Repayment QA: http://127.0.0.1:4177"));
'
```

Expected: the process remains running and prints `Repayment QA: http://127.0.0.1:4177`. If port 4177 is occupied, replace it consistently with one unused port.

- [ ] **Step 5: Perform the isolated browser smoke test**

Open `http://127.0.0.1:4177` in the in-app browser. Confirm the footer says data is local and no login overlay appears. Then complete this exact flow:

1. Add a temporary card named `还款流水测试卡`, tail number `0719`, fixed limit `10000`.
2. Register a bill for the selected month with amount `1000`, minimum payment `100`, and a future due date.
3. Add a `300` partial repayment and confirm the bill shows paid `300`, remaining `700`, and `部分已还`.
4. Add a second repayment of `200`, expand `还款流水 2 笔`, and confirm both dates, methods, amounts, and notes are visible.
5. Edit the second repayment to `250`; confirm paid becomes `550` and remaining becomes `450`.
6. Attempt to enter `451`; confirm the drawer rejects it and displays the maximum `450`.
7. Attempt to lower the bill amount below `550`; confirm the bill form rejects the change.
8. Delete the first repayment; confirm the totals and status recalculate immediately.
9. Use `标记还清`; confirm one final repayment equals the exact remaining amount and the bill becomes `已还清`.
10. Delete one repayment from the paid bill; confirm status returns to `部分已还` or `待还` according to the remaining history.
11. Delete the bill; confirm the dialog states how many repayment rows will be removed.
12. Delete the temporary card and confirm the fixture returns to zero cards, zero bills, and zero repayment rows.

Because the fixture uses a separate HTTP origin with cloud configuration disabled, do not import or export the user's real backup during this test.

- [ ] **Step 6: Verify desktop, mobile, light, and dark presentation**

Use the in-app browser at `1440x1000`, `390x844`, `360x800`, and `430x932`:

- The repayment drawer has a visible header and action bar while its body scrolls independently.
- No text or amount overlaps another control.
- `document.documentElement.scrollWidth === document.documentElement.clientWidth` at every phone viewport.
- Bill actions wrap without changing row width.
- Repayment history uses dividers and transparent rows, not nested cards.
- Light and dark themes have readable labels, inputs, validation errors, amounts, and destructive actions.
- Disclosure and drawer motion stop when reduced motion is enabled.

Capture one desktop and one 390x844 screenshot for the implementation record.

- [ ] **Step 7: Stop the fixture and inspect the final diff**

Stop the long-running QA server session, then run:

```bash
git status --short
git diff --stat d415034..HEAD
git log --oneline -7
```

Expected: only the repayment design/plan, feature code, tests, asset versions, and schema-default update are present. No temporary browser data or generated screenshot is staged unless explicitly intended.

- [ ] **Step 8: Create a final verification commit only if browser fixes were needed**

When smoke testing required code adjustments, rerun the complete automated suite and commit only those fixes:

```bash
git add repayment-model.js index.html app.js organic-liquid.css cloud-sync.js supabase/schema.sql tests/repayment-model.test.cjs tests/repayment-state.test.mjs tests/repayment-ui.test.mjs tests/dashboard-drawer-adaptation.test.mjs tests/fee-dashboard-total-fees.test.mjs tests/fee-visibility-ui.test.mjs tests/mobile-responsive-layout.test.mjs
git commit -m "fix: complete repayment history verification"
```

If no files changed during browser verification, do not create an empty commit.

## Completion Criteria

- Every repayment is an independent record with amount, date, method, and note.
- Bill paid total, remaining amount, status, dashboard totals, statements, and reminders derive from repayment records only.
- New and edited repayments cannot overpay a bill, and bill amount cannot fall below paid total.
- `标记还清` creates exactly one repayment for the current remaining amount.
- Deleting a repayment recalculates status; deleting a bill cascades only its repayments after confirmation.
- Version-3 bills migrate exactly once, including excessive legacy amounts with an audit note.
- Full JSON backup and cloud snapshots round-trip repayments at schema version 4.
- Existing card, fee, points, responsive, dark-mode, and cloud behaviors continue to pass their regression tests.

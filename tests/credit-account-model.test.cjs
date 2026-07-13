const test = require("node:test");
const assert = require("node:assert/strict");
const {
  accountTotal,
  totalCredit,
  usageForAccount,
  migrateCreditAccounts,
  removeOrphanAccounts,
} = require("../credit-account-model.js");

test("temporary total limit replaces rather than adds to fixed limit", () => {
  assert.equal(accountTotal({ fixedLimit: 50000, tempLimit: 80000 }), 80000);
  assert.equal(accountTotal({ fixedLimit: 50000, tempLimit: 30000 }), 50000);
});

test("total granted credit counts each shared account once", () => {
  const accounts = [
    { id: "pool-pf", fixedLimit: 50000, tempLimit: 0 },
    { id: "pool-cmb", fixedLimit: 30000, tempLimit: 40000 },
  ];
  assert.equal(totalCredit(accounts), 90000);
});

test("shared account usage sums bills from every linked card", () => {
  const cards = [
    { id: "pf-visa", creditAccountId: "pool-pf" },
    { id: "pf-unionpay", creditAccountId: "pool-pf" },
    { id: "cmb", creditAccountId: "pool-cmb" },
  ];
  const bills = [
    { cardId: "pf-visa", month: "2026-07", amount: 12000 },
    { cardId: "pf-unionpay", month: "2026-07", amount: 8000 },
    { cardId: "pf-visa", month: "2026-06", amount: 4000 },
    { cardId: "cmb", month: "2026-07", amount: 9000 },
  ];
  const result = usageForAccount({
    account: { id: "pool-pf", fixedLimit: 50000, tempLimit: 60000 },
    cards,
    bills,
    period: "2026-07",
  });
  assert.equal(result.used, 20000);
  assert.equal(result.limit, 60000);
  assert.equal(result.available, 40000);
  assert.ok(Math.abs(result.usageRate - (100 / 3)) < 1e-10);
});

test("legacy cards migrate to separate accounts without adding their limits", () => {
  let id = 0;
  const result = migrateCreditAccounts({
    cards: [
      { id: "a", name: "浦发 Visa", fixedLimit: 50000, tempLimit: 80000, tempExpiry: "2026-08-01" },
      { id: "b", name: "浦发银联", fixedLimit: 50000, tempLimit: 0, tempExpiry: "" },
    ],
    creditAccounts: [],
    makeId: () => `account-${++id}`,
    now: "2026-07-13T00:00:00.000Z",
  });

  assert.equal(result.creditAccounts.length, 2);
  assert.equal(result.cards[0].creditAccountId, "account-1");
  assert.equal(result.cards[1].creditAccountId, "account-2");
  assert.equal(result.creditAccounts[0].fixedLimit, 50000);
  assert.equal(result.creditAccounts[0].tempLimit, 80000);
  assert.equal(totalCredit(result.creditAccounts), 130000);
  assert.equal(result.changed, true);
});

test("orphan accounts are removed after a card joins another account", () => {
  const accounts = [
    { id: "pool-kept", name: "浦发共享额度" },
    { id: "pool-orphan", name: "旧独立额度" },
  ];
  const cards = [
    { id: "a", creditAccountId: "pool-kept" },
    { id: "b", creditAccountId: "pool-kept" },
  ];
  assert.deepEqual(removeOrphanAccounts(accounts, cards), [accounts[0]]);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { sortCards, moveCard } = require("../card-sort-model.js");

const cards = [
  { id: "pf", name: "浦发", billDay: 12, dueDay: 2 },
  { id: "cmb", name: "招行", billDay: 5, dueDay: 25 },
  { id: "icbc", name: "工行", billDay: 18, dueDay: 10 },
];

const metrics = {
  pf: { used: 20000, available: 30000, usageRate: 40, billDayDistance: 29, dueDayDistance: 19 },
  cmb: { used: 8000, available: 12000, usageRate: 40, billDayDistance: 22, dueDayDistance: 11 },
  icbc: { used: 5000, available: 45000, usageRate: 10, billDayDistance: 4, dueDayDistance: 27 },
};

const ids = (items) => items.map((card) => card.id);

test("sorts Chinese card names in both directions", () => {
  assert.deepEqual(ids(sortCards(cards, "name-asc", metrics)), ["icbc", "pf", "cmb"]);
  assert.deepEqual(ids(sortCards(cards, "name-desc", metrics)), ["cmb", "pf", "icbc"]);
});

test("sorts period amounts and keeps equal values stable", () => {
  assert.deepEqual(ids(sortCards(cards, "used-desc", metrics)), ["pf", "cmb", "icbc"]);
  assert.deepEqual(ids(sortCards(cards, "available-asc", metrics)), ["cmb", "pf", "icbc"]);
  assert.deepEqual(ids(sortCards(cards, "usage-desc", metrics)), ["pf", "cmb", "icbc"]);
});

test("sorts upcoming bill and repayment dates by distance from today", () => {
  assert.deepEqual(ids(sortCards(cards, "bill-day-asc", metrics)), ["icbc", "cmb", "pf"]);
  assert.deepEqual(ids(sortCards(cards, "bill-day-desc", metrics)), ["pf", "cmb", "icbc"]);
  assert.deepEqual(ids(sortCards(cards, "due-day-asc", metrics)), ["cmb", "pf", "icbc"]);
  assert.deepEqual(ids(sortCards(cards, "due-day-desc", metrics)), ["icbc", "pf", "cmb"]);
});

test("custom and unknown modes preserve the existing order without mutating input", () => {
  const original = ids(cards);
  assert.deepEqual(ids(sortCards(cards, "custom", metrics)), original);
  assert.deepEqual(ids(sortCards(cards, "not-a-mode", metrics)), original);
  assert.deepEqual(ids(cards), original);
});

test("moves a card within custom order and ignores boundaries", () => {
  assert.deepEqual(ids(moveCard(cards, "cmb", "up")), ["cmb", "pf", "icbc"]);
  assert.deepEqual(ids(moveCard(cards, "cmb", "down")), ["pf", "icbc", "cmb"]);
  assert.deepEqual(ids(moveCard(cards, "pf", "up")), ["pf", "cmb", "icbc"]);
  assert.deepEqual(ids(moveCard(cards, "icbc", "down")), ["pf", "cmb", "icbc"]);
  assert.deepEqual(ids(cards), ["pf", "cmb", "icbc"]);
});

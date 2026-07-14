const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SUMMARY_KEYS,
  COLUMN_KEYS,
  getDefaultVisibility,
  normalizeVisibility,
  setVisibility,
  isVisible,
} = require("../fee-visibility-model.js");

test("defaults show every summary metric and record column", () => {
  const defaults = getDefaultVisibility();
  assert.deepEqual(defaults.summary, SUMMARY_KEYS);
  assert.deepEqual(defaults.columns, COLUMN_KEYS);
});

test("normalizes stored values and preserves an explicitly empty summary", () => {
  assert.deepEqual(normalizeVisibility({
    summary: [],
    columns: ["net", "unknown", "card", "net"],
  }), {
    summary: [],
    columns: ["card", "net"],
  });
  assert.deepEqual(normalizeVisibility(null), getDefaultVisibility());
});

test("restores a core column when imported settings only contain actions", () => {
  assert.deepEqual(normalizeVisibility({ summary: ["fee"], columns: ["actions"] }), {
    summary: ["fee"],
    columns: ["card", "actions"],
  });
});

test("updates visibility without mutating the input", () => {
  const original = getDefaultVisibility();
  const result = setVisibility(original, "summary", "spend", false);
  assert.equal(result.changed, true);
  assert.equal(isVisible(result.settings, "summary", "spend"), false);
  assert.equal(isVisible(original, "summary", "spend"), true);
});

test("cannot hide the final record data column", () => {
  const current = { summary: [], columns: ["card", "actions"] };
  const result = setVisibility(current, "columns", "card", false);
  assert.equal(result.changed, false);
  assert.deepEqual(result.settings, current);
});

test("ignores unknown groups and keys", () => {
  const current = getDefaultVisibility();
  assert.equal(setVisibility(current, "other", "date", false).changed, false);
  assert.equal(setVisibility(current, "columns", "other", false).changed, false);
});

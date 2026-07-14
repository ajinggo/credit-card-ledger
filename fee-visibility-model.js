(function initializeFeeVisibilityModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FeeVisibilityModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFeeVisibilityModel() {
  const SUMMARY_KEYS = Object.freeze(["count", "spend", "fee", "net"]);
  const COLUMN_KEYS = Object.freeze([
    "date", "card", "method", "channel", "cashout", "fee",
    "rate", "pointValue", "net", "billMonth", "actions",
  ]);
  const DATA_COLUMN_KEYS = Object.freeze(COLUMN_KEYS.filter((key) => key !== "actions"));

  function getDefaultVisibility() {
    return { summary: [...SUMMARY_KEYS], columns: [...COLUMN_KEYS] };
  }

  function knownValues(value, key, allowed) {
    if (!Array.isArray(value?.[key])) return [...allowed];
    const selected = new Set(value[key]);
    return allowed.filter((item) => selected.has(item));
  }

  function normalizeVisibility(value) {
    const summary = knownValues(value, "summary", SUMMARY_KEYS);
    const columns = knownValues(value, "columns", COLUMN_KEYS);
    if (!columns.some((key) => DATA_COLUMN_KEYS.includes(key))) columns.push("card");
    return {
      summary,
      columns: COLUMN_KEYS.filter((key) => columns.includes(key)),
    };
  }

  function setVisibility(value, group, key, visible) {
    const current = normalizeVisibility(value);
    const allowed = group === "summary" ? SUMMARY_KEYS : group === "columns" ? COLUMN_KEYS : null;
    if (!allowed?.includes(key)) return { settings: current, changed: false };

    const selected = new Set(current[group]);
    const wasVisible = selected.has(key);
    if (Boolean(visible) === wasVisible) return { settings: current, changed: false };
    if (visible) selected.add(key);
    else selected.delete(key);

    if (group === "columns" && !DATA_COLUMN_KEYS.some((column) => selected.has(column))) {
      return { settings: current, changed: false };
    }

    const next = { ...current, [group]: allowed.filter((item) => selected.has(item)) };
    return { settings: next, changed: true };
  }

  function isVisible(value, group, key) {
    const normalized = normalizeVisibility(value);
    return Array.isArray(normalized[group]) && normalized[group].includes(key);
  }

  return Object.freeze({
    SUMMARY_KEYS,
    COLUMN_KEYS,
    DATA_COLUMN_KEYS,
    getDefaultVisibility,
    normalizeVisibility,
    setVisibility,
    isVisible,
  });
});

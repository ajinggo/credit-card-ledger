(function initializeCardSortModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CardSortModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCardSortModel() {
  const numericModes = Object.freeze({
    "used-asc": ["used", 1],
    "used-desc": ["used", -1],
    "available-asc": ["available", 1],
    "available-desc": ["available", -1],
    "usage-asc": ["usageRate", 1],
    "usage-desc": ["usageRate", -1],
  });

  const dayModes = Object.freeze({
    "bill-day-asc": ["billDayDistance", 1],
    "bill-day-desc": ["billDayDistance", -1],
    "due-day-asc": ["dueDayDistance", 1],
    "due-day-desc": ["dueDayDistance", -1],
  });

  function compareOptionalNumbers(left, right, direction) {
    const leftNumber = left === null || left === undefined ? NaN : Number(left);
    const rightNumber = right === null || right === undefined ? NaN : Number(right);
    const leftMissing = !Number.isFinite(leftNumber) || leftNumber < 0;
    const rightMissing = !Number.isFinite(rightNumber) || rightNumber < 0;
    if (leftMissing || rightMissing) {
      if (leftMissing && rightMissing) return 0;
      return leftMissing ? 1 : -1;
    }
    return (leftNumber - rightNumber) * direction;
  }

  function sortCards(cards, mode, metricsById = {}) {
    const source = Array.isArray(cards) ? cards : [];
    const indexed = source.map((card, index) => ({ card, index }));
    if (mode === "custom") return indexed.map((item) => item.card);

    let compare;
    if (mode === "name-asc" || mode === "name-desc") {
      const direction = mode === "name-asc" ? 1 : -1;
      compare = (left, right) => String(left.card.name || "")
        .localeCompare(String(right.card.name || ""), "zh-CN") * direction;
    } else if (numericModes[mode]) {
      const [field, direction] = numericModes[mode];
      compare = (left, right) => {
        const leftValue = Number(metricsById[left.card.id]?.[field] || 0);
        const rightValue = Number(metricsById[right.card.id]?.[field] || 0);
        return (leftValue - rightValue) * direction;
      };
    } else if (dayModes[mode]) {
      const [field, direction] = dayModes[mode];
      compare = (left, right) => compareOptionalNumbers(
        metricsById[left.card.id]?.[field],
        metricsById[right.card.id]?.[field],
        direction,
      );
    } else {
      return indexed.map((item) => item.card);
    }

    return indexed
      .sort((left, right) => compare(left, right) || left.index - right.index)
      .map((item) => item.card);
  }

  function moveCard(cards, cardId, direction) {
    const next = Array.isArray(cards) ? [...cards] : [];
    const currentIndex = next.findIndex((card) => card.id === cardId);
    const offset = direction === "up" ? -1 : direction === "down" ? 1 : 0;
    const targetIndex = currentIndex + offset;
    if (!offset || currentIndex < 0 || targetIndex < 0 || targetIndex >= next.length) return next;
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    return next;
  }

  return Object.freeze({ sortCards, moveCard });
});

(function initializeCreditAccountModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CreditAccountModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCreditAccountModel() {
  const numericLimit = (value) => Math.max(Number(value || 0), 0);

  function accountTotal(account) {
    return Math.max(numericLimit(account?.fixedLimit), numericLimit(account?.tempLimit));
  }

  function totalCredit(creditAccounts) {
    return (Array.isArray(creditAccounts) ? creditAccounts : [])
      .reduce((total, account) => total + accountTotal(account), 0);
  }

  function usageForAccount({ account, cards, bills, period }) {
    const cardIds = new Set((Array.isArray(cards) ? cards : [])
      .filter((card) => card.creditAccountId === account?.id)
      .map((card) => card.id));
    const used = (Array.isArray(bills) ? bills : []).reduce((total, bill) => {
      if (bill.month !== period || !cardIds.has(bill.cardId)) return total;
      return total + Math.max(Number(bill.amount || 0), 0);
    }, 0);
    const limit = accountTotal(account);
    return {
      used,
      limit,
      available: Math.max(limit - used, 0),
      usageRate: limit > 0 ? Math.min((used / limit) * 100, 100) : 0,
    };
  }

  function removeOrphanAccounts(creditAccounts, cards) {
    const usedAccountIds = new Set((Array.isArray(cards) ? cards : []).map((card) => card.creditAccountId).filter(Boolean));
    return (Array.isArray(creditAccounts) ? creditAccounts : []).filter((account) => usedAccountIds.has(account.id));
  }

  function migrateCreditAccounts({ cards, creditAccounts, makeId, now }) {
    const nextCards = (Array.isArray(cards) ? cards : []).map((card) => ({ ...card }));
    const sourceAccounts = Array.isArray(creditAccounts) ? creditAccounts : [];
    const nextAccounts = [];
    const seenIds = new Set();
    let changed = !Array.isArray(creditAccounts);

    sourceAccounts.forEach((account) => {
      if (!account || typeof account !== "object") {
        changed = true;
        return;
      }
      let id = account.id;
      if (!id || seenIds.has(id)) {
        id = makeId();
        changed = true;
      }
      seenIds.add(id);
      const normalized = {
        ...account,
        id,
        name: String(account.name || "未命名额度账户"),
        fixedLimit: numericLimit(account.fixedLimit),
        tempLimit: numericLimit(account.tempLimit),
        tempExpiry: account.tempExpiry || "",
        createdAt: account.createdAt || now,
        updatedAt: account.updatedAt || account.createdAt || now,
      };
      if (!account.createdAt || !account.updatedAt
        || normalized.fixedLimit !== account.fixedLimit
        || normalized.tempLimit !== account.tempLimit
        || normalized.name !== account.name) changed = true;
      nextAccounts.push(normalized);
    });

    nextCards.forEach((card) => {
      let account = nextAccounts.find((item) => item.id === card.creditAccountId);
      if (!account) {
        account = {
          id: makeId(),
          name: `${card.name || "未命名卡片"}额度`,
          fixedLimit: numericLimit(card.fixedLimit),
          tempLimit: numericLimit(card.tempLimit),
          tempExpiry: card.tempExpiry || "",
          createdAt: card.createdAt || now,
          updatedAt: now,
        };
        nextAccounts.push(account);
        card.creditAccountId = account.id;
        changed = true;
      }
    });

    return { cards: nextCards, creditAccounts: nextAccounts, changed };
  }

  return Object.freeze({
    accountTotal,
    totalCredit,
    usageForAccount,
    migrateCreditAccounts,
    removeOrphanAccounts,
  });
});

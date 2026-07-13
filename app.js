/* ══════════════════════════════════════════════════════════
   积分成本账本 — 交互逻辑
   卡片额度管理 · 消费看板 · 历史建议
   ══════════════════════════════════════════════════════════ */

const RECORDS_KEY = "pointsLedger_dark_v1";
const CARDS_KEY = "pointsLedger_cards_v1";
const BILLS_KEY = "pointsLedger_bills_v1";
const LOYALTY_KEY = "pointsLedger_loyalty_v1";
const RECENT_RATES_KEY = "pointsLedger_recent_rates_v1";
const SCHEMA_KEY = "pointsLedger_schema_v2";
window.__pointsLedgerBuild = "billing-repayment-v55";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── 日夜主题 ─────────────────────────────────────
const THEME_KEY = "pointsLedger_theme_v1";
const themeToggle = $("#themeToggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme, persist = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  themeToggle.querySelector("span").textContent = nextTheme === "dark" ? "☀" : "☾";
  const actionLabel = nextTheme === "dark" ? "切换到日间模式" : "切换到黑夜模式";
  themeToggle.setAttribute("aria-label", actionLabel);
  themeToggle.title = actionLabel;
  themeColorMeta?.setAttribute("content", nextTheme === "dark" ? "#151914" : "#fdfcf8");
  if (persist) {
    localStorage.setItem(THEME_KEY, nextTheme);
    window.ledgerCloud?.schedulePush();
  }
}

const savedTheme = localStorage.getItem(THEME_KEY);
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || preferredTheme, Boolean(savedTheme));
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

// ── 表单元素 ─────────────────────────────────────
const form = $("#entryForm");
const recordsBody = $("#recordsBody");
const emptyState = $("#emptyState");
const monthFilter = $("#monthFilter");
const periodChip = $("#periodChip");
const dashboardYearFilter = $("#dashboardYearFilter");
const dashboardMonthFilter = $("#dashboardMonthFilter");
const summaryYearFilter = $("#summaryYearFilter");
const summaryMonthFilter = $("#summaryMonthFilter");
const entryFormOverlay = $("#entryFormOverlay");
const openEntryButton = $("#openEntryButton");
const entryDrawerCloseButton = $("#entryDrawerCloseButton");
const reminderOverlay = $("#reminderOverlay");
const reminderList = $("#reminderList");
const reminderBadge = $("#reminderBadge");
const reminderCountText = $("#reminderCountText");
const dataToolsOverlay = $("#dataToolsOverlay");
const statementOverlay = $("#statementOverlay");
const statementContent = $("#statementContent");
const advancedFilters = $("#advancedFilters");

const inputs = {
  date: $("#dateInput"),
  card: $("#cardInput"),
  method: $("#methodInput"),
  channel: $("#channelInput"),
  cashout: $("#cashoutInput"),
  feeRate: $("#feeRateInput"),
  fee: $("#feeInput"),
  points: $("#pointsInput"),
  pointValue: $("#pointValueInput"),
  note: $("#noteInput"),
};

const out = {
  netProfit: $("#netProfit"),
  profitHint: $("#profitHint"),
  totalFee: $("#totalFee"),
  totalPointValue: $("#totalPointValue"),
  totalCashout: $("#totalCashout"),
  totalMonthlyBill: $("#totalMonthlyBill"),
  avgFeeRate: $("#avgFeeRate"),
  avgRewardRate: $("#avgRewardRate"),
  heroFeeRate: $("#heroFeeRate"),
  heroRewardRate: $("#heroRewardRate"),
  liveNet: $("#liveNet"),
  liveFeeRate: $("#liveFeeRate"),
  liveRewardRate: $("#liveRewardRate"),
  submitLabel: $("#submitLabel"),
  cancelEdit: $("#cancelEditButton"),
  // dashboard
  yearLabel: $("#yearLabel"),
  yearSpend: $("#yearSpend"),
  yearBill: $("#yearBill"),
  yearCashout: $("#yearCashout"),
  monthLabel: $("#monthLabel"),
  monthSpend: $("#monthSpend"),
  monthBill: $("#monthBill"),
  monthCashout: $("#monthCashout"),
  totalLimit: $("#totalLimit"),
  fixedLimitSum: $("#fixedLimitSum"),
  tempLimitSum: $("#tempLimitSum"),
  expiryHead: $("#expiryHead"),
  expiryInfo: $("#expiryInfo"),
  repaymentDueTotal: $("#repaymentDueTotal"),
  repaymentPaidTotal: $("#repaymentPaidTotal"),
  repaymentRemainingTotal: $("#repaymentRemainingTotal"),
};

const recordSummary = {
  count: $("#filteredRecordCount"),
  spend: $("#filteredSpendTotal"),
  fee: $("#filteredFeeTotal"),
  net: $("#filteredNetTotal"),
};

// ── 卡片面板元素 ─────────────────────────────────
const cardFormOverlay = $("#cardFormOverlay");
const cardForm = $("#cardForm");
const cardFormTitle = $("#cardFormTitle");
const cardDrawerCloseButton = $("#cardDrawerCloseButton");
const cardInputs = {
  name: $("#cardNameInput"),
  lastFour: $("#cardLastFourInput"),
  fixed: $("#cardFixedInput"),
  temp: $("#cardTempInput"),
  expiry: $("#cardExpiryInput"),
  billDay: $("#cardBillDayInput"),
  dueDay: $("#cardDueDayInput"),
  annualFee: $("#cardAnnualFeeInput"),
  annualFeeType: $("#cardAnnualFeeTypeInput"),
  annualFeeTarget: $("#cardAnnualFeeTargetInput"),
};

function updateAnnualFeeTargetState() {
  const trackable = ["count", "spend", "points"].includes(cardInputs.annualFeeType.value);
  cardInputs.annualFeeTarget.disabled = !trackable;
  if (!trackable) cardInputs.annualFeeTarget.value = "";
}
cardInputs.annualFeeType.addEventListener("change", updateAnnualFeeTargetState);
const cardsList = $("#cardsList");
const cardsEmpty = $("#cardsEmpty");
const cardSummaryPanel = $("#cardSummaryPanel");
const cardSummaryBody = $("#cardSummaryBody");
const cardSummaryCount = $("#cardSummaryCount");
const cardSummaryTotal = $("#cardSummaryTotal");
const toggleCardSummaryButton = $("#toggleCardSummaryButton");
const closeCardSummaryButton = $("#closeCardSummaryButton");
const addBillButton = $("#addBillButton");
const addBillInlineButton = $("#addBillInlineButton");
const billFormOverlay = $("#billFormOverlay");
const billForm = $("#billForm");
const billFormTitle = $("#billFormTitle");
const billDrawerCloseButton = $("#billDrawerCloseButton");
const billSubmitLabel = $("#billSubmitLabel");
const billCancelButton = $("#billCancelButton");
const billLiveStatus = $("#billLiveStatus");
const billInputs = {
  cardId: $("#billCardInput"),
  month: $("#billMonthInput"),
  amount: $("#billAmountInput"),
  minimumPayment: $("#billMinimumInput"),
  dueDate: $("#billDueDateInput"),
  repaymentMethod: $("#billRepaymentMethodInput"),
  paidAmount: $("#billPaidAmountInput"),
  paidDate: $("#billPaidDateInput"),
  note: $("#billNoteInput"),
};
const billsList = $("#billsList");
const billsEmpty = $("#billsEmpty");
const billLedgerPeriod = $("#billLedgerPeriod");
const loyaltyFormOverlay = $("#loyaltyFormOverlay");
const loyaltyForm = $("#loyaltyForm");
const loyaltyFormTitle = $("#loyaltyFormTitle");
const loyaltyInputs = {
  program: $("#loyaltyProgramInput"),
  balance: $("#loyaltyBalanceInput"),
  account: $("#loyaltyAccountInput"),
  expiry: $("#loyaltyExpiryInput"),
  rolling: $("#loyaltyRollingInput"),
  reminderDays: $("#loyaltyReminderDaysInput"),
  note: $("#loyaltyNoteInput"),
};
const loyaltyList = $("#loyaltyList");
const loyaltyEmpty = $("#loyaltyEmpty");
const loyaltyAccountCount = $("#loyaltyAccountCount");
const loyaltyBalanceTotal = $("#loyaltyBalanceTotal");

// ── 状态 ─────────────────────────────────────────
let records = load(RECORDS_KEY);
let cards = load(CARDS_KEY);
let bills = load(BILLS_KEY);
let loyaltyAccounts = load(LOYALTY_KEY);
let recentRates = load(RECENT_RATES_KEY);
if (!Array.isArray(cards)) cards = [];
if (!Array.isArray(records)) records = [];
if (!Array.isArray(bills)) bills = [];
if (!Array.isArray(loyaltyAccounts)) loyaltyAccounts = [];
if (!Array.isArray(recentRates)) recentRates = [];
let editingId = null;
let editingCardId = null;
let editingBillId = null;
let editingLoyaltyId = null;
let sortKey = "date";
let sortDir = "desc";
let feeFromRate = false;
let feeFromManual = false;
let cardSummaryOpen = false;
let privacyEnabled = localStorage.getItem("pointsLedger_privacy_v1") === "true";
const REMINDER_READ_KEY = "pointsLedger_reminders_read_v1";
const storedReminderReadIds = load(REMINDER_READ_KEY);
let reminderReadIds = new Set(Array.isArray(storedReminderReadIds) ? storedReminderReadIds : []);

// ── 顶部板块切换 ─────────────────────────────────
const VIEW_KEY = "pointsLedger_view_v1";
const validViews = new Set(["cards", "fees", "fee-dashboard", "points"]);

function openEntryDrawer({ reset = true, focus = true } = {}) {
  if (reset) resetForm();
  entryFormOverlay.hidden = false;
  document.body.classList.add("entry-drawer-open");
  if (focus) inputs.date.focus();
}

function closeEntryDrawer() {
  entryFormOverlay.hidden = true;
  document.body.classList.remove("entry-drawer-open");
}

function switchView(view, focusTab = false) {
  const activeView = validViews.has(view) ? view : "cards";
  document.body.dataset.activeView = activeView;
  localStorage.setItem(VIEW_KEY, activeView);
  window.ledgerCloud?.schedulePush();

  $$('[data-view-tab]').forEach((tab) => {
    const active = tab.dataset.viewTab === activeView;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focusTab) tab.focus();
  });

  $$('.view-section').forEach((section) => {
    const visible = section.dataset.view.split(/\s+/).includes(activeView);
    section.hidden = !visible;
    if (visible) {
      section.classList.remove("view-enter");
      void section.offsetWidth;
      section.classList.add("view-enter");
      section.addEventListener("animationend", () => section.classList.remove("view-enter"), { once: true });
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$('[data-view-tab]').forEach((tab, index, tabs) => {
  tab.addEventListener("click", () => switchView(tab.dataset.viewTab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const offset = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const next = event.key === "Home"
      ? tabs[0]
      : event.key === "End"
        ? tabs[tabs.length - 1]
        : tabs[(index + offset + tabs.length) % tabs.length];
    switchView(next.dataset.viewTab, true);
  });
});

switchView(localStorage.getItem(VIEW_KEY) || "cards");

// ── 持久化 ───────────────────────────────────────
function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}
function saveRecords() { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); window.ledgerCloud?.schedulePush(); }
function saveCards() { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); window.ledgerCloud?.schedulePush(); }
function saveBills() { localStorage.setItem(BILLS_KEY, JSON.stringify(bills)); window.ledgerCloud?.schedulePush(); }
function saveLoyaltyAccounts() { localStorage.setItem(LOYALTY_KEY, JSON.stringify(loyaltyAccounts)); window.ledgerCloud?.schedulePush(); }
function saveRecentRates() { localStorage.setItem(RECENT_RATES_KEY, JSON.stringify(recentRates)); window.ledgerCloud?.schedulePush(); }

// ── 工具函数 ─────────────────────────────────────
const makeId = () =>
  window.crypto?.randomUUID ? window.crypto.randomUUID() : `r-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
const today = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};
const n = (input) => Number(input.value || 0);
const monthKey = (date) => (date || "").slice(0, 7);
const yearKey = (date) => (date || "").slice(0, 4);
const money = (v) =>
  new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(v || 0);
const money0 = (v) =>
  new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(v || 0);
const pct = (v) => `${(v || 0).toFixed(2)}%`;
const sum = (list, key) => list.reduce((t, r) => t + Number(r[key] || 0), 0);
const daysUntil = (d) => Math.ceil((new Date(d + "T00:00:00") - new Date(today() + "T00:00:00")) / 86400000);
const currentMonthKey = () => today().slice(0, 7);
const selectedDashboardMonth = () => `${dashboardYearFilter.value || yearKey(today())}-${dashboardMonthFilter.value || today().slice(5, 7)}`;
const monthDisplay = (value) => value ? `${value.slice(0, 4)} 年 ${Number(value.slice(5, 7))} 月` : "未设置月份";
const methodLabel = (value) => ({ full: "全额", minimum: "最低", installment: "分期", partial: "部分" }[value] || "全额");

function cardById(id) {
  return cards.find((card) => card.id === id) || null;
}

function cardLabel(card) {
  if (!card) return "未填写卡片";
  return `${card.name || "未命名卡片"}${card.lastFour ? ` · 尾号 ${card.lastFour}` : ""}`;
}

function getRecordCard(record) {
  return cardById(record.cardId) || cards.find((card) => card.name === record.card) || null;
}

function recordCardLabel(record) {
  const card = getRecordCard(record);
  if (card) return cardLabel(card);
  return record.cardNameSnapshot || record.card || "未填写卡片";
}

function recordMatchesCard(record, cardId) {
  if (!cardId || cardId === "all") return true;
  if (cardId.startsWith("legacy:")) {
    const legacyName = cardId.slice(7);
    return !record.cardId && (record.cardNameSnapshot || record.card) === legacyName;
  }
  return record.cardId === cardId || (!record.cardId && getRecordCard(record)?.id === cardId);
}

function billKey(cardId, month) {
  return `${cardId || ""}:${month || ""}`;
}

function getBillForCardMonth(cardId, month) {
  return bills.find((bill) => bill.cardId === cardId && bill.month === month) || null;
}

function billsForPeriod({ year = "all", month = "all", cardId = "all" } = {}) {
  return bills.filter((bill) => {
    const billMonth = bill.month || "";
    if (year !== "all" && billMonth.slice(0, 4) !== year) return false;
    if (month !== "all" && billMonth.slice(5, 7) !== month) return false;
    if (cardId !== "all" && bill.cardId !== cardId) return false;
    return true;
  });
}

function billStatus(bill) {
  const amount = Number(bill?.amount || 0);
  const paid = Number(bill?.paidAmount || 0);
  if (!(amount > 0)) return { key: "pending", label: "待出账", tone: "muted" };
  if (paid >= amount) return { key: "paid", label: "已还清", tone: "success" };
  if (bill?.dueDate && daysUntil(bill.dueDate) < 0) return { key: "overdue", label: "已逾期", tone: "danger" };
  if (paid > 0) return { key: "partial", label: "部分已还", tone: "warning" };
  return { key: "due", label: "待还", tone: "info" };
}

function billRemaining(bill) {
  return Math.max(Number(bill?.amount || 0) - Number(bill?.paidAmount || 0), 0);
}

function dueDateForBillMonth(card, billMonth) {
  const dueDay = dayValue(card?.dueDay);
  if (!dueDay || !billMonth) return "";
  const [year, month] = billMonth.split("-").map(Number);
  const billDay = dayValue(card?.billDay);
  const dueMonthIndex = billDay && dueDay <= billDay ? month : month - 1;
  const dueDate = new Date(year, dueMonthIndex, dueDay);
  const lastDay = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
  dueDate.setDate(Math.min(dueDay, lastDay));
  return toLocalISO(dueDate);
}

// ── Toast ────────────────────────────────────────
const toastEl = $("#toast");
let toastTimer = null;
function showToast(msg, type = "success") {
  toastEl.textContent = msg;
  toastEl.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}
window.showToast = showToast;

// ── 确认弹窗 ─────────────────────────────────────
const confirmModal = $("#confirmModal");
const modalMsg = $("#modalMsg");
const modalConfirmButton = $("#modalConfirm");
let confirmResolve = null;
function askConfirm(msg, confirmLabel = "确认") {
  modalMsg.textContent = msg;
  modalConfirmButton.textContent = confirmLabel;
  confirmModal.hidden = false;
  return new Promise((resolve) => { confirmResolve = resolve; });
}
$("#modalConfirm").addEventListener("click", () => { confirmModal.hidden = true; confirmResolve?.(true); });
$("#modalCancel").addEventListener("click", () => { confirmModal.hidden = true; confirmResolve?.(false); });
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) { confirmModal.hidden = true; confirmResolve?.(false); }
});

/* ══════════════════════════════════════════════════
   全局工具 · 隐私 · 备份 · 待办
   ══════════════════════════════════════════════════ */
const pad2 = (value) => String(value).padStart(2, "0");
const toLocalISO = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const nextMonthlyDate = (day, base = new Date()) => {
  const targetDay = dayValue(day);
  if (!targetDay) return null;
  const create = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(targetDay, lastDay));
  };
  let target = create(base.getFullYear(), base.getMonth());
  const baseDate = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (target < baseDate) target = create(base.getFullYear(), base.getMonth() + 1);
  return target;
};
const daysFromToday = (date) => date ? Math.ceil((date - new Date(`${today()}T00:00:00`)) / 86400000) : null;

function setPrivacy(enabled, persist = true) {
  privacyEnabled = Boolean(enabled);
  document.body.classList.toggle("privacy-mode", privacyEnabled);
  const button = $("#privacyToggle");
  button.classList.toggle("is-active", privacyEnabled);
  button.querySelector("span").textContent = privacyEnabled ? "○" : "◉";
  const label = privacyEnabled ? "显示敏感金额" : "隐藏敏感金额";
  button.setAttribute("aria-label", label);
  button.title = label;
  if (persist) {
    localStorage.setItem("pointsLedger_privacy_v1", String(privacyEnabled));
    window.ledgerCloud?.schedulePush();
  }
}

function closeUtilityDrawers() {
  reminderOverlay.hidden = true;
  dataToolsOverlay.hidden = true;
  statementOverlay.hidden = true;
}

function annualFeeProgress(card) {
  const type = card.annualFeeType || "none";
  const target = Number(card.annualFeeTarget || 0);
  const year = yearKey(today());
  const cardRecords = records.filter((record) => recordMatchesCard(record, card.id) && yearKey(record.date) === year);
  const cardBills = billsForPeriod({ year, cardId: card.id });
  let current = 0;
  let unit = "";
  if (type === "count") { current = cardRecords.length; unit = "次"; }
  if (type === "spend") { current = sum(cardBills, "amount"); unit = "元"; }
  if (type === "points") { current = sum(cardRecords, "points"); unit = "积分"; }
  const trackable = ["count", "spend", "points"].includes(type) && target > 0;
  return {
    type,
    target,
    current,
    unit,
    trackable,
    complete: trackable ? current >= target : type === "free",
    rate: trackable ? Math.min((current / target) * 100, 100) : 0,
  };
}

function buildReminders() {
  const items = [];
  cards.forEach((card) => {
    const cardLabel = `${card.name}${card.lastFour ? ` · 尾号 ${card.lastFour}` : ""}`;
    const billDate = nextMonthlyDate(card.billDay);
    const dueDate = nextMonthlyDate(card.dueDay);
    const billDays = daysFromToday(billDate);
    const dueDays = daysFromToday(dueDate);
    const hasOpenBillReminder = bills.some((bill) => {
      if (bill.cardId !== card.id || billStatus(bill).key === "paid" || !bill.dueDate) return false;
      return daysUntil(bill.dueDate) <= 7;
    });
    if (billDate && billDays <= 7) items.push({ id: `bill:${card.id || card.name}:${toLocalISO(billDate)}`, type: "账单", tone: "info", days: billDays, title: cardLabel, detail: billDays === 0 ? "今天是账单日" : `${toLocalISO(billDate)} 账单日，剩余 ${billDays} 天` });
    if (dueDate && dueDays <= 7 && !hasOpenBillReminder) items.push({ id: `due:${card.id || card.name}:${toLocalISO(dueDate)}`, type: "还款", tone: dueDays <= 2 ? "urgent" : "warning", days: dueDays, title: cardLabel, detail: dueDays === 0 ? "今天是还款日" : `${toLocalISO(dueDate)} 还款，剩余 ${dueDays} 天` });
    if (card.tempLimit && card.tempExpiry) {
      const expiryDays = daysUntil(card.tempExpiry);
      if (expiryDays <= 30) items.push({ id: `temp:${card.id || card.name}:${card.tempExpiry}`, type: "临额", tone: expiryDays < 0 ? "urgent" : "warning", days: expiryDays, title: cardLabel, detail: expiryDays < 0 ? `临额已过期 ${Math.abs(expiryDays)} 天` : `${card.tempExpiry} 到期，剩余 ${expiryDays} 天` });
    }
    const annual = annualFeeProgress(card);
    if (annual.trackable && !annual.complete) {
      const remaining = Math.max(annual.target - annual.current, 0);
      items.push({ id: `annual:${card.id || card.name}:${yearKey(today())}:${annual.type}:${annual.target}`, type: "年费", tone: "task", days: 120, title: cardLabel, detail: `年度任务 ${annual.current.toLocaleString("zh-CN")} / ${annual.target.toLocaleString("zh-CN")} ${annual.unit}，还差 ${remaining.toLocaleString("zh-CN")} ${annual.unit}` });
    }
  });
  bills.forEach((bill) => {
    const status = billStatus(bill);
    if (status.key === "paid" || !bill.dueDate || !(Number(bill.amount || 0) > 0)) return;
    const dueDays = daysUntil(bill.dueDate);
    if (dueDays > 7) return;
    const card = cardById(bill.cardId);
    const remaining = billRemaining(bill);
    items.push({
      id: `bill-due:${bill.id}:${bill.dueDate}:${Number(bill.paidAmount || 0)}`,
      type: "还款",
      tone: dueDays < 0 ? "urgent" : dueDays <= 2 ? "urgent" : "warning",
      days: dueDays,
      title: `${cardLabel(card || { name: bill.cardNameSnapshot || "未命名卡片" })} · ${monthDisplay(bill.month)}`,
      detail: dueDays < 0 ? `已逾期 ${Math.abs(dueDays)} 天，剩余待还 ${money(remaining)}` : `${bill.dueDate} 前还款，剩余待还 ${money(remaining)}`,
    });
  });
  loyaltyAccounts.forEach((account) => {
    if (account.rollingValid || !account.expiry) return;
    const expiryDays = daysUntil(account.expiry);
    const reminderDays = Number(account.reminderDays === undefined ? 90 : account.reminderDays || 0);
    if (reminderDays > 0 && expiryDays <= reminderDays) {
      items.push({
        id: `loyalty:${account.id || account.program}:${account.expiry}:${reminderDays}`,
        type: "积分",
        tone: expiryDays < 0 ? "urgent" : "info",
        days: expiryDays,
        title: account.program || "积分账户",
        detail: expiryDays < 0 ? `积分已到期 ${Math.abs(expiryDays)} 天` : `${account.expiry} 到期，剩余 ${expiryDays} 天 · 设置提前 ${reminderDays} 天提醒`,
      });
    }
  });
  return items.sort((a, b) => a.days - b.days);
}

function saveReminderReadState() {
  localStorage.setItem(REMINDER_READ_KEY, JSON.stringify([...reminderReadIds]));
  window.ledgerCloud?.schedulePush();
}

function markReminderRead(id) {
  if (reminderReadIds.has(id)) return;
  reminderReadIds.add(id);
  saveReminderReadState();
  renderReminders();
  showToast("已标记为已读");
}

function markReminderUnread(id) {
  if (!reminderReadIds.delete(id)) return;
  saveReminderReadState();
  renderReminders();
  showToast("已标记为未读");
}

function enableReminderSwipe(row, itemElement, reminderId, enabled) {
  if (!enabled) return;
  const swipeThreshold = 58;
  const maxSwipe = 92;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let directionLocked = false;

  const reset = () => {
    pointerId = null;
    offsetX = 0;
    directionLocked = false;
    row.classList.remove("is-dragging");
    row.style.removeProperty("--reminder-swipe-offset");
  };

  itemElement.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    offsetX = 0;
    directionLocked = false;
    try { itemElement.setPointerCapture(event.pointerId); } catch {}
  });

  itemElement.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!directionLocked && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        reset();
        return;
      }
      directionLocked = true;
      row.classList.add("is-dragging");
    }

    if (!directionLocked) return;
    offsetX = Math.max(-maxSwipe, Math.min(0, deltaX));
    row.style.setProperty("--reminder-swipe-offset", `${offsetX}px`);
    event.preventDefault();
  });

  itemElement.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    if (offsetX <= -swipeThreshold) {
      markReminderUnread(reminderId);
      return;
    }
    reset();
  });

  itemElement.addEventListener("pointercancel", reset);
  itemElement.addEventListener("lostpointercapture", () => {
    if (pointerId !== null) reset();
  });
}

function renderReminders() {
  const items = buildReminders();
  const unreadItems = items.filter((item) => !reminderReadIds.has(item.id));
  reminderBadge.hidden = unreadItems.length === 0;
  reminderBadge.textContent = String(Math.min(unreadItems.length, 99));
  reminderCountText.textContent = unreadItems.length ? `${unreadItems.length} 项未读 · 共 ${items.length} 项` : `${items.length} 项待办 · 全部已读`;
  $("#markAllRemindersReadButton").disabled = unreadItems.length === 0;
  reminderList.innerHTML = "";
  if (!items.length) {
    reminderList.innerHTML = '<div class="utility-empty"><strong>近期没有待办</strong><span>账单、还款、临额、积分与年费任务都在正常范围内。</span></div>';
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("div");
    const element = document.createElement("article");
    const isRead = reminderReadIds.has(item.id);
    row.className = `reminder-swipe-row${isRead ? " can-mark-unread" : ""}`;
    element.className = `reminder-item ${item.tone}${isRead ? " is-read" : ""}`;
    element.innerHTML = '<span class="reminder-type"></span><div><div class="reminder-title-row"><strong class="reminder-title"></strong><button class="reminder-read-state" type="button"></button></div><p class="reminder-detail"></p></div>';
    element.querySelector(".reminder-type").textContent = item.type;
    element.querySelector(".reminder-title").textContent = item.title;
    const readStateButton = element.querySelector(".reminder-read-state");
    readStateButton.textContent = isRead ? "已读" : "未读";
    readStateButton.disabled = isRead;
    readStateButton.setAttribute("aria-label", isRead ? `${item.title}已读` : `将${item.title}标为已读`);
    readStateButton.addEventListener("pointerdown", (event) => event.stopPropagation());
    readStateButton.addEventListener("click", (event) => {
      event.stopPropagation();
      markReminderRead(item.id);
    });
    element.querySelector(".reminder-detail").textContent = item.detail;
    const unreadButton = document.createElement("button");
    unreadButton.className = "reminder-unread-action";
    unreadButton.type = "button";
    unreadButton.textContent = "标为未读";
    unreadButton.setAttribute("aria-label", `将${item.title}标为未读`);
    unreadButton.hidden = !isRead;
    unreadButton.addEventListener("click", () => markReminderUnread(item.id));
    row.append(unreadButton, element);
    reminderList.append(row);
    enableReminderSwipe(row, element, item.id, isRead);
  });
}

function markAllRemindersRead() {
  buildReminders().forEach((item) => reminderReadIds.add(item.id));
  saveReminderReadState();
  renderReminders();
  showToast("待办已全部标记为已读");
}

function updateBackupCounts() {
  $("#backupCardCount").textContent = String(cards.length);
  $("#backupBillCount").textContent = String(bills.length);
  $("#backupRecordCount").textContent = String(records.length);
  $("#backupLoyaltyCount").textContent = String(loyaltyAccounts.length);
}

function exportFullBackup() {
  const backup = {
    format: "credit-card-ledger-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { cards, bills, records, loyaltyAccounts, recentRates },
    settings: {
      theme: document.documentElement.dataset.theme || "light",
      privacy: privacyEnabled,
      view: document.body.dataset.activeView || "cards",
      reminderReadIds: [...reminderReadIds],
    },
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `信用卡管理账本-完整备份-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("完整备份已导出");
}

async function importFullBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (backup?.format !== "credit-card-ledger-backup" || !backup.data || !Array.isArray(backup.data.cards) || !Array.isArray(backup.data.records) || !Array.isArray(backup.data.loyaltyAccounts)) {
      throw new Error("invalid-format");
    }
    const confirmed = await askConfirm(`导入后会覆盖当前 ${cards.length} 张卡、${bills.length} 条账单、${records.length} 条手续费记录和 ${loyaltyAccounts.length} 个积分账户，确定继续吗？`, "确认导入");
    if (!confirmed) return;
    cards = backup.data.cards;
    bills = Array.isArray(backup.data.bills) ? backup.data.bills : [];
    records = backup.data.records;
    loyaltyAccounts = backup.data.loyaltyAccounts;
    recentRates = Array.isArray(backup.data.recentRates) ? backup.data.recentRates : [];
    migrateDataModel();
    saveCards(); saveBills(); saveRecords(); saveLoyaltyAccounts(); saveRecentRates();
    if (backup.settings?.theme) applyTheme(backup.settings.theme);
    setPrivacy(Boolean(backup.settings?.privacy));
    reminderReadIds = new Set(Array.isArray(backup.settings?.reminderReadIds) ? backup.settings.reminderReadIds : []);
    localStorage.setItem(REMINDER_READ_KEY, JSON.stringify([...reminderReadIds]));
    render();
    if (validViews.has(backup.settings?.view)) switchView(backup.settings.view);
    closeUtilityDrawers();
    showToast("完整备份已恢复");
  } catch (error) {
    showToast("备份文件无效或无法读取", "error");
  } finally {
    $("#importBackupInput").value = "";
  }
}

$("#privacyToggle").addEventListener("click", () => setPrivacy(!privacyEnabled));
$("#reminderButton").addEventListener("click", () => { renderReminders(); reminderOverlay.hidden = false; });
$("#markAllRemindersReadButton").addEventListener("click", markAllRemindersRead);
$("#closeReminderButton").addEventListener("click", () => { reminderOverlay.hidden = true; });
$("#dataToolsButton").addEventListener("click", () => { updateBackupCounts(); dataToolsOverlay.hidden = false; });
$("#closeDataToolsButton").addEventListener("click", () => { dataToolsOverlay.hidden = true; });
$("#closeStatementButton").addEventListener("click", () => { statementOverlay.hidden = true; });
$("#exportBackupButton").addEventListener("click", exportFullBackup);
$("#importBackupButton").addEventListener("click", () => $("#importBackupInput").click());
$("#importBackupInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importFullBackup(file);
});
[reminderOverlay, dataToolsOverlay, statementOverlay].forEach((overlay) => {
  overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.hidden = true; });
});
setPrivacy(privacyEnabled, false);

/* ══════════════════════════════════════════════════
   录入表单 — 实时预览与费率联动
   ══════════════════════════════════════════════════ */
function formMath() {
  const cashout = n(inputs.cashout);
  const fee = n(inputs.fee);
  const pointValue = n(inputs.pointValue);
  return {
    net: pointValue - fee,
    feeRate: cashout > 0 ? (fee / cashout) * 100 : 0,
    rewardRate: cashout > 0 ? (pointValue / cashout) * 100 : 0,
  };
}
function updateLivePreview() {
  const m = formMath();
  out.liveNet.textContent = money(m.net);
  out.liveNet.className = m.net < 0 ? "loss" : m.net > 0 ? "gain" : "";
  out.liveFeeRate.textContent = pct(m.feeRate);
  out.liveRewardRate.textContent = pct(m.rewardRate);
}
function feeFromRateCalc() {
  const cashout = n(inputs.cashout);
  const rate = n(inputs.feeRate);
  if (cashout > 0 && rate >= 0) {
    feeFromRate = true;
    inputs.fee.value = (cashout * rate / 100).toFixed(2);
    feeFromRate = false;
  }
}
inputs.feeRate.addEventListener("input", () => { if (!feeFromManual) feeFromRateCalc(); updateLivePreview(); updateActiveChip(); });
inputs.cashout.addEventListener("input", () => { if (n(inputs.feeRate) > 0) feeFromRateCalc(); updateLivePreview(); });
inputs.fee.addEventListener("input", () => {
  if (feeFromRate) return;
  const cashout = n(inputs.cashout);
  const fee = n(inputs.fee);
  feeFromManual = true;
  if (cashout > 0 && fee >= 0) inputs.feeRate.value = (fee / cashout * 100).toFixed(2);
  feeFromManual = false;
  updateLivePreview();
  updateActiveChip();
});
[inputs.points, inputs.pointValue].forEach((inp) => inp.addEventListener("input", updateLivePreview));

// 费率预设芯片
function setRate(rate) {
  inputs.feeRate.value = rate;
  feeFromRateCalc();
  updateLivePreview();
  updateActiveChip();
}
$$(".rate-chip").forEach((chip) => chip.addEventListener("click", () => setRate(parseFloat(chip.dataset.rate))));
function updateActiveChip() {
  const rate = parseFloat(inputs.feeRate.value || 0).toFixed(1);
  $$(".rate-presets .rate-chip").forEach((c) => c.classList.toggle("active", parseFloat(c.dataset.rate).toFixed(1) === rate));
}

// 最近使用的费率始终排在快捷选项最前面
function rememberRate(rate) {
  const normalized = Number(Number(rate || 0).toFixed(2));
  if (!(normalized > 0)) return;
  recentRates = [normalized, ...recentRates.filter((item) => Number(item) !== normalized)].slice(0, 8);
  saveRecentRates();
}

function renderRateHistory() {
  const defaults = [0.5, 0.6, 0.7, 0.8, 1];
  const recordRates = records
    .filter((record) => record.cashout > 0 && record.fee > 0)
    .map((record) => Number(((record.fee / record.cashout) * 100).toFixed(2)));
  const rates = [...recentRates, ...recordRates, ...defaults]
    .filter((rate, index, list) => rate > 0 && list.indexOf(rate) === index)
    .slice(0, 8);
  const box = $(".rate-presets");
  box.innerHTML = rates.map((rate) => `<button class="rate-chip" type="button" data-rate="${rate}">${rate}%</button>`).join("");
  box.querySelectorAll(".rate-chip").forEach((chip) => chip.addEventListener("click", () => setRate(parseFloat(chip.dataset.rate))));
  $("#rateHistory").hidden = true;
  updateActiveChip();
}

/* ══════════════════════════════════════════════════
   卡片额度管理
   ══════════════════════════════════════════════════ */
// 银行的临时额度通常表示调整后的总额度，而不是固定额度之外的增量。
const cardTotal = (c) => Math.max(Number(c.fixedLimit || 0), Number(c.tempLimit || 0));
cardInputs.lastFour.addEventListener("input", () => {
  cardInputs.lastFour.value = cardInputs.lastFour.value.replace(/\D/g, "").slice(0, 4);
});
const dayValue = (value) => {
  const day = Number(value || 0);
  return day >= 1 && day <= 31 ? day : "";
};
const dayLabel = (day) => dayValue(day) ? `每月 ${dayValue(day)} 日` : "未设置";

function migrateDataModel() {
  let changed = false;
  const now = new Date().toISOString();

  const seenCardIds = new Set();
  cards = cards.map((card) => {
    const next = { ...card };
    if (!next.id || seenCardIds.has(next.id)) {
      next.id = makeId();
      changed = true;
    }
    seenCardIds.add(next.id);
    if (!next.createdAt) {
      next.createdAt = now;
      changed = true;
    }
    return next;
  });

  const findCardForRecord = (record) => {
    if (record.cardId) {
      const linked = cardById(record.cardId);
      if (linked) return linked;
    }
    const legacyName = record.cardNameSnapshot || record.card;
    return cards.find((card) => card.name === legacyName) || null;
  };

  const billByKey = new Map();
  bills.forEach((bill) => {
    if (!bill || typeof bill !== "object") return;
    const next = {
      ...bill,
      id: bill.id || makeId(),
      amount: Number(bill.amount || 0),
      minimumPayment: Number(bill.minimumPayment || 0),
      paidAmount: Number(bill.paidAmount || 0),
      repaymentMethod: bill.repaymentMethod || "full",
      createdAt: bill.createdAt || now,
      updatedAt: bill.updatedAt || bill.createdAt || now,
    };
    const card = cardById(next.cardId);
    if (!next.cardNameSnapshot && card) next.cardNameSnapshot = card.name;
    if (!next.dueDate && card && next.month) next.dueDate = dueDateForBillMonth(card, next.month);
    const key = billKey(next.cardId, next.month);
    if (!next.cardId || !next.month) {
      changed = true;
      return;
    }
    if (!bill.id || next.amount !== bill.amount || next.minimumPayment !== bill.minimumPayment || next.paidAmount !== bill.paidAmount || next.repaymentMethod !== bill.repaymentMethod) changed = true;
    if (!billByKey.has(key)) {
      billByKey.set(key, next);
      return;
    }
    const merged = billByKey.get(key);
    merged.amount = Math.max(Number(merged.amount || 0), Number(next.amount || 0));
    merged.minimumPayment = Math.max(Number(merged.minimumPayment || 0), Number(next.minimumPayment || 0));
    merged.paidAmount = Math.max(Number(merged.paidAmount || 0), Number(next.paidAmount || 0));
    merged.paidDate = merged.paidDate || next.paidDate || "";
    merged.dueDate = merged.dueDate || next.dueDate || "";
    merged.note = [merged.note, next.note].filter(Boolean).join("；");
    merged.updatedAt = now;
    changed = true;
  });

  records = records.map((record) => {
    const next = { ...record };
    if (!next.id) {
      next.id = makeId();
      changed = true;
    }
    const linkedCard = findCardForRecord(next);
    if (linkedCard && next.cardId !== linkedCard.id) {
      next.cardId = linkedCard.id;
      changed = true;
    }
    if (!next.cardNameSnapshot && (linkedCard || next.card)) {
      next.cardNameSnapshot = linkedCard?.name || next.card;
      changed = true;
    }
    if (linkedCard && !next.card) {
      next.card = linkedCard.name;
      changed = true;
    }
    const legacyBillAmount = Number(next.monthlyBill || 0);
    const billMonth = monthKey(next.date);
    if (legacyBillAmount > 0 && next.cardId && billMonth) {
      const key = billKey(next.cardId, billMonth);
      const existing = billByKey.get(key);
      if (existing) {
        if (legacyBillAmount > Number(existing.amount || 0)) {
          existing.amount = legacyBillAmount;
          existing.updatedAt = now;
          changed = true;
        }
      } else {
        const card = cardById(next.cardId);
        billByKey.set(key, {
          id: makeId(),
          cardId: next.cardId,
          cardNameSnapshot: linkedCard?.name || next.cardNameSnapshot || next.card || "",
          month: billMonth,
          amount: legacyBillAmount,
          minimumPayment: 0,
          dueDate: dueDateForBillMonth(card, billMonth),
          paidAmount: 0,
          paidDate: "",
          repaymentMethod: "full",
          note: "从旧版手续费记录迁移",
          createdAt: now,
          updatedAt: now,
        });
        changed = true;
      }
    }
    if ("monthlyBill" in next) {
      delete next.monthlyBill;
      changed = true;
    }
    return next;
  });

  const migratedBills = [...billByKey.values()].sort((a, b) => (b.month || "").localeCompare(a.month || "") || (a.cardNameSnapshot || "").localeCompare(b.cardNameSnapshot || "", "zh-CN"));
  if (migratedBills.length !== bills.length) changed = true;
  bills = migratedBills;

  if (localStorage.getItem(SCHEMA_KEY) !== "2") {
    localStorage.setItem(SCHEMA_KEY, "2");
    changed = true;
  }
  if (changed) {
    saveCards();
    saveRecords();
    saveBills();
  }
}

migrateDataModel();

function closeCardDrawer() {
  cardFormOverlay.hidden = true;
  editingCardId = null;
}

function openCardDrawer(e) {
  e?.preventDefault?.();
  e?.stopImmediatePropagation?.();
  editingCardId = null;
  cardForm.reset();
  cardFormTitle.textContent = "添加卡片";
  $("#cardSubmitLabel").textContent = "保存卡片";
  cardInputs.annualFeeType.value = "none";
  updateAnnualFeeTargetState();
  cardSummaryOpen = false;
  renderCardSummary();
  cardFormOverlay.hidden = false;
  cardInputs.name.focus();
}
window.openCardDrawer = openCardDrawer;
$("#addCardButton").addEventListener("click", openCardDrawer);
$("#cardCancelButton").addEventListener("click", closeCardDrawer);
cardDrawerCloseButton.addEventListener("click", closeCardDrawer);
cardFormOverlay.addEventListener("click", (e) => {
  if (e.target === cardFormOverlay) closeCardDrawer();
});
toggleCardSummaryButton.addEventListener("click", () => {
  cardFormOverlay.hidden = true;
  cardSummaryOpen = true;
  renderCardSummary();
});
closeCardSummaryButton.addEventListener("click", () => {
  cardSummaryOpen = false;
  renderCardSummary();
});
cardSummaryPanel.addEventListener("click", (e) => {
  if (e.target === cardSummaryPanel) {
    cardSummaryOpen = false;
    renderCardSummary();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && (!reminderOverlay.hidden || !dataToolsOverlay.hidden || !statementOverlay.hidden)) {
    closeUtilityDrawers();
  } else if (e.key === "Escape" && !entryFormOverlay.hidden) {
    closeEntryDrawer();
  } else if (e.key === "Escape" && !billFormOverlay.hidden) {
    closeBillDrawer();
  } else if (e.key === "Escape" && !loyaltyFormOverlay.hidden) {
    closeLoyaltyDrawer();
  } else if (e.key === "Escape" && cardSummaryOpen) {
    cardSummaryOpen = false;
    renderCardSummary();
  } else if (e.key === "Escape" && !cardFormOverlay.hidden) {
    closeCardDrawer();
  }
});

cardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = cardInputs.name.value.trim();
  if (!name) return;
  const payload = {
    name,
    lastFour: cardInputs.lastFour.value.trim(),
    fixedLimit: Number(cardInputs.fixed.value || 0),
    tempLimit: Number(cardInputs.temp.value || 0),
    tempExpiry: cardInputs.expiry.value || "",
    billDay: dayValue(cardInputs.billDay.value),
    dueDay: dayValue(cardInputs.dueDay.value),
    annualFee: cardInputs.annualFee.value.trim(),
    annualFeeType: cardInputs.annualFeeType.value,
    annualFeeTarget: Number(cardInputs.annualFeeTarget.value || 0),
  };
  if (editingCardId) {
    const idx = cards.findIndex((c) => c.id === editingCardId);
    if (idx !== -1) cards[idx] = { ...cards[idx], ...payload };
    showToast("卡片已更新");
  } else {
    cards = [{ id: makeId(), ...payload, createdAt: new Date().toISOString() }, ...cards];
    showToast("卡片已添加");
  }
  saveCards();
  cardFormOverlay.hidden = true;
  editingCardId = null;
  render();
});

function editCard(id) {
  const c = cards.find((x) => x.id === id);
  if (!c) return;
  editingCardId = id;
  cardInputs.name.value = c.name;
  cardInputs.lastFour.value = c.lastFour || "";
  cardInputs.fixed.value = c.fixedLimit || "";
  cardInputs.temp.value = c.tempLimit || "";
  cardInputs.expiry.value = c.tempExpiry || "";
  cardInputs.billDay.value = c.billDay || "";
  cardInputs.dueDay.value = c.dueDay || "";
  cardInputs.annualFee.value = c.annualFee || "";
  cardInputs.annualFeeType.value = c.annualFeeType || "none";
  cardInputs.annualFeeTarget.value = c.annualFeeTarget || "";
  updateAnnualFeeTargetState();
  cardFormTitle.textContent = "编辑卡片";
  $("#cardSubmitLabel").textContent = "更新卡片";
  cardSummaryOpen = false;
  renderCardSummary();
  cardFormOverlay.hidden = false;
  cardInputs.name.focus();
}

async function deleteCard(id) {
  const c = cards.find((x) => x.id === id);
  if (!c) return;
  if (!(await askConfirm(`确定删除卡片「${c.name}」吗？已有的套现记录不受影响。`))) return;
  cards = cards.filter((x) => x.id !== id);
  saveCards();
  render();
  showToast("卡片已删除");
}

function expiryState(c) {
  if (!c.tempLimit || !c.tempExpiry) return { cls: "none", text: "无临额" };
  const d = daysUntil(c.tempExpiry);
  if (d < 0) return { cls: "expired", text: "已到期" };
  if (d <= 30) return { cls: "soon", text: `${d} 天后到期` };
  return { cls: "ok", text: `${c.tempExpiry} 到期` };
}

function cardUsageForSelectedPeriod(card) {
  const selectedPeriod = selectedDashboardMonth();
  const bill = getBillForCardMonth(card.id, selectedPeriod);
  const used = Number(bill?.amount || 0);
  const limit = cardTotal(card);
  return {
    selectedPeriod,
    used,
    limit,
    available: Math.max(limit - used, 0),
    usageRate: limit > 0 ? Math.min((used / limit) * 100, 100) : 0,
  };
}

function getStatementCycle(card, anchor = new Date()) {
  const billDay = dayValue(card.billDay);
  if (!billDay) return null;
  const makeBillDate = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(billDay, lastDay));
  };
  const todayDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const currentBill = makeBillDate(anchor.getFullYear(), anchor.getMonth());
  const end = todayDate <= currentBill ? currentBill : makeBillDate(anchor.getFullYear(), anchor.getMonth() + 1);
  const previousBill = todayDate <= currentBill
    ? makeBillDate(anchor.getFullYear(), anchor.getMonth() - 1)
    : currentBill;
  const start = new Date(previousBill);
  start.setDate(start.getDate() + 1);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

function openStatement(cardId) {
  const card = cards.find((item) => item.id === cardId);
  if (!card) return;
  const selectedPeriod = selectedDashboardMonth();
  const cycle = getStatementCycle(card, new Date(`${selectedPeriod}-01T00:00:00`));
  const bill = getBillForCardMonth(card.id, selectedPeriod);
  const status = billStatus(bill);
  const dueDate = bill?.dueDate || dueDateForBillMonth(card, selectedPeriod);
  $("#statementTitle").textContent = `${card.name} · ${monthDisplay(selectedPeriod)}账单`;
  statementContent.innerHTML = "";
  const periodRecords = records.filter((record) => recordMatchesCard(record, card.id) && monthKey(record.date) === selectedPeriod);
  const cashout = sum(periodRecords, "cashout");
  const fee = sum(periodRecords, "fee");
  const pointValue = sum(periodRecords, "pointValue");
  const billAmount = Number(bill?.amount || 0);
  const paidAmount = Math.min(Number(bill?.paidAmount || 0), billAmount);
  const remaining = billRemaining(bill);
  const cycleLabel = cycle ? `${cycle.start} — ${cycle.end}` : monthDisplay(selectedPeriod);
  statementContent.innerHTML = `
    <div class="statement-period"><span>账单周期</span><strong>${cycleLabel}</strong><small>${dueDate ? `${dueDate} 应还 · ${status.label}` : "未设置还款日"}</small></div>
    <div class="statement-kpis">
      <span><small>账单金额</small><strong>${money(billAmount)}</strong></span>
      <span><small>已还金额</small><strong>${money(paidAmount)}</strong></span>
      <span><small>剩余待还</small><strong>${money(remaining)}</strong></span>
      <span><small>套现分析</small><strong>${money(cashout)}</strong></span>
    </div>
    <div class="statement-net"><span>手续费与积分</span><strong>${money(fee)} 手续费</strong><small>积分价值 ${money(pointValue)} · 净收益 ${money(pointValue - fee)}</small></div>
    <div class="statement-records-head"><strong>本月手续费记录</strong><span>${periodRecords.length} 笔</span></div>
    <div class="statement-record-list"></div>`;
  const list = statementContent.querySelector(".statement-record-list");
  if (!periodRecords.length) {
    list.innerHTML = '<div class="utility-empty compact"><span>本期还没有记录</span></div>';
  } else {
    periodRecords.sort((a, b) => b.date.localeCompare(a.date)).forEach((record) => {
      const row = document.createElement("div");
      row.className = "statement-record-row";
      row.innerHTML = '<span class="statement-record-date"></span><div><strong class="statement-record-channel"></strong><small class="statement-record-method"></small></div><strong class="statement-record-amount"></strong>';
      row.querySelector(".statement-record-date").textContent = record.date.slice(5);
      row.querySelector(".statement-record-channel").textContent = record.channel || "未填写渠道";
      row.querySelector(".statement-record-method").textContent = record.method || "未填写形式";
      row.querySelector(".statement-record-amount").textContent = money(Number(record.cashout || 0));
      list.append(row);
    });
  }
  statementOverlay.hidden = false;
}

function renderCards() {
  cardsEmpty.hidden = cards.length > 0;
  cardsList.innerHTML = cards.map((c) => {
    const st = expiryState(c);
    const { selectedPeriod, used, available, usageRate } = cardUsageForSelectedPeriod(c);
    const annual = annualFeeProgress(c);
    const annualTask = annual.trackable ? `<div class="annual-task${annual.complete ? " complete" : ""}">
      <div><span>年费任务</span><strong>${annual.current.toLocaleString("zh-CN")} / ${annual.target.toLocaleString("zh-CN")} ${annual.unit}</strong></div>
      <div class="annual-task-track"><span style="--annual-progress:${annual.rate.toFixed(2)}%"></span></div>
    </div>` : "";
    return `<article class="card-row card-row-wide">
      <div class="card-row-main">
        <div><div class="card-row-name"></div><span class="card-row-type"></span></div>
        <div class="card-row-actions">
          <button class="statement-card" type="button" data-id="${c.id}">本期账单</button>
          <button class="edit-card" type="button" data-id="${c.id}">编辑</button>
          <button class="delete-card" type="button" data-id="${c.id}">删除</button>
        </div>
      </div>
      <div class="card-row-dashboard">
        <div class="card-limit-summary">
          <span>总额度</span>
          <strong class="card-row-total">${money0(cardTotal(c))}</strong>
          <div><small>固额 ${money0(c.fixedLimit)}</small><small>临额总额${money0(c.tempLimit)}</small></div>
        </div>
        <div class="card-usage">
          <div class="card-usage-head">
            <span><small>本月已用</small><strong>${money0(used)}</strong></span>
            <span><small>可用额度</small><strong>${money0(available)}</strong></span>
          </div>
          <div class="card-usage-track" role="progressbar" aria-label="额度使用率" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${usageRate.toFixed(0)}">
            <span class="card-usage-fill${usageRate >= 90 ? " danger" : usageRate >= 70 ? " warning" : ""}" style="--usage:${usageRate.toFixed(2)}%"></span>
          </div>
          <small class="card-usage-caption">${selectedPeriod} · 已使用 ${usageRate.toFixed(1)}%</small>
        </div>
        <div class="card-cycle-grid">
          <span><small>账单日</small><strong>${dayLabel(c.billDay)}</strong></span>
          <span><small>还款日</small><strong>${dayLabel(c.dueDay)}</strong></span>
          <span class="card-temp-expiry"><small>临时额度</small><strong class="expiry-badge ${st.cls}">${st.text}</strong></span>
        </div>
      </div>
      ${annualTask}
      <div class="card-row-policy" hidden></div>
    </article>`;
  }).join("");
  // 安全写入卡名（防 XSS）
  cardsList.querySelectorAll(".card-row").forEach((row, i) => {
    row.querySelector(".card-row-name").textContent = cards[i].name;
    row.querySelector(".card-row-type").textContent = cards[i].lastFour ? `信用卡额度 · 尾号 ${cards[i].lastFour}` : "信用卡额度";
    const policy = cards[i].annualFee || "";
    const policyEl = row.querySelector(".card-row-policy");
    policyEl.hidden = !policy;
    policyEl.textContent = policy ? `年费：${policy}` : "";
  });
  cardsList.querySelectorAll(".edit-card").forEach((b) => b.addEventListener("click", () => editCard(b.dataset.id)));
  cardsList.querySelectorAll(".delete-card").forEach((b) => b.addEventListener("click", () => deleteCard(b.dataset.id)));
  cardsList.querySelectorAll(".statement-card").forEach((b) => b.addEventListener("click", () => openStatement(b.dataset.id)));
}

function renderCardSummary() {
  cardSummaryPanel.hidden = !cardSummaryOpen;
  toggleCardSummaryButton.setAttribute("aria-expanded", String(cardSummaryOpen));
  toggleCardSummaryButton.textContent = "卡汇总";
  cardSummaryCount.textContent = `${cards.length} 张卡`;
  cardSummaryTotal.textContent = `总额度 ${money0(cards.reduce((total, c) => total + cardTotal(c), 0))}`;
  cardSummaryBody.innerHTML = "";
  if (cardSummaryOpen) closeCardSummaryButton.focus();

  if (!cards.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5" class="summary-empty-cell">还没有卡片</td>';
    cardSummaryBody.append(row);
    return;
  }

  cards.forEach((c) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="summary-card-name"></span><span class="summary-card-limit"></span></td>
      <td class="num">${money0(cardTotal(c))}</td>
      <td>${dayLabel(c.billDay)}</td>
      <td>${dayLabel(c.dueDay)}</td>
      <td><span class="summary-policy"></span></td>`;
    row.querySelector(".summary-card-name").textContent = `${c.name || "未命名卡片"}${c.lastFour ? ` · 尾号 ${c.lastFour}` : ""}`;
    row.querySelector(".summary-card-limit").textContent = `固额 ${money0(c.fixedLimit)} · 临额总额${money0(c.tempLimit)}`;
    row.querySelector(".summary-policy").textContent = c.annualFee || "未设置";
    cardSummaryBody.append(row);
  });
}

/* ══════════════════════════════════════════════════
   月度账单与还款闭环
   ══════════════════════════════════════════════════ */
function renderBillCardOptions(preferred = billInputs.cardId.value) {
  const current = preferred || billInputs.cardId.value;
  billInputs.cardId.innerHTML = '<option value="">选择信用卡</option>';
  cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.id;
    option.textContent = cardLabel(card);
    billInputs.cardId.append(option);
  });
  billInputs.cardId.value = cards.some((card) => card.id === current) ? current : "";
}

function billDraftFromForm() {
  return {
    cardId: billInputs.cardId.value,
    month: billInputs.month.value,
    amount: n(billInputs.amount),
    minimumPayment: n(billInputs.minimumPayment),
    dueDate: billInputs.dueDate.value || "",
    paidAmount: n(billInputs.paidAmount),
    paidDate: billInputs.paidDate.value || "",
    repaymentMethod: billInputs.repaymentMethod.value || "full",
    note: billInputs.note.value.trim(),
  };
}

function updateBillLiveStatus() {
  const draft = billDraftFromForm();
  const status = billStatus(draft);
  billLiveStatus.textContent = `${status.label} · 剩余 ${money(billRemaining(draft))}`;
  billLiveStatus.dataset.tone = status.tone;
}

function syncBillDueDate(force = false) {
  if (!force && billInputs.dueDate.value) return;
  const card = cardById(billInputs.cardId.value);
  const dueDate = dueDateForBillMonth(card, billInputs.month.value);
  if (dueDate) billInputs.dueDate.value = dueDate;
}

function closeBillDrawer() {
  billFormOverlay.hidden = true;
  editingBillId = null;
}

function openBillDrawer({ billId = null, cardId = "", month = "" } = {}) {
  editingBillId = billId;
  billForm.reset();
  renderBillCardOptions(cardId);
  const bill = billId ? bills.find((item) => item.id === billId) : null;
  if (bill) {
    billFormTitle.textContent = "编辑月度账单";
    billSubmitLabel.textContent = "更新账单";
    renderBillCardOptions(bill.cardId);
    billInputs.cardId.value = bill.cardId || "";
    billInputs.month.value = bill.month || selectedDashboardMonth();
    billInputs.amount.value = bill.amount || "";
    billInputs.minimumPayment.value = bill.minimumPayment || "";
    billInputs.dueDate.value = bill.dueDate || "";
    billInputs.repaymentMethod.value = bill.repaymentMethod || "full";
    billInputs.paidAmount.value = bill.paidAmount || "";
    billInputs.paidDate.value = bill.paidDate || "";
    billInputs.note.value = bill.note || "";
  } else {
    billFormTitle.textContent = "登记月度账单";
    billSubmitLabel.textContent = "保存账单";
    billInputs.cardId.value = cardId || cards[0]?.id || "";
    billInputs.month.value = month || selectedDashboardMonth();
    billInputs.repaymentMethod.value = "full";
    syncBillDueDate(true);
  }
  updateBillLiveStatus();
  billFormOverlay.hidden = false;
  (cards.length ? billInputs.amount : billInputs.cardId).focus();
}

function collectBillPayload(existing = null) {
  const card = cardById(billInputs.cardId.value);
  const paidAmount = n(billInputs.paidAmount);
  const amount = n(billInputs.amount);
  const paidDate = paidAmount >= amount && amount > 0 && !billInputs.paidDate.value ? today() : billInputs.paidDate.value || "";
  return {
    id: existing?.id || makeId(),
    cardId: card?.id || "",
    cardNameSnapshot: card?.name || existing?.cardNameSnapshot || "",
    month: billInputs.month.value,
    amount,
    minimumPayment: n(billInputs.minimumPayment),
    dueDate: billInputs.dueDate.value || dueDateForBillMonth(card, billInputs.month.value),
    paidAmount,
    paidDate,
    repaymentMethod: billInputs.repaymentMethod.value || "full",
    note: billInputs.note.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function saveBillFromForm() {
  const card = cardById(billInputs.cardId.value);
  if (!card) {
    showToast("请先选择信用卡", "error");
    return;
  }
  if (!billInputs.month.value) {
    showToast("请填写账单月份", "error");
    return;
  }
  const existingEditing = editingBillId ? bills.find((bill) => bill.id === editingBillId) : null;
  const duplicate = bills.find((bill) => bill.cardId === card.id && bill.month === billInputs.month.value && bill.id !== editingBillId);
  if (editingBillId && duplicate) {
    showToast("这张卡该月份已有账单，请编辑原账单", "error");
    return;
  }
  const payload = collectBillPayload(existingEditing || duplicate || null);
  if (editingBillId) {
    bills = bills.map((bill) => bill.id === editingBillId ? payload : bill);
    showToast("账单已更新");
  } else if (duplicate) {
    bills = bills.map((bill) => bill.id === duplicate.id ? { ...duplicate, ...payload, id: duplicate.id, createdAt: duplicate.createdAt } : bill);
    showToast("同月账单已更新");
  } else {
    bills = [payload, ...bills];
    showToast("账单已保存");
  }
  saveBills();
  closeBillDrawer();
  render();
}

function renderBills() {
  const selectedPeriod = selectedDashboardMonth();
  const [year, month] = selectedPeriod.split("-");
  const periodBills = billsForPeriod({ year, month })
    .sort((a, b) => recordCardLabel({ cardId: a.cardId, cardNameSnapshot: a.cardNameSnapshot }).localeCompare(recordCardLabel({ cardId: b.cardId, cardNameSnapshot: b.cardNameSnapshot }), "zh-CN"));
  billLedgerPeriod.textContent = `${monthDisplay(selectedPeriod)} · ${periodBills.length} 条`;
  billsEmpty.hidden = periodBills.length > 0;
  billsList.innerHTML = "";
  periodBills.forEach((bill) => {
    const status = billStatus(bill);
    const card = cardById(bill.cardId);
    const row = document.createElement("article");
    row.className = `bill-row ${status.tone}`;
    row.dataset.id = bill.id;
    row.innerHTML = `
      <div class="bill-row-main">
        <div>
          <strong class="bill-card"></strong>
          <span class="bill-meta"></span>
        </div>
      </div>
      <span class="bill-status"></span>
      <div class="bill-row-grid">
        <span><small>账单金额</small><strong>${money(bill.amount)}</strong></span>
        <span><small>已还金额</small><strong>${money(Math.min(Number(bill.paidAmount || 0), Number(bill.amount || 0)))}</strong></span>
        <span><small>剩余待还</small><strong>${money(billRemaining(bill))}</strong></span>
        <span><small>最低还款</small><strong>${money(bill.minimumPayment)}</strong></span>
      </div>
      <p class="bill-note" hidden></p>
      <div class="bill-actions">
        <button class="edit-bill" type="button">编辑</button>
        <button class="mark-bill-paid" type="button"${status.key === "paid" ? " hidden" : ""}>标记还清</button>
        <button class="delete-bill" type="button">删除</button>
      </div>`;
    row.querySelector(".bill-card").textContent = cardLabel(card || { name: bill.cardNameSnapshot || "未命名卡片" });
    row.querySelector(".bill-meta").textContent = `${bill.month || "未设置月份"} · ${bill.dueDate || "未设置应还日"} · ${methodLabel(bill.repaymentMethod)}`;
    row.querySelector(".bill-status").textContent = status.label;
    row.querySelector(".bill-status").dataset.tone = status.tone;
    const note = row.querySelector(".bill-note");
    note.hidden = !bill.note;
    note.textContent = bill.note || "";
    billsList.append(row);
  });
}

async function deleteBill(id) {
  const bill = bills.find((item) => item.id === id);
  if (!bill) return;
  if (!(await askConfirm(`确定删除 ${monthDisplay(bill.month)} 的账单吗？`))) return;
  bills = bills.filter((item) => item.id !== id);
  saveBills();
  render();
  showToast("账单已删除");
}

function markBillPaid(id) {
  const bill = bills.find((item) => item.id === id);
  if (!bill) return;
  bills = bills.map((item) => item.id === id ? {
    ...item,
    paidAmount: Number(item.amount || 0),
    paidDate: item.paidDate || today(),
    repaymentMethod: item.repaymentMethod || "full",
    updatedAt: new Date().toISOString(),
  } : item);
  saveBills();
  render();
  showToast("账单已标记为还清");
}

addBillButton.addEventListener("click", () => openBillDrawer());
addBillInlineButton.addEventListener("click", () => openBillDrawer());
billDrawerCloseButton.addEventListener("click", closeBillDrawer);
billCancelButton.addEventListener("click", closeBillDrawer);
billFormOverlay.addEventListener("click", (event) => {
  if (event.target === billFormOverlay) closeBillDrawer();
});
[billInputs.amount, billInputs.minimumPayment, billInputs.dueDate, billInputs.paidAmount, billInputs.paidDate, billInputs.repaymentMethod].forEach((input) => {
  input.addEventListener("input", updateBillLiveStatus);
  input.addEventListener("change", updateBillLiveStatus);
});
billInputs.cardId.addEventListener("change", () => { syncBillDueDate(true); updateBillLiveStatus(); });
billInputs.month.addEventListener("change", () => { syncBillDueDate(true); updateBillLiveStatus(); });
billForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveBillFromForm();
});
billsList.addEventListener("click", (event) => {
  const row = event.target.closest(".bill-row");
  if (!row) return;
  if (event.target.closest(".edit-bill")) openBillDrawer({ billId: row.dataset.id });
  if (event.target.closest(".mark-bill-paid")) markBillPaid(row.dataset.id);
  if (event.target.closest(".delete-bill")) deleteBill(row.dataset.id);
});

/* ══════════════════════════════════════════════════
   积分账户管理
   ══════════════════════════════════════════════════ */
function closeLoyaltyDrawer() {
  loyaltyFormOverlay.hidden = true;
  editingLoyaltyId = null;
}

function updateLoyaltyExpiryState() {
  const rolling = loyaltyInputs.rolling.checked;
  loyaltyInputs.expiry.disabled = rolling;
  loyaltyInputs.reminderDays.disabled = rolling;
  loyaltyInputs.expiry.closest(".loyalty-expiry-date").classList.toggle("is-disabled", rolling);
  loyaltyInputs.reminderDays.closest(".loyalty-reminder-field").classList.toggle("is-disabled", rolling);
  if (rolling) {
    loyaltyInputs.expiry.value = "";
    loyaltyInputs.reminderDays.value = "";
  }
}

function openLoyaltyDrawer() {
  editingLoyaltyId = null;
  loyaltyForm.reset();
  loyaltyFormTitle.textContent = "添加积分账户";
  $("#loyaltySubmitLabel").textContent = "保存账户";
  loyaltyInputs.rolling.checked = false;
  loyaltyInputs.reminderDays.value = "90";
  updateLoyaltyExpiryState();
  cardFormOverlay.hidden = true;
  loyaltyFormOverlay.hidden = false;
  loyaltyInputs.program.focus();
}

function editLoyaltyAccount(id) {
  const account = loyaltyAccounts.find((item) => item.id === id);
  if (!account) return;
  editingLoyaltyId = id;
  loyaltyInputs.program.value = account.program || "";
  loyaltyInputs.balance.value = account.balance || "";
  loyaltyInputs.account.value = account.account || "";
  loyaltyInputs.expiry.value = account.expiry || "";
  loyaltyInputs.rolling.checked = Boolean(account.rollingValid);
  loyaltyInputs.reminderDays.value = account.reminderDays === undefined ? "90" : account.reminderDays || "";
  updateLoyaltyExpiryState();
  loyaltyInputs.note.value = account.note || "";
  loyaltyFormTitle.textContent = "编辑积分账户";
  $("#loyaltySubmitLabel").textContent = "更新账户";
  loyaltyFormOverlay.hidden = false;
  loyaltyInputs.program.focus();
}

async function deleteLoyaltyAccount(id) {
  const account = loyaltyAccounts.find((item) => item.id === id);
  if (!account) return;
  if (!(await askConfirm(`确定删除积分账户「${account.program}」吗？`))) return;
  loyaltyAccounts = loyaltyAccounts.filter((item) => item.id !== id);
  saveLoyaltyAccounts();
  renderLoyaltyAccounts();
  renderReminders();
  updateBackupCounts();
  showToast("积分账户已删除");
}

function renderLoyaltyAccounts() {
  loyaltyEmpty.hidden = loyaltyAccounts.length > 0;
  loyaltyAccountCount.textContent = String(loyaltyAccounts.length);
  loyaltyBalanceTotal.textContent = loyaltyAccounts
    .reduce((total, item) => total + Number(item.balance || 0), 0)
    .toLocaleString("zh-CN");

  loyaltyList.innerHTML = loyaltyAccounts.map((item) => `
    <article class="loyalty-card">
      <div class="loyalty-card-head">
        <span class="loyalty-mark"></span>
        <div><strong class="loyalty-program"></strong><small>积分账户</small></div>
        <div class="loyalty-balance"><strong>${Number(item.balance || 0).toLocaleString("zh-CN")}</strong><span>积分</span></div>
      </div>
      <div class="loyalty-details">
        <span><small>会员账号</small><strong class="loyalty-account"></strong></span>
        <span><small>有效期</small><strong class="loyalty-expiry-date-text"></strong></span>
      </div>
      <p class="loyalty-note" hidden></p>
      <div class="loyalty-actions">
        <button class="edit-loyalty" type="button" data-id="${item.id}">编辑</button>
        <button class="delete-loyalty" type="button" data-id="${item.id}">删除</button>
      </div>
    </article>`).join("");

  loyaltyList.querySelectorAll(".loyalty-card").forEach((card, index) => {
    const item = loyaltyAccounts[index];
    card.querySelector(".loyalty-mark").textContent = (item.program || "积").slice(0, 1);
    card.querySelector(".loyalty-program").textContent = item.program || "未命名积分";
    card.querySelector(".loyalty-account").textContent = item.account || "未填写";
    const expiryDateText = card.querySelector(".loyalty-expiry-date-text");
    expiryDateText.textContent = item.rollingValid ? "滚动有效" : item.expiry || "未设置";
    const note = card.querySelector(".loyalty-note");
    note.hidden = !item.note;
    note.textContent = item.note || "";
  });
  loyaltyList.querySelectorAll(".edit-loyalty").forEach((button) => button.addEventListener("click", () => editLoyaltyAccount(button.dataset.id)));
  loyaltyList.querySelectorAll(".delete-loyalty").forEach((button) => button.addEventListener("click", () => deleteLoyaltyAccount(button.dataset.id)));
}

$("#addLoyaltyButton").addEventListener("click", openLoyaltyDrawer);
$("#loyaltyCancelButton").addEventListener("click", closeLoyaltyDrawer);
$("#loyaltyDrawerCloseButton").addEventListener("click", closeLoyaltyDrawer);
loyaltyInputs.rolling.addEventListener("change", updateLoyaltyExpiryState);
loyaltyFormOverlay.addEventListener("click", (event) => {
  if (event.target === loyaltyFormOverlay) closeLoyaltyDrawer();
});
loyaltyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const program = loyaltyInputs.program.value.trim();
  if (!program) return;
  const payload = {
    program,
    balance: Number(loyaltyInputs.balance.value || 0),
    account: loyaltyInputs.account.value.trim(),
    expiry: loyaltyInputs.rolling.checked ? "" : loyaltyInputs.expiry.value || "",
    rollingValid: loyaltyInputs.rolling.checked,
    reminderDays: loyaltyInputs.rolling.checked ? 0 : Number(loyaltyInputs.reminderDays.value || 0),
    note: loyaltyInputs.note.value.trim(),
  };
  if (editingLoyaltyId) {
    const index = loyaltyAccounts.findIndex((item) => item.id === editingLoyaltyId);
    if (index !== -1) loyaltyAccounts[index] = { ...loyaltyAccounts[index], ...payload };
    showToast("积分账户已更新");
  } else {
    loyaltyAccounts = [{ id: makeId(), ...payload, createdAt: new Date().toISOString() }, ...loyaltyAccounts];
    showToast("积分账户已添加");
  }
  saveLoyaltyAccounts();
  closeLoyaltyDrawer();
  renderLoyaltyAccounts();
  renderReminders();
  updateBackupCounts();
});

/* ══════════════════════════════════════════════════
   看板 · 汇总 · 趋势
   ══════════════════════════════════════════════════ */
function renderDashboard() {
  const y = dashboardYearFilter.value || yearKey(today());
  const selectedMonth = dashboardMonthFilter.value || today().slice(5, 7);
  const m = `${y}-${selectedMonth}`;
  out.yearLabel.textContent = y;
  out.monthLabel.textContent = m;

  const yearRecs = records.filter((r) => yearKey(r.date) === y);
  const monthRecs = records.filter((r) => monthKey(r.date) === m);
  const yearBills = billsForPeriod({ year: y });
  const monthBills = billsForPeriod({ year: y, month: selectedMonth });
  const yearBillTotal = sum(yearBills, "amount");
  const yearCashoutTotal = sum(yearRecs, "cashout");
  const monthBillTotal = sum(monthBills, "amount");
  const monthCashoutTotal = sum(monthRecs, "cashout");
  const monthPaidTotal = monthBills.reduce((total, bill) => total + Math.min(Number(bill.paidAmount || 0), Number(bill.amount || 0)), 0);
  const monthRemainingTotal = monthBills.reduce((total, bill) => total + billRemaining(bill), 0);
  out.yearSpend.textContent = money(yearBillTotal);
  out.yearBill.textContent = money(yearBillTotal);
  out.yearCashout.textContent = money(yearCashoutTotal);
  out.monthSpend.textContent = money(monthBillTotal);
  out.monthBill.textContent = money(monthBillTotal);
  out.monthCashout.textContent = money(monthCashoutTotal);
  out.repaymentDueTotal.textContent = money(monthBillTotal);
  out.repaymentPaidTotal.textContent = money(monthPaidTotal);
  out.repaymentRemainingTotal.textContent = money(monthRemainingTotal);

  // 额度总览
  const fixedSum = sum(cards, "fixedLimit");
  const tempSum = sum(cards, "tempLimit");
  out.totalLimit.textContent = money0(cards.reduce((total, card) => total + cardTotal(card), 0));
  out.fixedLimitSum.textContent = money0(fixedSum);
  out.tempLimitSum.textContent = money0(tempSum);

  // 临额到期提醒：取最近一张有临额且未过期/最紧急的卡
  const withTemp = cards.filter((c) => c.tempLimit && c.tempExpiry);
  if (!withTemp.length) {
    out.expiryHead.textContent = "—";
    out.expiryInfo.textContent = "暂无临时额度";
  } else {
    const ranked = withTemp
      .map((c) => ({ c, d: daysUntil(c.tempExpiry) }))
      .sort((a, b) => a.d - b.d);
    const soonest = ranked[0];
    const expiredCount = ranked.filter((x) => x.d < 0).length;
    if (soonest.d < 0) {
      out.expiryHead.textContent = "已过期";
      out.expiryInfo.textContent = `${soonest.c.name} 等 ${expiredCount} 张临额已过期`;
    } else {
      out.expiryHead.textContent = `${soonest.d} 天`;
      out.expiryInfo.textContent = `${soonest.c.name} · ${soonest.c.tempExpiry} 到期`;
    }
  }
}

function setSelectOptions(select, options, preferred) {
  const current = select.value || preferred;
  select.innerHTML = "";
  options.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
  select.value = options.some((option) => option.value === current) ? current : preferred;
}

function renderPeriodOptions() {
  const currentYear = yearKey(today());
  const currentMonth = today().slice(5, 7);
  const years = [...new Set([
    currentYear,
    ...records.map((record) => yearKey(record.date)).filter(Boolean),
    ...bills.map((bill) => (bill.month || "").slice(0, 4)).filter(Boolean),
  ])].sort().reverse();
  const yearOptions = years.map((year) => ({ value: year, label: `${year} 年` }));
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return { value: month, label: `${index + 1} 月` };
  });

  setSelectOptions(dashboardYearFilter, yearOptions, currentYear);
  setSelectOptions(dashboardMonthFilter, monthOptions, currentMonth);
  setSelectOptions(summaryYearFilter, [{ value: "all", label: "全部年份" }, ...yearOptions], "all");
  setSelectOptions(summaryMonthFilter, [{ value: "all", label: "全年" }, ...monthOptions], "all");
}

function getFilteredRecords() {
  const m = monthFilter.value;
  const search = $("#recordSearchInput").value.trim().toLowerCase();
  const cardFilter = $("#recordCardFilter").value;
  const methodFilter = $("#recordMethodFilter").value;
  const netFilter = $("#recordNetFilter").value;
  const startDate = $("#recordStartDateFilter").value;
  const endDate = $("#recordEndDateFilter").value;
  const minAmountValue = $("#recordMinAmountFilter").value;
  const maxAmountValue = $("#recordMaxAmountFilter").value;
  const minAmount = minAmountValue === "" ? null : Number(minAmountValue);
  const maxAmount = maxAmountValue === "" ? null : Number(maxAmountValue);
  const base = records.filter((record) => {
    if (m !== "all" && monthKey(record.date) !== m) return false;
    if (!recordMatchesCard(record, cardFilter)) return false;
    const method = record.method || "未填写";
    if (methodFilter !== "all" && method !== methodFilter) return false;
    if (startDate && record.date < startDate) return false;
    if (endDate && record.date > endDate) return false;
    const amount = Number(record.cashout || 0);
    if (minAmount !== null && amount < minAmount) return false;
    if (maxAmount !== null && amount > maxAmount) return false;
    const net = Number(record.pointValue || 0) - Number(record.fee || 0);
    if (netFilter === "gain" && net <= 0) return false;
    if (netFilter === "loss" && net >= 0) return false;
    if (netFilter === "zero" && net !== 0) return false;
    if (search) {
      const linkedCard = getRecordCard(record);
      const haystack = [recordCardLabel(record), record.cardNameSnapshot, record.card, linkedCard?.lastFour, record.channel, record.method, record.note, record.date].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  return base.sort((a, b) => {
    let va = sortKey === "net" ? (a.pointValue - a.fee) : (a[sortKey] ?? "");
    let vb = sortKey === "net" ? (b.pointValue - b.fee) : (b[sortKey] ?? "");
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

function renderAdvancedFilterOptions() {
  const select = $("#recordCardFilter");
  const current = select.value || "all";
  select.innerHTML = '<option value="all">全部卡片</option>';
  const validValues = new Set(["all"]);
  cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.id;
    option.textContent = cardLabel(card);
    select.append(option);
    validValues.add(card.id);
  });
  const legacyNames = [...new Set(records
    .filter((record) => !record.cardId)
    .map((record) => record.cardNameSnapshot || record.card)
    .filter(Boolean))];
  legacyNames.forEach((name) => {
    const value = `legacy:${name}`;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${name} · 历史记录`;
    select.append(option);
    validValues.add(value);
  });
  select.value = validValues.has(current) ? current : "all";
}

function renderMonthOptions() {
  const months = [...new Set(records.map((r) => monthKey(r.date)).filter(Boolean))].sort().reverse();
  const cur = monthFilter.value || "all";
  monthFilter.innerHTML = '<option value="all">全部</option>';
  months.forEach((m) => {
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    monthFilter.append(o);
  });
  monthFilter.value = months.includes(cur) ? cur : "all";
}

function renderStats() {
  const selectedYear = summaryYearFilter.value || "all";
  const selectedMonth = summaryMonthFilter.value || "all";
  const f = records.filter((record) => {
    const matchesYear = selectedYear === "all" || yearKey(record.date) === selectedYear;
    const matchesMonth = selectedMonth === "all" || (record.date || "").slice(5, 7) === selectedMonth;
    return matchesYear && matchesMonth;
  });
  const selectedBills = billsForPeriod({ year: selectedYear, month: selectedMonth });
  const totalCashout = sum(f, "cashout");
  const totalFee = sum(f, "fee");
  const totalPointValue = sum(f, "pointValue");
  const net = totalPointValue - totalFee;

  out.netProfit.textContent = money(net);
  out.netProfit.className = net < 0 ? "loss" : net > 0 ? "gain" : "";
  out.profitHint.textContent = f.length
    ? `${f.length} 笔 · ${net >= 0 ? "积分价值覆盖成本" : "手续费高于积分价值"}`
    : "暂无记录";
  out.totalFee.textContent = money(totalFee);
  out.totalPointValue.textContent = money(totalPointValue);
  out.totalCashout.textContent = money(totalCashout);
  out.totalMonthlyBill.textContent = money(sum(selectedBills, "amount"));
  const averageFeeRate = totalCashout > 0 ? (totalFee / totalCashout) * 100 : 0;
  const averageRewardRate = totalCashout > 0 ? (totalPointValue / totalCashout) * 100 : 0;
  out.avgFeeRate.textContent = pct(averageFeeRate);
  out.avgRewardRate.textContent = pct(averageRewardRate);
  out.heroFeeRate.textContent = pct(averageFeeRate);
  out.heroRewardRate.textContent = pct(averageRewardRate);
  const yearText = selectedYear === "all" ? "全部年份" : selectedYear;
  const monthText = selectedMonth === "all" ? "全年" : `${Number(selectedMonth)} 月`;
  periodChip.textContent = selectedYear === "all" && selectedMonth === "all" ? "全部周期" : `${yearText} · ${monthText}`;
}

function renderTrend() {
  const chart = $("#trendChart");
  const empty = $("#trendEmpty");
  const byMonth = {};
  records.forEach((r) => {
    const k = monthKey(r.date);
    if (!k) return;
    byMonth[k] = (byMonth[k] || 0) + (r.pointValue - r.fee);
  });
  const keys = Object.keys(byMonth).sort();
  chart.innerHTML = "";
  empty.hidden = keys.length >= 2;
  if (keys.length < 2) return;
  const values = keys.map((k) => byMonth[k]);
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  chart.innerHTML = keys.slice(-12).map((k) => {
    const v = byMonth[k];
    const h = Math.max(4, Math.round((Math.abs(v) / maxAbs) * 64));
    const cls = v > 0 ? "positive" : v < 0 ? "negative" : "zero";
    return `<button class="trend-bar-group analytics-bar-button" type="button" data-month="${k}" title="查看 ${k} 记录">
      <div class="trend-bar ${cls}" style="height:${h}px" title="${k}: ${money(v)}"></div>
      <span class="trend-month">${k.slice(5)}</span>
    </button>`;
  }).join("");
  chart.querySelectorAll(".analytics-bar-button").forEach((button) => button.addEventListener("click", () => {
    switchView("fees");
    monthFilter.value = button.dataset.month;
    renderRecords();
  }));
}

function renderCardFeeChart() {
  const chart = $("#cardFeeChart");
  const empty = $("#cardFeeEmpty");
  const byCard = {};
  records.forEach((record) => {
    const legacyName = record.cardNameSnapshot || record.card || "未填写卡片";
    const key = record.cardId || `legacy:${legacyName}`;
    if (!byCard[key]) byCard[key] = { label: recordCardLabel(record), fee: 0 };
    byCard[key].fee += Number(record.fee || 0);
  });
  const items = Object.entries(byCard).filter(([, item]) => item.fee > 0).sort((a, b) => b[1].fee - a[1].fee).slice(0, 8);
  chart.innerHTML = "";
  empty.hidden = items.length > 0;
  if (!items.length) return;
  const max = Math.max(...items.map(([, item]) => item.fee), 0.01);
  items.forEach(([key, item]) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "card-fee-row";
    row.innerHTML = '<span class="card-fee-name"></span><span class="card-fee-track"><i></i></span><strong></strong>';
    row.querySelector(".card-fee-name").textContent = item.label;
    row.querySelector("i").style.setProperty("--fee-width", `${(item.fee / max) * 100}%`);
    row.querySelector("strong").textContent = money(item.fee);
    row.addEventListener("click", () => {
      switchView("fees");
      $("#recordCardFilter").value = key;
      advancedFilters.hidden = false;
      $("#toggleAdvancedFiltersButton").setAttribute("aria-expanded", "true");
      renderRecords();
    });
    chart.append(row);
  });
}

// 历史输入建议（信用卡 / 渠道）
function updateDatalists() {
  const currentCard = inputs.card.value;
  const channels = [...new Set(records.map((r) => r.channel).filter(Boolean))];
  const channelPresets = $("#channelPresets");
  inputs.card.innerHTML = '<option value="">选择已添加的信用卡</option>';
  cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.id;
    const tailLabel = card.lastFour ? `尾号 ${card.lastFour}` : "尾号未填写";
    option.textContent = `${card.name} · ${tailLabel} · 可用 ${money0(cardUsageForSelectedPeriod(card).available)}`;
    inputs.card.append(option);
  });
  if (currentCard && !cards.some((card) => card.id === currentCard)) {
    const legacyOption = document.createElement("option");
    legacyOption.value = currentCard;
    legacyOption.textContent = `${currentCard.startsWith("legacy:") ? currentCard.slice(7) : currentCard} · 历史记录`;
    inputs.card.append(legacyOption);
  }
  inputs.card.value = currentCard;
  renderBillCardOptions();
  channelPresets.innerHTML = "";
  channels.forEach((channel) => {
    const option = document.createElement("option");
    option.value = channel;
    channelPresets.append(option);
  });
}

function renderRecordSummary(list) {
  const totalSpend = sum(list, "cashout");
  const totalFee = sum(list, "fee");
  const totalPointValue = sum(list, "pointValue");
  const net = totalPointValue - totalFee;

  recordSummary.count.textContent = `${list.length} 笔`;
  recordSummary.spend.textContent = money(totalSpend);
  recordSummary.fee.textContent = money(totalFee);
  recordSummary.net.textContent = money(net);
  recordSummary.net.className = net < 0 ? "loss" : net > 0 ? "gain" : "";
}

function renderRecords() {
  const filtered = getFilteredRecords();
  recordsBody.innerHTML = "";
  emptyState.hidden = filtered.length > 0;
  renderRecordSummary(filtered);

  filtered.forEach((r) => {
    const net = r.pointValue - r.fee;
    const feeRate = r.cashout > 0 ? (r.fee / r.cashout * 100) : 0;
    const row = document.createElement("tr");
    if (r.id === editingId) row.classList.add("editing-row");
    row.innerHTML = `
      <td>${r.date}</td>
      <td><span class="cell-card"></span><span class="cell-note"></span></td>
      <td><span class="cell-method"></span></td>
      <td><span class="cell-channel"></span></td>
      <td class="num">${money(r.cashout)}</td>
      <td class="num">${money(r.fee)}</td>
      <td class="num"><span class="fee-rate-badge">${feeRate.toFixed(2)}%</span></td>
      <td class="num cell-strong">${money(r.pointValue)}</td>
      <td class="num ${net < 0 ? "loss" : "gain"}">${money(net)}</td>
      <td><span class="cell-bill-month"></span></td>
      <td>
        <div class="row-actions">
          <button class="edit-row" type="button" data-id="${r.id}">编辑</button>
          <button class="delete-row" type="button" data-id="${r.id}">删除</button>
        </div>
      </td>`;
    row.querySelector(".cell-card").textContent = recordCardLabel(r);
    const noteText = [r.points ? `${Number(r.points).toLocaleString("zh-CN")} 积分` : "", r.note].filter(Boolean).join(" · ");
    row.querySelector(".cell-note").textContent = noteText || "";
    row.querySelector(".cell-method").textContent = r.method || "未填写";
    row.querySelector(".cell-channel").textContent = r.channel || "—";
    const linkedBill = r.cardId ? getBillForCardMonth(r.cardId, monthKey(r.date)) : null;
    row.querySelector(".cell-bill-month").textContent = linkedBill ? `${monthKey(r.date)} · ${billStatus(linkedBill).label}` : monthKey(r.date) || "—";
    recordsBody.append(row);
  });

  $$("th.sortable").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === sortKey) {
      th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
      th.setAttribute("aria-sort", sortDir === "asc" ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
  });
}

function render() {
  renderMonthOptions();
  renderPeriodOptions();
  renderDashboard();
  renderStats();
  renderCards();
  renderCardSummary();
  renderBills();
  renderLoyaltyAccounts();
  renderAdvancedFilterOptions();
  renderRecords();
  renderTrend();
  renderCardFeeChart();
  renderRateHistory();
  updateLivePreview();
  updateDatalists();
  renderReminders();
  updateBackupCounts();
}

function exportLedgerSnapshot() {
  return {
    format: "credit-card-ledger-cloud",
    version: 2,
    data: {
      cards,
      bills,
      records,
      loyaltyAccounts,
      recentRates,
    },
    settings: {
      theme: document.documentElement.dataset.theme || "light",
      privacy: privacyEnabled,
      view: document.body.dataset.activeView || "cards",
      reminderReadIds: [...reminderReadIds],
    },
  };
}

function applyLedgerSnapshot(snapshot) {
  const payload = snapshot?.data;
  if (!payload || !Array.isArray(payload.cards) || !Array.isArray(payload.records) || !Array.isArray(payload.loyaltyAccounts)) {
    throw new Error("云端账本格式无效");
  }
  cards = payload.cards;
  bills = Array.isArray(payload.bills) ? payload.bills : [];
  records = payload.records;
  loyaltyAccounts = payload.loyaltyAccounts;
  recentRates = Array.isArray(payload.recentRates) ? payload.recentRates : [];
  reminderReadIds = new Set(Array.isArray(snapshot.settings?.reminderReadIds) ? snapshot.settings.reminderReadIds : []);
  migrateDataModel();
  saveCards();
  saveBills();
  saveRecords();
  saveLoyaltyAccounts();
  saveRecentRates();
  saveReminderReadState();
  if (snapshot.settings?.theme) applyTheme(snapshot.settings.theme);
  setPrivacy(Boolean(snapshot.settings?.privacy));
  render();
  if (validViews.has(snapshot.settings?.view)) switchView(snapshot.settings.view);
}

window.ledgerStateApi = Object.freeze({
  exportSnapshot: exportLedgerSnapshot,
  applySnapshot: applyLedgerSnapshot,
  hasMeaningfulData: () => cards.length + bills.length + records.length + loyaltyAccounts.length > 0,
});

/* ══════════════════════════════════════════════════
   记录表单状态
   ══════════════════════════════════════════════════ */
function resetForm() {
  form.reset();
  inputs.date.value = today();
  editingId = null;
  out.submitLabel.textContent = "保存记录";
  out.cancelEdit.hidden = true;
  $$(".rate-presets .rate-chip").forEach((c) => c.classList.remove("active"));
  updateLivePreview();
}

function populateFormForEdit(r) {
  openEntryDrawer({ reset: false, focus: false });
  inputs.date.value = r.date;
  inputs.card.value = r.cardId || getRecordCard(r)?.id || r.card || "";
  inputs.method.value = r.method || "";
  inputs.channel.value = r.channel || "";
  inputs.cashout.value = r.cashout || "";
  inputs.fee.value = r.fee || "";
  inputs.feeRate.value = r.cashout > 0 ? (r.fee / r.cashout * 100).toFixed(2) : "";
  inputs.points.value = r.points || "";
  inputs.pointValue.value = r.pointValue || "";
  inputs.note.value = r.note || "";
  editingId = r.id;
  out.submitLabel.textContent = "更新记录";
  out.cancelEdit.hidden = false;
  updateLivePreview();
  updateActiveChip();
  inputs.cashout.focus();
}

function collectRecord(id) {
  const previous = id ? records.find((record) => record.id === id) : null;
  const card = cardById(inputs.card.value);
  return {
    id: id || makeId(),
    date: inputs.date.value,
    cardId: card?.id || previous?.cardId || "",
    cardNameSnapshot: card?.name || previous?.cardNameSnapshot || previous?.card || "",
    card: card?.name || previous?.card || "",
    method: inputs.method.value,
    channel: inputs.channel.value.trim(),
    cashout: n(inputs.cashout),
    fee: n(inputs.fee),
    points: n(inputs.points),
    pointValue: n(inputs.pointValue),
    note: inputs.note.value.trim(),
    createdAt: previous?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* ══════════════════════════════════════════════════
   CSV 导出
   ══════════════════════════════════════════════════ */
function exportCsv() {
  const filtered = getFilteredRecords();
  if (!filtered.length) { showToast("当前没有可导出的记录", "error"); return; }
  const headers = ["日期", "信用卡", "卡片编号", "消费形式", "渠道", "套现金额", "手续费", "手续费率%", "积分数量", "积分价值", "净收益", "账单月份", "账单状态", "备注"];
  const rows = filtered.map((r) => {
    const rate = r.cashout > 0 ? (r.fee / r.cashout * 100).toFixed(2) : "0";
    const linkedBill = r.cardId ? getBillForCardMonth(r.cardId, monthKey(r.date)) : null;
    return [r.date, recordCardLabel(r), r.cardId || "", r.method || "", r.channel, r.cashout, r.fee, rate, r.points, r.pointValue, r.pointValue - r.fee, monthKey(r.date), linkedBill ? billStatus(linkedBill).label : "", r.note];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `积分成本账本-${monthFilter.value === "all" ? "全部" : monthFilter.value}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("CSV 导出成功");
}

/* ══════════════════════════════════════════════════
   事件绑定
   ══════════════════════════════════════════════════ */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  rememberRate(n(inputs.feeRate));
  if (editingId) {
    const idx = records.findIndex((r) => r.id === editingId);
    if (idx !== -1) records[idx] = collectRecord(editingId);
    showToast("记录已更新");
  } else {
    records = [collectRecord(), ...records];
    showToast("记录已保存");
  }
  saveRecords();
  resetForm();
  render();
  closeEntryDrawer();
});

recordsBody.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-row");
  const deleteBtn = e.target.closest(".delete-row");
  if (editBtn) {
    const r = records.find((x) => x.id === editBtn.dataset.id);
    if (r) populateFormForEdit(r);
    return;
  }
  if (deleteBtn) {
    if (!(await askConfirm("确定删除这条记录吗？此操作无法撤销。"))) return;
    records = records.filter((x) => x.id !== deleteBtn.dataset.id);
    if (editingId === deleteBtn.dataset.id) resetForm();
    saveRecords();
    render();
    showToast("记录已删除");
  }
});

$$("th.sortable").forEach((th) => {
  const doSort = () => {
    if (sortKey === th.dataset.sort) sortDir = sortDir === "asc" ? "desc" : "asc";
    else { sortKey = th.dataset.sort; sortDir = "desc"; }
    renderRecords();
  };
  th.addEventListener("click", doSort);
  th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doSort(); } });
});

monthFilter.addEventListener("change", renderRecords);
$("#toggleAdvancedFiltersButton").addEventListener("click", () => {
  const nextOpen = advancedFilters.hidden;
  advancedFilters.hidden = !nextOpen;
  $("#toggleAdvancedFiltersButton").setAttribute("aria-expanded", String(nextOpen));
});
[
  "#recordSearchInput", "#recordCardFilter", "#recordMethodFilter", "#recordNetFilter",
  "#recordStartDateFilter", "#recordEndDateFilter", "#recordMinAmountFilter", "#recordMaxAmountFilter",
].forEach((selector) => {
  const element = $(selector);
  element.addEventListener("input", renderRecords);
  element.addEventListener("change", renderRecords);
});
$("#resetAdvancedFiltersButton").addEventListener("click", () => {
  $("#recordSearchInput").value = "";
  $("#recordCardFilter").value = "all";
  $("#recordMethodFilter").value = "all";
  $("#recordNetFilter").value = "all";
  $("#recordStartDateFilter").value = "";
  $("#recordEndDateFilter").value = "";
  $("#recordMinAmountFilter").value = "";
  $("#recordMaxAmountFilter").value = "";
  monthFilter.value = "all";
  renderRecords();
});
dashboardYearFilter.addEventListener("change", () => { renderDashboard(); renderCards(); renderBills(); updateDatalists(); renderReminders(); });
dashboardMonthFilter.addEventListener("change", () => { renderDashboard(); renderCards(); renderBills(); updateDatalists(); renderReminders(); });
summaryYearFilter.addEventListener("change", renderStats);
summaryMonthFilter.addEventListener("change", renderStats);

$("#clearAllButton").addEventListener("click", async () => {
  if (!records.length) { showToast("没有可删除的记录", "error"); return; }
  if (!(await askConfirm(`确定删除全部 ${records.length} 条记录吗？此操作无法撤销。`))) return;
  records = [];
  saveRecords();
  resetForm();
  render();
  showToast("全部记录已删除");
});

$("#exportButton").addEventListener("click", exportCsv);
$("#resetFormButton").addEventListener("click", resetForm);
openEntryButton.addEventListener("click", () => openEntryDrawer());
entryDrawerCloseButton.addEventListener("click", closeEntryDrawer);
entryFormOverlay.addEventListener("click", (event) => {
  if (event.target === entryFormOverlay) closeEntryDrawer();
});
out.cancelEdit.addEventListener("click", () => {
  resetForm();
  closeEntryDrawer();
});

// ── 初始化 ───────────────────────────────────────
inputs.date.value = today();
render();

// ── 滚动入场动效（尊重减少动效偏好）─────────────
(function setupReveal() {
  const els = $$(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = `${Math.min(i * 60, 180)}ms`;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "-40px" });
  els.forEach((el) => io.observe(el));
})();

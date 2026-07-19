# Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt the complete credit-card ledger to a touch-first phone layout without removing or changing any existing data, feature, financial calculation, filter, backup operation, or Supabase synchronization behavior.

**Architecture:** Reuse the current four tab buttons, global tool buttons, record-rendering pipeline, and drawer DOM rather than creating parallel mobile features. Add a small presentation-only interaction layer in `app.js`, explicit mobile labels and sort controls in `index.html`, and one final CSS layer scoped to `@media (max-width: 760px)` so desktop behavior remains unchanged.

**Tech Stack:** Static HTML, CSS media queries and safe-area environment variables, vanilla JavaScript, Node.js built-in test runner, local browser verification.

---

## File Map

- `tests/mobile-responsive-layout.test.mjs`: source-contract coverage for mobile navigation, tools, record sorting/list labels, responsive layout, full-screen drawers, and cache versions.
- `index.html`: mobile tool trigger, compact navigation labels, mobile record sort control, and scroll-body wrappers for forms and utility drawers.
- `app.js`: mobile tool-menu state, outside-click/Escape behavior, mobile sort mapping, generated record labels, and desktop/mobile sort synchronization.
- `organic-liquid.css`: final `Mobile Responsive V81` layer scoped to phone widths, plus compact-phone refinements.
- `tests/dashboard-drawer-adaptation.test.mjs`: update the expected stylesheet cache version after the new CSS layer is wired.
- `tests/fee-visibility-ui.test.mjs`: update expected application and stylesheet versions while retaining visibility coverage.
- `tests/fee-dashboard-total-fees.test.mjs`: update the expected build and asset versions without changing fee semantics.
- `tests/performance-budget.test.mjs`: include the mobile surfaces in the no-blur performance contract where applicable.

### Task 1: Lock The Mobile Contracts With Failing Tests

**Files:**
- Create: `tests/mobile-responsive-layout.test.mjs`

- [ ] **Step 1: Write the mobile structure and behavior contract**

Create `tests/mobile-responsive-layout.test.mjs` with these assertions:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");
const marker = "Mobile Responsive V81";
const markerIndex = organicCss.indexOf(marker);
const mobileCss = markerIndex >= 0 ? organicCss.slice(markerIndex) : "";

test("phone navigation reuses all four application tabs", () => {
  assert.match(indexHtml, /id="mobileToolsButton"[^>]+aria-controls="mobileToolsMenu"[^>]+aria-expanded="false"/);
  assert.match(indexHtml, /id="mobileToolsMenu"[^>]+aria-label="全局工具"/);
  assert.deepEqual(
    [...indexHtml.matchAll(/class="mobile-tab-label"[^>]*>([^<]+)<\/span>/g)].map((match) => match[1]),
    ["卡片", "手续费", "看板", "积分"],
  );
  assert.match(appJs, /function setMobileToolsOpen\(open/);
  assert.match(appJs, /mobileToolsButton\.setAttribute\("aria-expanded", String\(shouldOpen\)\)/);
  assert.match(appJs, /mobileToolsMenu\.addEventListener\("click"/);
  assert.match(appJs, /document\.addEventListener\("click"/);
});

test("mobile record sorting maps to the existing sort state", () => {
  assert.match(indexHtml, /id="mobileRecordSort"[^>]+class="mobile-record-sort-select"/);
  assert.deepEqual(
    [...indexHtml.matchAll(/<option value="(date|cashout|fee|pointValue|net):(asc|desc)">/g)].map((match) => match[0]),
    [
      '<option value="date:desc">', '<option value="date:asc">',
      '<option value="cashout:desc">', '<option value="cashout:asc">',
      '<option value="fee:desc">', '<option value="fee:asc">',
      '<option value="pointValue:desc">', '<option value="pointValue:asc">',
      '<option value="net:desc">', '<option value="net:asc">',
    ],
  );
  assert.match(appJs, /function setRecordSort\(key, direction/);
  assert.match(appJs, /mobileRecordSort\.addEventListener\("change"/);
  assert.match(appJs, /mobileRecordSort\.value = `\$\{sortKey\}:\$\{sortDir\}`/);
});

test("generated fee records expose labels for phone list rows", () => {
  for (const [key, label] of [
    ["date", "日期"], ["card", "信用卡"], ["method", "消费形式"],
    ["channel", "渠道"], ["cashout", "套现金额"], ["fee", "手续费"],
    ["rate", "费率"], ["pointValue", "积分价值"], ["net", "净收益"],
    ["billMonth", "账单月份"], ["actions", "操作"],
  ]) {
    assert.match(appJs, new RegExp(`data-record-column="${key}" data-label="${label}"|data-label="${label}"[^>]+data-record-column="${key}"`));
  }
});

test("the final phone layer defines navigation, tools, safe areas, and touch targets", () => {
  assert.notEqual(markerIndex, -1, "the V81 mobile layer should exist");
  assert.match(mobileCss, /@media \(max-width:\s*760px\)/);
  assert.match(mobileCss, /\.section-tabs[\s\S]*position:\s*fixed[\s\S]*bottom:\s*0/);
  assert.match(mobileCss, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobileCss, /padding-bottom:[^;]*env\(safe-area-inset-bottom\)/);
  assert.match(mobileCss, /\.mobile-tools-button[\s\S]*min-width:\s*44px[\s\S]*min-height:\s*44px/);
  assert.match(mobileCss, /body\.mobile-tools-open[\s\S]*\.side-tool-rail[\s\S]*display:\s*grid/);
});

test("phone content uses two-column metrics and single-column long surfaces", () => {
  assert.match(mobileCss, /\.kpi-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobileCss, /\.record-summary-strip[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobileCss, /\.stats-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobileCss, /\.analytics-grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mobileCss, /\.cards-list[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mobileCss, /\.loyalty-list[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("phone fee table becomes a labeled list without horizontal scrolling", () => {
  assert.match(mobileCss, /\.records \.table-wrap[\s\S]*overflow-x:\s*visible/);
  assert.match(mobileCss, /\.records table[\s\S]*min-width:\s*0/);
  assert.match(mobileCss, /\.records thead[\s\S]*display:\s*none/);
  assert.match(mobileCss, /#recordsBody tr[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobileCss, /#recordsBody td::before[\s\S]*content:\s*attr\(data-label\)/);
  assert.match(mobileCss, /data-record-column="date"[\s\S]*grid-column:\s*1 \/ -1/);
});

test("all phone drawers cover the viewport with scrolling bodies", () => {
  assert.match(indexHtml, /class="loyalty-form-body"/);
  assert.ok((indexHtml.match(/class="utility-drawer-body"/g) || []).length >= 4);
  assert.match(mobileCss, /:is\(\.card-form-overlay,[\s\S]*\.right-drawer-overlay\)[\s\S]*height:\s*100dvh/);
  assert.match(mobileCss, /:is\(#cardForm,[\s\S]*\.utility-drawer\)[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto/);
  assert.match(mobileCss, /:is\(\.card-form-body,[\s\S]*\.utility-drawer-body\)[\s\S]*overflow-y:\s*auto/);
  assert.match(mobileCss, /\.field-row[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("mobile assets use fresh cache versions", () => {
  assert.match(indexHtml, /organic-liquid\.css\?v=81/);
  assert.match(indexHtml, /app\.js\?v=73/);
  assert.match(appJs, /window\.__pointsLedgerBuild = "mobile-responsive-v73"/);
});
```

- [ ] **Step 2: Run the focused test and confirm the intended failure**

Run:

```bash
node --test tests/mobile-responsive-layout.test.mjs
```

Expected: FAIL because `mobileToolsButton`, `mobileRecordSort`, generated `data-label` attributes, and the `Mobile Responsive V81` stylesheet layer do not exist yet.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/mobile-responsive-layout.test.mjs
git commit -m "test: define mobile responsive contracts"
```

### Task 2: Add Reusable Mobile Markup

**Files:**
- Modify: `index.html:153-243`
- Modify: `index.html:300-326`
- Modify: `index.html:638-681`
- Test: `tests/mobile-responsive-layout.test.mjs`

- [ ] **Step 1: Add scroll bodies to the loyalty and utility drawers**

Wrap the loyalty fields between its header and action bar in:

```html
<div class="loyalty-form-body">
  <label class="field"><span>积分项目</span><input id="loyaltyProgramInput" type="text" list="loyaltyProgramPresets" placeholder="如：国航里程" required /></label>
  <label class="field"><span>积分数量</span><input id="loyaltyBalanceInput" type="number" min="0" step="1" placeholder="0" required /></label>
  <label class="field"><span>会员账号</span><input id="loyaltyAccountInput" type="text" placeholder="会员号、手机号或邮箱" /></label>
  <div class="loyalty-expiry-row">
    <label class="field loyalty-expiry-date"><span>最近到期日</span><input id="loyaltyExpiryInput" type="date" /></label>
    <label class="rolling-toggle"><input id="loyaltyRollingInput" type="checkbox" /><span class="rolling-toggle-track" aria-hidden="true"><i></i></span><span class="rolling-toggle-copy"><strong>滚动有效</strong><small>有活动时有效期顺延</small></span></label>
  </div>
  <label class="field loyalty-reminder-field">
    <span>到期前提醒</span>
    <div class="loyalty-reminder-input"><input id="loyaltyReminderDaysInput" type="number" min="1" max="3650" step="1" placeholder="如：90" /><small>天前推送到待办，留空表示不提醒</small></div>
  </label>
  <label class="field"><span>备注</span><textarea id="loyaltyNoteInput" rows="2" placeholder="等级、兑换计划、到期积分等"></textarea></label>
</div>
```

Wrap each utility drawer's existing content below `.drawer-head` in one `.utility-drawer-body` while retaining every existing ID:

```html
<div class="utility-drawer-body">
  <div class="reminder-overview"><strong id="reminderCountText">0 项待办</strong><span>账单、还款、临额、积分和年费任务</span></div>
  <div id="reminderList" class="reminder-list"></div>
</div>
```

Use these exact body boundaries for the remaining utility drawers without moving or renaming any control IDs:

```html
<div class="utility-drawer-body">
  <div class="data-tool-list">
    <button id="exportBackupButton" class="data-tool-button" type="button"><strong>导出完整备份</strong><span>卡片、记录、积分账户和设置</span></button>
    <button id="importBackupButton" class="data-tool-button" type="button"><strong>导入完整备份</strong><span>从 JSON 文件恢复并覆盖当前数据</span></button>
    <input id="importBackupInput" type="file" accept="application/json,.json" hidden />
  </div>
  <div class="data-health">
    <span><small>信用卡</small><strong id="backupCardCount">0</strong></span>
    <span><small>月度账单</small><strong id="backupBillCount">0</strong></span>
    <span><small>手续费记录</small><strong id="backupRecordCount">0</strong></span>
    <span><small>积分账户</small><strong id="backupLoyaltyCount">0</strong></span>
  </div>
</div>

<div class="utility-drawer-body">
  <div id="statementContent"></div>
</div>

<div class="utility-drawer-body">
  <div class="account-summary">
    <span>当前账号</span>
    <strong id="accountEmail">未登录</strong>
    <small id="cloudSyncState" data-state="signed-out">未登录</small>
  </div>
  <div class="account-actions">
    <button id="syncNowButton" type="button"><strong>立即同步</strong><span>读取其他设备的最新数据</span></button>
    <button id="uploadLocalButton" type="button"><strong>上传本机数据</strong><span>用当前设备覆盖云端账本</span></button>
    <button id="signOutButton" class="danger" type="button"><strong>退出登录</strong><span>保留本机缓存并结束云端会话</span></button>
  </div>
</div>
```

- [ ] **Step 2: Add the phone tools trigger and compact tab labels**

Change the brand and existing tool rail to:

```html
<div class="app-brand">
  <h1>信用卡<span class="gradient-text">管理账本</span></h1>
  <button id="mobileToolsButton" class="mobile-tools-button" type="button" aria-label="打开全局工具" aria-controls="mobileToolsMenu" aria-expanded="false" title="全局工具"><span aria-hidden="true">•••</span></button>
</div>
```

Each existing tab keeps its current `strong`, `small`, role, IDs, and `data-view-tab`, and receives a phone-only label. The four labels are:

```html
<span class="mobile-tab-label" aria-hidden="true">卡片</span>
<span class="mobile-tab-label" aria-hidden="true">手续费</span>
<span class="mobile-tab-label" aria-hidden="true">看板</span>
<span class="mobile-tab-label" aria-hidden="true">积分</span>
```

Give the existing tool rail the controlled ID without duplicating any buttons:

```html
<div id="mobileToolsMenu" class="brand-tools side-tool-rail" aria-label="全局工具">
```

- [ ] **Step 3: Add a phone-only record sort selector**

Insert this label in the fee-record toolbar after the month selector:

```html
<label class="select-field mobile-record-sort">
  <span>排序</span>
  <select id="mobileRecordSort" class="mobile-record-sort-select" aria-label="记录排序">
    <option value="date:desc">日期：最新优先</option>
    <option value="date:asc">日期：最早优先</option>
    <option value="cashout:desc">套现金额：从高到低</option>
    <option value="cashout:asc">套现金额：从低到高</option>
    <option value="fee:desc">手续费：从高到低</option>
    <option value="fee:asc">手续费：从低到高</option>
    <option value="pointValue:desc">积分价值：从高到低</option>
    <option value="pointValue:asc">积分价值：从低到高</option>
    <option value="net:desc">净收益：从高到低</option>
    <option value="net:asc">净收益：从低到高</option>
  </select>
</label>
```

- [ ] **Step 4: Run the structure tests**

Run:

```bash
node --test tests/mobile-responsive-layout.test.mjs tests/dashboard-drawer-adaptation.test.mjs
```

Expected: the markup assertions PASS; behavior, CSS, and cache assertions remain FAIL.

### Task 3: Wire Mobile Tools And Record Sorting

**Files:**
- Modify: `app.js:49-75`
- Modify: `app.js:243-303`
- Modify: `app.js:788-804`
- Modify: `app.js:1133-1151`
- Modify: `app.js:2190-2237`
- Modify: `app.js:2431-2439`
- Test: `tests/mobile-responsive-layout.test.mjs`

- [ ] **Step 1: Reference the new presentation controls**

Add these constants beside the current form and utility element references:

```js
const mobileToolsButton = $("#mobileToolsButton");
const mobileToolsMenu = $("#mobileToolsMenu");
const mobileRecordSort = $("#mobileRecordSort");
const mobileViewport = window.matchMedia("(max-width: 760px)");
```

- [ ] **Step 2: Add one authoritative mobile tool-menu state function**

Add before `switchView`:

```js
function setMobileToolsOpen(open, { restoreFocus = false } = {}) {
  const shouldOpen = Boolean(open) && mobileViewport.matches;
  document.body.classList.toggle("mobile-tools-open", shouldOpen);
  mobileToolsButton.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen && restoreFocus) mobileToolsButton.focus();
}
```

At the beginning of `switchView`, close it with:

```js
setMobileToolsOpen(false);
```

- [ ] **Step 3: Wire click, outside-click, viewport, and Escape behavior**

Add beside the existing global-tool listeners:

```js
mobileToolsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  setMobileToolsOpen(mobileToolsButton.getAttribute("aria-expanded") !== "true");
});
mobileToolsMenu.addEventListener("click", (event) => {
  if (event.target.closest("button")) setMobileToolsOpen(false);
});
document.addEventListener("click", (event) => {
  if (mobileToolsButton.getAttribute("aria-expanded") !== "true") return;
  if (!mobileToolsMenu.contains(event.target) && !mobileToolsButton.contains(event.target)) {
    setMobileToolsOpen(false);
  }
});
mobileViewport.addEventListener("change", () => setMobileToolsOpen(false));
```

Make the mobile tool menu the first Escape branch:

```js
if (e.key === "Escape" && mobileToolsButton.getAttribute("aria-expanded") === "true") {
  setMobileToolsOpen(false, { restoreFocus: true });
} else if (e.key === "Escape" && !displaySettingsPanel.hidden) {
```

- [ ] **Step 4: Centralize desktop and mobile record sorting**

Add before `renderRecords`:

```js
const validRecordSortKeys = new Set(["date", "cashout", "fee", "pointValue", "net"]);

function syncRecordSortControls() {
  mobileRecordSort.value = `${sortKey}:${sortDir}`;
}

function setRecordSort(key, direction = "desc") {
  if (!validRecordSortKeys.has(key)) return;
  sortKey = key;
  sortDir = direction === "asc" ? "asc" : "desc";
  syncRecordSortControls();
  renderRecords();
}
```

Call `syncRecordSortControls()` at the end of `renderRecords`. Replace the existing table-header mutation with:

```js
const nextDirection = sortKey === th.dataset.sort && sortDir === "desc" ? "asc" : "desc";
setRecordSort(th.dataset.sort, nextDirection);
```

Add the mobile handler:

```js
mobileRecordSort.addEventListener("change", () => {
  const [key, direction] = mobileRecordSort.value.split(":");
  setRecordSort(key, direction);
});
```

- [ ] **Step 5: Label every generated record cell**

Generate the existing cells with both visibility and phone labels:

```js
row.innerHTML = `
  <td data-record-column="date" data-label="日期">${r.date}</td>
  <td class="record-card-cell" data-record-column="card" data-label="信用卡"><span class="cell-card"></span><span class="cell-note"></span></td>
  <td data-record-column="method" data-label="消费形式"><span class="cell-method"></span></td>
  <td data-record-column="channel" data-label="渠道"><span class="cell-channel"></span></td>
  <td class="num" data-record-column="cashout" data-label="套现金额">${money(r.cashout)}</td>
  <td class="num" data-record-column="fee" data-label="手续费">${money(r.fee)}</td>
  <td class="num" data-record-column="rate" data-label="费率"><span class="fee-rate-badge">${feeRate.toFixed(2)}%</span></td>
  <td class="num cell-strong" data-record-column="pointValue" data-label="积分价值">${money(r.pointValue)}</td>
  <td class="num ${net < 0 ? "loss" : "gain"}" data-record-column="net" data-label="净收益">${money(net)}</td>
  <td data-record-column="billMonth" data-label="账单月份"><span class="cell-bill-month"></span></td>
  <td data-record-column="actions" data-label="操作">
    <div class="row-actions">
      <button class="edit-row" type="button" data-id="${r.id}">编辑</button>
      <button class="delete-row" type="button" data-id="${r.id}">删除</button>
    </div>
  </td>`;
```

- [ ] **Step 6: Run the interaction contract and syntax check**

Run:

```bash
node --test tests/mobile-responsive-layout.test.mjs
node --check app.js
```

Expected: tool, sort, and record-label assertions PASS; CSS and cache assertions remain FAIL; syntax check exits successfully.

- [ ] **Step 7: Commit markup and interaction changes**

```bash
git add index.html app.js
git commit -m "feat: add mobile navigation controls"
```

### Task 4: Add The Scoped Phone Layout

**Files:**
- Modify: `organic-liquid.css` after the current final layer
- Test: `tests/mobile-responsive-layout.test.mjs`

- [ ] **Step 1: Add phone layout variables, top bar, bottom navigation, and tool menu**

Append a final layer beginning with:

```css
/* -- Mobile Responsive V81 -- */
.mobile-tools-button,
.mobile-tab-label,
.mobile-record-sort {
  display: none;
}

@media (max-width: 760px) {
  html[data-ui="organic-v41"] {
    --mobile-gutter: 12px;
    --mobile-topbar-height: 56px;
    --mobile-nav-height: 64px;
    --fixed-header-offset: calc(var(--mobile-topbar-height) + env(safe-area-inset-top));
    overflow-x: clip;
  }

  html[data-ui="organic-v41"] body {
    min-width: 0;
    overflow-x: clip;
    padding-top: var(--fixed-header-offset);
    padding-bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 16px);
  }

  html[data-ui="organic-v41"] .page {
    width: 100%;
    max-width: 100%;
    padding-inline: var(--mobile-gutter);
  }

  html[data-ui="organic-v41"] .app-header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 180;
    width: 100%;
    min-height: var(--fixed-header-offset);
    padding: env(safe-area-inset-top) var(--mobile-gutter) 0;
  }

  html[data-ui="organic-v41"] .app-header .app-brand {
    width: 100%;
    min-height: var(--mobile-topbar-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  html[data-ui="organic-v41"] .mobile-tools-button {
    min-width: 44px;
    min-height: 44px;
    display: grid;
    place-items: center;
  }

  html[data-ui="organic-v41"] .app-header .section-tabs {
    position: fixed;
    inset: auto 0 0;
    z-index: 175;
    min-height: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom));
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
  }

  html[data-ui="organic-v41"] .app-header .section-tab {
    min-width: 0;
    min-height: 44px;
    display: grid;
    place-items: center;
  }

  html[data-ui="organic-v41"] .app-header .section-tab :is(.tab-index, strong, small) {
    display: none;
  }

  html[data-ui="organic-v41"] .app-header .section-tab .mobile-tab-label {
    display: block;
  }

  html[data-ui="organic-v41"] .side-tool-rail {
    position: fixed;
    top: calc(var(--fixed-header-offset) + 6px);
    right: var(--mobile-gutter);
    bottom: auto;
    left: auto;
    z-index: 190;
    display: none;
    grid-template-columns: repeat(3, 44px);
    width: auto;
    padding: 8px;
  }

  html[data-ui="organic-v41"] body.mobile-tools-open .side-tool-rail {
    display: grid;
  }

  html[data-ui="organic-v41"] .side-tool-rail :is(.theme-toggle, .header-tool-button) {
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
  }
}
```

- [ ] **Step 2: Add view-specific phone reflow rules**

Inside the same media query, define two-column numeric grids and one-column long surfaces:

```css
html[data-ui="organic-v41"] :is(.kpi-grid, .record-summary-strip, .stats-grid, .loyalty-overview) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

html[data-ui="organic-v41"] :is(.analytics-grid, .cards-list, .loyalty-list) {
  grid-template-columns: minmax(0, 1fr);
}

html[data-ui="organic-v41"] :is(.dashboard, .cards-panel, .records, .loyalty-panel, .analytics) {
  width: 100%;
  min-width: 0;
  margin-inline: 0;
}

html[data-ui="organic-v41"] .repayment-strip {
  grid-template-columns: minmax(0, 1fr);
}

html[data-ui="organic-v41"] .card-row-wide,
html[data-ui="organic-v41"] .loyalty-card {
  width: 100%;
  min-width: 0;
}

html[data-ui="organic-v41"] :is(.card-row-actions, .loyalty-actions) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

html[data-ui="organic-v41"] #view-fee-dashboard.hero {
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
}

html[data-ui="organic-v41"] #view-fee-dashboard .hero-graphic {
  display: none;
}

html[data-ui="organic-v41"] #view-fee-dashboard .net-card {
  min-height: 0;
}
```

- [ ] **Step 3: Convert fee records to a labeled phone list**

Inside the same media query, add:

```css
html[data-ui="organic-v41"] .mobile-record-sort {
  display: grid;
}

html[data-ui="organic-v41"] .records .table-wrap {
  overflow-x: visible;
}

html[data-ui="organic-v41"] .records table,
html[data-ui="organic-v41"] .records tbody {
  min-width: 0;
  width: 100%;
  display: block;
}

html[data-ui="organic-v41"] .records thead {
  display: none;
}

html[data-ui="organic-v41"] #recordsBody tr {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  padding: 12px 0;
  border-bottom: 1px solid rgba(93, 112, 82, 0.14);
}

html[data-ui="organic-v41"] #recordsBody td {
  min-width: 0;
  display: block;
  padding: 8px 6px;
  border: 0;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
}

html[data-ui="organic-v41"] #recordsBody td::before {
  content: attr(data-label);
  display: block;
  margin-bottom: 3px;
  color: var(--muted-foreground);
  font-size: 0.68rem;
  font-weight: 700;
}

html[data-ui="organic-v41"] #recordsBody td[data-record-column="date"],
html[data-ui="organic-v41"] #recordsBody td[data-record-column="card"],
html[data-ui="organic-v41"] #recordsBody td[data-record-column="billMonth"],
html[data-ui="organic-v41"] #recordsBody td[data-record-column="actions"] {
  grid-column: 1 / -1;
}

html[data-ui="organic-v41"] #recordsBody .row-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

- [ ] **Step 4: Make every phone drawer full-screen with stable header, body, and actions**

Inside the same media query, add:

```css
html[data-ui="organic-v41"] :is(
  .card-form-overlay,
  .card-summary-overlay,
  .bill-form-overlay,
  .loyalty-form-overlay,
  .entry-form-overlay,
  .right-drawer-overlay
) {
  inset: 0;
  z-index: 240;
  width: 100vw;
  height: 100dvh;
  padding: 0;
}

html[data-ui="organic-v41"] :is(
  #cardForm,
  .bill-form,
  .loyalty-form,
  .entry-drawer,
  .card-summary-panel,
  .utility-drawer
) {
  width: 100vw;
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 0;
}

html[data-ui="organic-v41"] :is(
  .card-form-body,
  .bill-form-body,
  .loyalty-form-body,
  .entry-drawer-body,
  .card-summary-table-wrap,
  .utility-drawer-body
) {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

html[data-ui="organic-v41"] :is(.drawer-head, .card-summary-head) {
  padding-top: calc(10px + env(safe-area-inset-top));
}

html[data-ui="organic-v41"] :is(.card-form-actions, .entry-drawer-actions) {
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
}

html[data-ui="organic-v41"] :is(.field-row, .entry-row-primary, .entry-row-channel, .loyalty-expiry-row) {
  grid-template-columns: minmax(0, 1fr);
}
```

Create the entry form's stable three-region shell by inserting `<div class="entry-drawer-body">` immediately before `.entry-row-primary`, closing it immediately after `.live-card`, and wrapping the existing submit and cancel controls exactly as follows:

```html
<div class="entry-drawer-actions">
  <button class="btn-primary" type="submit">
    <span id="submitLabel">保存记录</span>
    <span class="arrow" aria-hidden="true">→</span>
  </button>
  <button class="btn-ghost btn-cancel" type="button" id="cancelEditButton" hidden>取消编辑</button>
</div>
```

- [ ] **Step 5: Add compact-phone and accessibility refinements**

Append:

```css
@media (max-width: 430px) {
  html[data-ui="organic-v41"] .advanced-filters,
  html[data-ui="organic-v41"] .toolbar,
  html[data-ui="organic-v41"] :is(.card-row-actions, .loyalty-actions) {
    grid-template-columns: minmax(0, 1fr);
  }

  html[data-ui="organic-v41"] :is(.kpi-grid, .record-summary-strip, .stats-grid) {
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  html[data-ui="organic-v41"] .side-tool-rail,
  html[data-ui="organic-v41"] .section-tabs {
    transition: none !important;
  }
}
```

- [ ] **Step 6: Run the focused mobile contract**

Run:

```bash
node --test tests/mobile-responsive-layout.test.mjs
```

Expected: layout assertions PASS; only cache/build assertions may remain FAIL until Task 5.

### Task 5: Bump Asset Versions And Update Exact-Version Tests

**Files:**
- Modify: `index.html:10-15`
- Modify: `index.html:737-741`
- Modify: `app.js:15`
- Modify: `tests/dashboard-drawer-adaptation.test.mjs`
- Modify: `tests/fee-visibility-ui.test.mjs`
- Modify: `tests/fee-dashboard-total-fees.test.mjs`
- Modify: `tests/performance-budget.test.mjs`

- [ ] **Step 1: Wire fresh assets and build identity**

Use these exact versions:

```html
<link rel="stylesheet" href="./organic-liquid.css?v=81" />
<script src="./app.js?v=73"></script>
```

Set:

```js
window.__pointsLedgerBuild = "mobile-responsive-v73";
```

- [ ] **Step 2: Update tests that intentionally pin the previous versions**

Change exact `organic-liquid.css?v=80` expectations to `organic-liquid.css?v=81`, exact `app.js?v=72` expectations to `app.js?v=73`, and the old build string expectation to:

```js
assert.match(appJs, /window\.__pointsLedgerBuild = "mobile-responsive-v73"/);
```

Retain all fee-total, display-visibility, drawer, and performance assertions unchanged.

- [ ] **Step 3: Run all source-contract tests**

Run:

```bash
node --test tests/*.test.mjs tests/*.test.cjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 4: Commit the responsive stylesheet and version updates**

```bash
git add organic-liquid.css index.html app.js tests/mobile-responsive-layout.test.mjs tests/dashboard-drawer-adaptation.test.mjs tests/fee-visibility-ui.test.mjs tests/fee-dashboard-total-fees.test.mjs tests/performance-budget.test.mjs
git commit -m "feat: adapt ledger for mobile devices"
```

### Task 6: Verify Behavior And Visual Layout At Three Phone Sizes

**Files:**
- Modify only if verification finds a reproducible issue: `index.html`, `app.js`, `organic-liquid.css`, `tests/mobile-responsive-layout.test.mjs`

- [ ] **Step 1: Run syntax, regression, and whitespace checks**

Run:

```bash
node --check app.js
node --check cloud-sync.js
node --test tests/*.test.mjs tests/*.test.cjs
git diff --check
```

Expected: both syntax checks exit successfully, every test passes, and `git diff --check` prints no errors.

- [ ] **Step 2: Verify all four views at 390x844**

Open `http://localhost:8768/`, set the viewport to `390x844`, and verify:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Expected: `true` in 卡片, 手续费, 看板, and 积分. The bottom navigation remains visible, the final content clears it, all four tabs switch views, the top tools button opens and closes its menu, and every tool still opens its existing drawer or toggles its existing state.

- [ ] **Step 3: Verify compact and wide phone viewports**

Repeat all four views at `360x800` and `430x932`.

Expected: no horizontal overflow; metric pairs remain readable; long cards, notes, points, and amounts wrap; advanced filters use one column at 430px and below; charts remain one column.

- [ ] **Step 4: Verify representative drawers and scrolling**

At `390x844`, open add card, register bill, add fee record, card summary, add loyalty account, reminders, backup, account sync, and statement drawers.

Expected: each covers the full viewport above both navigation bars, its close action stays visible, its body scrolls independently, and save/cancel actions remain reachable without horizontal scrolling.

- [ ] **Step 5: Verify light/dark and interaction states**

Verify both themes, the mobile sort selector, desktop table-header sorting after returning above 760px, display-column visibility, Escape closing order, privacy mode, and backup opening.

Expected: mobile and desktop sorting stay synchronized; tool-menu `aria-expanded` is accurate; hidden fee columns remain hidden in phone records; light and dark text remain readable.

- [ ] **Step 6: Re-run checks after any visual correction**

Run:

```bash
node --check app.js
node --test tests/*.test.mjs tests/*.test.cjs
git diff --check
```

Expected: all commands succeed again after the final visual adjustment.

### Task 7: Commit The Complete Pending Work And Push GitHub

**Files:**
- Include: all intentional tracked and untracked project changes shown by `git status`

- [ ] **Step 1: Review the final scope**

Run:

```bash
git status --short
git diff --stat
git log --oneline --decorate -5
```

Expected: only the approved ledger improvements, plans, tests, and mobile adaptation are pending; branch remains `main` and the existing remote is unchanged.

- [ ] **Step 2: Stage and commit any remaining approved files**

```bash
git add app.js index.html organic-liquid.css tests docs/superpowers
git commit -m "feat: complete mobile credit card ledger"
```

If the index is already clean because the implementation commits contain every approved file, this commit is unnecessary.

- [ ] **Step 3: Verify the exact committed tree**

Run:

```bash
node --check app.js
node --check cloud-sync.js
node --test tests/*.test.mjs tests/*.test.cjs
git status --short --branch
```

Expected: all checks pass and the worktree is clean, with `main` ahead of `origin/main` only by the intentional local commits.

- [ ] **Step 4: Push the existing main branch**

```bash
git push origin main
```

Expected: the push succeeds and `git status --short --branch` reports `main...origin/main` with no ahead/behind count and no uncommitted files.

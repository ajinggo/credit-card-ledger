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
    assert.match(
      appJs,
      new RegExp(`data-record-column="${key}" data-label="${label}"|data-label="${label}"[^>]+data-record-column="${key}"`),
    );
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

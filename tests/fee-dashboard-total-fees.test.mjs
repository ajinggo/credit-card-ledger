import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");

const renderStatsSource = appJs.match(/function renderStats\(\)[\s\S]*?(?=\nfunction renderTrend\(\))/)?.[0] || "";
const renderTrendSource = appJs.match(/function renderTrend\(\)[\s\S]*?(?=\nfunction renderCardFeeChart\(\))/)?.[0] || "";

test("fee dashboard presents actual fee costs instead of estimated net profit", () => {
  assert.match(indexHtml, /<span>总手续费<\/span><span>Total Fees<\/span>/);
  assert.match(indexHtml, /<strong>月度手续费<\/strong><span>按月汇总实际手续费<\/span>/);
  assert.match(indexHtml, /aria-label="月度手续费趋势"/);
  assert.doesNotMatch(indexHtml, /月度净收益|积分价值减手续费/);
});

test("headline total uses the period-filtered fee sum", () => {
  assert.match(renderStatsSource, /const totalFee = sum\(f, "fee"\)/);
  assert.match(renderStatsSource, /out\.netProfit\.textContent = money\(totalFee\)/);
  assert.match(renderStatsSource, /当前周期暂无手续费记录/);
  assert.doesNotMatch(renderStatsSource, /const net = totalPointValue - totalFee/);
});

test("monthly trend aggregates fees without requiring point values", () => {
  assert.match(renderTrendSource, /byMonth\[k\] = \(byMonth\[k\] \|\| 0\) \+ Number\(r\.fee \|\| 0\)/);
  assert.doesNotMatch(renderTrendSource, /pointValue|r\.fee\)/);
});

test("dashboard script cache identifies the fee-cost build", () => {
  assert.match(indexHtml, /app\.js\?v=71/);
  assert.match(appJs, /window\.__pointsLedgerBuild = "fee-dashboard-total-fees-v71"/);
});

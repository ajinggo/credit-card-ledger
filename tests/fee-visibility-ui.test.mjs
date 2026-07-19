import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");

const valuesFor = (source, attribute) => [...source.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g"))]
  .map((match) => match[1]);

const summaryKeys = ["count", "spend", "fee", "net"];
const columnKeys = [
  "date", "card", "method", "channel", "cashout", "fee",
  "rate", "pointValue", "net", "billMonth", "actions",
];

test("fee records expose a complete display-settings menu", () => {
  assert.match(indexHtml, /id="displaySettingsButton"[^>]+aria-controls="displaySettingsPanel"/);
  assert.match(indexHtml, /id="displaySettingsPanel"[^>]+hidden/);
  assert.match(indexHtml, /id="resetDisplaySettingsButton"/);
  assert.match(indexHtml, /id="displaySettingsStatus"[^>]+role="status"/);
  assert.deepEqual(valuesFor(indexHtml, "data-summary-visibility"), summaryKeys);
  assert.deepEqual(valuesFor(indexHtml, "data-column-visibility"), columnKeys);
});

test("every summary metric and table heading has a visibility target", () => {
  assert.deepEqual(valuesFor(indexHtml, "data-summary-metric"), summaryKeys);
  assert.deepEqual(valuesFor(indexHtml, "data-record-column"), columnKeys);
});

test("display settings include explicit hidden and responsive styles", () => {
  assert.match(organicCss, /Display Settings V77/);
  assert.match(organicCss, /#displaySettingsPanel\[hidden\][\s\S]*display:\s*none\s*!important/);
  assert.match(organicCss, /\[data-record-column\]\[hidden\][\s\S]*display:\s*none\s*!important/);
  assert.match(organicCss, /@media \(max-width:\s*620px\)[\s\S]*\.display-settings-panel/);
});

test("visibility model and cache versions are wired before the app", () => {
  const modelIndex = indexHtml.indexOf("fee-visibility-model.js?v=1");
  const appIndex = indexHtml.indexOf("app.js?v=74");
  assert.ok(modelIndex > -1 && appIndex > modelIndex);
  assert.match(indexHtml, /organic-liquid\.css\?v=82/);
  assert.match(appJs, /const FeeVisibilityModel = window\.FeeVisibilityModel/);
});

test("runtime persists and applies visibility to generated record cells", () => {
  assert.match(appJs, /const FEE_VISIBILITY_KEY = "pointsLedger_fee_visibility_v1"/);
  assert.match(appJs, /const FeeVisibilityModel = window\.FeeVisibilityModel/);
  assert.match(appJs, /function applyFeeVisibility\(\)/);
  assert.match(appJs, /localStorage\.setItem\(FEE_VISIBILITY_KEY, JSON\.stringify\(feeVisibility\)\)/);
  assert.match(appJs, /const attemptedHide = !input\.checked[\s\S]*applyFeeVisibility\(\);[\s\S]*showDisplaySettingsStatus\("至少保留一个明细列", "error"\)/);
  assert.match(appJs, /showDisplaySettingsStatus\("已恢复默认"\)/);
  assert.deepEqual(valuesFor(appJs, "data-record-column"), columnKeys);
});

test("backup and cloud snapshots carry normalized visibility settings", () => {
  assert.ok((appJs.match(/feeVisibility,/g) || []).length >= 2);
  assert.match(appJs, /FeeVisibilityModel\.normalizeVisibility\(backup\.settings\?\.feeVisibility\)/);
  assert.match(appJs, /FeeVisibilityModel\.normalizeVisibility\(snapshot\.settings\?\.feeVisibility\)/);
});

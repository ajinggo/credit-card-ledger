import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");
const marker = "Dashboard Density & Drawer Adaptation V80";
const markerIndex = organicCss.indexOf(marker);
const layoutLayer = markerIndex >= 0 ? organicCss.slice(markerIndex) : "";
const primaryDrawerRule = layoutLayer.match(
  /:is\(\.card-form-overlay,\s*\.card-summary-overlay,\s*\.bill-form-overlay\)\s*\{([\s\S]*?)\}/,
)?.[1] || "";

test("primary card drawers cover the fixed header", () => {
  assert.notEqual(markerIndex, -1, "the V80 layout layer should exist");
  assert.match(primaryDrawerRule, /top:\s*0/);
  assert.match(primaryDrawerRule, /bottom:\s*0/);
  assert.match(primaryDrawerRule, /height:\s*100dvh/);
  assert.match(primaryDrawerRule, /z-index:\s*220/);
  assert.doesNotMatch(primaryDrawerRule, /fixed-header-offset/);
  assert.match(layoutLayer, /\.card-summary-panel[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/);
  assert.match(layoutLayer, /\.card-summary-table thead th[\s\S]*position:\s*sticky/);
  assert.match(layoutLayer, /:is\(#cardForm,\s*\.bill-form\) \.card-form-actions[\s\S]*grid-row:\s*3/);
});

test("bill drawer has independent header, scrolling body, and footer regions", () => {
  assert.match(indexHtml, /<div class="bill-form-body">[\s\S]*id="billLiveStatus"[\s\S]*<\/div>\s*<div class="card-form-actions">/);
  assert.match(layoutLayer, /:is\(#cardForm,\s*\.bill-form\)\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto/);
  assert.match(layoutLayer, /:is\(\.card-form-body,\s*\.bill-form-body\)\s*\{[\s\S]*overflow-y:\s*auto/);
});

test("add-card drawer uses the same bounded shell as the other drawers", () => {
  assert.match(
    layoutLayer,
    /:is\(\.card-form-overlay,\s*\.card-summary-overlay,\s*\.bill-form-overlay\)\s*\{/,
  );
  assert.match(
    indexHtml,
    /<form id="cardForm"[\s\S]*<div class="card-form-body">[\s\S]*id="cardAnnualFeeTargetInput"[\s\S]*<\/div>\s*<div class="card-form-actions">/,
  );
  assert.match(
    layoutLayer,
    /:is\(#cardForm,\s*\.bill-form\)\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto/,
  );
  assert.match(layoutLayer, /:is\(\.card-form-body,\s*\.bill-form-body\)\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(layoutLayer, /:is\(#cardForm,\s*\.bill-form\) \.card-form-actions[\s\S]*grid-row:\s*3/);
  assert.match(
    layoutLayer,
    /@media\s*\(max-width:\s*760px\)[\s\S]*:is\(\.card-summary-panel,\s*#cardForm,\s*\.bill-form\)[\s\S]*:is\(#cardForm,\s*\.bill-form\) \.field-row[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
});

test("desktop fee dashboard uses the approved compact first-screen dimensions", () => {
  assert.notEqual(markerIndex, -1, "the V80 layout layer should exist");
  assert.match(indexHtml, /organic-liquid\.css\?v=83/);
  assert.match(layoutLayer, /@media\s*\(min-width:\s*981px\)/);
  assert.match(layoutLayer, /#view-fee-dashboard\.hero[\s\S]*min-height:\s*12\.5rem/);
  assert.match(layoutLayer, /#view-fee-dashboard[\s\S]*\.net-card[\s\S]*min-height:\s*12\.5rem/);
  assert.match(layoutLayer, /\.stats\[data-view="fee-dashboard"\][\s\S]*padding:\s*1rem 1\.1rem/);
  assert.match(layoutLayer, /\.stats\[data-view="fee-dashboard"\] \.stat[\s\S]*min-height:\s*4\.75rem/);
});

test("mobile card summary becomes a readable grid without horizontal scrolling", () => {
  assert.match(layoutLayer, /@media\s*\(max-width:\s*760px\)/);
  assert.match(layoutLayer, /\.card-summary-table\s*\{[\s\S]*min-width:\s*0[\s\S]*width:\s*100%/);
  assert.match(layoutLayer, /\.card-summary-table thead\s*\{[\s\S]*display:\s*none/);
  assert.match(layoutLayer, /\.card-summary-table tbody tr\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test("desktop card summary keeps all five columns inside the drawer", () => {
  assert.match(layoutLayer, /\.card-summary-table\s*\{[\s\S]*width:\s*100%[\s\S]*table-layout:\s*fixed/);
  assert.match(layoutLayer, /\.card-summary-table :is\(th,\s*td\)[\s\S]*white-space:\s*normal[\s\S]*overflow-wrap:\s*anywhere/);
  assert.match(layoutLayer, /\.card-summary-table :is\(th,\s*td\):first-child[\s\S]*width:\s*42%/);
});

test("card summary header matches the form drawer typography and spacing", () => {
  assert.match(
    layoutLayer,
    /\.card-summary-head\s*\{[\s\S]*padding:\s*0\.85rem 1\.1rem 0\.75rem/,
  );
  assert.match(
    layoutLayer,
    /\.card-summary-head > div:first-child > span\s*\{[\s\S]*font-size:\s*0\.62rem[\s\S]*font-weight:\s*800[\s\S]*margin-bottom:\s*0\.25rem/,
  );
  assert.match(
    layoutLayer,
    /\.card-summary-head h3\s*\{[\s\S]*font-family:\s*var\(--font-display\)[\s\S]*font-size:\s*1\.25rem[\s\S]*font-weight:\s*700[\s\S]*line-height:\s*1\.2/,
  );
});

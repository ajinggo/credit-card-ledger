import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const cloudSync = await readFile(new URL("cloud-sync.js", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");

test("Supabase does not block the initial document parse", () => {
  assert.doesNotMatch(indexHtml, /<script[^>]+cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/i);
  assert.match(cloudSync, /function loadSupabaseLibrary\(\)/);
  assert.match(cloudSync, /script\.async = true/);
});

test("performance layer disables persistent decorative animation", () => {
  assert.match(organicCss, /Performance Pass V75/);
  assert.match(organicCss, /\.glows\s*\{\s*display:\s*none/);
  assert.match(organicCss, /\.badge \.dot[\s\S]*animation:\s*none\s*!important/);
  assert.match(organicCss, /\.view-enter[\s\S]*animation:\s*none\s*!important/);
  assert.match(organicCss, /\.section-tab::before[\s\S]*display:\s*none\s*!important/);
  assert.doesNotMatch(appJs, /new IntersectionObserver/);
  assert.match(organicCss, /html:not\(\.app-ready\)[\s\S]*\.reveal[\s\S]*opacity:\s*0\s*!important/);
  assert.match(organicCss, /html\.app-ready[\s\S]*\.reveal[\s\S]*opacity:\s*1\s*!important/);
  assert.match(organicCss, /\.app-header\.reveal[\s\S]*opacity:\s*1\s*!important/);
  assert.match(appJs, /document\.documentElement\.classList\.add\("app-ready"\)/);
});

test("repeated surfaces no longer use backdrop blur", () => {
  assert.match(organicCss, /Performance Pass V75[\s\S]*\.dashboard \.kpi[\s\S]*\.card-row-wide[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(organicCss, /-webkit-backdrop-filter:\s*none\s*!important/);
});

test("repeated table and row controls do not create backdrop layers", () => {
  const performanceLayer = organicCss.slice(organicCss.indexOf("Performance Pass V75"));
  assert.match(performanceLayer, /thead th[\s\S]*\.row-actions button[\s\S]*backdrop-filter:\s*none\s*!important/);
  assert.match(performanceLayer, /\.card-row-actions button[\s\S]*\.loyalty-actions button[\s\S]*-webkit-backdrop-filter:\s*none\s*!important/);
});

test("final performance layer wins after the mobile responsive layer", () => {
  const mobileLayerIndex = organicCss.lastIndexOf("Mobile Responsive V81");
  const performanceLayerIndex = organicCss.lastIndexOf("Performance Pass V82");

  assert.ok(mobileLayerIndex >= 0, "mobile responsive layer is missing");
  assert.ok(performanceLayerIndex > mobileLayerIndex, "V82 must follow V81 in the cascade");
});

test("final performance layer removes expensive compositing from scroll surfaces", () => {
  const performanceLayer = organicCss.slice(organicCss.lastIndexOf("Performance Pass V82"));

  assert.match(performanceLayer, /\.app-header\.is-compact/);
  assert.match(performanceLayer, /\.toast/);
  assert.match(performanceLayer, /\.drawer-overlay/);
  assert.match(performanceLayer, /\.dashboard \.limit-kpi/);
  assert.match(performanceLayer, /backdrop-filter:\s*none\s*!important/);
  assert.match(performanceLayer, /-webkit-backdrop-filter:\s*none\s*!important/);
  assert.match(performanceLayer, /mix-blend-mode:\s*normal\s*!important/);
  assert.match(performanceLayer, /box-shadow:\s*0 1px 2px rgba\(44, 55, 40, 0\.08\)/);
  assert.match(performanceLayer, /background:\s*rgba\(249, 250, 246, 0\.98\)\s*!important/);
  assert.match(performanceLayer, /background:\s*rgba\(24, 30, 23, 0\.99\)\s*!important/);
});

test("repeated data units defer offscreen painting with stable intrinsic sizes", () => {
  const performanceLayer = organicCss.slice(organicCss.lastIndexOf("Performance Pass V82"));

  assert.match(performanceLayer, /\.card-row-wide[\s\S]*\.bill-row[\s\S]*\.loyalty-card[\s\S]*content-visibility:\s*auto/);
  assert.match(performanceLayer, /contain:\s*paint style/);
  assert.match(performanceLayer, /contain-intrinsic-size:\s*auto 180px/);
  assert.match(performanceLayer, /#recordsBody tr[\s\S]*contain-intrinsic-size:\s*auto 92px/);
  assert.match(performanceLayer, /@media \(max-width:\s*760px\)[\s\S]*#recordsBody tr[\s\S]*contain-intrinsic-size:\s*auto 500px/);
});

test("drawer bodies keep isolated momentum scrolling", () => {
  const performanceLayer = organicCss.slice(organicCss.lastIndexOf("Performance Pass V82"));

  assert.match(performanceLayer, /\.card-form-body[\s\S]*\.utility-drawer-body[\s\S]*-webkit-overflow-scrolling:\s*touch/);
  assert.match(performanceLayer, /overscroll-behavior:\s*contain/);
});

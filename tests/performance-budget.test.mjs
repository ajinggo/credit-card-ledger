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

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const appJs = await readFile(new URL("app.js", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");

test("record card details use a dedicated wrapping column", () => {
  assert.match(appJs, /<td class="record-card-cell"[^>]*><span class="cell-card"><\/span><span class="cell-note"><\/span><\/td>/);
  assert.match(organicCss, /\.record-card-cell\s*\{[\s\S]*?white-space:\s*normal/);
  assert.match(organicCss, /\.cell-card\s*\{[\s\S]*?display:\s*block/);
  assert.match(organicCss, /\.cell-note\s*\{[\s\S]*?display:\s*block[\s\S]*?overflow-wrap:\s*anywhere/);
});

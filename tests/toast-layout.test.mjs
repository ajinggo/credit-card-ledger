import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../organic-liquid.css", import.meta.url), "utf8");
const marker = "/* -- Toast Feedback V72 -- */";
const markerIndex = css.lastIndexOf(marker);
const mobileMarker = "/* -- Mobile Responsive V81 -- */";
const mobileMarkerIndex = css.lastIndexOf(mobileMarker);
const block = markerIndex === -1 ? "" : css.slice(markerIndex, mobileMarkerIndex);
const mobileBlock = mobileMarkerIndex === -1 ? "" : css.slice(mobileMarkerIndex);

assert.notEqual(markerIndex, -1, "missing final toast feedback block");
assert.notEqual(mobileMarkerIndex, -1, "missing mobile responsive layer");
assert.ok(markerIndex < mobileMarkerIndex, "mobile toast refinements must follow the base toast block");
assert.match(block, /top:\s*calc\(var\(--fixed-header-offset\) \+ 0\.75rem\)/);
assert.match(block, /z-index:\s*500/);
assert.match(block, /max-width:\s*calc\(100vw - 2rem\)/);
assert.match(block, /\.toast\.success::before/);
assert.match(block, /\.toast\.error::before/);
assert.match(mobileBlock, /@media \(max-width:\s*760px\)[\s\S]*\.toast\s*\{[\s\S]*top:\s*calc\(var\(--fixed-header-offset\) \+ 8px\)/);

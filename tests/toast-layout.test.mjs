import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../organic-liquid.css", import.meta.url), "utf8");
const marker = "/* -- Toast Feedback V72 -- */";
const markerIndex = css.lastIndexOf(marker);
const block = markerIndex === -1 ? "" : css.slice(markerIndex);

assert.notEqual(markerIndex, -1, "missing final toast feedback block");
assert.ok(markerIndex > css.length - 6000, "toast feedback block must be near the end of the cascade");
assert.match(block, /top:\s*calc\(var\(--fixed-header-offset\) \+ 0\.75rem\)/);
assert.match(block, /z-index:\s*500/);
assert.match(block, /max-width:\s*calc\(100vw - 2rem\)/);
assert.match(block, /\.toast\.success::before/);
assert.match(block, /\.toast\.error::before/);

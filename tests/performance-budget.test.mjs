import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const cloudSync = await readFile(new URL("cloud-sync.js", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");

const V82_MARKER = "Performance Pass V82";
const repeatedUnitSelectors = [
  ".card-row-wide",
  ".bill-row",
  ".loyalty-card",
  ".analytics-chart-block",
];
const repeatedSurfaceSelectors = [
  ".dashboard .kpi",
  ".net-card",
  ".hero-graphic",
  ".analytics-chart-block",
  ".card-row-wide",
  ".billing-ledger",
  ".bill-row",
  ".loyalty-card",
  ".record-summary-strip",
  ".table-wrap",
];

function matchingBraceIndex(css, openBraceIndex) {
  assert.equal(css[openBraceIndex], "{", "CSS block must start with an opening brace");

  let depth = 0;
  for (let index = openBraceIndex; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] !== "}") continue;

    depth -= 1;
    if (depth === 0) return index;
  }

  assert.fail("CSS block is missing a closing brace");
}

function ruleContainingSelector(css, selector, options = {}) {
  const markerIndex = css.lastIndexOf(V82_MARKER);
  assert.ok(markerIndex >= 0, "V82 performance layer is missing");

  const after = Math.max(options.after ?? markerIndex, markerIndex);
  const before = options.before ?? css.length;
  let selectorIndex = css.indexOf(selector, after);

  while (selectorIndex >= 0 && selectorIndex < before) {
    const openBraceIndex = css.indexOf("{", selectorIndex);
    const closeBeforeOpen = css.indexOf("}", selectorIndex);

    if (openBraceIndex < 0 || openBraceIndex >= before) return null;
    if (closeBeforeOpen >= 0 && closeBeforeOpen < openBraceIndex) {
      selectorIndex = css.indexOf(selector, selectorIndex + selector.length);
      continue;
    }

    const closeBraceIndex = matchingBraceIndex(css, openBraceIndex);
    if (closeBraceIndex >= before) return null;

    const previousBoundary = Math.max(
      css.lastIndexOf("{", selectorIndex),
      css.lastIndexOf("}", selectorIndex),
    );
    const rule = css.slice(previousBoundary + 1, closeBraceIndex + 1).trim();

    if (!options.containing || rule.includes(options.containing)) return rule;
    selectorIndex = css.indexOf(selector, selectorIndex + selector.length);
  }

  return null;
}

function requiredRuleContainingSelector(css, selector, options = {}) {
  const rule = ruleContainingSelector(css, selector, options);
  assert.ok(rule, `required V82 selector ${selector} is missing from its rule`);
  return rule;
}

function selectorPattern(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s,(])${escaped}(?=\\s*[,){])`);
}

function ruleHasSelector(rule, selector) {
  return selectorPattern(selector).test(rule);
}

function assertRuleHasSelector(rule, selector, label = "rule") {
  assert.ok(ruleHasSelector(rule, selector), `${label} must include selector ${selector}`);
}

function v82Bounds(css) {
  const markerIndex = css.lastIndexOf(V82_MARKER);
  assert.ok(markerIndex >= 0, "V82 performance layer is missing");

  const mobileStart = css.indexOf("@media (max-width: 760px)", markerIndex);
  assert.ok(mobileStart > markerIndex, "V82 mobile performance block is missing");
  const mobileOpenBrace = css.indexOf("{", mobileStart);

  return {
    markerIndex,
    mobileStart,
    mobileEnd: matchingBraceIndex(css, mobileOpenBrace),
  };
}

function validateRepeatedContainmentRule(rule) {
  for (const selector of repeatedUnitSelectors) {
    assertRuleHasSelector(rule, selector, "repeated containment rule");
  }
  assert.match(rule, /content-visibility:\s*auto/);
  assert.match(rule, /contain:\s*paint style/);
}

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
  const performanceLayerIndex = organicCss.lastIndexOf(V82_MARKER);

  assert.ok(mobileLayerIndex >= 0, "mobile responsive layer is missing");
  assert.ok(performanceLayerIndex > mobileLayerIndex, "V82 must follow V81 in the cascade");
});

test("final performance layer scopes compositing resets to targeted surfaces", () => {
  const compositingRule = requiredRuleContainingSelector(organicCss, ".app-header.is-compact", {
    containing: "\n  filter: none !important;",
  });

  for (const selector of [
    ".app-header.is-compact",
    ".toast",
    ".drawer-overlay",
    ".dashboard .limit-kpi",
    ".analytics-chart-block",
  ]) {
    assertRuleHasSelector(compositingRule, selector, "compositing reset rule");
  }
  assert.match(compositingRule, /^\s*filter:\s*none\s*!important;$/m);
  assert.match(compositingRule, /^\s*mix-blend-mode:\s*normal\s*!important;$/m);
  assert.match(compositingRule, /^\s*backdrop-filter:\s*none\s*!important;$/m);
  assert.match(compositingRule, /^\s*-webkit-backdrop-filter:\s*none\s*!important;$/m);

  const repeatedShadowRule = requiredRuleContainingSelector(organicCss, ".dashboard .kpi", {
    containing: "box-shadow: 0 1px 2px rgba(44, 55, 40, 0.08)",
  });
  for (const selector of repeatedSurfaceSelectors) {
    assertRuleHasSelector(repeatedShadowRule, selector, "repeated surface shadow rule");
  }
  assert.match(repeatedShadowRule, /box-shadow:\s*0 1px 2px rgba\(44, 55, 40, 0\.08\)[^;]*!important/);

  const lightChromeRule = requiredRuleContainingSelector(organicCss, ".side-tool-rail", {
    containing: "background: rgba(249, 250, 246, 0.98) !important",
  });
  assertRuleHasSelector(lightChromeRule, ".app-header.is-compact", "light chrome rule");
  assertRuleHasSelector(lightChromeRule, ".toast", "light chrome rule");
  assert.match(lightChromeRule, /background:\s*rgba\(249, 250, 246, 0\.98\)\s*!important/);

  const darkChromeRule = requiredRuleContainingSelector(organicCss, ".side-tool-rail", {
    containing: "background: rgba(24, 30, 23, 0.99) !important",
  });
  assertRuleHasSelector(darkChromeRule, ".app-header.is-compact", "dark chrome rule");
  assertRuleHasSelector(darkChromeRule, ".toast", "dark chrome rule");
  assert.match(darkChromeRule, /\[data-theme="dark"\]/);
  assert.match(darkChromeRule, /background:\s*rgba\(24, 30, 23, 0\.99\)\s*!important/);
});

test("dark repeated surfaces use a restrained theme-specific shadow", () => {
  const darkShadowRule = requiredRuleContainingSelector(organicCss, ".dashboard .kpi", {
    containing: "rgba(0, 0, 0",
  });

  for (const selector of repeatedSurfaceSelectors) {
    assertRuleHasSelector(darkShadowRule, selector, "dark repeated surface shadow rule");
  }
  assert.match(darkShadowRule, /\[data-theme="dark"\]/);
  const shadow = darkShadowRule.match(
    /box-shadow:\s*0 1px 2px rgba\(0,\s*0,\s*0,\s*(0?\.\d+)\),\s*inset 0 1px rgba\(255,\s*255,\s*255,\s*(0?\.\d+)\)\s*!important/,
  );
  assert.ok(shadow, "dark repeated surfaces need a small black outer shadow and white inset");
  assert.ok(Number(shadow[1]) > 0, "dark outer shadow must have visible black alpha");
  assert.ok(Number(shadow[2]) <= 0.1, "dark inset white alpha must not exceed 0.10");
});

test("repeated data units use component-specific desktop intrinsic sizes", () => {
  const { markerIndex, mobileStart } = v82Bounds(organicCss);
  const containmentRule = requiredRuleContainingSelector(organicCss, ".card-row-wide", {
    before: mobileStart,
    containing: "content-visibility: auto",
  });

  validateRepeatedContainmentRule(containmentRule);
  assert.doesNotMatch(containmentRule, /contain-intrinsic-size/);

  const desktopSizes = new Map([
    [".card-row-wide", "auto 220px"],
    [".bill-row", "auto 180px"],
    [".loyalty-card", "auto 190px"],
    [".analytics-chart-block", "auto 240px"],
  ]);

  for (const [selector, size] of desktopSizes) {
    const sizeRule = requiredRuleContainingSelector(organicCss, selector, {
      after: markerIndex,
      before: mobileStart,
      containing: `contain-intrinsic-size: ${size}`,
    });
    assertRuleHasSelector(sizeRule, selector, "desktop intrinsic-size rule");
    for (const otherSelector of repeatedUnitSelectors.filter((item) => item !== selector)) {
      assert.equal(ruleHasSelector(sizeRule, otherSelector), false, `${selector} needs a component-specific desktop size rule`);
    }
  }

  const mutatedRule = containmentRule.replace("  .loyalty-card,\n", "");
  assert.notEqual(mutatedRule, containmentRule, "test mutation must remove the loyalty selector");
  assert.throws(
    () => validateRepeatedContainmentRule(mutatedRule),
    /repeated containment rule must include selector \.loyalty-card/,
  );
});

test("repeated data units use component-specific mobile intrinsic sizes", () => {
  const { mobileStart, mobileEnd } = v82Bounds(organicCss);
  const mobileSizes = new Map([
    [".card-row-wide", "auto 560px"],
    [".bill-row", "auto 360px"],
    [".loyalty-card", "auto 320px"],
    [".analytics-chart-block", "auto 280px"],
  ]);

  for (const [selector, size] of mobileSizes) {
    const sizeRule = requiredRuleContainingSelector(organicCss, selector, {
      after: mobileStart,
      before: mobileEnd,
      containing: `contain-intrinsic-size: ${size}`,
    });
    assertRuleHasSelector(sizeRule, selector, "mobile intrinsic-size rule");
    for (const otherSelector of repeatedUnitSelectors.filter((item) => item !== selector)) {
      assert.equal(ruleHasSelector(sizeRule, otherSelector), false, `${selector} needs a component-specific mobile size rule`);
    }
  }
});

test("fee record containment is limited to the mobile grid layout", () => {
  const { markerIndex, mobileStart, mobileEnd } = v82Bounds(organicCss);
  const desktopRecordRule = ruleContainingSelector(organicCss, "#recordsBody tr", {
    after: markerIndex,
    before: mobileStart,
    containing: "content-visibility:",
  });

  assert.equal(desktopRecordRule, null, "native desktop table rows must not receive content visibility");

  const mobileRecordRule = requiredRuleContainingSelector(organicCss, "#recordsBody tr", {
    after: mobileStart,
    before: mobileEnd,
    containing: "content-visibility: auto",
  });
  assertRuleHasSelector(mobileRecordRule, "#recordsBody tr", "mobile record containment rule");
  assert.match(mobileRecordRule, /content-visibility:\s*auto/);
  assert.match(mobileRecordRule, /contain:\s*paint style/);
  assert.match(mobileRecordRule, /contain-intrinsic-size:\s*auto 500px/);
});

test("mobile fixed navigation and full-viewport drawers remove shadows together", () => {
  const { mobileStart, mobileEnd } = v82Bounds(organicCss);
  const shadowResetRule = requiredRuleContainingSelector(organicCss, ".app-header.is-compact", {
    after: mobileStart,
    before: mobileEnd,
    containing: "box-shadow: none !important",
  });

  for (const selector of [
    ".app-header.is-compact",
    "body.nav-collapsed .app-header",
    ".section-tabs",
    "body.nav-collapsed .app-header .section-tabs",
    ".card-form",
    ".card-summary-panel",
    ".entry-drawer",
    ".utility-drawer",
  ]) {
    assertRuleHasSelector(shadowResetRule, selector, "mobile shadow reset rule");
  }
  assert.match(shadowResetRule, /box-shadow:\s*none\s*!important/);
});

test("drawer bodies keep isolated momentum scrolling", () => {
  const scrollRule = requiredRuleContainingSelector(organicCss, ".card-form-body", {
    containing: "overscroll-behavior: contain",
  });

  for (const selector of [
    ".card-form-body",
    ".bill-form-body",
    ".loyalty-form-body",
    ".entry-drawer-body",
    ".card-summary-table-wrap",
    ".utility-drawer-body",
  ]) {
    assertRuleHasSelector(scrollRule, selector, "drawer scrolling rule");
  }
  assert.match(scrollRule, /overscroll-behavior:\s*contain/);
  assert.match(scrollRule, /-webkit-overflow-scrolling:\s*touch/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const cloudSync = await readFile(new URL("cloud-sync.js", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");

const V82_MARKER = "Performance Pass V82";
const UI_SCOPE = 'html[data-ui="organic-v41"]';
const DARK_UI_SCOPE = 'html[data-ui="organic-v41"][data-theme="dark"]';
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
const compositingResetSelectors = [
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact)`,
  `${UI_SCOPE} body.nav-collapsed .app-header`,
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  ".side-tool-rail",
  ".toast",
  ".stats",
  ".net-card",
  ".hero-graphic",
  ".analytics-chart-block",
  ".card-row-wide",
  ".billing-ledger",
  ".bill-row",
  ".loyalty-card",
  ".record-summary-strip",
  ".table-wrap",
  ".advanced-filters",
  ".display-settings-panel",
  ".drawer-overlay",
  ".modal-backdrop",
  ".card-form",
  ".card-summary-panel",
  ".entry-drawer",
  ".utility-drawer",
  ".drawer-head",
  ".card-form-actions",
  ".entry-drawer-actions",
  "input",
  "select",
  "textarea",
  ".btn-primary",
  ".btn-outline",
  ".btn-ghost",
  ".rate-chip",
  `${UI_SCOPE} .dashboard .kpi`,
  `${UI_SCOPE} .dashboard .limit-kpi`,
  `${UI_SCOPE} :is(.row-actions, .card-row-actions, .loyalty-actions) button`,
];
const lightFixedChromeMaterialSelectors = [
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact)`,
  `${UI_SCOPE} body.nav-collapsed .app-header`,
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  ".side-tool-rail",
  ".toast",
  ".display-settings-panel",
];
const lightDrawerMaterialSelectors = [
  ".card-form",
  ".card-summary-panel",
  ".entry-drawer",
  ".utility-drawer",
  ".drawer-head",
  ".card-form-actions",
  ".entry-drawer-actions",
];
const darkFixedDrawerMaterialSelectors = [
  `${DARK_UI_SCOPE} :is(.app-header, .app-header.is-compact)`,
  `${DARK_UI_SCOPE} body.nav-collapsed .app-header`,
  `${DARK_UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${DARK_UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  ".side-tool-rail",
  ".toast",
  ".display-settings-panel",
  ".card-form",
  ".card-summary-panel",
  ".entry-drawer",
  ".utility-drawer",
  ".drawer-head",
  ".card-form-actions",
  ".entry-drawer-actions",
];
const mobileShadowResetSelectors = [
  ".app-header",
  ".app-header.is-compact",
  `${UI_SCOPE} body.nav-collapsed .app-header`,
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  ".card-form",
  ".card-summary-panel",
  ".entry-drawer",
  ".utility-drawer",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declarationPattern(property, valuePattern) {
  return new RegExp(
    `^[ \\t]*${escapeRegExp(property)}[ \\t]*:[ \\t]*${valuePattern}[ \\t]*;[ \\t]*$`,
    "m",
  );
}

const IMPORTANT_PATTERN = "[ \\t]*![ \\t]*important";
const FILTER_NONE_DECLARATION = declarationPattern("filter", `none${IMPORTANT_PATTERN}`);
const MIX_BLEND_NORMAL_DECLARATION = declarationPattern("mix-blend-mode", `normal${IMPORTANT_PATTERN}`);
const BACKDROP_NONE_DECLARATION = declarationPattern("backdrop-filter", `none${IMPORTANT_PATTERN}`);
const WEBKIT_BACKDROP_NONE_DECLARATION = declarationPattern("-webkit-backdrop-filter", `none${IMPORTANT_PATTERN}`);
const LIGHT_FIXED_CHROME_DECLARATION = declarationPattern(
  "background",
  `rgba\\([ \\t]*249[ \\t]*,[ \\t]*250[ \\t]*,[ \\t]*246[ \\t]*,[ \\t]*0?\\.98[ \\t]*\\)${IMPORTANT_PATTERN}`,
);
const LIGHT_DRAWER_DECLARATION = declarationPattern("background", `#f8f9f4${IMPORTANT_PATTERN}`);
const DARK_MATERIAL_DECLARATION = declarationPattern(
  "background",
  `rgba\\([ \\t]*24[ \\t]*,[ \\t]*30[ \\t]*,[ \\t]*23[ \\t]*,[ \\t]*0?\\.99[ \\t]*\\)${IMPORTANT_PATTERN}`,
);
const LIGHT_REPEATED_SHADOW_DECLARATION = declarationPattern(
  "box-shadow",
  `0[ \\t]+1px[ \\t]+2px[ \\t]+rgba\\([ \\t]*44[ \\t]*,[ \\t]*55[ \\t]*,[ \\t]*40[ \\t]*,[ \\t]*0?\\.08[ \\t]*\\)[ \\t]*,[ \\t]*inset[ \\t]+0[ \\t]+1px[ \\t]+rgba\\([ \\t]*255[ \\t]*,[ \\t]*255[ \\t]*,[ \\t]*255[ \\t]*,[ \\t]*0?\\.66[ \\t]*\\)${IMPORTANT_PATTERN}`,
);
const DARK_REPEATED_SHADOW_DECLARATION = declarationPattern(
  "box-shadow",
  `0[ \\t]+1px[ \\t]+2px[ \\t]+rgba\\([ \\t]*0[ \\t]*,[ \\t]*0[ \\t]*,[ \\t]*0[ \\t]*,[ \\t]*(0?\\.\\d+)[ \\t]*\\)[ \\t]*,[ \\t]*inset[ \\t]+0[ \\t]+1px[ \\t]+rgba\\([ \\t]*255[ \\t]*,[ \\t]*255[ \\t]*,[ \\t]*255[ \\t]*,[ \\t]*(0?\\.\\d+)[ \\t]*\\)${IMPORTANT_PATTERN}`,
);
const CONTENT_VISIBILITY_AUTO_DECLARATION = declarationPattern("content-visibility", "auto");
const CONTENT_VISIBILITY_PROPERTY = /^[ \t]*content-visibility[ \t]*:/m;
const CONTAIN_PAINT_STYLE_DECLARATION = declarationPattern("contain", "paint[ \\t]+style");
const SHADOW_NONE_DECLARATION = declarationPattern("box-shadow", `none${IMPORTANT_PATTERN}`);
const OVERSCROLL_CONTAIN_DECLARATION = declarationPattern("overscroll-behavior", "contain");
const WEBKIT_SCROLL_TOUCH_DECLARATION = declarationPattern("-webkit-overflow-scrolling", "touch");

function intrinsicSizeDeclaration(size) {
  const valuePattern = size.split(/\s+/).map(escapeRegExp).join("[ \\t]+");
  return declarationPattern("contain-intrinsic-size", valuePattern);
}

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

    if (ruleHasSelector(rule, selector) && ruleMatchesQualification(rule, options.qualification)) return rule;
    selectorIndex = css.indexOf(selector, selectorIndex + selector.length);
  }

  return null;
}

function requiredRuleContainingSelector(css, selector, options = {}) {
  const rule = ruleContainingSelector(css, selector, options);
  assert.ok(rule, `required V82 selector ${selector} is missing from its rule`);
  return rule;
}

function ruleMatchesQualification(rule, qualification) {
  if (!qualification) return true;
  if (qualification instanceof RegExp) {
    qualification.lastIndex = 0;
    return qualification.test(rule);
  }
  if (typeof qualification === "function") return qualification(rule);
  assert.fail("rule qualification must be a RegExp or predicate");
}

function selectorPattern(selector, flags = "") {
  return new RegExp(
    `(^|[,(])(\\s*)(${escapeRegExp(selector)})(?=\\s*(?:,|\\)|$))`,
    flags,
  );
}

function ruleHasSelector(rule, selector) {
  const openBraceIndex = rule.indexOf("{");
  assert.ok(openBraceIndex >= 0, "CSS rule is missing an opening brace");
  const prelude = rule.slice(0, openBraceIndex).trim();
  return selectorPattern(selector).test(prelude);
}

function assertRuleHasSelector(rule, selector, label = "rule") {
  assert.ok(ruleHasSelector(rule, selector), `${label} must include selector ${selector}`);
}

function assertRuleHasSelectors(rule, selectors, label) {
  for (const selector of selectors) {
    assertRuleHasSelector(rule, selector, label);
  }
}

function mutateRuleSelector(css, options) {
  const rule = requiredRuleContainingSelector(css, options.ruleSelector, {
    qualification: options.qualification,
  });
  const openBraceIndex = rule.indexOf("{");
  const prelude = rule.slice(0, openBraceIndex);
  const matches = [...prelude.matchAll(selectorPattern(options.targetSelector, "g"))];
  assert.equal(matches.length, 1, `expected one exact ${options.targetSelector} in the target rule`);

  const match = matches[0];
  const selectorStart = match.index + match[1].length + match[2].length;
  const selectorEnd = selectorStart + options.targetSelector.length;
  let mutatedPrelude;

  if (options.replacement !== undefined) {
    mutatedPrelude = prelude.slice(0, selectorStart) + options.replacement + prelude.slice(selectorEnd);
  } else {
    let rightBoundaryIndex = selectorEnd;
    while (/\s/.test(prelude[rightBoundaryIndex] ?? "")) rightBoundaryIndex += 1;

    if (prelude[rightBoundaryIndex] === ",") {
      mutatedPrelude = prelude.slice(0, selectorStart) + prelude.slice(rightBoundaryIndex + 1);
    } else if (match[1] === ",") {
      mutatedPrelude = prelude.slice(0, match.index) + prelude.slice(rightBoundaryIndex);
    } else {
      mutatedPrelude = prelude.slice(0, selectorStart) + prelude.slice(rightBoundaryIndex);
    }
  }

  const mutatedRule = mutatedPrelude + rule.slice(openBraceIndex);
  const markerIndex = css.lastIndexOf(V82_MARKER);
  const ruleIndex = css.indexOf(rule, markerIndex);
  assert.ok(ruleIndex >= markerIndex, "target V82 rule is missing from the source");

  return css.slice(0, ruleIndex) + mutatedRule + css.slice(ruleIndex + rule.length);
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
  assert.match(rule, CONTENT_VISIBILITY_AUTO_DECLARATION);
  assert.match(rule, CONTAIN_PAINT_STYLE_DECLARATION);
}

function validateCompositingReset(css) {
  const rule = requiredRuleContainingSelector(css, compositingResetSelectors[0], {
    qualification: FILTER_NONE_DECLARATION,
  });

  assertRuleHasSelectors(rule, compositingResetSelectors, "compositing reset rule");
  assert.match(rule, FILTER_NONE_DECLARATION);
  assert.match(rule, MIX_BLEND_NORMAL_DECLARATION);
  assert.match(rule, BACKDROP_NONE_DECLARATION);
  assert.match(rule, WEBKIT_BACKDROP_NONE_DECLARATION);
}

function validateLightFixedChromeMaterial(css) {
  const rule = requiredRuleContainingSelector(css, lightFixedChromeMaterialSelectors[0], {
    qualification: LIGHT_FIXED_CHROME_DECLARATION,
  });

  assertRuleHasSelectors(rule, lightFixedChromeMaterialSelectors, "light fixed chrome material rule");
  assert.match(rule, LIGHT_FIXED_CHROME_DECLARATION);
}

function validateLightDrawerMaterial(css) {
  const rule = requiredRuleContainingSelector(css, lightDrawerMaterialSelectors[0], {
    qualification: LIGHT_DRAWER_DECLARATION,
  });

  assertRuleHasSelectors(rule, lightDrawerMaterialSelectors, "light drawer material rule");
  assert.match(rule, LIGHT_DRAWER_DECLARATION);
}

function validateDarkFixedDrawerMaterial(css) {
  const rule = requiredRuleContainingSelector(css, darkFixedDrawerMaterialSelectors[0], {
    qualification: DARK_MATERIAL_DECLARATION,
  });

  assertRuleHasSelectors(rule, darkFixedDrawerMaterialSelectors, "dark fixed and drawer material rule");
  assert.match(rule, DARK_MATERIAL_DECLARATION);
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
  validateCompositingReset(organicCss);

  const repeatedShadowRule = requiredRuleContainingSelector(organicCss, ".dashboard .kpi", {
    qualification: LIGHT_REPEATED_SHADOW_DECLARATION,
  });
  for (const selector of repeatedSurfaceSelectors) {
    assertRuleHasSelector(repeatedShadowRule, selector, "repeated surface shadow rule");
  }
  assert.match(repeatedShadowRule, LIGHT_REPEATED_SHADOW_DECLARATION);
});

test("final performance layer scopes fixed and drawer materials to all targets", () => {
  validateLightFixedChromeMaterial(organicCss);
  validateLightDrawerMaterial(organicCss);
  validateDarkFixedDrawerMaterial(organicCss);
});

test("compositing validator rejects a missing target in the full V82 source", () => {
  const mutatedCss = mutateRuleSelector(organicCss, {
    ruleSelector: compositingResetSelectors[0],
    targetSelector: ".card-form",
    qualification: FILTER_NONE_DECLARATION,
  });
  const originalCardFormCount = organicCss.match(/\.card-form/g)?.length ?? 0;
  const mutatedCardFormCount = mutatedCss.match(/\.card-form/g)?.length ?? 0;
  assert.equal(mutatedCardFormCount, originalCardFormCount - 1, "mutation must remove exactly one .card-form occurrence");

  validateLightDrawerMaterial(mutatedCss);
  validateDarkFixedDrawerMaterial(mutatedCss);

  assert.throws(
    () => validateCompositingReset(mutatedCss),
    /compositing reset rule must include selector \.card-form/,
  );
});

test("compositing validator rejects a descendant-prefixed target in the full V82 source", () => {
  const mutatedCss = mutateRuleSelector(organicCss, {
    ruleSelector: compositingResetSelectors[0],
    targetSelector: ".utility-drawer",
    replacement: ".narrow-scope .utility-drawer",
    qualification: FILTER_NONE_DECLARATION,
  });
  assert.equal(
    mutatedCss.match(/\.narrow-scope \.utility-drawer/g)?.length ?? 0,
    1,
    "mutation must prefix exactly one .utility-drawer",
  );
  validateLightDrawerMaterial(mutatedCss);
  validateDarkFixedDrawerMaterial(mutatedCss);

  assert.throws(
    () => validateCompositingReset(mutatedCss),
    /compositing reset rule must include selector \.utility-drawer/,
  );
});

test("compositing validator accepts declaration-only formatting changes", () => {
  const compositingRule = requiredRuleContainingSelector(organicCss, compositingResetSelectors[0], {
    qualification: FILTER_NONE_DECLARATION,
  });
  const reformattedRule = compositingRule.replace(
    FILTER_NONE_DECLARATION,
    "      filter :  none   !important ;",
  );
  assert.notEqual(reformattedRule, compositingRule, "test mutation must reformat the filter declaration");

  const reformattedCss = organicCss.replace(compositingRule, reformattedRule);
  assert.doesNotThrow(() => validateCompositingReset(reformattedCss));
});

test("dark repeated surfaces use a restrained theme-specific shadow", () => {
  const darkShadowRule = requiredRuleContainingSelector(organicCss, ".dashboard .kpi", {
    qualification: DARK_REPEATED_SHADOW_DECLARATION,
  });

  for (const selector of repeatedSurfaceSelectors) {
    assertRuleHasSelector(darkShadowRule, selector, "dark repeated surface shadow rule");
  }
  assert.match(darkShadowRule, /\[data-theme="dark"\]/);
  const shadow = darkShadowRule.match(DARK_REPEATED_SHADOW_DECLARATION);
  assert.ok(shadow, "dark repeated surfaces need a small black outer shadow and white inset");
  assert.ok(Number(shadow[1]) > 0, "dark outer shadow must have visible black alpha");
  assert.ok(Number(shadow[2]) <= 0.1, "dark inset white alpha must not exceed 0.10");
});

test("repeated data units use component-specific desktop intrinsic sizes", () => {
  const { markerIndex, mobileStart } = v82Bounds(organicCss);
  const containmentRule = requiredRuleContainingSelector(organicCss, ".card-row-wide", {
    before: mobileStart,
    qualification: CONTENT_VISIBILITY_AUTO_DECLARATION,
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
    const scopedSelector = `${UI_SCOPE} ${selector}`;
    const sizeDeclaration = intrinsicSizeDeclaration(size);
    const sizeRule = requiredRuleContainingSelector(organicCss, scopedSelector, {
      after: markerIndex,
      before: mobileStart,
      qualification: sizeDeclaration,
    });
    assertRuleHasSelector(sizeRule, scopedSelector, "desktop intrinsic-size rule");
    assert.match(sizeRule, sizeDeclaration);
    for (const otherSelector of repeatedUnitSelectors.filter((item) => item !== selector)) {
      assert.equal(
        ruleHasSelector(sizeRule, `${UI_SCOPE} ${otherSelector}`),
        false,
        `${selector} needs a component-specific desktop size rule`,
      );
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
    const scopedSelector = `${UI_SCOPE} ${selector}`;
    const sizeDeclaration = intrinsicSizeDeclaration(size);
    const sizeRule = requiredRuleContainingSelector(organicCss, scopedSelector, {
      after: mobileStart,
      before: mobileEnd,
      qualification: sizeDeclaration,
    });
    assertRuleHasSelector(sizeRule, scopedSelector, "mobile intrinsic-size rule");
    assert.match(sizeRule, sizeDeclaration);
    for (const otherSelector of repeatedUnitSelectors.filter((item) => item !== selector)) {
      assert.equal(
        ruleHasSelector(sizeRule, `${UI_SCOPE} ${otherSelector}`),
        false,
        `${selector} needs a component-specific mobile size rule`,
      );
    }
  }
});

test("fee record containment is limited to the mobile grid layout", () => {
  const { markerIndex, mobileStart, mobileEnd } = v82Bounds(organicCss);
  const recordSelector = `${UI_SCOPE} #recordsBody tr`;
  const desktopRecordRule = ruleContainingSelector(organicCss, recordSelector, {
    after: markerIndex,
    before: mobileStart,
    qualification: CONTENT_VISIBILITY_PROPERTY,
  });

  assert.equal(desktopRecordRule, null, "native desktop table rows must not receive content visibility");

  const mobileRecordRule = requiredRuleContainingSelector(organicCss, recordSelector, {
    after: mobileStart,
    before: mobileEnd,
    qualification: CONTENT_VISIBILITY_AUTO_DECLARATION,
  });
  assertRuleHasSelector(mobileRecordRule, recordSelector, "mobile record containment rule");
  assert.match(mobileRecordRule, CONTENT_VISIBILITY_AUTO_DECLARATION);
  assert.match(mobileRecordRule, CONTAIN_PAINT_STYLE_DECLARATION);
  assert.match(mobileRecordRule, intrinsicSizeDeclaration("auto 500px"));
});

test("mobile fixed navigation and full-viewport drawers remove shadows together", () => {
  const { mobileStart, mobileEnd } = v82Bounds(organicCss);
  const shadowResetRule = requiredRuleContainingSelector(organicCss, ".app-header.is-compact", {
    after: mobileStart,
    before: mobileEnd,
    qualification: SHADOW_NONE_DECLARATION,
  });

  assertRuleHasSelectors(shadowResetRule, mobileShadowResetSelectors, "mobile shadow reset rule");
  assert.match(shadowResetRule, SHADOW_NONE_DECLARATION);
});

test("drawer bodies keep isolated momentum scrolling", () => {
  const scrollRule = requiredRuleContainingSelector(organicCss, ".card-form-body", {
    qualification: OVERSCROLL_CONTAIN_DECLARATION,
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
  assert.match(scrollRule, OVERSCROLL_CONTAIN_DECLARATION);
  assert.match(scrollRule, WEBKIT_SCROLL_TOUCH_DECLARATION);
});

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

function groupedSelector(scope, selectors, suffix = "") {
  return `${scope} :is(${selectors.join(", ")})${suffix}`;
}

const COMPOSITING_GROUP_SELECTOR = groupedSelector(UI_SCOPE, [
  ".side-tool-rail", ".toast", ".stats", ".net-card", ".hero-graphic", ".analytics-chart-block",
  ".card-row-wide", ".billing-ledger", ".bill-row", ".loyalty-card", ".record-summary-strip", ".table-wrap",
  ".advanced-filters", ".display-settings-panel", ".drawer-overlay", ".modal-backdrop", ".card-form",
  ".card-summary-panel", ".entry-drawer", ".utility-drawer", ".drawer-head", ".card-form-actions",
  ".entry-drawer-actions", "input", "select", "textarea", ".btn-primary", ".btn-outline", ".btn-ghost", ".rate-chip",
]);
const COMPOSITING_SELECTORS = [
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact)`,
  `${UI_SCOPE} body.nav-collapsed .app-header`,
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  COMPOSITING_GROUP_SELECTOR,
  `${UI_SCOPE} .dashboard .kpi`,
  `${UI_SCOPE} .dashboard .limit-kpi`,
  `${UI_SCOPE} :is(.row-actions, .card-row-actions, .loyalty-actions) button`,
];
const LIGHT_FIXED_CHROME_SELECTORS = [
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact)`,
  `${UI_SCOPE} body.nav-collapsed .app-header`,
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  `${UI_SCOPE} :is(.side-tool-rail, .toast, .display-settings-panel)`,
];
const LIGHT_DRAWER_SELECTORS = [
  groupedSelector(UI_SCOPE, [
    ".card-form", ".card-summary-panel", ".entry-drawer", ".utility-drawer",
    ".drawer-head", ".card-form-actions", ".entry-drawer-actions",
  ]),
];
const DARK_FIXED_DRAWER_SELECTORS = [
  `${DARK_UI_SCOPE} :is(.app-header, .app-header.is-compact)`,
  `${DARK_UI_SCOPE} body.nav-collapsed .app-header`,
  `${DARK_UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${DARK_UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
  groupedSelector(DARK_UI_SCOPE, [
    ".side-tool-rail", ".toast", ".display-settings-panel", ".card-form", ".card-summary-panel",
    ".entry-drawer", ".utility-drawer", ".drawer-head", ".card-form-actions", ".entry-drawer-actions",
  ]),
];
const REPEATED_SURFACE_SELECTOR = groupedSelector(UI_SCOPE, [
  ".dashboard .kpi", ".net-card", ".hero-graphic", ".analytics-chart-block", ".card-row-wide",
  ".billing-ledger", ".bill-row", ".loyalty-card", ".record-summary-strip", ".table-wrap",
]);
const DARK_REPEATED_SURFACE_SELECTOR = REPEATED_SURFACE_SELECTOR.replace(UI_SCOPE, DARK_UI_SCOPE);
const REPEATED_CONTAINMENT_SELECTOR = groupedSelector(UI_SCOPE, [
  ".card-row-wide", ".bill-row", ".loyalty-card", ".analytics-chart-block",
]);
const MOBILE_PRIMARY_SHADOW_SELECTOR = groupedSelector(UI_SCOPE, [
  ".app-header", ".app-header.is-compact", ".card-form",
  ".card-summary-panel", ".entry-drawer", ".utility-drawer",
]);
const MOBILE_SHADOW_SELECTORS = [
  MOBILE_PRIMARY_SHADOW_SELECTOR,
  `${UI_SCOPE} body.nav-collapsed .app-header`,
  `${UI_SCOPE} :is(.app-header, .app-header.is-compact) .section-tabs`,
  `${UI_SCOPE} body.nav-collapsed .app-header .section-tabs`,
];
const DRAWER_SCROLL_SELECTORS = [
  groupedSelector(UI_SCOPE, [
    ".card-form-body", ".bill-form-body", ".loyalty-form-body",
    ".entry-drawer-body", ".card-summary-table-wrap", ".utility-drawer-body",
  ]),
];

function canonicalCssTokens(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*([:;,()])\s*/g, "$1")
    .replace(/\s*!\s*/g, "!")
    .trim();
}

function ruleDeclarations(rule) {
  const openBraceIndex = rule.indexOf("{");
  const closeBraceIndex = rule.lastIndexOf("}");
  assert.ok(openBraceIndex >= 0 && closeBraceIndex > openBraceIndex, "CSS rule has an invalid declaration block");

  return canonicalCssTokens(rule.slice(openBraceIndex + 1, closeBraceIndex))
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => `${declaration};`);
}

function declarationContract(value) {
  const canonical = canonicalCssTokens(value);
  return {
    canonical,
    matches: (rule) => ruleDeclarations(rule).includes(canonical),
  };
}

function assertDeclaration(rule, contract, label) {
  assert.ok(contract.matches(rule), `${label} must include ${contract.canonical}`);
}

const FILTER_NONE_DECLARATION = declarationContract("filter: none !important;");
const MIX_BLEND_NORMAL_DECLARATION = declarationContract("mix-blend-mode: normal !important;");
const BACKDROP_NONE_DECLARATION = declarationContract("backdrop-filter: none !important;");
const WEBKIT_BACKDROP_NONE_DECLARATION = declarationContract("-webkit-backdrop-filter: none !important;");
const LIGHT_FIXED_CHROME_DECLARATION = declarationContract("background: rgba(249, 250, 246, 0.98) !important;");
const LIGHT_DRAWER_DECLARATION = declarationContract("background: #f8f9f4 !important;");
const DARK_MATERIAL_DECLARATION = declarationContract("background: rgba(24, 30, 23, 0.99) !important;");
const LIGHT_REPEATED_SHADOW_DECLARATION = declarationContract(
  "box-shadow: 0 1px 2px rgba(44, 55, 40, 0.08), inset 0 1px rgba(255, 255, 255, 0.66) !important;",
);
const DARK_REPEATED_SHADOW_DECLARATION = declarationContract(
  "box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28), inset 0 1px rgba(255, 255, 255, 0.08) !important;",
);
const CONTENT_VISIBILITY_AUTO_DECLARATION = declarationContract("content-visibility: auto;");
const CONTAIN_PAINT_STYLE_DECLARATION = declarationContract("contain: paint style;");
const SHADOW_NONE_DECLARATION = declarationContract("box-shadow: none !important;");
const OVERSCROLL_CONTAIN_DECLARATION = declarationContract("overscroll-behavior: contain;");
const WEBKIT_SCROLL_TOUCH_DECLARATION = declarationContract("-webkit-overflow-scrolling: touch;");
const ROOT_SCROLL_AUTO_DECLARATION = declarationContract("scroll-behavior: auto !important;");

function intrinsicSizeDeclaration(size) {
  return declarationContract(`contain-intrinsic-size: ${size};`);
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

function namedFunctionBody(source, functionName) {
  const signature = new RegExp(`\\bfunction\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`);
  const match = signature.exec(source);
  assert.ok(match, `${functionName} function is missing`);

  const openBraceIndex = source.indexOf("{", match.index);
  const closeBraceIndex = matchingBraceIndex(source, openBraceIndex);
  return source.slice(openBraceIndex + 1, closeBraceIndex);
}

function tagHasAttribute(tag, attribute, expectedValue) {
  const attributes = tag.matchAll(/\s+([^\s=/>]+)\s*=\s*(["'])([\s\S]*?)\2/g);
  return [...attributes].some(([, name, , value]) =>
    name.toLowerCase() === attribute.toLowerCase() && value === expectedValue);
}

function assertTagWithAttributes(html, tagName, attributes) {
  const uncommentedHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const tags = uncommentedHtml.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  const match = tags.find((tag) => Object.entries(attributes)
    .every(([attribute, value]) => tagHasAttribute(tag, attribute, value)));
  assert.ok(match, `${tagName} tag must load ${Object.values(attributes).join(" with ")}`);
}

function styleRulesInV82(css, options = {}) {
  const markerIndex = css.lastIndexOf(V82_MARKER);
  assert.ok(markerIndex >= 0, "V82 performance layer is missing");

  const after = Math.max(options.after ?? markerIndex, markerIndex);
  const before = options.before ?? css.length;
  const rules = [];
  let cursor = after;

  while (cursor < before) {
    const openBraceIndex = css.indexOf("{", cursor);
    if (openBraceIndex < 0 || openBraceIndex >= before) break;
    const closeBraceIndex = matchingBraceIndex(css, openBraceIndex);
    const previousBoundary = Math.max(
      css.lastIndexOf("{", openBraceIndex - 1),
      css.lastIndexOf("}", openBraceIndex - 1),
    );
    const prelude = css.slice(previousBoundary + 1, openBraceIndex).trim();

    if (prelude && !prelude.startsWith("@") && closeBraceIndex < before) {
      rules.push(css.slice(previousBoundary + 1, closeBraceIndex + 1).trim());
    }
    cursor = openBraceIndex + 1;
  }

  return rules;
}

function requiredRuleMatching(css, options = {}) {
  const label = options.label ?? "V82 rule";
  const matches = styleRulesInV82(css, options).filter((rule) =>
    ruleMatchesQualification(rule, options.qualification));
  assert.equal(matches.length, 1, `${label} must resolve to exactly one rule`);
  return matches[0];
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

function topLevelSelectorEntries(rule) {
  const openBraceIndex = rule.indexOf("{");
  assert.ok(openBraceIndex >= 0, "CSS rule is missing an opening brace");
  const prelude = rule.slice(0, openBraceIndex).replace(/\/\*[\s\S]*?\*\//g, "");
  const entries = [];
  let depth = 0;
  let entryStart = 0;

  for (let index = 0; index < prelude.length; index += 1) {
    if (prelude[index] === "(") depth += 1;
    if (prelude[index] === ")") depth -= 1;
    assert.ok(depth >= 0, "selector prelude has an unmatched closing parenthesis");

    if (prelude[index] === "," && depth === 0) {
      entries.push(prelude.slice(entryStart, index).trim());
      entryStart = index + 1;
    }
  }

  assert.equal(depth, 0, "selector prelude has an unmatched opening parenthesis");
  entries.push(prelude.slice(entryStart).trim());
  return entries.filter(Boolean);
}

function canonicalSelector(selector) {
  return selector
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ",");
}

function canonicalSelectorEntries(rule) {
  return topLevelSelectorEntries(rule).map(canonicalSelector);
}

function assertRuleSelectors(rule, expectedSelectors, label) {
  const actual = canonicalSelectorEntries(rule).sort();
  const expected = expectedSelectors.map(canonicalSelector).sort();

  for (const selector of expected) {
    assert.ok(actual.includes(selector), `${label} must include selector ${selector}`);
  }
  assert.deepEqual(actual, expected, `${label} must exactly match its selector contract`);
}

function replaceSelectorEntryInRule(rule, targetSelector, replacementSelector) {
  const openBraceIndex = rule.indexOf("{");
  const entries = topLevelSelectorEntries(rule);
  const target = canonicalSelector(targetSelector);
  const matches = entries
    .map(canonicalSelector)
    .map((selector, index) => selector === target ? index : -1)
    .filter((index) => index >= 0);
  assert.equal(matches.length, 1, `expected one complete selector entry ${target}`);

  entries[matches[0]] = replacementSelector;
  return `${entries.join(",\n")} ${rule.slice(openBraceIndex)}`;
}

function replaceV82Rule(css, rule, replacementRule) {
  const markerIndex = css.lastIndexOf(V82_MARKER);
  const ruleIndex = css.indexOf(rule, markerIndex);
  assert.ok(ruleIndex >= markerIndex, "target V82 rule is missing from the source");
  return css.slice(0, ruleIndex) + replacementRule + css.slice(ruleIndex + rule.length);
}

function mutateRuleSelectorEntry(css, options) {
  const rule = requiredRuleMatching(css, options);
  const mutatedRule = replaceSelectorEntryInRule(
    rule,
    options.targetSelector,
    options.replacementSelector,
  );
  return replaceV82Rule(css, rule, mutatedRule);
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

function validateRuleContract(css, options) {
  const rule = requiredRuleMatching(css, {
    after: options.after,
    before: options.before,
    qualification: options.declarations[0].matches,
    label: options.label,
  });
  assertRuleSelectors(rule, options.selectors, options.label);
  for (const declaration of options.declarations) {
    assertDeclaration(rule, declaration, options.label);
  }
  return rule;
}

function validateRepeatedContainmentRule(rule) {
  assertRuleSelectors(rule, [REPEATED_CONTAINMENT_SELECTOR], "repeated containment rule");
  assertDeclaration(rule, CONTENT_VISIBILITY_AUTO_DECLARATION, "repeated containment rule");
  assertDeclaration(rule, CONTAIN_PAINT_STYLE_DECLARATION, "repeated containment rule");
}

function validateCompositingReset(css) {
  return validateRuleContract(css, {
    label: "compositing reset rule",
    selectors: COMPOSITING_SELECTORS,
    declarations: [
      FILTER_NONE_DECLARATION,
      MIX_BLEND_NORMAL_DECLARATION,
      BACKDROP_NONE_DECLARATION,
      WEBKIT_BACKDROP_NONE_DECLARATION,
    ],
  });
}

function validateLightFixedChromeMaterial(css) {
  return validateRuleContract(css, {
    label: "light fixed chrome material rule",
    selectors: LIGHT_FIXED_CHROME_SELECTORS,
    declarations: [LIGHT_FIXED_CHROME_DECLARATION],
  });
}

function validateLightDrawerMaterial(css) {
  return validateRuleContract(css, {
    label: "light drawer material rule",
    selectors: LIGHT_DRAWER_SELECTORS,
    declarations: [LIGHT_DRAWER_DECLARATION],
  });
}

function validateDarkFixedDrawerMaterial(css) {
  return validateRuleContract(css, {
    label: "dark fixed and drawer material rule",
    selectors: DARK_FIXED_DRAWER_SELECTORS,
    declarations: [DARK_MATERIAL_DECLARATION],
  });
}

function validateLightRepeatedShadow(css) {
  return validateRuleContract(css, {
    label: "repeated surface shadow rule",
    selectors: [REPEATED_SURFACE_SELECTOR],
    declarations: [LIGHT_REPEATED_SHADOW_DECLARATION],
  });
}

function validateMobileShadowReset(css) {
  const { mobileStart, mobileEnd } = v82Bounds(css);
  return validateRuleContract(css, {
    after: mobileStart,
    before: mobileEnd,
    label: "mobile shadow reset rule",
    selectors: MOBILE_SHADOW_SELECTORS,
    declarations: [SHADOW_NONE_DECLARATION],
  });
}

test("Supabase does not block the initial document parse", () => {
  assert.doesNotMatch(indexHtml, /<script[^>]+cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/i);
  assert.match(cloudSync, /function loadSupabaseLibrary\(\)/);
  assert.match(cloudSync, /script\.async = true/);
});

test("view switching resets scroll position immediately", () => {
  const switchViewBody = namedFunctionBody(appJs, "switchView");
  assert.match(
    switchViewBody,
    /window\s*\.\s*scrollTo\s*\(\s*\{\s*top\s*:\s*0\s*,\s*behavior\s*:\s*(["'])auto\1\s*,?\s*\}\s*\)\s*;?/,
  );
});

test("view switching does not use smooth scrolling", () => {
  const switchViewBody = namedFunctionBody(appJs, "switchView");
  assert.doesNotMatch(switchViewBody, /behavior\s*:\s*(["'])smooth\1/);
});

test("V82 overrides root smooth scrolling after the V81 layer", () => {
  const mobileLayerIndex = organicCss.lastIndexOf("Mobile Responsive V81");
  const performanceLayerIndex = organicCss.lastIndexOf(V82_MARKER);

  assert.ok(mobileLayerIndex >= 0, "mobile responsive layer is missing");
  assert.ok(performanceLayerIndex > mobileLayerIndex, "V82 must follow V81 in the cascade");

  const rule = requiredRuleMatching(organicCss, {
    after: performanceLayerIndex,
    qualification: ROOT_SCROLL_AUTO_DECLARATION.matches,
    label: "root scroll behavior rule",
  });
  assertRuleSelectors(rule, [UI_SCOPE], "root scroll behavior rule");
  assertDeclaration(rule, ROOT_SCROLL_AUTO_DECLARATION, "root scroll behavior rule");
});

test("app exposes the scroll performance v74 build marker", () => {
  assert.match(appJs, /window\.__pointsLedgerBuild = "scroll-performance-v74";/);
});

test("index loads the v83 performance stylesheet", () => {
  assertTagWithAttributes(indexHtml, "link", {
    rel: "stylesheet",
    href: "./organic-liquid.css?v=83",
  });
});

test("index loads the v74 application script", () => {
  assertTagWithAttributes(indexHtml, "script", { src: "./app.js?v=74" });
});

test("asset tag validator accepts harmless HTML formatting changes", () => {
  assertTagWithAttributes(`
    <link
      href = './organic-liquid.css?v=83'
      media="all"
      REL = "stylesheet"
    />
  `, "link", {
    rel: "stylesheet",
    href: "./organic-liquid.css?v=83",
  });
  assertTagWithAttributes(`
    <script
      defer
      SRC = './app.js?v=74'
    ></script>
  `, "script", { src: "./app.js?v=74" });
});

test("asset tag validator rejects data attributes in place of real asset attributes", () => {
  assert.throws(() => assertTagWithAttributes(
    '<link rel="stylesheet" data-href="./organic-liquid.css?v=83" />',
    "link",
    { rel: "stylesheet", href: "./organic-liquid.css?v=83" },
  ));
  assert.throws(() => assertTagWithAttributes(
    '<script data-src="./app.js?v=74"></script>',
    "script",
    { src: "./app.js?v=74" },
  ));
});

test("asset tag validator rejects target tags inside HTML comments", () => {
  assert.throws(() => assertTagWithAttributes(
    '<!-- <link rel="stylesheet" href="./organic-liquid.css?v=83" /> -->',
    "link",
    { rel: "stylesheet", href: "./organic-liquid.css?v=83" },
  ));
  assert.throws(() => assertTagWithAttributes(
    '<!-- <script src="./app.js?v=74"></script> -->',
    "script",
    { src: "./app.js?v=74" },
  ));
});

test("asset tag validator rejects case-changed asset URL paths", () => {
  assert.throws(() => assertTagWithAttributes(
    '<link rel="stylesheet" href="./ORGANIC-LIQUID.CSS?v=83" />',
    "link",
    { rel: "stylesheet", href: "./organic-liquid.css?v=83" },
  ));
  assert.throws(() => assertTagWithAttributes(
    '<script src="./APP.JS?v=74"></script>',
    "script",
    { src: "./app.js?v=74" },
  ));
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
  validateLightRepeatedShadow(organicCss);
});

test("final performance layer scopes fixed and drawer materials to all targets", () => {
  validateLightFixedChromeMaterial(organicCss);
  validateLightDrawerMaterial(organicCss);
  validateDarkFixedDrawerMaterial(organicCss);
});

test("compositing validator rejects a missing target in the full V82 source", () => {
  const mutatedCss = mutateRuleSelectorEntry(organicCss, {
    targetSelector: COMPOSITING_GROUP_SELECTOR,
    replacementSelector: COMPOSITING_GROUP_SELECTOR.replace(", .card-form", ""),
    qualification: FILTER_NONE_DECLARATION.matches,
    label: "compositing reset rule",
  });
  const originalCardFormCount = organicCss.match(/\.card-form/g)?.length ?? 0;
  const mutatedCardFormCount = mutatedCss.match(/\.card-form/g)?.length ?? 0;
  assert.equal(mutatedCardFormCount, originalCardFormCount - 1, "mutation must remove exactly one .card-form occurrence");

  validateLightDrawerMaterial(mutatedCss);
  validateDarkFixedDrawerMaterial(mutatedCss);

  assert.throws(
    () => validateCompositingReset(mutatedCss),
    /compositing reset rule/,
  );
});

test("compositing validator rejects a descendant-prefixed target in the full V82 source", () => {
  const mutatedCss = mutateRuleSelectorEntry(organicCss, {
    targetSelector: COMPOSITING_GROUP_SELECTOR,
    replacementSelector: COMPOSITING_GROUP_SELECTOR.replace(
      ".utility-drawer",
      ".narrow-scope .utility-drawer",
    ),
    qualification: FILTER_NONE_DECLARATION.matches,
    label: "compositing reset rule",
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
    /compositing reset rule/,
  );
});

test("compositing validator accepts declaration-only formatting changes", () => {
  const compositingRule = requiredRuleMatching(organicCss, {
    qualification: FILTER_NONE_DECLARATION.matches,
    label: "compositing reset rule",
  });
  const reformattedRule = compositingRule.replace(
    "  filter: none !important;",
    "  filter :  none   !important ;",
  );
  assert.notEqual(reformattedRule, compositingRule, "test mutation must reformat the filter declaration");

  const reformattedCss = replaceV82Rule(organicCss, compositingRule, reformattedRule);
  assert.doesNotThrow(() => validateCompositingReset(reformattedCss));
});

test("mobile shadow validator rejects a narrowed outer scope", () => {
  const { mobileStart, mobileEnd } = v82Bounds(organicCss);
  const mutatedCss = mutateRuleSelectorEntry(organicCss, {
    after: mobileStart,
    before: mobileEnd,
    targetSelector: MOBILE_PRIMARY_SHADOW_SELECTOR,
    replacementSelector: MOBILE_PRIMARY_SHADOW_SELECTOR.replace(UI_SCOPE, ".narrow-scope"),
    qualification: SHADOW_NONE_DECLARATION.matches,
    label: "mobile shadow reset rule",
  });
  assert.throws(
    () => validateMobileShadowReset(mutatedCss),
    /mobile shadow reset rule/,
  );
});

test("repeated shadow validator accepts multiline declaration formatting", () => {
  const shadowRule = requiredRuleMatching(organicCss, {
    qualification: LIGHT_REPEATED_SHADOW_DECLARATION.matches,
    label: "repeated surface shadow rule",
  });
  const reformattedRule = shadowRule.replace(
    "  box-shadow: 0 1px 2px rgba(44, 55, 40, 0.08), inset 0 1px rgba(255, 255, 255, 0.66) !important;",
    [
      "  box-shadow:",
      "    0 1px 2px rgba(44, 55, 40, 0.08),",
      "    inset 0 1px rgba(255, 255, 255, 0.66) !important;",
    ].join("\n"),
  );
  assert.notEqual(reformattedRule, shadowRule, "test mutation must split the shadow declaration across lines");

  const reformattedCss = replaceV82Rule(organicCss, shadowRule, reformattedRule);
  assert.doesNotThrow(() => validateLightRepeatedShadow(reformattedCss));
});

test("dark repeated surfaces use a restrained theme-specific shadow", () => {
  const darkShadowRule = requiredRuleMatching(organicCss, {
    qualification: DARK_REPEATED_SHADOW_DECLARATION.matches,
    label: "dark repeated surface shadow rule",
  });

  assertRuleSelectors(darkShadowRule, [DARK_REPEATED_SURFACE_SELECTOR], "dark repeated surface shadow rule");
  assertDeclaration(darkShadowRule, DARK_REPEATED_SHADOW_DECLARATION, "dark repeated surface shadow rule");
  const shadow = DARK_REPEATED_SHADOW_DECLARATION.canonical.match(
    /box-shadow:0 1px 2px rgba\(0,0,0,(0?\.\d+)\),inset 0 1px rgba\(255,255,255,(0?\.\d+)\)!important;/,
  );
  assert.ok(shadow, "dark repeated surfaces need a small black outer shadow and white inset");
  assert.ok(Number(shadow[1]) > 0, "dark outer shadow must have visible black alpha");
  assert.ok(Number(shadow[2]) <= 0.1, "dark inset white alpha must not exceed 0.10");
});

test("repeated data units use component-specific desktop intrinsic sizes", () => {
  const { markerIndex, mobileStart } = v82Bounds(organicCss);
  const containmentRule = requiredRuleMatching(organicCss, {
    before: mobileStart,
    qualification: CONTENT_VISIBILITY_AUTO_DECLARATION.matches,
    label: "repeated containment rule",
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
    const sizeRule = requiredRuleMatching(organicCss, {
      after: markerIndex,
      before: mobileStart,
      qualification: sizeDeclaration.matches,
      label: `${selector} desktop intrinsic-size rule`,
    });
    assertRuleSelectors(sizeRule, [scopedSelector], `${selector} desktop intrinsic-size rule`);
    assertDeclaration(sizeRule, sizeDeclaration, `${selector} desktop intrinsic-size rule`);
  }

  const mutatedRule = replaceSelectorEntryInRule(
    containmentRule,
    REPEATED_CONTAINMENT_SELECTOR,
    REPEATED_CONTAINMENT_SELECTOR.replace(", .loyalty-card", ""),
  );
  assert.throws(
    () => validateRepeatedContainmentRule(mutatedRule),
    /repeated containment rule/,
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
    const sizeRule = requiredRuleMatching(organicCss, {
      after: mobileStart,
      before: mobileEnd,
      qualification: sizeDeclaration.matches,
      label: `${selector} mobile intrinsic-size rule`,
    });
    assertRuleSelectors(sizeRule, [scopedSelector], `${selector} mobile intrinsic-size rule`);
    assertDeclaration(sizeRule, sizeDeclaration, `${selector} mobile intrinsic-size rule`);
  }
});

test("fee record containment is limited to the mobile grid layout", () => {
  const { markerIndex, mobileStart, mobileEnd } = v82Bounds(organicCss);
  const recordSelector = `${UI_SCOPE} #recordsBody tr`;
  const desktopRecordRule = styleRulesInV82(organicCss, { after: markerIndex, before: mobileStart })
    .find((rule) =>
      canonicalSelectorEntries(rule).includes(canonicalSelector(recordSelector)) &&
      ruleDeclarations(rule).some((declaration) => declaration.startsWith("content-visibility:")));

  assert.equal(desktopRecordRule, undefined, "native desktop table rows must not receive content visibility");

  const mobileRecordRule = requiredRuleMatching(organicCss, {
    after: mobileStart,
    before: mobileEnd,
    qualification: CONTENT_VISIBILITY_AUTO_DECLARATION.matches,
    label: "mobile record containment rule",
  });
  assertRuleSelectors(mobileRecordRule, [recordSelector], "mobile record containment rule");
  assertDeclaration(mobileRecordRule, CONTENT_VISIBILITY_AUTO_DECLARATION, "mobile record containment rule");
  assertDeclaration(mobileRecordRule, CONTAIN_PAINT_STYLE_DECLARATION, "mobile record containment rule");
  assertDeclaration(mobileRecordRule, intrinsicSizeDeclaration("auto 500px"), "mobile record containment rule");
});

test("mobile fixed navigation and full-viewport drawers remove shadows together", () => {
  validateMobileShadowReset(organicCss);
});

test("drawer bodies keep isolated momentum scrolling", () => {
  const scrollRule = requiredRuleMatching(organicCss, {
    qualification: OVERSCROLL_CONTAIN_DECLARATION.matches,
    label: "drawer scrolling rule",
  });

  assertRuleSelectors(scrollRule, DRAWER_SCROLL_SELECTORS, "drawer scrolling rule");
  assertDeclaration(scrollRule, OVERSCROLL_CONTAIN_DECLARATION, "drawer scrolling rule");
  assertDeclaration(scrollRule, WEBKIT_SCROLL_TOUCH_DECLARATION, "drawer scrolling rule");
});

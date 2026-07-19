# Scroll Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce scroll-time paint and compositing work across every ledger view without changing data, financial calculations, synchronization, navigation structure, or record visibility.

**Architecture:** Add one final `Performance Pass V82` CSS layer after the existing mobile layer so it wins the cascade, defer offscreen rendering for repeated data units, and isolate their paint work. Make the existing view-switch scroll immediate, update asset versions, and extend the current static performance contracts before implementation. Do not add pagination or change the data model, financial formulas, backup format, or Supabase synchronization.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner, local Python HTTP preview.

---

## File Map

- Modify `tests/performance-budget.test.mjs`: define final-layer, offscreen-rendering, drawer-scroll, immediate-scroll, and cache-version contracts.
- Modify `organic-liquid.css`: append `Performance Pass V82`; no earlier theme block is refactored.
- Modify `app.js`: change view-switch scrolling to `auto` and update the build marker to `scroll-performance-v74`.
- Modify `index.html`: load `organic-liquid.css?v=82` and `app.js?v=74`.
- Reference `docs/superpowers/specs/2026-07-19-scroll-performance-design.md`: approved scope and acceptance criteria.

### Task 1: Final CSS Performance Layer

**Files:**
- Modify: `tests/performance-budget.test.mjs`
- Modify: `organic-liquid.css`

- [ ] **Step 1: Write the failing CSS performance contracts**

Append these tests to `tests/performance-budget.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/performance-budget.test.mjs
```

Expected: the four new tests fail because `Performance Pass V82` and its properties do not exist. Existing V75 tests continue to pass.

- [ ] **Step 3: Append the minimal final CSS layer**

Append this block to the end of `organic-liquid.css`:

```css
/* -- Performance Pass V82 -- */
html[data-ui="organic-v41"] body {
  background-attachment: scroll !important;
}

html[data-ui="organic-v41"] :is(.app-header, .app-header.is-compact),
html[data-ui="organic-v41"] body.nav-collapsed .app-header,
html[data-ui="organic-v41"] :is(.app-header, .app-header.is-compact) .section-tabs,
html[data-ui="organic-v41"] body.nav-collapsed .app-header .section-tabs,
html[data-ui="organic-v41"] :is(
  .side-tool-rail,
  .toast,
  .stats,
  .net-card,
  .hero-graphic,
  .analytics-chart-block,
  .card-row-wide,
  .billing-ledger,
  .bill-row,
  .loyalty-card,
  .record-summary-strip,
  .table-wrap,
  .advanced-filters,
  .display-settings-panel,
  .drawer-overlay,
  .modal-backdrop,
  .card-form,
  .card-summary-panel,
  .entry-drawer,
  .utility-drawer,
  .drawer-head,
  .card-form-actions,
  .entry-drawer-actions,
  input,
  select,
  textarea,
  .btn-primary,
  .btn-outline,
  .btn-ghost,
  .rate-chip
),
html[data-ui="organic-v41"] .dashboard .kpi,
html[data-ui="organic-v41"] .dashboard .limit-kpi,
html[data-ui="organic-v41"] :is(.row-actions, .card-row-actions, .loyalty-actions) button {
  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html[data-ui="organic-v41"] :is(
  .dashboard .kpi,
  .net-card,
  .hero-graphic,
  .analytics-chart-block,
  .card-row-wide,
  .billing-ledger,
  .bill-row,
  .loyalty-card,
  .record-summary-strip,
  .table-wrap
) {
  box-shadow: 0 1px 2px rgba(44, 55, 40, 0.08), inset 0 1px rgba(255, 255, 255, 0.66) !important;
}

html[data-ui="organic-v41"] :is(
  .app-header,
  .app-header.is-compact,
  .side-tool-rail,
  .toast,
  .display-settings-panel,
  .card-form,
  .card-summary-panel,
  .entry-drawer,
  .utility-drawer
) {
  box-shadow: 0 1px 3px rgba(44, 55, 40, 0.12) !important;
}

html[data-ui="organic-v41"] :is(.app-header, .app-header.is-compact),
html[data-ui="organic-v41"] body.nav-collapsed .app-header,
html[data-ui="organic-v41"] :is(.app-header, .app-header.is-compact) .section-tabs,
html[data-ui="organic-v41"] body.nav-collapsed .app-header .section-tabs,
html[data-ui="organic-v41"] :is(.side-tool-rail, .toast, .display-settings-panel) {
  background: rgba(249, 250, 246, 0.98) !important;
}

html[data-ui="organic-v41"] :is(
  .card-form,
  .card-summary-panel,
  .entry-drawer,
  .utility-drawer,
  .drawer-head,
  .card-form-actions,
  .entry-drawer-actions
) {
  background: #f8f9f4 !important;
}

html[data-ui="organic-v41"][data-theme="dark"] :is(.app-header, .app-header.is-compact),
html[data-ui="organic-v41"][data-theme="dark"] body.nav-collapsed .app-header,
html[data-ui="organic-v41"][data-theme="dark"] :is(.app-header, .app-header.is-compact) .section-tabs,
html[data-ui="organic-v41"][data-theme="dark"] body.nav-collapsed .app-header .section-tabs,
html[data-ui="organic-v41"][data-theme="dark"] :is(
  .side-tool-rail,
  .toast,
  .display-settings-panel,
  .card-form,
  .card-summary-panel,
  .entry-drawer,
  .utility-drawer,
  .drawer-head,
  .card-form-actions,
  .entry-drawer-actions
) {
  background: rgba(24, 30, 23, 0.99) !important;
}

html[data-ui="organic-v41"] :is(
  .card-row-wide,
  .bill-row,
  .loyalty-card,
  .analytics-chart-block
) {
  content-visibility: auto;
  contain: paint style;
  contain-intrinsic-size: auto 180px;
}

html[data-ui="organic-v41"] #recordsBody tr {
  content-visibility: auto;
  contain: paint style;
  contain-intrinsic-size: auto 92px;
}

html[data-ui="organic-v41"] :is(
  .card-form-body,
  .bill-form-body,
  .loyalty-form-body,
  .entry-drawer-body,
  .card-summary-table-wrap,
  .utility-drawer-body
) {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 760px) {
  html[data-ui="organic-v41"] #recordsBody tr {
    contain-intrinsic-size: auto 500px;
  }

  html[data-ui="organic-v41"] :is(.app-header, .app-header.is-compact),
  html[data-ui="organic-v41"] :is(.app-header, .app-header.is-compact) .section-tabs,
  html[data-ui="organic-v41"] body.nav-collapsed .app-header .section-tabs {
    box-shadow: none !important;
  }
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/performance-budget.test.mjs
```

Expected: all performance-budget tests pass with zero failures.

- [ ] **Step 5: Commit the CSS performance unit**

Run:

```bash
git add organic-liquid.css tests/performance-budget.test.mjs
git commit -m "perf: reduce scroll paint work"
```

Expected: one commit containing only the final CSS performance layer and its regression tests.

### Task 2: Immediate View Switching and Fresh Assets

**Files:**
- Modify: `tests/performance-budget.test.mjs`
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Write the failing JavaScript and asset contracts**

Append these tests to `tests/performance-budget.test.mjs`:

```js
test("view switching avoids animated page scrolling", () => {
  assert.doesNotMatch(appJs, /behavior:\s*["']smooth["']/);
  assert.match(appJs, /window\.scrollTo\(\{\s*top:\s*0,\s*behavior:\s*["']auto["']\s*\}\)/);
});

test("scroll performance build uses fresh asset versions", () => {
  assert.match(appJs, /window\.__pointsLedgerBuild\s*=\s*["']scroll-performance-v74["']/);
  assert.match(indexHtml, /organic-liquid\.css\?v=82/);
  assert.match(indexHtml, /app\.js\?v=74/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/performance-budget.test.mjs
```

Expected: the two new tests fail because `app.js` still uses smooth scrolling/build `v73`, while `index.html` still loads CSS `v81` and JS `v73`.

- [ ] **Step 3: Apply the minimal JavaScript and cache changes**

In `app.js`, replace the build marker with:

```js
window.__pointsLedgerBuild = "scroll-performance-v74";
```

In `switchView()`, replace the current scroll call with:

```js
window.scrollTo({ top: 0, behavior: "auto" });
```

In `index.html`, use exactly these asset references:

```html
<link rel="stylesheet" href="./organic-liquid.css?v=82" />
```

```html
<script src="./app.js?v=74"></script>
```

- [ ] **Step 4: Verify focused tests and syntax are GREEN**

Run:

```bash
node --test tests/performance-budget.test.mjs
node --check app.js
```

Expected: all performance-budget tests pass and `node --check` exits with status 0.

- [ ] **Step 5: Commit the view-switch and asset unit**

Run:

```bash
git add app.js index.html tests/performance-budget.test.mjs
git commit -m "perf: make ledger navigation immediately responsive"
```

Expected: one commit containing the immediate-scroll behavior, build/cache versions, and tests.

### Task 3: Full Regression and Layout Verification

**Files:**
- Verify: `app.js`
- Verify: `cloud-sync.js`
- Verify: `index.html`
- Verify: `organic-liquid.css`
- Verify: `tests/*.test.mjs`
- Verify: `tests/*.test.cjs`

- [ ] **Step 1: Run the complete automated verification**

Run each command and require exit status 0:

```bash
node --check app.js
node --check cloud-sync.js
node --test tests/*.test.mjs tests/*.test.cjs
git diff --check
```

Expected: zero syntax errors, zero failed tests, and no whitespace errors.

- [ ] **Step 2: Confirm the final cascade and absence of scroll listeners**

Run:

```bash
rg -n "Mobile Responsive V81|Performance Pass V82|content-visibility|backdrop-filter|behavior: \"auto\"" organic-liquid.css app.js
rg -n "addEventListener\((\"|')(scroll|wheel|touchmove)" app.js cloud-sync.js
```

Expected: `Performance Pass V82` appears after V81; V82 includes deferred rendering and `backdrop-filter: none`; `app.js` uses `behavior: "auto"`; the listener search returns no matches.

- [ ] **Step 3: Start or reuse the local preview**

Run when port 8768 is not already serving the project:

```bash
python3 -m http.server 8768 --bind 127.0.0.1
```

Open or reload:

```text
http://localhost:8768/
```

Expected: the page loads `organic-liquid.css?v=82` and `app.js?v=74` without console errors.

- [ ] **Step 4: Verify all required viewports**

Use the browser viewport capability for each size:

```text
360 x 800
390 x 844
430 x 932
1440 x 900
```

For every size, verify:

```text
document.documentElement.scrollWidth === window.innerWidth
```

At phone sizes, confirm the header remains 56px, bottom navigation remains 64px, tabs remain at least 44px high, and drawers cover the full viewport. At desktop size, confirm the mobile tools button is hidden and navigation remains in the top header.

- [ ] **Step 5: Exercise every scroll surface**

Check the cards, fee records, fee dashboard, points, card summary, bill form, reminder, and backup views. Confirm that repeated items retain stable height as they enter the viewport, record labels and points remain complete, and fixed navigation does not flicker or overlap content.

- [ ] **Step 6: Confirm repository scope**

Run:

```bash
git status --short --branch
git log -3 --oneline
```

Expected: only the intentional local commits are ahead of `origin/main`; no temporary QA files or unrelated modifications remain. Do not push unless the user explicitly requests GitHub synchronization.

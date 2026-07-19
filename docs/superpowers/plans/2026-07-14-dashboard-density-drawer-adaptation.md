# Dashboard Density and Drawer Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the selected fee-dashboard layout fit its hero and six summary metrics into a 100% desktop viewport, while keeping card summary and bill-entry drawers below the fixed navigation with stable headers and actions.

**Architecture:** Add one final scoped CSS layer before the required terminal toast layer so it can safely override the accumulated legacy cascade without restructuring application markup. Protect the new layout with static regression tests, then verify the real interface at desktop and mobile viewport sizes with populated data.

**Tech Stack:** Static HTML, CSS, browser DOM, Node.js built-in test runner, headless Chrome/CDP.

---

### Task 1: Add Layout Regression Tests

**Files:**
- Create: `tests/dashboard-drawer-adaptation.test.mjs`
- Read: `organic-liquid.css`

- [ ] **Step 1: Write the failing drawer test**

```js
test("card summary and bill drawers respect the fixed header", () => {
  assert.match(layoutLayer, /\.card-summary-overlay[\s\S]*\.bill-form-overlay[\s\S]*top:\s*var\(--fixed-header-offset\)/);
  assert.match(layoutLayer, /height:\s*calc\(100dvh\s*-\s*var\(--fixed-header-offset\)\)/);
  assert.match(layoutLayer, /\.card-summary-panel[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/);
  assert.match(layoutLayer, /\.card-summary-table thead th[\s\S]*position:\s*sticky/);
  assert.match(layoutLayer, /\.bill-form \.card-form-actions[\s\S]*position:\s*sticky[\s\S]*bottom:\s*0/);
});
```

- [ ] **Step 2: Write the failing compact-dashboard test**

```js
test("desktop fee dashboard uses the approved compact first-screen dimensions", () => {
  assert.match(layoutLayer, /@media\s*\(min-width:\s*981px\)/);
  assert.match(layoutLayer, /#view-fee-dashboard\.hero[\s\S]*min-height:\s*12\.5rem/);
  assert.match(layoutLayer, /#view-fee-dashboard[\s\S]*\.net-card[\s\S]*min-height:\s*12\.5rem/);
  assert.match(layoutLayer, /\.stats\[data-view="fee-dashboard"\][\s\S]*padding:\s*1rem 1\.1rem/);
  assert.match(layoutLayer, /\.stats\[data-view="fee-dashboard"\] \.stat[\s\S]*min-height:\s*4\.75rem/);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run: `node --test tests/dashboard-drawer-adaptation.test.mjs`

Expected: FAIL because the final `Dashboard Density & Drawer Adaptation V78` layer does not exist.

### Task 2: Adapt Card Summary and Bill Drawers

**Files:**
- Modify: `organic-liquid.css` before `/* -- Toast Feedback V72 -- */`
- Test: `tests/dashboard-drawer-adaptation.test.mjs`

- [ ] **Step 1: Add a shared safe-area overlay rule**

```css
html[data-ui="organic-v41"] :is(.card-summary-overlay, .bill-form-overlay) {
  top: var(--fixed-header-offset);
  bottom: auto;
  height: calc(100dvh - var(--fixed-header-offset));
  align-items: stretch;
}
```

- [ ] **Step 2: Make card summary a bounded grid drawer**

```css
html[data-ui="organic-v41"] .card-summary-panel {
  width: min(46rem, 52vw);
  height: 100%;
  max-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-radius: 0 8px 0 0;
}

html[data-ui="organic-v41"] .card-summary-table-wrap {
  min-height: 0;
  max-height: none;
  overflow: auto;
}

html[data-ui="organic-v41"] .card-summary-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
}
```

- [ ] **Step 3: Make bill form header and actions sticky**

```css
html[data-ui="organic-v41"] .bill-form {
  width: min(34rem, 42vw);
  height: 100%;
  max-height: 100%;
  padding: 1rem 1.1rem 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 0 8px 0 0;
}

html[data-ui="organic-v41"] .bill-form .drawer-head {
  position: sticky;
  top: -1rem;
  z-index: 4;
  margin: -1rem -1.1rem 1rem;
  padding: 0.85rem 1.1rem 0.75rem;
  background: rgba(250, 249, 244, 0.98);
}

html[data-ui="organic-v41"] .bill-form .card-form-actions {
  position: sticky;
  bottom: 0;
  z-index: 4;
  margin: 1rem -1.1rem 0;
  padding: 0.8rem 1.1rem calc(0.8rem + env(safe-area-inset-bottom));
  background: rgba(250, 249, 244, 0.98);
}
```

- [ ] **Step 4: Add phone-width rules**

```css
@media (max-width: 760px) {
  html[data-ui="organic-v41"] :is(.card-summary-panel, .bill-form) {
    width: 100vw;
    max-width: 100vw;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  html[data-ui="organic-v41"] .bill-form .field-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- [ ] **Step 5: Run the focused test**

Run: `node --test tests/dashboard-drawer-adaptation.test.mjs`

Expected: drawer assertions PASS.

### Task 3: Implement Approved Compact Fee Dashboard

**Files:**
- Modify: `organic-liquid.css` in the same final V78 layer
- Test: `tests/dashboard-drawer-adaptation.test.mjs`

- [ ] **Step 1: Add desktop-only compact hero dimensions**

```css
@media (min-width: 981px) {
  html[data-ui="organic-v41"] #view-fee-dashboard.hero {
    min-height: 12.5rem;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  html[data-ui="organic-v41"] #view-fee-dashboard :is(.net-card, .hero-graphic) {
    min-height: 12.5rem;
  }

  html[data-ui="organic-v41"] #view-fee-dashboard .net-card {
    padding: 1.35rem 1.55rem;
  }

  html[data-ui="organic-v41"] #view-fee-dashboard #netProfit {
    font-size: 3rem;
  }
}
```

- [ ] **Step 2: Compact only the fee dashboard summary**

```css
@media (min-width: 981px) {
  html[data-ui="organic-v41"] .stats[data-view="fee-dashboard"] {
    margin-bottom: 0.9rem;
    padding: 1rem 1.1rem;
  }

  html[data-ui="organic-v41"] .stats[data-view="fee-dashboard"] .stats-head {
    min-height: 2.35rem;
    margin-bottom: 0.4rem;
  }

  html[data-ui="organic-v41"] .stats[data-view="fee-dashboard"] .stat {
    min-height: 4.75rem;
    padding: 0.72rem 0.85rem;
  }
}
```

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `node --test tests/dashboard-drawer-adaptation.test.mjs`

Expected: all focused assertions PASS.

### Task 4: Verify Behavior and Visual Layout

**Files:**
- Verify: `index.html`, `organic-liquid.css`, `app.js`
- Test: all files in `tests/`

- [ ] **Step 1: Run the full automated suite**

Run: `node --test tests/*.test.mjs tests/*.test.cjs && node tests/toast-layout.test.mjs`

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run syntax and whitespace checks**

Run: `node --check app.js && node --check cloud-sync.js && git diff --check`

Expected: exit code 0.

- [ ] **Step 3: Verify real browser layouts**

Open `http://127.0.0.1:8768/`, seed representative cards and bills, then capture:

- `1440 x 900`: fee hero and all six summary metrics visible before the fold.
- `1280 x 720`: no overlap between hero, summary filters, and metrics.
- `390 x 844`: card summary and bill form start below navigation and occupy the usable width.

- [ ] **Step 4: Verify drawer interaction**

Confirm card-summary table scrolling keeps its heading visible. Confirm bill-form scrolling keeps the title, close control, save button, and cancel button accessible.

- [ ] **Step 5: Review the final diff**

Run: `git diff -- organic-liquid.css tests/dashboard-drawer-adaptation.test.mjs`

Expected: only the scoped V78 CSS layer and its regression tests are added; existing performance changes remain intact.

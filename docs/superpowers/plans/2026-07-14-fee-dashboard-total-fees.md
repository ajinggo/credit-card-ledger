# Fee Dashboard Total Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fee-dashboard net-profit emphasis with total-fee metrics while preserving detailed net-profit data elsewhere.

**Architecture:** Reuse the existing period-filtered records in `renderStats` for the headline total, and change `renderTrend` to aggregate `record.fee` by month. Keep record storage, filtering, CSV export, and detail-table calculations untouched.

**Tech Stack:** HTML5, vanilla JavaScript, CSS3, Node built-in test runner.

---

### Task 1: Dashboard Contract

**Files:**
- Create: `tests/fee-dashboard-total-fees.test.mjs`
- Modify: `index.html`
- Modify: `app.js`

- [ ] Write a failing test asserting `总手续费`, `Total Fees`, `月度手续费`, and `按月汇总实际手续费` are present.
- [ ] Assert `renderTrend` adds `Number(r.fee || 0)` and no longer calculates `r.pointValue - r.fee`.
- [ ] Run `node --test tests/fee-dashboard-total-fees.test.mjs` and verify it fails for the old labels and formula.
- [ ] Replace the hero and chart copy, update the empty-state wording, and bump the HTML and app cache versions.
- [ ] Change `renderTrend` to aggregate fees while keeping month-click navigation unchanged.
- [ ] Run the focused test and `node --check app.js`; both must pass.

### Task 2: Verification And Publish

**Files:**
- Modify only when a verified regression requires it.

- [ ] Run all model, UI, performance, layout, and dashboard tests plus all JavaScript syntax checks.
- [ ] Verify desktop and mobile screenshots show the total-fee headline and monthly-fee chart without overlap.
- [ ] Review the complete accumulated diff so performance, record layout, display settings, and dashboard changes are all intentional.
- [ ] Commit all intended files with a concise summary and push the current branch to GitHub as requested.

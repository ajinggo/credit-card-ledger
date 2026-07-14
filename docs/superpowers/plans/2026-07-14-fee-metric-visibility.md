# Fee Summary Visibility Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent display-settings menu that controls both fee-summary metrics and record-table columns without changing calculations, filters, exports, or stored ledger records.

**Architecture:** Put visibility validation in a small UMD model so the browser and Node tests use the same rules. Keep DOM structure and controls in `index.html`, apply visibility from `app.js`, and store the normalized setting in local storage plus the existing snapshot `settings` object used by cloud sync and JSON backup.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Local Storage, existing ledger snapshot API, Node built-in test runner.

---

### Task 1: Visibility Rules Model

**Files:**
- Create: `fee-visibility-model.js`
- Create: `tests/fee-visibility-model.test.cjs`

- [ ] **Step 1: Write failing model tests**

Test that defaults include all four summary keys and all eleven column keys, unknown keys are removed, empty summary arrays remain valid, imported column settings containing only `actions` regain the `card` column, updates do not mutate their input, and the last data column cannot be hidden.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/fee-visibility-model.test.cjs`

Expected: FAIL because `fee-visibility-model.js` does not exist.

- [ ] **Step 3: Implement the UMD model**

Expose these immutable constants and functions:

```js
const SUMMARY_KEYS = ["count", "spend", "fee", "net"];
const COLUMN_KEYS = ["date", "card", "method", "channel", "cashout", "fee", "rate", "pointValue", "net", "billMonth", "actions"];
const DATA_COLUMN_KEYS = COLUMN_KEYS.filter((key) => key !== "actions");

function getDefaultVisibility() {}
function normalizeVisibility(value) {}
function setVisibility(value, group, key, visible) {}
function isVisible(value, group, key) {}
```

`normalizeVisibility` must preserve explicit empty `summary`, canonicalize ordering, ignore unknown values, use all defaults when a group is missing, and add `card` when no data column remains. `setVisibility` must return `{ settings, changed }` and reject hiding the final data column.

- [ ] **Step 4: Run the model tests and verify GREEN**

Run: `node --test tests/fee-visibility-model.test.cjs`

Expected: all visibility model tests PASS.

### Task 2: Display Settings Markup And Styling

**Files:**
- Modify: `index.html:630-684`
- Modify: `organic-liquid.css` near the final feature layers
- Create: `tests/fee-visibility-ui.test.mjs`

- [ ] **Step 1: Write a failing DOM contract test**

Read `index.html`, `app.js`, and `organic-liquid.css`. Assert the presence of `displaySettingsButton`, `displaySettingsPanel`, `resetDisplaySettingsButton`, four `data-summary-visibility` controls, eleven `data-column-visibility` controls, matching `data-summary-metric` and `data-record-column` targets, explicit `[hidden]` CSS, and bumped script/style versions.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/fee-visibility-ui.test.mjs`

Expected: FAIL because the controls and target attributes do not exist.

- [ ] **Step 3: Add the toolbar menu and target identifiers**

Add a `display-settings-control` wrapper next to the existing filter button. Its button uses `aria-expanded="false"` and `aria-controls="displaySettingsPanel"`. The hidden panel contains two fieldsets of checkboxes and a restore-default button. Add `data-summary-metric` to each summary tile and `data-record-column` to every table heading.

- [ ] **Step 4: Add the final visual layer**

Style a compact two-column panel on desktop and one column on narrow screens. Use the existing light/dark surface variables, 8px-or-less panel corners, native checkboxes, a restrained divider between groups, and explicit `display: none !important` rules for hidden targets and the panel. Keep `.table-wrap` responsible for horizontal scrolling.

- [ ] **Step 5: Run the UI contract test and verify GREEN**

Run: `node --test tests/fee-visibility-ui.test.mjs`

Expected: all display-settings markup and style assertions PASS.

### Task 3: Runtime, Persistence, And Snapshot Integration

**Files:**
- Modify: `index.html` script list
- Modify: `app.js` constants, state, `renderRecords`, `exportFullBackup`, `importFullBackup`, `exportLedgerSnapshot`, and `applyLedgerSnapshot`
- Modify: `tests/fee-visibility-ui.test.mjs`

- [ ] **Step 1: Extend the failing integration assertions**

Assert that `fee-visibility-model.js` loads before `app.js`, `FEE_VISIBILITY_KEY` exists, the settings are saved to local storage, `feeVisibility` appears in both backup and cloud snapshot settings, imported settings are normalized, and rendered row cells receive all eleven matching `data-record-column` identifiers.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `node --test tests/fee-visibility-ui.test.mjs`

Expected: FAIL on the missing runtime and snapshot integration.

- [ ] **Step 3: Implement runtime display application**

Load and normalize local settings at startup. Implement:

```js
function applyFeeVisibility() {}
function saveFeeVisibility() {}
function syncFeeVisibilityControls() {}
function setDisplaySettingsOpen(open) {}
```

`applyFeeVisibility` updates summary and column targets through `hidden`, collapses the full summary strip when every summary item is hidden, and updates checkbox states. Call it after record rendering so newly generated cells inherit the current setting.

- [ ] **Step 4: Implement interactions and accessibility**

Handle the toolbar button, checkbox changes, restore-default, outside click, and `Escape`. When the user attempts to hide the final data column, keep the checkbox checked and show `至少保留一个明细列`. Keep `aria-expanded` synchronized with panel visibility.

- [ ] **Step 5: Integrate local, backup, and cloud persistence**

Write normalized settings to local storage and call `window.ledgerCloud?.schedulePush()` after user changes. Add `feeVisibility` to both exported settings objects. On full-backup import and cloud snapshot application, normalize the incoming value, save it locally, render, and apply it. Missing values from old snapshots must resolve to defaults.

- [ ] **Step 6: Run focused tests and syntax checks**

Run:

```bash
node --test tests/fee-visibility-model.test.cjs tests/fee-visibility-ui.test.mjs
node --check fee-visibility-model.js
node --check app.js
```

Expected: all tests PASS and both syntax checks exit successfully.

### Task 4: Regression And Visual Verification

**Files:**
- Modify only if a verified regression is found.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
node --test tests/performance-budget.test.mjs tests/record-card-layout.test.mjs tests/fee-visibility-model.test.cjs tests/fee-visibility-ui.test.mjs tests/card-sort-model.test.cjs tests/credit-account-model.test.cjs
node tests/toast-layout.test.mjs
node --check app.js
node --check cloud-sync.js
node --check fee-visibility-model.js
node --check card-sort-model.js
node --check credit-account-model.js
node --check supabase-config.js
git diff --check
```

Expected: all tests and syntax checks PASS with no whitespace errors.

- [ ] **Step 2: Verify desktop behavior**

At `1440x1000`, check opening and closing the panel, each summary toggle, representative table-column toggles, the last-data-column guard, restore default, outside click, `Escape`, refresh persistence, and a record containing a long card name plus a large points value.

- [ ] **Step 3: Verify mobile behavior**

At `390x844`, check that the panel fits without text overlap, controls remain tappable, hidden columns reduce horizontal table width, and the toolbar and summary strip reflow without overflow.

- [ ] **Step 4: Review final scope**

Confirm no ledger values, CSV fields, filter behavior, sort behavior, or unrelated navigation styles changed. Keep the implementation local and do not push to GitHub unless the user explicitly requests it.

# Toast Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move save and error notifications below the fixed navigation so they remain fully visible on desktop and mobile.

**Architecture:** Keep the existing `showToast(message, type)` JavaScript API and status-region markup unchanged. Add one final, scoped CSS override that derives its top position from `--fixed-header-offset`, establishes the correct stacking order, and supplies responsive success/error presentation.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js source regression test, browser visual verification

---

### Task 1: Add a toast layout regression test

**Files:**
- Create: `tests/toast-layout.test.mjs`
- Read: `organic-liquid.css`

- [x] **Step 1: Write the failing test**

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../organic-liquid.css", import.meta.url), "utf8");
const marker = "/* -- Toast Feedback V72 -- */";
const block = css.slice(css.lastIndexOf(marker));

assert.notEqual(css.lastIndexOf(marker), -1, "missing final toast feedback block");
assert.match(block, /top:\s*calc\(var\(--fixed-header-offset\) \+ 0\.75rem\)/);
assert.match(block, /z-index:\s*500/);
assert.match(block, /max-width:\s*calc\(100vw - 2rem\)/);
assert.match(block, /\.toast\.success::before/);
assert.match(block, /\.toast\.error::before/);
```

- [x] **Step 2: Run the test to verify it fails**

Run: `node tests/toast-layout.test.mjs`

Expected: FAIL with `missing final toast feedback block`.

### Task 2: Implement the selected notification design

**Files:**
- Modify: `organic-liquid.css`

- [x] **Step 1: Add the final scoped CSS block**

Append a `Toast Feedback V72` block that:

```css
html[data-ui="organic-v41"] .toast {
  top: calc(var(--fixed-header-offset) + 0.75rem);
  left: 50%;
  z-index: 500;
  display: flex;
  max-width: calc(100vw - 2rem);
  transform: translateX(-50%) translateY(-0.65rem);
}

html[data-ui="organic-v41"] .toast.show {
  transform: translateX(-50%) translateY(0);
}
```

Complete the block with the approved frosted light/dark surfaces, circular success/error icons, wrapping behavior, and non-interactive pointer behavior.

- [x] **Step 2: Run the regression test**

Run: `node tests/toast-layout.test.mjs`

Expected: PASS with no output and exit code 0.

- [x] **Step 3: Run syntax and whitespace checks**

Run: `node --check app.js && node --check cloud-sync.js && git diff --check`

Expected: all commands exit 0.

### Task 3: Verify real layout and publish

**Files:**
- Verify: `index.html`
- Verify: `organic-liquid.css`

- [x] **Step 1: Trigger the toast in the fee workflow**

Run the app locally, open the fee-entry workflow, save a test entry, and verify the notification is below the fixed header.

- [x] **Step 2: Verify responsive and theme states**

Capture desktop and mobile screenshots. Confirm the toast stays inside the viewport, remains readable in light and dark themes, and does not block pointer input.

- [x] **Step 3: Commit and push**

```bash
git add organic-liquid.css tests/toast-layout.test.mjs docs/superpowers/plans/2026-07-13-toast-notification.md
git commit -m "Redesign toast notifications"
git push origin main
```

Expected: GitHub `main` contains the new commit and the working tree is clean.

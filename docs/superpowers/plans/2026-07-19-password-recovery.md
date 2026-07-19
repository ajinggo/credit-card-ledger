# Password Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete Supabase email password-recovery flow to the existing authentication panel without changing ledger data, database policies, or synchronization ownership.

**Architecture:** Introduce one small browser/CommonJS auth-flow model for deterministic view configuration, validation, recovery-URL detection, and auth-event decisions. Keep DOM rendering and Supabase calls in `cloud-sync.js`, reuse the existing authentication overlay for all four states, and append one final CSS layer for the new controls. Load the model before cloud synchronization, then cache-bust the updated CSS and cloud script.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Supabase JS `2.110.2`, Node.js built-in test runner, local HTTP preview, in-app browser responsive verification.

---

## File Map

- Create `auth-flow-model.js`: pure auth modes, validation, redirect construction, recovery-URL detection, and auth-event decisions; browser global plus CommonJS export.
- Create `tests/auth-flow-model.test.cjs`: direct unit tests for every pure model branch.
- Create `tests/password-recovery-ui.test.mjs`: HTML, CSS, Supabase wiring, privacy message, and cache-version contracts.
- Modify `index.html`: add recovery controls and confirmation field, load the auth model, and bump CSS/cloud asset versions.
- Modify `organic-liquid.css`: append `Password Recovery V83` styles after the V82 performance layer.
- Modify `cloud-sync.js`: implement four auth states, recovery requests, early recovery-event handling, password update, and existing-ledger continuation.
- Modify `tests/performance-budget.test.mjs`: update the exact stylesheet asset contract from `v82` to `v83` without changing the V82 performance-layer contracts.
- Modify `tests/fee-visibility-ui.test.mjs`, `tests/mobile-responsive-layout.test.mjs`, and `tests/dashboard-drawer-adaptation.test.mjs`: refresh only stale stylesheet cache assertions.

### Task 1: Pure Authentication Flow Model

**Files:**
- Create: `tests/auth-flow-model.test.cjs`
- Create: `auth-flow-model.js`
- Modify: `index.html:767-772`

- [ ] **Step 1: Write failing mode, validation, redirect, and event tests**

Create `tests/auth-flow-model.test.cjs`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const AuthFlowModel = require("../auth-flow-model.js");
const indexHtml = readFileSync(join(__dirname, "../index.html"), "utf8");

test("auth views expose the four approved states", () => {
  assert.deepEqual(AuthFlowModel.getAuthView("signin"), {
    mode: "signin",
    title: "登录云端账本",
    submitLabel: "登录",
    emailVisible: true,
    passwordVisible: true,
    confirmationVisible: false,
    forgotVisible: true,
    modeButtonVisible: true,
    modeButtonLabel: "没有账号，创建一个",
    modeButtonTarget: "signup",
    passwordAutocomplete: "current-password",
  });
  assert.equal(AuthFlowModel.getAuthView("signup").modeButtonTarget, "signin");
  assert.equal(AuthFlowModel.getAuthView("request-reset").submitLabel, "发送重置邮件");
  assert.equal(AuthFlowModel.getAuthView("update-password").confirmationVisible, true);
  assert.equal(AuthFlowModel.getAuthView("unknown").mode, "signin");
});

test("reset email validation is trimmed and privacy-safe", () => {
  assert.equal(AuthFlowModel.validateResetEmail(" user@example.com "), "");
  assert.equal(AuthFlowModel.validateResetEmail("invalid"), "请输入有效邮箱。");
  assert.equal(AuthFlowModel.RESET_SENT_MESSAGE, "如果该邮箱已注册，重置邮件将发送到你的邮箱。");
});

test("new password validation requires length and confirmation", () => {
  assert.equal(AuthFlowModel.validateNewPassword("1234567", "1234567"), "新密码至少需要 8 位。");
  assert.equal(AuthFlowModel.validateNewPassword("12345678", "87654321"), "两次输入的密码不一致。");
  assert.equal(AuthFlowModel.validateNewPassword("12345678", "12345678"), "");
});

test("recovery redirect uses only the current origin and pathname", () => {
  assert.equal(
    AuthFlowModel.getRecoveryRedirect({
      origin: "https://credit-card-ledger.vercel.app",
      pathname: "/ledger/",
      search: "?view=cards",
      hash: "#records",
    }),
    "https://credit-card-ledger.vercel.app/ledger/",
  );
});

test("recovery URL detection accepts query or fragment type", () => {
  assert.equal(AuthFlowModel.isRecoveryLocation({ search: "?type=recovery", hash: "" }), true);
  assert.equal(AuthFlowModel.isRecoveryLocation({ search: "", hash: "#access_token=x&type=recovery" }), true);
  assert.equal(AuthFlowModel.isRecoveryLocation({ search: "?type=signup", hash: "" }), false);
});

test("password recovery takes precedence over signed-in preparation", () => {
  assert.equal(AuthFlowModel.getAuthEventAction("PASSWORD_RECOVERY", {
    hasSession: true,
    recoveryActive: false,
    userChanged: true,
  }), "show-recovery");
  assert.equal(AuthFlowModel.getAuthEventAction("SIGNED_IN", {
    hasSession: true,
    recoveryActive: true,
    userChanged: true,
  }), "hold-recovery");
  assert.equal(AuthFlowModel.getAuthEventAction("TOKEN_REFRESHED", {
    hasSession: true,
    recoveryActive: true,
    userChanged: false,
  }), "refresh-recovery-session");
  assert.equal(AuthFlowModel.getAuthEventAction("SIGNED_IN", {
    hasSession: true,
    recoveryActive: false,
    userChanged: true,
  }), "prepare-ledger");
  assert.equal(AuthFlowModel.getAuthEventAction("SIGNED_OUT", {
    hasSession: false,
    recoveryActive: false,
    userChanged: false,
  }), "show-signed-out");
});

test("auth model loads before the cloud controller", () => {
  const modelIndex = indexHtml.indexOf("auth-flow-model.js?v=1");
  const cloudIndex = indexHtml.indexOf("cloud-sync.js?v=2");
  assert.ok(modelIndex > -1 && cloudIndex > modelIndex);
});
```

- [ ] **Step 2: Run the model tests and verify RED**

Run:

```bash
node --test tests/auth-flow-model.test.cjs
```

Expected: FAIL with `Cannot find module '../auth-flow-model.js'`.

- [ ] **Step 3: Implement the minimal pure model**

Create `auth-flow-model.js`:

```js
(function initializeAuthFlowModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AuthFlowModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createAuthFlowModel() {
  const RESET_SENT_MESSAGE = "如果该邮箱已注册，重置邮件将发送到你的邮箱。";
  const AUTH_VIEWS = Object.freeze({
    signin: Object.freeze({
      mode: "signin",
      title: "登录云端账本",
      submitLabel: "登录",
      emailVisible: true,
      passwordVisible: true,
      confirmationVisible: false,
      forgotVisible: true,
      modeButtonVisible: true,
      modeButtonLabel: "没有账号，创建一个",
      modeButtonTarget: "signup",
      passwordAutocomplete: "current-password",
    }),
    signup: Object.freeze({
      mode: "signup",
      title: "创建云端账本",
      submitLabel: "注册账号",
      emailVisible: true,
      passwordVisible: true,
      confirmationVisible: false,
      forgotVisible: false,
      modeButtonVisible: true,
      modeButtonLabel: "已有账号，直接登录",
      modeButtonTarget: "signin",
      passwordAutocomplete: "new-password",
    }),
    "request-reset": Object.freeze({
      mode: "request-reset",
      title: "找回密码",
      submitLabel: "发送重置邮件",
      emailVisible: true,
      passwordVisible: false,
      confirmationVisible: false,
      forgotVisible: false,
      modeButtonVisible: true,
      modeButtonLabel: "返回登录",
      modeButtonTarget: "signin",
      passwordAutocomplete: "current-password",
    }),
    "update-password": Object.freeze({
      mode: "update-password",
      title: "设置新密码",
      submitLabel: "保存新密码",
      emailVisible: false,
      passwordVisible: true,
      confirmationVisible: true,
      forgotVisible: false,
      modeButtonVisible: false,
      modeButtonLabel: "",
      modeButtonTarget: "",
      passwordAutocomplete: "new-password",
    }),
  });

  function getAuthView(mode) {
    return AUTH_VIEWS[mode] || AUTH_VIEWS.signin;
  }

  function validateResetEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim())
      ? ""
      : "请输入有效邮箱。";
  }

  function validateNewPassword(password, confirmation) {
    if (String(password || "").length < 8) return "新密码至少需要 8 位。";
    if (password !== confirmation) return "两次输入的密码不一致。";
    return "";
  }

  function getRecoveryRedirect(locationLike) {
    return `${locationLike.origin}${locationLike.pathname}`;
  }

  function isRecoveryLocation(locationLike) {
    return /(?:^|[?&#])type=recovery(?:[&#]|$)/.test(
      `${locationLike.search || ""}${locationLike.hash || ""}`,
    );
  }

  function getAuthEventAction(event, state) {
    if (event === "PASSWORD_RECOVERY" && state.hasSession) return "show-recovery";
    if (event === "SIGNED_OUT" || !state.hasSession) return "show-signed-out";
    if (state.recoveryActive) {
      return event === "TOKEN_REFRESHED" ? "refresh-recovery-session" : "hold-recovery";
    }
    if (event === "SIGNED_IN" && state.userChanged) return "prepare-ledger";
    if (event === "TOKEN_REFRESHED") return "refresh-session";
    return "none";
  }

  return Object.freeze({
    RESET_SENT_MESSAGE,
    getAuthView,
    validateResetEmail,
    validateNewPassword,
    getRecoveryRedirect,
    isRecoveryLocation,
    getAuthEventAction,
  });
});
```

- [ ] **Step 4: Load the model before cloud synchronization**

Add the model script before `app.js` and `cloud-sync.js` at the bottom of `index.html`:

```html
<script src="./credit-account-model.js?v=1"></script>
<script src="./card-sort-model.js?v=1"></script>
<script src="./fee-visibility-model.js?v=1"></script>
<script src="./auth-flow-model.js?v=1"></script>
<script src="./app.js?v=74"></script>
<script src="./cloud-sync.js?v=2"></script>
```

- [ ] **Step 5: Run the model tests and verify GREEN**

Run:

```bash
node --test tests/auth-flow-model.test.cjs
node --check auth-flow-model.js
```

Expected: 7 tests pass and syntax check exits `0`.

- [ ] **Step 6: Commit the pure model**

```bash
git add auth-flow-model.js tests/auth-flow-model.test.cjs index.html
git commit -m "feat: model password recovery states"
```

### Task 2: Authentication Panel Recovery UI

**Files:**
- Create: `tests/password-recovery-ui.test.mjs`
- Modify: `index.html:25-37`
- Modify: `organic-liquid.css` after `Performance Pass V82`

- [ ] **Step 1: Write failing markup and CSS contracts**

Create `tests/password-recovery-ui.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const organicCss = await readFile(new URL("organic-liquid.css", root), "utf8");
const cloudSync = await readFile(new URL("cloud-sync.js", root), "utf8");

test("authentication panel exposes accessible recovery controls", () => {
  assert.match(indexHtml, /id="authEmailField"[\s\S]*id="authEmail"[^>]+autocomplete="email"/);
  assert.match(indexHtml, /id="authPasswordField"[\s\S]*id="authPassword"[^>]+autocomplete="current-password"/);
  assert.match(indexHtml, /id="authConfirmPasswordField"[^>]+hidden[\s\S]*id="authConfirmPassword"[^>]+autocomplete="new-password"/);
  assert.match(indexHtml, /id="authForgotPasswordButton"[^>]+type="button"[^>]*>忘记密码？</);
  assert.match(indexHtml, /class="auth-secondary-actions"[\s\S]*id="authModeButton"/);
});

test("password recovery layer preserves hidden states and touch sizing", () => {
  const marker = organicCss.lastIndexOf("Password Recovery V83");
  assert.ok(marker > organicCss.lastIndexOf("Performance Pass V82"));
  const layer = organicCss.slice(marker);
  assert.match(layer, /\.auth-form\s+\[hidden\][\s\S]*display:\s*none\s*!important/);
  assert.match(layer, /\.auth-secondary-actions[\s\S]*display:\s*grid/);
  assert.match(layer, /\.auth-text-button[\s\S]*min-height:\s*44px/);
  assert.match(layer, /@media \(max-width:\s*520px\)[\s\S]*\.auth-panel/);
});

test("cloud source is available for later recovery wiring", () => {
  assert.match(cloudSync, /function setupCloudLedger/);
});
```

- [ ] **Step 2: Run the UI test and verify RED**

Run:

```bash
node --test tests/password-recovery-ui.test.mjs
```

Expected: the first two tests fail because the recovery controls and V83 layer do not exist; the cloud-source smoke test passes.

- [ ] **Step 3: Add the recovery fields and commands**

Replace the fields and secondary button inside `#authForm` in `index.html` with:

```html
<h2 id="authTitle">登录云端账本</h2>
<label id="authEmailField">
  <span>邮箱</span>
  <input id="authEmail" type="email" autocomplete="email" aria-describedby="authMessage" required />
</label>
<label id="authPasswordField">
  <span id="authPasswordLabel">密码</span>
  <input id="authPassword" type="password" autocomplete="current-password" minlength="8" aria-describedby="authMessage" required />
</label>
<label id="authConfirmPasswordField" hidden>
  <span>确认新密码</span>
  <input id="authConfirmPassword" type="password" autocomplete="new-password" minlength="8" aria-describedby="authMessage" disabled />
</label>
<p id="authMessage" class="auth-message" role="status" aria-live="polite"></p>
<button class="btn-primary" type="submit"><span id="authSubmitLabel">登录</span></button>
<div class="auth-secondary-actions">
  <button id="authForgotPasswordButton" class="auth-text-button" type="button">忘记密码？</button>
  <button id="authModeButton" class="btn-ghost auth-mode-button" type="button">没有账号，创建一个</button>
</div>
```

- [ ] **Step 4: Append the minimal V83 recovery styles**

Append to `organic-liquid.css` after V82:

```css
/* -- Password Recovery V83 -- */
html[data-ui="organic-v41"] .auth-form [hidden] {
  display: none !important;
}

html[data-ui="organic-v41"] .auth-secondary-actions {
  display: grid;
  justify-items: center;
  gap: 0.2rem;
}

html[data-ui="organic-v41"] .auth-text-button {
  min-height: 44px;
  padding: 0.35rem 0.5rem;
  border: 0;
  color: var(--accent-strong);
  background: transparent;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

html[data-ui="organic-v41"] .auth-text-button:hover,
html[data-ui="organic-v41"] .auth-text-button:focus-visible {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

html[data-ui="organic-v41"] .auth-form :is(button, input):disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@media (max-width: 520px) {
  html[data-ui="organic-v41"] .auth-panel {
    max-height: calc(100dvh - 2rem);
    overflow-y: auto;
  }
}
```

- [ ] **Step 5: Run the UI and existing layout tests**

Run:

```bash
node --test tests/password-recovery-ui.test.mjs tests/mobile-responsive-layout.test.mjs tests/performance-budget.test.mjs
git diff --check
```

Expected: all tests pass; existing V82 performance contracts remain unchanged.

- [ ] **Step 6: Commit the recovery UI**

```bash
git add index.html organic-liquid.css tests/password-recovery-ui.test.mjs
git commit -m "feat: add password recovery panel states"
```

### Task 3: Supabase Recovery Controller

**Files:**
- Modify: `cloud-sync.js:33-116`
- Modify: `cloud-sync.js:243-319`
- Modify: `tests/password-recovery-ui.test.mjs`

- [ ] **Step 1: Add failing Supabase-flow source contracts**

Append to `tests/password-recovery-ui.test.mjs`:

```js
test("cloud controller consumes the auth flow model", () => {
  assert.match(cloudSync, /const AuthFlowModel = window\.AuthFlowModel/);
  assert.match(cloudSync, /AuthFlowModel\.getAuthView\(mode\)/);
  assert.match(cloudSync, /AuthFlowModel\.isRecoveryLocation\(location\)/);
  assert.match(cloudSync, /AuthFlowModel\.getAuthEventAction\(event,/);
  assert.match(cloudSync, /modeChanged[\s\S]*authPassword\.value = ""[\s\S]*authConfirmPassword\.value = ""/);
});

test("reset request uses the current clean URL and privacy-safe message", () => {
  assert.match(cloudSync, /client\.auth\.resetPasswordForEmail\(email,\s*\{[\s\S]*redirectTo:\s*AuthFlowModel\.getRecoveryRedirect\(location\)/);
  assert.match(cloudSync, /AuthFlowModel\.RESET_SENT_MESSAGE/);
});

test("recovery update validates confirmation and updates the authenticated user", () => {
  assert.match(cloudSync, /AuthFlowModel\.validateNewPassword\(password,\s*confirmation\)/);
  assert.match(cloudSync, /client\.auth\.updateUser\(\{\s*password\s*\}\)/);
  assert.match(cloudSync, /window\.showToast\?\.\("密码已更新"\)/);
  assert.match(cloudSync, /await prepareLedger\(nextSession\)/);
});

test("recovery event is registered before initial session preparation", () => {
  const listenerIndex = cloudSync.indexOf("client.auth.onAuthStateChange");
  const sessionIndex = cloudSync.indexOf("client.auth.getSession()");
  assert.ok(listenerIndex > -1 && sessionIndex > listenerIndex);
  assert.match(cloudSync, /case "show-recovery"[\s\S]*showPasswordRecovery\(nextSession\)/);
  assert.match(cloudSync, /recoveryRedirectDetected[\s\S]*showPasswordRecovery\(data\.session\)/);
});

test("auth requests restore controls through finally", () => {
  assert.match(cloudSync, /async function runAuthRequest[\s\S]*try\s*\{[\s\S]*finally\s*\{\s*setAuthBusy\(false\)/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/password-recovery-ui.test.mjs
```

Expected: the five new tests fail because recovery behavior is not wired.

- [ ] **Step 3: Expand the auth state controller**

Near the existing authentication element lookups in `cloud-sync.js`, add:

```js
const AuthFlowModel = window.AuthFlowModel;
const authEmailField = document.querySelector("#authEmailField");
const authPasswordField = document.querySelector("#authPasswordField");
const authPasswordLabel = document.querySelector("#authPasswordLabel");
const authConfirmPasswordField = document.querySelector("#authConfirmPasswordField");
const authConfirmPassword = document.querySelector("#authConfirmPassword");
const authForgotPasswordButton = document.querySelector("#authForgotPasswordButton");
const recoveryRedirectDetected = AuthFlowModel.isRecoveryLocation(location);
```

Add `let recoverySession = null;` next to the existing `session` state.

Replace `setAuthMode()` and add the helpers below:

```js
function setFieldVisible(field, input, visible) {
  field.hidden = !visible;
  input.disabled = !visible;
  input.required = visible;
}

function setAuthMode(mode, { clearMessage = true } = {}) {
  const view = AuthFlowModel.getAuthView(mode);
  const modeChanged = authMode !== view.mode;
  if (modeChanged) {
    authPassword.value = "";
    authConfirmPassword.value = "";
  }
  authMode = view.mode;
  authTitle.textContent = view.title;
  authSubmitLabel.textContent = view.submitLabel;
  authModeButton.textContent = view.modeButtonLabel;
  authModeButton.hidden = !view.modeButtonVisible;
  authForgotPasswordButton.hidden = !view.forgotVisible;
  authPasswordLabel.textContent = authMode === "update-password" ? "新密码" : "密码";
  authPassword.autocomplete = view.passwordAutocomplete;
  setFieldVisible(authEmailField, authEmail, view.emailVisible);
  setFieldVisible(authPasswordField, authPassword, view.passwordVisible);
  setFieldVisible(authConfirmPasswordField, authConfirmPassword, view.confirmationVisible);
  if (!view.passwordVisible) authPassword.value = "";
  if (!view.confirmationVisible) authConfirmPassword.value = "";
  if (clearMessage) setAuthMessage("");
}

function setAuthBusy(busy) {
  authOverlay.setAttribute("aria-busy", String(busy));
  authForm.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
}

async function runAuthRequest(pendingMessage, operation) {
  setAuthBusy(true);
  setAuthMessage(pendingMessage);
  try {
    await operation();
  } catch (error) {
    setAuthMessage(error.message || "请求失败，请稍后重试。", "error");
  } finally {
    setAuthBusy(false);
  }
}

function showPasswordRecovery(nextSession) {
  session = nextSession;
  recoverySession = nextSession;
  document.documentElement.classList.add("cloud-auth-locked");
  authOverlay.hidden = false;
  accountOverlay.hidden = true;
  accountButton.hidden = true;
  setSyncState("attention", "正在重置密码");
  setAuthMode("update-password");
}
```

Replace `showSignedOut()` with the complete signed-out reset below. Do not change `prepareLedger()` or its ownership rules.

```js
function showSignedOut() {
  session = null;
  recoverySession = null;
  document.documentElement.classList.add("cloud-auth-locked");
  authOverlay.hidden = false;
  accountOverlay.hidden = true;
  accountButton.hidden = true;
  accountEmail.textContent = "未登录";
  setSyncState("signed-out", "未登录");
  setAuthMode("signin");
}
```

- [ ] **Step 4: Add reset-request and recovered-password submissions**

Add before the form submit listener:

```js
async function requestPasswordReset() {
  const email = authEmail.value.trim();
  const validationMessage = AuthFlowModel.validateResetEmail(email);
  if (validationMessage) {
    setAuthMessage(validationMessage, "error");
    return;
  }
  await runAuthRequest("正在发送重置邮件…", async () => {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: AuthFlowModel.getRecoveryRedirect(location),
    });
    if (error) throw error;
    setAuthMessage(AuthFlowModel.RESET_SENT_MESSAGE, "success");
  });
}

async function updateRecoveredPassword() {
  if (!recoverySession) {
    setAuthMessage("重置链接已失效，请重新发送重置邮件。", "error");
    return;
  }
  const password = authPassword.value;
  const confirmation = authConfirmPassword.value;
  const validationMessage = AuthFlowModel.validateNewPassword(password, confirmation);
  if (validationMessage) {
    setAuthMessage(validationMessage, "error");
    return;
  }
  await runAuthRequest("正在保存新密码…", async () => {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    const nextSession = recoverySession;
    recoverySession = null;
    authPassword.value = "";
    authConfirmPassword.value = "";
    setAuthMessage("");
    window.showToast?.("密码已更新");
    await prepareLedger(nextSession);
  });
}

async function submitCredentials() {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  const emailError = AuthFlowModel.validateResetEmail(email);
  if (emailError || password.length < 8) {
    setAuthMessage("请输入有效邮箱，密码至少 8 位。", "error");
    return;
  }
  const signingUp = authMode === "signup";
  await runAuthRequest(signingUp ? "正在创建账号…" : "正在登录…", async () => {
    const result = signingUp
      ? await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: AuthFlowModel.getRecoveryRedirect(location) },
        })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (signingUp && !result.data.session) {
      setAuthMessage("注册成功，请打开邮箱确认后再登录。", "success");
      return;
    }
    setAuthMessage("");
  });
}
```

Change the secondary handlers and submit dispatch to:

```js
authForgotPasswordButton?.addEventListener("click", () => setAuthMode("request-reset"));
authModeButton?.addEventListener("click", () => {
  const target = AuthFlowModel.getAuthView(authMode).modeButtonTarget;
  if (target) setAuthMode(target);
});

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authMode === "request-reset") {
    await requestPasswordReset();
    return;
  }
  if (authMode === "update-password") {
    await updateRecoveredPassword();
    return;
  }
  await submitCredentials();
});
```

- [ ] **Step 5: Register recovery events before `getSession()`**

Add this handler and register it immediately after client creation:

```js
function handleAuthStateChange(event, nextSession) {
  const action = AuthFlowModel.getAuthEventAction(event, {
    hasSession: Boolean(nextSession),
    recoveryActive: Boolean(recoverySession),
    userChanged: Boolean(nextSession && nextSession.user.id !== session?.user?.id),
  });
  switch (action) {
    case "show-recovery":
      showPasswordRecovery(nextSession);
      break;
    case "show-signed-out":
      showSignedOut();
      break;
    case "prepare-ledger":
      void prepareLedger(nextSession);
      break;
    case "refresh-recovery-session":
      session = nextSession;
      recoverySession = nextSession;
      break;
    case "refresh-session":
      session = nextSession;
      break;
    default:
      break;
  }
}

client.auth.onAuthStateChange(handleAuthStateChange);
const { data, error } = await client.auth.getSession();
if (error) setAuthMessage(error.message, "error");
if (recoverySession) return;
if (recoveryRedirectDetected && data?.session) showPasswordRecovery(data.session);
else if (data?.session) await prepareLedger(data.session);
else showSignedOut();
```

Remove the old listener below `getSession()`.

- [ ] **Step 6: Run focused and full JavaScript checks**

Run:

```bash
node --check auth-flow-model.js
node --check cloud-sync.js
node --test tests/auth-flow-model.test.cjs tests/password-recovery-ui.test.mjs
node --test tests/*.test.mjs tests/*.test.cjs
git diff --check
```

Expected: all focused and full tests pass; no syntax or whitespace errors.

- [ ] **Step 7: Commit the Supabase recovery controller**

```bash
git add cloud-sync.js tests/password-recovery-ui.test.mjs
git commit -m "feat: complete Supabase password recovery"
```

### Task 4: Cache Versions And Regression Contracts

**Files:**
- Modify: `index.html:16,767-772`
- Modify: `tests/password-recovery-ui.test.mjs`
- Modify: `tests/performance-budget.test.mjs`
- Modify: `tests/fee-visibility-ui.test.mjs`
- Modify: `tests/mobile-responsive-layout.test.mjs`
- Modify: `tests/dashboard-drawer-adaptation.test.mjs`

- [ ] **Step 1: Add failing script-order and cache-version tests**

Append to `tests/password-recovery-ui.test.mjs`:

```js
test("password recovery ships the v83 stylesheet", () => {
  assert.match(indexHtml, /organic-liquid\.css\?v=83/);
});

test("password recovery ships the v3 cloud controller", () => {
  const modelIndex = indexHtml.indexOf("auth-flow-model.js?v=1");
  const cloudIndex = indexHtml.indexOf("cloud-sync.js?v=3");
  assert.ok(modelIndex > -1 && cloudIndex > modelIndex);
});
```

Update the exact stylesheet URL expected by `tests/performance-budget.test.mjs` and the three existing layout suites from `v82` to `v83`. Do not change their V82 marker, selector, or performance-declaration expectations.

- [ ] **Step 2: Run affected tests and verify RED**

Run:

```bash
node --test tests/password-recovery-ui.test.mjs tests/performance-budget.test.mjs tests/fee-visibility-ui.test.mjs tests/mobile-responsive-layout.test.mjs tests/dashboard-drawer-adaptation.test.mjs
```

Expected: the two cache assertions fail because `index.html` still loads CSS `v82` and cloud sync `v2`; the existing auth-model order remains correct.

- [ ] **Step 3: Publish the fresh stylesheet and cloud controller**

Update `index.html`:

```html
<link rel="stylesheet" href="./organic-liquid.css?v=83" />
```

At the bottom, preserve the auth model ordering and update cloud sync to `v3`:

```html
<script src="./credit-account-model.js?v=1"></script>
<script src="./card-sort-model.js?v=1"></script>
<script src="./fee-visibility-model.js?v=1"></script>
<script src="./auth-flow-model.js?v=1"></script>
<script src="./app.js?v=74"></script>
<script src="./cloud-sync.js?v=3"></script>
```

- [ ] **Step 4: Run the complete regression suite**

Run:

```bash
node --check auth-flow-model.js
node --check app.js
node --check cloud-sync.js
node --check supabase-config.js
node --test tests/*.test.mjs tests/*.test.cjs
git diff --check
```

Expected: every test passes with `0` failures and all syntax checks exit `0`.

- [ ] **Step 5: Commit the cache wiring**

```bash
git add index.html tests/password-recovery-ui.test.mjs tests/performance-budget.test.mjs tests/fee-visibility-ui.test.mjs tests/mobile-responsive-layout.test.mjs tests/dashboard-drawer-adaptation.test.mjs
git commit -m "chore: publish password recovery assets"
```

### Task 5: Responsive And Supabase Verification

**Files:**
- Verify: `index.html`
- Verify: `organic-liquid.css`
- Verify: `auth-flow-model.js`
- Verify: `cloud-sync.js`

- [ ] **Step 1: Start or refresh the local preview**

Run from the feature worktree:

```bash
python3 -m http.server 8769 --bind 127.0.0.1
```

Expected: `http://127.0.0.1:8769/` serves the password-recovery branch. If the existing server is already running, reload it instead of starting a duplicate.

- [ ] **Step 2: Verify all four responsive viewports**

Use the browser viewport capability at:

```text
360x800
390x844
430x932
1440x900
```

For each viewport verify:

- no horizontal overflow;
- auth panel remains entirely reachable;
- visible buttons are at least 44px high on phone widths;
- sign-in and request-reset states have no overlap;
- input labels, messages, and buttons remain inside the panel;
- dark and light styles remain readable;
- browser console contains no errors.

- [ ] **Step 3: Verify local reset-request UI without transmitting an email**

Click `忘记密码？`, then confirm:

- title becomes `找回密码`;
- password fields are disabled and hidden;
- email remains visible;
- primary button says `发送重置邮件`;
- secondary button says `返回登录`;
- submitting an invalid email shows `请输入有效邮箱。` and makes no Supabase request.

Do not enter or transmit the user's real email without explicit confirmation at action time.

- [ ] **Step 4: Confirm Supabase redirect configuration with the user**

The user must ensure Supabase Authentication URL Configuration includes:

```text
https://credit-card-ledger.vercel.app/**
http://127.0.0.1:8769/**
```

Do not claim real email delivery or recovery-link success until the user has confirmed these URLs and explicitly participates in the reset-email test.

- [ ] **Step 5: Run fresh final verification**

Run:

```bash
node --check auth-flow-model.js
node --check app.js
node --check cloud-sync.js
node --check supabase-config.js
node --test tests/*.test.mjs tests/*.test.cjs
git diff --check
git status --short --branch
```

Expected: all syntax checks and tests pass; the worktree is clean on `codex/scroll-performance`.

- [ ] **Step 6: Perform final review**

Review the cumulative range from the design commit through `HEAD` for:

- authentication-event race conditions;
- account-enumeration leaks;
- password-field persistence;
- accidental ledger or synchronization changes;
- cache-version mismatches;
- mobile overflow and touch regressions;
- missing Supabase redirect prerequisites.

Do not push, merge, or deploy. Preserve the local branch for further user review.

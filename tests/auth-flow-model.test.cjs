const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const AuthFlowModel = require("../auth-flow-model.js");
const indexHtml = readFileSync(join(__dirname, "../index.html"), "utf8");

test("auth views expose the complete frozen approved states", () => {
  const expectedViews = {
    signin: {
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
    },
    signup: {
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
    },
    "request-reset": {
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
    },
    "update-password": {
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
    },
  };

  assert.equal(Object.isFrozen(AuthFlowModel), true);
  for (const [mode, expectedView] of Object.entries(expectedViews)) {
    const view = AuthFlowModel.getAuthView(mode);
    assert.deepEqual(view, expectedView, mode);
    assert.equal(Object.isFrozen(view), true, mode);
  }
  assert.strictEqual(AuthFlowModel.getAuthView("unknown"), AuthFlowModel.getAuthView("signin"));
  assert.strictEqual(AuthFlowModel.getAuthView("toString"), AuthFlowModel.getAuthView("signin"));
});

test("reset email validation accepts trimmed practical ASCII addresses", () => {
  const maxLengthEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;
  const validEmails = [
    " user@example.com ",
    "ledger+cloud@example.com",
    "o'connor@example.co.uk",
    "user.name@my-domain.example",
    `user@${"a".repeat(63)}.com`,
    maxLengthEmail,
  ];

  for (const email of validEmails) {
    assert.equal(AuthFlowModel.validateResetEmail(email), "", email);
  }
  assert.equal(AuthFlowModel.RESET_SENT_MESSAGE, "如果该邮箱已注册，重置邮件将发送到你的邮箱。");
});

test("reset email validation rejects malformed and over-limit addresses", () => {
  const overlongTotal = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`;
  const overlongDomain = `a@${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`;
  const invalidEmails = [
    "",
    "invalid",
    "user@@example.com",
    ".user@example.com",
    "user.@example.com",
    "user..name@example.com",
    `${"a".repeat(65)}@example.com`,
    "user name@example.com",
    "usér@example.com",
    "user@localhost",
    "user@.example.com",
    "user@example.com.",
    "user@example..com",
    "user@-example.com",
    "user@example-.com",
    `user@${"a".repeat(64)}.com`,
    overlongTotal,
    overlongDomain,
    "user@example.com\0",
    "user@exam\nple.com",
    "user@example.com\n",
    "\tuser@example.com",
    "user@example.com<script>",
  ];

  for (const email of invalidEmails) {
    assert.equal(AuthFlowModel.validateResetEmail(email), "请输入有效邮箱。", JSON.stringify(email));
  }
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

test("auth events follow the complete precedence matrix", () => {
  const cases = [
    {
      name: "password recovery takes precedence",
      event: "PASSWORD_RECOVERY",
      state: { hasSession: true, resetRequestComplete: true, recoveryActive: true, userChanged: true },
      expected: "show-recovery",
    },
    {
      name: "completed reset request holds on signed out",
      event: "SIGNED_OUT",
      state: { hasSession: false, resetRequestComplete: true, recoveryActive: false, userChanged: false },
      expected: "hold-reset-request",
    },
    {
      name: "completed reset request holds on another sessionless event",
      event: "INITIAL_SESSION",
      state: { hasSession: false, resetRequestComplete: true, recoveryActive: false, userChanged: false },
      expected: "hold-reset-request",
    },
    {
      name: "signed out takes precedence over active recovery",
      event: "SIGNED_OUT",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: true, userChanged: true },
      expected: "show-signed-out",
    },
    {
      name: "a normal sessionless event shows signed out",
      event: "INITIAL_SESSION",
      state: { hasSession: false, resetRequestComplete: false, recoveryActive: false, userChanged: false },
      expected: "show-signed-out",
    },
    {
      name: "signed in holds active recovery",
      event: "SIGNED_IN",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: true, userChanged: true },
      expected: "hold-recovery",
    },
    {
      name: "token refresh updates active recovery session",
      event: "TOKEN_REFRESHED",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: true, userChanged: false },
      expected: "refresh-recovery-session",
    },
    {
      name: "changed user signed in prepares the ledger",
      event: "SIGNED_IN",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: false, userChanged: true },
      expected: "prepare-ledger",
    },
    {
      name: "same user signed in does nothing",
      event: "SIGNED_IN",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: false, userChanged: false },
      expected: "none",
    },
    {
      name: "normal token refresh updates the session",
      event: "TOKEN_REFRESHED",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: false, userChanged: false },
      expected: "refresh-session",
    },
    {
      name: "unrelated event with a session does nothing",
      event: "USER_UPDATED",
      state: { hasSession: true, resetRequestComplete: false, recoveryActive: false, userChanged: true },
      expected: "none",
    },
  ];

  for (const { name, event, state, expected } of cases) {
    assert.equal(AuthFlowModel.getAuthEventAction(event, state), expected, name);
  }
});

test("auth model loads before the cloud controller", () => {
  const modelIndex = indexHtml.indexOf("auth-flow-model.js?v=1");
  const cloudIndex = indexHtml.indexOf("cloud-sync.js?v=2");
  assert.ok(modelIndex > -1 && cloudIndex > modelIndex);
});

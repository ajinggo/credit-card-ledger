(function initializeAuthFlowModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AuthFlowModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createAuthFlowModel() {
  const RESET_SENT_MESSAGE = "如果该邮箱已注册，重置邮件将发送到你的邮箱。";
  const INVALID_EMAIL_MESSAGE = "请输入有效邮箱。";
  const LOCAL_PART_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  const DOMAIN_LABEL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
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
    return Object.prototype.hasOwnProperty.call(AUTH_VIEWS, mode)
      ? AUTH_VIEWS[mode]
      : AUTH_VIEWS.signin;
  }

  function validateResetEmail(email) {
    const rawValue = String(email == null ? "" : email);
    if (/[\x00-\x1F\x7F]/.test(rawValue)) return INVALID_EMAIL_MESSAGE;

    const value = rawValue.trim();
    if (!value || value.length > 254 || /\s/.test(value)) {
      return INVALID_EMAIL_MESSAGE;
    }

    const atIndex = value.indexOf("@");
    if (atIndex < 1 || atIndex !== value.lastIndexOf("@")) return INVALID_EMAIL_MESSAGE;

    const localPart = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1);
    if (
      localPart.length > 64
      || domain.length > 253
      || !LOCAL_PART_PATTERN.test(localPart)
      || localPart.startsWith(".")
      || localPart.endsWith(".")
      || localPart.includes("..")
    ) {
      return INVALID_EMAIL_MESSAGE;
    }

    const domainLabels = domain.split(".");
    if (
      domainLabels.length < 2
      || domainLabels.some((label) => label.length > 63 || !DOMAIN_LABEL_PATTERN.test(label))
    ) {
      return INVALID_EMAIL_MESSAGE;
    }

    return "";
  }

  function validateNewPassword(password, confirmation) {
    if (String(password || "").length < 8) return "新密码至少需要 8 位。";
    if (password !== confirmation) return "两次输入的密码不一致。";
    return "";
  }

  function getRecoveryRedirect(locationLike) {
    return `${locationLike.origin}${locationLike.pathname}`;
  }

  function getRecoveryLocationState(locationLike) {
    const searchParams = new URLSearchParams(String(locationLike.search || "").replace(/^\?/, ""));
    const hashParams = new URLSearchParams(String(locationLike.hash || "").replace(/^#/, ""));
    if (
      searchParams.get("error_code") === "otp_expired"
      || hashParams.get("error_code") === "otp_expired"
    ) {
      return "expired";
    }
    if (searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery") {
      return "recovery";
    }
    return "none";
  }

  function isRecoveryLocation(locationLike) {
    return getRecoveryLocationState(locationLike) === "recovery";
  }

  function getAuthEventAction(event, state) {
    if (event === "PASSWORD_RECOVERY" && state.hasSession) return "show-recovery";
    if (state.recoveryErrorActive) return "hold-recovery-error";
    if (state.resetRequestComplete && !state.hasSession) return "hold-reset-request";
    if (event === "SIGNED_OUT") return "show-signed-out";
    if (state.recoveryActive) {
      if (!state.hasSession) return "hold-recovery";
      return event === "TOKEN_REFRESHED" ? "refresh-recovery-session" : "hold-recovery";
    }
    if (!state.hasSession) return "show-signed-out";
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
    getRecoveryLocationState,
    isRecoveryLocation,
    getAuthEventAction,
  });
});

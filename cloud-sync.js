(function setupCloudLedger() {
  const SUPABASE_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.2/dist/umd/supabase.js";
  const SUPABASE_LIBRARY_INTEGRITY = "sha384-yifgV8iFWyp5cgu+V1G1rtlEHpEErPlL5fTrkUELIsWq0CIVDON2WP/NlXVJT3vO";
  let supabaseLoadPromise = null;

  function loadSupabaseLibrary() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    if (supabaseLoadPromise) return supabaseLoadPromise;
    supabaseLoadPromise = new Promise((resolve, reject) => {
      const script = document.querySelector("script[data-supabase-client]") || document.createElement("script");
      const timeoutId = setTimeout(() => reject(new Error("登录组件加载超时，请检查网络后刷新。")), 15000);
      const complete = (callback) => {
        clearTimeout(timeoutId);
        callback();
      };
      script.addEventListener("load", () => complete(() => {
        if (window.supabase?.createClient) resolve(window.supabase);
        else reject(new Error("登录组件加载失败，请刷新后重试。"));
      }), { once: true });
      script.addEventListener("error", () => complete(() => reject(new Error("登录组件加载失败，请检查网络后刷新。"))), { once: true });
      if (!script.isConnected) {
        script.src = SUPABASE_LIBRARY_URL;
        script.async = true;
        script.integrity = SUPABASE_LIBRARY_INTEGRITY;
        script.crossOrigin = "anonymous";
        script.dataset.supabaseClient = "";
        document.head.append(script);
      }
    });
    return supabaseLoadPromise;
  }

  const config = window.SUPABASE_CONFIG || {};
  const configured = /^https:\/\/.+\.supabase\.co$/.test(config.url || "")
    && typeof config.publishableKey === "string"
    && config.publishableKey.length > 20;
  const AuthFlowModel = window.AuthFlowModel;

  const authOverlay = document.querySelector("#authOverlay");
  const authForm = document.querySelector("#authForm");
  const authTitle = document.querySelector("#authTitle");
  const authSubmitLabel = document.querySelector("#authSubmitLabel");
  const authModeButton = document.querySelector("#authModeButton");
  const authMessage = document.querySelector("#authMessage");
  const authEmailField = document.querySelector("#authEmailField");
  const authEmail = document.querySelector("#authEmail");
  const authPasswordField = document.querySelector("#authPasswordField");
  const authPasswordLabel = document.querySelector("#authPasswordLabel");
  const authPassword = document.querySelector("#authPassword");
  const authConfirmPasswordField = document.querySelector("#authConfirmPasswordField");
  const authConfirmPassword = document.querySelector("#authConfirmPassword");
  const authForgotPasswordButton = document.querySelector("#authForgotPasswordButton");
  const accountButton = document.querySelector("#accountButton");
  const accountOverlay = document.querySelector("#accountOverlay");
  const accountEmail = document.querySelector("#accountEmail");
  const syncState = document.querySelector("#cloudSyncState");
  const syncNowButton = document.querySelector("#syncNowButton");
  const uploadLocalButton = document.querySelector("#uploadLocalButton");
  const signOutButton = document.querySelector("#signOutButton");
  const closeAccountButton = document.querySelector("#closeAccountButton");
  const migrationOverlay = document.querySelector("#cloudMigrationOverlay");
  const useLocalButton = document.querySelector("#useLocalDataButton");
  const useCloudButton = document.querySelector("#useCloudDataButton");
  const footer = document.querySelector(".app-footer");

  let client = null;
  let session = null;
  let recoverySession = null;
  const recoveryLocationState = AuthFlowModel.getRecoveryLocationState(location);
  let recoveryRedirectPending = recoveryLocationState === "recovery";
  let recoveryRedirectErrorActive = recoveryLocationState === "expired";
  let resetRequestComplete = false;
  let authMode = "signin";
  let syncTimer = null;
  let syncing = false;
  let applyingRemote = false;
  let dirty = false;
  let lastRemoteUpdatedAt = "";
  let pendingRemoteRow = null;
  const CLOUD_OWNER_KEY = "pointsLedger_cloud_owner_v1";

  const emptySnapshot = () => ({
    format: "credit-card-ledger-cloud",
    version: 3,
    data: { cards: [], creditAccounts: [], bills: [], records: [], loyaltyAccounts: [], recentRates: [] },
    settings: { theme: document.documentElement.dataset.theme || "light", privacy: false, view: "cards", reminderReadIds: [] },
  });

  function setSyncState(state, label) {
    if (!syncState) return;
    syncState.dataset.state = state;
    syncState.textContent = label;
    accountButton?.setAttribute("data-sync-state", state);
    accountButton?.setAttribute("title", label);
  }

  function setAuthMessage(message, tone = "") {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.dataset.tone = tone;
  }

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
    if (authMode !== "request-reset") resetRequestComplete = false;
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
    if (clearMessage) setAuthMessage("");
  }

  function setAuthBusy(busy) {
    authOverlay.setAttribute("aria-busy", String(busy));
    authForm.querySelectorAll("button").forEach((button) => {
      button.disabled = busy;
    });
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

  function showSignedIn(nextSession) {
    session = nextSession;
    recoverySession = null;
    recoveryRedirectPending = false;
    recoveryRedirectErrorActive = false;
    resetRequestComplete = false;
    authOverlay.hidden = true;
    accountButton.hidden = false;
    accountEmail.textContent = session.user.email || "已登录用户";
  }

  function showPasswordRecovery(nextSession) {
    session = nextSession;
    recoverySession = nextSession;
    recoveryRedirectPending = false;
    recoveryRedirectErrorActive = false;
    resetRequestComplete = false;
    document.documentElement.classList.add("cloud-auth-locked");
    authOverlay.hidden = false;
    accountOverlay.hidden = true;
    accountButton.hidden = true;
    setSyncState("attention", "正在重置密码");
    setAuthMode("update-password");
  }

  async function readRemoteRow() {
    const { data, error } = await client
      .from("ledger_state")
      .select("data,schema_version,updated_at")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function pushSnapshot({ notify = false } = {}) {
    if (!session || syncing || applyingRemote || !window.ledgerStateApi) return false;
    syncing = true;
    dirty = false;
    clearTimeout(syncTimer);
    setSyncState("syncing", "正在同步");
    const updatedAt = new Date().toISOString();
    const payload = {
      user_id: session.user.id,
      data: window.ledgerStateApi.exportSnapshot(),
      schema_version: 3,
      updated_at: updatedAt,
    };
    const { data, error } = await client
      .from("ledger_state")
      .upsert(payload, { onConflict: "user_id" })
      .select("updated_at")
      .single();
    syncing = false;
    if (error) {
      dirty = true;
      setSyncState("error", "同步失败");
      if (notify) window.showToast?.(`云端同步失败：${error.message}`, "error");
      return false;
    }
    lastRemoteUpdatedAt = data?.updated_at || updatedAt;
    setSyncState("synced", "已同步");
    if (notify) window.showToast?.("云端数据已更新");
    return true;
  }

  function schedulePush() {
    if (!session || applyingRemote) return;
    dirty = true;
    setSyncState("pending", "等待同步");
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => pushSnapshot(), 900);
  }

  async function applyRemoteRow(row, { notify = false } = {}) {
    if (!row?.data || !window.ledgerStateApi) return;
    applyingRemote = true;
    try {
      window.ledgerStateApi.applySnapshot(row.data);
      lastRemoteUpdatedAt = row.updated_at || "";
      dirty = false;
      setSyncState("synced", "已同步");
      if (notify) window.showToast?.("已载入云端数据");
    } finally {
      applyingRemote = false;
    }
  }

  async function pullLatest({ notify = false } = {}) {
    if (!session || syncing) return;
    if (dirty) await pushSnapshot();
    if (dirty) return;
    setSyncState("syncing", "正在检查云端");
    try {
      const row = await readRemoteRow();
      if (!row) {
        await pushSnapshot({ notify });
        return;
      }
      if (!lastRemoteUpdatedAt || row.updated_at > lastRemoteUpdatedAt) {
        await applyRemoteRow(row, { notify });
      } else {
        setSyncState("synced", "已同步");
        if (notify) window.showToast?.("当前已经是最新数据");
      }
    } catch (error) {
      setSyncState("error", "同步失败");
      if (notify) window.showToast?.(`无法读取云端数据：${error.message}`, "error");
    }
  }

  async function prepareLedger(nextSession) {
    showSignedIn(nextSession);
    setSyncState("syncing", "正在读取云端");
    try {
      const row = await readRemoteRow();
      const hasLocal = window.ledgerStateApi?.hasMeaningfulData();
      const localOwner = localStorage.getItem(CLOUD_OWNER_KEY);
      if (localOwner && localOwner !== nextSession.user.id) {
        if (row) await applyRemoteRow(row);
        else {
          await applyRemoteRow({ data: emptySnapshot(), updated_at: "" });
          if (!(await pushSnapshot())) throw new Error("无法初始化当前账号的云端账本");
        }
        localStorage.setItem(CLOUD_OWNER_KEY, nextSession.user.id);
        localStorage.setItem(`pointsLedger_cloud_ready_${nextSession.user.id}`, "true");
        document.documentElement.classList.remove("cloud-auth-locked");
        return;
      }
      if (row && hasLocal && !localStorage.getItem(`pointsLedger_cloud_ready_${nextSession.user.id}`)) {
        pendingRemoteRow = row;
        migrationOverlay.hidden = false;
        setSyncState("attention", "请选择首次同步方式");
        return;
      }
      if (row) {
        await applyRemoteRow(row);
      } else {
        if (!(await pushSnapshot())) throw new Error("无法创建云端账本，请检查数据库权限");
      }
      localStorage.setItem(`pointsLedger_cloud_ready_${nextSession.user.id}`, "true");
      localStorage.setItem(CLOUD_OWNER_KEY, nextSession.user.id);
      document.documentElement.classList.remove("cloud-auth-locked");
    } catch (error) {
      setSyncState("error", "云端配置待完成");
      document.documentElement.classList.remove("cloud-auth-locked");
      window.showToast?.(`云端连接失败：${error.message}`, "error");
    }
  }

  function handleAuthStateChange(event, nextSession) {
    const redirectWasPending = recoveryRedirectPending;
    const action = AuthFlowModel.getAuthEventAction(event, {
      hasSession: Boolean(nextSession),
      recoveryActive: Boolean(recoverySession || recoveryRedirectPending),
      recoveryErrorActive: recoveryRedirectErrorActive,
      resetRequestComplete,
      userChanged: Boolean(nextSession && nextSession.user.id !== session?.user?.id),
    });
    switch (action) {
      case "show-recovery":
        showPasswordRecovery(nextSession);
        break;
      case "show-signed-out":
        showSignedOut();
        break;
      case "hold-reset-request":
        break;
      case "hold-recovery-error":
        break;
      case "hold-recovery":
        if (redirectWasPending && nextSession) showPasswordRecovery(nextSession);
        break;
      case "prepare-ledger":
        session = nextSession;
        setTimeout(() => { void prepareLedger(nextSession); }, 0);
        break;
      case "refresh-recovery-session":
        if (redirectWasPending && !recoverySession) showPasswordRecovery(nextSession);
        else {
          session = nextSession;
          recoverySession = nextSession;
        }
        break;
      case "refresh-session":
        session = nextSession;
        break;
      default:
        break;
    }
  }

  async function initialize() {
    if (!configured) {
      document.documentElement.classList.remove("cloud-configured", "cloud-auth-locked");
      accountButton.hidden = true;
      if (footer) footer.textContent = "数据仅保存在本机浏览器 · 可通过标题栏数据工具导出完整 JSON 备份";
      return;
    }
    authOverlay.hidden = false;
    setAuthBusy(true);
    setAuthMessage("正在连接云端…");
    try {
      await loadSupabaseLibrary();
    } catch (error) {
      showSignedOut();
      setAuthMessage(error.message, "error");
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
    setAuthMessage("");

    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { headers: { "X-Client-Info": "credit-card-ledger/1.0" } },
    });
    window.supabaseLedgerClient = client;
    if (footer) footer.textContent = "数据已启用 Supabase 云端同步 · 请定期导出 JSON 备份";

    client.auth.onAuthStateChange(handleAuthStateChange);
    const { data, error } = await client.auth.getSession();
    if (recoveryRedirectErrorActive) {
      showSignedOut();
      setAuthMessage("重置链接已失效，请重新发送重置邮件。", "error");
      return;
    }
    if (error) setAuthMessage(error.message, "error");
    if (recoverySession) return;
    if (recoveryRedirectPending) {
      if (data?.session) showPasswordRecovery(data.session);
      else {
        recoveryRedirectPending = false;
        showSignedOut();
        setAuthMessage("重置链接已失效，请重新发送重置邮件。", "error");
      }
      return;
    }
    if (data?.session) await prepareLedger(data.session);
    else showSignedOut();
  }

  async function requestPasswordReset() {
    const email = authEmail.value.trim();
    const validationMessage = AuthFlowModel.validateResetEmail(email);
    if (validationMessage) {
      setAuthMessage(validationMessage, "error");
      return;
    }
    resetRequestComplete = false;
    await runAuthRequest("正在发送重置邮件…", async () => {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: AuthFlowModel.getRecoveryRedirect(location),
      });
      if (error) throw error;
      resetRequestComplete = true;
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

  function dismissRecoveryRedirectError() {
    recoveryRedirectErrorActive = false;
  }

  authForgotPasswordButton?.addEventListener("click", () => {
    dismissRecoveryRedirectError();
    setAuthMode("request-reset");
  });
  authModeButton?.addEventListener("click", () => {
    dismissRecoveryRedirectError();
    const target = AuthFlowModel.getAuthView(authMode).modeButtonTarget;
    if (target) setAuthMode(target);
  });

  authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    dismissRecoveryRedirectError();
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

  accountButton?.addEventListener("click", () => { accountOverlay.hidden = false; });
  closeAccountButton?.addEventListener("click", () => { accountOverlay.hidden = true; });
  accountOverlay?.addEventListener("click", (event) => {
    if (event.target === accountOverlay) accountOverlay.hidden = true;
  });
  syncNowButton?.addEventListener("click", () => pullLatest({ notify: true }));
  uploadLocalButton?.addEventListener("click", () => pushSnapshot({ notify: true }));
  signOutButton?.addEventListener("click", async () => {
    if (dirty && !(await pushSnapshot({ notify: true }))) return;
    await client.auth.signOut();
  });

  useLocalButton?.addEventListener("click", async () => {
    migrationOverlay.hidden = true;
    pendingRemoteRow = null;
    if (!(await pushSnapshot({ notify: true }))) {
      migrationOverlay.hidden = false;
      return;
    }
    localStorage.setItem(`pointsLedger_cloud_ready_${session.user.id}`, "true");
    localStorage.setItem(CLOUD_OWNER_KEY, session.user.id);
    document.documentElement.classList.remove("cloud-auth-locked");
  });

  useCloudButton?.addEventListener("click", async () => {
    migrationOverlay.hidden = true;
    await applyRemoteRow(pendingRemoteRow, { notify: true });
    pendingRemoteRow = null;
    localStorage.setItem(`pointsLedger_cloud_ready_${session.user.id}`, "true");
    localStorage.setItem(CLOUD_OWNER_KEY, session.user.id);
    document.documentElement.classList.remove("cloud-auth-locked");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !accountOverlay.hidden) accountOverlay.hidden = true;
  });

  window.addEventListener("online", () => pullLatest());
  window.addEventListener("focus", () => {
    if (session && document.visibilityState === "visible") pullLatest();
  });

  window.ledgerCloud = { schedulePush, pullLatest, pushSnapshot, isConfigured: configured };
  setAuthMode("signin");
  initialize();
})();

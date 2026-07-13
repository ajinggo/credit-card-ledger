(function setupCloudLedger() {
  const config = window.SUPABASE_CONFIG || {};
  const configured = /^https:\/\/.+\.supabase\.co$/.test(config.url || "")
    && typeof config.publishableKey === "string"
    && config.publishableKey.length > 20;

  const authOverlay = document.querySelector("#authOverlay");
  const authForm = document.querySelector("#authForm");
  const authTitle = document.querySelector("#authTitle");
  const authSubmitLabel = document.querySelector("#authSubmitLabel");
  const authModeButton = document.querySelector("#authModeButton");
  const authMessage = document.querySelector("#authMessage");
  const authEmail = document.querySelector("#authEmail");
  const authPassword = document.querySelector("#authPassword");
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

  function setAuthMode(mode) {
    authMode = mode === "signup" ? "signup" : "signin";
    const signingUp = authMode === "signup";
    authTitle.textContent = signingUp ? "创建云端账本" : "登录云端账本";
    authSubmitLabel.textContent = signingUp ? "注册账号" : "登录";
    authModeButton.textContent = signingUp ? "已有账号，直接登录" : "没有账号，创建一个";
    authPassword.autocomplete = signingUp ? "new-password" : "current-password";
    setAuthMessage("");
  }

  function showSignedOut() {
    session = null;
    document.documentElement.classList.add("cloud-auth-locked");
    authOverlay.hidden = false;
    accountOverlay.hidden = true;
    accountButton.hidden = true;
    accountEmail.textContent = "未登录";
    setSyncState("signed-out", "未登录");
  }

  function showSignedIn(nextSession) {
    session = nextSession;
    authOverlay.hidden = true;
    accountButton.hidden = false;
    accountEmail.textContent = session.user.email || "已登录用户";
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

  async function initialize() {
    if (!configured) {
      document.documentElement.classList.remove("cloud-configured", "cloud-auth-locked");
      accountButton.hidden = true;
      if (footer) footer.textContent = "数据仅保存在本机浏览器 · 可通过标题栏数据工具导出完整 JSON 备份";
      return;
    }
    if (!window.supabase?.createClient) {
      showSignedOut();
      setAuthMessage("登录组件加载失败，请检查网络后刷新。", "error");
      return;
    }

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

    const { data, error } = await client.auth.getSession();
    if (error) setAuthMessage(error.message, "error");
    if (data?.session) await prepareLedger(data.session);
    else showSignedOut();

    client.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" || !nextSession) showSignedOut();
      else if (event === "SIGNED_IN" && nextSession.user.id !== session?.user?.id) prepareLedger(nextSession);
      else if (event === "TOKEN_REFRESHED") session = nextSession;
    });
  }

  authModeButton?.addEventListener("click", () => setAuthMode(authMode === "signin" ? "signup" : "signin"));

  authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || password.length < 8) {
      setAuthMessage("请输入有效邮箱，密码至少 8 位。", "error");
      return;
    }
    authForm.querySelector("button[type='submit']").disabled = true;
    setAuthMessage(authMode === "signup" ? "正在创建账号…" : "正在登录…");
    const result = authMode === "signup"
      ? await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}${location.pathname}` },
        })
      : await client.auth.signInWithPassword({ email, password });
    authForm.querySelector("button[type='submit']").disabled = false;
    if (result.error) {
      setAuthMessage(result.error.message, "error");
      return;
    }
    if (authMode === "signup" && !result.data.session) {
      setAuthMessage("注册成功，请打开邮箱确认后再登录。", "success");
      return;
    }
    setAuthMessage("");
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

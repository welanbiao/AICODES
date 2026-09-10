import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminResetPassword,
  fetchMe,
  loadAuthSession,
  loginAccount,
  logoutAccount,
  saveAuthSession,
  type AuthSession,
  type AuthUser,
} from "./api";

type AuthUiHandlers = {
  onSession: (session: AuthSession | null) => void;
};

function $(sel: string) {
  return document.querySelector(sel) as HTMLElement | null;
}

export class AuthUi {
  private session: AuthSession | null = null;
  private handlers: AuthUiHandlers;

  constructor(handlers: AuthUiHandlers) {
    this.handlers = handlers;
    this.bind();
    void this.restore();
  }

  getSession() {
    return this.session;
  }

  private bind() {
    $('[data-testid="btn-login"]')?.addEventListener("click", () => this.openLogin());
    $('[data-testid="btn-logout"]')?.addEventListener("click", () => void this.logout());
    $('[data-testid="btn-admin"]')?.addEventListener("click", () => this.toggleAdmin());
    $('[data-testid="btn-login-close"]')?.addEventListener("click", () => this.closeLogin());
    $('[data-testid="btn-login-submit"]')?.addEventListener("click", () => void this.submitLogin());
    $('[data-testid="btn-admin-close"]')?.addEventListener("click", () => this.closeAdmin());
    $('[data-testid="btn-admin-create"]')?.addEventListener("click", () => void this.createUser());
    const pass = document.querySelector('[data-testid="login-password"]') as HTMLInputElement | null;
    pass?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void this.submitLogin();
    });
  }

  private async restore() {
    const saved = loadAuthSession();
    if (!saved) {
      this.applySession(null);
      return;
    }
    try {
      const user = await fetchMe(saved.token);
      this.applySession({ token: saved.token, user });
    } catch {
      saveAuthSession(null);
      this.applySession(null);
    }
  }

  private applySession(session: AuthSession | null) {
    this.session = session;
    saveAuthSession(session);
    const chip = $('[data-testid="user-chip"]');
    const btnLogin = $('[data-testid="btn-login"]') as HTMLButtonElement | null;
    const btnLogout = $('[data-testid="btn-logout"]') as HTMLButtonElement | null;
    const btnAdmin = $('[data-testid="btn-admin"]') as HTMLButtonElement | null;
    if (chip) chip.textContent = session ? `${session.user.nickname}` : "未登录";
    if (btnLogin) btnLogin.hidden = !!session;
    if (btnLogout) btnLogout.hidden = !session;
    if (btnAdmin) btnAdmin.hidden = !(session?.user.isAdmin || session?.user.role === "admin");
    this.handlers.onSession(session);
  }

  openLogin() {
    const el = $('[data-testid="login-modal"]');
    if (el) el.hidden = false;
    const err = $('[data-testid="login-error"]');
    if (err) err.textContent = "";
  }

  closeLogin() {
    const el = $('[data-testid="login-modal"]');
    if (el) el.hidden = true;
  }

  private async submitLogin() {
    const userEl = document.querySelector('[data-testid="login-username"]') as HTMLInputElement | null;
    const passEl = document.querySelector('[data-testid="login-password"]') as HTMLInputElement | null;
    const err = $('[data-testid="login-error"]');
    const btn = $('[data-testid="btn-login-submit"]') as HTMLButtonElement | null;
    const username = userEl?.value.trim() || "";
    const password = passEl?.value || "";
    if (err) err.textContent = "";
    if (btn) btn.disabled = true;
    try {
      const session = await loginAccount(username, password);
      this.applySession(session);
      this.closeLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "登录失败";
      if (err) err.textContent = /fetch|network|Failed/i.test(msg) ? "无法连接服务器，请先运行 npm run server" : msg;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  private async logout() {
    if (this.session) await logoutAccount(this.session.token);
    this.applySession(null);
    this.closeAdmin();
  }

  private toggleAdmin() {
    const el = $('[data-testid="admin-modal"]');
    if (!el) return;
    if (el.hidden) {
      el.hidden = false;
      void this.reloadAdmin();
    } else el.hidden = true;
  }

  closeAdmin() {
    const el = $('[data-testid="admin-modal"]');
    if (el) el.hidden = true;
  }

  private async reloadAdmin() {
    if (!this.session) return;
    const list = $('[data-testid="admin-user-list"]');
    const err = $('[data-testid="admin-error"]');
    if (err) err.textContent = "";
    try {
      const users = await adminListUsers(this.session.token);
      if (!list) return;
      list.innerHTML = "";
      for (const u of users) {
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = `${u.username} · ${u.nickname}${u.isAdmin || u.role === "admin" ? " · 管理员" : ""}`;
        li.appendChild(label);
        if (!(u.isAdmin || u.role === "admin")) {
          const ops = document.createElement("span");
          ops.className = "admin-ops";
          const reset = document.createElement("button");
          reset.type = "button";
          reset.textContent = "重置密码";
          reset.onclick = () => void this.resetPassword(u);
          const del = document.createElement("button");
          del.type = "button";
          del.textContent = "删除";
          del.onclick = () => void this.removeUser(u);
          ops.append(reset, del);
          li.appendChild(ops);
        }
        list.appendChild(li);
      }
    } catch (e) {
      if (err) err.textContent = e instanceof Error ? e.message : "加载失败";
    }
  }

  private async createUser() {
    if (!this.session) return;
    const userEl = document.querySelector('[data-testid="admin-username"]') as HTMLInputElement | null;
    const passEl = document.querySelector('[data-testid="admin-password"]') as HTMLInputElement | null;
    const nickEl = document.querySelector('[data-testid="admin-nickname"]') as HTMLInputElement | null;
    const err = $('[data-testid="admin-error"]');
    const tip = $('[data-testid="admin-tip"]');
    try {
      await adminCreateUser(
        this.session.token,
        userEl?.value.trim() || "",
        passEl?.value || "",
        nickEl?.value.trim() || userEl?.value.trim() || "",
      );
      if (userEl) userEl.value = "";
      if (passEl) passEl.value = "";
      if (nickEl) nickEl.value = "";
      if (tip) tip.textContent = "账号已创建";
      if (err) err.textContent = "";
      await this.reloadAdmin();
    } catch (e) {
      if (err) err.textContent = e instanceof Error ? e.message : "创建失败";
    }
  }

  private async resetPassword(u: AuthUser) {
    if (!this.session) return;
    const pwd = window.prompt(`为 ${u.username} 设置新密码（至少6位）`);
    if (!pwd || pwd.length < 6) return;
    const err = $('[data-testid="admin-error"]');
    const tip = $('[data-testid="admin-tip"]');
    try {
      await adminResetPassword(this.session.token, u.id, pwd);
      if (tip) tip.textContent = "密码已重置";
      if (err) err.textContent = "";
    } catch (e) {
      if (err) err.textContent = e instanceof Error ? e.message : "重置失败";
    }
  }

  private async removeUser(u: AuthUser) {
    if (!this.session) return;
    if (!window.confirm(`删除账号 ${u.username}？`)) return;
    const err = $('[data-testid="admin-error"]');
    try {
      await adminDeleteUser(this.session.token, u.id);
      if (err) err.textContent = "";
      await this.reloadAdmin();
    } catch (e) {
      if (err) err.textContent = e instanceof Error ? e.message : "删除失败";
    }
  }
}

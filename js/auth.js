/**
 * auth.js — Authentication for SuperMall v2
 */
const Auth = (() => {
  const DEMO_USERS = [
    { uid:"admin_001", email:"admin@mall.com", password:"Admin@123", role:"admin", name:"Mall Admin" },
    { uid:"user_001",  email:"user@mall.com",  password:"User@123",  role:"user",  name:"Shopper" }
  ];

  const getSession  = () => { try { return JSON.parse(sessionStorage.getItem("sm_session") || "null"); } catch { return null; } };
  const setSession  = u  => sessionStorage.setItem("sm_session", JSON.stringify(u));
  const clearSession = () => sessionStorage.removeItem("sm_session");

  const currentUser = () => getSession();
  const isLoggedIn  = () => getSession() !== null;
  const isAdmin     = () => { const u = getSession(); return u && u.role === "admin"; };

  function getRootPath() {
    const p = window.location.pathname;
    return (p.includes("/admin/") || p.includes("/user/")) ? "../" : "./";
  }

  async function login(email, password) {
    Logger.info("auth", "Login attempt", { email });
    if (DEMO_MODE) {
      const user = DEMO_USERS.find(u => u.email === email && u.password === password);
      if (!user) { Logger.warn("auth","Login failed",{email}); throw new Error("Invalid email or password."); }
      const session = { uid:user.uid, email:user.email, role:user.role, name:user.name };
      setSession(session);
      Logger.info("auth","Login OK (demo)",{email,role:user.role});
      return session;
    }
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const snap = await db.collection("users").doc(cred.user.uid).get();
    const role = snap.exists ? snap.data().role : "user";
    const name = snap.exists ? snap.data().name : email;
    const session = { uid:cred.user.uid, email, role, name };
    setSession(session);
    Logger.info("auth","Login OK (firebase)",{email,role});
    return session;
  }

  async function logout() {
    Logger.info("auth","Logout",{user:getSession()?.email});
    clearSession();
    if (!DEMO_MODE) { try { await auth.signOut(); } catch(_){} }
    window.location.href = getRootPath() + "index.html";
  }

  function requireAuth(requiredRole = null) {
    const user = getSession();
    if (!user) { window.location.href = getRootPath() + "index.html"; return false; }
    if (requiredRole && user.role !== requiredRole) { window.location.href = getRootPath() + "index.html"; return false; }
    return true;
  }

  function initNav() {
    const user = getSession();
    if (!user) return;
    const el = document.getElementById("nav-user");
    if (el) el.textContent = `👤 ${user.name}`;
    const lo = document.getElementById("nav-logout");
    if (lo) lo.addEventListener("click", () => logout());
  }

  return { login, logout, currentUser, isLoggedIn, isAdmin, requireAuth, initNav };
})();

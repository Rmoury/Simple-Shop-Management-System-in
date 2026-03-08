/**
 * logger.js — Centralized logging for SuperMall v2
 * Levels: DEBUG | INFO | WARN | ERROR
 */
const Logger = (() => {
  const store = [];
  const MAX = 200;
  const STYLES = {
    DEBUG: "color:#888;",
    INFO:  "color:#4fc3f7;font-weight:bold;",
    WARN:  "color:#ffb74d;font-weight:bold;",
    ERROR: "color:#ef5350;font-weight:bold;"
  };
  function _log(level, module, message, data = null) {
    const entry = { timestamp: new Date().toISOString(), level, module, message, data };
    store.push(entry);
    if (store.length > MAX) store.shift();
    const prefix = `%c[${level}] [${module}] ${entry.timestamp}`;
    data ? console.log(prefix, STYLES[level], message, data) : console.log(prefix, STYLES[level], message);
    try { sessionStorage.setItem("supermall_logs", JSON.stringify(store.slice(-50))); } catch (_) {}
  }
  return {
    debug: (m, msg, d) => _log("DEBUG", m, msg, d),
    info:  (m, msg, d) => _log("INFO",  m, msg, d),
    warn:  (m, msg, d) => _log("WARN",  m, msg, d),
    error: (m, msg, d) => _log("ERROR", m, msg, d),
    getLogs: () => [...store]
  };
})();

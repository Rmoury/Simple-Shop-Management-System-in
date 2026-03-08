/**
 * ui.js — Shared UI helpers for SuperMall v2
 * Includes: Toast, Modal, Table, Cards, Badges, Image helpers
 */
const UI = (() => {

  // ── Toast ─────────────────────────────────────────────────
  function toast(message, type = "info") {
    let c = document.getElementById("toast-container");
    if (!c) { c = document.createElement("div"); c.id = "toast-container"; document.body.appendChild(c); }
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.innerHTML = message;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add("toast-show"));
    setTimeout(() => { t.classList.remove("toast-show"); setTimeout(() => t.remove(), 400); }, 3500);
    Logger.info("ui", `Toast [${type}]: ${message}`);
  }

  // ── Modal ─────────────────────────────────────────────────
  function modal({ title, body, onConfirm, confirmText="Confirm", cancelText="Cancel", danger=false, wide=false }) {
    document.getElementById("sm-modal")?.remove();
    const m = document.createElement("div");
    m.id = "sm-modal";
    m.className = "modal-overlay";
    m.innerHTML = `<div class="modal-box${wide?' modal-wide':''}">
      <div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close" id="mc">✕</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="mcancel">${cancelText}</button>
        <button class="btn ${danger?'btn-danger':'btn-primary'}" id="mconfirm">${confirmText}</button>
      </div></div>`;
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add("modal-show"));
    const close = () => { m.classList.remove("modal-show"); setTimeout(() => m.remove(), 300); };
    document.getElementById("mc").onclick = close;
    document.getElementById("mcancel").onclick = close;
    document.getElementById("mconfirm").onclick = () => { close(); if (onConfirm) onConfirm(); };
    m.addEventListener("click", e => { if (e.target === m) close(); });
    return { close };
  }

  function confirm(msg, onConfirm) {
    modal({ title:"Confirm Delete", body:`<p>${msg}</p>`, onConfirm, confirmText:"Yes, Delete", danger:true });
  }

  // ── Table ─────────────────────────────────────────────────
  function buildTable(containerId, columns, rows, actions = []) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!rows.length) { el.innerHTML = `<div class="empty-state"><span>📭</span><p>No records found.</p></div>`; return; }
    const hdr = columns.map(c => `<th>${c.label}</th>`).join("") + (actions.length ? "<th>Actions</th>" : "");
    const body = rows.map(row => {
      const cells = columns.map(c => `<td>${c.render ? c.render(row) : (row[c.key] ?? "—")}</td>`).join("");
      const acts  = actions.map(a => `<button class="btn-action ${a.className||''}" onclick="${a.fn}('${row.id}')">${a.icon||""} ${a.label}</button>`).join("");
      return `<tr>${cells}${actions.length ? `<td class="actions-cell">${acts}</td>` : ""}</tr>`;
    }).join("");
    el.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr>${hdr}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function buildCards(containerId, items, renderFn) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!items.length) { el.innerHTML = `<div class="empty-state"><span>📭</span><p>No items found.</p></div>`; return; }
    el.innerHTML = `<div class="card-grid">${items.map(renderFn).join("")}</div>`;
  }

  // ── Image helpers ─────────────────────────────────────────
  /**
   * Returns an <img> tag with a gradient fallback if image fails.
   * Also handles emoji-only images gracefully.
   */
  function productImg(src, alt = "", cssClass = "prod-img") {
    if (!src) return `<div class="img-placeholder">🛍️</div>`;
    // If it's just an emoji (length ≤ 2 or emoji check)
    if ([...src].length <= 2 && src.match(/\p{Emoji}/u)) {
      return `<div class="img-placeholder">${src}</div>`;
    }
    return `<img src="${src}" alt="${alt}" class="${cssClass}" loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <div class="img-placeholder" style="display:none">🛍️</div>`;
  }

  function shopImg(src, name = "") {
    if (!src) return `<div class="shop-img-placeholder">${name.charAt(0)||"🏪"}</div>`;
    return `<img src="${src}" alt="${name}" class="shop-card-img" loading="lazy"
              onerror="this.outerHTML='<div class=\\'shop-img-placeholder\\'>${name.charAt(0)||"🏪"}</div>'" />`;
  }

  // ── Badges / Helpers ──────────────────────────────────────
  function badge(text, type = "default")    { return `<span class="badge badge-${type}">${text}</span>`; }
  function statusBadge(active)              { return badge(active ? "Active" : "Inactive", active ? "success" : "danger"); }
  function currency(n)                      { return "₹" + Number(n).toLocaleString("en-IN"); }
  function stars(rating)                    {
    const full = Math.floor(rating), half = rating % 1 >= 0.5;
    return `<span class="stars">${"★".repeat(full)}${half?"½":""}${"☆".repeat(5-full-(half?1:0))}</span><span class="rating-num">${rating}</span>`;
  }
  function discount(price, dprice)          {
    if (!dprice || dprice >= price) return "";
    return badge(Math.round((1 - dprice/price)*100) + "% OFF", "discount");
  }

  // ── Cart badge counter ────────────────────────────────────
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem("sm_cart") || "[]");
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll(".cart-badge").forEach(el => {
      el.textContent = total;
      el.style.display = total > 0 ? "flex" : "none";
    });
  }

  return { toast, modal, confirm, buildTable, buildCards, productImg, shopImg, badge, statusBadge, currency, stars, discount, updateCartBadge };
})();

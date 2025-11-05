let SERVICE_PRICES = {};

// Fetch prices dynamically
async function fetchPrices() {
  try {
    const res = await fetch(`${GAS_URL}?action=get_prices`);
    SERVICE_PRICES = await res.json();
    console.log('Prices fetched:', SERVICE_PRICES);
  } catch (err) {
    showToast('Price fetch failed', 'error');
  }
}

// Auto calculate total price
function calculateTotal(type, serviceKey, quantity=1) {
  if(!SERVICE_PRICES[type] || !SERVICE_PRICES[type][serviceKey]) return 0;
  return SERVICE_PRICES[type][serviceKey].price * quantity;
}

// Pure JS Toast System
function showToast(message, type='info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
             }

/* script.js — Easy Recharge MM
   Universal frontend logic for all pages (pure JS + CSS toast system).
   Works with Google Apps Script backend via google.script.run when available,
   and falls back to fetch() to a deployed Web App URL (GAS_URL).
*/

/* === CONFIG === */
const GAS_URL = "https://script.google.com/macros/s/AKfycbwzU-EYsX5f0H_u6edzqZ5tWyNo1wTxq5sNKAW1QalTub2Bs7Okty8TeyWwbTHg1GnOxg/exec"; // <--- replace when using fetch fallback
const ADMIN_PHONE = "09-791134603"; // shown in forms (kept in sync with Code.gs CONFIG)
const TOAST_AUTO_CLOSE_MS = 4000;

/* === Utility: DOM helpers === */
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const el = (tag, attrs = {}, children = []) => {
  const d = document.createElement(tag);
  for (const k in attrs) {
    if (k === "text") d.textContent = attrs[k];
    else if (k === "html") d.innerHTML = attrs[k];
    else d.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (!c) return;
    if (typeof c === "string") d.appendChild(document.createTextNode(c));
    else d.appendChild(c);
  });
  return d;
};

/* === Insert minimal toast CSS (ensures toasts work even without style.css) === */
(function injectToastCSS() {
  const css = `
  .erm-toast-container{position:fixed;right:16px;top:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .erm-toast{min-width:220px;max-width:360px;padding:12px 14px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.12);background:#111;color:#fff;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;pointer-events:auto;opacity:0;transform:translateY(-6px);transition:all .22s ease}
  .erm-toast.show{opacity:1;transform:translateY(0)}
  .erm-toast.success{background:linear-gradient(90deg,#059669,#10b981)}
  .erm-toast.error{background:linear-gradient(90deg,#ef4444,#f97316)}
  .erm-toast.info{background:linear-gradient(90deg,#2563eb,#60a5fa)}
  .erm-toast .title{font-weight:600;margin-bottom:4px}
  .erm-toast .msg{font-size:13px;opacity:.95}
  .erm-loader{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.25);border-top-color:rgba(255,255,255,.9);border-radius:50%;animation:erm-spin .8s linear infinite;margin-left:8px;vertical-align:middle}
  @keyframes erm-spin{to{transform:rotate(360deg)}}
  `;
  const s = document.createElement("style");
  s.innerHTML = css;
  document.head.appendChild(s);
})();

/* === Toast System === */
const toastContainer = (() => {
  let c = document.querySelector(".erm-toast-container");
  if (!c) {
    c = document.createElement("div");
    c.className = "erm-toast-container";
    document.body.appendChild(c);
  }
  return c;
})();

function showNotification(title, message = "", type = "info", autoClose = true) {
  const t = el("div", { class: `erm-toast ${type}` }, [
    el("div", { class: "title", text: title }),
    el("div", { class: "msg", text: message })
  ]);
  toastContainer.appendChild(t);
  // show
  requestAnimationFrame(() => t.classList.add("show"));
  if (autoClose) {
    const tid = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, TOAST_AUTO_CLOSE_MS);
    t.addEventListener("mouseenter", () => clearTimeout(tid));
  }
  return t;
}

/* === Helper: spinner for a button === */
function attachButtonLoading(button, { start = true, textWhenLoading = "Processing..." } = {}) {
  if (!button) return;
  if (start) {
    button.disabled = true;
    button._origHTML = button.innerHTML;
    const loader = '<span class="erm-loader" aria-hidden="true"></span>';
    button.innerHTML = `${textWhenLoading} ${loader}`;
  } else {
    button.disabled = false;
    if (button._origHTML) button.innerHTML = button._origHTML;
  }
}

/* === Safe JSON parse/stringify helpers === */
function safeParseJSON(s, fallback = null) {
  try { return JSON.parse(s); } catch (e) { return fallback; }
}
function safeStringify(v) {
  try { return JSON.stringify(v); } catch (e) { return String(v); }
}

/* === Backend bridge: prefer google.script.run, fallback to fetch to GAS_URL === */
const backend = {
  call: function (funcName, payload = {}, onSuccess = () => {}, onFailure = (err) => {}) {
    // If page is served by Apps Script and google.script.run is available, use it.
    const gsr = window.google && window.google.script && window.google.script.run;
    if (gsr) {
      try {
        // google.script.run supports chaining withSuccessHandler and withFailureHandler
        // Use bracket notation to call dynamic function name if available.
        const runner = window.google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onFailure);
        // call server function (functions defined in Code.gs). Expect server to return an object.
        // Some deployments require primitive args; we'll send a single object argument if function expects.
        // We attempt to call by name using bracket notation.
        runner[funcName] ? runner[funcName](payload) : onFailure(`Server function "${funcName}" not found`);
      } catch (err) {
        onFailure(err);
      }
      return;
    }

    // Fallback: use fetch to GAS_URL (doPost-based Code.gs). Pass action in payload.
    if (!GAS_URL || GAS_URL.includes("YOUR_SCRIPT_ID")) {
      onFailure("GAS_URL not configured for fetch fallback. Provide deployed script URL.");
      return;
    }

    const body = safeStringify(payload && typeof payload === "object" ? Object.assign({}, payload, { action: payload.action || funcName }) : { action: funcName, data: payload });

    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    })
      .then(res => res.json())
      .then(json => {
        if (json && json.success === false) onFailure(json);
        else onSuccess(json);
      })
      .catch(err => onFailure(err));
  },

  get: function (params = {}, onSuccess = () => {}, onFailure = (err) => {}) {
    const gsr = window.google && window.google.script && window.google.script.run;
    if (gsr) {
      // if there's a getStats / getOrders server function, call it via google.script.run
      if (params._func && typeof params._func === "string") {
        const fn = params._func;
        delete params._func;
        window.google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onFailure)[fn](params);
        return;
      }
      onFailure("google.script.run available but no _func specified for get()");
      return;
    }

    // fallback fetch GET with query params
    if (!GAS_URL || GAS_URL.includes("YOUR_SCRIPT_ID")) {
      onFailure("GAS_URL not configured for fetch fallback. Provide deployed script URL.");
      return;
    }
    const q = new URL(GAS_URL);
    Object.keys(params).forEach(k => q.searchParams.set(k, params[k]));
    fetch(q.toString(), { method: "GET" })
      .then(res => res.json())
      .then(json => onSuccess(json))
      .catch(err => onFailure(err));
  }
};

/* === Price helpers (expects SERVICE_PRICES global from price.js) === */
function lookupPrice(category, key) {
  try {
    if (window.SERVICE_PRICES && SERVICE_PRICES[category] && SERVICE_PRICES[category][key]) {
      return Number(SERVICE_PRICES[category][key].price || 0);
    }
    return 0;
  } catch (e) { return 0; }
}
function lookupName(category, key) {
  try {
    if (window.SERVICE_PRICES && SERVICE_PRICES[category] && SERVICE_PRICES[category][key]) {
      return SERVICE_PRICES[category][key].name || key;
    }
    return key;
  } catch (e) { return key; }
}

/* === Form helpers & validation === */
function validateSimForm(data) {
  if (!data.phone || !/^\d{7,15}$/.test(data.phone.replace(/\s|\+|-|\(|\)/g, ""))) return "Enter a valid phone number.";
  if (!data.service) return "Please select a data package.";
  if (!data.transactionId) return "Please enter the transaction ID after payment.";
  return null;
}
function validateGameForm(data) {
  if (!data.game) return "Please select a game.";
  if (!data.gameId) return "Please enter your Game ID.";
  if (!data.service) return "Please select a game package.";
  if (!data.transactionId) return "Please enter the transaction ID after payment.";
  return null;
}
function validateSmmForm(data) {
  if (!data.platform) return "Please select a platform.";
  if (!data.service) return "Please select a service.";
  if (!data.targetLink || !/^https?:\/\//i.test(data.targetLink)) return "Please enter a valid target URL (include http:// or https://).";
  if (!data.quantity || Number(data.quantity) < 25) return "Quantity must be at least 25.";
  if (!data.transactionId) return "Please enter the transaction ID after payment.";
  return null;
}
function validateP2PForm(data) {
  if (!data.fromMethod) return "Select the source payment method.";
  if (!data.toMethod) return "Select the destination payment method.";
  if (data.fromMethod === data.toMethod) return "From and To methods must be different.";
  if (!data.amount || Number(data.amount) <= 0) return "Enter a valid amount.";
  if (!data.transactionId) return "Please enter the transaction ID after payment.";
  return null;
}

/* === Admin functions: update order status — calls server-side function 'updateOrderStatus' if present === */
function updateOrderStatus(orderId, sheetName, newStatus, onDone = () => {}) {
  const payload = { orderId, sheetName, newStatus, action: 'update_order_status' };
  backend.call('updateOrderStatus', payload, res => {
    showNotification("Updated", `Order ${orderId} set to ${newStatus}`, "success");
    onDone(null, res);
  }, err => {
    console.error("updateOrderStatus error", err);
    showNotification("Update failed", String(err), "error");
    onDone(err);
  });
}

/* === Submitters for each form type === */
function submitSimOrder(formEl) {
  const btn = formEl.querySelector("button[type=submit]");
  attachButtonLoading(btn, { start: true, textWhenLoading: "Submitting order..." });

  const data = {
    action: 'submit_sim_order',
    userId: formEl.querySelector("[name=userId]")?.value || 'Guest',
    phone: (formEl.querySelector("[name=phone]")?.value || "").trim(),
    service: formEl.querySelector("[name=service]")?.value || "",
    serviceName: lookupName('sim', formEl.querySelector("[name=service]")?.value || ""),
    quantity: Number(formEl.querySelector("[name=quantity]")?.value || 1),
    total: Number(formEl.querySelector("[name=total]")?.value || 0),
    payment: formEl.querySelector("[name=payment]")?.value || "Unknown",
    transactionId: (formEl.querySelector("[name=transactionId]")?.value || "").trim()
  };

  const invalid = validateSimForm(data);
  if (invalid) {
    attachButtonLoading(btn, { start: false });
    showNotification("Validation error", invalid, "error");
    return;
  }

  backend.call('submitSimOrder', data, res => {
    attachButtonLoading(btn, { start: false });
    if (res && res.success) {
      showNotification("Order submitted", `Order ID: ${res.orderId}`, "success");
      formEl.reset();
      // allow UI to update totals
      setTimeout(() => updateStatsAndRecent(), 800);
    } else {
      showNotification("Submission failed", safeStringify(res), "error");
    }
  }, err => {
    attachButtonLoading(btn, { start: false });
    showNotification("Submission failed", String(err), "error");
  });
}

function submitGameOrder(formEl) {
  const btn = formEl.querySelector("button[type=submit]");
  attachButtonLoading(btn, { start: true, textWhenLoading: "Submitting game order..." });

  const data = {
    action: 'submit_game_order',
    userId: formEl.querySelector("[name=userId]")?.value || 'Guest',
    game: formEl.querySelector("[name=game]")?.value || "",
    gameName: lookupName('game', formEl.querySelector("[name=game]")?.value || ""),
    gameId: (formEl.querySelector("[name=gameId]")?.value || "").trim(),
    server: (formEl.querySelector("[name=server]")?.value || "").trim(),
    service: formEl.querySelector("[name=service]")?.value || "",
    serviceName: lookupName('game', formEl.querySelector("[name=service]")?.value || ""),
    quantity: Number(formEl.querySelector("[name=quantity]")?.value || 1),
    total: Number(formEl.querySelector("[name=total]")?.value || 0),
    payment: formEl.querySelector("[name=payment]")?.value || "Unknown",
    transactionId: (formEl.querySelector("[name=transactionId]")?.value || "").trim()
  };

  const invalid = validateGameForm(data);
  if (invalid) {
    attachButtonLoading(btn, { start: false });
    showNotification("Validation error", invalid, "error");
    return;
  }

  backend.call('submitGameOrder', data, res => {
    attachButtonLoading(btn, { start: false });
    if (res && res.success) {
      showNotification("Game order submitted", `Order ID: ${res.orderId}`, "success");
      formEl.reset();
      setTimeout(() => updateStatsAndRecent(), 800);
    } else {
      showNotification("Submission failed", safeStringify(res), "error");
    }
  }, err => {
    attachButtonLoading(btn, { start: false });
    showNotification("Submission failed", String(err), "error");
  });
}

function submitSmmOrder(formEl) {
  const btn = formEl.querySelector("button[type=submit]");
  attachButtonLoading(btn, { start: true, textWhenLoading: "Submitting SMM order..." });

  const data = {
    action: 'submit_smm_order',
    userId: formEl.querySelector("[name=userId]")?.value || 'Guest',
    platform: formEl.querySelector("[name=platform]")?.value || "",
    service: formEl.querySelector("[name=service]")?.value || "",
    serviceName: lookupName('smm', formEl.querySelector("[name=service]")?.value || ""),
    targetLink: (formEl.querySelector("[name=targetLink]")?.value || "").trim(),
    quantity: Number(formEl.querySelector("[name=quantity]")?.value || 0),
    price: Number(formEl.querySelector("[name=price]")?.value || 0),
    total: Number(formEl.querySelector("[name=total]")?.value || 0),
    payment: formEl.querySelector("[name=payment]")?.value || "Unknown",
    transactionId: (formEl.querySelector("[name=transactionId]")?.value || "").trim()
  };

  const invalid = validateSmmForm(data);
  if (invalid) {
    attachButtonLoading(btn, { start: false });
    showNotification("Validation error", invalid, "error");
    return;
  }

  backend.call('submitSmmOrder', data, res => {
    attachButtonLoading(btn, { start: false });
    if (res && res.success) {
      showNotification("SMM order submitted", `Order ID: ${res.orderId}`, "success");
      formEl.reset();
      setTimeout(() => updateStatsAndRecent(), 800);
    } else {
      showNotification("Submission failed", safeStringify(res), "error");
    }
  }, err => {
    attachButtonLoading(btn, { start: false });
    showNotification("Submission failed", String(err), "error");
  });
}

function submitP2POrder(formEl) {
  const btn = formEl.querySelector("button[type=submit]");
  attachButtonLoading(btn, { start: true, textWhenLoading: "Submitting exchange..." });

  const amount = Number(formEl.querySelector("[name=amount]")?.value || 0);
  const fee = Number(formEl.querySelector("[name=fee]")?.value || (Math.round(amount * 0.02 * 100) / 100));
  const receive = Number(formEl.querySelector("[name=receive]")?.value || (Math.round((amount - fee) * 100) / 100));

  const data = {
    action: 'submit_p2p_order',
    userId: formEl.querySelector("[name=userId]")?.value || 'Guest',
    fromMethod: formEl.querySelector("[name=fromMethod]")?.value || "",
    toMethod: formEl.querySelector("[name=toMethod]")?.value || "",
    amount,
    fee,
    receive,
    transactionId: (formEl.querySelector("[name=transactionId]")?.value || "").trim()
  };

  const invalid = validateP2PForm(data);
  if (invalid) {
    attachButtonLoading(btn, { start: false });
    showNotification("Validation error", invalid, "error");
    return;
  }

  backend.call('submitP2POrder', data, res => {
    attachButtonLoading(btn, { start: false });
    if (res && res.success) {
      showNotification("Exchange submitted", `Order ID: ${res.orderId}`, "success");
      formEl.reset();
      setTimeout(() => updateStatsAndRecent(), 800);
    } else {
      showNotification("Submission failed", safeStringify(res), "error");
    }
  }, err => {
    attachButtonLoading(btn, { start: false });
    showNotification("Submission failed", String(err), "error");
  });
}

/* === Live UI helpers: update totals and fees when fields change === */
function attachAutoCalcSim(formEl) {
  const serviceSel = formEl.querySelector("[name=service]");
  const totalEl = formEl.querySelector("[name=total]");
  const qtyEl = formEl.querySelector("[name=quantity]");
  function recalc() {
    const service = serviceSel?.value || "";
    const price = lookupPrice('sim', service) || 0;
    const qty = Number(qtyEl?.value || 1);
    totalEl.value = price * qty;
  }
  serviceSel?.addEventListener("change", recalc);
  qtyEl?.addEventListener("input", recalc);
  recalc();
}

function attachAutoCalcGame(formEl) {
  const serviceSel = formEl.querySelector("[name=service]");
  const totalEl = formEl.querySelector("[name=total]");
  const qtyEl = formEl.querySelector("[name=quantity]");
  function recalc() {
    const service = serviceSel?.value || "";
    const price = lookupPrice('game', service) || 0;
    const qty = Number(qtyEl?.value || 1);
    totalEl.value = price * qty;
  }
  serviceSel?.addEventListener("change", recalc);
  qtyEl?.addEventListener("input", recalc);
  recalc();
}

function attachAutoCalcSmm(formEl) {
  const priceEl = formEl.querySelector("[name=price]");
  const qtyEl = formEl.querySelector("[name=quantity]");
  const totalEl = formEl.querySelector("[name=total]");
  function recalc() {
    const price = Number(priceEl?.value || 0);
    const qty = Number(qtyEl?.value || 0);
    totalEl.value = price * qty;
  }
  priceEl?.addEventListener("input", recalc);
  qtyEl?.addEventListener("input", recalc);
  recalc();
}

function attachAutoCalcP2P(formEl) {
  const amtEl = formEl.querySelector("[name=amount]");
  const feeEl = formEl.querySelector("[name=fee]");
  const recvEl = formEl.querySelector("[name=receive]");
  function recalc() {
    const amount = Number(amtEl?.value || 0);
    const fee = Math.round(amount * 0.02 * 100) / 100;
    feeEl.value = fee;
    recvEl.value = Math.round((amount - fee) * 100) / 100;
  }
  amtEl?.addEventListener("input", recalc);
  recalc();
}

/* === Copy admin phone functionality (used by multiple forms) === */
function attachCopyAdmin(buttonOrSelector) {
  const btn = typeof buttonOrSelector === "string" ? $(buttonOrSelector) : buttonOrSelector;
  if (!btn) return;
  btn.addEventListener("click", () => {
    navigator.clipboard?.writeText(ADMIN_PHONE).then(() => {
      showNotification("Copied", `${ADMIN_PHONE} copied to clipboard`, "success");
    }).catch(() => {
      showNotification("Copy failed", "Unable to copy phone number", "error");
    });
  });
}

/* === Fetch and render stats + recent orders for dashboard === */
function updateStatsAndRecent() {
  // get_stats server call; server Code.gs has getStats()
  backend.get({ _func: 'getStats' }, res => {
    if (res && res.success && res.stats) {
      // Attempt to render into elements with IDs #totalOrders, #pendingOrders, #completedOrders if present
      const s = res.stats;
      if ($("#totalOrders")) $("#totalOrders").textContent = s.totalOrders ?? 0;
      if ($("#pendingOrders")) $("#pendingOrders").textContent = s.pendingOrders ?? 0;
      if ($("#completedOrders")) $("#completedOrders").textContent = s.completedOrders ?? 0;
    }
  }, err => console.warn("getStats failed", err));

  // get recent orders: call getOrders with no userId to fetch all (server returns aggregated object)
  backend.get({ _func: 'get_orders' }, res => {
    if (res && res.success && res.orders) {
      // find a container with id #recentOrders and render a minimal list
      const container = $("#recentOrders");
      if (!container) return;
      container.innerHTML = "";
      const flattened = [];
      res.orders.forEach(o => {
        // server returns {sheet: name, data: record}
        try {
          const data = o.data || {};
          flattened.push({
            id: data.OrderID || data.orderId || data.order || (data.orderId || '').toString(),
            type: o.sheet,
            summary: (data.Service || data.Package || data.service || data.Game || data.Platform || '').toString(),
            amount: data.Total || data.total || data.Amount || '',
            status: data.Status || data.status || ''
          });
        } catch (e) {}
      });
      // show up to 6 recent
      flattened.slice(0, 6).forEach(item => {
        const row = el("div", { class: "erm-recent-row", html: `<strong>${escapeHtml(String(item.id || ''))}</strong> · ${escapeHtml(item.summary || '')} <span style="float:right">${escapeHtml(String(item.amount || ''))} ${escapeHtml(String(item.status || ''))}</span>` });
        container.appendChild(row);
      });
    }
  }, err => console.warn("get_orders failed", err));
}

/* === Status page helpers: fetch orders for a user or admin === */
function fetchOrdersForUser(userId, onDone) {
  backend.get({ _func: 'get_orders', userId }, res => {
    if (res && res.success) onDone(null, res.orders || []);
    else onDone(res || "No data");
  }, err => onDone(err));
}

/* === Small helpers === */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* === Auto-init: attach events if forms exist on the page === */
function autoWireForms() {
  // SIM form
  const simForm = $("#simForm");
  if (simForm) {
    attachCopyAdmin("#copyAdminPhoneSim");
    attachAutoCalcSim(simForm);
    simForm.addEventListener("submit", e => {
      e.preventDefault();
      submitSimOrder(simForm);
    });
  }

  // Game form
  const gameForm = $("#gameForm");
  if (gameForm) {
    attachCopyAdmin("#copyAdminPhoneGame");
    attachAutoCalcGame(gameForm);
    gameForm.addEventListener("submit", e => {
      e.preventDefault();
      submitGameOrder(gameForm);
    });
  }

  // SMM form
  const smmForm = $("#smmForm");
  if (smmForm) {
    attachCopyAdmin("#copyAdminPhoneSmm");
    attachAutoCalcSmm(smmForm);
    // If service dropdown should auto-fill price from price.js
    const serviceSel = smmForm.querySelector("[name=service]");
    const priceEl = smmForm.querySelector("[name=price]");
    serviceSel?.addEventListener("change", () => {
      const val = serviceSel.value;
      const p = lookupPrice('smm', val);
      if (priceEl) priceEl.value = p;
      // recalc
      const qtyEl = smmForm.querySelector("[name=quantity]");
      smmForm.querySelector("[name=total]").value = Number(p) * Number(qtyEl?.value || 0);
    });
    smmForm.addEventListener("submit", e => {
      e.preventDefault();
      submitSmmOrder(smmForm);
    });
  }

  // P2P form
  const p2pForm = $("#p2pForm");
  if (p2pForm) {
    attachCopyAdmin("#copyAdminPhoneP2P");
    attachAutoCalcP2P(p2pForm);
    p2pForm.addEventListener("submit", e => {
      e.preventDefault();
      submitP2POrder(p2pForm);
    });
  }

  // Status search / filter (status.html)
  const statusSearchBtn = $("#statusSearchBtn");
  if (statusSearchBtn) {
    statusSearchBtn.addEventListener("click", () => {
      const userId = $("#statusUserId")?.value || "";
      const out = $("#statusResults");
      if (!out) return;
      out.innerHTML = "Searching...";
      fetchOrdersForUser(userId, (err, orders) => {
        if (err) {
          out.innerHTML = `<div class="err">Error: ${escapeHtml(String(err))}</div>`;
          return;
        }
        if (!orders || orders.length === 0) {
          out.innerHTML = `<div>No orders found.</div>`;
          return;
        }
        // Render simple table
        const table = document.createElement("div");
        table.className = "erm-orders-list";
        orders.forEach(o => {
          const data = o.data || {};
          const id = data.OrderID || data.orderId || data.Order || '';
          const status = data.Status || data.status || '';
          const summary = (data.Service || data.Package || data.service || data.Game || data.Platform || '');
          const amount = data.Total || data.total || data.Amount || '';
          const row = el("div", { class: "erm-order-row", html: `<div><strong>${escapeHtml(String(id))}</strong> · ${escapeHtml(String(summary))}</div><div>${escapeHtml(String(amount))} <span style="margin-left:10px">${escapeHtml(String(status))}</span></div>` });
          table.appendChild(row);
        });
        out.innerHTML = "";
        out.appendChild(table);
      });
    });
  }

  // Admin order actions (if admin view has .erm-admin-order items)
  $$(".erm-admin-order").forEach(node => {
    const btnComplete = node.querySelector(".erm-mark-complete");
    const btnCancel = node.querySelector(".erm-mark-cancel");
    const orderId = node.dataset.orderId;
    const sheet = node.dataset.sheet;
    btnComplete?.addEventListener("click", () => {
      if (!confirm("Mark this order as Completed?")) return;
      updateOrderStatus(orderId, sheet, "Completed");
    });
    btnCancel?.addEventListener("click", () => {
      if (!confirm("Cancel this order?")) return;
      updateOrderStatus(orderId, sheet, "Cancelled");
    });
  });
}

/* === Initialization: run on DOMContentLoaded === */
document.addEventListener("DOMContentLoaded", () => {
  try {
    autoWireForms();

    // copy buttons across pages: safe attach for generic IDs
    ["#copyAdminPhoneSim", "#copyAdminPhoneGame", "#copyAdminPhoneSmm", "#copyAdminPhoneP2P", "#copyAdminPhone"].forEach(sel => {
      if ($(sel)) attachCopyAdmin(sel);
    });

    // Update dashboard stats/recent orders if containers present
    if ($("#totalOrders") || $("#recentOrders")) updateStatsAndRecent();

    // If services dropdowns exist and price.js loaded, populate them
    const simServiceSelects = $$("select[data-service-category='sim']");
    simServiceSelects.forEach(s => {
      if (window.SERVICE_PRICES && SERVICE_PRICES.sim) {
        s.innerHTML = `<option value="">-- Select package --</option>` + Object.keys(SERVICE_PRICES.sim).map(k => `<option value="${k}">${escapeHtml(SERVICE_PRICES.sim[k].name)} — ${escapeHtml(String(SERVICE_PRICES.sim[k].price))} MMK</option>`).join("");
      }
    });
    const gameServiceSelects = $$("select[data-service-category='game']");
    gameServiceSelects.forEach(s => {
      if (window.SERVICE_PRICES && SERVICE_PRICES.game) {
        s.innerHTML = `<option value="">-- Select package --</option>` + Object.keys(SERVICE_PRICES.game).map(k => `<option value="${k}">${escapeHtml(SERVICE_PRICES.game[k].name)} — ${escapeHtml(String(SERVICE_PRICES.game[k].price))} MMK</option>`).join("");
      }
    });
    const smmServiceSelects = $$("select[data-service-category='smm']");
    smmServiceSelects.forEach(s => {
      if (window.SERVICE_PRICES && SERVICE_PRICES.smm) {
        s.innerHTML = `<option value="">-- Select service --</option>` + Object.keys(SERVICE_PRICES.smm).map(k => `<option value="${k}">${escapeHtml(SERVICE_PRICES.smm[k].name)} — ${escapeHtml(String(SERVICE_PRICES.smm[k].price))} MMK</option>`).join("");
      }
    });

  } catch (e) {
    console.error("Initialization error", e);
  }
});

/* === Expose some functions to global scope for inline onclick handlers or debugging === */
window.erm = {
  showNotification,
  backend,
  submitSimOrder,
  submitGameOrder,
  submitSmmOrder,
  submitP2POrder,
  updateOrderStatus,
  updateStatsAndRecent,
  lookupPrice,
  lookupName
};

/* === End of script.js === */

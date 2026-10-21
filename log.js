/*
 * 受信した postMessage を画面右下に一覧表示する（スマホ実機で目視確認するため）。
 * AskOneLog.add({ status, origin, type, value, reason }) で1行追加する。
 *   status: "ok"（処理した） / "reject"（弾いた） / "info"（記録のみ）
 */
(function () {
  var MAX_ROWS = 200;
  var panel, list, countEl, rows = 0;

  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = "0" + n; return n; }
  function now() {
    var d = new Date();
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + "." + pad(d.getMilliseconds(), 3);
  }
  function short(v) {
    var s;
    try { s = typeof v === "string" ? v : JSON.stringify(v); } catch (e) { s = String(v); }
    if (s === undefined) s = String(v);
    return s.length > 160 ? s.slice(0, 160) + "…" : s;
  }

  function build() {
    panel = document.createElement("aside");
    panel.className = "msglog";
    panel.setAttribute("aria-label", "postMessage 受信ログ");
    panel.innerHTML =
      '<div class="msglog__head">' +
        '<button type="button" class="msglog__toggle" aria-expanded="true">受信ログ <span class="msglog__count">0</span></button>' +
        '<button type="button" class="msglog__clear">クリア</button>' +
      "</div>" +
      '<ol class="msglog__list"></ol>';
    document.body.appendChild(panel);
    list = panel.querySelector(".msglog__list");
    countEl = panel.querySelector(".msglog__count");
    var toggle = panel.querySelector(".msglog__toggle");
    // スマホ幅ではフォームを隠さないよう、件数だけ見える折りたたみ状態で始める
    if (window.matchMedia && window.matchMedia("(max-width: 600px)").matches) {
      panel.classList.add("is-collapsed");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("is-collapsed") === false;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    panel.querySelector(".msglog__clear").addEventListener("click", function () {
      list.innerHTML = "";
      rows = 0;
      countEl.textContent = "0";
    });
  }

  function add(entry) {
    if (!panel) build();
    var li = document.createElement("li");
    li.className = "msglog__row is-" + (entry.status || "info");
    var label = { ok: "処理", reject: "弾いた", info: "記録" }[entry.status] || "記録";
    var parts = [
      '<span class="msglog__time">' + now() + "</span>",
      '<span class="msglog__badge">' + label + "</span>"
    ];
    li.innerHTML = parts.join("");
    function line(k, v) {
      if (v === undefined || v === "") return;
      var p = document.createElement("div");
      p.className = "msglog__kv";
      var b = document.createElement("b");
      b.textContent = k;
      p.appendChild(b);
      p.appendChild(document.createTextNode(" " + v));
      li.appendChild(p);
    }
    line("origin", entry.origin);
    line("type", entry.type);
    line("値", entry.value === undefined ? undefined : short(entry.value));
    line("理由", entry.reason);
    list.insertBefore(li, list.firstChild);
    rows++;
    countEl.textContent = String(rows);
    while (list.children.length > MAX_ROWS) list.removeChild(list.lastChild);
  }

  window.AskOneLog = { add: add };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { if (!panel) build(); });
  } else {
    build();
  }
})();

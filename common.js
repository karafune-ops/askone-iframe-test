/*
 * 各テストページで共有する処理：iframe の組み立てと postMessage の検証。
 * config.js と log.js の後に読み込む。
 */
(function () {
  var C = window.ASKONE_TEST_CONFIG || {};

  // config.js のフォームURLを URL オブジェクトで返す。未設定・不正なら null
  function formUrl() {
    if (!C.FORM_URL || /REPLACE_WITH/.test(C.FORM_URL)) return null;
    try {
      var u = new URL(C.FORM_URL);
      return u.protocol === "https:" || u.protocol === "http:" ? u : null;
    } catch (e) {
      return null;
    }
  }

  // src を決めてから DOM に挿入する（挿入後に src を変えると再読込＝アクセス数加算になる）
  function mountIframe(opts) {
    var slot = document.getElementById(opts.container);
    var alt = document.getElementById("alt-link");
    var src = opts.src || formUrl();
    if (!src) {
      slot.innerHTML =
        '<div class="notice">config.js にフォームURLを設定してください。<br>' +
        '<code>FORM_URL: "REPLACE_WITH_PUBLIC_FORM_URL"</code> を Ask One の回答用公開URLに書き換えます。</div>';
      if (alt) alt.parentNode.hidden = true;
      return null;
    }
    var iframe = document.createElement("iframe");
    iframe.className = "form-frame";
    iframe.title = "Ask One フォーム";
    iframe.style.height = (opts.height || C.FALLBACK_HEIGHT || 600) + "px";
    iframe.src = String(src);
    slot.appendChild(iframe);
    if (alt) alt.href = String(src);
    return iframe;
  }

  // 高さ通知が使える値か。使えなければ理由を返す
  function checkHeight(h) {
    if (typeof h !== "number" || !isFinite(h)) return "height が有限の数値ではない";
    if (h < C.HEIGHT_MIN || h > C.HEIGHT_MAX) return "height が範囲外（" + C.HEIGHT_MIN + "〜" + C.HEIGHT_MAX + "）";
    return "";
  }

  /*
   * iframe からの message を検証してから handlers[type] に渡す。
   *   handlers: { iframeHeight: fn(data), askoneComplete: fn(data) }
   *   fn は { ok: boolean, value, reason } を返す（ログ表示用）
   *   observeOnly: true なら検証結果を記録するだけで何もしない（basic 用）
   */
  function listen(iframe, handlers, observeOnly) {
    var expected = formUrl().origin;
    window.addEventListener("message", function (e) {
      var data = e.data;
      var type = data && typeof data === "object" ? data.type : undefined;
      var base = { origin: e.origin, type: type === undefined ? "(なし)" : String(type), value: data };
      function log(status, reason) {
        base.status = status;
        base.reason = reason;
        window.AskOneLog.add(base);
      }
      if (e.origin !== expected) return log("reject", "origin 不一致（期待: " + expected + "）");
      if (e.source !== iframe.contentWindow) return log("reject", "source が埋め込み iframe ではない");
      if (typeof type !== "string") return log("reject", "data.type がない");
      if (observeOnly) return log("info", "このページでは処理しない");
      var fn = handlers[type];
      if (!fn) return log("reject", "このページで扱わない type");
      var r = fn(data) || {};
      log(r.ok ? "ok" : "reject", r.reason);
    });
  }

  // iframeHeight の標準ハンドラ
  function heightHandler(iframe) {
    return function (data) {
      var bad = checkHeight(data.height);
      if (bad) return { ok: false, reason: bad + "／" + iframe.style.height + " のまま" };
      var px = Math.ceil(data.height) + "px";
      iframe.style.height = px;
      return { ok: true, reason: "高さを " + px + " に変更" };
    };
  }

  function showConfig(el) {
    var u = formUrl();
    el.textContent = u ? String(u) : "（未設定）";
  }

  window.AskOneTest = {
    config: C,
    formUrl: formUrl,
    mountIframe: mountIframe,
    listen: listen,
    heightHandler: heightHandler,
    showConfig: showConfig
  };
})();

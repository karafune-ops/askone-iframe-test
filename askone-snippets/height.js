/*
 * Ask One スクリプト挿入欄に貼る：iframe の高さを親ページへ通知する。
 * - 全STEPに貼ってよい（二重起動ガードで1回だけ動く）。途中再開を考えると全STEP推奨
 * - PARENT_ORIGIN を GitHub Pages の origin（スキーム＋ホストのみ、パスなし）に置き換える
 * - フォームの置換テキストで単語が化けることがあるため、真偽値は !0 / !1 で書いている
 */
(function () {
  if (window.__askoneHeightInit) return;
  window.__askoneHeightInit = !0;

  var PARENT_ORIGIN = "https://karafune-ops.github.io";

  // 直接開いた場合（iframe ではない）は何もしない
  if (window.parent === window) return;

  var lastHeight = -1;
  var scheduled = !1;

  // Ask One の回答画面は .stage が画面の高さ（min-height）に張り付くため、中身の .stage__inner の下端を測り、
  // 画面下に固定表示される送信フッター（.submit）の高さを足す
  function measureAskOne() {
    var inner = document.querySelector(".stage__inner");
    if (!inner) return 0;
    var bottom = inner.getBoundingClientRect().bottom + window.pageYOffset;
    var submit = document.querySelector(".submit");
    if (submit && window.getComputedStyle(submit).position === "fixed") {
      bottom += submit.getBoundingClientRect().height;
    }
    return Math.ceil(bottom + 16);
  }

  // 画面の高さに張り付く要素（固定配置）を除いた、中身の下端までの高さ（Ask One の構造が見つからないときの予備）
  function measure() {
    var askOne = measureAskOne();
    if (askOne) return askOne;
    var body = document.body;
    if (!body) return 0;
    var bottom = 0;
    var kids = body.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      var pos = window.getComputedStyle(el).position;
      if (pos === "fixed" || pos === "sticky") continue;
      var r = el.getBoundingClientRect();
      if (r.height === 0 && r.width === 0) continue;
      var mb = parseFloat(window.getComputedStyle(el).marginBottom) || 0;
      bottom = Math.max(bottom, r.bottom + window.pageYOffset + mb);
    }
    if (!bottom) bottom = document.documentElement.scrollHeight;
    var pb = parseFloat(window.getComputedStyle(body).paddingBottom) || 0;
    return Math.ceil(bottom + pb);
  }

  function send() {
    scheduled = !1;
    var h = measure();
    if (!h || h === lastHeight) return;
    lastHeight = h;
    // PARENT_ORIGIN が未置換・不正だと例外になるため、同じSTEPの他のJSを巻き込まないよう握りつぶす
    try { window.parent.postMessage({ type: "iframeHeight", height: h }, PARENT_ORIGIN); } catch (e) {}
  }

  // requestAnimationFrame で間引く。非表示タブでは rAF が止まるので setTimeout でも拾う
  function schedule() {
    if (scheduled) return;
    scheduled = !0;
    var done = !1;
    function run() { if (done) return; done = !0; send(); }
    if (window.requestAnimationFrame) window.requestAnimationFrame(run);
    setTimeout(run, 200);
  }

  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(document.body);
  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.body, { childList: !0, subtree: !0, attributes: !0, characterData: !0 });
  }
  schedule();
})();

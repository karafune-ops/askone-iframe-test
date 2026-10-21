/*
 * Ask One スクリプト挿入欄に貼る：回答完了を親ページへ通知する。
 * - 完了ステップにだけ貼る（他のSTEPに貼ると途中で親ページが遷移してしまう）
 * - PARENT_ORIGIN を GitHub Pages の origin（スキーム＋ホストのみ、パスなし）に置き換える
 * - 完了ステップの表示が「回答保存成功後」かは未検証。管理画面の回答保存と突き合わせること
 */
(function () {
  if (window.__askoneCompleteSent) return;
  window.__askoneCompleteSent = !0;

  var PARENT_ORIGIN = "https://karafune-ops.github.io";

  if (window.parent === window) return;
  try { window.parent.postMessage({ type: "askoneComplete" }, PARENT_ORIGIN); } catch (e) {}
})();

/*
 * 検証ページ共通の設定。フォームURLを変えるときはこのファイルの FORM_URL だけ書き換える。
 * リポジトリは公開されるので、テスト用フォームの公開URL以外の情報は書かないこと。
 */
window.ASKONE_TEST_CONFIG = {
  // Ask One 検証用フォームの「回答用」公開URL（管理画面のURLではない）
  FORM_URL: "https://help.ninout.ai/ng/answers/75d4e3b5cccfdf120f9283545f1004/",

  // 完了通知を受けたときに親ページ全体を遷移させる先（同一サイト内に固定）
  THANKS_URL: "thanks.html",

  // 高さ通知が届かないときの iframe の高さ（px）
  FALLBACK_HEIGHT: 600,

  // 受け付ける高さの範囲（px）。試作の防御範囲で、製品の上限ではない
  HEIGHT_MIN: 100,
  HEIGHT_MAX: 20000,

  // 親ページURLから iframe へ引き継いでよいクエリキー（これ以外は渡さない）
  UTM_KEYS: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],

  // Ask One の「URLパラメータ入力」の変数名が UTM キーと違う場合の対応表
  // 例: { utm_source: "src", utm_campaign: "cp" }
  // 書いていないキーは UTM キー名のまま渡す
  UTM_PARAM_MAP: {}
};

# Ask One iframe 埋め込み 検証ページ

Ask One（ninout.ai）の公開フォームを外部サイトに **1段の iframe** で埋め込んだときの挙動を確認するための静的ページ一式です。
外部ライブラリ・ビルドツールは使っていません（素の HTML / CSS / JS）。

| ページ | 確認すること |
|---|---|
| `index.html` | 目次と現在の設定値（PARENT_ORIGIN に入れる値もここに表示） |
| `basic.html` | テスト1：固定600px・JS制御なしでの表示→送信→完了、アクセス数の増え方 |
| `auto-height.html` | テスト2：高さ自動調整（フォーム → 親への postMessage） |
| `complete.html` | テスト3：完了通知で親ページ全体を `thanks.html` へ遷移 |
| `utm.html` | テスト4：親URLの UTM を iframe の src へ引き継ぐ |
| `direct.html` | テスト5：JSを一切使わず iframe タグを直書きした版（高さ800px固定）。フォームURLはこのファイルに直接書いてあり、`config.js` は使わない |
| `thanks.html` | 親ページの遷移先 |

共通ファイル：`config.js`（設定）／`log.js`（右下の受信ログ）／`common.js`（iframe 組み立て・メッセージ検証）／`style.css`

---

## 1. GitHub Pages で公開する

1. このフォルダの中身をリポジトリ（例：`askone-iframe-test`）の `main` ブランチ直下に push する
2. GitHub のリポジトリ画面 → **Settings → Pages**
3. Build and deployment → Source: **Deploy from a branch**、Branch: **main** / **/(root)** → Save
4. 数分後に `https://karafune-ops.github.io/askone-iframe-test/` で開けるようになる

> **注意：** 無料プランでは Pages はパブリックリポジトリでしか使えません。
> リポジトリにはテスト用フォームの公開URL以外の情報（顧客名・顧客データ・APIキー・トークン等）を置かないでください。

## 2. config.js を書き換える

書き換えるのは **`FORM_URL` の1か所だけ**です。全ページに反映されます。

```js
FORM_URL: "REPLACE_WITH_PUBLIC_FORM_URL",   // ← 回答用の公開URLに置き換える
```

- 管理画面のURLではなく、回答者が開く公開URLを入れる
- 未設定のままだと、各ページに iframe の代わりに「config.js にフォームURLを設定してください」と表示される
- Ask One の「URLパラメータ入力」の変数名が UTM キーと違う場合は `UTM_PARAM_MAP` に対応を書く
  （例：`{ utm_source: "src" }`）。`___s` を含む変数名は Ask One 側で記録できないため、`utm.html` は渡さない

## 3. Ask One 側の準備（依頼者が管理画面で行う）

1. **検証用フォームを1つ用意する**（本番フォームは使わない）。通知メール・外部連携はテスト向け設定にするか OFF
2. **URLパラメータ入力の質問を追加する**（非表示ステップ）。変数名は `utm_source` など UTM キーと同じにすると `config.js` の変更が不要
3. **最終ステップの「特定URLへリンク」は OFF**（ON だと iframe の中でリダイレクトしてしまい、親ページ遷移の検証にならない）
4. **スクリプト挿入欄にスニペットを貼る**

   | ファイル | 貼る場所 |
   |---|---|
   | `askone-snippets/height.js` | **全STEP**（途中再開で最初のSTEPを通らないケースがあるため。二重起動ガードで1回しか動かない） |
   | `askone-snippets/complete.js` | **完了ステップのみ**（他のSTEPに貼ると途中で親ページが遷移する） |

   - 両ファイルの `PARENT_ORIGIN` は `"https://karafune-ops.github.io"` に設定済み。別のアカウントで公開する場合はその Pages の origin に置き換える。
     **スキーム＋ホストのみで、`/askone-iframe-test/` のパスは含めない**（`index.html` の「このサイトの origin」に表示される値）
   - 生の JavaScript を受け付ける欄なら **`<script>` タグは付けない**
   - スニペット内の真偽値は `!0` / `!1` で書いています。フォームの置換テキストに `true` / `false` が登録されていると、
     配信時に単語が置き換わって構文エラーになるため。貼った後に `true` / `false` を足さないでください
   - `complete.js` の注意：**完了ステップの表示が「回答保存に成功した後」であることは未検証**です。
     テスト3では必ず管理画面の回答保存と突き合わせてください

## 4. 各テストページの使い方

- どのページも右下に **受信ログ** が出ます。受け取った postMessage の origin・type・値・時刻と、
  弾いたメッセージ（理由つき）が並びます。スマホ実機でもそのまま目視できます（見出しをタップで折りたたみ）
- iframe の src は **最初の読み込み前に** JS で組み立てています（後から書き換えると再読込になり、アクセス数が余計に増えるため）
- 各ページの下に「フォームを別タブで開く」リンクがあります（iframe で回答できない環境の代替導線）

### basic.html
固定 600px の iframe のみ。高さ調整も遷移もしません。届いたメッセージは記録だけします。

### auto-height.html
次の **すべて** を満たすメッセージだけで高さを変えます。満たさない場合は 600px のまま。

- `event.origin` がフォームURLの origin と一致
- `event.source` が埋め込んだ iframe の `contentWindow`
- `data.type === "iframeHeight"`、`height` が有限の数値で 100〜20000（試作の防御範囲。製品の上限ではない）

### complete.html
高さ調整に加え、`data.type === "askoneComplete"` を受けたら `config.js` の `THANKS_URL`（`thanks.html`）へ
`window.location.assign` で遷移します。遷移先は親側で固定（メッセージ内のURLは使わない）、二重遷移は防止しています。

### utm.html
`?utm_source=test&utm_campaign=x&foo=bar` のように開くと、`config.js` の許可リストにあるキーだけをフォームURLに付けます。
親URLのクエリを丸ごと転送はしません。画面上部に「引き継いだ／渡さなかった／最終的な src」を表示します。
目次からのリンクは上記クエリ付きで開きます。

### direct.html
JavaScript を一切読み込まないページです。貼り付けるコードは iframe タグ1つだけです。
フォームURLを変えたときは、`config.js` とは別に、このファイルの `src` と「別タブで開く」リンクの2か所も書き換えてください。

## 5. 既知の制約（検証の前提）

- iframe 埋め込み自体は可能。ただし **iframe 固有のコード記述は Ask One のサポート対象外**
- **親サイトを読み込むたびにフォームのアクセス数がカウントされる**（公式ヘルプ記載）
- **セッションCookieが無効な環境では回答できない**（Safari ITP 等）。途中再開・繰り返し回答制限も同じ Cookie / セッションで管理される
- 親ページのURLパラメータは iframe に自動では渡らない → 親側 JS で src に付ける（`utm.html`）
- Ask One で URL パラメータを記録するには「URLパラメータ入力」質問が必要。`___s` を含むパラメータは記録不可
- スクリプト挿入は STEP 単位で、**そのSTEPが表示されるたびに実行**される（回答画面は SPA）→ スニペットは二重起動ガード付き
- 最終ステップの「特定URLへリンク」が ON だと iframe 内でリダイレクトする
- **プレビューURL（`/ng/surveys/<id>/preview/`）を別サイトに埋め込むと、スクリプト挿入欄のJSが読み込まれない**（2026-10-21 実測）。
  JSの配信URL（`/ng/scripts/...`）が Cookie なしだと 404 になるため。公開URL（`/ng/answers/...`）では同じブラウザで正常に動いた。
  検証は必ず公開URLで行う。サードパーティCookieをブロックする実機（iPhone Safari 等）での挙動はチェックリスト #8 で確認する
- Ask One の回答画面は `.stage` が画面の高さに張り付く作りのため、`height.js` は中身（`.stage__inner`）の下端＋固定の送信フッターの高さを測っている
- Ask One 自身も親に文字列のメッセージ（`initialize` / `setupComplete` など）を送ってくる。受信ログには「data.type がない」で弾いた行として出るが問題ない

## スコープ外

本番サイトの CSP・CMS・Cookie 同意管理の再現、Ask One 管理画面の操作（フォーム作成・スクリプト貼り付け）は含みません。

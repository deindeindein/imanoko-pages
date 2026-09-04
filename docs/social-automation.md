# Instagram / Threads 自動投稿のセットアップ

`content/posts/` に投稿を置いておくと、GitHub Actions が毎時チェックして、
公開時刻を過ぎたものを Instagram と Threads へ投稿します。

```
content/posts/2026-09-10-hands.md   投稿の本文と公開時刻
media/2026-09-10-hands.jpg          画像・動画
        ↓ コミット
GitHub Pages が media/ を公開            https://deindeindein.github.io/imanoko-pages/media/...
        ↓ 毎時 00 分
.github/workflows/social-post.yml
        ↓ Meta の API は「公開 URL」から取りに来る
Instagram / Threads
        ↓
投稿 ID を前付けに書き戻してコミット（＝二重投稿しない）
```

サーバーは要りません。費用もかかりません（公開リポジトリの Actions は無料枠内）。

---

## 1. Meta 側の準備

Meta の管理画面は名称がよく変わります。以下は「何をする必要があるか」で書いてあります。
画面の細かい文言は公式ドキュメントを見てください。

- Instagram: <https://developers.facebook.com/docs/instagram-platform/content-publishing>
- Threads: <https://developers.facebook.com/docs/threads>

### 1-1. Instagram をプロアカウントにする

個人アカウントでは API 投稿ができません。
Instagram アプリの 設定 → アカウントの種類とツール → **プロアカウントに切り替える**
（カテゴリはアプリなので「アプリページ」などで構いません）。

### 1-2. Meta 開発者アカウントとアプリを作る

1. <https://developers.facebook.com/> で開発者登録する
2. **マイアプリ → アプリを作成**
3. ユースケースの選択で、次の 2 つを追加する
   - **Instagram**（Instagram ログインでの API 利用 / コンテンツ公開）
   - **Threads**（Threads API）

このリポジトリの既定は **Instagram ログイン方式**（`graph.instagram.com`）です。
Facebook ページ連携方式（`graph.facebook.com`）を使う場合は、あとで
リポジトリ変数 `IG_API_BASE` を `https://graph.facebook.com` にしてください。

### 1-3. 必要な権限（スコープ）

| | スコープ |
| --- | --- |
| Instagram | `instagram_business_basic`, `instagram_business_content_publish` |
| Threads | `threads_basic`, `threads_content_publish` |

自分のアカウントに投稿するだけなら、**アプリ審査は不要**です。
開発モードのまま、アプリの「役割」に自分のアカウントを入れておけば動きます。

### 1-4. アクセストークンを取る

各ユースケースの設定画面に「アクセストークンを生成」があります。
そこで発行されるのは **短期トークン（約 1 時間）** なので、長期（約 60 日）に交換します。

手元のクローンで:

```bash
# 短期トークンとアプリシークレットを渡して交換する
THREADS_ACCESS_TOKEN=<短期トークン> THREADS_APP_SECRET=<Threads のアプリシークレット> \
IG_ACCESS_TOKEN=<短期トークン>      IG_APP_SECRET=<Instagram のアプリシークレット> \
npm run token:exchange -- --print-token
```

出てきた長期トークンを控えます。あわせてユーザー ID も確認します。

```bash
THREADS_ACCESS_TOKEN=<長期トークン> IG_ACCESS_TOKEN=<長期トークン> npm run check
```

`THREADS_USER_ID = ...` `IG_USER_ID = ...` が表示されます。

---

## 2. GitHub 側の設定

リポジトリの **Settings → Secrets and variables → Actions** で登録します。

### Secrets（秘密。表示されません）

| 名前 | 中身 |
| --- | --- |
| `THREADS_USER_ID` | Threads のユーザー ID |
| `THREADS_ACCESS_TOKEN` | Threads の長期アクセストークン |
| `IG_USER_ID` | Instagram のユーザー ID |
| `IG_ACCESS_TOKEN` | Instagram の長期アクセストークン |
| `GH_SECRETS_TOKEN` | 任意。トークンを自動更新したい場合のみ（後述） |

### Variables（公開されてよい設定。省略時は既定値）

| 名前 | 既定値 | 用途 |
| --- | --- | --- |
| `PUBLIC_BASE_URL` | `https://deindeindein.github.io/imanoko-pages` | メディアの公開 URL の基点 |
| `MAX_POSTS_PER_RUN` | `3` | 1 回の実行で投稿する最大件数 |
| `IG_API_BASE` | `https://graph.instagram.com` | Facebook ページ方式なら `https://graph.facebook.com` |
| `IG_API_VERSION` | `v23.0` | Graph API のバージョン |
| `THREADS_API_BASE` | `https://graph.threads.net` | |
| `THREADS_API_VERSION` | `v1.0` | |

> API のバージョンは Meta 側で更新されていきます。エラーが出るようになったら
> `IG_API_VERSION` を上げるだけで追随できます。

### GitHub Pages を有効にする

Settings → Pages → Source を `Deploy from a branch` の `main` / `/ (root)` にします。
`media/` 以下がそのまま公開されます。

### 動作確認

Actions → **SNS 自動投稿** → `Run workflow` で `dry_run` にチェックを入れて実行すると、
何が投稿対象になるかだけを確認できます。

---

## 3. ふだんの使い方

```bash
# 1. 画像を置く
cp ~/Desktop/hands.jpg media/2026-09-10-hands.jpg

# 2. 投稿ファイルを作る
npm run new -- --at "2026-09-10 09:00" --slug hands --media media/2026-09-10-hands.jpg

# 3. 本文を書く（content/posts/2026-09-10-hands.md）

# 4. 確認してからコミット
npm run validate
npm run post:dry
git add . && git commit -m "post: 9/10 の投稿" && git push
```

あとは時刻になれば自動で投稿されます。投稿されると、そのファイルに
`status: posted` と投稿 URL が追記されたコミットが自動で入ります。

書き方の詳細は [`content/posts/README.md`](../content/posts/README.md) を見てください。

### すぐ投稿したいとき

Actions → SNS 自動投稿 → `Run workflow` の `file` にパスを入れて実行すると、
公開時刻を無視してそのファイルだけを投稿します。

### 止めたいとき

- 1 件だけ: そのファイルの `status` を `skipped` にする
- 全部: Actions → SNS 自動投稿 → `Disable workflow`

---

## 4. トークンの更新

長期トークンは **約 60 日**で切れます。毎週月曜に「SNS トークン更新」ワークフローが動き、
期限を延長します。

延長した新しいトークンをどう保存するかで 2 通りあります。

**A. 手動（既定・追加設定なし）**
ワークフローが Issue を立てて知らせます。手元で次を実行し、表示された値を
Secrets に貼り替えてください。

```bash
THREADS_ACCESS_TOKEN=<今の値> IG_ACCESS_TOKEN=<今の値> npm run token:refresh -- --print-token
```

**B. 自動（`GH_SECRETS_TOKEN` を登録する）**
Secrets の書き込み権限を持つ Fine-grained personal access token を作り、
`GH_SECRETS_TOKEN` という名前で Secrets に登録します。

- Repository access: このリポジトリのみ
- Permissions: **Secrets: Read and write**

登録しておくと、更新されたトークンがそのまま Secrets に書き戻され、
以降は放っておいても切れません。

> この PAT はリポジトリの Secrets をすべて書き換えられます。
> 手間より安全側を取るなら A のままで問題ありません。

---

## 5. 制限と注意

- **投稿数**: Instagram は API 経由で 24 時間あたり 100 件まで。`npm run check` で使用状況を確認できます。
- **メディアは公開されます**: `media/` に置いたファイルは誰でも URL で見られます。
  Meta の API が公開 URL からしか取得できないためです。公開したくない画像は置かないでください。
- **Pages の反映待ち**: コミットから Pages 公開まで 1〜2 分かかります。
  投稿スクリプトは送信前に URL の到達性を確認し、届かなければその回は投稿せず次の毎時実行に回します
  （3 回失敗すると `status: failed` になります）。
- **投稿時刻はぴったりではありません**: GitHub Actions の cron は数分〜十数分ずれることがあります。
  「9:00 の投稿」は 9:00〜9:20 ごろになると考えてください。
- **動画**: Instagram では単体の動画はリールとして投稿されます。
  1 ファイル 100MB 未満（GitHub の制限）に収めてください。

---

## 6. うまくいかないとき

| 症状 | 見るところ |
| --- | --- |
| `環境変数が未設定です` | Secrets の名前が合っているか。Secrets は大文字小文字を区別します |
| `メディアが公開されていません` | Pages が有効か、`PUBLIC_BASE_URL` が正しいか、デプロイが終わっているか |
| `OAuthException / code=190` | トークンが失効しています。1-4 からやり直してください |
| `code=100` でパラメータ不正 | `IG_API_VERSION` を上げてみてください |
| 個人アカウント扱いになる | Instagram をプロアカウントに切り替えたか（1-1） |
| 何も投稿されない | 該当ファイルの `status` を確認。`posted` / `skipped` / `failed` は対象外です |

失敗した投稿は前付けに `last_error` が残ります。原因を直したら
`status` を `scheduled` に戻し、`attempts` と `last_error` の行を消せば再試行されます。

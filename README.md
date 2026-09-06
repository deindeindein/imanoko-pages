# imanoko-pages

「いまのこ」の公開ページ（プライバシーポリシー・利用規約・特定商取引法に基づく表記・サポート）と、
App Store レビューの取得まわりを置いているリポジトリです。

## レビュー管理

App Store の公開 RSS からレビューを定期取得し、新着だけを Slack に流します。取得したレビューは
`data/` に貯めて、`reviews.html` のダッシュボードで一覧・絞り込みができます。

- `reviews.config.json` … 対象アプリ・国・取得ページ数・Slack の設定
- `scripts/fetch-reviews.mjs` … 取得・保存・Slack 通知（Node 20 以降。依存パッケージなし）
- `.github/workflows/reviews.yml` … 毎日 09:00 JST に実行（手動実行も可）
- `data/reviews.json` / `data/reviews.js` … 取得したレビュー（自動更新）
- `reviews.html` … ダッシュボード

### 使いはじめる前に

1. **App Store ID を設定する。** `reviews.config.json` の `appId` を、App Store の URL に含まれる数字
   （`https://apps.apple.com/jp/app/id1234567890` なら `1234567890`）に置き換えます。
   数字が分からなければ `appId` を空にして `bundleId` を書けば、実行時に自動で解決します。
2. **Slack の Incoming Webhook を作る。** 通知したいチャンネルの Webhook URL を、リポジトリの
   Settings → Secrets and variables → Actions で `SLACK_WEBHOOK_URL` という名前で登録します。
3. **一度手動で動かす。** Actions タブ →「レビュー取得」→ Run workflow。
   初回は既存レビューをまとめて保存するだけで、Slack には流しません（大量通知を避けるため）。
   2 回目以降、新しく増えたレビューだけが Slack に届きます。

### 手元で動かす

```sh
node scripts/fetch-reviews.mjs --no-slack   # 取得と保存だけ
SLACK_WEBHOOK_URL=https://hooks.slack.com/... node scripts/fetch-reviews.mjs
```

`reviews.html` はそのままブラウザで開けます（`data/reviews.js` を読むため、サーバー不要）。

### 設定できること

| 項目 | 意味 |
| --- | --- |
| `apps[].countries` | 取得する国。`["jp", "us"]` のように複数指定できます |
| `pages` | 国ごとに取得するページ数。1 ページ 50 件、最大 10 ページ |
| `slack.onlyRatingAtMost` | この星以下のレビューだけ通知。`2` にすると低評価だけ届きます |
| `slack.maxNotify` | 1 回に通知する上限。超えると件数のサマリだけ送ります |

実行間隔は `.github/workflows/reviews.yml` の `cron`（UTC）で変えられます。

### 注意

- このリポジトリは GitHub Pages で公開されているため、`reviews.html` と `data/` も
  URL を知っていれば誰でも見られます（レビュー自体は App Store 上の公開情報です）。
  外から見せたくない場合は、リポジトリを private にするか、Pages の公開元を絞ってください。
- 公開 RSS には開発者からの返信は含まれません。返信まで扱いたい場合は App Store Connect API
  （鍵の登録が必要）への切り替えが必要です。

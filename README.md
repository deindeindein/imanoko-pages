# imanoko-pages

iOS アプリ「[いまのこ](https://deindeindein.github.io/imanoko-pages/)」の公開ページと、
Instagram / Threads の予約投稿オートメーション。

## 公開ページ

| ファイル | 内容 |
| --- | --- |
| `index.html` | トップ |
| `privacy-policy.html` | プライバシーポリシー |
| `terms.html` | 利用規約 |
| `tokusho.html` | 特定商取引法に基づく表記 |
| `support.html` | サポート / FAQ |

GitHub Pages で `https://deindeindein.github.io/imanoko-pages/` に公開しています。

## SNS 自動投稿

`content/posts/` に投稿ファイルを置いておくと、GitHub Actions が公開時刻に
Instagram と Threads へ投稿します。Node の標準機能だけで動くので依存パッケージはありません。

```bash
npm run new -- --at "2026-09-10 09:00" --slug hands --media media/hands.jpg
npm run validate     # 形式と各 SNS の制限をチェック
npm run post:dry     # 何がいつ投稿されるかを確認
npm run check        # トークンとアカウントの疎通確認
```

- セットアップ手順: [`docs/social-automation.md`](docs/social-automation.md)
- 投稿ファイルの書き方: [`content/posts/README.md`](content/posts/README.md)

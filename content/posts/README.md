# 投稿キューの書き方

このフォルダに Markdown を 1 ファイル = 1 投稿として置くと、`publish_at` の時刻に
GitHub Actions が Instagram / Threads へ自動投稿します。

ひな形を作る:

```bash
npm run new -- --at "2026-09-10 09:00" --slug newborn-hands --platforms threads,instagram --media media/hands.jpg
```

## ファイルの形

```markdown
---
publish_at: 2026-09-10 09:00
platforms: threads, instagram
media: media/2026-09-10-hands.jpg
alt: 生まれたばかりの赤ちゃんの手
status: scheduled
---
ここが本文です。
Threads では投稿文、Instagram ではキャプションになります。

#いまのこ
```

`---` で囲んだ部分が設定、その下が本文です。設定は「キー: 値」を 1 行ずつ書きます。

## 設定できるキー

| キー | 必須 | 内容 |
| --- | --- | --- |
| `publish_at` | ✅ | 公開日時。`YYYY-MM-DD HH:mm` は日本時間として扱います。 |
| `platforms` | ✅ | `threads` / `instagram` をカンマ区切りで。 |
| `media` | Instagram では必須 | `media/` 以下のパスをカンマ区切りで。2〜10 件でカルーセルになります。 |
| `alt` | 推奨 | 画像の代替テキスト。複数枚のときは全部に同じものが付きます。 |
| `link` | | Threads のテキスト投稿にだけ付くリンク。メディアがあると無視されます。 |
| `status` | | `scheduled`（既定）/ `skipped`（投稿しない）。投稿後は自動で書き換わります。 |

投稿後は次のキーが自動で追記されます。手で書く必要はありません。

`status: posted` / `posted_at` / `posted_threads` / `posted_instagram` / `url_threads` / `url_instagram` /
失敗時は `attempts` と `last_error`。

## 制限

| | Threads | Instagram |
| --- | --- | --- |
| 本文 | 500 文字 | 2,200 文字 |
| ハッシュタグ | 制限なし（1 投稿 1 タグまで有効） | 30 個 |
| メディア | 任意（テキストのみ可） | 必須 |
| カルーセル | 最大 20 件 | 2〜10 件 |
| 拡張子 | `.jpg` `.jpeg` `.png` `.mp4` `.mov` | 同左（動画はリールとして投稿） |

書いたら手元で確認できます。

```bash
npm run validate    # 形式と制限のチェック
npm run post:dry    # 何がいつ投稿されるかの一覧
```

## 画像・動画の置き方

`media/` に置いてコミットすると、GitHub Pages 経由で公開 URL になります
（例: `media/hands.jpg` → `https://deindeindein.github.io/imanoko-pages/media/hands.jpg`）。
Instagram / Threads はこの URL からファイルを取りに来るため、**公開前に Pages のデプロイが終わっている必要があります**。
投稿スクリプトは送信前に URL へ到達できるか確認し、届かなければ投稿せず次回に持ち越します。

1 ファイル 100MB 未満にしてください。

## 投稿を止めたいとき

- 1 件だけ止める: `status: skipped` に書き換える
- 全部止める: リポジトリの Actions → 「SNS 自動投稿」→ `Disable workflow`

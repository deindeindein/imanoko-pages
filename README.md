# imanoko-pages

いまのこ（iOS アプリ）の公開ページ。GitHub Pages で配信しています。

| ページ | ファイル |
|--------|----------|
| トップ | `index.html` |
| プライバシーポリシー | `privacy-policy.html` |
| 利用規約 | `terms.html` |
| 特定商取引法に基づく表記 | `tokusho.html` |
| サポート | `support.html` |

## デザイン

見た目のルールは **[`DESIGN.md`](DESIGN.md)** に定義しています。
色・文字サイズ・余白・角丸などのトークンと、コンポーネントの規則がすべてそこにあります。

実装は `styles.css` の 1 枚だけです。各ページはインライン `<style>` を持たず、
`<link rel="stylesheet" href="styles.css">` で読み込みます。

ページを追加・変更するとき（人でも AI コーディングツールでも）は、
先に `DESIGN.md` を読み、値はトークン経由で使い、末尾のチェックリストで確認してください。

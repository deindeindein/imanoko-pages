# DESIGN.md — いまのこ

> このファイルは、いまのこの Web ページ（公開ページ）が従うデザイン言語の定義です。
> 新しいページやコンポーネントを作るとき、AI コーディングツール（Claude Code / Codex / Cursor など）と人間は、
> 見た目に関する判断をここに書かれたトークンから引くこと。ここに無い値を新しく発明しない。
> 実装は `styles.css` にあり、このファイルの内容と 1:1 で対応する。

---

## Design Language

**やわらかい紙のような記録帳。**

いまのこは、赤ちゃんの 5 秒を残すためのアプリ。公開ページもその温度に合わせる。
背景は純白ではなく、わずかに黄みを含んだ紙色（`#FBF7F3`）。文字も純黒ではなく、
茶みのある墨色（`#2E2723`）。この 2 つで「印刷物のような落ち着き」を作り、
唯一の彩度としてアプリのアイコンと同じ珊瑚色（`#D95757`）をリンクとアクセントにだけ使う。

面（カード・囲み）は影で浮かせない。**1px のヘアラインと背景色の差**だけで区切る。
影は使うとしても、ほぼ見えない高さに留める。角丸は 10px を基準に、小さくやわらかく。

行間は広い（本文 1.9）。日本語の長文を読むページなので、**余白＞装飾**。
見出しは太さではなくサイズと余白で階層を作る。装飾的な区切り線は、
h2 の上のヘアライン 1 本だけに絞る。

**やらないこと:** グラデーション背景、紫〜青のテック配色、光るボーダー、
派手な影、アイコンの多用、`system-ui` 以外の Web フォント読み込み、
中央揃えの長文、アニメーションによる登場演出。

**Density:** comfortable（読み物向け・余白広め）

---

## Color Palette

### Light（既定）

| Name | Value | Token | 用途 |
|------|-------|-------|------|
| Background | `#FBF7F3` | `--color-bg` | ページ地。紙色 |
| Surface | `#FFFFFF` | `--color-surface` | カード・テーブルのセル |
| Surface Muted | `#F4EDE6` | `--color-surface-muted` | 囲み・テーブルヘッダ |
| Text | `#2E2723` | `--color-text` | 本文・見出し |
| Text Muted | `#6F645C` | `--color-text-muted` | 補足・日付 |
| Text Subtle | `#9A8E85` | `--color-text-subtle` | ラベル・キャプション |
| Border | `#E7DCD2` | `--color-border` | ヘアライン（既定） |
| Border Strong | `#D5C7BA` | `--color-border-strong` | テーブル外周・強い区切り |
| Accent | `#D95757` | `--color-accent` | リンク・強調 |
| Accent Hover | `#B94343` | `--color-accent-hover` | リンク hover |
| Accent Soft | `#FBEDEA` | `--color-accent-soft` | 囲みの地・focus ring の下地 |

### Dark

| Name | Value | Token |
|------|-------|-------|
| Background | `#17130F` | `--color-bg` |
| Surface | `#211B16` | `--color-surface` |
| Surface Muted | `#2A231D` | `--color-surface-muted` |
| Text | `#F2EAE2` | `--color-text` |
| Text Muted | `#B5A89D` | `--color-text-muted` |
| Text Subtle | `#8A7D72` | `--color-text-subtle` |
| Border | `#332B24` | `--color-border` |
| Border Strong | `#463A31` | `--color-border-strong` |
| Accent | `#F08A8A` | `--color-accent` |
| Accent Hover | `#F7A5A5` | `--color-accent-hover` |
| Accent Soft | `#2E1F1D` | `--color-accent-soft` |

**規則**

- 彩度を持つ色は accent 系のみ。情報の種類を色で分けない（太字と余白で分ける）。
- ダークでは accent を明るい側（`#F08A8A`）へ振る。`#D95757` は暗背景でコントラストが足りない。
- 本文と背景のコントラストは light / dark とも 4.5:1 以上を保つ。

---

## Typography

**Font Stack:** `-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", system-ui, sans-serif`
Web フォントは読み込まない（表示の速さと、端末の日本語フォントを尊重するため）。

| Element | Size | Line Height | Weight | Letter Spacing | Token |
|---------|------|-------------|--------|----------------|-------|
| h1 | 28px | 1.45 | 700 | 0.01em | `--text-h1` |
| h2 | 20px | 1.5 | 700 | 0.01em | `--text-h2` |
| h3 | 17px | 1.6 | 700 | 0.01em | `--text-h3` |
| Body | 16px | 1.9 | 400 | 0.02em | `--text-body` |
| Lead | 17px | 1.9 | 400 | 0.02em | `--text-lead` |
| Small | 14px | 1.8 | 400 | 0.02em | `--text-small` |
| Caption | 13px | 1.7 | 500 | 0.04em | `--text-caption` |

**規則**

- 日本語のため `letter-spacing` は 0.02em を基準（欧文より広く取る）。
- 強調は `<strong>`（weight 700 + `--color-text`）。色を変えない。
- 本文の 1 行は最大 42rem（`--measure`）。それ以上伸ばさない。
- 見出しは 2 階層まで（h2 / h3）。h4 以下は使わない。

---

## Spacing Scale

4px 基準。中間値を作らない。

| Name | Value | Token |
|------|-------|-------|
| 1 | 4px | `--space-1` |
| 2 | 8px | `--space-2` |
| 3 | 12px | `--space-3` |
| 4 | 16px | `--space-4` |
| 5 | 20px | `--space-5` |
| 6 | 24px | `--space-6` |
| 8 | 32px | `--space-8` |
| 10 | 40px | `--space-10` |
| 14 | 56px | `--space-14` |
| 18 | 72px | `--space-18` |

**規則**

- 段落間 `--space-4`、h3 の上 `--space-8`、h2 の上 `--space-14`（節の切れ目をはっきりさせる）。
- ページの左右余白はモバイル `--space-5`、640px 以上で `--space-6`。
- 上下の外側余白は `--space-10` / `--space-18`（下を厚く取り、末尾を詰まらせない）。

---

## Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Small（タグ・コード） | 6px | `--radius-sm` |
| Default（カード・囲み・テーブル） | 10px | `--radius-md` |
| Large（ナビのカード） | 14px | `--radius-lg` |
| Pill | 999px | `--radius-pill` |

---

## Shadows

影は「浮かせる」ためではなく「紙が置いてある」程度に。

| Name | Value | Token |
|------|-------|-------|
| Hairline | `0 0 0 1px var(--color-border)` | `--shadow-hairline` |
| Soft | `0 1px 2px rgba(46, 39, 35, 0.04)` | `--shadow-soft` |
| Raised | `0 2px 8px rgba(46, 39, 35, 0.06)` | `--shadow-raised` |

ダークでは影を使わず、`--color-border` の差だけで面を分ける。

---

## Components

### Link
- 既定色 `--color-accent`、`text-decoration: underline`、`text-underline-offset: 0.25em`、`text-decoration-thickness: 1px`。
- hover で `--color-accent-hover` ＋ thickness 2px。位置は動かさない。
- `:focus-visible` は 2px の accent アウトライン ＋ 2px offset。outline を消さない。

### Back link（`.backlink`）
- Small サイズ、`--color-text-muted`、下線なし。`::before` に `←` ＋ `--space-2` の間隔。
- ページ本文の先頭、h1 の上に置く。hover で accent。

### Section（h2）
- h2 の上に `border-top: 1px solid var(--color-border)` と `--space-14` の間隔。
- ページ最初の h2 の線は省略しない（節の並びを均一にする）。

### List（`ul`）
- 標準マーカーを消し、`::before` に `・`ではなく 4px の丸（`--color-border-strong`）を置く。
- 項目間 `--space-2`、インデント `--space-5`。

### Table
- 外周 1px `--color-border-strong` ＋ `--radius-md`、セル境界は `--color-border`。
- `th` は `--color-surface-muted`、左揃え、`--text-caption` ではなく Small。
- セル padding `--space-3`。横スクロールは `.table-wrap`（`overflow-x: auto`）で受ける。

### Definition table（`.table-kv`）
- 「項目名 → 内容」の 2 列テーブル（特商法表記・購読条件など）。`tbody th` が項目名。
- `th` は幅 32%、右に 1px `--color-border`。
- **480px 以下では縦積みにする。** `th` は幅いっぱいの見出し行（`--text-caption`・`--color-text-muted`）になり、
  その下に内容が続く。日本語の項目名を細い列に押し込んで 1 文字ずつ折り返さないため。

### Callout（`.callout`）
- 「要点」など、読み飛ばしても困る内容を囲む。
- 地 `--color-accent-soft`、左に 3px `--color-accent` の線、角丸 `--radius-md`、padding `--space-5`。

### Nav cards（`.nav-cards`）
- トップページのリンク一覧。1 項目 = 1 カード。
- 地 `--color-surface`、1px `--color-border`、`--radius-lg`、padding `--space-4` `--space-5`。
- 下線なし、文字は `--color-text`、`::after` に `→`。hover で border が `--color-accent`。

---

## CSS Variables

実装は `styles.css` の `:root` を参照。すべてのページはインライン `<style>` を持たず、
`<link rel="stylesheet" href="styles.css">` だけを読む。

```css
:root {
  color-scheme: light dark;

  --color-bg: #FBF7F3;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F4EDE6;
  --color-text: #2E2723;
  --color-text-muted: #6F645C;
  --color-text-subtle: #9A8E85;
  --color-border: #E7DCD2;
  --color-border-strong: #D5C7BA;
  --color-accent: #D95757;
  --color-accent-hover: #B94343;
  --color-accent-soft: #FBEDEA;

  --font-sans: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", system-ui, sans-serif;
  --text-h1: 28px; --text-h2: 20px; --text-h3: 17px;
  --text-lead: 17px; --text-body: 16px; --text-small: 14px; --text-caption: 13px;
  --leading-tight: 1.45; --leading-heading: 1.5; --leading-body: 1.9;
  --tracking-ja: 0.02em;

  --space-1: 4px;  --space-2: 8px;   --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px;  --space-8: 32px; --space-10: 40px;
  --space-14: 56px; --space-18: 72px;

  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-pill: 999px;

  --shadow-hairline: 0 0 0 1px var(--color-border);
  --shadow-soft: 0 1px 2px rgba(46, 39, 35, 0.04);
  --shadow-raised: 0 2px 8px rgba(46, 39, 35, 0.06);

  --measure: 42rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #17130F;
    --color-surface: #211B16;
    --color-surface-muted: #2A231D;
    --color-text: #F2EAE2;
    --color-text-muted: #B5A89D;
    --color-text-subtle: #8A7D72;
    --color-border: #332B24;
    --color-border-strong: #463A31;
    --color-accent: #F08A8A;
    --color-accent-hover: #F7A5A5;
    --color-accent-soft: #2E1F1D;
    --shadow-soft: none;
    --shadow-raised: none;
  }
}
```

## Tailwind v4

将来 Tailwind を使う場合は、同じ値を `@theme` から引く。

```css
@theme {
  --color-bg: #FBF7F3;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F4EDE6;
  --color-text: #2E2723;
  --color-text-muted: #6F645C;
  --color-text-subtle: #9A8E85;
  --color-border: #E7DCD2;
  --color-border-strong: #D5C7BA;
  --color-accent: #D95757;
  --color-accent-hover: #B94343;
  --color-accent-soft: #FBEDEA;

  --font-sans: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", system-ui, sans-serif;

  --text-caption: 13px;
  --text-small: 14px;
  --text-body: 16px;
  --text-lead: 17px;
  --text-h3: 17px;
  --text-h2: 20px;
  --text-h1: 28px;

  --spacing: 4px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}
```

---

## Checklist（ページを追加・変更したとき）

- [ ] インライン `<style>` を書いていない（`styles.css` だけを読む）
- [ ] 生の hex 値をページ内に書いていない（トークン経由）
- [ ] 本文幅が `--measure` を超えていない
- [ ] light / dark の両方で本文コントラストが 4.5:1 以上
- [ ] `:focus-visible` のアウトラインを消していない
- [ ] 見出しは h1 → h2 → h3 の順で飛ばしていない
- [ ] 幅の広いテーブルは `.table-wrap` に入れた
- [ ] 項目名を持つテーブルには `.table-kv` を付けた（狭い画面で縦積みになる）

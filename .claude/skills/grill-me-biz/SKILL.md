---
name: grill-me-biz
description: Interrogate the user one question at a time until the audience, objective, constraints, and success criteria of a non-engineering task are pinned down, then freeze the result into a brief. For vague business work — 企画, 提案, 資料作成, 事業構築, 施策の検討, メール/告知の文面 — where producing it now would mean guessing at the reader and the goal. Use ONLY when the user explicitly asks for it (/grill-me-biz, "業務のほうで詰めて"); never start grilling on your own initiative. For code and product implementation work, use grill-me instead.
---

# grill-me-biz

The non-engineering counterpart to `grill-me`. Same mechanic — one question at a
time until nothing ambiguous is left — but aimed at work whose deliverable is a
document, a plan, or a decision rather than code.

Most bad business documents fail for one of two reasons: the writer never decided
who the reader is, or never decided what the reader should *do* after reading.
Those two are always your first branch.

## Rules

1. **One question per message.** Never batch.
2. **Every question ships with a recommendation** and a one-line reason, plus the
   realistic alternatives. The user should be able to reply "はい" or "2".
3. **Depth-first.** Settle 読み手 and ゴール before anything else; every later
   question depends on them.
4. **Read what exists first.** If the user points at existing material — 既存資料,
   議事録, メモ, 過去の提案書, スプレッドシート — read it before asking. Never ask
   for a fact that is sitting in a file they already gave you.
5. **"任せる" is a new branch, not an answer.** Offer a default, name the
   trade-off, get a decision.
6. **No drafting while grilling.** Do not start writing the deliverable, not even
   an outline, until the brief is frozen and confirmed.
7. **Answer in the user's language.**
8. **Stop when it stops mattering.** If an unknown would not change the
   deliverable, drop it.
9. **Push on the uncomfortable ones.** 予算, 期限, 誰が決裁するのか, 反対しそうな
   人は誰か — these are the questions people skip and then get blocked by. Ask
   them plainly, once, without hedging.

## Procedure

### Phase 0 — Orient (silent)

Restate the request in two or three lines. Read any material referenced. List the
unknowns that actually change the deliverable.

### Phase 1 — Grill

One question at a time, in this shape:

```
Q2. この資料を読んだ相手に、最終的に何をしてほしい？

   推奨: 「来月の定例で予算200万の可否を判断してもらう」まで絞る
        — 判断を求める資料と、情報共有の資料では構成が全く別物になるため
   他の案: (a) 検討の土台として情報共有だけ  (b) 現場に方針を周知して動いてもらう
```

Cover, in roughly this order, skipping anything already settled:

- **読み手** — 誰が読むか / その人が既に知っていること / 前提知識のレベル
- **意思決定者** — 決裁するのは誰か / その人が気にする観点は何か
- **ゴール** — 読み終わった相手に何をしてほしいか（判断・承認・行動・理解）
- **現状と課題** — 今どうなっているか / それを裏付ける数字や事実はあるか
- **制約** — 予算 / 期限 / 使える人員 / 触れてはいけない社内事情
- **選択肢** — 他に検討した案 / なぜそれを選ばないのか
- **成功の定義** — 何がどうなれば成功か / いつ / どう測るか
- **想定される反論** — 誰が何を言ってきそうか / それにどう答えるか
- **成果物の形** — 資料 / メール / 1枚もの / 口頭説明の補助、分量、説明にかけられる時間

### Phase 2 — Freeze

When the branches are exhausted, output the brief and ask for one explicit
confirmation:

```
## 読み手と目的
- 読み手:
- 意思決定者:
- 読後に取ってほしい行動:

## 前提（合意した事実）
- ...

## 決定事項
- ...

## スコープ外
- ...

## 未決（成果物に影響しないため保留）
- ...

## 想定される反論と応答
- ...

## 成果物の仕様
- 形式 / 分量 / 期限:
- 構成:

## 次のステップ
1. ...
```

Then: 「この内容で進めていい？」

### Phase 3 — Hand off

Only after confirmation, produce the deliverable — or save the brief to a file
(e.g. `brief.md`) and let the user start a fresh session with it as the prompt.
For anything sizeable, recommend the second: a clean context produces a better
document than one cluttered with the interview.

## Anti-patterns

- Asking five questions at once.
- Open questions with no recommendation（「どうしますか？」）.
- Skipping 予算・期限・決裁者 because they feel intrusive. They are the questions
  that decide whether the work survives contact with the organisation.
- Grilling a two-line email. Say it does not need this and just write it.
- Starting to draft mid-grill.
- Ending without a written, confirmed brief.

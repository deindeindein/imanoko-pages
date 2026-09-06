---
name: grill-me-biz
description: >-
  Run a one-question-at-a-time requirements interview and confirm a brief for a
  document, business plan, proposal, or decision. Use only when the user invokes
  /grill-me-biz or explicitly requests this interview for non-code work. A vague
  writing or planning request alone is not a trigger. For a code implementation
  spec, use grill-me.
---

# grill-me-biz

The non-engineering counterpart to `grill-me`. Same mechanic — one question at a
time until nothing consequential is left undecided — but aimed at work whose
outcome is a document, a plan, or a decision rather than code.

**First establish the intended outcome and who is affected.**

- Communication work (資料・メール・告知) — identify the reader and the response
  you want from them.
- Plans and decisions (事業構築・施策検討) — identify the decision owner, who
  implements it, and how the outcome will be evaluated. There may be no reader
  yet; do not invent one.

## Rules

1. **One decision or one missing fact per turn.** A single question mark is not
   the test:「誰が読み、いつまでに、いくらで？」is three questions.

2. **Every question ships with numbered options.** Option 1 is your
   recommendation with a one-line reason;「はい」accepts option 1. Always allow a
   custom answer, and offer alternatives only when they are meaningful. For an
   unknown *fact*, recommend how to verify it or how to proceed without it —
   never invent a plausible value and recommend that. Budget unknown means
   「予算未確認のまま、費用比較までを今回の範囲にする」, not「200万を推奨」.

3. **Prerequisites before dependents.** Settle the decisions that constrain many
   others first — intended outcome, scope, hard constraints — then work
   depth-first inside a branch. The coverage list below is a relevance
   checklist, not a fixed order.

4. **Read what exists before asking a factual question.** 既存資料・議事録・
   過去の提案書・数字 — read them first. Keep observed facts, user-reported
   facts, assumptions and decisions distinct; documents can be out of date. If
   sources conflict or are unavailable, say so, and ask only when resolving it
   would change the next stage. **Agreement is not verification** — agreeing
   that「この施策で売上が伸びる」makes it a shared hypothesis, not a fact.

5. **Uncertainty, missing facts and delegation are three different answers.**
   - 未定 — not chosen yet → recommend a default.
   - 知らない — no basis to answer → investigate, or record it as unverified.
   - 任せる — delegating → decide within the delegated scope and record the
     choice for the final confirmation; do not seek approval for each one.

   Delegation does not establish unknown facts and does not expand your
   authority to execute.

6. **Respect the user's intent and preferences, with or without a reason.** Do
   not defend a recommendation merely because it was yours. If a counter-proposal
   conflicts with evidence or an agreed constraint, state the specific conflict
   and offer a workable alternative. After any change, revisit the decisions it
   invalidates — and only those.

7. **Answer clarification requests before resuming the interview.**

8. **Handle interruptions as interruptions.** If the user revises requirements,
   update the affected decisions. If they pause, cancel, or switch tasks,
   suspend the interview and label any checkpoint unconfirmed — never force a
   final confirmation on someone who asked to stop. Resume only when asked.

9. **Answer in the user's language.**

10. **Stop when the next stage has enough to proceed.** Classify each remaining
    consequential unknown as a blocker or as an explicit assumption with a
    validation step; drop the inconsequential ones. After five questions,
    summarise decisions and remaining blockers briefly, then spend the next
    single question offering: continue / delegate the rest / pause.

11. **Ask about money, time and ownership when they could change feasibility or
    adoption.** 予算・期限・承認・運用の引き受け手 — plainly, once, without
    hedging. These are the questions people skip and then get blocked by. Refer
    to roles rather than personal names unless identity is what matters.

12. **Nothing is drafted or changed before confirmation.** No writing the
    deliverable itself, no edits to project files, no external actions.
    Read-only investigation, decision summaries, and the proposed brief —
    including its structure — are allowed. Agreeing that「資料は課題→選択肢→
    提案の構成」is part of the brief, not a draft of it.

## Procedure

### Phase 0 — Orient (silent)

Restate the request in two or three lines. Read any material referenced. List
the unknowns that actually change the outcome.

### Phase 1 — Interview

One question at a time, in this shape:

```
Q2. この資料を読んだ相手に、最終的に何をしてほしい？

  1. 来月の定例で、予算の可否を判断してもらう ← 推奨
     判断を求める資料と情報共有の資料では構成が別物になるため
  2. 検討の土台として情報共有だけ行う
  3. 現場に方針を周知して動いてもらう
```

Coverage checklist — skip anything already settled:

- **成果と影響範囲** — 何がどうなれば成功か / 誰に影響するか
- **担い手** — 意思決定者 / 実行担当 / 運用を引き受ける人
- **読み手**（該当する場合）— 誰が読むか / 既に知っていること / 読後の行動
- **現状と根拠** — 今どうなっているか / 裏付ける数字と出典
- **制約** — 予算 / 期限 / 承認 / 人員 / 触れてはいけない事情
- **選択肢** — 他に検討した案 / なぜ採らないのか
- **評価** — いつ、どう測るか
- **関係者の懸念** — 導入現場の負担 / 運用責任 / 想定される異論
- **成果物の形** — 形式、分量、期限（成果物がある場合）

### Phase 2 — Freeze

```
## 成果と影響範囲
- 目指す結果:
- 影響を受ける人／役割:

## 根拠と前提
- 確認済みの事実（出典）:
- ユーザー申告・未確認:

## 決定事項
- ...

## スコープ外
- ...

## 仮定と確認事項
- 採用する仮定:
- 確認方法・担当・時点:
- 成立しなかった場合に見直す決定:

## 未解決のブロッカー
- ...（残っている間、このブリーフは確定版ではない）

## 関係者の懸念と応答
- ...

## 成果物の受け入れ条件
- [ ] ...
```

受け入れ条件は**成果物として検証できること**を書く。「予算が承認される」は
事業上の結果であって受け入れ条件ではない。「費用・代替案・判断依頼が明記されて
いる」が受け入れ条件。

Then ask exactly one confirmation, naming the artifact **and** what happens next:

- Brief only —「この内容を確定版として、要件整理を終了してよいですか？」
- Production already requested —「このブリーフを確定し、記載した成果物の作成に
  着手してよいですか？」

If the user asks for changes, revise the affected decisions and re-present the
updated brief for confirmation.

### Phase 3 — Hand off

Produce only what the confirmation covered. If the user prefers a fresh session,
write a self-contained handoff: decisions, assumptions, acceptance criteria, and
references to the sources you relied on.

## Scale to the task

A two-line email does not need an interview — say so and go straight to a
compact brief. Skipping the *interview* is not the same as skipping the
*confirmation*: the user still sees what you are about to produce before you
produce it.

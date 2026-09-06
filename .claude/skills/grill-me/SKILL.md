---
name: grill-me
description: >-
  Run a one-question-at-a-time requirements interview and confirm an
  implementation spec for a code change. Use only when the user invokes
  /grill-me or explicitly requests this interview before implementation.
  A vague build request alone is not a trigger. For a non-code brief,
  use grill-me-biz.
---

# grill-me

Force the ambiguity out of a request before any code is written. You ask, the
user answers, and you continue until the next stage has enough decided to
proceed. Then you put the agreed spec up for confirmation.

The user decides intent and priorities. You establish what the codebase actually
says — but code describes the *current implementation*, not necessarily the
intended behaviour.

## Rules

1. **One decision or one missing fact per turn.** A single question mark is not
   the test:「誰が使い、いつまでに、いくらで？」is three questions.

2. **Every question ships with numbered options.** Option 1 is your
   recommendation with a one-line reason;「はい」accepts option 1. Always allow a
   custom answer, and offer alternatives only when they are meaningful. For an
   unknown *fact*, recommend how to verify it or how to proceed without it —
   never invent a plausible value and recommend that.

3. **Prerequisites before dependents.** Settle the decisions that constrain many
   others first — goal, scope, hard constraints — then work depth-first inside a
   branch. The coverage list below is a relevance checklist, not a fixed order.

4. **Investigate before asking a factual question.** Read the relevant code,
   config and tests first. Keep observed facts, user-reported facts, assumptions
   and decisions distinct. If sources conflict or are unavailable, say so, and
   ask only when resolving it would change the next stage. **Agreement is not
   verification.**

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

11. **Nothing is drafted or changed before confirmation.** No implementation, no
    edits to project files, no external actions. Read-only investigation,
    decision summaries, and the proposed spec — including its structure — are
    allowed.

## Procedure

### Phase 0 — Orient (silent)

Restate the request to yourself in two or three lines, read the code it touches,
and list the unknowns that actually change the outcome.

### Phase 1 — Interview

One question at a time, in this shape:

```
Q3. 送信後の画面はどうする？

  1. 同じページ内でフォームを成功メッセージに差し替える ← 推奨
     静的サイトなので遷移先ページを増やさずに済む
  2. サンクスページに遷移する
  3. トーストだけ出してフォームは残す
```

Coverage checklist — skip anything already settled:

- **目的** — what is this for, who uses it, what does success look like
- **スコープ** — what is explicitly in, and what is explicitly *out*
- **制約** — stack, conventions, files that must not change, compatibility
- **振る舞い** — data/state shape, edge cases, error and empty states
- **見た目** — layout, copy, responsive behaviour (if there is UI)
- **非機能** — performance, accessibility, browser support, privacy/security
- **検証** — how we will know it works
- **展開** — migration, rollout, existing data and URLs

### Phase 2 — Freeze

```
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
- ...（残っている間、この仕様は確定版ではない）

## 受け入れ条件
- [ ] ...

## 実装ステップ
1. ...
```

Then ask exactly one confirmation, naming the artifact **and** what happens next:

- Spec only —「この内容を確定版として、要件整理を終了してよいですか？」
- Implementation already requested —「この仕様を確定し、記載した実装に着手してよいですか？」

If the user asks for changes, revise the affected decisions and re-present the
updated spec for confirmation.

### Phase 3 — Hand off

Execute only what the confirmation covered. If the user prefers a fresh session,
write a self-contained handoff: decisions, assumptions, acceptance criteria, and
references to the sources you relied on.

## Scale to the task

A trivial or already-settled task does not need an interview — say so and go
straight to a compact spec. Skipping the *interview* is not the same as skipping
the *confirmation*: the user still sees what you are about to do before you do it.

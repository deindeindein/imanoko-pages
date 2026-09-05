---
name: grill-me
description: Interrogate the user one question at a time until the goal, scope, and design decisions of a task are fully pinned down, then freeze the result into a spec. For vague or half-formed requests ("make it nicer", "add a contact form", "build X") where implementing now would mean guessing. Use ONLY when the user explicitly asks for it (/grill-me, "grill me", "詰めて", "質問して"); never start grilling on your own initiative. For non-engineering work (企画, 提案, 資料作成, 事業構築), use grill-me-biz instead.
---

# grill-me

Force the ambiguity out of a request **before** any code is written. You ask, the
user answers, and you keep going until there is no unresolved decision left that
would change what gets built. Then you write the agreed spec down and stop.

The user is the source of truth about intent. You are the source of truth about
what the codebase already says. Never ask the user something you can answer by
reading the repo.

## Rules

1. **One question per message.** Never batch. A wall of five questions gets one
   lazy answer; a single question gets a real one.
2. **Every question ships with a recommendation.** State your recommended answer
   and a one-line reason, plus the realistic alternatives. The user should be
   able to reply "はい" / "yes" / "2" and move on.
3. **Depth-first, not breadth-first.** Only ask a question whose prerequisites
   are already settled. Treat the design as a decision tree and finish a branch
   before starting the next one.
4. **Read before you ask.** Inspect the relevant files first. Questions about
   facts already in the repo waste the user's turn and lose their trust.
5. **"Not decided yet" / "you decide" is not an answer — it is a new branch.**
   Drill into it: offer a default, explain the trade-off, get a decision.
6. **No implementation while grilling.** No edits, no writes, no "I went ahead
   and started". Reading and searching only.
7. **Answer in the user's language.** Match whatever language they wrote in.
8. **Stop when it stops mattering.** The moment no remaining unknown would change
   the work, stop asking and move to Freeze. Questions with no consequence are
   noise.

## Procedure

### Phase 0 — Orient (silent)

Restate the request to yourself in two or three lines, read the code it touches,
and list the unknowns that actually change the outcome. Discard the rest.

### Phase 1 — Grill

Loop, one question at a time, using this shape:

```
Q3. 送信後の画面はどうする？

   推奨: 同じページ内でフォームを成功メッセージに差し替える
        — 静的サイトなので遷移先ページを増やさずに済む
   他の案: (a) サンクスページに遷移  (b) トーストだけ出してフォームは残す
```

Cover, in roughly this order, skipping anything already settled:

- **目的** — what is this for, who uses it, what does success look like
- **スコープ** — what is explicitly in, and what is explicitly *out*
- **制約** — existing stack, conventions, files that must not change
- **振る舞い** — data/state shape, edge cases, error and empty states
- **見た目** — layout, copy, responsive behaviour (if there is UI)
- **非機能** — performance, accessibility, browser support, privacy/security
- **完了条件** — how we will verify it works
- **展開** — migration, rollout, what happens to existing data or URLs

### Phase 2 — Freeze

When the branches are exhausted, output the spec and ask for a single explicit
confirmation. Do not skip this — it is the artifact the whole exercise exists to
produce.

```
## 決定事項
- ...

## スコープ外
- ...

## 未決（実装に影響しないため保留）
- ...

## 受け入れ条件
- [ ] ...

## 実装ステップ
1. ...
```

Then: 「この内容で進めていい？」

### Phase 3 — Hand off

Only after the user confirms, implement — or, if the user prefers, stop here and
let them start a fresh session with the frozen spec as the prompt.

## Anti-patterns

- Asking five questions at once.
- Asking open questions with no recommendation ("どうしますか？").
- Asking about something a `grep` would have answered.
- Grilling a trivial task. A one-line copy change does not need an interview —
  say so and just do it.
- Drifting into implementation mid-grill.
- Ending without a written, confirmed spec.

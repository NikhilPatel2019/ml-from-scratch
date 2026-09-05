# `.claude/` — how AI help is configured here

These files are checked in on purpose. They make an AI assistant behave as a
mentor in this repository rather than as a solution vending machine, and they do
it the same way for everyone who clones it.

| File | What it does |
|---|---|
| `../CLAUDE.md` | Loaded automatically. Carries the one rule — never write an exercise solution — and the repository's layout, commands and conventions. |
| `settings.json` | Allows the safe commands you run constantly without a prompt each time, and **denies edits to `exercises.py`, `stretch.py` and `test_exercises.py`**. |
| `commands/hint.md` | `/hint` — the smallest next step on an exercise, never the answer. |
| `commands/review.md` | `/review` — review what you already wrote, without rewriting it. |
| `commands/why.md` | `/why` — explain an idea from first principles, for someone with no maths background. |

## Why the deny list matters

`CLAUDE.md` asks an assistant not to write your exercises. `settings.json` makes
it so it cannot, by denying edits to those files outright. Prose is a request;
a deny rule is a wall. The wall is the point — an instruction you can talk a
model out of at 1am is not a rule you have.

You still edit those files yourself, in your editor, which is the whole idea.

If you ever genuinely need an assistant to touch one — say a broken import that
has nothing to do with the exercise — override it in your own
`.claude/settings.local.json`, which is gitignored, and put it back afterwards.

## If you use a different assistant

The content that matters is `CLAUDE.md` at the repository root, and it is plain
Markdown. Point whatever you use at it. The three commands are short prompts;
they will read as instructions to anything that can follow instructions.

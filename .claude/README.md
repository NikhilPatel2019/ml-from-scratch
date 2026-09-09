# `.claude/` — how AI help is configured here

These files are checked in on purpose. They make an AI assistant behave as a
mentor in this repository rather than as a solution vending machine, and they do
it the same way for everyone who clones it.

| File | What it does |
|---|---|
| `../CLAUDE.md` | Loaded automatically. Carries the one rule — never write an exercise solution — and the repository's layout, commands and conventions. |
| `settings.json` | Allows the safe commands you run constantly without a prompt each time, and denies edits to `site/index.html`, which is generated. |
| `commands/hint.md` | `/hint` — the smallest next step on an exercise, never the answer. |
| `commands/review.md` | `/review` — review what you already wrote, without rewriting it. |
| `commands/why.md` | `/why` — explain an idea from first principles, for someone with no maths background. |

## Why there is no deny rule on the exercise files

There used to be. `settings.json` denied edits to `exercises.py`, `stretch.py`
and `test_exercises.py`, on the theory that prose is a request and a deny rule
is a wall.

It was removed, for two reasons that are worth writing down.

**It blocked the wrong people.** Writing a new lesson means writing a stub file
and a test file. Both are denied by that rule, and it cannot tell authoring from
solving — a file full of `raise NotImplementedError` is not an answer to
anything. Every new lesson hit the wall.

**And it was not a wall.** It blocked `Write` and it blocked `cp`, but a Python
one-liner that opens the file and writes to it went straight through. So the
rule stopped the direct route and not the indirect one, which is the wrong way
round: it inconvenienced honest work while stopping nothing determined. A
control that only looks like protection is worse than none, because you rely on
it.

There is also a mechanical trap here. Permission rules are evaluated
**deny, then ask, then allow**, across every settings file — so a deny in
`settings.json` cannot be relaxed by an allow in `settings.local.json`. A deny
rule carries no exceptions. If you add one, it is absolute.

## What actually holds the line

`CLAUDE.md`, and your own preference for learning this properly. That has worked
in practice: the assistant that wrote this paragraph diagnosed a missing
`return` in exercise 2 by naming the line and asking what the function owed its
caller, rather than writing it.

If you want a real mechanical guard rather than an instruction, the tool for it
is a [PreToolUse hook](https://code.claude.com/docs/en/hooks-guide), which sees
the actual edit and can allow a docstring change while rejecting a filled-in
function body. A static path rule cannot make that distinction.

## If you use a different assistant

The content that matters is `CLAUDE.md` at the repository root, and it is plain
Markdown. Point whatever you use at it. The three commands are short prompts;
they will read as instructions to anything that can follow instructions.

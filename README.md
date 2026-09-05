<h1 align="center">ML From Scratch</h1>

<p align="center">
  A ground-up machine learning curriculum for engineers with no maths background.<br>
  Build everything once by hand. Then learn the library that does it for you.
</p>

<p align="center">
  <a href="https://nikhilpatel2019.github.io/ml-from-scratch/"><b>Read the lessons &rarr;</b></a>
</p>

<p align="center">
  <img alt="Python 3.10+" src="https://img.shields.io/badge/python-3.10%2B-3776AB?logo=python&logoColor=white">
  <img alt="Licence: MIT" src="https://img.shields.io/badge/licence-MIT-green">
  <img alt="Lessons" src="https://img.shields.io/badge/lessons-55-blue">
  <img alt="Status: in progress" src="https://img.shields.io/badge/status-in%20progress-orange">
  <a href="https://github.com/NikhilPatel2019/ml-from-scratch/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/NikhilPatel2019/ml-from-scratch/actions/workflows/ci.yml/badge.svg"></a>
</p>

---

## What this is

A complete path from "I have never written a derivative" to "I built a GPT and I understand every line of it". Fifty-five lessons across five phases.

It is not a course. There are no videos to sit through and no lectures. Each lesson is a written explanation, a set of function stubs, and a test suite that tells you when you got it right. **You write every line of code.** That constraint is the entire pedagogy — in a field this saturated with copy-pasteable tutorials, the only reliable signal that you understand something is that you produced it.

## Who it is for

- You can already program, in any language.
- Your maths is rusty, weak, or absent. That is assumed, not held against you.
- You want to understand *why*, not just assemble a pipeline from imports.

If you want to ship an LLM feature by Friday, this is the wrong repository — go read a framework's quickstart. This is the slow path, and it is slow on purpose.

## How it works

Every lesson is one directory containing four things:

| File | What it is |
|---|---|
| `README.md` | The lesson. Read this first. |
| `exercises.py` | Function stubs. **This is the file you edit.** |
| `test_exercises.py` | The tests. Do not edit these. |
| `watch.md` | Curated videos and reading, ordered, with notes on when to watch each. |
| `notes.md` | Questions you answer in your own words when you finish. |

The tests check *how* you solved it, not only the answer — some exercises reject NumPy so you implement the mechanism yourself, and others reject `for` loops so you learn to think in arrays.

## Quick start

```bash
git clone <your-fork-url> ml-from-scratch
cd ml-from-scratch
python -m venv .venv
```

Activate it — `.venv\Scripts\activate` on Windows, `source .venv/bin/activate` elsewhere — then:

```bash
pip install -e ".[dev]"
```

See where you stand:

```bash
progress
```

```
  Phase 1  Foundations                      ██░░░░░░░░░░░░░░░░░░░░░░   1/13   8%
            1.1  done     Vectors and the dot product                  7/7 tests

  Phase 2  Classical Machine Learning       ░░░░░░░░░░░░░░░░░░░░░░░░   0/13   0%
  ...
  Overall  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1/55 lessons  (2%)

  Next up: 1.2 — Vector geometry
```

Then work a lesson:

```bash
progress 1.1
```

Progress is **not self-reported.** A lesson counts as complete when its tests pass, which means you wrote the code. That is the only definition worth having.

## The curriculum

| Phase | Title | Lessons | What you end up with |
|---:|---|---:|---|
| 0 | [Foundations](lessons/01-foundations) | 13 | Minimise a function you have never seen, from scratch |
| 1 | [Classical ML](lessons/02-classical-ml) | 13 | A raw CSV taken to a validated, honestly-evaluated model |
| 2 | [Deep Learning](lessons/03-deep-learning) | 14 | Your own autograd engine, training your own network |
| 3 | [Transformers and LLMs](lessons/04-transformers) | 12 | A working GPT you wrote line by line |
| 4 | [Production](lessons/05-production) | 3 | A model deployed, monitored, and understood |

Full detail, including the reference library, is in **[ROADMAP.md](ROADMAP.md)**.

## Repository layout

```
lessons/                  the curriculum
  curriculum.json         single source of truth: every phase and lesson
  00-foundations/         Phase 1 — the maths, built in code
  01-classical-ml/        Phase 2
  02-deep-learning/       Phase 3
  03-transformers/        Phase 4
  04-production/          Phase 5
src/mlfs/                 the tooling
  cli.py                  the `progress` dashboard
  harness.py              shared test runner used by every lesson
site/                     the published reading companion
  build.py                assembles site/index.html from site/src/
ROADMAP.md                the full plan, with resources
```

### Two places, one curriculum

The **[web version](https://nikhilpatel2019.github.io/ml-from-scratch/)** is for reading and orientation — the full curriculum, the lesson text, and a checklist stored in your browser.

This **repository** is where the learning happens, because the learning is the writing of code. It is also where progress is measured honestly: the site's checkboxes are self-reported, whereas `progress` counts passing tests.

In-browser Python was deliberately not built into the site. Learning the real toolchain — a virtual environment, a test runner, a terminal — is part of becoming useful at this, not an obstacle in front of it.

## A note on learning this with an AI

This curriculum was written with Claude acting as a tutor, and it is a genuinely good way to learn — on one condition.

The failure mode is obvious once named: you ask for help, the model writes the solution, you read it, it makes sense, and you feel you have learned something. You have not. Recognising correct code is a different skill from producing it, and only one of them transfers.

So the rule, for you and for whatever model you ask: **it explains, reviews and hints; you write.** Ask for a smaller sub-problem when you are stuck. Ask *why* your working code is bad. Do not ask for the answer. The stubs are stubs on purpose.

That rule is configured, not just requested. [`CLAUDE.md`](CLAUDE.md) states it and is loaded automatically; [`.claude/settings.json`](.claude/settings.json) denies edits to `exercises.py`, `stretch.py` and `test_exercises.py` outright, so an assistant cannot write your answers even if you talk it into wanting to. Three commands come with it:

| | |
|---|---|
| `/hint` | the smallest next step on an exercise, never the answer |
| `/review` | review what you already wrote, without rewriting it |
| `/why` | explain an idea from first principles, assuming no maths background |

Using something other than Claude Code? Point it at `CLAUDE.md` — it is plain Markdown, and [`.claude/README.md`](.claude/README.md) explains the rest.

## Contributing

Corrections, clearer explanations and better exercises are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please do not submit solutions to the exercises.

## Licence

[MIT](LICENSE). Use it, fork it, teach from it.

# Restructure brief — ML From Scratch site

> **Status.** Steps 1, 2 and 5 done (5 pulled forward: steps 3, 4 and 6 all display test state, so building them against a placeholder then revisiting all three was the more expensive order). The dark-mode toggle from step 8 landed early. Lesson
> ids are 1-based (phases 1–5); this brief has been renumbered to match.
> Decision on step 5: the published site shows the curriculum, a local run reads
> `progress.json`.

Implementation spec for Claude Code. Based on a UX review of `site/` (build.py, src/shell.html,
src/app.js, src/styles.css, src/widgets.js, src/lessons/1.1/*).

**How to work through this:** one step per commit, in order. Steps 1–4 are the structural ones and
carry most of the value; 5–8 are cheap. Do not start a step until the previous one builds and the
page still works with `progress.json` absent. Ask me before adding content that doesn't exist yet
(new lesson prose, new library items) — every step below is a rearrangement of material that is
already there, or reads data the repo already produces.

**Non-goals.** No framework, no build step beyond `build.py`, no server, no npm. The site stays a
single self-contained `index.html`. Keep the existing visual language exactly: Newsreader for
headings, IBM Plex Sans for UI, IBM Plex Mono for code and labels, the current palette, the current
spacing. This is a restructure, not a restyle.

---

## Step 1 — Collapse the unwritten curriculum

**Problem.** The rail lists all 55 lessons as equal clickable rows with checkboxes. 54 of them
resolve to the same "not written yet" placeholder, so almost every click is a dead end, and each one
costs a click to discover.

**Change.** Split the rail into two zones:

- **Available now** — lessons that have a `src/lessons/<id>/` directory. Full rows, as today.
- **Ahead** — one non-clickable line per phase: number, title, and `· N planned`. Keep each phase's
  milestone sentence available (line below, or a title attribute). Optionally expandable to show
  lesson titles, collapsed by default.

Derive "written" from what `build.py` actually found on disk — do not hand-maintain a flag in
`curriculum.json`. `build.py` should emit that fact into the curriculum JSON (e.g. `"written": true`
per lesson) so `app.js` never guesses.

**Acceptance.** Every clickable lesson row in the rail leads to real content. Adding a new
`src/lessons/1.2/` directory and rebuilding moves 1.2 from "Ahead" into "Available now" with no
other edit. The full 55-lesson ambition is still legible on the Path page.

---

## Step 2 — Four areas instead of one  ✅ done

**Problem.** Materials, curriculum and exercises all hang off a single axis — the lesson you happen
to be in. A paper, a snippet, a definition, or a resource spanning four lessons has nowhere to live.

**Change.** Four top-level areas in the rail:

| Area | Answers | Content |
|---|---|---|
| **Continue** | "where was I?" | The landing page. Step 3 below. |
| **Path** | "what's the shape of this?" | The whole curriculum: 5 phases, the ruler graphic (moved here from home), milestones. Phases get real pages. |
| **Practice** | "what's still red?" | Every exercise across every lesson with its test status. Filter to failing. |
| **Library** | "where did I read that?" | Materials, notes, snippets, glossary — tagged by lesson, browsable on their own. |

Give phases a real page (milestone, lesson list, the ruler for that phase, what it assumes) and point
the second breadcrumb at it — today that crumb opens the phase's *first lesson*, which teaches the
user not to trust breadcrumbs.

Library needs one new data file next to `curriculum.json` — e.g. `src/library.json`, entries of
`{id, kind: note|paper|video|snippet|term, title, url?, body?, lessons: ["1.1"]}` — inlined by
`build.py` the same way curriculum data is. Seed it from the existing `resources.html` links, and keep
showing a lesson's own resources inside that lesson; Library is an *additional* door, not a move.

**Note on self-pacing.** Nothing in this site is time-based. No streaks, no calendar, no "day 6", no
"last studied". Continue means "the next thing", not "today's thing".

**Acceptance.** Four areas reachable from the rail. A resource is findable without remembering which
lesson cited it. Practice lists exercises from every written lesson in one view.

---

## Step 3 — Rebuild the landing page around the next action

**Problem.** The home page is a prospectus: it explains the curriculum three times at three levels of
zoom. "How this works" and "Where the code lives" are useful exactly once and then sit permanently
between the user and the only thing they came for. Three separate readouts all render the same
`0 / 55`.

**Change.** Above the fold, one **Continue** card: phase, lesson, which step inside the lesson, tests
passing, which exercises are still red, and a primary button into that step. Next to the button, the
copyable command for that lesson.

Below it, two small cards: *Where you are* (one progress line + the phase milestone, linking to Path)
and *In your library* (three most recent items, linking to Library). Nothing else.

Move out:

- `Ruler card` → Path page (a 55-tick whole-curriculum chart belongs where the curriculum is the subject).
- `How this works` + `Where the code lives` → a **Setup** page, linked from a quiet footer row and
  shown full-screen on a first visit with no recorded progress.
- Per-phase progress bars in the rail and repeated counts on phase cards → delete. One canonical
  progress readout, in the top bar.

**Acceptance.** Everything above the fold answers "what do I do now". The word "0" is not the largest
element on the page. Setup content is one click away and never in the way twice.

---

## Step 4 — The lesson is a sequence, not five tabs

**Problem.** Overview → Lesson → Exercises → Walkthrough → Resources is an *order* — the lesson copy
says so twice. Tabs mean "alternatives, any order", hold no state, and tell you nothing about where
you stopped. The prose has to carry sequencing the interface contradicts.

**Change.** A four-step stepper with state. Steps stay clickable — this is guidance, not a lock.

1. **Read** — the lesson and its widgets. Ends: "ready to write code?"
2. **Implement** — the exercise rows and their test status (step 6 below). Ends by naming what's left.
3. **Compare** — the walkthrough, behind one interstitial while tests are still red (step 7 below).
4. **Close out** — the "you are done when" questions, the completion control, and the link onward.

Each step label shows standing ("Step 2 · 5 of 7", "Step 1 · done"). Each step ends by naming the next
action.

**Delete the Overview tab.** Its lesson-specific parts relocate:

- outcomes, prerequisites, maths introduced, exercise count → a compact **brief** in the lesson header,
  visible on every step (it's worth re-reading);
- "you are done when" → step 4, next to the completion control, where it's a gate not a preamble;
- "how to work through it" → nothing. The stepper *is* that explanation. It currently restates the tab
  bar one row below the tab bar, and is itself a near-copy of the home page's "How this works".

Resources stop being a tab: show them in the lesson footer and in Library.

In `build.py`, `SECTIONS` already models section-per-file — let it be the step order it effectively is:
drop `overview.html`, add `brief.html`. Persist the current step per lesson alongside existing
progress state.

**Acceptance.** No lesson prose explains what order to do things in. Reopening a lesson returns to the
step you left. The stepper communicates progress within a lesson at a glance.

---

## Step 5 — Real test results, one source of truth  ✅ done

**Problem.** Seven functions, a test runner, seven pass/fail results, and none of it appears in the
UI. Meanwhile step 04 of "How this works" tells the user the site's progress is self-reported and that
the repo is "the definition worth trusting" — and the site then renders the untrusted number in its
largest type.

**Change.** Add a `--json` mode to the progress command that writes `site/progress.json`:

```json
{
  "generated": "<iso8601>",
  "lessons": {
    "1.1": {
      "exercises": [
        {"name": "dot_product", "tests_passed": 4, "tests_total": 4, "status": "pass"},
        {"name": "cosine_similarity", "tests_passed": 2, "tests_total": 3, "status": "fail",
         "message": "assert 1.0 == 0.9999999"},
        {"name": "rank_documents", "tests_passed": 0, "tests_total": 3, "status": "not_run"},
        {"name": "normalise_corpus", "status": "not_run", "optional": true}
      ]
    }
  }
}
```

`app.js` fetches it on load and degrades silently to today's behaviour if the file is absent (it must
stay in `.gitignore` — it's local state, not source). Tests passed becomes the headline metric; the
hand tick survives as an explicitly labelled override ("marked by hand"). Lesson completion is then
*derived* rather than self-reported.

If a fetch is impossible in the user's setup, fall back to a textarea that parses pasted runner
output. Either way: **the site never invents a pass.**

**Acceptance.** The site and the repo cannot disagree about what passes. The largest number on any
screen comes from the test runner.

---

## Step 6 — Exercises as rows with status

Inside step 2 of the lesson: one row per exercise — status marker, function name, one-line
description, tests passed, and for a failure the assertion message on one line. Stretch exercises are
visually optional, not just labelled optional. Above the rows, the command to run, copyable — a code
block you can't copy from is a poster of a command.

**Acceptance.** From the exercises step alone, the user can tell what's green, what's red, why it's
red, and what to type next.

---

## Step 7 — Protect the walkthrough

The curriculum's stated principle is that nobody hands you the answer. Individual solutions are
correctly collapsed behind a deliberate click — apply the same friction one level up: entering step 3
with failing tests shows a short interstitial ("2 exercises are still red — recognising correct code
is a different skill from producing it") with *Back to the exercises* as the primary action and *Open
it anyway* as the secondary. Friction, not a lock. Once the lesson is complete, it opens straight
through.

---

## Step 8 — Small fixes

- **⌘K search** over lesson ids, titles, section headings, and library items. Highest value per line
  on this list — six months in, the question is "where did the chain rule bit live?", not "what is
  lesson 2.4?". Add `j`/`k` or arrow navigation in the rail while you're there.
- **Dark mode toggle.** `styles.css` defines a full dark palette but honours it only via
  `prefers-color-scheme`, so the site is dark with no recourse on a dark-set machine and light with no
  recourse otherwise. Add a two-state light/dark switch next to the progress readout: it sets
  `data-theme` on `<html>`, persists to `localStorage`, and defaults to the OS setting. Change the
  media query to `:root:not([data-theme="light"])` so an explicit choice wins.
- **Drop the strike-through** on completed lessons — it reads as cancelled, not achieved. Tick plus
  muted title is enough.
- **One hit target per rail row.** The 15px checkbox butted against the link causes accidental ticks;
  the rail shows state read-only, and completion is a lesson-page act.
- **Don't hide the on-this-page rail below 1280px** — that's most laptops in a non-maximised window.
  Fold it into a "sections" control in the step header instead.
- **One route home.** The brand is it. The rail's "Overview" button, the breadcrumb's "Overview", and
  the footer's "← Overview" all do the same thing; the footer keeps only previous/next.
- **Move "Clear my progress"** off every page to Setup, behind a real confirm, with progress
  export/import next to it — it's the only irreversible action in the product and progress is
  device-local with no way to carry it to a new laptop.

---

## Review checklist

- [ ] Every clickable lesson leads to real content.
- [ ] Nothing in the UI is time-based.
- [ ] Home page's largest element is the next action.
- [ ] No prose explains the order of steps.
- [x] Progress shown = tests passed, or explicitly labelled as a manual override.
- [x] Site works with `progress.json` missing.
- [ ] Light and dark both switchable and both legible.
- [ ] Still one self-contained `index.html` from `python build.py`.

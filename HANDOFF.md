# Restructure brief — ML From Scratch site

Implementation spec, from a UX review of `site/`. One step per commit, in order.
Do not start a step until the previous one builds and the page still works with
`progress.json` absent.

**Non-goals.** No framework, no build step beyond `build.py`, no server, no npm. The site
stays a single self-contained `index.html`. Keep the existing visual language exactly:
Newsreader for headings, IBM Plex Sans for UI, IBM Plex Mono for code and labels, the
current palette and spacing. This is a restructure, not a restyle.

---

## Step 1 — Collapse the unwritten curriculum ✅ done

Split the rail into **Available now** (lessons with a `src/lessons/<id>/` directory, full
rows) and **Ahead** (one non-clickable line per phase: number, title, `N planned`, with the
milestone available). Derive written-ness from what `build.py` finds on disk — emit
`"written": true` per lesson into the curriculum JSON so `app.js` never guesses.

**Acceptance.** Every clickable lesson row leads to real content. Adding a new
`src/lessons/0.2/` and rebuilding moves 0.2 into "Available now" with no other edit. The
full 55-lesson ambition is still legible.

## Step 2 — Four areas instead of one

Four top-level areas in the rail:

| Area | Answers | Content |
|---|---|---|
| **Continue** | "where was I?" | The landing page (step 3). |
| **Path** | "what's the shape of this?" | Whole curriculum: 5 phases, the ruler graphic (moved from home), milestones. Phases get real pages. |
| **Practice** | "what's still red?" | Every exercise across every lesson with test status. Filter to failing. |
| **Library** | "where did I read that?" | Materials, notes, snippets, glossary — tagged by lesson. |

Give phases a real page and point the second breadcrumb at it. Library needs
`src/library.json`: `{id, kind: note|paper|video|snippet|term, title, url?, body?, lessons: ["0.1"]}`,
inlined by `build.py`. Seed from existing `resources.html` links; keep a lesson's own
resources in the lesson. Library is an additional door, not a move.

**Nothing is time-based.** No streaks, no calendar, no "day 6". Continue means "the next
thing", not "today's thing".

## Step 3 — Rebuild the landing page around the next action

One **Continue** card above the fold: phase, lesson, step within the lesson, tests passing,
which exercises are red, primary button into that step, copyable command. Below: two small
cards — *Where you are* and *In your library*. Nothing else.

Move the ruler card to Path. Move "How this works" and "Where the code lives" to a **Setup**
page, linked from a quiet footer and shown on a first visit with no progress. Delete
per-phase progress bars in the rail and repeated counts on phase cards — one canonical
progress readout, in the top bar.

**Acceptance.** Everything above the fold answers "what do I do now". The word "0" is not
the largest element on the page.

## Step 4 — The lesson is a sequence, not five tabs

A four-step stepper with state; steps stay clickable.

1. **Read** — the lesson and its widgets.
2. **Implement** — exercise rows and test status.
3. **Compare** — the walkthrough, behind an interstitial while tests are red.
4. **Close out** — the "you are done when" questions, completion control, link onward.

Each label shows standing ("Step 2 · 5 of 7"). **Delete the Overview tab**: outcomes,
prerequisites and exercise count become a compact **brief** in the lesson header; "you are
done when" moves to step 4; "how to work through it" is deleted — the stepper is that
explanation. Resources move to the lesson footer and Library.

In `build.py`, drop `overview.html`, add `brief.html`. Persist the current step per lesson.

**Acceptance.** No lesson prose explains what order to do things in. Reopening a lesson
returns to the step you left.

## Step 5 — Real test results, one source of truth

`progress --json` writes `site/progress.json`:

```json
{
  "generated": "<iso8601>",
  "lessons": {
    "0.1": {
      "exercises": [
        {"name": "dot_product", "tests_passed": 4, "tests_total": 4, "status": "pass"},
        {"name": "cosine_similarity", "tests_passed": 2, "tests_total": 3, "status": "fail",
         "message": "assert 1.0 == 0.9999999"},
        {"name": "rank_documents", "tests_passed": 0, "tests_total": 3, "status": "not_run"}
      ]
    }
  }
}
```

`app.js` fetches it on load and degrades silently if absent (it stays in `.gitignore` — it is
local state, not source). Tests passed becomes the headline metric; the hand tick survives as
an explicitly labelled override. **The site never invents a pass.**

*Decision taken:* the published site shows the curriculum; a local run reads live
`progress.json` and shows real state. Two modes, both honest.

## Step 6 — Exercises as rows with status

Inside step 2: one row per exercise — status marker, function name, one-line description,
tests passed, and for a failure the assertion message. Stretch exercises visually optional.
Above the rows, the command to run, copyable.

## Step 7 — Protect the walkthrough

Entering step 3 with failing tests shows a short interstitial ("2 exercises are still red —
recognising correct code is a different skill from producing it") with *Back to the
exercises* primary and *Open it anyway* secondary. Friction, not a lock. Once complete, it
opens straight through.

## Step 8 — Small fixes

- **⌘K search** over lesson ids, titles, section headings, library items. Plus `j`/`k` in the rail.
- **Dark mode toggle.** ✅ done ahead of order.
- **Drop the strike-through** on completed lessons — reads as cancelled, not achieved.
- **One hit target per rail row** — the rail shows state read-only; completion is a lesson-page act.
- **Don't hide the on-this-page rail below 1280px** — fold it into a "sections" control instead.
- **One route home.** The brand. The footer keeps only previous/next.
- **Move "Clear my progress"** to Setup, behind a confirm, with export/import beside it.

---

## Review checklist

- [x] Every clickable lesson leads to real content.
- [ ] Nothing in the UI is time-based.
- [ ] Home page's largest element is the next action.
- [ ] No prose explains the order of steps.
- [ ] Progress shown = tests passed, or explicitly labelled as a manual override.
- [ ] Site works with `progress.json` missing.
- [x] Light and dark both switchable and both legible.
- [x] Still one self-contained `index.html` from `python build.py`.

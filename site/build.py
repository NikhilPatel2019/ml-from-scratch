#!/usr/bin/env python3
"""Assemble site/src/* into the single self-contained page at site/index.html.

The published page must be one file with no runtime build step, but a single
2000-line file is not something anyone should have to edit. So the source lives
split by concern under site/src/ and this script concatenates it.

Lessons are authored as a directory of sections:

    site/src/lessons/1.1/brief.html        header, shown on every step
    site/src/lessons/1.1/lesson.html       step 1, Read
    site/src/lessons/1.1/exercises.html    step 2, Implement
    site/src/lessons/1.1/walkthrough.html  step 3, Compare
    site/src/lessons/1.1/closeout.html     step 4, Close out
    site/src/lessons/1.1/resources.html    footer

Only the sections that exist are emitted, so a lesson with no stretch material
simply has no Compare step.

Curriculum data is read from lessons/curriculum.json — the same file the
progress command uses — so the site and the dashboard can never disagree about
what lessons exist.

    python site/build.py
"""

from __future__ import annotations

import ast
import html
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent
SRC = SITE / "src"
OUT = SITE / "index.html"

# Canonical order. "lesson", "exercises", "walkthrough" and "closeout" are the
# four steps of the stepper, in that order; "brief" is the lesson header and
# "resources" the footer. A lesson may omit any of them.
SECTIONS = ["brief", "lesson", "exercises", "walkthrough", "closeout", "resources"]

# Deliberately ASCII-only: this comment precedes the <meta charset> in the
# output, and non-ASCII bytes ahead of the encoding declaration are exactly the
# thing that makes a parser guess wrong.
BANNER = """<!--
  GENERATED FILE - do not edit.

  Source:  site/src/          (styles.css, app.js, widgets.js, lessons/<id>/*.html)
  Data:    lessons/curriculum.json
  Rebuild: python site/build.py
-->
"""


def read(*parts: str) -> str:
    path = SRC.joinpath(*parts)
    if not path.exists():
        sys.exit(f"missing source file: {path}")
    return path.read_text(encoding="utf-8").strip()


def lesson_sort_key(name: str) -> list[int]:
    return [int(part) for part in name.split(".") if part.isdigit()]


def lesson_templates() -> tuple[str, dict[str, list[str]]]:
    """One <template> per lesson section, plus a map of lesson id -> sections."""
    folder = SRC / "lessons"
    blocks: list[str] = []
    sections: dict[str, list[str]] = {}

    for lesson_dir in sorted(
        (p for p in folder.iterdir() if p.is_dir()),
        key=lambda p: lesson_sort_key(p.name),
    ):
        stray = sorted(p.stem for p in lesson_dir.glob("*.html") if p.stem not in SECTIONS)
        if stray:
            sys.exit(
                f"{lesson_dir.name}: unrecognised section file(s) {stray}. "
                f"Valid sections: {SECTIONS}"
            )

        found = []
        for name in SECTIONS:
            path = lesson_dir / f"{name}.html"
            if not path.exists():
                continue
            found.append(name)
            blocks.append(
                f'<template id="lesson-{lesson_dir.name}-{name}">\n'
                f'{path.read_text(encoding="utf-8").strip()}\n'
                f"</template>"
            )

        if not found:
            sys.exit(f"{lesson_dir.name}: directory contains no section files")
        sections[lesson_dir.name] = found

    return "\n\n".join(blocks), sections


def section_headings(lesson_dir: Path, sections: list[str]) -> list[dict]:
    """Every <h2> in a lesson, tagged with the step it lives in.

    Search has to answer "where did the chain rule bit live", which means it
    needs headings, not just lesson titles. Scraped from the section files at
    build time so nobody maintains a second list.
    """
    out = []
    for name in sections:
        path = lesson_dir / f"{name}.html"
        if not path.exists():
            continue
        for text in re.findall(r"<h2[^>]*>(.*?)</h2>", path.read_text(encoding="utf-8"), re.S):
            clean = re.sub(r"<[^>]+>", "", text)
            clean = html.unescape(clean).strip()
            if clean:
                out.append({"step": name, "text": clean})
    return out


def lesson_exercises(lesson_dir: Path) -> list[dict]:
    """Function name + one-line summary for each exercise, read from the repo.

    Practice needs to list every exercise across every lesson, and the authority
    on what the exercises are is exercises.py itself — not a list anyone has to
    keep in step with it. Parsed with ast rather than imported, so the build
    never executes lesson code.
    """
    path = lesson_dir / "exercises.py"
    if not path.exists():
        return []
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except SyntaxError:
        return []                      # a half-written solution must not break the build

    out = []
    for node in tree.body:
        if not isinstance(node, ast.FunctionDef) or node.name.startswith("_"):
            continue
        doc = ast.get_docstring(node) or ""
        first = doc.strip().splitlines()[0] if doc.strip() else node.name
        # "EXERCISE 1 — the dot product, by hand." -> "the dot product, by hand"
        summary = re.sub(r"^EXERCISE\s+\d+\s*[—-]\s*", "", first).rstrip(".")
        optional = node.name == "benchmark" or "stretch" in doc.lower()[:80]
        out.append({"name": node.name, "summary": summary, "optional": optional})
    return [e for e in out if e["name"] != "benchmark"]


def main() -> int:
    curriculum = json.loads(
        (ROOT / "lessons" / "curriculum.json").read_text(encoding="utf-8")
    )

    # Read the disk first: whether a lesson is written is a fact about what
    # exists under site/src/lessons/, not a flag anyone should maintain by hand.
    templates, sections = lesson_templates()

    # The page needs only what it renders; drop repo-only fields such as `dir`.
    trimmed = {
        "phases": [
            {
                "id": p["id"], "number": p["number"], "title": p["title"],
                "subtitle": p["subtitle"], "blurb": p["blurb"], "milestone": p["milestone"],
                "lessons": [
                    {"id": les["id"], "title": les["title"], "summary": les["summary"],
                     "status": les.get("status", "planned"),
                     "written": les["id"] in sections}
                    for les in p["lessons"]
                ],
            }
            for p in curriculum["phases"]
        ]
    }

    # Practice lists exercises from every written lesson, so they travel with the
    # curriculum data rather than being restated in the page.
    for phase, raw_phase in zip(trimmed["phases"], curriculum["phases"], strict=True):
        for les, raw in zip(phase["lessons"], raw_phase["lessons"], strict=True):
            if "dir" in raw:
                ex = lesson_exercises(ROOT / raw["dir"])
                if ex:
                    les["exercises"] = ex
            if les["id"] in sections:
                heads = section_headings(SRC / "lessons" / les["id"], sections[les["id"]])
                if heads:
                    les["headings"] = heads

    trimmed["sections"] = sections
    trimmed["library"] = json.loads((SRC / "library.json").read_text(encoding="utf-8"))["items"]
    total = sum(len(p["lessons"]) for p in trimmed["phases"])
    known = {les["id"] for p in trimmed["phases"] for les in p["lessons"]}

    # Every lesson marked available must have content, or the page shows a
    # "ready" badge over a placeholder.
    advertised = {
        les["id"] for p in trimmed["phases"] for les in p["lessons"]
        if les["status"] == "available"
    }
    missing = advertised - set(sections)
    if missing:
        sys.exit(f"lessons marked available with no content: {sorted(missing)}")

    orphans = set(sections) - known
    if orphans:
        sys.exit(f"content for lessons not in curriculum.json: {sorted(orphans)}")

    parts = [
        BANNER,
        read("head.html"),
        "<style>\n" + read("styles.css") + "\n</style>",
        read("shell.html"),
        '<script type="application/json" id="curriculum-data">',
        json.dumps(trimmed, ensure_ascii=False, separators=(",", ":")),
        "</script>",
        templates,
        "<script>\n" + read("widgets.js") + "\n</script>",
        "<script>\n" + read("app.js") + "\n</script>",
    ]

    OUT.write_text("\n\n".join(parts) + "\n", encoding="utf-8")

    print(f"built {OUT.relative_to(ROOT)}")
    print(f"  {total} lessons, {len(sections)} with content")
    for lid, names in sections.items():
        print(f"    {lid}: {', '.join(names)}")
    print(f"  {OUT.stat().st_size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

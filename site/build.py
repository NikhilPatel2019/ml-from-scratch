#!/usr/bin/env python3
"""Assemble site/src/* into the single self-contained page at site/index.html.

The published page must be one file with no runtime build step, but a single
2000-line file is not something anyone should have to edit. So the source lives
split by concern under site/src/ and this script concatenates it.

Lessons are authored as a directory of sections:

    site/src/lessons/0.1/overview.html
    site/src/lessons/0.1/lesson.html
    site/src/lessons/0.1/exercises.html
    site/src/lessons/0.1/walkthrough.html
    site/src/lessons/0.1/resources.html

Each becomes a tab on the lesson page, in the order given by SECTIONS below.
Only the sections that exist are emitted, so a lesson with no stretch material
simply has no walkthrough tab.

Curriculum data is read from lessons/curriculum.json — the same file the
progress command uses — so the site and the dashboard can never disagree about
what lessons exist.

    python site/build.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent
SRC = SITE / "src"
OUT = SITE / "index.html"

# Canonical tab order. A lesson may omit any of these.
SECTIONS = ["overview", "lesson", "exercises", "walkthrough", "resources"]

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

    trimmed["sections"] = sections
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

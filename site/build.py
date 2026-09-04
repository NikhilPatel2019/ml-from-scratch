#!/usr/bin/env python3
"""Assemble site/src/* into the single self-contained page at site/index.html.

The published artifact must be one file with no runtime build step, but a single
1500-line file is not something anyone should have to edit. So the source lives
split by concern under site/src/ and this script concatenates it.

Curriculum data is read from lessons/curriculum.json — the same file
the progress command uses — so the site and the dashboard can never disagree about what
lessons exist.

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

BANNER = """<!--
  GENERATED FILE — do not edit.

  Source:  site/src/          (styles.css, app.js, widgets.js, lessons/*.html)
  Data:    lessons/curriculum.json
  Rebuild: python site/build.py
-->
"""


def read(*parts: str) -> str:
    path = SRC.joinpath(*parts)
    if not path.exists():
        sys.exit(f"missing source file: {path}")
    return path.read_text(encoding="utf-8").strip()


def lesson_templates() -> tuple[str, list[str]]:
    """Wrap each site/src/lessons/<id>.html in a <template>, keyed by lesson id."""
    folder = SRC / "lessons"
    out, ids = [], []
    for path in sorted(folder.glob("*.html"), key=lambda p: [
        int(part) for part in p.stem.split(".") if part.isdigit()
    ]):
        ids.append(path.stem)
        out.append(
            f'<template id="lesson-{path.stem}">\n'
            f'{path.read_text(encoding="utf-8").strip()}\n'
            f"</template>"
        )
    return "\n\n".join(out), ids


def main() -> int:
    curriculum = json.loads((ROOT / "lessons" / "curriculum.json").read_text(encoding="utf-8"))

    # The page needs only what it renders; drop repo-only fields such as `dir`.
    trimmed = {
        "phases": [
            {
                "id": p["id"], "number": p["number"], "title": p["title"],
                "subtitle": p["subtitle"], "blurb": p["blurb"], "milestone": p["milestone"],
                "lessons": [
                    {"id": les["id"], "title": les["title"], "summary": les["summary"],
                     "status": les.get("status", "planned")}
                    for les in p["lessons"]
                ],
            }
            for p in curriculum["phases"]
        ]
    }

    templates, written = lesson_templates()
    total = sum(len(p["lessons"]) for p in trimmed["phases"])

    # Every lesson marked available must have content, or the page shows a
    # "ready" badge over a placeholder.
    advertised = {
        les["id"] for p in trimmed["phases"] for les in p["lessons"]
        if les["status"] == "available"
    }
    missing = advertised - set(written)
    if missing:
        sys.exit(f"lessons marked available with no content: {sorted(missing)}")

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

    size = OUT.stat().st_size
    print(f"built {OUT.relative_to(ROOT)}")
    print(f"  {total} lessons, {len(written)} with content ({', '.join(written)})")
    print(f"  {size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Where am I?

    progress            full dashboard across every phase
    progress 0.1        run one lesson's tests, verbosely
    progress --json     machine-readable, for tooling

Installed as the `progress` command by `pip install -e .`. Also runnable as
`python -m mlfs.cli` if you would rather not rely on the console script.

Progress here is not self-reported. A lesson counts as done when its tests pass,
which means you wrote the code. That is the only definition worth having.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from .harness import PASS, TODO, bar, enable_utf8, report, run_lesson

enable_utf8()


def find_root(start: Path | None = None) -> Path:
    """Walk up from this file until we find the repository root.

    Keyed on pyproject.toml rather than a fixed number of parent hops, so the
    layout can move again without this silently resolving somewhere wrong.
    """
    here = (start or Path(__file__)).resolve()
    for candidate in [here, *here.parents]:
        if (candidate / "pyproject.toml").is_file():
            return candidate
    raise RuntimeError("could not locate the repository root (no pyproject.toml found)")


ROOT = find_root()
CURRICULUM = ROOT / "lessons" / "curriculum.json"


def load_curriculum() -> dict:
    with CURRICULUM.open(encoding="utf-8") as f:
        return json.load(f)


def lesson_state(lesson: dict) -> dict:
    """Resolve one lesson to {status, passed, total}."""
    state = {"id": lesson["id"], "title": lesson["title"],
             "status": lesson.get("status", "planned"), "passed": 0, "total": 0}

    if lesson.get("status") != "available" or "dir" not in lesson:
        return state

    results = run_lesson(ROOT / lesson["dir"])
    state["total"] = len(results)
    state["passed"] = sum(1 for r in results if r.status == PASS)
    if state["total"] and state["passed"] == state["total"]:
        state["status"] = "complete"
    elif any(r.status != TODO for r in results):
        state["status"] = "started"
    return state


def dashboard(curriculum: dict) -> None:
    print(f"\n  {curriculum['title']}")
    print(f"  {curriculum['tagline']}\n")

    grand_done = grand_total = 0

    for phase in curriculum["phases"]:
        states = [lesson_state(les) for les in phase["lessons"]]
        done = sum(1 for s in states if s["status"] == "complete")
        total = len(states)
        grand_done += done
        grand_total += total

        pct = f"{done / total * 100:3.0f}%" if total else "  -"
        print(f"  Phase {phase['number']}  {phase['title']:<32} "
              f"{bar(done, total)}  {done:>2}/{total:<2} {pct}")

        for s in states:
            if s["status"] == "planned":
                continue
            if s["status"] == "complete":
                mark, detail = "done   ", f"{s['passed']}/{s['total']} tests"
            elif s["status"] == "started":
                mark, detail = "started", f"{s['passed']}/{s['total']} tests"
            else:
                mark, detail = "open   ", "not started"
            print(f"           {s['id']:>4}  {mark}  {s['title']:<44} {detail}")
        print()

    pct = grand_done / grand_total * 100 if grand_total else 0
    print(f"  Overall  {bar(grand_done, grand_total, 40)}  "
          f"{grand_done}/{grand_total} lessons  ({pct:.0f}%)\n")

    nxt = next((les for ph in curriculum["phases"] for les in ph["lessons"]
                if les.get("status") == "available"
                and lesson_state(les)["status"] != "complete"), None)
    if nxt:
        print(f"  Next up: {nxt['id']} — {nxt['title']}")
        if "dir" in nxt:
            print(f"           {nxt['dir']}/README.md\n")
    else:
        print("  Everything written so far is complete. Ask for the next lesson.\n")


def one_lesson(curriculum: dict, lesson_id: str) -> int:
    for phase in curriculum["phases"]:
        for lesson in phase["lessons"]:
            if lesson["id"] != lesson_id:
                continue
            if lesson.get("status") != "available":
                print(f"\n  Lesson {lesson_id} — {lesson['title']}")
                print("  Not written yet.\n")
                return 0
            print(f"\n  Lesson {lesson_id} — {lesson['title']}\n")
            results = run_lesson(ROOT / lesson["dir"])
            report(results)
            passed = sum(1 for r in results if r.status == PASS)
            print(f"\n  {passed}/{len(results)} passing\n")
            return 0 if passed == len(results) else 1
    print(f"\n  No lesson with id {lesson_id!r}. Try: progress\n")
    return 2


def main(argv: list[str] | None = None) -> int:
    curriculum = load_curriculum()
    args = list(sys.argv[1:] if argv is None else argv)

    if args and args[0] == "--json":
        out = {
            "title": curriculum["title"],
            "phases": [
                {"id": p["id"], "number": p["number"], "title": p["title"],
                 "lessons": [lesson_state(les) for les in p["lessons"]]}
                for p in curriculum["phases"]
            ],
        }
        print(json.dumps(out, indent=2))
        return 0

    if args:
        return one_lesson(curriculum, args[0])

    dashboard(curriculum)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

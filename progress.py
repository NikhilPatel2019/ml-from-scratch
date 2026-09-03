#!/usr/bin/env python3
"""Where am I?

    python progress.py            full dashboard across every phase
    python progress.py 0.1        run one lesson's tests, verbosely
    python progress.py --json     machine-readable, for tooling

Progress here is not self-reported. A lesson counts as done when its tests pass,
which means you wrote the code. That is the only definition worth having.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from mlfs.harness import PASS, TODO, bar, enable_utf8, report, run_lesson  # noqa: E402

enable_utf8()

CURRICULUM = ROOT / "curriculum.json"


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
    print(f"\n  No lesson with id {lesson_id!r}. Try: python progress.py\n")
    return 2


def main() -> int:
    curriculum = load_curriculum()
    args = sys.argv[1:]

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

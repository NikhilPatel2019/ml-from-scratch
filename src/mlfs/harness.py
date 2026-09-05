"""Shared test harness for lesson exercises.

Every lesson ships a `test_exercises.py` containing module-level functions named
`test_*`. Each raises AssertionError on a wrong answer. If the exercise it covers
is still a stub, the underlying NotImplementedError propagates and the harness
reports TODO rather than a failure — an unwritten exercise is not a bug.

The same file is importable by pytest, so `pytest` works on this repo too.
"""

from __future__ import annotations

import importlib.util
import re
import sys
from dataclasses import dataclass
from pathlib import Path

PASS, FAIL, TODO = "pass", "fail", "todo"

# ANSI colours, disabled when the stream is redirected or Windows can't do it.
_C = {
    PASS: "\033[32m",
    FAIL: "\033[31m",
    TODO: "\033[90m",
    "dim": "\033[90m",
    "bold": "\033[1m",
    "off": "\033[0m",
}


def enable_utf8() -> None:
    """Windows consoles default to a legacy codepage (cp1252) that cannot encode
    box-drawing characters or em dashes, which crashes printing. Entry points call
    this before writing anything."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:  # pragma: no cover - non-reconfigurable stream
            pass


def _can_encode(text: str) -> bool:
    enc = getattr(sys.stdout, "encoding", None) or "ascii"
    try:
        text.encode(enc)
        return True
    except (UnicodeEncodeError, LookupError):
        return False


def _supports_colour() -> bool:
    if not sys.stdout.isatty():
        return False
    if sys.platform == "win32":
        try:  # enable VT100 on modern Windows terminals
            import ctypes

            k = ctypes.windll.kernel32
            k.SetConsoleMode(k.GetStdHandle(-11), 7)
            return True
        except Exception:
            return False
    return True


_USE_COLOUR = _supports_colour()


def _c(key: str, text: str) -> str:
    return f"{_C[key]}{text}{_C['off']}" if _USE_COLOUR else text


@dataclass
class Result:
    name: str
    status: str
    message: str = ""
    #: the exercise this test covers, e.g. test_6_cosine_similarity -> cosine_similarity.
    #: The site groups by this, so it has to be the function name in exercises.py,
    #: not the human label.
    exercise: str = ""

    @property
    def ok(self) -> bool:
        return self.status == PASS


def load_module(path: Path, name: str | None = None):
    """Import a Python file by path, without needing it on sys.path."""
    name = name or path.stem
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def collect(module) -> list[tuple[str, callable]]:
    """Module-level `test_*` callables, in definition order."""
    return [
        (n, f)
        for n, f in vars(module).items()
        if n.startswith("test_") and callable(f)
    ]


def exercise_name(test_name: str) -> str:
    """test_6_cosine_similarity -> cosine_similarity."""
    return re.sub(r"^test_\d+_", "", test_name)


def run(module) -> list[Result]:
    results = []
    for name, fn in collect(module):
        label = (fn.__doc__ or name).strip().splitlines()[0]
        ex = exercise_name(name)
        try:
            fn()
        except NotImplementedError:
            results.append(Result(label, TODO, "not written yet", ex))
        except AssertionError as e:
            results.append(Result(label, FAIL, str(e) or "assertion failed", ex))
        except Exception as e:  # a real bug in their code
            results.append(Result(label, FAIL, f"{type(e).__name__}: {e}", ex))
        else:
            results.append(Result(label, PASS, "", ex))
    return results


def run_lesson(lesson_dir: Path) -> list[Result]:
    """Run one lesson's tests. Returns [] if the lesson has no tests yet."""
    test_file = lesson_dir / "test_exercises.py"
    if not test_file.exists():
        return []
    # Give the test module a unique name so several lessons can run in one process.
    unique = f"tests_{lesson_dir.parent.name}_{lesson_dir.name}".replace("-", "_")
    try:
        module = load_module(test_file, unique)
    except Exception as e:
        return [Result("could not load tests", FAIL, f"{type(e).__name__}: {e}")]
    return run(module)


def report(results: list[Result], indent: str = "  ") -> None:
    marks = {PASS: "PASS", FAIL: "FAIL", TODO: "TODO"}
    for r in results:
        mark = _c(r.status, f"[{marks[r.status]}]")
        line = f"{indent}{mark}  {r.name}"
        if r.message and r.status != PASS:
            sep = "—" if _can_encode("—") else "-"
            line += _c("dim", f"  {sep} {r.message}")
        print(line)


def bar(done: int, total: int, width: int = 24) -> str:
    full, empty = ("█", "░") if _can_encode("█░") else ("#", ".")
    if total == 0:
        return _c("dim", empty * width)
    filled = round(width * done / total)
    return _c(PASS, full * filled) + _c("dim", empty * (width - filled))

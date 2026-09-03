# Contributing

This is a learning repository first and a project second. That shapes what is useful.

## Please do send

- **Corrections.** Wrong maths, wrong code, a claim that is out of date. These matter most — a confident error in teaching material is worse than a gap.
- **Clearer explanations.** If a paragraph made you re-read it three times, rewrite it and open a PR. Explaining something better is a real contribution.
- **Better exercises.** A test that catches a misconception the current ones miss.
- **Broken or moved links** in any `watch.md`.
- **Platform fixes.** This was written on Windows; macOS and Linux paper cuts are worth reporting.

## Please do not send

- **Solutions to the exercises.** The stubs are stubs deliberately. A PR that fills them in defeats the point of the repository for everyone who clones it after you.
- **Whole new phases** without discussing it in an issue first. The ordering is deliberate — each lesson assumes exactly what came before and nothing more.
- **Framework rewrites.** "This would be shorter with scikit-learn" is true and beside the point in Phase 0 and 1. We use the library *after* building the thing by hand.

## Style

**Prose.** Write for someone who does not yet know the term you are about to use. Introduce notation only once it earns its place. Prefer a concrete example to an abstract definition. Say the useful thing plainly instead of hedging it.

**Code.** Standard library and NumPy in Phase 0. Type hints on function signatures. Docstrings that explain the *idea*, not just the parameters — in exercise files, the docstring is the specification the learner works from.

**Tests.** Each test is a module-level `test_*` function whose first docstring line is the label shown in the dashboard. Assertion messages should explain what was expected, not merely that something failed:

```python
assert close(got, 32), "expected 32"                    # good
assert close(got, 32)                                    # not helpful
```

Exercises that must be solved a particular way should enforce it with `inspect.getsource`, as lesson 0.1 does for its no-NumPy and no-loop constraints.

## Adding a lesson

1. Add the entry to `curriculum.json` with `"status": "available"` and a `dir`.
2. Create the directory with `README.md`, `exercises.py`, `test_exercises.py`, `watch.md` and `notes.md`.
3. Verify the tests fail cleanly as `TODO` on the untouched stubs, and pass on a correct solution kept *outside* the repository.
4. Check `python progress.py` picks it up and the counts are right.

## Running things

```bash
pip install -e ".[dev]"
python progress.py          # dashboard
pytest                      # same tests, pytest reporting
ruff check .                # lint
```

An incomplete exercise makes `pytest` fail, which is correct — the work is not done. CI therefore validates the repository's own scaffolding rather than the learner's exercises.

"""
Lesson 0.1 — optional stretch exercise

Your `most_similar` is correct and it is the right way to write the definition.
This file asks for the *implementation* a real system would use.

The difference: your version calls cosine_similarity once per library item. This
one scores every item in a single operation, with no loop and no comprehension
anywhere. That is the shape a vector database uses to search millions of rows,
and it is your first real encounter with thinking in two dimensions rather than
one — which is what lessons 0.3 and 0.4 are about.

Nothing here affects your 7/7. Run it on its own:

    python 00-foundations/01-vectors/stretch.py
"""

import numpy as np

# ---------------------------------------------------------------------------
# The setup: the library is now a MATRIX, not a dict of separate vectors.
#
#   library_matrix   shape (n_items, n_dims)   one row per item
#   query            shape (n_dims,)           a single vector
#
# The new idea you need is `axis`. np.sum(m) adds up every number in a matrix
# and gives you one scalar. np.sum(m, axis=1) adds up each ROW separately and
# gives you one number per row. Most numpy functions take `axis`, and getting
# fluent with it is most of what "thinking in arrays" means.
#
# Check your shapes at every step. `.shape` is the debugger for this kind of
# code, and printing it is how everyone — including people who do this for a
# living — works out why a line failed.
# ---------------------------------------------------------------------------


def rank_all(query: np.ndarray, library_matrix: np.ndarray) -> np.ndarray:
    """STRETCH — cosine similarity against every row at once.

    Return a 1-D array of shape (n_items,) where element i is the cosine
    similarity between `query` and row i of `library_matrix`.

    Constraints:
      - No `for` loop, no comprehension, no calling cosine_similarity per row.
      - The whole thing is three lines: the dot products, the magnitudes,
        the division.

    Hints, in the order you will need them:
      1. `library_matrix @ query` gives you all the raw dot products at once.
         Work out why: each row meets the query and collapses to one number.
      2. `np.linalg.norm(m, axis=1)` gives the magnitude of every row.
      3. The query's own magnitude is a single number, and numpy will broadcast
         it across the whole array without you doing anything.
    """
    raise NotImplementedError("stretch")


# ---------------------------------------------------------------------------
# A DESIGN DECISION, which is the actually interesting part.
#
# Every query recomputes the magnitude of every library row — but those rows
# never change. Real systems face a choice:
#
#   (a) normalise the library ONCE at write time, then a query is a plain dot
#       product with no division at all. Fast queries, but the stored vectors
#       are no longer the originals, and you cannot recover their lengths.
#
#   (b) keep the originals and divide on every query. Slower per query, but the
#       stored data is untouched and you can still use magnitudes for other
#       things later.
#
# Production vector databases almost always pick (a). You are going to
# implement it, and then decide for yourself whether you agree.
# ---------------------------------------------------------------------------


def prepare_library(library_matrix: np.ndarray) -> np.ndarray:
    """STRETCH — normalise every row to length 1, in one operation.

    Return a matrix the same shape as the input, where every row has magnitude
    1 and still points the same direction.

    No loops. This is where most people meet numpy's most confusing rule for
    the first time, so read this before you start:

      `library_matrix` has shape (n_items, n_dims).
      `np.linalg.norm(library_matrix, axis=1)` has shape (n_items,).

    Dividing the first by the second does NOT do what you want, and numpy will
    either raise a shape error or — worse — silently broadcast along the wrong
    axis and give you plausible nonsense. You need the divisor to have shape
    (n_items, 1) so that each row is divided by its own number.

    Look up `keepdims=True`. Work out what it does to the shape, and why that
    is the fix. This one idea will save you hours across the rest of Phase 0.
    """
    raise NotImplementedError("stretch")


def search(query: np.ndarray, prepared: np.ndarray) -> np.ndarray:
    """STRETCH — the payoff.

    `prepared` is already row-normalised by prepare_library. Given that, return
    the similarity of the query against every row.

    If you understood the first diagram, this is one line and it contains no
    division at all. That is the entire optimisation vector databases make.
    """
    raise NotImplementedError("stretch")


# ===========================================================================
# Self-check. Do not edit.
# ===========================================================================

NAMES = ["python tutorial", "rust internals", "sourdough recipe", "knife skills"]
LIBRARY = np.array([
    [0.90, 0.05, 0.85],
    [0.95, 0.05, 0.40],
    [0.05, 0.95, 0.55],
    [0.05, 0.90, 0.60],
])
QUERY = np.array([0.80, 0.10, 0.70])


def _reference(query, matrix):
    """Deliberately slow and obvious: the definition, one row at a time."""
    out = []
    for row in matrix:
        out.append(float(np.dot(query, row) /
                        (np.linalg.norm(query) * np.linalg.norm(row))))
    return np.array(out)


def main() -> int:
    expected = _reference(QUERY, LIBRARY)
    checks, failures = 0, []

    def check(label, fn):
        nonlocal checks
        checks += 1
        try:
            fn()
        except NotImplementedError:
            failures.append(f"{label}: not written yet")
        except Exception as e:
            failures.append(f"{label}: {type(e).__name__}: {e}")

    def c1():
        got = rank_all(QUERY, LIBRARY)
        assert got.shape == (4,), f"expected shape (4,), got {got.shape}"
        assert np.allclose(got, expected), f"expected {expected.round(4)}, got {np.round(got, 4)}"

    def c2():
        got = prepare_library(LIBRARY)
        assert got.shape == LIBRARY.shape, f"shape changed: {got.shape}"
        lengths = np.linalg.norm(got, axis=1)
        assert np.allclose(lengths, 1.0), f"rows should all have length 1, got {lengths.round(4)}"

    def c3():
        got = search(QUERY / np.linalg.norm(QUERY), prepare_library(LIBRARY))
        assert np.allclose(got, expected), f"expected {expected.round(4)}, got {np.round(got, 4)}"

    check("rank_all", c1)
    check("prepare_library", c2)
    check("search", c3)

    print()
    if failures:
        for f in failures:
            print(f"  [ ] {f}")
        print(f"\n  {checks - len(failures)}/{checks} passing\n")
        return 1

    print(f"  {checks}/{checks} passing\n")
    scores = rank_all(QUERY, LIBRARY)
    order = np.argsort(-scores)
    print("  ranked, all four scored in one operation:\n")
    for rank, i in enumerate(order, 1):
        print(f"    {rank}.  {scores[i]:.3f}  {NAMES[i]}")
    print("\n  np.argsort is how you get a ranked list rather than just the winner.")
    print("  Swap these four rows for ten million and the code does not change.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""
Lesson 1.2 — stretch. Optional, not scored, no tests.

Two tasks. The first is your introduction to broadcasting, which is the whole
subject of 1.3. The second makes you check a claim I made in the README instead
of believing it.

Run:

    python lessons/01-foundations/02-geometry/stretch.py
"""

import numpy as np

# ---------------------------------------------------------------------------
# TASK 1 — every distance at once, with no loop
# ---------------------------------------------------------------------------
#
# Given an array of n points with d components each — shape (n, d) — return the
# (n, n) matrix where entry [i, j] is the distance from point i to point j.
#
#     points = np.array([[0.0, 0.0],
#                        [3.0, 4.0],
#                        [0.0, 1.0]])
#
#     pairwise_distances(points)  ->  [[0.   5.   1.  ]
#                                      [5.   0.   4.243]
#                                      [1.   4.243 0.  ]]
#
# The obvious solution is two nested loops calling `distance`. Do not write it.
#
# The move you want is called BROADCASTING, and here is the whole idea. If you
# reshape `points` from (n, d) to (n, 1, d), and leave a second copy as
# (1, n, d), then subtracting them gives you an (n, n, d) array where entry
# [i, j] is the vector from point j to point i. Every difference, computed at
# once, with no loop anywhere.
#
# Then you need the length of each of those n*n vectors. `np.linalg.norm` takes
# an `axis` argument — you want the length along the last axis, which collapses
# (n, n, d) down to (n, n).
#
# `points[:, None, :]` is how you insert that axis. Read it as "all rows, a new
# empty axis, all columns".
#
# Things worth checking when you have it:
#   - the diagonal must be all zeros (every point is zero from itself)
#   - the matrix must equal its own transpose (distance is symmetric)
#   - it must agree with a slow nested-loop version you write to compare against
#
# Time it against the loop at n = 2000. The gap is the same one you measured in
# 1.1, and it is the reason 1.3 exists.


def pairwise_distances(points: np.ndarray) -> np.ndarray:
    """Return the (n, n) matrix of distances between every pair of rows."""
    raise NotImplementedError("stretch task 1")


# ---------------------------------------------------------------------------
# TASK 2 — check the claim I made about normalised vectors
# ---------------------------------------------------------------------------
#
# The README says:
#
#     "If every vector is normalised to length 1, the two measures rank
#      identically. They are not equal — they are still different numbers —
#      but sorting by one gives the same order as sorting by the other."
#
# Do not take my word for it. Show it.
#
#   1. Generate a random library of, say, 200 vectors in 50 dimensions, and a
#      random query. Normalise all of them to length 1.
#   2. Rank the library by distance to the query, ascending.
#   3. Rank the library by cosine similarity to the query, descending.
#   4. Assert the two orderings are identical. `np.argsort` gives you the
#      ordering; comparing the two index arrays is the check.
#   5. Now do it again WITHOUT normalising, and watch the orderings come apart.
#
# Then, if you want the reason rather than just the fact, expand this by hand:
#
#     |a - b|^2  =  (a - b) . (a - b)
#
# Multiply it out. You will get three terms. Two of them are 1 when a and b are
# unit vectors. What is left is a constant minus twice the dot product — which
# means distance is a decreasing function of cosine similarity, which means
# sorting by one is sorting by the other. That is the proof, and it is four
# lines of algebra you can do on paper.


def ranking_check() -> None:
    """Show that normalised vectors rank the same by distance and by cosine."""
    raise NotImplementedError("stretch task 2")


if __name__ == "__main__":
    print("Implement pairwise_distances and ranking_check, then call them here.")

"""
Lesson 1.3 — stretch. Optional, not scored, no tests.

Two measurements. Neither is hard to write; both tell you something you cannot
get from reading, and the second one is the reason people stop using the
approach you just learned.

Run:

    python lessons/01-foundations/03-matrices/stretch.py

You will want numpy and `time.perf_counter`; add those imports yourself.
"""

# ---------------------------------------------------------------------------
# TASK 1 — what the vectorised version actually bought you
# ---------------------------------------------------------------------------
#
# You have written the same search three times now:
#
#   1.1  most_similar  — a dict comprehension, one cosine per item
#   1.2  nearest       — the same shape, by distance
#   1.3  rank_all      — one operation for the whole library
#
# Time the first against the third. Build a random library of 200,000 rows with
# 128 components each (that is a realistic embedding size), pick a random query,
# and measure both.
#
# Use `time.perf_counter`, not `time.time` — the second one is a wall clock and
# can go backwards.
#
# Two things worth doing properly:
#
#   - Run each version a few times and take the FASTEST, not the average. You
#     are trying to measure the code, and every other process on your machine
#     can only ever make it look slower.
#   - Check the two versions agree before you believe the timing. A very fast
#     wrong answer is easy to write.
#
# Expect somewhere between 50x and 200x. Write the number you actually get in
# notes.md, with your machine — it is more convincing than mine.


def compare_speed() -> None:
    """Time one-at-a-time scoring against the whole-library version."""
    raise NotImplementedError("stretch task 1")


# ---------------------------------------------------------------------------
# TASK 2 — what it cost, and where this approach stops working
# ---------------------------------------------------------------------------
#
# `pairwise_distances` builds an (n, n, d) array on its way to an (n, n) answer.
# That intermediate is the whole problem.
#
# An array's memory is `array.nbytes`, and you can predict it before allocating:
# n * n * d * 8 bytes, because a float64 is 8 bytes.
#
#   1. For n = 1000 and d = 128, print the predicted size of the intermediate
#      in megabytes. Then build it and check `.nbytes` agrees with you.
#   2. Now do the arithmetic (do NOT allocate it) for n = 100_000, the size of
#      a small production index. Print it in gigabytes.
#   3. Notice that the ANSWER — the (n, n) matrix — is d times smaller than the
#      intermediate you built to get it.
#
# That last point is the whole issue: you are paying 128x the memory of your
# result for the convenience of one expression.
#
# There is a way out, and it is worth knowing it exists even though writing it
# is a later lesson. Expand the square of the difference:
#
#     |a - b|^2  =  a·a  -  2(a·b)  +  b·b
#
# Every term on the right is something you can get for the whole matrix at once:
# `a·a` and `b·b` are row_lengths squared, and `a·b` for every pair is exactly
# the `gram` matrix from exercise 5. So the (n, n) distance matrix can be built
# from an (n, n) matrix and two (n,) vectors, and the (n, n, d) intermediate
# never exists.
#
# Implement it if you want. Compare it against your exercise 6 for both speed
# and memory, and check the two agree to within about 1e-9 — they will not agree
# exactly, and working out why is the interesting part. (Hint: subtracting two
# nearly equal large numbers is where floating point is at its worst, and this
# form does exactly that on the diagonal. Look at what you get for the distance
# from a row to itself.)


def memory_cost() -> None:
    """Show what the (n, n, d) intermediate costs, and where it stops fitting."""
    raise NotImplementedError("stretch task 2")


if __name__ == "__main__":
    print("Implement compare_speed and memory_cost, then call them here.")

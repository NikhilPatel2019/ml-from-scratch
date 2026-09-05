"""
Lesson 1.2 — Vector geometry

Read README.md first. Then implement every function below and run:

    progress 1.2

Rules the tests enforce:
  - Exercise 1 must use PLAIN PYTHON with no numpy. You are building the
    mechanism once more, in a new shape, before you are allowed to call it.
    `sum()` and comprehensions are allowed here — you already proved in 1.1
    that you can accumulate by hand.
  - Exercises 2 to 6 must use NUMPY with NO python `for` loop.
  - Exercise 7 is the exception. Walking the library dictionary is the job,
    and a comprehension is the natural way to do it.

Exercise 1 needs a square root and may not use numpy, so you will want to
import `math` yourself. Nothing beyond the standard library and numpy.
"""

import numpy as np


def distance_loop(a: list[float], b: list[float]) -> float:
    """EXERCISE 1 — Euclidean distance, by hand.

    How far apart two points are. Subtract them position by position, square
    each difference, add the squares, take the square root.

        distance_loop([0, 0], [3, 4])  ->  5.0
        distance_loop([1, 1], [1, 1])  ->  0.0

    Plain Python only — no numpy.

    Raise ValueError if the two lists have different lengths. The distance
    between points in different-sized spaces is not a smaller answer, it is no
    answer.
    """
    raise NotImplementedError("exercise 1")


def distance(a: np.ndarray, b: np.ndarray) -> float:
    """EXERCISE 2 — the same thing, vectorised.

    Numpy, no loops. Same result as exercise 1.

    You wrote `magnitude` in 1.1. Distance is that function applied to one
    particular vector — work out which one, and this is a short function.
    """
    raise NotImplementedError("exercise 2")


def angle_between(a: np.ndarray, b: np.ndarray) -> float:
    """EXERCISE 3 — the angle between two vectors, in DEGREES.

    Rearranged from the identity in the README:

        a . b  =  |a| * |b| * cos(theta)

        angle_between([1, 0], [0, 1])   ->   90.0
        angle_between([1, 0], [1, 0])   ->    0.0
        angle_between([1, 0], [-1, 0])  ->  180.0
        angle_between([1, 0], [5, 0])   ->    0.0   # length is irrelevant

    Numpy, no loops. Raise ValueError if either vector has zero magnitude —
    there is no angle to a vector with no direction.

    One trap, and it is the point of this exercise. Floating point can hand you
    a cosine of 1.0000000000000002 for two identical vectors, and arccos of
    anything outside [-1, 1] is nan. Your function must return 0.0 there, not
    nan. Look up np.clip.

    Degrees, not radians. numpy has something for that conversion.
    """
    raise NotImplementedError("exercise 3")


def project(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """EXERCISE 4 — the projection of a onto b.

    The shadow a casts on the line through b. Returns a VECTOR, pointing along
    b.

        project([3, 3], [1, 0])  ->  array([3., 0.])
        project([3, 3], [5, 0])  ->  array([3., 0.])   # only b's DIRECTION matters
        project([0, 5], [1, 0])  ->  array([0., 0.])   # nothing to cast

    The formula follows from one question: how far along b do you travel? That
    is a plain number, and it is a ratio of two dot products — see the README.
    Then travel that far along b.

    Numpy, no loops. Raise ValueError if b has zero magnitude — there is no
    line to project onto.
    """
    raise NotImplementedError("exercise 4")


def reject(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """EXERCISE 5 — the part of a that b cannot explain.

    Whatever is left of a once you remove its projection onto b. This vector is
    always perpendicular to b.

        reject([3, 3], [1, 0])  ->  array([0., 3.])

    Numpy, no loops. One line, if you use exercise 4.

    Together, project and reject split a into two pieces that add back to a
    exactly: the part lying along b, and the part that does not. That split is
    the idea behind PCA, behind least squares, and behind what an attention
    head does when it decides how much of one token to mix into another.
    """
    raise NotImplementedError("exercise 5")


def is_orthogonal(a: np.ndarray, b: np.ndarray, tol: float = 1e-9) -> bool:
    """EXERCISE 6 — do these two vectors have nothing to say about each other?

    True when they meet at a right angle.

        is_orthogonal([1, 0], [0, 1])  ->  True
        is_orthogonal([1, 0], [1, 1])  ->  False
        is_orthogonal([1, 0], [0, 0])  ->  True   # see below

    Numpy, no loops.

    Do NOT write `== 0`. Two vectors that are perpendicular in exact arithmetic
    give you a dot product of 3.06e-17 in floating point, and `== 0` calls that
    False. Compare the absolute value against `tol` instead. Getting this
    reflex now saves you a genuinely horrible afternoon later.

    The zero vector counts as orthogonal to everything. That is a convention
    rather than a fact — it has no direction to be perpendicular to anything —
    but it is the convention every library uses, and it falls out of the
    tolerance check for free.
    """
    raise NotImplementedError("exercise 6")


def nearest(query: np.ndarray, library: dict[str, np.ndarray]) -> str:
    """EXERCISE 7 — the payoff: the same search, by distance instead of angle.

    Return the name of the library item CLOSEST to query, measured by exercise
    2.

        library = {"a": np.array([1.0, 0.0]), "b": np.array([0.0, 1.0])}
        nearest(np.array([0.9, 0.1]), library)  ->  "a"

    In 1.1 you wrote `most_similar`, which ranked the same kind of library by
    cosine similarity. This ranks by distance. Run both on the same data and
    they will sometimes disagree — the README says when, and why, and which one
    you want. The tests check that you can produce the disagreement.

    Iterating the dictionary is expected here. This is exercise 7 of 1.1 again
    with one thing changed; if it takes you more than a few lines, you are
    rewriting something you already have.

    Raise ValueError if the library is empty. "The nearest of nothing" has no
    answer, and returning None would push the failure somewhere further away.
    """
    raise NotImplementedError("exercise 7")


def _demo() -> None:
    """Not scored. Run this file directly once all seven pass:

        python lessons/01-foundations/02-geometry/exercises.py

    It builds the case where distance and angle give different answers, so you
    can watch the thing this lesson is about rather than take my word for it.
    """
    library = {
        "short_doc": np.array([1.0, 1.0]),
        "long_doc": np.array([10.0, 10.0]),
        "off_topic": np.array([0.0, 3.0]),
    }
    query = np.array([2.0, 2.0])

    print(f"query: {query}\n")
    print(f"{'item':<12}{'distance':>10}{'angle':>10}")
    for name, vec in library.items():
        print(f"{name:<12}{distance(query, vec):>10.2f}{angle_between(query, vec):>9.1f}")

    # 1e-4, not 0: arccos cannot resolve a zero angle exactly. See the README.
    same_direction = [n for n, v in library.items() if angle_between(query, v) < 1e-4]
    print(f"\nnearest by distance : {nearest(query, library)}")
    print(f"same direction      : {', '.join(same_direction)}")
    print(
        "\nThe long document points exactly where the query points and is the"
        "\nfurthest away of the three. Length and direction are different"
        "\nquestions, and you have to decide which one you were asking."
    )


if __name__ == "__main__":
    _demo()

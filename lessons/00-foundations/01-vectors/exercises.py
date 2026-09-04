"""
Lesson 0.1 — Vectors and the dot product

Read README.md first. Then implement every function below and run:

    progress 0.1

Rules the tests enforce:
  - Exercise 1 must use PLAIN PYTHON with no numpy and no sum(). You are
    implementing the machine, not calling it.
  - Exercise 3 must use PLAIN PYTHON with no numpy. sum() is allowed here —
    you already proved you can accumulate by hand in exercise 1, and the point
    of this one is Pythagoras.
  - Exercises 2 and 4-7 must use NUMPY with NO python `for` loop. If you reach
    for a loop there, you have missed the point of the lesson.
"""

import numpy as np


def dot_loop(a: list[float], b: list[float]) -> float:
    """EXERCISE 1 — the dot product, by hand.

    Multiply two equal-length lists element by element, then add up the results.

        dot_loop([1, 2, 3], [4, 5, 6])  ->  1*4 + 2*5 + 3*6  ->  32

    Plain Python only. Raise ValueError if the lengths differ.
    """
    raise NotImplementedError("exercise 1")


def dot_numpy(a: np.ndarray, b: np.ndarray) -> float:
    """EXERCISE 2 — the same thing, vectorised.

    Same result, but a and b are numpy arrays and you may not write a loop.
    Find the numpy way. There is more than one correct answer.
    """
    raise NotImplementedError("exercise 2")


def magnitude_loop(v: list[float]) -> float:
    """EXERCISE 3 — magnitude, by hand.

    The "length" of a vector: square every element, sum them, take the square
    root. This is Pythagoras, extended to any number of dimensions.

        magnitude_loop([3, 4])  ->  5.0

    Plain Python only. Hint: you have already written most of this.
    """
    raise NotImplementedError("exercise 3")


def magnitude(v: np.ndarray) -> float:
    """EXERCISE 4 — magnitude, vectorised.

    Numpy, no loops.
    """
    raise NotImplementedError("exercise 4")


def normalise(v: np.ndarray) -> np.ndarray:
    """EXERCISE 5 — normalise.

    Return a vector pointing the same way as v, but with magnitude exactly 1.
    (Divide the vector by its own length.)

        normalise(np.array([3.0, 4.0]))  ->  array([0.6, 0.8])

    Raise ValueError if v has zero magnitude — a zero vector has no direction.
    """
    raise NotImplementedError("exercise 5")


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """EXERCISE 6 — cosine similarity.

    The dot product of two vectors, divided by the product of their magnitudes.

    Produces a number from -1 to 1 answering: "do these two vectors point the
    same way?"  1 = identical direction, 0 = perpendicular and unrelated,
    -1 = exactly opposite. Magnitude is divided out entirely; only direction
    survives.

    This one function is how every semantic search engine, every RAG system and
    every recommendation engine you have used decides two things are similar.
    You are about to write it in one line.
    """
    raise NotImplementedError("exercise 6")


def most_similar(query: np.ndarray, library: dict[str, np.ndarray]) -> str:
    """EXERCISE 7 — the payoff: a two-line search engine.

    `library` maps names to vectors. Return the name whose vector is most
    similar to `query` by cosine similarity.

    Do not overthink it. Reuse exercise 6.
    """
    raise NotImplementedError("exercise 7")


def benchmark() -> None:
    """Why numpy exists. Run this once all seven tests pass:

        python lessons/00-foundations/01-vectors/exercises.py
    """
    import time

    n = 2_000_000
    rng = np.random.default_rng(0)
    a_np, b_np = rng.normal(size=n), rng.normal(size=n)
    a_py, b_py = a_np.tolist(), b_np.tolist()

    t0 = time.perf_counter()
    dot_loop(a_py, b_py)
    t_py = time.perf_counter() - t0

    t0 = time.perf_counter()
    dot_numpy(a_np, b_np)
    t_np = time.perf_counter() - t0

    print(f"\n  dot product of two {n:,}-element vectors\n")
    print(f"    plain python : {t_py * 1000:8.1f} ms")
    print(f"    numpy        : {t_np * 1000:8.1f} ms")
    print(f"    speedup      : {t_py / t_np:8.0f}x\n")
    print("  That gap is the entire reason ML is written in numpy and not in loops.")
    print("  A GPU widens it by roughly another 100x.\n")


if __name__ == "__main__":
    benchmark()

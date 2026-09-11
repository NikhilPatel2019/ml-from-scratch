"""
Lesson 1.3 — Matrices as data

Read README.md first. Then implement every function below and run:

    progress 1.3

Rules the tests enforce:
  - Exercise 1 must use PLAIN PYTHON with no numpy. It is the last time in
    this phase you write a shape check by hand, and doing it once is why
    `.shape` stops being magic.
  - Exercises 2 to 7 must use NUMPY with NO python `for` loop and NO
    comprehension. A comprehension over rows is a loop wearing a hat, and
    avoiding it is the entire subject of this lesson.

Throughout, X is a matrix of shape (n, d): n rows, each one a d-component
vector. One row is one thing — a document, a house, a customer.

Every function here is checked for its output SHAPE as well as its values.
Getting the numbers right with the wrong shape is the characteristic bug of
this lesson, and it is usually silent.
"""

import numpy as np


def shape_of(rows: list[list[float]]) -> tuple[int, int]:
    """EXERCISE 1 — how big is this table, and is it even a table?

    Return (number of rows, number of columns).

        shape_of([[1, 2, 3], [4, 5, 6]])  ->  (2, 3)
        shape_of([[7]])                   ->  (1, 1)
        shape_of([])                      ->  (0, 0)

    Plain Python only — no numpy.

    Raise ValueError if the rows are not all the same length. That shape is
    not a matrix. Current numpy refuses it as well, but only at the moment you
    convert, and not at all if something passed dtype=object — then it quietly
    builds an array of Python lists, which fails much later with a message
    about lists rather than about shapes. Plain lists never check themselves,
    so the check belongs where the data comes in.
    """
    raise NotImplementedError("exercise 1")


def row_lengths(X: np.ndarray) -> np.ndarray:
    """EXERCISE 2 — the length of every row, all at once.

    X has shape (n, d). Return a 1-D array of n numbers: the length of each
    row, in the sense of `magnitude` from 1.1.

        X = [[3, 4],        row_lengths(X)  ->  array([5., 13.])
             [5, 12]]                           shape (2,)

    Numpy, no loops, no comprehensions.

    You already know how to take the length of one vector. The new part is
    doing it to every row without visiting them one at a time, and the tool
    for that is the `axis` argument the README works through. Ask yourself
    which axis you want to collapse: you start with (n, d) and you want (n,),
    so the d has to go.
    """
    raise NotImplementedError("exercise 2")


def centre(X: np.ndarray) -> np.ndarray:
    """EXERCISE 3 — move the data so its average sits at the origin.

    Subtract the mean of each COLUMN from every entry in that column. The
    result has the same shape as X, and each of its columns averages to zero.

        X = [[1, 10],       centre(X)  ->  [[-1, -10],
             [3, 30]]                       [ 1,  10]]

        (column means are 2 and 20)

    Numpy, no loops, no comprehensions.

    This is the first real broadcasting exercise: you will compute something
    of shape (d,) and subtract it from something of shape (n, d). Work out on
    paper what numpy does when those two shapes meet before you write it —
    the README's broadcasting section is exactly this case.

    Centring is the first step of PCA, of most regression, and of every
    "standardise your features" instruction you have ever skimmed past.
    """
    raise NotImplementedError("exercise 3")


def unit_rows(X: np.ndarray) -> np.ndarray:
    """EXERCISE 4 — scale every row to length 1, keeping its direction.

    `normalise` from 1.1, applied to every row at once. Same shape as X.

        X = [[3, 4],        unit_rows(X)  ->  [[0.6, 0.8      ],
             [5, 12]]                          [0.384..., 0.923...]]

    Numpy, no loops, no comprehensions.

    THIS IS THE ONE THAT BITES. You need to divide an (n, d) matrix by the n
    row lengths from exercise 2 — but those come back with shape (n,), and
    dividing (n, d) by (n,) is not the operation you want. Read the README's
    keepdims section before you start, then check the shape of your divisor
    with `.shape` rather than assuming.

    On a square matrix this bug produces plausible numbers and no error at
    all. The tests use a non-square X on purpose, so you get an exception
    instead of a wrong answer you would have shipped.

    Raise ValueError if any row has zero length — a row with no direction
    cannot be pointed anywhere.
    """
    raise NotImplementedError("exercise 4")


def gram(X: np.ndarray) -> np.ndarray:
    """EXERCISE 5 — every pairwise dot product, in one operation.

    X has shape (n, d). Return the (n, n) matrix whose entry [i, j] is the dot
    product of row i with row j.

        X = [[1, 0],        gram(X)  ->  [[1, 0, 1],
             [0, 1],                      [0, 1, 1],
             [1, 1]]                      [1, 1, 2]]

    Numpy, no loops, no comprehensions.

    Two facts do the work here. First, `@` between two matrices pairs each row
    of the left with each COLUMN of the right. Second, `.T` turns rows into
    columns. Put those together and one operation gives you all n×n dot
    products — the same arithmetic your loop would have done, and roughly a
    hundred times faster.

    Sanity checks you can do in your head: the result must be square, it must
    equal its own transpose, and entry [i, i] is row i dotted with itself,
    which is its length squared.
    """
    raise NotImplementedError("exercise 5")


def pairwise_distances(X: np.ndarray) -> np.ndarray:
    """EXERCISE 6 — the distance from every row to every other row.

    X has shape (n, d). Return the (n, n) matrix whose entry [i, j] is the
    distance from row i to row j, in the sense of `distance` from 1.2.

        X = [[0, 0],        pairwise_distances(X)  ->  [[0., 5., 1.   ],
             [3, 4],                                    [5., 0., 4.243],
             [0, 1]]                                    [1., 4.243, 0.]]

    Numpy, no loops, no comprehensions.

    The move is in the README under "a new axis out of nothing". You want
    every difference between every pair of rows, which is n×n differences of
    d components each — an (n, n, d) array. Reshaping X to (n, 1, d) and
    subtracting X of shape (n, d) produces exactly that. Then collapse the
    last axis to lengths.

    Checks: the diagonal is all zeros, and the matrix equals its own transpose.
    """
    raise NotImplementedError("exercise 6")


def rank_all(query: np.ndarray, X: np.ndarray, names: list[str]) -> list[str]:
    """EXERCISE 7 — the payoff: score a whole library in one operation.

    In 1.1 you wrote `most_similar`, which looped a dictionary and returned one
    name. In 1.2 you wrote `nearest`, which did the same by distance. Both
    walked the library one item at a time. This does not.

    query has shape (d,). X has shape (n, d), one library item per row, and
    names[i] is the name of row i. Return ALL the names, ordered by cosine
    similarity to the query, best first.

        names = ["a", "b", "c"]
        X     = [[1, 0], [0, 1], [1, 1]]
        rank_all([1, 0], X, names)  ->  ["a", "c", "b"]

    Numpy, no loops, no comprehensions — except the final step that turns an
    array of positions into a list of names, which is a comprehension and is
    expected.

    Build it in stages and check the shape after each: the similarities are
    one array of n numbers, and getting them is exercises 4 and 5 combined.
    Then `np.argsort` gives you the positions that would sort an array; read
    its docs for which direction it sorts in, and what to do about that.

    This is what a vector database runs, and stretch.py times it against your
    1.1 version so you can see what the difference actually costs.
    """
    raise NotImplementedError("exercise 7")


def _demo() -> None:
    """Not scored. Run this file directly once all seven pass:

        python lessons/01-foundations/03-matrices/exercises.py

    It shows the same six documents four ways, so you can see the shapes
    change as the data moves through.
    """
    unit = np.eye(2)
    todo = []
    for name, call in (
        ("row_lengths", lambda: row_lengths(unit)),
        ("centre", lambda: centre(unit)),
        ("unit_rows", lambda: unit_rows(unit)),
        ("gram", lambda: gram(unit)),
        ("pairwise_distances", lambda: pairwise_distances(unit)),
        ("rank_all", lambda: rank_all(np.ones(2), unit, ["a", "b"])),
    ):
        try:
            call()
        except NotImplementedError:
            todo.append(name)

    if todo:
        print("This demo needs " + ", ".join(todo) + ", still to write.")
        print("")
        print("To see where you are, exercise by exercise:")
        print("")
        print("    progress 1.3")
        return

    names = ["cooking", "baking", "rust", "python", "pasta", "compilers"]
    X = np.array([
        [8.0, 7.0, 0.0],
        [7.0, 9.0, 0.0],
        [0.0, 0.0, 8.0],
        [1.0, 0.0, 9.0],
        [9.0, 6.0, 1.0],
        [0.0, 1.0, 7.0],
    ])
    query = np.array([9.0, 8.0, 0.0])

    print(f"X.shape            {X.shape}")
    print(f"row_lengths        {np.round(row_lengths(X), 2)}   shape {row_lengths(X).shape}")
    print(f"centre(X).shape    {centre(X).shape}   column means now {np.round(centre(X).mean(axis=0), 12)}")
    print(f"unit_rows lengths  {np.round(row_lengths(unit_rows(X)), 12)}")
    print(f"gram(X).shape      {gram(X).shape}")
    print(f"distances.shape    {pairwise_distances(X).shape}   diagonal {np.round(np.diag(pairwise_distances(X)), 12)}")
    print("")
    print(f"query {query} ranks the library:")
    for position, name in enumerate(rank_all(query, X, names), start=1):
        print(f"    {position}. {name}")
    print("")
    print("Six items scored in one operation, not six. At six rows that is a")
    print("curiosity. At six million it is the difference between a product")
    print("and a science project.")


if __name__ == "__main__":
    _demo()

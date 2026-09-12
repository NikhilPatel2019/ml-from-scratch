"""
Lesson 1.4 — Matrices as transformations

Read README.md first. Then implement every function below and run:

    progress 1.4

Rules the tests enforce:
  - Exercise 1 must use PLAIN PYTHON with no numpy. You build the column
    reading of a matrix by hand once, and the rest of the lesson is that
    reading applied over and over.
  - Exercises 2 to 6 must use NUMPY with NO python `for` loop and NO
    comprehension.
  - Exercise 7 is the exception. Walking the list of layers is the job, and a
    `for` loop over it is the natural way to do it. There is still no loop
    over the data: every layer moves every row at once.

Two conventions meet in this lesson, and mixing them up is its characteristic
bug:

  - A transformation matrix M has shape (d_out, d_in) and acts on ONE vector
    written as a column: M @ v. That is how every textbook and every video
    writes it.
  - Your data X has shape (n, d_in) — one thing per ROW, as in 1.3. That is
    how every library stores it.

Both are right. Getting from one to the other is exercise 2, and it is worth
getting straight before anything else here makes sense.

Every function is checked for its output SHAPE as well as its values.
"""

import numpy as np


def combine_columns(M: list[list[float]], v: list[float]) -> list[float]:
    """EXERCISE 1 — a matrix times a vector, read as columns.

    M is a list of rows. v holds one number per COLUMN of M. Return the
    combination of M's columns weighted by v: v[0] lots of column 0, plus
    v[1] lots of column 1, and so on.

        M = [[2, -1],      v = [4, 5]
             [0,  3]]

        4 * [2, 0]  +  5 * [-1, 3]   ->   [8, 0] + [-5, 15]   ->   [3, 15]

    The result has one number per ROW of M.

        combine_columns([[2, -1], [0, 3]], [4, 5])         ->  [3.0, 15.0]
        combine_columns([[1, 0], [0, 1], [1, 1]], [2, 3])  ->  [2.0, 3.0, 5.0]

    Plain Python only — no numpy.

    Raise ValueError if the rows of M are not all the same length, and if v
    does not have one number per column.

    You can get the same numbers by taking a dot product with each row, and no
    test can tell the difference. Write it as columns anyway. The column
    reading is what this lesson and the next two are built on; the row reading
    stops explaining anything by 1.5.
    """
    raise NotImplementedError("exercise 1")


def transform(M: np.ndarray, X: np.ndarray) -> np.ndarray:
    """EXERCISE 2 — move every row of your data at once.

    M has shape (d_out, d_in): it takes a d_in-component vector and gives back
    a d_out-component one. X has shape (n, d_in), one thing per row. Return
    shape (n, d_out): every row of X, moved by M.

        M = [[2, -1],      X = [[1, 0],     transform(M, X)  ->  [[ 2,  0, 1],
             [0,  3],           [0, 1],                           [-1,  3, 1],
             [1,  1]]           [3, 4]]                           [ 2, 12, 7]]

        M is (3, 2), X is (3, 2), and the answer is (3, 3).

    Numpy, no loops, no comprehensions.

    THIS IS THE ONE THAT BITES, and it is worth slowing down for. M is written
    to act on a single column vector, and your rows are not columns. So a
    transpose belongs somewhere in this expression, and the way to find where
    is the way 1.3 taught you — write the shapes down and line them up:

        (n, d_in) against (d_out, d_in). Which pairing is even defined, and
        what does the one that works leave you holding?

    Reach for the shapes rather than for trial and error. Trying both orders
    until one stops raising is how you end up with a function that works on
    square matrices and quietly transposes your data on every other one.
    """
    raise NotImplementedError("exercise 2")


def basis_images(M: np.ndarray) -> np.ndarray:
    """EXERCISE 3 — where do the basis vectors land?

    The basis vectors are the plain ones: [1, 0], [0, 1], and in higher
    dimensions [1, 0, 0], [0, 1, 0], [0, 0, 1]. One 1, everything else 0.
    Every other vector is built out of them, which is why knowing where they
    land tells you what M does to everything.

    M has shape (d_out, d_in). Return shape (d_in, d_out): row i is where the
    i-th basis vector lands.

        M = [[2, -1],     basis_images(M)  ->  [[ 2, 0],   <- [1, 0] lands here
             [0,  3]]                           [-1, 3]]   <- [0, 1] lands here

    Numpy, no loops, no comprehensions.

    Build it rather than write it down. `np.eye(d_in)` is every basis vector,
    one per row, and exercise 2 moves rows. Then put your answer next to M
    itself and look at the two for a moment.

    What you notice there is the most useful single fact in this lesson. The
    README says why, and exercise 5 is unpleasant without it.
    """
    raise NotImplementedError("exercise 3")


def is_linear(f, d_in: int, tol: float = 1e-9) -> bool:
    """EXERCISE 4 — is this function secretly a matrix?

    "Linear" is not a vague word for "straight-ish". It is two rules, and a
    function either obeys them for every input or it is not linear:

        adding first is the same as adding after:    f(a + b) == f(a) + f(b)
        scaling first is the same as scaling after:  f(s * a) == s * f(a)

    f takes a 1-D array of d_in numbers and gives back a 1-D array. Return
    True when f passes both rules, False when it fails either.

        is_linear(lambda v: M @ v, 2)                     ->  True
        is_linear(lambda v: M @ v + np.array([1, 1]), 2)  ->  False
        is_linear(lambda v: v * v, 2)                     ->  False

    Numpy, no loops, no comprehensions.

    Build your a, b and s with `rng = np.random.default_rng(0)` so the answer
    does not change between runs. Pick a scalar that is neither 0 nor 1: both
    of those pass for almost any function and prove nothing.

    Compare with `tol`, never with `==`. An exactly equal comparison fails on
    functions that are perfectly linear, for the reason 1.2 exercise 6 gave
    you.

    Return a real Python `bool`. `np.allclose` hands you one; `np.all` does
    not, and the difference stays invisible until something checks.

    One honest limit, worth carrying past this lesson: a check like this can
    only ever FIND a counterexample. Passing on one pair of vectors is
    evidence, not proof.
    """
    raise NotImplementedError("exercise 4")


def rotation(degrees: float) -> np.ndarray:
    """EXERCISE 5 — build a rotation out of where the basis lands.

    Return the 2x2 matrix that rotates counter-clockwise by the given angle,
    in DEGREES.

        rotation(90) applied to [1, 0]  ->  [0, 1]
        rotation(90) applied to [3, 4]  ->  [-4, 3]
        rotation(0)                     ->  the identity matrix
        rotation(45) applied twice      ->  the same as rotation(90)

    Numpy, no loops, no comprehensions.

    Do not look this matrix up, and do not copy it out of the video. Build it
    from exercise 3's fact. The README walks [1, 0] around the unit circle and
    shows where it lands — that is all cosine and sine are — and then asks you
    the same question about [0, 1]. Answer that one, and you are holding
    everything the matrix is made of.

    numpy's trig functions take radians. There is a function for the
    conversion; you used its opposite in 1.2.
    """
    raise NotImplementedError("exercise 5")


def compose(first: np.ndarray, second: np.ndarray) -> np.ndarray:
    """EXERCISE 6 — one matrix that does both, in order.

    Return the single matrix that applies `first`, and then applies `second`
    to the result. For any data X:

        transform(compose(first, second), X)
            ==  transform(second, transform(first, X))

    Numpy, no loops, no comprehensions.

    There are two products you could write and only one of them is right, so
    do not guess: let the shapes decide. If `first` is (k, d_in) and `second`
    is (d_out, k), only one of the two orders is even defined, and the shape
    it produces tells you it is the one you wanted.

    The order comes out backwards from the way you say it out loud, and that
    catches everybody once. Say the shapes rather than the story.
    """
    raise NotImplementedError("exercise 6")


def forward(X: np.ndarray, layers: list[tuple[np.ndarray, np.ndarray]]) -> np.ndarray:
    """EXERCISE 7 — the payoff: a stack of layers, which is most of a network.

    `layers` is a list of (W, b) pairs. Each pair is one layer: it takes the
    rows it is given, moves them with W the way exercise 2 does, and adds b to
    every one of them. Apply the layers in order, first pair first, and return
    the rows that come out.

        X is (5, 3)
        layers = [(W1 (4, 3), b1 (4,)),
                  (W2 (2, 4), b2 (2,))]
        forward(X, layers) is (5, 2)

    Numpy. A `for` loop over the LAYERS is expected here — walking the stack
    is the job. There must be no loop over the rows of X: each layer moves
    every row at once, which is the whole reason the shapes above work.

    An empty list returns X unchanged. A stack of no layers does nothing.

    b has shape (d_out,) rather than (n, d_out) because it is added to every
    row, which is 1.3's broadcasting doing exactly what it did there.

    What you have when this passes is a neural network's forward pass with one
    thing missing. stretch.py is about what that missing thing is for, and it
    is the best argument for it you will meet.
    """
    raise NotImplementedError("exercise 7")


def _demo() -> None:
    """Not scored. Run this file directly once all seven pass:

        python lessons/01-foundations/04-transformations/exercises.py

    It moves the corners of a square through three transformations, so you can
    see what each one did to the same four points, and then runs a stack.
    """
    square = np.array([[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]])
    todo = []
    for name, call in (
        ("transform", lambda: transform(np.eye(2), square)),
        ("basis_images", lambda: basis_images(np.eye(2))),
        ("is_linear", lambda: is_linear(lambda v: v, 2)),
        ("rotation", lambda: rotation(0.0)),
        ("compose", lambda: compose(np.eye(2), np.eye(2))),
        ("forward", lambda: forward(square, [])),
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
        print("    progress 1.4")
        return

    scale = np.array([[2.0, 0.0], [0.0, 3.0]])
    shear = np.array([[1.0, 1.0], [0.0, 1.0]])
    turn = rotation(90.0)

    print("the corners of the unit square")
    print(f"    {square.astype(int).tolist()}")
    print("")
    for name, M in (("scale x2 y3", scale), ("shear", shear), ("rotate 90", turn)):
        moved = np.round(transform(M, square), 12).astype(int).tolist()
        lands = np.round(basis_images(M), 12).astype(int).tolist()
        print(f"    {name:<12}{str(moved):<40}basis lands at {lands}")

    print("")
    print("turn then shear, two ways, and then the other order:")
    for label, moved in (
        ("composed", transform(compose(turn, shear), square)),
        ("one at a time", transform(shear, transform(turn, square))),
        ("shear first", transform(compose(shear, turn), square)),
    ):
        print(f"    {label:<15}{np.round(moved, 12).astype(int).tolist()}")

    rng = np.random.default_rng(0)
    X = rng.normal(size=(5, 3))
    stack = [
        (rng.normal(size=(4, 3)), rng.normal(size=4)),
        (rng.normal(size=(2, 4)), rng.normal(size=2)),
    ]
    zero_bias = [(W, np.zeros_like(b)) for W, b in stack]
    print("")
    print(f"a stack moves shapes along: {X.shape} -> {forward(X, stack[:1]).shape} -> {forward(X, stack).shape}")
    print("with every b zeroed, the whole stack passes is_linear: "
          f"{is_linear(lambda v: forward(v[None, :], zero_bias)[0], 3)}")
    print("")
    print("Nothing at all sits between those two layers. stretch.py asks what")
    print("that costs, and the answer is the reason activation functions exist.")


if __name__ == "__main__":
    _demo()

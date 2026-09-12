"""
Lesson 1.4 — stretch. Optional, not scored, no tests.

One demonstration, in two halves. The first half shows that a stack of layers
with nothing between them is a single layer wearing a costume. The second half
breaks that, with the smallest possible change, and the difference between the
two is the reason every neural network ever built has activation functions in
it.

Run:

    python lessons/01-foundations/04-transformations/stretch.py

You will want numpy, and `forward` from exercises.py; add those imports
yourself.
"""

# ---------------------------------------------------------------------------
# TASK 1 — flatten a whole stack into one layer
# ---------------------------------------------------------------------------
#
# Take a stack of layers — the (W, b) pairs from exercise 7 — and produce the
# SINGLE (W, b) that does the same thing to any input.
#
# You could grind through the algebra. Do not. You already have a better tool,
# and using it here is the point of the task.
#
# The stack as a whole is a function from d_in numbers to d_out numbers. If it
# is affine — a linear map plus a shift — then two questions settle it
# completely, and both are questions you know how to ask:
#
#   1. Where does the ZERO vector go? Nothing linear can move the origin, so
#      whatever comes out is the shift, on its own, with no linear part mixed
#      in.
#   2. Where does each BASIS vector go? Exercise 3 says those images are the
#      columns of the matrix — but careful: the stack moves the basis AND adds
#      the shift, and you want the matrix without the shift.
#
# Answer those two and you have W and b, without differentiating anything or
# expanding a single product. Feed `np.eye(d_in)` through `forward` and read
# the answer off.
#
# Check it properly. Build a random stack — three or four layers, different
# widths, say 3 -> 8 -> 5 -> 2 — and confirm that your single layer and the
# whole stack agree to about 1e-9 on a hundred random rows. Not one row: one
# row can agree by luck.
#
# Then print the two parameter counts. Every number in every W and b is a
# number the machine would have to learn. Count them for the stack, count them
# for your collapsed version, and look at the ratio. All of that capacity buys
# nothing, because both functions compute exactly the same thing.


def collapse(layers):
    """The single (W, b) that does what the whole stack does."""
    raise NotImplementedError("stretch task 1")


# ---------------------------------------------------------------------------
# TASK 2 — break it
# ---------------------------------------------------------------------------
#
# Now put something between the layers. Write a second forward pass that is
# identical to exercise 7 except that after every layer EXCEPT THE LAST it
# applies `np.tanh` to every number.
#
# tanh does nothing clever. It squashes each number, on its own, into the range
# -1 to 1. It does not mix components, it does not look at the other rows, and
# it has no parameters to learn. It is the smallest thing you could possibly
# insert.
#
# Three things to do with it:
#
#   1. Run `collapse` on the same stack and compare its prediction against the
#      tanh version on those hundred random rows. Print the largest absolute
#      difference. On the version without tanh that number was around 1e-15.
#      Look at what it is now.
#
#   2. Check the tanh version against `is_linear` from exercise 4. Wrap it so
#      it takes a single 1-D vector, and subtract the output at zero first, so
#      that what you are testing is the linear part rather than the shift —
#      otherwise you are only rediscovering that a bias exists.
#
#   3. Ask whether ANY single layer could reproduce it. You do not need a
#      search: a single layer is affine, an affine function sends the midpoint
#      of two inputs to the midpoint of their two outputs, and you can test
#      that in three lines on the tanh version. Pick two rows, average them,
#      push all three through, and compare.
#
# What you have then is not an opinion about activation functions. It is a
# measurement: without one, depth collapses to a single layer and the extra
# parameters are wasted; with one, it does not.
#
# Worth knowing, and worth not over-claiming: this shows the collapse fails,
# which is necessary for depth to be useful. It does not show what depth then
# buys you. That question is phase 3, and it is a much harder one.


def tanh_forward(X, layers):
    """exercise 7's forward pass, with tanh between the layers."""
    raise NotImplementedError("stretch task 2")


if __name__ == "__main__":
    print("Implement collapse and tanh_forward, then compare them here.")

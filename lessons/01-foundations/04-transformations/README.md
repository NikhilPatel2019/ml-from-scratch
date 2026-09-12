# 1.4 — Matrices as transformations

In 1.3 a matrix was a filing cabinet: `X` had one row per document, one column
per feature, and every operation you wrote was about organising numbers.

This lesson takes the same object — the same grid of numbers, stored the same
way — and asks a different question of it. Not *what does this matrix hold*,
but **what does this matrix do**.

The answer is that a matrix is a function. It takes a vector in and gives a
vector back, and the way it does that has a shape you can see. Once you can see
it, a neural network stops being a diagram with circles and arrows and becomes
something you could have invented.

## What changes here

Nothing about the numbers. Everything about the reading.

| | 1.3 — data | 1.4 — transformation |
|---|---|---|
| A row is | one thing (a document, a house) | nothing in particular |
| A column is | one feature | **where one basis vector lands** |
| `M @ v` means | pairing up | applying a function |
| The shape `(3, 2)` means | 3 things, 2 features | takes 2-D in, gives 3-D out |

Both readings are used constantly, often on the same page, and the only way to
tell which one you are in is to ask what the author is doing with it. When the
matrix holds your data, it is a table. When it multiplies your data, it is a
transformation.

This lesson is about the second. The exercises still use the row-shaped data
from 1.3, because that is what you will really have.

## A matrix takes a vector and gives back a vector

Start small enough to check by hand.

```
M = [[2, -1],        v = [4, 5]
     [0,  3]]
```

There are two ways to read the multiplication `M @ v`, and they give the same
answer. One of them explains far more than the other.

**The row reading.** Each number in the answer is a dot product of one row of
`M` with `v` — 1.1's operation, done twice:

```
row 0:  2*4 + (-1)*5  =  8 - 5   =  3
row 1:  0*4 +    3*5  =  0 + 15  =  15

M @ v = [3, 15]
```

**The column reading.** The answer is `v`'s numbers used as *weights on the
columns of `M`*:

```
4 * [2, 0]  +  5 * [-1, 3]
= [8, 0]    +  [-5, 15]
= [3, 15]
```

Same `[3, 15]`. The row reading tells you how to compute it. The column reading
tells you what it **means**: the output is built out of `M`'s columns, and `v`
only says how much of each column to use.

Sit with that for a second, because everything below is a consequence of it.

The shapes behave as 1.3 taught you: `(2, 2) @ (2,) -> (2,)`. The inner numbers
meet and vanish. A `(3, 2)` matrix takes a 2-component vector and returns a
3-component one, which is why the shape is written `(d_out, d_in)` — the
output size comes first, however backwards that reads.

Exercise 1 is the column reading, by hand, in plain Python.

## Where the basis vectors land

The **basis vectors** are the plainest vectors there are: one 1, everything
else 0.

```
e0 = [1, 0]        e1 = [0, 1]
```

Run `e0` through the column reading. The weights are 1 and 0:

```
1 * [2, 0]  +  0 * [-1, 3]  =  [2, 0]
```

That is column 0, untouched. And `e1` picks out column 1: `[-1, 3]`.

So:

> **The columns of a matrix are where the basis vectors land.**

That single sentence is what this lesson is for. It turns a matrix from a block
of numbers into a picture you can hold: `M` above takes the arrow `[1, 0]` and
puts it at `[2, 0]`, takes the arrow `[0, 1]` and puts it at `[-1, 3]`, and
those two facts are the entire matrix — there is nothing else in it.

And it is enough to know where *everything* goes, because every vector is built
from the basis:

```
v = [4, 5] = 4*e0 + 5*e1     ->     lands at 4*[2, 0] + 5*[-1, 3] = [3, 15]
```

Which is the same arithmetic as before, read as a sentence: *"`v` was 4 of the
first arrow and 5 of the second; afterwards it is 4 of wherever the first one
went and 5 of wherever the second one went."*

Exercise 3 makes you build this rather than take it from me. Watch the shape
when you do: `M` is `(d_out, d_in)`, and one image per input axis is
`(d_in, d_out)`. Those are not the same shape, and noticing why is the exercise.

## Rows and columns: the convention clash

Here is the practical problem, and it is the one that will actually cost you
time.

Every textbook, every video, every paper writes a transformation as acting on a
single column vector: `M @ v`. But your data, since 1.3, is a `(n, d)` table
with **one thing per row**. Every library stores it that way, because rows are
records.

So you have:

```
X  is (n, d_in)        one row per thing
M  is (d_out, d_in)    written for one column vector at a time
```

and you want `(n, d_out)`: every row, moved.

Do not guess at this, and do not try both orders until one stops raising an
error. Line the shapes up the way 1.3 did and ask which pairing `@` can even
accept: it pairs the last axis of the left operand with the first axis of the
right one, and those two must be equal. Write down the shape of each operand
you could hand it — including the transpose of each, which 1.3 gave you — and
only one arrangement produces `(n, d_out)`.

That arrangement is exercise 2, and once you have it, everything else in this
lesson is one line long.

Two things worth knowing about it afterwards:

- On a square `M` the wrong arrangement raises nothing and returns numbers that
  are wrong in a way you cannot see. This is the 1.3 `keepdims` lesson wearing
  new clothes, and it will keep happening for the rest of your career.
- When you read `x @ W.T` in someone's PyTorch code, that is this, and now you
  know why the `.T` is there. Frameworks store a layer's matrix as
  `(out_features, in_features)` for exactly the reason above.

## What "linear" actually means

"Linear" is not a soft word meaning "roughly straight". It is two rules:

```
1.  f(a + b)  ==  f(a) + f(b)          adding first is the same as adding after
2.  f(s * a)  ==  s * f(a)             scaling first is the same as scaling after
```

Check the first one on `M`, with `a = [1, 0]` and `b = [0, 1]`:

```
f(a + b) = M @ [1, 1] = [1, 3]
f(a) + f(b) = [2, 0] + [-1, 3] = [1, 3]      the same
```

And the second, with `v = [4, 5]` and `s = 2`:

```
f(2v) = M @ [8, 10] = [6, 30]
2 * f(v) = 2 * [3, 15] = [6, 30]             the same
```

Every matrix obeys both rules, always. That is not a coincidence — it falls
straight out of the column reading, where the output is the weights applied to
fixed columns. Double the weights and you double the output. Add two sets of
weights and you add two outputs.

**What it looks like.** If you drew a grid on the plane and applied a matrix to
every point, the grid lines would stay straight, stay parallel, and stay evenly
spaced, and the origin would not move. Straight lines in, straight lines out.
That is the visual meaning of those two rules, and it is what 3Blue1Brown's
chapter 3 animates.

**The origin cannot move.** Put `a = 0` in rule 2 with `s = 0`: `f(0) = 0` for
every linear function. A matrix always sends the zero vector to the zero vector.

**And so a bias is not linear.** Take `g(v) = M @ v + c` with `c = [1, 1]`:

```
g(a + b)      = [1, 3] + [1, 1]                = [2, 4]
g(a) + g(b)   = ([2, 0] + [1, 1]) + ([-1, 3] + [1, 1])  = [3, 5]
```

They differ by exactly `c`, because the right-hand side picked the bias up
twice. And `g(0) = [1, 1]`, so the origin moved.

A function like `g` has a name — **affine**: a linear map plus a shift. It is
not linear, and the distinction matters, because a neural network layer is
affine, not linear. Exercise 4 asks you to detect the difference in code, and
exercise 7 is where you build the thing that has it.

## Building a transformation: decide where the basis goes

Read the rule backwards and it becomes a construction kit. If the columns are
where the basis vectors land, then to build a transformation you decide where
you want the basis to land, and write those down as the columns.

**Stretch x by 2 and y by 3.** `[1, 0]` should end at `[2, 0]`, and `[0, 1]` at
`[0, 3]`. Write those as columns and you have the matrix, and applying it to the
corners of the unit square gives `[0,0], [2,0], [2,3], [0,3]` — a 2-by-3
rectangle.

**A shear.** Leave `[1, 0]` where it is; send `[0, 1]` to `[1, 1]`. The square's
corners become `[0,0], [1,0], [2,1], [1,1]` — the bottom edge is pinned and the
top edge has slid sideways. Vertical lines tilt; horizontal lines do not move.

**A flip.** Send `[1, 0]` to `[-1, 0]` and leave `[0, 1]`. Everything is
mirrored across the vertical axis.

None of those needed a formula. You decided where two arrows go and the matrix
wrote itself.

## Turning by an angle

Rotation is the same construction, and it is exercise 5. It needs one fact from
trigonometry, and the fact is smaller than it looks.

Take the point `[1, 0]` and walk it counter-clockwise around the unit circle by
an angle. Where is it? **That is the definition of cosine and sine.** They are
not formulas to memorise; they are the names of the two coordinates of that
point:

```
angle    where [1, 0] ends up
-----    --------------------
  0°     [1, 0]                  cos 0 = 1,      sin 0 = 0
 45°     [0.7071, 0.7071]        cos 45 ≈ 0.707, sin 45 ≈ 0.707
 90°     [0, 1]                  cos 90 = 0,     sin 90 = 1
180°     [-1, 0]
```

So you already have the first column for any angle you like.

Now the question the exercise turns on, and it is worth drawing rather than
reasoning about in words: **where does `[0, 1]` end up?**

`[0, 1]` starts a quarter turn counter-clockwise of `[1, 0]`. A rotation turns
everything by the same amount, so afterwards it is still a quarter turn ahead of
wherever `[1, 0]` landed. Read that point off the unit circle the same way you
read the first one — it is the same two coordinates at an angle 90° further
round — and you have the second column.

Draw it at 90° first, where the numbers are 0 and 1 and you can check the
picture against your arithmetic. Then do it in general.

Two properties worth testing once you have it, because they are what "rotation"
means: lengths do not change, and doing 45° twice is the same as doing 90° once.
The tests check both.

## One after another

You have a transformation `A` and another one `B`, and you want the result of
doing `A`, then `B`.

You could apply them one at a time. But the composition of two linear functions
is itself linear — it must be, since neither step can bend a straight line — and
every linear function is a matrix. So there is a **single matrix** that does
both, and finding it is exercise 6.

The order is where everyone slips, so use the shapes rather than the story. If
the first transformation is `(k, d_in)` and the second is `(d_out, k)`, only one
of the two possible products has the `k`s meeting in the middle, and the one
that works leaves you with `(d_out, d_in)` — which is the shape a single
transformation from `d_in` to `d_out` must have.

**Order matters, and not slightly.** Turn 90° counter-clockwise, then mirror the
first axis. Apply that to `[1, 1]`:

```
turn:  [1, 1] -> [-1, 1]        mirror: [-1, 1] -> [1, 1]
```

It came back to where it started. Now the other order:

```
mirror: [1, 1] -> [-1, 1]       turn:   [-1, 1] -> [-1, -1]
```

`[1, 1]` and `[-1, -1]` are not the same point. `A` then `B` and `B` then `A`
are different transformations, and the matrix product reflects that: swapping
the order of a product changes the answer. This is the first operation you have
met where that is true — numbers, dot products and additions have all been
happily commutative until now.

## Why this makes neural networks click

A layer of a neural network does exactly two things to the rows it is given:
moves them with a matrix, and adds a bias to every row. That is exercise 7,
and the `(n, d)` in, `(n, d_out)` out shape is why a network can process a whole
batch at once.

Stack two of them and you have a two-layer network. Stack ten and you have a
deep one. Each matrix can take you to a different number of dimensions — 3 to
4 to 2 in the exercise — and following those shapes through the stack is
exactly how you read an architecture diagram.

Now the thing worth carrying out of this lesson:

> Applying a matrix and then another matrix is the same as applying one matrix.
> That is exercise 6.

So a stack of layers with nothing in between them can do no more than a single
layer can. All that depth collapses. Ten layers, a hundred layers, any width —
still one matrix, still straight lines to straight lines.

What breaks the collapse is putting something **not linear** between the layers:
a function applied to each number that bends it, like `tanh` or `max(0, x)`.
Then the composition is no longer a matrix, the collapse fails, and depth starts
buying you something. That is the whole argument for activation functions, and
it is why exercise 4 spends its time on what linear means.

`stretch.py` has you demonstrate the collapse and then break it, which is the
most convincing version of this paragraph.

## Your work

Seven exercises in `exercises.py`:

1. `combine_columns` — a matrix times a vector, read as columns. Plain Python.
2. `transform` — apply one transformation to every row of your data at once.
3. `basis_images` — where the basis vectors land, built rather than recited.
4. `is_linear` — the two rules, in code, and what a bias does to them.
5. `rotation` — build a rotation from where the basis lands.
6. `compose` — one matrix that does two transformations, in order.
7. `forward` — a stack of layers: a neural network's forward pass, almost.

Run them the usual way:

```bash
progress 1.4
```

Then run the file itself to watch a square get moved around:

```bash
python lessons/01-foundations/04-transformations/exercises.py
```

## Check yourself

Not when the tests pass — when you can answer these without looking:

1. `M` is `(3, 2)`. How many components does its input have, and its output?
   Which of those is the number of rows?
2. Where do you look in a matrix to find out where `[0, 1]` lands?
3. Your data `X` is `(100, 3)` and `M` is `(5, 3)`. Write the expression that
   moves every row, and say what shape comes out.
4. State the two rules that make a function linear. Then say which one
   `f(v) = M @ v + c` breaks, and what happens at the origin.
5. Why is a neural network layer affine rather than linear?
6. Without computing anything: does a rotation change the length of a vector?
   How do you know from the picture rather than from the numbers?
7. `A` then `B` versus `B` then `A` — give an example where they differ, using
   two transformations you can picture.
8. Ten linear layers with nothing between them are equivalent to how many
   layers? Say why in one sentence.
9. Which of this lesson's bugs would raise an error, and which would hand you
   plausible numbers? What are you going to do about the second kind?

Write your answers in `notes.md`, in your own words.

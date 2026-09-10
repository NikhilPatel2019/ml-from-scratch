# 1.3 — Matrices as data

**Before you start:** you should be able to write `dot`, `magnitude`,
`normalise`, `cosine_similarity` and `distance` without looking them up. This
lesson does all five of them to a whole table at once.

---

## What changes here

For two lessons you have worked with one vector at a time. Real data does not
arrive one at a time. It arrives as a **table**: a thousand documents, ten
thousand customers, sixty thousand images — each one a row, each row a vector.

```
X = [[8, 7, 0],      ← "cooking"      one row = one thing
     [7, 9, 0],      ← "baking"
     [0, 0, 8],      ← "rust"
     [1, 0, 9]]      ← "python"
```

That is a **matrix**. It is not a new kind of object with new rules; it is a
stack of the vectors you already understand. What is new is doing something to
all of them at once, without a loop, and the whole lesson is about the two
tools that let you.

By the end you will write the search from 1.1 and 1.2 the way a real system
writes it: **one operation for the whole library**, not one per item.

## Shape is the thing you check

Every numpy array has a `.shape` — a tuple saying how big it is along each
axis. For a table it is `(rows, columns)`, and this curriculum will write it
`(n, d)`: **n** things, each with **d** numbers.

```
X.shape       (4, 3)     four rows, three columns
X[0]          the first row      shape (3,)
X[:, 0]       the first COLUMN   shape (4,)
X[0, 2]       one number         shape ()
```

Read `X[:, 0]` as "every row, column zero". The colon means *all of them*.

**Print `.shape` when something is wrong, before you print the values.** Almost
every numpy bug is a shape bug, and shapes are small enough to read at a glance
while a 4096-element array is not. Getting into this habit now will save you
more time than anything else in this lesson.

One shape distinction matters more than it looks:

```
shape (3,)      a plain run of three numbers, no rows or columns
shape (1, 3)    one row of three
shape (3, 1)    three rows of one
```

All three hold three numbers. They behave completely differently, and telling
them apart is most of the lesson.

## `axis`: which direction do you collapse?

Take a small table:

```
X = [[1, 2, 3],
     [4, 5, 6]]        shape (2, 3)
```

`X.sum()` adds everything and gives you `21`, shape `()`. Useful sometimes, but
usually you want one number *per row* or one *per column*, and `axis` says
which.

The rule that makes this stick: **`axis=k` is the axis that disappears.**

```
X.sum(axis=0)     ->  [5, 7, 9]      shape (3,)
                      axis 0 was the rows, so the rows are gone.
                      Three column totals remain.

X.sum(axis=1)     ->  [6, 15]        shape (2,)
                      axis 1 was the columns, so the columns are gone.
                      Two row totals remain.
```

Check it against the numbers: `1+4=5`, `2+5=7`, `3+6=9` down the columns; `1+2+3=6`
and `4+5+6=15` across the rows.

People memorise "axis=0 means columns" and then get it backwards forever,
because it sounds like it should mean rows. Do not memorise the conclusion.
Memorise **the axis you name is the one that vanishes**, and derive the rest.

You start at `(2, 3)`. Naming `axis=0` removes the `2`, leaving `(3,)`. Naming
`axis=1` removes the `3`, leaving `(2,)`. The shape arithmetic tells you the
answer every time.

`np.mean`, `np.max`, `np.linalg.norm` and most of the rest take the same
argument and follow the same rule.

## Broadcasting: the rule, and then the reason

You want to subtract the column averages from a table. The averages are three
numbers, the table is `(2, 3)`. Different shapes — and numpy does it anyway:

```
X    = [[1, 2, 3],        shape (2, 3)
        [4, 5, 6]]

mean = [2.5, 3.5, 4.5]    shape (3,)

X - mean  =  [[-1.5, -1.5, -1.5],
              [ 1.5,  1.5,  1.5]]
```

That is **broadcasting**: numpy stretched the row of three across both rows of
the table without copying it, and did six subtractions.

The rule, in full, and it is shorter than its reputation:

1. **Line the shapes up from the right.**
2. Two dimensions are compatible if they are **equal**, or if **one of them is
   1**.
3. A shape that runs out on the left is treated as 1s.

Worked on the case above:

```
X       (2, 3)
mean       (3)        ← line up from the RIGHT
mean    (1, 3)        ← the missing left dimension is treated as 1
                      ← 3 vs 3: equal, fine
                      ← 2 vs 1: one of them is 1, so stretch it
result  (2, 3)
```

Now a case that fails, and this is the one you will hit:

```
X         (2, 3)
lengths      (2)
lengths   (1, 2)      ← lined up from the right
                      ← 3 vs 2: not equal, neither is 1
ValueError: operands could not be broadcast together with shapes (2,3) (2,)
```

You wanted those two numbers to go **down** the rows. Numpy lined them up
against the columns, because lining up from the right is the only rule it has.

## `keepdims`, and the bug that says nothing

This is the sharpest edge in the lesson, so here it is in full.

You want every row of `X` scaled to length 1. You have `row_lengths` from
exercise 2, which gives you one number per row:

```
X       = [[3, 4],        shape (2, 2)
           [5, 12]]

lengths = [5, 13]         shape (2,)
```

Divide, and numpy lines `(2,)` up against the **columns**:

```
X / lengths  =  [[3/5,  4/13],      ← the 5 went to column 0,
                 [5/5, 12/13]]         the 13 went to column 1
```

**No error. No warning.** Every number is a plausible-looking float. The rows
of that result have lengths `0.674` and `1.361`, and you have to go and check
to find out.

The fix is to keep the axis you collapsed, as a dimension of size 1:

```
lengths without keepdims    shape (2,)      [5, 13]
lengths with    keepdims    shape (2, 1)    [[5],
                                             [13]]
```

Now the shapes line up the way you meant:

```
X          (2, 2)
lengths    (2, 1)     ← 2 vs 1: stretch the columns
                      ← 2 vs 2: equal
result     (2, 2)     the 5 divides all of row 0, the 13 all of row 1
```

Almost every reduction in numpy takes `keepdims=True` and it does this same
job. Reach for it whenever the result of a reduction is going back into an
arithmetic operation with the thing you reduced.

**Why this bug is worth a whole section:** on a square table it is completely
silent. Your matrix is `(2, 2)`, your divisor is `(2,)`, the shapes are
compatible, the answer is wrong. The tests for exercise 4 deliberately use a
non-square table so numpy raises instead — but a real dataset will not do you
that favour.

## Transpose, and every dot product at once

`X.T` swaps rows and columns. `(4, 3)` becomes `(3, 4)`, and the entry that was
at `[i, j]` is now at `[j, i]`.

On its own, mildly interesting. Combined with `@`, it does something worth
having.

Here it is on a table, worked:

```
A = [[1, 2],          A.T = [[1, 3, 5],
     [3, 4],                 [2, 4, 6]]
     [5, 6]]

shape (3, 2)                 shape (2, 3)
```

Row `[1, 2]` became column `[1, 2]`. Nothing was computed; the same six numbers
are being read the other way round.

Now the other half. `@` between two matrices pairs **every row of the left with
every column of the right**, and each such pairing is a dot product:

```
A = [[1, 2],       B = [[1, 0, 1],        A @ B = [[1, 4, 7],
     [3, 4],            [0, 2, 3]]                 [3, 8, 15],
     [5, 6]]                                       [5, 12, 23]]

    (3, 2)      @      (2, 3)         ->           (3, 3)
```

Check one entry by hand: `[0, 1]` is row 0 of `A` dotted with column 1 of `B`,
which is `1×0 + 2×2 = 4`.

Read the shapes: the inner numbers `2` and `2` must match — they are the length
of the vectors being dotted — and they vanish, leaving the outer numbers. That
is how you predict a matmul's shape without thinking about the arithmetic, and
it is worth doing every time before you write the line.

**Now put the two together.** You want every row of `X` dotted with every row of
`X`. `@` pairs rows on the left with *columns* on the right. So what does the
right-hand side need to be? That question is exercise 5, and the answer is one
operation where a loop would have been `n²` of them.

Two sanity checks you can do in your head once you have it: the result must be
square, and it must equal its own transpose — because row `i` dotted with row
`j` is the same number as row `j` dotted with row `i`.

## A new axis out of nothing

The last tool. Sometimes you need every pair of rows, not every pair of dot
products — for instance every *difference*, so you can take every distance.

`X[:, None, :]` inserts a new axis of size 1 in the middle. Read it as "every
row, a new empty axis, every column":

```
X                shape (3, 2)
X[:, None, :]    shape (3, 1, 2)     a new axis in the middle
X[None, :, :]    shape (1, 3, 2)     a new axis at the front
```

Nothing has been computed. The same six numbers are being presented with an
extra empty dimension, so that broadcasting has somewhere to stretch.

Apply the rule from earlier to those two shapes, lining up from the right:

```
(3, 1, 2)
(1, 3, 2)
---------      2 vs 2: equal.  1 vs 3: stretch.  3 vs 1: stretch.
(3, 3, 2)      nine pairs, each of 2 components
```

So an operation between those two shapes produces every row paired with every
row — nine results, each a 2-component vector. If the operation is subtraction,
entry `[i, j]` is the vector from one row to another.

That gets you the differences. **Exercise 6 wants distances**, which means
turning each of those 9 little vectors into a single length. You did exactly
that to rows in exercise 2 with `axis=1`; here the components live on the last
axis, and `axis=-1` means "the last one" whatever the rank happens to be.

This is the thing `stretch.py` in 1.2 asked you to reach for.

At `n = 2000` this builds a `2000 × 2000 × d` array, which is worth knowing
about before you point it at a million rows. `stretch.py` measures both the
speed and the memory so the trade-off is a number rather than a warning.

## Your work

Seven functions in `exercises.py`. Every one is checked for its output **shape**
as well as its values, because a right answer in the wrong shape is this
lesson's characteristic bug.

| # | Function | What is new |
|---|---|---|
| 1 | `shape_of` | plain Python; what a shape check actually is |
| 2 | `row_lengths` | `axis=` |
| 3 | `centre` | broadcasting a row across a table |
| 4 | `unit_rows` | `keepdims`, and the silent bug |
| 5 | `gram` | transpose and `@` |
| 6 | `pairwise_distances` | a new axis out of nothing |
| 7 | `rank_all` | all of it, on the search from 1.1 |

```bash
progress 1.3
```

Once all seven pass, run the file directly to watch the shapes move:

```bash
python lessons/01-foundations/03-matrices/exercises.py
```

`stretch.py` is optional and not scored. It times your `rank_all` against the
one-at-a-time version from 1.1 and measures what the `(n, n, d)` array costs in
memory — the two numbers that decide whether this approach survives contact
with real data.

## Check yourself

You are done when you can answer these out loud, without looking:

1. `X.shape` is `(50, 4)`. What is the shape of `X.sum(axis=0)`? Of
   `X.sum(axis=1)`? Say the rule you used, not the answer you remember.
2. What is the difference between shape `(3,)`, `(1, 3)` and `(3, 1)`?
3. Line up `(6, 4)` and `(4,)` and say whether they broadcast. Now `(6, 4)` and
   `(6,)`. Why does one work and not the other?
4. What does `keepdims=True` do, and when do you need it?
5. Why is the `keepdims` bug more dangerous on a square matrix than a
   rectangular one?
6. `A` is `(5, 3)` and `B` is `(3, 8)`. What shape is `A @ B`, and which number
   vanished?
7. You give `X` a new axis in the middle, give it another at the front, and
   subtract the two. What shape comes out, and what is at entry `[i, j]`?
8. You have ten million documents. Which of these seven functions would you
   not run on all of them at once, and what would you do instead?

Write your answers in `notes.md`, in your own words.

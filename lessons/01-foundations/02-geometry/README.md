# 1.2 — Vector geometry

**Before you start:** you should be able to write `dot`, `magnitude`,
`normalise` and `cosine_similarity` from memory. If any of those is fuzzy, go
back to 1.1 first. Everything here is built on them.

---

## The question this lesson answers

In 1.1 you built a search engine. It ranked a small library by cosine
similarity and returned the closest item. It worked.

Here is the thing I did not tell you: **there is more than one way to measure
"closest", and they do not always agree.** Not in an edge case. Routinely, on
ordinary data, in a way that changes which document your system returns.

That is not a footnote. Choosing between them is a decision you will make in
every retrieval system, every recommender and every clustering job you ever
touch, and most people make it by accident. By the end of this lesson you will
make it on purpose.

## Two questions, not one

Take two vectors. There are two completely different things you might mean by
"how close are these?"

**How far apart are they?** Stand at one and walk to the other. That is
**distance**, and it is Pythagoras again — the same formula as `magnitude`, just
applied to the gap between the two points instead of to one point.

```
distance(a, b)  =  |a - b|
```

Read that right to left: subtract to get the vector *from* b *to* a, then take
its length. You already have `magnitude`. Distance is `magnitude` of the
difference. That is the whole of exercises 1 and 2.

**Do they point the same way?** Ignore how long each one is; ask only about
direction. That is the **angle**, and cosine similarity — which you already
wrote — is one step away from it.

Two vectors can be far apart and point identically. Two vectors can be close
together and point in different directions. Neither measure is wrong; they are
answers to different questions.

## Where they disagree, concretely

Say you have documents represented by two numbers: how much they talk about
cooking, and how much they talk about baking.

```
query      = [2,  2]      a short note about cooking and baking
short_doc  = [1,  1]      a short article, same topics, same balance
long_doc   = [10, 10]     a long book, same topics, same balance
off_topic  = [0,  3]      a short article about baking only
```

By **angle**, `short_doc` and `long_doc` are both a perfect match — 0 degrees
from the query. Identical direction. `off_topic` is 45 degrees away.

By **distance**, `short_doc` is 1.41 away, `off_topic` is 2.24 away, and
`long_doc` is 11.3 away — the *worst* of the three, despite pointing exactly
where the query points.

So: is the book about the same thing as the query? Obviously yes. Is it *near*
the query? Not remotely. Distance punished it for being long.

**This is the same flaw you fixed in 1.1**, wearing different clothes. The raw
dot product was inflated by magnitude and you divided it out. Distance is
*also* sensitive to magnitude — it just is not a bug there, because measuring
how far apart things are is the entire job of a distance.

### Which one do you want?

- **Text, embeddings, recommendations, anything where "length" means "amount of
  document" rather than "amount of the thing"** — use the **angle**. A long
  document about cats and a short document about cats are about the same thing.
- **Positions, coordinates, physical measurements, anything where magnitude is
  the signal** — use **distance**. Two temperature readings of 20°C and 200°C
  are not "the same, just louder".

There is a shortcut worth knowing. **If every vector is normalised to length 1,
the two measures rank identically.** They are not equal — they are still
different numbers — but sorting by one gives the same order as sorting by the
other. This is why production vector databases store embeddings pre-normalised:
you can then use fast distance search hardware and still get cosine ranking. You
will prove this to yourself in `stretch.py`.

## The identity that connects them

One equation ties the dot product to geometry, and it is worth committing to
memory:

```
a . b  =  |a| × |b| × cos(theta)
```

In words: the dot product is the product of the two lengths, scaled by how
aligned the directions are.

Read it three ways, because each one is used somewhere later:

1. **Solve for cos(theta)** and you get cosine similarity, which is what you
   wrote in 1.1. You were not inventing a metric. You were rearranging this.
2. **Set theta to 90°.** cos(90°) = 0, so the whole right-hand side is 0.
   Perpendicular vectors have a dot product of zero. That is why "dot product of
   zero means unrelated" is not a coincidence or an analogy — it is this
   equation.
3. **Set both lengths to 1.** The right-hand side becomes just cos(theta), so
   for unit vectors *the dot product already is the cosine*, with nothing to
   divide out. Normalising first turns cosine similarity into a bare dot
   product.

Exercise 3 asks you to rearrange it once more, into degrees.

### One trap, and it is a real one

`arccos` is only defined on `[-1, 1]`. Feed it 1.0000000000000002 and you get
`nan`, silently, and it propagates through everything downstream.

That number is not hypothetical. Compute the cosine of a vector with *itself* in
floating point and you will get exactly that kind of value, because
`(a·a)/(|a|·|a|)` involves a division that does not land precisely on 1. Two
identical vectors — the easiest case imaginable — is where this bites.

The fix is one call to `np.clip`. The habit is worth more than the fix:
**anywhere a mathematical guarantee meets floating point, check the guarantee
still holds.**

### And even clipped, a zero angle is not exactly zero

Clip the cosine and `arccos` stops returning `nan`. It does not start returning
`0.0`. Ask for the angle between `[2,2]` and `[10,10]` — the same direction, no
question about it — and you get `1.2e-06` degrees.

That is not sloppiness in your code. It is `arccos` being **ill-conditioned**
near 0°, and it is worth understanding once because the same shape of problem
turns up throughout numerical work.

Near zero, `cos(t) ≈ 1 - t²/2`. The cosine barely moves as the angle moves —
which means running it backwards, the angle moves *enormously* as the cosine
moves. A cosine wrong in its last bit, about `1e-16`, comes back as an angle
wrong by roughly `sqrt(2 × 1e-16)` radians. That is about `1e-6` degrees, which
is exactly what you see.

So: an angle of 0° and an angle of 180° are the two places `arccos` cannot give
you full precision, and no amount of care in your own code changes that. The
tests allow `1e-4` degrees for "is this angle zero" and say so. When you need to
ask "do these point the same way?" to full precision, ask it of the **cosine**
— which is well-conditioned there — rather than of the angle.

## Projection: splitting a vector in two

This is the idea in the lesson with the longest reach, and it starts with a
picture. Shine a light straight down onto the line through `b`. The shadow that
`a` casts on that line is the **projection of a onto b**.

```
         a
        /|
       / |
      /  |  <- what is left over (the rejection)
     /   |
    +----+--------->  b
     the projection
```

Two pieces. The part of `a` that lies **along** `b`, and the part that lies
**across** it. Add them back together and you have `a` again, exactly.

How far along `b` do you travel? That is one number:

```
(a . b) / (b . b)
```

The numerator is the alignment. The denominator normalises for how long `b` is,
so the answer does not change when you scale `b` — only `b`'s *direction*
matters, which is why `project([3,3], [1,0])` and `project([3,3], [5,0])` give
the same answer. Then you travel that far along `b`, which means multiplying by
`b`.

The leftover — `a` minus its projection — is the **rejection**, and it is always
perpendicular to `b`. That is exercise 5, and it is one line.

### Why this matters more than it looks

"Split a vector into the part explained by a direction, and the part that is
not" is one of the most reused moves in the field:

- **Least squares regression** finds the projection of your data onto the space
  your model can reach. The rejection is the residual — your error.
- **PCA** (lesson 2.12) finds the directions that leave the smallest rejection.
  That is all "principal component" means.
- **Attention** in a transformer decides how much of one token's vector to mix
  into another. The amount is a dot product; the mixing is projection.
- **Gram-Schmidt**, which you will meet if you go near QR decomposition, is
  literally "project, subtract the projection, repeat".

You are writing four lines. They come back for the rest of the curriculum.

## Never compare floats with ==

Exercise 6 looks trivial and is not. Two vectors that are perpendicular in exact
arithmetic will hand you a dot product of `3.06e-17` in floating point, because
0.1 + 0.2 is not 0.3 and never was. Written with `== 0`, your function reports
False on a textbook right angle.

Compare against a tolerance instead. Every numerical library in existence has a
version of this — `np.isclose`, `np.allclose`, `math.isclose` — and the reason
they all exist is that the naive version is wrong often enough to matter.

Build the reflex here, on four lines you can see all of, rather than at 2am
inside something you cannot.

## Your work

Seven functions in `exercises.py`, same shape as 1.1: once by hand, then
vectorised, then built up.

| # | Function | What it is |
|---|---|---|
| 1 | `distance_loop` | Euclidean distance, plain Python |
| 2 | `distance` | the same, vectorised |
| 3 | `angle_between` | in degrees, with the `arccos` trap |
| 4 | `project` | the shadow of `a` on `b` |
| 5 | `reject` | what is left over |
| 6 | `is_orthogonal` | with a tolerance, never `==` |
| 7 | `nearest` | search by distance, and watch it disagree with 1.1 |

Then:

```bash
progress 1.2
```

Once all seven pass, run the file directly to see the disagreement rather than
take my word for it:

```bash
python lessons/01-foundations/02-geometry/exercises.py
```

`stretch.py` is optional and not scored. It asks you to build a full distance
matrix without a loop, and to prove the normalised-vectors claim above
empirically. The first is your introduction to broadcasting, which is the whole
subject of 1.3.

## Check yourself

You are done when you can answer these out loud, without looking:

1. Give me two vectors that are far apart but point in the same direction. What
   does each of the two measures say about them?
2. Why is distance `magnitude` of something? Of what?
3. What does `a . b = |a||b|cos(theta)` become when both vectors have length 1,
   and why does that matter for a vector database?
4. What is the projection of `a` onto `b`, in words, without the formula?
5. Why does `project(a, b)` not change when you double `b`?
6. Why is `if dot == 0` wrong, and what should it be?
7. You are building search over product descriptions. Distance or angle? Why?

Write your answers in `notes.md`, in your own words.

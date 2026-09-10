# Watch alongside 1.3 — Matrices as data

Ordered. One idea, then code it. Do not binge.

## Before the exercises (~35 min)

- [ ] **3Blue1Brown, Essence of Linear Algebra — Ch 3, "Linear transformations
      and matrices"** (~11 min)
      https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
      A warning about this one, because it will feel like a mismatch: 3B1B
      treats a matrix as a **movement of space**, and this lesson treats it as a
      **table of data**. Both are true and they are not the same idea. Today you
      want the table. Watch it anyway, because 1.4 is entirely the other view
      and seeing it early makes that lesson land faster.

- [ ] **NumPy docs — Broadcasting** (~15 min read, not a video)
      https://numpy.org/doc/stable/user/basics.broadcasting.html
      Short, official, and the diagrams are good. Read it after you have read
      the broadcasting section of the README, so you are checking your
      understanding rather than forming it. The "General Broadcasting Rules"
      section is the whole thing in six lines.

## While you work

- [ ] **NumPy docs — Indexing on ndarrays**
      https://numpy.org/doc/stable/user/basics.indexing.html
      Reference, not reading. Go to it when `X[:, None, :]` stops making sense.
      The section you want is "Dimensional indexing tools".

## After the exercises pass

- [ ] **Run your own `stretch.py`.** The speed number and the memory number are
      the two facts that decide whether the approach you just learned survives
      real data, and neither means anything until it is measured on your
      machine.

- [ ] **3Blue1Brown — Ch 4, "Matrix multiplication as composition"** (~10 min)
      Only once exercise 5 passes. You have just written `X @ X.T` as "every
      pairwise dot product". This says what `@` means when neither side is
      data, and it is the bridge into 1.4.

## Deliberately NOT yet

- **einsum.** It does everything in this lesson in one call and is genuinely
  worth learning — later. Learn to predict shapes first; einsum rewards people
  who already can and punishes people who cannot.
- **Sparse matrices, BLAS, GPU arrays.** All the same ideas with different
  storage. Phase 5.

---

## How to watch (this has not changed)

**Watching is not learning.** Close the video and explain the idea out loud
without the animation. If you can't, rewatch. If you can, go and write the code.

For this lesson specifically: no video will give you a feel for shapes. That
comes from typing `X.shape` a hundred times in a REPL and being wrong about it
twenty of them. Keep a Python prompt open the whole way through.

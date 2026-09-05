# Watch alongside 1.2 — Vector geometry

Ordered. One idea, then code it. Do not binge.

## Before the exercises (~25 min)

- [ ] **3Blue1Brown, Essence of Linear Algebra — Ch 9, "Dot products and duality"** (~14 min)
      https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
      This is the one I told you to save until after 1.1 passed. Now is the time.
      The **first half** is exactly this lesson: why the dot product measures
      alignment, and where the projection picture comes from. Watch that.
      The second half, on duality, is genuinely hard and you do not need it yet.
      If it stops making sense around the halfway mark, that is expected — note
      where you lost it and move on. It comes back in Phase 3.

- [ ] **3Blue1Brown — Ch 3, "Linear transformations and matrices"** (~11 min)
      Not needed for these exercises. Watch it if you have the appetite, because
      it is the bridge into 1.3 and 1.4, and seeing it twice will not hurt.

## After the exercises pass

- [ ] **Read your own `stretch.py` output.** The claim in the README — that
      normalised vectors rank the same by distance and by cosine — is the kind
      of thing you should not believe because I wrote it. The stretch file makes
      you check.

## Reference, not viewing

- **NumPy docs, `np.clip`**: https://numpy.org/doc/stable/reference/generated/numpy.clip.html
  Short. Read it when you hit exercise 3 rather than before.

- **`np.linalg.norm`**: https://numpy.org/doc/stable/reference/generated/numpy.linalg.norm.html
  What you would reach for in real code instead of writing `magnitude` yourself.
  Worth reading the `axis` parameter now — it is how `stretch.py` avoids a loop,
  and it is most of lesson 1.3.

- **"What Every Computer Scientist Should Know About Floating-Point Arithmetic"**:
  https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
  Do **not** read this now. Bookmark it. When floating point eventually costs you
  a day, this is where the answer is.

## Deliberately NOT yet

- Anything on eigenvalues, SVD or PCA. Projection is the seed of all three and
  you have just planted it. Phase 2.

---

## How to watch (this has not changed)

**Watching is not learning.** Close the video and explain the idea out loud
without the animation. If you can't, rewatch. If you can, go and write the code.

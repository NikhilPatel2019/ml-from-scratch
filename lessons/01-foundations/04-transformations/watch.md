# Watch alongside 1.4 — Matrices as transformations

Ordered. One idea, then code it. Do not binge.

This is the lesson where the videos and the code finally agree. 1.3 warned you
that 3Blue1Brown was describing something else — this is the something else.

## Before the exercises (~25 min)

- [ ] **3Blue1Brown, Essence of Linear Algebra — Ch 3, "Linear transformations
      and matrices"** (~11 min)
      https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
      If you watched this during 1.3 as suggested, watch it again anyway. It
      will land differently now that you have a reason to want it. The one
      thing to take away: the columns of the matrix are where the basis
      vectors land. Everything in this lesson is that sentence.

- [ ] **3Blue1Brown — Ch 4, "Matrix multiplication as composition"** (~10 min)
      Watch this before exercise 6, not after. It is the same point the
      exercise makes, animated: doing one transformation and then another is
      itself a transformation, so there is a single matrix for the pair, and
      the order of the product reads backwards from the order of the actions.

## While you work

- [ ] **Keep a REPL open with a 2x2 matrix and the four corners of a square.**
      Every claim in this lesson can be checked in three lines. The point of
      exercise 5 is not the trigonometry; it is that you can draw a rotation
      and then confirm the drawing.

- [ ] **NumPy docs — `numpy.matmul`**
      https://numpy.org/doc/stable/reference/generated/numpy.matmul.html
      Reference, not reading. Go to it when a shape error will not resolve. The
      section on how it treats 1-D arguments explains why `M @ v` works without
      you turning `v` into a column.

## After the exercises pass

- [ ] **Run your own `stretch.py`.** Collapse a four-layer stack into one
      layer, then break it with `tanh`. The two numbers you print there are the
      whole argument for activation functions, and you will have measured them
      rather than been told them.

- [ ] **3Blue1Brown — "But what is a neural network?"** (~19 min)
      https://www.3blue1brown.com/topics/neural-networks
      Only after exercise 7. You will recognise what he draws as circles and
      arrows: it is a matrix, a bias and a squashing function, and you will
      have written two of the three. This is the video that makes the diagrams
      stop being decoration.

## Deliberately NOT yet

- **Determinants, eigenvectors, change of basis.** All three are about what a
  transformation does that a picture of the basis cannot show you. 1.5 and 3.x.
  Chapters 5 to 14 of the 3B1B series are excellent and they are not this week.
- **Backpropagation.** You now have the forward pass. Going backwards needs
  calculus, which starts in 1.6, and the chain rule, which is 1.8.

---

## How to watch (this has not changed)

**Watching is not learning.** Close the video and explain the idea out loud
without the animation. If you can't, rewatch. If you can, go and write the code.

For this lesson: after each video, take one specific matrix — `[[2, -1], [0, 3]]`
is a good one — and say out loud where it sends `[1, 0]`, where it sends
`[0, 1]`, and where it sends `[4, 5]`. If any of the three makes you pause, the
video has not landed yet.

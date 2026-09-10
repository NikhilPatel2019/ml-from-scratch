# 1.3 — Matrices as data

> Fill this in **after** you finish the exercises, in your own words. Not copied
> from me. If you can't write the answer, you don't have it yet — and that's the
> point of the exercise. Rewriting an explanation is the cheapest test of
> understanding there is.

## Questions I must be able to answer

1. `X.shape` is `(50, 4)`. What is the shape of `X.sum(axis=0)`? Of
   `X.sum(axis=1)`? Write down the rule you used, not the answer you remember.

2. What is the difference between shape `(3,)`, `(1, 3)` and `(3, 1)`? All three
   hold three numbers — so what actually differs?

3. Line up `(6, 4)` and `(4,)` and say whether they broadcast. Now `(6, 4)` and
   `(6,)`. Why does one work and the other not, in terms of the rule rather
   than the outcome?

4. What does `keepdims=True` do? When do you need it, stated as a situation you
   would recognise rather than as a fact about one exercise.

5. Why is the `keepdims` bug more dangerous on a square matrix than a
   rectangular one? What did you actually see when you hit it?

6. `A` is `(5, 3)` and `B` is `(3, 8)`. What shape is `A @ B`? Which number
   disappeared, and what was it?

7. You give `X` a new axis in the middle, give it another at the front, and
   subtract the two. What shape comes out, and what is at entry `[i, j]`?

8. You have ten million documents. Which of these seven functions would you not
   run on all of them at once? What breaks first — time or memory?

9. Which numpy bug in this lesson raised an error, and which one didn't? What
   is your habit going to be as a result?

## My notes

<!-- write here -->

## Timings from stretch.py

<!-- your machine, your numbers -->

## Things I got wrong

<!-- be honest here. this section is the most valuable one in the whole repo. -->

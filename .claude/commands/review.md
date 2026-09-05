---
description: Review an exercise you have already written, without rewriting it
argument-hint: [exercise name, or blank for the whole lesson]
---

Review: **$ARGUMENTS** (if blank, every implemented exercise in the lesson the
learner is currently on).

They have written this themselves and it is theirs. Review it; do not replace it.

Run `progress <lesson id>` first so you are reviewing against real results rather
than reading alone.

Cover, in this order, and skip anything that has nothing to say:

1. **Correctness.** Does it do what the docstring specifies? What input would
   break it that the tests do not try — an empty sequence, a zero vector,
   mismatched lengths, one element, integers where floats are assumed?
2. **The constraint.** Some exercises reject NumPy or `for` loops on purpose.
   Is the spirit met, not just the letter? A comprehension that walks an array
   elementwise passes the string check and misses the point.
3. **Numerics.** Overflow, precision, integer division, `np.float64` leaking out
   where a plain `float` was meant.
4. **Clarity.** Naming, one obvious shape, no cleverness that costs a reader
   more than it saves. Name any simpler equivalent form and say what it trades.

If you would have written it differently, say what and why — but do not paste a
rewritten version of the function. Describing a change is teaching; writing it
out is doing their exercise for them.

Finish with the single most valuable thing to fix, if there is one.

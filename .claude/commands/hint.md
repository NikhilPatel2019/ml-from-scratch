---
description: The smallest next step on an exercise, never the answer
argument-hint: [exercise name or lesson id, e.g. cosine_similarity]
---

The learner is stuck on: **$ARGUMENTS**

Give a hint, not a solution. You must not write the body of the function, in
this chat or anywhere else — see the rule in CLAUDE.md.

Work in this order:

1. Read their current attempt in the relevant `lessons/**/exercises.py`. If the
   stub is untouched, say so and ask what they think the first line should do
   rather than guessing at what confuses them.
2. Read the docstring and the matching test in `test_exercises.py`. The test is
   the specification; note any source constraint it enforces (no NumPy, no
   `for` loops) because that often *is* the thing blocking them.
3. Give **one** hint — the smallest step that unblocks them:
   - a sub-problem they can solve and print in isolation
   - a two-dimensional case to do on paper first
   - the one NumPy operation to go and read about, named but not applied
   - what an error message is actually telling them, if there is one

End by asking them to try that and come back. Do not stack three hints into one
message, and do not append "and then you would...".

If their attempt is already correct, say so plainly and review it instead.

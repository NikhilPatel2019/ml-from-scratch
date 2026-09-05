# 1.1 — Vectors and the dot product

**Phase 1 · Foundations** · no prerequisites · [exercises](exercises.py) · [what to watch](watch.md) · [your notes](notes.md)

---

## Why we start here

Strip away every buzzword and machine learning is three claims:

1. **Anything can be turned into a list of numbers.** A house, a customer, a photograph, the word "banana".
2. **Once things are lists of numbers, "similar" and "different" become arithmetic** — and arithmetic is something a computer does a trillion times a second.
3. **A model is a large pile of numbers that you adjust until its outputs stop being wrong.**

Phase 1 makes claims 1 and 2 concrete. Today is claim 1, plus the single operation that claim 2 rests on.

That operation is the **dot product**. To be precise about how central it is: a neuron in a neural network is a dot product followed by one simple function. Attention — the mechanism behind every modern large language model — is dot products. Semantic search is dot products. When a model has 175 billion parameters and needs a GPU cluster, what that hardware is doing, almost exclusively, is dot products.

There is no second idea in this field of comparable importance. You will implement it today in about four lines.

---

## The Python you need

If you already program, only the deltas matter:

```python
xs = [1, 2, 3]              # list: dynamically sized, heterogeneous, indexed from 0
xs[-1]                      # 3  — negative indices count from the end
xs[0:2]                     # [1, 2] — slice, end-exclusive
len(xs)                     # 3

def f(a: list[float]) -> float:   # type hints exist but are NOT enforced.
    return a[0]                   # they are documentation; the runtime ignores them.

d = {"a": 1, "b": 2}        # dict
for k in d: ...             # iterates KEYS, not pairs
for x in xs: ...            # no index — this is the idiomatic loop
for i in range(len(xs)): .. # only when you genuinely need the index

total = 0.0                 # no declarations, no type, no semicolon
raise ValueError("nope")    # exceptions: raise, not throw
```

Three gotchas that will bite you:

- **Indentation is syntax.** Four spaces. A misindented line is a different program, not a style violation.
- **`/` is always float division.** `5 / 2 == 2.5`. Integer division is `//`.
- **`**` is exponentiation.** `x ** 0.5` is a square root.

That is enough to start. You will absorb the rest by writing it.

---

## A vector is a list of numbers

Genuinely — that is the whole definition. `[3, 4]` is a vector. `[0.2, -1.7, 0.0, 5.5]` is a vector. In code it is an array.

The word sounds intimidating because physics teaches it as "magnitude and direction, drawn as an arrow". Set the arrows aside for now. **A vector is an ordered list of numbers where each position means something fixed.**

The interesting half is the second one — *each position means something fixed*. That is what turns a list into a representation:

```python
house    = [1500, 3, 12]     # [square feet, bedrooms, age in years]
another  = [1600, 3, 10]
mansion  = [8000, 7,  2]
```

Position 0 is *always* square footage. Position 1 is *always* bedrooms. Now these three lists are comparable, and "is this house like that house" has become a maths problem.

That is the entire trick, and every ML system is built on it. Deciding what goes in each position used to be a job title — *feature engineering*, covered in lesson 2.10. The revolution of deep learning is that networks now **learn** what the positions should mean instead of you specifying them.

**Dimensions** just means "how many numbers are in the list". The house vector is 3-dimensional. Sentence embeddings in a modern LLM are typically 768 to 4096-dimensional. You cannot picture 4096 dimensions and you should stop trying — but every operation you learn in 2D works *identically* in 4096D, unchanged. That is the gift: intuition is built cheaply in two dimensions and then transfers for free.

---

## The dot product

Take two vectors of the same length. Multiply them position by position. Add up the results. One number falls out.

```
a = [1, 2, 3]
b = [4, 5, 6]

a · b  =  (1×4) + (2×5) + (3×6)
       =    4   +   10  +   18
       =   32
```

That is the entire operation. As an algorithm: *walk both lists together, multiply each pair, accumulate the total.*

### What the number means

This is the part that matters, and where most people's understanding stays shallow.

The dot product measures **agreement**. Look at what happens to each term in the sum:

| Signs | Contribution | Reading |
|---|---|---|
| both positive | positive | they agree |
| both negative | positive | they agree, in the other direction |
| one of each | negative | they disagree |
| either is zero | nothing | no opinion |

So the total answers: **across all these dimensions, do these two vectors tend to go the same way?**

```
[1, 0] · [ 1, 0]  =   1     same direction
[1, 0] · [ 0, 1]  =   0     perpendicular — completely unrelated
[1, 0] · [-1, 0]  =  -1     opposite
```

That middle case deserves a pause. A dot product of **zero means "these two things have nothing to say about each other"**. In geometry that is a right angle. In machine learning it is "unrelated concepts". Same fact, two vocabularies.

### Why this is the atom of the field

A neuron in a neural network does exactly this:

```
output = activation( inputs · weights + bias )
```

The weights are a vector the network learned. The dot product asks *"how much does this input agree with the pattern I have learned to look for?"* A high number means "strong match — fire".

That is what a neuron **is**. Everything else in deep learning — layers, depth, attention, transformers — is about arranging billions of these agreement checks so that useful patterns emerge. When you build a network from scratch in Phase 3, you will be stacking today's function.

---

## The flaw, and the fix

The dot product has a bug as a similarity measure: **it is inflated by magnitude.**

```
[1, 0] · [100, 0]  =  100
[1, 0] · [  1, 0]  =    1
```

Both pairs point in *precisely* the same direction. The first scores 100× higher purely because one vector is bigger. If those were documents, a long document would beat a short one on every query regardless of topic. Not what you want.

The fix is to divide out the magnitudes. The **magnitude** (also called length, or norm) is Pythagoras extended to any number of dimensions — square everything, sum, take the root:

```
|[3, 4]|  =  √(3² + 4²)  =  √25  =  5
```

Divide the dot product by both magnitudes and you get **cosine similarity**:

```
cos_sim(a, b)  =  (a · b) / (|a| × |b|)
```

The answer is now always between −1 and 1, and magnitude is gone. Only *direction* survives:

| Value | Meaning |
|---|---|
| `1.0` | identical direction |
| `0.7` | strongly related |
| `0.0` | unrelated, perpendicular |
| `-1.0` | opposite |

This function is how semantic search works, how RAG retrieves documents, how "customers who liked X also liked Y" works, and how a vector database ranks results. Four lines of arithmetic — exercise 6.

---

## Why NumPy exists

Python is slow: every list element is a boxed object with type checks on every operation. NumPy stores arrays as raw contiguous memory and pushes the loop down into compiled C, applying one instruction across many values at once.

```python
import numpy as np

a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])

a + b        # array([5., 7., 9.])   elementwise, no loop
a * b        # array([4., 10., 18.]) elementwise multiply, NOT matrix multiply
a * 2        # array([2., 4., 6.])   the scalar broadcasts across the array
a.sum()      # 6.0
a.shape      # (3,)  — check this when confused. always.
```

The mental shift, and it is a real one coming from imperative code: **stop thinking "for each element, do X". Start thinking "apply X to the whole array".**

Writing a Python `for` loop over a NumPy array is the most common beginner mistake in this field and costs roughly 200× in speed. The tests in this lesson reject it. Once all seven pass, run the benchmark and see the gap on your own machine:

```bash
python lessons/01-foundations/01-vectors/exercises.py
```

---

## Your work

1. Implement the seven functions in [exercises.py](exercises.py).
2. Run `progress 1.1` until all seven pass.
3. Run the benchmark above.
4. Watch what is listed in [watch.md](watch.md) — chapter 9 only *after* your code passes.
5. Answer the seven questions in [notes.md](notes.md) in your own words.

Exercise 7 is a working semantic search engine in about two lines. It is a toy, but the mechanism is not — swap the hand-written vectors for real embeddings and that function is a production retrieval system.

---

## Check yourself

You have finished this lesson when you can answer these without looking anything up:

- What does a dot product of zero tell you about two vectors?
- Why divide by the magnitudes to get cosine similarity — what does it fix?
- Why is a NumPy operation so much faster than the equivalent Python loop? ("NumPy is optimised" is not the answer.)
- Where does a neuron use the function you wrote today?

**Next:** 1.2 — Vector geometry.

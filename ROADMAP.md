# Roadmap

Tuned for: no math background, strong engineer, Python as a second language,
goal = understand everything deeply, time is not a constraint.

Mark `[x]` as you finish. Nothing is skipped. Nothing stays magic.

---

## Phase 1 — Foundations: the math, built in code

The whole of ML sits on four ideas: **vectors, matrix multiplication, the
derivative, and probability.** Learn these properly and the rest of the field is
just recombination. We learn them by writing them, not by reading proofs.

- [ ] **1.1  Vectors and the dot product** — Python/NumPy essentials, what a vector is, the one operation everything is built from
- [ ] **1.2  Vector geometry** — length, distance, angle, cosine similarity, projection. Why "similarity" is a geometry problem
- [ ] **1.3  Matrices as data** — shape, indexing, slicing, broadcasting, transpose
- [ ] **1.4  Matrices as transformations** — matmul as a function that moves space. This is the one that makes neural nets click
- [ ] **1.5  Systems, inverses, rank** — solving `Ax = b`, when you can't, and what "singular" means
- [ ] **1.6  Functions and slopes** — the derivative discovered numerically, before any symbols
- [ ] **1.7  Derivative rules** — power, product, quotient, and the handful you will actually reuse
- [ ] **1.8  The chain rule** — the single most important fact in deep learning. Backprop *is* the chain rule
- [ ] **1.9  Partial derivatives and the gradient** — calculus in many dimensions
- [ ] **1.10 Gradient descent** — implement it, watch it converge, watch it diverge, learn why
- [ ] **1.11 Probability I** — random variables, distributions, expectation, variance
- [ ] **1.12 Probability II** — Bayes' theorem, likelihood, and where loss functions actually come from
- [ ] **1.13 Statistics you need** — the normal distribution, sampling, correlation, and the traps

**Milestone:** minimise an arbitrary function you have never seen, from scratch,
and explain every line.

---

## Phase 2 — Classical machine learning

Most industry ML is still this. It is also where every concept — loss, overfitting,
evaluation, regularisation — is easiest to see clearly.

- [ ] **2.1  What "learning" actually is** — the universal recipe: data → model → loss → optimiser
- [ ] **2.2  Linear regression from scratch** — closed form and gradient descent
- [ ] **2.3  Making training work** — feature scaling, learning rates, convergence debugging
- [ ] **2.4  Logistic regression** — sigmoid, decision boundaries, cross-entropy loss
- [ ] **2.5  Overfitting and the bias–variance tradeoff** — train/val/test, cross-validation
- [ ] **2.6  Regularisation** — L1, L2, and a real intuition for why they work
- [ ] **2.7  Evaluation** — accuracy is a trap. Precision, recall, F1, ROC-AUC, confusion matrices
- [ ] **2.8  scikit-learn** — now that you have built it by hand, use the real tool
- [ ] **2.9  Trees → random forests → gradient boosting** — XGBoost/LightGBM, the tabular workhorses
- [ ] **2.10 Feature engineering** — encoding, missing data, and data leakage (the number one real-world bug)
- [ ] **2.11 Clustering** — k-means, hierarchical, DBSCAN
- [ ] **2.12 PCA and dimensionality reduction** — where Phase 1 linear algebra pays off spectacularly
- [ ] **2.13 Capstone** — end to end on a real, messy dataset

**Milestone:** take a raw CSV to a validated, honestly-evaluated model, and defend
every choice you made.

---

## Phase 3 — Deep learning

- [ ] **3.1  The perceptron, and why linear models fail** — XOR
- [ ] **3.2  Multi-layer networks** — activations, hidden layers, universal approximation
- [ ] **3.3  Backpropagation by hand** — derive it on a three-neuron network, on paper
- [ ] **3.4  Build an autograd engine from scratch** — the crown jewel. ~150 lines that explain all of PyTorch
- [ ] **3.5  Train a real network on your own engine**
- [ ] **3.6  PyTorch** — tensors, autograd, `nn.Module`, the canonical training loop
- [ ] **3.7  Optimisers** — SGD → momentum → RMSProp → Adam, and what each one fixes
- [ ] **3.8  Making deep nets trainable** — initialisation, vanishing/exploding gradients, batch and layer norm
- [ ] **3.9  Regularisation in deep learning** — dropout, weight decay, early stopping, augmentation
- [ ] **3.10 Convolutional networks** — build one, then classify images
- [ ] **3.11 Transfer learning** — why almost nobody trains from scratch any more
- [ ] **3.12 Sequence models** — RNNs, LSTMs, and precisely why they break
- [ ] **3.13 Embeddings** — word2vec, and representation learning as the central idea of modern AI
- [ ] **3.14 Training at scale** — GPUs, batching, mixed precision, checkpointing

**Milestone:** an autograd engine you wrote, training a network you designed.

---

## Phase 4 — Transformers and LLMs

- [ ] **4.1  Attention from first principles** — derived, not memorised
- [ ] **4.2  Self-attention and multi-head attention** — plus positional encoding
- [ ] **4.3  The transformer block** — encoder vs decoder, residuals, the full architecture
- [ ] **4.4  Tokenisation** — implement byte-pair encoding
- [ ] **4.5  Build GPT from scratch** — and train it on a small corpus
- [ ] **4.6  Pretraining and scaling laws** — what "emergence" does and does not mean
- [ ] **4.7  Fine-tuning** — full fine-tune, LoRA/PEFT, instruction tuning
- [ ] **4.8  Alignment** — RLHF and DPO
- [ ] **4.9  Inference** — sampling, temperature, top-k/top-p, KV cache, quantisation
- [ ] **4.10 Embeddings, vector search, and RAG** — done properly, not cargo-culted
- [ ] **4.11 Evals** — the most underrated skill in applied AI
- [ ] **4.12 Agents and tool use** — the current frontier

**Milestone:** a working GPT you wrote line by line, generating text.

---

## Phase 5 — Production, then specialise

- [ ] Serving, latency, cost, monitoring, drift
- [ ] Reproducibility and experiment tracking
- [ ] Then pick a depth: computer vision · NLP · reinforcement learning · diffusion and generative models · ML systems

---

## Reference library

Use these as **companions**, not as the curriculum. Watch the linked video for a
topic on the day we cover it — a second explanation in a different voice is worth
a great deal.

**Visual intuition (these are exceptional — watch them)**
- 3Blue1Brown, *Essence of Linear Algebra* — https://www.3blue1brown.com/topics/linear-algebra
- 3Blue1Brown, *Essence of Calculus* — https://www.3blue1brown.com/topics/calculus
- 3Blue1Brown, *Neural Networks* (includes an outstanding attention/transformer series) — https://www.3blue1brown.com/topics/neural-networks

**Classical ML intuition**
- StatQuest with Josh Starmer — https://www.youtube.com/@statquest — the clearest plain-English explanations of statistics and classical ML anywhere
- *The Hundred-Page Machine Learning Book*, Andriy Burkov — short and honest; read it after Phase 2

**Deep learning**
- Andrej Karpathy, *Neural Networks: Zero to Hero* — https://karpathy.ai/zero-to-hero.html — builds micrograd, then GPT, from scratch. This is the spine of Phases 2 and 3
- *Hands-On Machine Learning* (3rd ed.), Aurélien Géron — the best single practical book in the field
- *Dive into Deep Learning* — https://d2l.ai — free, runnable, rigorous

**Transformers**
- Jay Alammar, *The Illustrated Transformer* — https://jalammar.github.io/illustrated-transformer/
- *The Annotated Transformer*, Harvard NLP — http://nlp.seas.harvard.edu/annotated-transformer/
- Sebastian Raschka's blog — https://sebastianraschka.com/blog/ — consistently the clearest writing on modern LLM internals

**Deeper reference**
- Distill.pub — https://distill.pub — interactive explanations; archived, but still the gold standard
- Chris Olah's blog — https://colah.github.io — especially *Understanding LSTM Networks*
- *Deep Learning*, Goodfellow, Bengio and Courville — https://www.deeplearningbook.org — a reference to consult, not to read cover to cover

**Interactive**
- MLU-Explain, Amazon's Machine Learning University — https://mlu-explain.github.io — sixteen interactive visual essays. Nearly every one maps onto a Phase 2 lesson: linear and logistic regression, decision trees, random forests, ROC and AUC, precision and recall, cross-validation, train/test/validation splits, the bias–variance tradeoff, double descent. Read the matching essay the day we cover the topic.

**Phase 4 depth (LLMs)**
- Sebastian Raschka, *Build a Large Language Model (From Scratch)* — https://sebastianraschka.com/llms-from-scratch/ — plus the author's own chapter-by-chapter live-coding playlist. The closest thing in print to what Phase 4 does.
- Vizuara, *Building LLMs from Scratch* — https://www.youtube.com/@vizuara — Dr. Raj Dandekar (MIT PhD) lecturing through Raschka's book. Visual intuition first, then the maths, then the code.
- Stanford CS336, *Language Modeling from Scratch* — the most serious course on this list: tokeniser, architecture, training, systems and inference, built end to end. Genuinely hard, and the right target *after* Phase 3. Do not start here.

**Applied AI, Phase 4–4**
- Chip Huyen, *AI Engineering: Building Applications with Foundation Models* (2025) — https://github.com/chiphuyen/aie-book — evaluation, dataset and prompt engineering, RAG, agents, finetuning, inference cost and latency. The best single reference for building *with* models rather than building them.
- `jamwithai/production-agentic-rag-course` — https://github.com/jamwithai/production-agentic-rag-course — a seven-week production RAG build (FastAPI, Postgres, OpenSearch, Airflow, Langfuse, LangGraph). Notably teaches BM25 keyword search *before* embeddings, which is the right order and rarely done.
- `FareedKhan-dev/all-agentic-architectures` — https://github.com/FareedKhan-dev/all-agentic-architectures — 35 agent patterns as runnable code. A catalogue for lesson 4.12, not a place to learn from cold.

**Practice**
- Kaggle Learn and competitions — https://www.kaggle.com/learn
- Papers with Code — https://paperswithcode.com

**A second voice on Phases 0–1, if you want one**
- Andrew Ng, *Machine Learning Specialization* (DeepLearning.AI) — https://www.deeplearning.ai/specializations/machine-learning — three courses, ~95 hours, the most famous ML course there is, and genuinely good. It covers roughly the same ground as our Phases 0–1 but from the opposite direction: intuition and library usage first, mechanism mostly left inside the framework, exercises largely fill-in-the-blank. Useful as a *parallel* explanation. It is not a substitute for building the thing yourself, which is the whole premise of this repository.

**Adjacent, and not on this path**
- NPTEL, *Artificial Intelligence: Search Methods for Problem Solving* — Prof. Deepak Khemani, IIT Madras — https://onlinecourses.nptel.ac.in/noc26_cs182/ — classical symbolic AI: state-space search, A*, minimax, constraint satisfaction. Excellent, and a genuinely different subject from machine learning — no statistics, no gradients, no data. Worth taking one day for the breadth. It will not help with anything in this roadmap.

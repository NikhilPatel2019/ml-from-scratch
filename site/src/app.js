/* Shell: routing, the curriculum rail, and the three screens. */
(function () {
  "use strict";

  var data = JSON.parse(document.getElementById("curriculum-data").textContent);
  var phases = data.phases;
  var allLessons = [];
  phases.forEach(function (p) {
    p.lessons.forEach(function (l) { l.phase = p; allLessons.push(l); });
  });
  var TOTAL = allLessons.length;

  var view = { kind: "home", id: null };
  var LIBRARY = data.library || [];
  var activeTab = {};

  var SECTIONS = data.sections || {};

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function button(cls, text, onClick) {
    var n = el("button", cls, text);
    n.type = "button";
    n.addEventListener("click", onClick);
    return n;
  }
  function lessonById(id) {
    for (var i = 0; i < allLessons.length; i++) if (allLessons[i].id === id) return allLessons[i];
    return null;
  }
  function writtenLessons() { return allLessons.filter(function (l) { return l.written; }); }
  function nextLesson() {
    var pool = writtenLessons();
    for (var i = 0; i < pool.length; i++) if (!isComplete(pool[i])) return pool[i];
    return null;
  }
  /* ---------- resume where you left off ----------
     Course sites drop you back into the lesson you were reading rather than the
     catalogue. Stored per device alongside progress; the overview stays one
     click away in the rail and the wordmark. */
  var VIEW_KEY = "mlfs:view:v1";

  function saveView() {
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify({
        kind: view.kind,
        id: view.id,
        tab: view.kind === "lesson" ? (activeTab[view.id] || 0) : 0
      }));
    } catch (e) {}
  }

  function restoreView() {
    try {
      var saved = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
      if (!saved || !saved.kind) return;
      if (saved.kind === "lesson") {
        var lesson = lessonById(saved.id);
        if (!lesson || !lesson.written) return;   // stale id, or no longer written
        activeTab[saved.id] = typeof saved.tab === "number" ? saved.tab : 0;
      } else if (saved.kind !== "home" && saved.kind !== "setup") {
        return;
      }
      view = { kind: saved.kind, id: saved.id || null };
    } catch (e) {}
  }

  function go(kind, id) {
    clearing = false;          /* an unanswered confirmation does not follow you */
    view = { kind: kind, id: id || null };
    saveView();
    render();
    window.scrollTo(0, 0);
  }
  function goHome() { go("home"); }
  function goLesson(id) { go("lesson", id); }

  function highlight(scope) {
    if (typeof hljs === "undefined") return;
    scope.querySelectorAll("pre code").forEach(function (node) {
      try { hljs.highlightElement(node); } catch (e) {}
    });
  }

  /* ---------- copy affordances ----------
     Two shapes for the same job: a bare label beside a block of text, and the
     chip where the command and the copy control are one control. */
  function copyFeedback(labelNode, text, selectFrom) {
    var reset = function () {
      labelNode.textContent = labelNode.dataset.idle;
      labelNode.classList.remove("ok", "warn");
    };
    var fallback = function () {
      labelNode.textContent = "Ctrl+C";
      labelNode.classList.add("warn");
      try {
        var range = document.createRange();
        range.selectNodeContents(selectFrom);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}
      setTimeout(reset, 2600);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          labelNode.textContent = "copied";
          labelNode.classList.add("ok");
          setTimeout(reset, 1400);
        }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  function copyButton(text, target, cls) {
    var b = el("button", cls || "copybtn", "copy");
    b.type = "button";
    b.dataset.idle = "copy";
    b.setAttribute("aria-label", "Copy " + text);
    b.addEventListener("click", function () { copyFeedback(b, text, target || b); });
    return b;
  }

  function commandChip(cmd, cls) {
    var chip = el("button", cls || "cmdchip");
    chip.type = "button";
    chip.setAttribute("aria-label", "Copy " + cmd);
    var code = el("span", null, cmd);
    chip.appendChild(code);
    var label = el("span", "copylabel", "copy");
    label.dataset.idle = "copy";
    chip.appendChild(label);
    chip.addEventListener("click", function () { copyFeedback(label, cmd, code); });
    return chip;
  }

  /* ---------- real test results ----------
     Written by `progress --json`, which runs the tests. Absent on the published
     site and on a fresh clone, and that is the normal case: everything below
     degrades to the hand-ticked behaviour rather than inventing a pass. */
  var PROG_KEY = "mlfs:pasted-progress:v1";
  var progressData = null;

  function loadProgress() {
    try {
      var pasted = JSON.parse(localStorage.getItem(PROG_KEY) || "null");
      if (pasted && pasted.lessons) progressData = pasted;
    } catch (e) {}

    if (typeof fetch !== "function") return;
    /* file:// blocks this, and the published site has no such file. Both land in
       the catch, which is why there is a paste box on Practice. */
    fetch("progress.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.lessons) return;
        progressData = d;
        render();
      })
      .catch(function () {});
  }

  function lessonTests(id) {
    return (progressData && progressData.lessons && progressData.lessons[id]) || null;
  }
  function exerciseResult(lessonId, name) {
    var lt = lessonTests(lessonId);
    if (!lt) return null;
    for (var i = 0; i < lt.exercises.length; i++) {
      if (lt.exercises[i].name === name) return lt.exercises[i];
    }
    return null;
  }
  function testTotals() {
    if (!progressData) return null;
    var passed = 0, total = 0;
    Object.keys(progressData.lessons).forEach(function (k) {
      passed += progressData.lessons[k].tests_passed;
      total += progressData.lessons[k].tests_total;
    });
    return { passed: passed, total: total };
  }
  /* ---------- what counts as done ----------
     One tick per exercise, not per lesson. The runner wins wherever it has
     spoken; a hand tick is what you have while progress.json is absent, and
     every place that shows a total says which of the two it is reading. */
  var CHECKED_KEY = "mlfs:checked:v1";
  var checked = (function () {
    try { return JSON.parse(localStorage.getItem(CHECKED_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  })();

  function saveChecked() {
    try { localStorage.setItem(CHECKED_KEY, JSON.stringify(checked)); } catch (e) {}
  }
  function toggleChecked(lessonId, name) {
    var mine = checked[lessonId] || (checked[lessonId] = {});
    if (mine[name]) delete mine[name]; else mine[name] = true;
    saveChecked();
    render();
  }
  function exerciseChecked(l, e) {
    var r = exerciseResult(l.id, e.name);
    if (r) return r.status === "pass";
    return !!(checked[l.id] && checked[l.id][e.name]);
  }
  function scoredExercises(l) {
    return (l.exercises || []).filter(function (e) { return !e.optional; });
  }
  function isComplete(l) {
    var s = scoredExercises(l);
    if (!l.written || !s.length) return false;
    for (var i = 0; i < s.length; i++) if (!exerciseChecked(l, s[i])) return false;
    return true;
  }
  function completionIsDerived(l) {
    return !!lessonTests(l.id);
  }
  function checkedTotals() {
    var out = { done: 0, total: 0, fromRunner: false };
    writtenLessons().forEach(function (l) {
      if (lessonTests(l.id)) out.fromRunner = true;
      scoredExercises(l).forEach(function (e) {
        out.total++;
        if (exerciseChecked(l, e)) out.done++;
      });
    });
    return out;
  }

  function pasteBox() {
    var wrap = el("details", "solution");
    wrap.style.marginTop = "18px";
    var sum = el("summary", null, "Paste results instead");
    wrap.appendChild(sum);
    var body = el("div");
    body.style.padding = "14px 16px";
    body.appendChild(el("p", "why",
      "Opening this page straight from a file, rather than through a local server, " +
      "stops it reading progress.json. Run progress --json and paste the output here; " +
      "it is kept in this browser only."));
    var ta = document.createElement("textarea");
    ta.rows = 5;
    ta.className = "pastebox";
    ta.placeholder = '{ "generated": "...", "lessons": { ... } }';
    body.appendChild(ta);
    var msg = el("div", "paste-msg");
    var row = el("div", "ctrls");
    row.appendChild(button("btn", "Load results", function () {
      var parsed;
      try {
        parsed = JSON.parse(ta.value);
      } catch (e) {
        msg.textContent = "That is not valid JSON.";
        msg.className = "paste-msg bad";
        return;
      }
      if (!parsed || !parsed.lessons) {
        msg.textContent = "No lessons key — is this the output of progress --json?";
        msg.className = "paste-msg bad";
        return;
      }
      try { localStorage.setItem(PROG_KEY, JSON.stringify(parsed)); } catch (e) {}
      progressData = parsed;
      render();
    }));
    row.appendChild(button("btn ghost", "Forget", function () {
      try { localStorage.removeItem(PROG_KEY); } catch (e) {}
      progressData = null;
      render();
    }));
    body.appendChild(row);
    body.appendChild(msg);
    wrap.appendChild(body);
    return wrap;
  }

  /* ---------- protect the walkthrough (HANDOFF step 7) ----------
     The curriculum's stated principle is that nobody hands you the answer.
     Individual solutions are already collapsed behind a deliberate click; this
     applies the same friction one level up. Friction, not a lock — and it is
     not remembered, so a fresh visit asks again. */
  var unlockedWalkthrough = {};

  function gateWalkthrough(l) {
    if (isComplete(l)) return false;          // done means done: open straight through
    return !unlockedWalkthrough[l.id];
  }

  /* ---------- progress export / import (HANDOFF step 8) ----------
     Progress is device-local with no way to carry it to a new laptop, which
     makes "clear my progress" the only irreversible action in the product. */
  /* ---------- search (HANDOFF step 8) ----------
     Six months in the question is "where did the chain rule bit live", not
     "what is lesson 2.4". Headings and exercise names come from the build, so
     the index cannot drift from the content. */
  var STEP_LABEL = { lesson: "Read", exercises: "Implement", walkthrough: "Compare",
                     closeout: "Close out", brief: "Brief", resources: "Resources" };

  function openStep(lessonId, stepName) {
    var present = SECTIONS[lessonId] || [];
    var steps = STEPS.filter(function (s) { return present.indexOf(s.name) > -1; });
    var i = 0;
    steps.forEach(function (s, n) { if (s.name === stepName) i = n; });
    activeTab[lessonId] = i;
    goLesson(lessonId);
  }

  function searchIndex() {
    var out = [];
    phases.forEach(function (p) {
      out.push({ kind: "phase", label: "Phase " + p.number + " · " + p.title,
                 sub: p.subtitle, act: goHome });
    });
    allLessons.forEach(function (l) {
      out.push({ kind: l.written ? "lesson" : "planned", label: l.id + " · " + l.title,
                 sub: l.phase.title,
                 act: l.written ? function () { goLesson(l.id); } : goHome });
      (l.headings || []).forEach(function (h) {
        out.push({ kind: "section", label: h.text,
                   sub: l.id + " · " + (STEP_LABEL[h.step] || h.step),
                   act: function () { openStep(l.id, h.step); } });
      });
      (l.exercises || []).forEach(function (e) {
        out.push({ kind: "exercise", label: e.name, sub: l.id + " · " + e.summary,
                   act: function () { openStep(l.id, "exercises"); } });
      });
    });
    return out;
  }

  var paletteItems = [];
  var paletteIndex = 0;

  function paletteEls() {
    return {
      root: document.getElementById("palette"),
      input: document.getElementById("palette-input"),
      list: document.getElementById("palette-results")
    };
  }

  function renderPalette(query) {
    var e = paletteEls();
    var q = (query || "").trim().toLowerCase();
    var all = searchIndex();
    paletteItems = (q
      ? all.map(function (it) {
          var hay = (it.label + " " + it.sub).toLowerCase();
          var at = hay.indexOf(q);
          return at < 0 ? null : { it: it, at: at };
        }).filter(Boolean).sort(function (a, b) { return a.at - b.at; }).map(function (x) { return x.it; })
      : all.filter(function (it) { return it.kind === "lesson" || it.kind === "phase"; })
    ).slice(0, 30);

    if (paletteIndex >= paletteItems.length) paletteIndex = 0;
    e.list.textContent = "";
    if (!paletteItems.length) {
      var empty = el("div", "palette-empty");
      empty.appendChild(document.createTextNode(
        q ? "Nothing matches “" + q + "”." : "Start typing to search the curriculum."));
      e.list.appendChild(empty);
      return;
    }
    paletteItems.forEach(function (it, i) {
      var row = button("palette-row" + (i === paletteIndex ? " on" : ""), null, function () {
        runPalette(it);
      });
      row.appendChild(el("span", "palette-kind", it.kind));
      var body = el("span", "palette-body");
      body.appendChild(el("span", "palette-label", it.label));
      body.appendChild(el("span", "palette-sub", it.sub));
      row.appendChild(body);
      row.addEventListener("mousemove", function () {
        if (paletteIndex === i) return;
        paletteIndex = i;
        [].forEach.call(e.list.children, function (c, n) { c.classList.toggle("on", n === i); });
      });
      e.list.appendChild(row);
    });
  }

  function runPalette(it) {
    closePalette();
    if (it.url) { window.open(it.url, "_blank", "noopener"); return; }
    it.act();
  }

  function openPalette() {
    var e = paletteEls();
    e.root.hidden = false;
    e.input.value = "";
    paletteIndex = 0;
    renderPalette("");
    e.input.focus();
  }
  function closePalette() {
    paletteEls().root.hidden = true;
  }

  function wirePalette() {
    var e = paletteEls();
    if (!e.root) return;

    e.input.addEventListener("input", function () { paletteIndex = 0; renderPalette(e.input.value); });
    e.input.addEventListener("keydown", function (evt) {
      if (evt.key === "ArrowDown" || (evt.key === "n" && evt.ctrlKey)) {
        evt.preventDefault();
        paletteIndex = Math.min(paletteIndex + 1, paletteItems.length - 1);
      } else if (evt.key === "ArrowUp" || (evt.key === "p" && evt.ctrlKey)) {
        evt.preventDefault();
        paletteIndex = Math.max(paletteIndex - 1, 0);
      } else if (evt.key === "Enter") {
        evt.preventDefault();
        if (paletteItems[paletteIndex]) runPalette(paletteItems[paletteIndex]);
        return;
      } else if (evt.key === "Escape") {
        closePalette();
        return;
      } else {
        return;
      }
      [].forEach.call(e.list.children, function (c, n) { c.classList.toggle("on", n === paletteIndex); });
      var on = e.list.children[paletteIndex];
      if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
    });
    e.root.addEventListener("mousedown", function (evt) {
      if (evt.target === e.root) closePalette();
    });

    document.addEventListener("keydown", function (evt) {
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "k") {
        evt.preventDefault();
        if (e.root.hidden) openPalette(); else closePalette();
        return;
      }
      if (evt.key === "Escape" && !e.root.hidden) { closePalette(); return; }

      /* The rest are bare keys, and never while typing. */
      if (!e.root.hidden) return;
      var t = evt.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (evt.metaKey || evt.ctrlKey || evt.altKey) return;

      /* 1-3 jump between the steps of the lesson you are on. */
      if (stepJump && /^[1-9]$/.test(evt.key) && stepJump(parseInt(evt.key, 10) - 1)) {
        evt.preventDefault();
      }
    });
  }

  /* ---------- rail ---------- */
  var railNav = document.getElementById("rail-nav");
  /* ---------- rail: the whole curriculum, one phase at a time ---------- */
  var RAIL_OPEN_KEY = "mlfs:rail-open:v1";
  var railOpen = (function () {
    try {
      var saved = JSON.parse(localStorage.getItem(RAIL_OPEN_KEY) || "null");
      if (saved) return saved;
    } catch (e) {}
    /* First visit: open the phase that has something written in it. */
    var out = {};
    phases.forEach(function (p) {
      if (p.lessons.some(function (l) { return l.written; })) out[p.number] = true;
    });
    return out;
  })();

  function saveRailOpen() {
    try { localStorage.setItem(RAIL_OPEN_KEY, JSON.stringify(railOpen)); } catch (e) {}
  }

  function railLessonRow(l) {
    var here = view.kind === "lesson" && view.id === l.id;
    var row = el("button", "rail-lesson" +
      (l.written ? "" : " is-planned") + (here ? " current" : ""));
    row.type = "button";
    row.title = l.summary;
    if (l.written) {
      row.addEventListener("click", function () { goLesson(l.id); });
      if (here) row.setAttribute("aria-current", "page");
    } else {
      row.disabled = true;
    }
    row.appendChild(el("span", "lid", l.id));
    row.appendChild(el("span", "ltitle", l.title));
    return row;
  }

  function buildRail() {
    railNav.textContent = "";

    var home = el("button", "nav-btn" + (view.kind === "home" ? " current" : ""));
    home.type = "button";
    home.appendChild(el("span", null, "The curriculum"));
    home.appendChild(el("span", "nav-count", String(TOTAL)));
    home.addEventListener("click", function () { go("home"); });
    railNav.appendChild(home);

    var list = el("div", "rail-phases");
    phases.forEach(function (p) {
      var open = !!railOpen[p.number];
      var group = el("div");

      var head = el("button", "ph-head");
      head.type = "button";
      head.setAttribute("aria-expanded", open ? "true" : "false");
      head.appendChild(el("span", "ph-caret", open ? "–" : "+"));
      head.appendChild(el("span", "ph-num", String(p.number)));
      head.appendChild(el("span", "ph-title", p.title));
      head.appendChild(el("span", "ph-count", String(p.lessons.length)));
      head.addEventListener("click", function () {
        railOpen[p.number] = !railOpen[p.number];
        saveRailOpen();
        buildRail();
      });
      group.appendChild(head);

      if (open) {
        var lessons = el("div", "ph-lessons");
        p.lessons.forEach(function (l) { lessons.appendChild(railLessonRow(l)); });
        group.appendChild(lessons);
      }
      list.appendChild(group);
    });
    railNav.appendChild(list);

    document.getElementById("rail-setup")
      .classList.toggle("current", view.kind === "setup");
  }

  /* ---------- home: every phase, every lesson, visible ---------- */
  function buildHome() {
    var wrap = el("div", "wrap");
    var written = writtenLessons();

    wrap.appendChild(el("div", "hero-eyebrow", "The curriculum"));
    wrap.appendChild(el("h1", "hero-h1", "Machine learning, built from scratch"));
    wrap.appendChild(el("p", "hero-lede",
      "Five phases, " + TOTAL + " lessons, written to be taken in order. Every lesson " +
      "is read, then written in code, then compared against a walkthrough. " +
      "Self-paced — nothing here expires."));

    var stats = el("div", "home-stats");

    var s1 = el("div", "hstat");
    s1.appendChild(el("div", "hstat-k", "Available now"));
    var v1 = el("div", "hstat-v", String(written.length));
    v1.appendChild(el("span", null, " of " + TOTAL + " written"));
    s1.appendChild(v1);
    stats.appendChild(s1);

    var c = checkedTotals();
    var s2 = el("div", "hstat");
    s2.appendChild(el("div", "hstat-k",
      c.fromRunner ? "Exercises passing" : "Exercises checked"));
    s2.appendChild(el("div", "hstat-v" + (c.total && c.done === c.total ? " is-done" : ""),
      c.done + " / " + c.total));
    stats.appendChild(s2);

    var next = nextLesson() || written[0];
    if (next) {
      var start = el("div", "hstart");
      start.appendChild(el("div", "hstat-k", "Start here"));
      var t = el("button", "hstart-title", next.id + " — " + next.title);
      t.type = "button";
      t.addEventListener("click", function () { goLesson(next.id); });
      start.appendChild(t);
      start.appendChild(button("btn-primary",
        activeTab[next.id] != null ? "Resume the lesson" : "Start the lesson",
        function () { goLesson(next.id); }));
      stats.appendChild(start);
    }
    wrap.appendChild(stats);

    wrap.appendChild(rulerCard());

    var sections = el("div", "phase-sections");
    phases.forEach(function (p) {
      var w = p.lessons.filter(function (l) { return l.written; }).length;
      var sec = el("section");

      var head = el("div", "pshead");
      head.appendChild(el("span", "phase-chip", "PHASE " + p.number));
      head.appendChild(el("h2", null, p.title));
      head.appendChild(el("span", "pshead-sub", p.subtitle));
      head.appendChild(el("span", "pshead-count", w
        ? w + " written · " + (p.lessons.length - w) + " planned"
        : p.lessons.length + " planned"));
      sec.appendChild(head);

      sec.appendChild(el("p", "ps-blurb", p.blurb));

      var mile = el("div", "milestone");
      mile.appendChild(el("span", "milestone-k", "Milestone"));
      mile.appendChild(el("span", "milestone-t", p.milestone));
      sec.appendChild(mile);

      var rows = el("div", "phase-lessons");
      p.lessons.forEach(function (l) {
        var done = isComplete(l);
        var row = el("button", "plesson" + (l.written ? "" : " is-planned"));
        row.type = "button";
        if (l.written) row.addEventListener("click", function () { goLesson(l.id); });
        else row.disabled = true;
        row.appendChild(el("span", "plesson-id", l.id));
        var body = el("span", "plesson-body");
        body.appendChild(el("span", "plesson-title", l.title));
        body.appendChild(el("span", "plesson-sum", l.summary));
        row.appendChild(body);
        row.appendChild(el("span",
          "plesson-tag " + (done ? "done" : l.written ? "ready" : "plan"),
          done ? "complete" : l.written ? "available" : "planned"));
        rows.appendChild(row);
      });
      sec.appendChild(rows);
      sections.appendChild(sec);
    });
    wrap.appendChild(sections);
    return wrap;
  }

  /* Every lesson, in order, as one strip. */
  function rulerCard() {
    var card = el("div", "ruler-card");

    var top = el("div", "ruler-top");
    top.appendChild(el("div", "ruler-k", "All " + TOTAL + " lessons"));
    var legend = el("div", "legend");
    [["written", "var(--accent)"], ["complete", "var(--done)"], ["planned", "var(--rule-firm)"]]
      .forEach(function (row) {
        var s = el("span");
        var i = el("i");
        i.style.background = row[1];
        s.appendChild(i);
        s.appendChild(document.createTextNode(row[0]));
        legend.appendChild(s);
      });
    top.appendChild(legend);
    card.appendChild(top);

    var ruler = el("div", "ruler");
    allLessons.forEach(function (l) {
      var t = el("span", "ptick");
      t.setAttribute("data-state", isComplete(l) ? "done" : (l.written ? "ready" : "planned"));
      t.title = l.id + " " + l.title + (l.written ? "" : " — planned");
      ruler.appendChild(t);
    });
    card.appendChild(ruler);
    return card;
  }

  /* ---------- setup — ported from the design canvas ---------- */
  var clearing = false;

  var SETUP_COMMANDS = [
    "git clone git@github.com:NikhilPatel2019/ml-from-scratch.git",
    "cd ml-from-scratch",
    "python -m venv .venv",
    ".venv\\Scripts\\activate        # Windows",
    "source .venv/bin/activate      # macOS and Linux",
    "pip install -e \".[dev]\"",
    "progress"
  ].join("\n");

  /* A sentence with `code` spans in it, without innerHTML. */
  function sentence(parts, cls) {
    var n = el("span", cls || null);
    parts.forEach(function (p) {
      if (typeof p === "string") n.appendChild(document.createTextNode(p));
      else n.appendChild(el("code", "inline", p.code));
    });
    return n;
  }

  function sectionKey(text) { return el("h2", "sec-k", text); }

  function buildSetup() {
    var wrap = el("div", "wrap is-setup");
    var next = nextLesson();
    var id = next ? next.id : "1.1";

    wrap.appendChild(el("div", "hero-eyebrow", "Setup"));
    wrap.appendChild(el("h1", "hero-h1", "How this works, and where the code lives"));
    wrap.appendChild(el("p", "hero-lede setup-lede",
      "Read once, then get out of your way."));

    wrap.appendChild(sectionKey("The loop"));
    var steps = el("div", "steps");
    [
      ["01", ["Read the lesson. Watch the linked videos first. Budget roughly 20% " +
              "of your time here."]],
      ["02", ["Write the exercises in your repo and tick them off as they pass. This " +
              "is the 80%, and the only part that transfers."]],
      ["03", ["Compare against the walkthrough — the solution and the reasoning for " +
              "each exercise, once yours works. Then answer the closing questions in ",
              { code: "notes.md" }, ", in your own words."]]
    ].forEach(function (row) {
      var st = el("div", "step");
      st.appendChild(el("span", "step-n", row[0]));
      st.appendChild(sentence(row[1], "step-t"));
      steps.appendChild(st);
    });
    wrap.appendChild(steps);

    wrap.appendChild(sectionKey("Where the code lives"));
    var term = el("div", "termcard");
    var pre = el("pre", null, SETUP_COMMANDS);
    var bar = el("div", "termbar");
    bar.appendChild(el("span", null, "terminal · once"));
    bar.appendChild(copyButton(SETUP_COMMANDS, pre, "termcopy"));
    term.appendChild(bar);
    term.appendChild(pre);
    wrap.appendChild(term);
    wrap.appendChild(sentence([
      "Exercises live in ",
      { code: (next ? next.dir : "lessons/01-foundations/01-vectors") + "/exercises.py" },
      " — the only file you edit. Every function arrives as a stub, and the docstring " +
      "is the specification."
    ], "setup-note"));

    wrap.appendChild(sectionKey("Your progress"));
    var card = el("div", "progcard");
    var lead = el("p");
    lead.appendChild(sentence([
      "Ticks are stored in this browser only, so export before you switch machines. " +
      "When the runner writes ",
      { code: "progress " + id + " --json > site/progress.json" },
      ", real test results will take over from the hand ticks."
    ]));
    card.appendChild(lead);

    var row = el("div", "progrow");
    var exp = button("btn-quiet", "Export my progress", function () {
      var blob = JSON.stringify({
        version: 2,
        checked: checked,
        seenSteps: seenSteps,
        progress: progressData
      }, null, 2);
      var reset = function () { exp.textContent = "Export my progress"; exp.classList.remove("ok"); };
      try {
        navigator.clipboard.writeText(blob).then(function () {
          exp.textContent = "Copied to clipboard";
          exp.classList.add("ok");
          setTimeout(reset, 1800);
        }, function () { showTransfer(blob); });
      } catch (e) { showTransfer(blob); }
    });
    row.appendChild(exp);
    row.appendChild(button("btn-danger", "Clear my progress…", function () {
      clearing = true;
      render();
    }));
    card.appendChild(row);

    var spill = el("div");
    card.appendChild(spill);
    function showTransfer(blob) {
      spill.textContent = "";
      var ta = document.createElement("textarea");
      ta.rows = 4;
      ta.className = "pastebox";
      ta.value = blob;
      spill.appendChild(ta);
      spill.appendChild(el("div", "paste-msg", "Clipboard blocked — select this and press Ctrl+C."));
      ta.focus();
      ta.select();
    }

    if (clearing) {
      var box = el("div", "confirm");
      var p = el("p");
      p.appendChild(el("b", null, "Clear every tick? "));
      p.appendChild(document.createTextNode(
        "This cannot be undone, and it will not touch your repo. " +
        "Export first if you have not."));
      box.appendChild(p);
      var crow = el("div", "confirm-row");
      crow.appendChild(button("btn-yes", "Yes, clear it", function () {
        checked = {};
        saveChecked();
        try { localStorage.removeItem(PROG_KEY); } catch (e) {}
        progressData = null;
        clearing = false;
        render();
      }));
      crow.appendChild(button("btn-no", "Keep it", function () {
        clearing = false;
        render();
      }));
      box.appendChild(crow);
      card.appendChild(box);
    }
    card.appendChild(pasteBox());
    wrap.appendChild(card);

    wrap.appendChild(sectionKey("Keyboard"));
    var keys = el("div", "keys");
    [["⌘K", "search everything"],
     ["1–3", "jump to a lesson step"],
     ["esc", "close search"]].forEach(function (k) {
      var r = el("div", "keyrow");
      r.appendChild(el("kbd", null, k[0]));
      r.appendChild(el("span", null, k[1]));
      keys.appendChild(r);
    });
    wrap.appendChild(keys);
    return wrap;
  }

  /* ---------- lesson: read, implement, compare ----------
     Three steps, taken in order. The header sits on paper; the steps are tabs
     joined to a --surface band, so the step you are on reads as the page. */
  var STEPS = [
    { name: "lesson", label: "Read" },
    { name: "exercises", label: "Implement" },
    { name: "walkthrough", label: "Compare" }
  ];
  var SEEN_STEPS_KEY = "mlfs:seen-steps:v1";
  var seenSteps = (function () {
    try { return JSON.parse(localStorage.getItem(SEEN_STEPS_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  })();

  function markSeen(lessonId, stepName) {
    var list = seenSteps[lessonId] || (seenSteps[lessonId] = []);
    if (list.indexOf(stepName) > -1) return;
    list.push(stepName);
    try { localStorage.setItem(SEEN_STEPS_KEY, JSON.stringify(seenSteps)); } catch (e) {}
  }
  function hasSeen(lessonId, stepName) {
    return (seenSteps[lessonId] || []).indexOf(stepName) > -1;
  }

  function lessonCounts(l) {
    var s = scoredExercises(l), n = 0;
    s.forEach(function (e) { if (exerciseChecked(l, e)) n++; });
    return { done: n, total: s.length, fromRunner: !!lessonTests(l.id) };
  }
  function stillOpen(l) {
    return scoredExercises(l).filter(function (e) { return !exerciseChecked(l, e); });
  }

  /* What the step button says under "Step N". */
  function stepState(l, name) {
    var c = lessonCounts(l);
    if (name === "lesson") return hasSeen(l.id, name) ? "read" : "not read";
    if (name === "exercises") return c.done + " of " + c.total;
    return isComplete(l) ? "open" : "spoilers";
  }
  function stepDone(l, name) {
    if (name === "lesson") return hasSeen(l.id, name);
    if (name === "exercises") return isComplete(l);
    return false;
  }

  /* The design's short constraint vocabulary, over the facts the tests enforce. */
  function constraintLabel(e) {
    var f = e.forbids || [];
    if (e.optional) return "stretch";
    if (f.indexOf("no numpy") > -1) return "plain python";
    if (f.indexOf("no loops") > -1) return "no loops";
    return "";
  }

  function factsFor(l) {
    var tpl = document.getElementById("lesson-" + l.id + "-brief");
    if (!tpl) return null;
    var grid = tpl.content.cloneNode(true).querySelector(".facts");
    if (!grid) return null;
    /* One cell is live: the count comes from the runner or from your ticks. */
    var live = grid.querySelector("[data-live=\"tests\"]");
    if (live) {
      var c = lessonCounts(l);
      live.appendChild(document.createTextNode(
        " · " + c.done + " / " + c.total + (c.fromRunner ? " passing" : " ticked")));
    }
    return grid;
  }

  /* ---------- step 1 ---------- */
  function watchBlock(l) {
    var w = l.watch;
    if (!w || !(w.before || []).length) return null;

    var box = el("div", "watch");
    var head = el("div", "watch-head");
    head.appendChild(el("span", "watch-k", "Watch first"));
    head.appendChild(el("span", "watch-sub",
      "Ordered. One idea, then code it — do not binge the playlist."));
    box.appendChild(head);

    var list = el("div", "watch-list");
    w.before.forEach(function (v, i) {
      var a = el("a", "watch-row");
      a.href = v.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.appendChild(el("span", "watch-when", String(i + 1)));
      var body = el("span", "watch-body");
      var top = el("span", "watch-top");
      top.appendChild(el("span", "watch-title", v.title));
      top.appendChild(el("span", "watch-len", v.length));
      body.appendChild(top);
      body.appendChild(el("span", "watch-why", v.why));
      a.appendChild(body);
      a.appendChild(el("span", "watch-out", "↗"));
      list.appendChild(a);
    });
    box.appendChild(list);

    var careful = el("div", "watch-careful");
    careful.appendChild(el("span", "watch-careful-k", "Careful"));
    var p = el("p");
    p.appendChild(el("b", null, "Watching is not learning."));
    p.appendChild(document.createTextNode(
      " Both video and demos produce a powerful sensation of understanding, because " +
      "the animation performs the hard cognitive work for you. Close the tab and " +
      "explain the idea out loud without it — that is the test. Roughly 20% here, " +
      "80% on the exercises."));
    careful.appendChild(p);
    box.appendChild(careful);
    return box;
  }

  /* The right-hand column of step 1: where you are, what it is for, what to
     watch once the code passes. Headings are read from the panel. */
  function stepAside(l, panel) {
    var side = el("aside", "step-side");
    var inner = el("div", "step-side-inner");

    /* The watch block is not a heading, but it is the first thing on the step. */
    var heads = [].slice.call(panel.querySelectorAll(".watch, h2"));
    if (heads.length > 1) {
      inner.appendChild(el("div", "side-k", "On this step"));
      var list = el("div", "side-toc");
      var links = heads.map(function (h) {
        var label = h.classList.contains("watch") ? "Watch first" : h.textContent;
        return button("side-link", label, function () {
          h.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      });
      links.forEach(function (b) { list.appendChild(b); });
      inner.appendChild(list);

      var ticking = false;
      function sync() {
        ticking = false;
        var best = 0;
        heads.forEach(function (h, i) {
          if (h.getBoundingClientRect().top - 140 <= 0) best = i;
        });
        links.forEach(function (b, i) { b.classList.toggle("on", i === best); });
      }
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sync);
      }, { passive: true });
      /* The panel is not in the document yet, so every heading measures at 0.
         Wait for layout before deciding which one you are next to. */
      window.requestAnimationFrame(sync);
    }

    var tpl = document.getElementById("lesson-" + l.id + "-brief");
    var outcomes = tpl ? [].slice.call(tpl.content.querySelectorAll(".brief-outcomes li")) : [];
    if (outcomes.length) {
      inner.appendChild(el("div", "side-k", "Outcomes · " + outcomes.length));
      inner.appendChild(el("p", "side-body", outcomes.map(function (li) {
        var strong = li.querySelector("strong");
        return (strong ? strong.textContent : li.textContent).replace(/\.$/, "");
      }).join(" · ")));
    }

    var after = l.watch && l.watch.after;
    if (after) {
      inner.appendChild(el("div", "side-k", "Watch after"));
      var a = el("a", "side-after");
      a.href = after.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.appendChild(el("span", "side-after-t", after.title));
      a.appendChild(el("span", "side-after-l", after.length));
      a.appendChild(el("span", "side-after-w", after.why));
      inner.appendChild(a);
    }

    if (!inner.children.length) return null;
    side.appendChild(inner);
    return side;
  }

  /* ---------- step 2 ---------- */
  function exerciseRows(l) {
    var box = el("div", "exrows");
    (l.exercises || []).forEach(function (e, i) {
      var runner = exerciseResult(l.id, e.name);
      var on = exerciseChecked(l, e);
      var row = el("button", "exrow" +
        (on ? " is-on" : "") + (e.optional ? " is-optional" : "") +
        (runner ? " is-runner" : ""));
      row.type = "button";
      row.setAttribute("aria-pressed", on ? "true" : "false");
      if (runner) {
        row.disabled = true;
        row.title = "Read from site/progress.json — the runner owns this one";
      } else {
        row.addEventListener("click", function () { toggleChecked(l.id, e.name); });
      }

      var box2 = el("span", "exbox", on ? "✓" : "");
      box2.setAttribute("aria-hidden", "true");
      row.appendChild(box2);
      row.appendChild(el("span", "exn", String(i + 1)));

      var body = el("span", "exbody");
      var head = el("span", "exhead");
      head.appendChild(el("code", "exname", e.name));
      if (e.optional) head.appendChild(el("span", "exopt", "optional · not scored"));
      body.appendChild(head);
      body.appendChild(el("span", "exsum", e.summary));
      if (runner && runner.message) body.appendChild(el("span", "exmsg", runner.message));
      row.appendChild(body);

      row.appendChild(el("span", "exbans", constraintLabel(e)));
      box.appendChild(row);
    });
    return box;
  }

  function noteBox(kicker, build, active) {
    var box = el("div", "notebox" + (active ? " is-active" : ""));
    box.appendChild(el("span", "notebox-k", kicker));
    var p = el("p");
    build(p);
    box.appendChild(p);
    return box;
  }

  /* ---------- step 3 ---------- */
  var openSolution = {};

  /* Figures live in walkthrough.html, tagged with the exercise they draw.
     They move into that exercise's card, where the mechanism they explain is. */
  function solutionFigures(l) {
    var tpl = document.getElementById("lesson-" + l.id + "-walkthrough");
    var out = {};
    if (!tpl) return out;
    var frag = tpl.content.cloneNode(true);
    [].slice.call(frag.querySelectorAll("figure[data-solution]")).forEach(function (f) {
      out[f.getAttribute("data-solution")] = f;
    });
    return out;
  }

  function solutionCards(l) {
    var list = el("div", "solutions");
    var figures = solutionFigures(l);
    (l.solutions || []).forEach(function (s) {
      var card = el("div", "solution-card");

      var head = el("div", "sol-head");
      var top = el("div", "sol-top");
      top.appendChild(el("span", "sol-n", String(s.n)));
      top.appendChild(el("code", "sol-name", s.name));
      top.appendChild(el("span", "sol-headline", s.headline));
      var ex = (l.exercises || []).filter(function (e) { return e.name === s.name; })[0];
      if (ex && exerciseChecked(l, ex)) {
        top.appendChild(el("span", "sol-tick",
          lessonTests(l.id) ? "yours passes" : "ticked"));
      }
      head.appendChild(top);
      head.appendChild(el("p", "sol-mech", s.mechanism));
      if (s.trap) head.appendChild(el("p", "sol-trap", s.trap));
      card.appendChild(head);

      var fig = figures[String(s.n)];
      if (fig) {
        var band = el("div", "sol-figure");
        band.appendChild(fig);
        card.appendChild(band);
      }

      var open = !!openSolution[l.id + ":" + s.n];
      var toggle = el("button", "sol-toggle", open ? "▾  hide the code" : "▸  show the code");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.addEventListener("click", function () {
        var key = l.id + ":" + s.n;
        if (openSolution[key]) delete openSolution[key]; else openSolution[key] = true;
        render();
      });
      card.appendChild(toggle);

      if (open) {
        var pre = el("pre");
        var code = el("code", "language-python", s.code);
        pre.appendChild(code);
        card.appendChild(pre);
        var why = el("div", "sol-why");
        why.appendChild(el("span", "sol-why-k", "Why this way"));
        why.appendChild(el("p", null, s.why));
        card.appendChild(why);
      }
      list.appendChild(card);
    });
    return list;
  }

  function walkthroughGate(l, openAnyway, backToExercises) {
    var open = stillOpen(l);
    var box = el("div", "gate");
    box.appendChild(el("div", "step-kicker", "Step 3 · compare"));
    box.appendChild(el("h2", "step-h2", open.length === 1
      ? "One exercise is still unticked."
      : open.length + " exercises are still unticked."));

    var p1 = el("p");
    p1.appendChild(el("b", null,
      "Reading a correct solution produces the feeling of understanding without the substance of it"));
    p1.appendChild(document.createTextNode(
      " — you will nod along, it will make complete sense, and you will not be able to " +
      "reproduce it a week later. Recognition and production are different skills, and " +
      "only one of them transfers."));
    box.appendChild(p1);

    var p2 = el("p");
    p2.appendChild(document.createTextNode("If you are stuck: re-read the docstring, print "));
    p2.appendChild(el("code", null, ".shape"));
    p2.appendChild(document.createTextNode(
      " and the intermediate values, or solve a smaller version on paper first."));
    box.appendChild(p2);

    var row = el("div", "gate-row");
    row.appendChild(button("btn-quiet", "Back to the exercises", backToExercises));
    row.appendChild(button("btn-primary", "Open the walkthrough anyway", openAnyway));
    box.appendChild(row);
    box.appendChild(el("p", "gate-foot",
      "This gate disappears once every exercise is ticked."));
    return box;
  }

  /* The strip that ends a step by naming the next action. */
  function stepFooter(l, steps, i, show) {
    var name = steps[i].name;
    var foot = el("div", "stepfoot");
    var body = el("div", "body");
    var c = lessonCounts(l);
    var open = stillOpen(l);

    if (name === "lesson") {
      body.appendChild(el("b", null, "Next: "));
      body.appendChild(document.createTextNode(
        "write the " + c.total + " functions. Reading is 20% of this; the exercises " +
        "are the other 80%."));
      foot.appendChild(body);
      foot.appendChild(button("btn-primary", "Go to the exercises →",
        function () { show(i + 1); }));
    } else if (name === "exercises") {
      if (open.length) {
        body.appendChild(el("b", null, "Next: "));
        body.appendChild(document.createTextNode(open[0].name +
          (open.length > 1 ? " — " + (open.length - 1) + " more after it." : " — the last one.")));
      } else {
        body.appendChild(el("b", null, "All " + c.total + " ticked. "));
        body.appendChild(document.createTextNode(
          "The walkthrough is open — compare your versions against it."));
      }
      foot.appendChild(body);
      foot.appendChild(button(open.length ? "btn-quiet" : "btn-primary",
        open.length ? "I’m stuck — compare →" : "Open the walkthrough →",
        function () { show(i + 1); }));
    } else {
      return null;
    }
    return foot;
  }

  function buildLesson(l) {
    var root = el("div", "lesson");

    var head = el("div", "lesson-head");
    var crumbs = el("div", "crumbs");
    crumbs.appendChild(button("crumb", "Curriculum", goHome));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    crumbs.appendChild(el("span", null, "Phase " + l.phase.number + " · " + l.phase.title));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    crumbs.appendChild(el("span", "crumb-now", l.id));
    head.appendChild(crumbs);
    head.appendChild(el("h1", "lesson-h1", l.title));
    head.appendChild(el("p", "lesson-lede", l.summary));

    var facts = factsFor(l);
    if (facts) head.appendChild(facts);

    var present = SECTIONS[l.id] || [];
    var steps = STEPS.filter(function (s) { return present.indexOf(s.name) > -1; });

    if (!steps.length) {
      root.appendChild(head);
      var band0 = el("div", "lesson-band");
      var inner0 = el("div", "lesson-inner");
      var ph = el("div");
      ph.appendChild(el("div", "step-kicker", "Not written yet"));
      ph.appendChild(el("h2", "step-h2", "This lesson is planned, not published."));
      ph.appendChild(el("p", "step-lead",
        "Lessons are written one at a time, in order, so that each one can assume " +
        "exactly what came before it. When it exists, it will cover: " +
        l.summary.charAt(0).toLowerCase() + l.summary.slice(1)));
      inner0.appendChild(ph);
      band0.appendChild(inner0);
      root.appendChild(band0);
      return root;
    }

    if (activeTab[l.id] == null || activeTab[l.id] >= steps.length) activeTab[l.id] = 0;

    var bar = el("div", "stepper");
    bar.setAttribute("role", "tablist");
    var panels = el("div", "panels");
    var entries = [];

    steps.forEach(function (step, i) {
      var tpl = document.getElementById("lesson-" + l.id + "-" + step.name);
      var slug = l.id.replace(/\./g, "-") + "-" + step.name;

      var panel = el("section", "panel");
      panel.id = "panel-" + slug;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "step-" + slug);
      panel.tabIndex = 0;

      if (step.name === "lesson") {
        var watch = watchBlock(l);
        if (watch) panel.appendChild(watch);
        if (tpl) panel.appendChild(tpl.content.cloneNode(true));
      } else if (step.name === "exercises") {
        buildImplement(l, panel, tpl);
      } else if (gateWalkthrough(l)) {
        panel.appendChild(walkthroughGate(l, function () {
          unlockedWalkthrough[l.id] = true;
          render();
        }, function () {
          var at = 0;
          steps.forEach(function (st, n) { if (st.name === "exercises") at = n; });
          show(at);
        }));
      } else {
        buildCompare(l, panel, tpl);
      }

      panel.hidden = i !== activeTab[l.id];
      panels.appendChild(panel);

      var b = button("step-btn" + (stepDone(l, step.name) ? " is-done" : "") +
                     (step.name === "walkthrough" && !isComplete(l) ? " is-warn" : ""),
                     null, function () { show(i); });
      b.id = "step-" + slug;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "panel-" + slug);
      b.setAttribute("aria-selected", i === activeTab[l.id] ? "true" : "false");
      b.tabIndex = i === activeTab[l.id] ? 0 : -1;
      b.appendChild(el("span", "step-n", "Step " + (i + 1) + " · " + stepState(l, step.name)));
      b.appendChild(el("span", "step-label", step.label));
      b.addEventListener("keydown", function (evt) {
        var d = { ArrowRight: 1, ArrowLeft: -1 }[evt.key];
        var t = null;
        if (d != null) t = (i + d + entries.length) % entries.length;
        else if (evt.key === "Home") t = 0;
        else if (evt.key === "End") t = entries.length - 1;
        if (t == null) return;
        evt.preventDefault();
        show(t);
        entries[t].btn.focus();
      });
      bar.appendChild(b);
      entries.push({ btn: b, panel: panel, step: step });
    });

    stepJump = function (n) {
      if (n < 0 || n >= entries.length) return false;
      show(n);
      entries[n].btn.focus();
      return true;
    };

    function show(i) {
      activeTab[l.id] = i;
      markSeen(l.id, steps[i].name);
      entries.forEach(function (e, j) {
        e.panel.hidden = j !== i;
        e.btn.classList.toggle("on", j === i);
        e.btn.setAttribute("aria-selected", j === i ? "true" : "false");
        e.btn.tabIndex = j === i ? 0 : -1;
      });
      saveView();
      render();
    }
    entries.forEach(function (e, j) { e.btn.classList.toggle("on", j === activeTab[l.id]); });
    markSeen(l.id, steps[activeTab[l.id]].name);
    head.appendChild(bar);
    root.appendChild(head);

    var band = el("div", "lesson-band");
    var inner = el("div", "lesson-inner");
    inner.appendChild(panels);

    highlight(panels);
    if (typeof Widgets !== "undefined") Widgets.mount(panels);

    var live = entries[activeTab[l.id]];
    var foot = stepFooter(l, steps, activeTab[l.id], show);
    if (foot) live.panel.appendChild(foot);

    if (live.step.name === "exercises") {
      var note = el("p", "exfoot");
      note.appendChild(document.createTextNode(lessonCounts(l).fromRunner
        ? "Status is read from " : "Ticks are yours and live in this browser. When "));
      note.appendChild(el("b", null, "site/progress.json"));
      note.appendChild(document.createTextNode(lessonCounts(l).fromRunner
        ? ", written by the test runner. This page never invents a pass."
        : " exists, real test results replace them."));
      live.panel.appendChild(note);
    }

    /* Step 1 is two columns: the reading, and where you are in it. */
    if (live.step.name === "lesson") {
      var aside = stepAside(l, live.panel);
      if (aside) {
        var cols = el("div", "step1");
        var main = el("div", "step1-main");
        while (live.panel.firstChild) main.appendChild(live.panel.firstChild);
        cols.appendChild(main);
        cols.appendChild(aside);
        live.panel.appendChild(cols);
      }
    }

    band.appendChild(inner);
    root.appendChild(band);

    var resTpl = document.getElementById("lesson-" + l.id + "-resources");
    if (resTpl) {
      var res = el("details", "resources-foot");
      res.appendChild(el("summary", null, "Resources for this lesson"));
      var rbody = el("div", "resources-body");
      rbody.appendChild(resTpl.content.cloneNode(true));
      res.appendChild(rbody);
      inner.appendChild(res);
      res.addEventListener("toggle", function () { if (res.open) highlight(rbody); });
    }

    inner.appendChild(lessonFoot(l));
    return root;
  }

  function buildImplement(l, panel, tpl) {
    var c = lessonCounts(l);
    var sh = el("div", "step-head");
    var meta = el("div");
    meta.appendChild(el("div", "step-kicker", "Step 2 · in your repo"));
    meta.appendChild(el("h2", "step-h2",
      c.total + (c.total === 1 ? " function. " : " functions. ") +
      (c.done === c.total ? "All " + (c.fromRunner ? "passing." : "ticked.")
        : c.done + (c.fromRunner ? " passing." : " ticked."))));
    sh.appendChild(meta);
    sh.appendChild(commandChip("progress " + l.id, "cmdchip plain"));
    panel.appendChild(sh);

    panel.appendChild(el("p", "step-lead",
      c.total + " functions in exercises.py. They come in pairs: each does the same " +
      "maths twice, once by hand so you own the mechanism, once vectorised so you can " +
      "actually use it. " + (c.fromRunner
        ? "The runner owns these rows."
        : "Tick each one off as its tests pass.")));

    panel.appendChild(exerciseRows(l));

    panel.appendChild(noteBox("The constraints are the lesson", function (p) {
      p.appendChild(document.createTextNode(
        "The tests inspect your source, not just your return value. Where a row says "));
      p.appendChild(el("code", null, "plain python"));
      p.appendChild(document.createTextNode(
        ", you are meant to build the mechanism before you are allowed to call it. Where it says "));
      p.appendChild(el("code", null, "no loops"));
      p.appendChild(document.createTextNode(
        ", a Python loop over a NumPy array costs roughly 200× in speed."));
    }));

    panel.appendChild(noteBox("Then run the benchmark", function (p) {
      p.appendChild(document.createTextNode("Once every test passes, "));
      p.appendChild(el("code", null, "python " + (l.dir || "") + "/exercises.py"));
      p.appendChild(document.createTextNode(
        " times your loop against your vectorised version over two million elements. " +
        "Expect 100–200×. That number is why ML is written in NumPy and not in loops — " +
        "and a GPU widens it by roughly another 100×."));
    }));

    /* Whatever else the lesson author wrote for this step goes below. */
    if (tpl) {
      var extra = tpl.content.cloneNode(true);
      var mount = extra.querySelector("[data-exercise-rows]");
      if (mount && mount.parentNode) mount.parentNode.removeChild(mount);
      panel.appendChild(extra);
    }
  }

  function buildCompare(l, panel, tpl) {
    panel.appendChild(el("div", "step-kicker", "Step 3 · walkthrough"));
    panel.appendChild(el("h2", "step-h2", "One solution per exercise, and why it is written that way"));
    panel.appendChild(el("p", "step-lead",
      "The reasoning is open; the code stays folded until you ask for it. Each note " +
      "covers the mechanism, the alternative route, and the trap in between."));

    if ((l.solutions || []).length) panel.appendChild(solutionCards(l));

    panel.appendChild(noteBox("The stretch", function (p) {
      p.appendChild(document.createTextNode(
        "The last scored exercise is the definition of similarity search — one cosine " +
        "per item. It is not the implementation a real system uses. "));
      p.appendChild(el("code", null, "stretch.py"));
      p.appendChild(document.createTextNode(
        " asks for that version: stack the whole library into a matrix and score every " +
        "row in one operation, no loop and no comprehension anywhere. It forces you into "));
      p.appendChild(el("code", null, "axis="));
      p.appendChild(document.createTextNode(" and "));
      p.appendChild(el("code", null, "keepdims="));
      p.appendChild(document.createTextNode(", where nearly everyone's first silent shape bug lives."));
    }, true));

    /* The authored walkthrough keeps its diagrams, one click away. */
    if (tpl) {
      var more = el("details", "resources-foot");
      more.appendChild(el("summary", null, "The longer walkthrough"));
      var body = el("div", "resources-body");
      var prose = tpl.content.cloneNode(true);
      /* Whatever a card already shows is not repeated down here. */
      [].slice.call(prose.querySelectorAll("figure[data-solution]")).forEach(function (f) {
        if (f.parentNode) f.parentNode.removeChild(f);
      });
      body.appendChild(prose);
      more.appendChild(body);
      panel.appendChild(more);
      more.addEventListener("toggle", function () {
        if (!more.open) return;
        highlight(body);
        if (typeof Widgets !== "undefined") Widgets.mount(body);
      });
    }

    var closeTpl = document.getElementById("lesson-" + l.id + "-closeout");
    if (closeTpl) {
      var close = el("div", "closeout");
      close.appendChild(closeTpl.content.cloneNode(true));
      panel.appendChild(close);
    }
  }

  function lessonFoot(l) {
    var pool = writtenLessons();
    var idx = pool.indexOf(l);
    var foot = el("div", "lesson-foot");
    if (idx > 0) {
      var pv = pool[idx - 1];
      foot.appendChild(button("linkbtn", "← " + pv.id + " " + pv.title,
        function () { goLesson(pv.id); }));
    } else {
      foot.appendChild(el("span", "is-end", "← first lesson"));
    }
    if (idx > -1 && idx + 1 < pool.length) {
      var nx = pool[idx + 1];
      foot.appendChild(button("linkbtn", "next: " + nx.id + " " + nx.title + " →",
        function () { goLesson(nx.id); }));
    } else {
      var at = allLessons.indexOf(l);
      var after = at > -1 && at + 1 < allLessons.length ? allLessons[at + 1] : null;
      foot.appendChild(el("span", null, after
        ? "next: " + after.id + " " + after.title + " · not written yet →"
        : "last lesson →"));
    }
    return foot;
  }

  /* ---------- render ---------- */
  /* Set by buildLesson while a lesson is on screen; nothing else answers 1-4. */
  var stepJump = null;

  function render() {
    stepJump = null;
    var pane = document.getElementById("pane");
    pane.textContent = "";

    if (view.kind === "lesson") {
      var l = lessonById(view.id);
      pane.appendChild(l ? buildLesson(l) : buildHome());
    } else if (view.kind === "setup") {
      pane.appendChild(buildSetup());
    } else {
      pane.appendChild(buildHome());
    }

    var c = checkedTotals();
    document.getElementById("stat-count").textContent = c.done + " / " + c.total;
    document.getElementById("stat-bar").style.width =
      (c.total ? c.done / c.total * 100 : 0) + "%";
    document.getElementById("topstat").title = c.fromRunner
      ? "Exercises passing, read from site/progress.json"
      : "Exercises you have ticked off, stored in this browser";
    buildRail();

    if (window.matchMedia("(max-width: 940px)").matches) {
      rail.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  /* ---------- navigation chrome ---------- */
  var rail = document.getElementById("rail");
  var toggle = document.getElementById("railtoggle");

  document.getElementById("brand").addEventListener("click", goHome);
  document.getElementById("searchbtn").addEventListener("click", openPalette);
  document.getElementById("rail-setup").addEventListener("click", function () { go("setup"); });
  toggle.addEventListener("click", function () {
    rail.hidden = !rail.hidden;
    toggle.setAttribute("aria-expanded", rail.hidden ? "false" : "true");
  });

  var narrow = window.matchMedia("(max-width: 940px)");
  function syncRail() { if (!narrow.matches) rail.hidden = false; }
  window.addEventListener("resize", syncRail);

  /* ---------- theme ----------
     head.html already applied any saved choice before first paint; this only
     wires the control and keeps it in sync. No stored value means no attribute,
     which leaves prefers-color-scheme in charge. */
  var THEME_KEY = "mlfs:theme:v1";
  var themeButtons = [].slice.call(document.querySelectorAll("[data-theme-set]"));
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function effectiveTheme() {
    return document.documentElement.getAttribute("data-theme") ||
           (darkQuery.matches ? "dark" : "light");
  }
  function syncTheme() {
    var now = effectiveTheme();
    themeButtons.forEach(function (b) {
      var mine = b.getAttribute("data-theme-set") === now;
      b.classList.toggle("on", mine);
      b.setAttribute("aria-pressed", mine ? "true" : "false");
    });
  }
  themeButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = b.getAttribute("data-theme-set");
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      syncTheme();
    });
  });
  /* Follow the OS until the reader makes a choice of their own. */
  if (darkQuery.addEventListener) {
    darkQuery.addEventListener("change", function () {
      if (!document.documentElement.getAttribute("data-theme")) syncTheme();
    });
  }
  syncTheme();

  if (narrow.matches) rail.hidden = true;
  var SEEN_KEY = "mlfs:seen-setup:v1";
  restoreView();
  try {
    if (!localStorage.getItem(SEEN_KEY) && !localStorage.getItem(VIEW_KEY) &&
        !Object.keys(done).length) {
      view = { kind: "setup", id: null };   /* shown once, then never in the way */
    }
    localStorage.setItem(SEEN_KEY, "1");
  } catch (e) {}
  wirePalette();
  loadProgress();
  render();
})();

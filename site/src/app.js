/* Shell: routing, progress, the curriculum rail, and the overview. */
(function () {
  "use strict";

  var STORE_KEY = "mlfs:progress:v1";
  var data = JSON.parse(document.getElementById("curriculum-data").textContent);
  var phases = data.phases;
  var allLessons = [];
  phases.forEach(function (p) {
    p.lessons.forEach(function (l) { l.phase = p; allLessons.push(l); });
  });
  var TOTAL = allLessons.length;

  /* ---------- progress: per viewer, per device ---------- */
  function loadDone() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var arr = JSON.parse(raw), out = {};
      if (Array.isArray(arr)) arr.forEach(function (id) { out[id] = true; });
      return out;
    } catch (e) { return {}; }
  }
  function saveDone() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Object.keys(done))); } catch (e) {}
  }
  var done = loadDone();
  var view = { kind: "continue", id: null };
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
  function phaseDone(p) { return p.lessons.filter(isComplete).length; }
  function totalDone() { return writtenLessons().filter(isComplete).length; }
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
      } else if (saved.kind === "phase" && !phaseById(saved.id)) {
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
  function goOverview() { go("continue"); }
  function goLesson(id) { go("lesson", id); }
  function goPhase(id) { go("phase", id); }

  function phaseById(id) {
    for (var i = 0; i < phases.length; i++) if (phases[i].id === id) return phases[i];
    return null;
  }
  function allExercises() {
    var out = [];
    writtenLessons().forEach(function (l) {
      (l.exercises || []).forEach(function (e) { out.push({ lesson: l, ex: e }); });
    });
    return out;
  }
  function toggleDone(id) {
    if (done[id]) { delete done[id]; } else { done[id] = true; }
    saveDone();
    render();
  }
  function highlight(scope) {
    if (typeof hljs === "undefined") return;
    scope.querySelectorAll("pre code").forEach(function (node) {
      try { hljs.highlightElement(node); } catch (e) {}
    });
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
  /* Completion is derived from the runner where the runner has spoken; the hand
     tick is only a fallback, and the UI says so wherever it is the source. */
  function isComplete(l) {
    var lt = lessonTests(l.id);
    if (lt && lt.tests_total) return lt.tests_passed === lt.tests_total;
    return !!done[l.id];
  }
  function completionIsDerived(l) {
    var lt = lessonTests(l.id);
    return !!(lt && lt.tests_total);
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

  function walkthroughGate(l, openAnyway, backToExercises) {
    var lt = lessonTests(l.id);
    var red = lt
      ? lt.exercises.filter(function (e) { return e.status !== "pass"; }).length
      : null;

    var box = el("div", "gate");
    box.appendChild(el("div", "eyebrow", "before you read this"));
    box.appendChild(el("h2", null, red === null
      ? "You have not run the tests yet."
      : red + (red === 1 ? " exercise is" : " exercises are") + " still red."));
    box.appendChild(el("p", "gate-body",
      "Recognising correct code is a different skill from producing it, and only one of " +
      "them transfers. Read this now and it will feel like understanding; it will not " +
      "survive the week."));
    box.appendChild(el("p", "gate-body",
      "If you are stuck, the useful moves are re-reading the docstring, printing the " +
      "intermediate values, or solving a smaller version on paper."));

    var ctrls = el("div", "ctrls");
    ctrls.appendChild(button("btn", "Back to the exercises", backToExercises));
    ctrls.appendChild(button("btn ghost", "Open it anyway", openAnyway));
    box.appendChild(ctrls);
    return box;
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
                 sub: p.subtitle, act: function () { goPhase(p.id); } });
    });
    allLessons.forEach(function (l) {
      out.push({ kind: l.written ? "lesson" : "planned", label: l.id + " · " + l.title,
                 sub: l.phase.title,
                 act: l.written ? function () { goLesson(l.id); } : function () { goPhase(l.phase.id); } });
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
    LIBRARY.forEach(function (it) {
      out.push({ kind: it.kind, label: it.title, sub: "library", url: it.url,
                 act: function () { go("library"); } });
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
        q ? "Nothing matches “" + q + "”." : "Nothing to show yet."));
      empty.appendChild(el("br"));
      empty.appendChild(document.createTextNode(
        "Search covers lesson titles, exercise names, section headings and the library."));
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

      /* 1-4 jump between the steps of the lesson you are on. */
      if (stepJump && /^[1-9]$/.test(evt.key) && stepJump(parseInt(evt.key, 10) - 1)) {
        evt.preventDefault();
        return;
      }
      if (evt.key !== "j" && evt.key !== "k") return;

      var links = [].slice.call(document.querySelectorAll("#rail-nav .lesson-link"));
      if (!links.length) return;
      evt.preventDefault();
      var at = links.indexOf(document.activeElement);
      if (at < 0) at = evt.key === "j" ? -1 : 0;
      var to = evt.key === "j"
        ? Math.min(at + 1, links.length - 1)
        : Math.max(at - 1, 0);
      links[to].focus();
    });
  }

  /* ---------- rail ---------- */
  var railNav = document.getElementById("rail-nav");
  var railAreas = document.getElementById("rail-areas");

  /* Four doors instead of one. Everything used to hang off whichever lesson you
     happened to be in, so a resource spanning four lessons had nowhere to live. */
  var AREAS = [
    { kind: "continue", label: "Continue", meta: function () { return ""; } },
    { kind: "path", label: "Path", meta: function () { return String(TOTAL); } },
    { kind: "practice", label: "Practice", meta: function () {
        return progressData ? String(redCount()) : String(allExercises().length);
      } },
    { kind: "library", label: "Library", meta: function () { return String(LIBRARY.length); } }
  ];

  function buildAreas() {
    railAreas.textContent = "";
    AREAS.forEach(function (a) {
      var active = view.kind === a.kind ||
                   (a.kind === "path" && (view.kind === "phase" || view.kind === "lesson"));
      var b = button("area" + (active ? " current" : ""), null, function () { go(a.kind); });
      b.setAttribute("aria-current", active ? "page" : "false");
      b.appendChild(el("span", "area-label", a.label));
      var m = a.meta();
      if (m) {
        var meta = el("span", "area-meta" + (a.kind === "practice" && redCount() ? " is-red" : ""), m);
        b.appendChild(meta);
      }
      railAreas.appendChild(b);
    });
    document.getElementById("rail-setup").classList.toggle("current", view.kind === "setup");
  }

  /* Exercises the runner has marked failing, across every written lesson. */
  function redCount() {
    if (!progressData) return 0;
    var n = 0;
    writtenLessons().forEach(function (l) {
      var lt = lessonTests(l.id);
      if (!lt) return;
      lt.exercises.forEach(function (e) { if (e.status === "fail") n++; });
    });
    return n;
  }

  function buildRail() {
    buildAreas();
    railNav.textContent = "";

    var written = writtenLessons();
    var planned = allLessons.length - written.length;

    railNav.appendChild(el("div", "rail-zone", "Available now"));
    if (written.length) {
      var list = el("ul", "lesson-list");
      written.forEach(function (l) {
        var row = el("li", "lesson-row" +
          (view.kind === "lesson" && view.id === l.id ? " current" : "") +
          (isComplete(l) ? " is-done" : ""));
        var link = button("lesson-link", null, function () { goLesson(l.id); });
        link.appendChild(el("span", "lid", l.id));
        link.appendChild(el("span", "ltitle", l.title));
        if (isComplete(l)) link.appendChild(el("span", "dot-ready"));
        row.appendChild(link);
        list.appendChild(row);
      });
      railNav.appendChild(list);
    } else {
      railNav.appendChild(el("div", "rail-empty", "Nothing written yet."));
    }

    if (!planned) return;

    railNav.appendChild(el("div", "rail-zone", "Ahead"));
    var ahead = el("div", "ahead-list");
    phases.forEach(function (p) {
      var count = p.lessons.filter(function (l) { return !l.written; }).length;
      if (!count) return;
      /* Clickable, because a phase page is real content — unlike the
         placeholder these rows used to lead to. */
      var row = button("ahead-row", null, function () { goPhase(p.id); });
      row.title = p.milestone;
      row.appendChild(el("span", "ahead-num", String(p.number)));
      var title = el("span", "ahead-title", p.title);
      title.appendChild(el("span", "ahead-count", " \u00b7 " + count + " planned"));
      row.appendChild(title);
      ahead.appendChild(row);
    });
    railNav.appendChild(ahead);
  }

  /* ---------- continue — ported from the design canvas ---------- */

  function copyButton(text, target, cls) {
    var b = button(cls || "copybtn", "copy", function () {
      var reset = function () { b.textContent = "copy"; b.classList.remove("ok", "warn"); };
      var fallback = function () {
        b.textContent = "Ctrl+C";
        b.classList.add("warn");
        try {
          var range = document.createRange();
          range.selectNodeContents(target);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {}
        setTimeout(reset, 2600);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            b.textContent = "copied";
            b.classList.add("ok");
            setTimeout(reset, 1400);
          }, fallback);
          return;
        }
      } catch (e) {}
      fallback();
    });
    b.setAttribute("aria-label", "Copy " + text);
    return b;
  }

  function commandRow(cmd) {
    var row = el("div", "cmdrow");
    var code = el("code", "cmdtext", cmd);
    row.appendChild(code);
    row.appendChild(copyButton(cmd, code));
    return row;
  }

  /* The design's command control: the text and the copy affordance are one
     chip, so the whole thing reads as a thing you take. */
  function commandChip(cmd, cls) {
    var chip = el("button", cls || "cmdchip");
    chip.type = "button";
    var code = el("span", null, cmd);
    chip.appendChild(code);
    var label = el("span", "copylabel", "copy");
    chip.appendChild(label);
    chip.addEventListener("click", function () {
      var reset = function () { label.textContent = "copy"; label.classList.remove("ok", "warn"); };
      var fallback = function () {
        label.textContent = "Ctrl+C";
        label.classList.add("warn");
        try {
          var range = document.createRange();
          range.selectNodeContents(code);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {}
        setTimeout(reset, 2600);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cmd).then(function () {
            label.textContent = "copied";
            label.classList.add("ok");
            setTimeout(reset, 1400);
          }, fallback);
          return;
        }
      } catch (e) {}
      fallback();
    });
    return chip;
  }

  function buildOverview() {
    var wrap = el("div", "wrap");
    var next = nextLesson();

    if (!next) {
      wrap.appendChild(el("div", "hero-eyebrow", "nothing outstanding"));
      wrap.appendChild(el("h1", "hero-h1", "You are up to date."));
      wrap.appendChild(smallCards(null));
      wrap.appendChild(paneNote(null));
      return wrap;
    }

    var lt = lessonTests(next.id);
    var open = [];
    if (lt) {
      lt.exercises.forEach(function (e) { if (e.status !== "pass") open.push(e.name); });
    }

    var present = SECTIONS[next.id] || [];
    var steps = STEPS.filter(function (s) { return present.indexOf(s.name) > -1; });
    var at = Math.min(activeTab[next.id] || 0, Math.max(steps.length - 1, 0));
    var stepName = steps.length ? steps[at].label : null;
    var resumed = activeTab[next.id] != null;

    wrap.appendChild(el("div", "hero-eyebrow",
      "Phase " + next.phase.number + " · " + next.phase.title));
    wrap.appendChild(el("h1", "hero-h1",
      lt && open.length
        ? open.length + (open.length === 1 ? " exercise left in " : " exercises left in ") + next.id + "."
        : lt ? next.id + " is passing. Close it out."
        : next.title + "."));

    var card = el("div", "continue-card");
    var head = el("div", "continue-head");

    var meta = el("div", "continue-meta");
    meta.appendChild(el("div", "continue-kicker", "Continue · lesson " + next.id));
    if (stepName) {
      meta.appendChild(el("div", "continue-step",
        "step " + (at + 1) + " of " + steps.length + " — " + stepName.toLowerCase()));
    }
    head.appendChild(meta);
    head.appendChild(el("div", "continue-title", next.title));
    head.appendChild(el("p", "continue-nudge", lt
      ? (open.length
          ? "Pick up where the tests stop. Nothing here is guessed — the numbers come from the runner."
          : "Everything passes. Answer the closing questions and mark it done.")
      : next.summary));

    var actions = el("div", "continue-actions");
    var cta = el("button", "btn-primary");
    cta.type = "button";
    cta.textContent = stepName
      ? (resumed ? "Resume " + stepName.toLowerCase() : "Start " + stepName.toLowerCase())
      : "Open lesson";
    cta.addEventListener("click", function () { goLesson(next.id); });
    actions.appendChild(cta);
    actions.appendChild(commandChip("progress " + next.id));
    head.appendChild(actions);
    card.appendChild(head);

    var stats = el("div", "continue-stats");

    var s1 = el("div", "cstat");
    s1.appendChild(el("div", "cstat-k", "Tests passing"));
    s1.appendChild(el("div", "cstat-big", lt ? lt.tests_passed + " / " + lt.tests_total : "—"));
    stats.appendChild(s1);

    var s2 = el("div", "cstat");
    s2.appendChild(el("div", "cstat-k", "Still open"));
    s2.appendChild(el("div", "cstat-red", lt
      ? (open.length ? open.join(", ") : "nothing")
      : "not run yet"));
    stats.appendChild(s2);

    var s3 = el("div", "cstat");
    s3.appendChild(el("div", "cstat-k", "Optional stretch"));
    s3.appendChild(el("div", "cstat-sub", "stretch.py · not scored"));
    stats.appendChild(s3);

    card.appendChild(stats);
    wrap.appendChild(card);

    wrap.appendChild(smallCards(next));
    wrap.appendChild(paneNote(next));
    return wrap;
  }

  function smallCards(next) {
    var row = el("div", "smallcards");
    var written = writtenLessons();
    var doneCount = written.filter(isComplete).length;

    var a = el("div", "scard");
    var ah = el("div", "scard-head");
    ah.appendChild(el("div", "scard-k", "Where you are"));
    ah.appendChild(button("scard-go", "Path →", function () { go("path"); }));
    a.appendChild(ah);
    var count = el("div", "scard-count");
    count.appendChild(el("span", "scard-num", String(doneCount)));
    count.appendChild(el("span", "scard-of",
      "of " + TOTAL + " lessons · " + written.length + " written so far"));
    a.appendChild(count);
    var bar = el("div", "scard-bar");
    var fill = el("i");
    fill.style.width = (TOTAL ? doneCount / TOTAL * 100 : 0) + "%";
    bar.appendChild(fill);
    a.appendChild(bar);
    var ph = next ? next.phase : phases[0];
    var mile = el("p", "scard-mile");
    mile.appendChild(el("b", null, "Phase " + ph.number + " milestone. "));
    mile.appendChild(document.createTextNode(ph.milestone));
    a.appendChild(mile);
    row.appendChild(a);

    var b = el("div", "scard");
    var bh = el("div", "scard-head");
    bh.appendChild(el("div", "scard-k", "In your library"));
    bh.appendChild(button("scard-go", "Library →", function () { go("library"); }));
    b.appendChild(bh);
    var picked = LIBRARY.filter(function (it) {
      return next && (it.lessons || []).indexOf(next.id) > -1;
    });
    LIBRARY.forEach(function (it) {
      if (picked.length < 3 && picked.indexOf(it) < 0) picked.push(it);
    });
    var list = el("div", "scard-list");
    picked.slice(0, 3).forEach(function (it) {
      var item = el("div", "scard-item");
      item.appendChild(el("span", "scard-kind", it.kind));
      item.appendChild(el("span", "scard-title", it.title));
      list.appendChild(item);
    });
    b.appendChild(list);
    row.appendChild(b);

    return row;
  }

  function paneNote(next) {
    var p = el("p", "pane-note");
    p.appendChild(document.createTextNode("Progress is read from "));
    p.appendChild(el("b", null, "site/progress.json"));
    p.appendChild(document.createTextNode(", written by "));
    p.appendChild(el("b", null, "progress --json"));
    p.appendChild(document.createTextNode(
      ". This page never invents a pass. Self-paced — no streaks, no deadlines."));
    return p;
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
    var lede = el("p", "hero-lede");
    lede.style.maxWidth = "66ch";
    lede.textContent = "Read once, then get out of your way. This page is linked from " +
      "the rail and shown automatically on a first visit.";
    wrap.appendChild(lede);

    wrap.appendChild(sectionKey("The loop"));
    var steps = el("div", "steps");
    [
      ["01", ["Read the lesson on this site. Poke at the demos, but budget roughly " +
              "20% of your time here."]],
      ["02", ["Write the exercises in your repo. This is the 80%, and the only part " +
              "that transfers."]],
      ["03", ["Run ", { code: "progress " + id }, " until every test passes. Compare " +
              "against the walkthrough only afterwards."]],
      ["04", ["Answer the closing questions in ", { code: "notes.md" }, ", in your own " +
              "words. Six months from now this is the most valuable file in the repo."]]
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
      "Test results come from ",
      { code: "progress " + id + " --json > site/progress.json" },
      ". Anything you tick by hand is stored in this browser only — export it before " +
      "you switch machines."
    ]));
    card.appendChild(lead);

    var row = el("div", "progrow");
    var exp = button("btn-quiet", "Export my progress", function () {
      var blob = JSON.stringify({
        version: 1,
        done: Object.keys(done),
        seenSteps: seenSteps,
        progress: progressData
      });
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
      p.appendChild(el("b", null, "Clear every hand-ticked lesson and step? "));
      p.appendChild(document.createTextNode(
        "This cannot be undone, and it will not touch your repo or your test results. " +
        "Export first if you have not."));
      box.appendChild(p);
      var crow = el("div", "confirm-row");
      crow.appendChild(button("btn-yes", "Yes, clear it", function () {
        done = {};
        saveDone();
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
     ["1–4", "jump to a lesson step"],
     ["j / k", "move down and up the rail"],
     ["esc", "close search"]].forEach(function (k) {
      var r = el("div", "keyrow");
      r.appendChild(el("kbd", null, k[0]));
      r.appendChild(el("span", null, k[1]));
      keys.appendChild(r);
    });
    wrap.appendChild(keys);
    return wrap;
  }

  /* ---------- path — ported from the design canvas ---------- */

  /* Every lesson, in order, as one strip. Colour and height carry the
     same three states, so the shape is readable before the legend is. */
  function rulerCard() {
    var card = el("div", "ruler-card");

    var top = el("div", "ruler-top");
    top.appendChild(el("div", "ruler-k", "All " + TOTAL + " lessons"));
    var written = writtenLessons();
    top.appendChild(el("div", "ruler-count",
      written.length + " written · " + totalDone() + " complete"));
    card.appendChild(top);

    var ruler = el("div", "ruler");
    allLessons.forEach(function (l) {
      var t = el("span", "ptick");
      t.setAttribute("data-state", isComplete(l) ? "done" : (l.written ? "ready" : "planned"));
      t.title = l.id + " — " + l.title;
      ruler.appendChild(t);
    });
    card.appendChild(ruler);

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
    card.appendChild(legend);
    return card;
  }

  function milestoneStrip(text, cls) {
    var box = el("div", cls || "milestone");
    box.appendChild(el("span", "milestone-k", "Milestone"));
    box.appendChild(el("span", "milestone-t", text));
    return box;
  }

  function buildPath() {
    var wrap = el("div", "wrap is-path");
    wrap.appendChild(el("div", "hero-eyebrow", "The path"));
    wrap.appendChild(el("h1", "hero-h1", "Five phases, " + TOTAL + " lessons"));
    wrap.appendChild(el("p", "hero-lede",
      "Written in order and meant to be taken in order. " +
      writtenLessons().length + " of " + TOTAL + " lessons are written; the rest are " +
      "planned, and their milestones are the part worth reading now."));
    wrap.appendChild(rulerCard());

    var cards = el("div", "phase-cards");
    phases.forEach(function (ph) {
      var written = ph.lessons.filter(function (l) { return l.written; }).length;
      var card = el("div", "pcard");
      var b = button("pcard-btn", null, function () { goPhase(ph.id); });

      var top = el("div", "pcard-top");
      top.appendChild(el("span", "phase-chip", "PHASE " + ph.number));
      top.appendChild(el("span", "pcard-title", ph.title));
      top.appendChild(el("span", "pcard-sub", ph.subtitle));
      top.appendChild(el("span", "pcard-count", ph.lessons.length + " lessons" +
        (written ? " · " + written + " written" : "")));
      b.appendChild(top);

      b.appendChild(el("p", "pcard-blurb", ph.blurb));
      b.appendChild(milestoneStrip(ph.milestone));
      card.appendChild(b);
      cards.appendChild(card);
    });
    wrap.appendChild(cards);
    return wrap;
  }

  /* ---------- one phase — ported from the design canvas ---------- */
  function buildPhase(ph) {
    var wrap = el("div", "wrap");

    var crumbs = el("div", "crumbs spaced");
    crumbs.appendChild(button("crumb", "Path", function () { go("path"); }));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    crumbs.appendChild(el("span", "crumb-now", "Phase " + ph.number));
    wrap.appendChild(crumbs);

    wrap.appendChild(el("div", "hero-eyebrow", "Phase " + ph.number + " · " + ph.subtitle));
    wrap.appendChild(el("h1", "hero-h1", ph.title));
    wrap.appendChild(el("p", "hero-lede phase-lede", ph.blurb));
    wrap.appendChild(milestoneStrip(ph.milestone, "phase-mile"));

    var written = ph.lessons.filter(function (l) { return l.written; }).length;
    var head = el("div", "list-head");
    head.appendChild(el("h2", null, "Lessons"));
    head.appendChild(el("span", "list-count", ph.lessons.length + " lessons · " +
      (written ? written + " written" : "none written yet")));
    wrap.appendChild(head);

    var list = el("div", "phase-lessons");
    ph.lessons.forEach(function (l) {
      var done = isComplete(l);
      var row = l.written
        ? button("plesson", null, function () { goLesson(l.id); })
        : el("div", "plesson is-planned");
      row.appendChild(el("span", "plesson-id", l.id));
      var body = el("span", "plesson-body");
      body.appendChild(el("span", "plesson-title", l.title));
      body.appendChild(el("span", "plesson-sum", l.summary));
      row.appendChild(body);
      row.appendChild(el("span",
        "plesson-tag " + (done ? "done" : l.written ? "ready" : "plan"),
        done ? "complete" : l.written ? "written" : "planned"));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- practice — ported from the design canvas ---------- */
  var practiceFilter = "all";

  function buildPractice() {
    var wrap = el("div", "wrap");
    var rows = allExercises();
    var open = rows.filter(function (r) {
      return statusOf(r.lesson.id, r.ex.name) !== "pass";
    });

    wrap.appendChild(el("div", "hero-eyebrow", "Practice"));
    wrap.appendChild(el("h1", "hero-h1", "Every exercise, and what the tests say"));
    wrap.appendChild(el("p", "hero-lede",
      "Across every written lesson. Status comes from the runner, so this and " +
      "your repo cannot disagree."));

    var filters = el("div", "filters");
    [["all", "All", rows.length], ["open", "Not passing", open.length]]
      .forEach(function (f) {
        var b = button("filter" + (practiceFilter === f[0] ? " on" : ""), null,
          function () { practiceFilter = f[0]; render(); });
        b.appendChild(document.createTextNode(f[1] + " "));
        b.appendChild(el("b", null, String(f[2])));
        b.setAttribute("aria-pressed", practiceFilter === f[0] ? "true" : "false");
        filters.appendChild(b);
      });
    var next = nextLesson();
    filters.appendChild(commandChip("progress " + (next ? next.id : "--json"), "cmdchip plain"));
    wrap.appendChild(filters);

    var shown = practiceFilter === "open" ? open : rows;
    var list = el("div", "exrows");
    if (!shown.length) {
      list.appendChild(el("div", "exempty", rows.length
        ? "Every exercise is passing."
        : "No exercises yet — no lesson has been written."));
    }
    shown.forEach(function (r) {
      list.appendChild(exerciseRow(r.lesson, r.ex, true));
    });
    wrap.appendChild(list);

    var note = el("p", "pane-note");
    note.appendChild(document.createTextNode(
      "The tests inspect your source, not just your return value. The last column " +
      "is what each one actually forbids, read from the assertion that enforces it."));
    if (!progressData) {
      note.appendChild(el("br"));
      note.appendChild(document.createTextNode("No results loaded yet — "));
      note.appendChild(button("linkbtn", "Setup & environment", function () { go("setup"); }));
      note.appendChild(document.createTextNode(" says how to run them."));
    }
    wrap.appendChild(note);
    return wrap;
  }

  /* One exercise row, drawn the same way on Practice and inside a lesson.
     Everything it says about status comes from the runner. */
  function statusOf(lessonId, name) {
    var r = exerciseResult(lessonId, name);
    return r ? r.status : "not_run";
  }

  function exerciseRow(l, e, showLesson) {
    var res = exerciseResult(l.id, e.name);
    var status = res ? res.status : "not_run";
    var row = el("div", "exrow is-" + status + (e.optional ? " is-optional" : ""));

    var mark = el("span", "exmark", status === "pass" ? "✓" : status === "fail" ? "!" : "");
    mark.setAttribute("data-status", status);
    mark.setAttribute("aria-hidden", "true");
    row.appendChild(mark);

    var body = el("div", "exbody");
    var head = el("div", "exhead");
    head.appendChild(el("code", "exname", e.name));
    if (showLesson) {
      head.appendChild(el("span", "exwhere",
        "lesson " + l.id + " · #" + ((l.exercises || []).indexOf(e) + 1)));
    }
    if (e.optional) head.appendChild(el("span", "exopt", "optional"));
    body.appendChild(head);
    body.appendChild(el("span", "exsum", e.summary));
    if (res && res.message) body.appendChild(el("span", "exmsg", res.message));
    row.appendChild(body);

    row.appendChild(el("span", "exstat is-" + status,
      status === "pass" ? res.tests_total + (res.tests_total === 1 ? " test passes" : " tests pass")
        : status === "fail" ? (res.tests_total - res.tests_passed) + " of " + res.tests_total + " failing"
        : e.optional ? "not scored" : "todo"));

    var bans = el("span", "exbans");
    (e.forbids || []).forEach(function (b, i) {
      if (i) bans.appendChild(el("br"));
      bans.appendChild(document.createTextNode(b));
    });
    row.appendChild(bans);
    return row;
  }

  /* ---------- library — ported from the design canvas ---------- */
  var libKind = "all";

  function buildLibrary() {
    var wrap = el("div", "wrap");
    wrap.appendChild(el("div", "hero-eyebrow", "Library"));
    wrap.appendChild(el("h1", "hero-h1", "Everything you have collected"));
    wrap.appendChild(el("p", "hero-lede",
      "Papers, videos, courses and repositories. Tagged by lesson, but findable " +
      "when you have forgotten which lesson it was."));

    var kinds = ["all"];
    LIBRARY.forEach(function (it) { if (kinds.indexOf(it.kind) < 0) kinds.push(it.kind); });
    var filters = el("div", "libfilters");
    kinds.forEach(function (k) {
      var n = k === "all" ? LIBRARY.length
        : LIBRARY.filter(function (it) { return it.kind === k; }).length;
      var b = button("filter" + (libKind === k ? " on" : ""), null,
        function () { libKind = k; render(); });
      b.appendChild(document.createTextNode(k + " "));
      b.appendChild(el("b", null, String(n)));
      b.setAttribute("aria-pressed", libKind === k ? "true" : "false");
      filters.appendChild(b);
    });
    wrap.appendChild(filters);

    var list = el("div", "libitems");
    LIBRARY.filter(function (it) { return libKind === "all" || it.kind === libKind; })
      .forEach(function (it) {
        var row = el("div", "libitem");
        row.appendChild(el("span", "libkind", it.kind));

        var body = el("div", "libbody");
        var top = el("div", "libtop");
        /* The design draws the title as plain text; it stays a link, because a
           library you cannot open is a list. At rest the two look the same. */
        var a = el("a", "libtitle", it.title);
        a.href = it.url;
        a.target = "_blank";
        a.rel = "noopener";
        top.appendChild(a);
        if (it.by) top.appendChild(el("span", "libby", it.by));
        body.appendChild(top);
        if (it.note) body.appendChild(el("p", "libnote", it.note));

        var tags = el("div", "libtags");
        (it.lessons || []).forEach(function (lid) {
          var l = lessonById(lid);
          if (!l) return;
          tags.appendChild(l.written
            ? button("libtag", lid + " " + l.title, function () { goLesson(lid); })
            : el("span", "libtag", lid + " " + l.title));
        });
        (it.phases || []).forEach(function (n) {
          var ph = phases.filter(function (x) { return x.number === n; })[0];
          if (ph) tags.appendChild(button("libtag", "Phase " + n, function () { goPhase(ph.id); }));
        });
        if (tags.children.length) body.appendChild(tags);

        row.appendChild(body);
        list.appendChild(row);
      });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- lesson — ported from the design canvas ----------
     Four steps, taken in order. The header sits on paper; the steps are tabs
     joined to a --surface band, so the step you are on reads as the page. */
  var STEPS = [
    { name: "lesson", label: "Read" },
    { name: "exercises", label: "Implement" },
    { name: "walkthrough", label: "Compare" },
    { name: "closeout", label: "Close out" }
  ];
  var SEEN_STEPS_KEY = "mlfs:seen-steps:v1";
  var ANSWERED_KEY = "mlfs:answered:v1";
  var seenSteps = (function () {
    try { return JSON.parse(localStorage.getItem(SEEN_STEPS_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  })();
  var answered = (function () {
    try { return JSON.parse(localStorage.getItem(ANSWERED_KEY) || "{}") || {}; }
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

  function testCounts(l) {
    var lt = lessonTests(l.id);
    if (lt) return { passed: lt.tests_passed, total: lt.tests_total, run: true };
    return { passed: 0, total: (l.exercises || []).length, run: false };
  }
  function notPassing(l) {
    return (l.exercises || []).filter(function (e) {
      return !e.optional && statusOf(l.id, e.name) !== "pass";
    });
  }

  /* What the step button says under "Step N". */
  function stepState(l, name) {
    var c = testCounts(l);
    if (name === "lesson") return hasSeen(l.id, name) ? "read" : "not read";
    if (name === "exercises") return c.run ? c.passed + " of " + c.total : c.total + " to write";
    if (name === "walkthrough") return isComplete(l) ? "open" : "spoilers";
    return isComplete(l) ? "done" : "—";
  }
  function stepDone(l, name) {
    var c = testCounts(l);
    if (name === "lesson") return hasSeen(l.id, name);
    if (name === "exercises") return c.run && c.passed === c.total && c.total > 0;
    if (name === "closeout") return isComplete(l);
    return false;
  }

  function factsFor(l) {
    var tpl = document.getElementById("lesson-" + l.id + "-brief");
    if (!tpl) return null;
    var frag = tpl.content.cloneNode(true);
    var grid = frag.querySelector(".facts");
    if (!grid) return null;
    /* One cell is live: the count comes from the runner, never from the file. */
    var live = grid.querySelector("[data-live=\"tests\"]");
    if (live) {
      var c = testCounts(l);
      live.appendChild(document.createTextNode(
        c.run ? " · " + c.passed + " of " + c.total + " passing" : " · not run yet"));
    }
    return grid;
  }

  /* The right-hand column of step 1: where you are, what it is for, what to
     read first. Headings are read from the panel, so it cannot drift. */
  function stepAside(l, panel) {
    var side = el("aside", "step-side");
    var inner = el("div", "step-side-inner");

    var heads = [].slice.call(panel.querySelectorAll("h2"));
    if (heads.length > 1) {
      inner.appendChild(el("div", "side-k", "On this step"));
      var list = el("div", "side-toc");
      var links = heads.map(function (h) {
        return button("side-link", h.textContent, function () {
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

    var mats = LIBRARY.filter(function (it) {
      return (it.lessons || []).indexOf(l.id) > -1;
    }).slice(0, 4);
    if (mats.length) {
      inner.appendChild(el("div", "side-k", "Before you start"));
      var mlist = el("div", "side-mats");
      mats.forEach(function (m) {
        var b = button("side-mat", null, function () { go("library"); });
        b.appendChild(el("span", "side-mat-k", m.kind));
        b.appendChild(el("span", "side-mat-t", m.title));
        mlist.appendChild(b);
      });
      inner.appendChild(mlist);
    }

    if (!inner.children.length) return null;
    side.appendChild(inner);
    return side;
  }

  /* The strip that ends every step by naming the next action. */
  function stepFooter(l, steps, i, show) {
    var name = steps[i].name;
    var foot = el("div", "stepfoot");
    var body = el("div", "body");
    var c = testCounts(l);
    var open = notPassing(l);

    if (name === "lesson") {
      body.appendChild(el("b", null, "Next: "));
      body.appendChild(document.createTextNode(
        "write the " + (c.total || "") + " functions. Reading is 20% of this; the exercises are the other 80%."));
    } else if (name === "exercises") {
      if (open.length) {
        body.appendChild(el("b", null, "Next: "));
        body.appendChild(document.createTextNode("get "));
        body.appendChild(el("code", null, open[0].name));
        body.appendChild(document.createTextNode(" green"));
        if (open.length > 1) {
          body.appendChild(document.createTextNode(", then " +
            open.slice(1).map(function (e) { return e.name; }).join(" and ")));
        }
        body.appendChild(document.createTextNode("."));
      } else {
        body.appendChild(el("b", null, "All " + c.total + " pass. "));
        body.appendChild(document.createTextNode(
          "Compare against the walkthrough, then close out."));
      }
    } else if (name === "walkthrough") {
      body.appendChild(el("b", null, "Next: "));
      body.appendChild(document.createTextNode("answer the closing questions without looking anything up."));
    } else {
      body.appendChild(el("b", null, isComplete(l) ? "Lesson complete. " : "Almost there. "));
      body.appendChild(document.createTextNode(completionIsDerived(l)
        ? "Completion here follows the test runner."
        : "No test results found, so this one is yours to mark."));
    }
    foot.appendChild(body);

    if (i + 1 < steps.length) {
      var next = steps[i + 1];
      var label = next.name === "walkthrough" ? "I'm stuck — compare →"
        : next.name === "exercises" ? "Go to the exercises →"
        : next.label + " →";
      foot.appendChild(button("btn-primary", label, function () { show(i + 1); }));
    }
    return foot;
  }

  function walkthroughGate(l, openAnyway, backToExercises) {
    var open = notPassing(l);
    var c = testCounts(l);

    var box = el("div", "gate");
    box.appendChild(el("div", "step-kicker", "Step 3 · compare"));
    box.appendChild(el("h2", "step-h2", !c.run
      ? "You have not run the tests yet."
      : open.length === 1 ? "One exercise is still open."
      : open.length + " exercises are still open."));

    var p1 = el("p");
    p1.appendChild(document.createTextNode("The walkthrough explains how each solution works, with the code. "));
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
    row.appendChild(button("btn-primary", "Back to the exercises", backToExercises));
    row.appendChild(button("btn-quiet", "Open it anyway", openAnyway));
    box.appendChild(row);
    box.appendChild(el("p", "gate-foot",
      "This gate disappears once every exercise passes."));
    return box;
  }

  /* Closing questions become tickable. Ticking one is a claim about you, not
     about the code, so it is stored here and never mixed with test results. */
  function wireQuestions(l, panel) {
    var list = panel.querySelector("ol.checkq");
    if (!list) return;
    var mine = answered[l.id] || (answered[l.id] = {});
    [].slice.call(list.children).forEach(function (li, i) {
      var text = li.textContent;
      li.textContent = "";
      var b = button(null, null, function () {
        mine[i] = !mine[i];
        try { localStorage.setItem(ANSWERED_KEY, JSON.stringify(answered)); } catch (e) {}
        li.classList.toggle("on", !!mine[i]);
        b.setAttribute("aria-pressed", mine[i] ? "true" : "false");
        mark.textContent = mine[i] ? "✓" : "";
      });
      var mark = el("span", "qmark", mine[i] ? "✓" : "");
      mark.setAttribute("aria-hidden", "true");
      b.appendChild(mark);
      b.appendChild(el("span", null, text));
      b.setAttribute("aria-pressed", mine[i] ? "true" : "false");
      li.classList.toggle("on", !!mine[i]);
      li.appendChild(b);
    });
  }

  function completionStrip(l) {
    var strip = el("div", "completion");
    var c = testCounts(l);
    var body = el("div", "body");
    if (isComplete(l)) {
      body.appendChild(el("b", null, "Lesson complete."));
      body.appendChild(document.createTextNode(completionIsDerived(l)
        ? " All " + c.total + " tests pass."
        : " Marked by hand — the tests show " + c.passed + " of " + c.total + "."));
    } else {
      body.appendChild(el("b", null, c.run
        ? c.passed + " of " + c.total + " tests passing."
        : "The tests have not been run."));
      body.appendChild(document.createTextNode(
        " Completion follows the tests — it will tick itself when they are green. " +
        "You can override it, and the override says so."));
    }
    strip.appendChild(body);
    var b = button("btn-mark" + (done[l.id] ? " on" : ""),
      done[l.id] ? "Remove hand tick" : "Mark complete by hand",
      function () { toggleDone(l.id); });
    strip.appendChild(b);
    return strip;
  }

  function buildLesson(l) {
    var root = el("div", "lesson");

    var head = el("div", "lesson-head");
    var crumbs = el("div", "crumbs");
    crumbs.appendChild(button("crumb", "Path", function () { go("path"); }));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    crumbs.appendChild(button("crumb", "Phase " + l.phase.number + " · " + l.phase.title,
      function () { goPhase(l.phase.id); }));
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
      var ph = el("div", "placeholder");
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

      if (step.name === "walkthrough" && gateWalkthrough(l)) {
        panel.appendChild(walkthroughGate(l, function () {
          unlockedWalkthrough[l.id] = true;
          render();
        }, function () {
          var at = 0;
          steps.forEach(function (st, n) { if (st.name === "exercises") at = n; });
          show(at);
        }));
      } else {
        if (step.name !== "lesson") {
          var sh = el("div", "step-head");
          var meta = el("div");
          meta.appendChild(el("div", "step-kicker",
            "Step " + (i + 1) + " · " + (step.name === "exercises" ? "in your repo" : step.label.toLowerCase())));
          meta.appendChild(el("h2", "step-h2", stepHeadline(l, step.name)));
          sh.appendChild(meta);
          if (step.name === "exercises") {
            sh.appendChild(commandChip("progress " + l.id, "cmdchip plain"));
          }
          panel.appendChild(sh);
        }
        if (tpl) panel.appendChild(tpl.content.cloneNode(true));
        if (step.name === "closeout") {
          wireQuestions(l, panel);
          panel.appendChild(completionStrip(l));
        }
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

    /* the generated exercise rows land inside the Implement step */
    var mount = panels.querySelector("[data-exercise-rows]");
    if (mount) mount.appendChild(exerciseBlock(l));

    highlight(panels);
    if (typeof Widgets !== "undefined") Widgets.mount(panels);

    var live = entries[activeTab[l.id]];
    /* The gate is the whole step. A "next" button under it would be a way
       around the thing the gate exists to slow down. */
    var gated = live.step.name === "walkthrough" && gateWalkthrough(l);
    if (!gated) live.panel.appendChild(stepFooter(l, steps, activeTab[l.id], show));

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

    var pool = writtenLessons();
    var idx = pool.indexOf(l);
    var foot = el("div", "lesson-foot");
    if (idx > 0) {
      var pv = pool[idx - 1];
      foot.appendChild(button("linkbtn", "← " + pv.id + " " + pv.title, function () { goLesson(pv.id); }));
    } else {
      foot.appendChild(el("span", null, "← first lesson"));
    }
    if (idx > -1 && idx + 1 < pool.length) {
      var nx = pool[idx + 1];
      foot.appendChild(button("linkbtn", "Next: " + nx.id + " " + nx.title + " →", function () { goLesson(nx.id); }));
    } else {
      var after = nextPlanned(l);
      foot.appendChild(el("span", null, after
        ? "next: " + after.id + " " + after.title + " · not written yet →"
        : "last written lesson →"));
    }
    inner.appendChild(foot);
    return root;
  }

  function stepHeadline(l, name) {
    var c = testCounts(l);
    if (name === "exercises") {
      return c.total + (c.total === 1 ? " function. " : " functions. ") +
        (!c.run ? "None run yet." : c.passed === c.total ? "All passing." : c.passed + " passing.");
    }
    if (name === "walkthrough") return "What each exercise is really asking";
    return "You are done when you can answer these without looking anything up";
  }

  function nextPlanned(l) {
    var at = allLessons.indexOf(l);
    return at > -1 && at + 1 < allLessons.length ? allLessons[at + 1] : null;
  }

  function exerciseBlock(l) {
    var box = el("div", "exercise-block");
    if (!lessonTests(l.id)) {
      box.appendChild(el("p", "exnote",
        "Run the command above to see which of these pass. Until you do, every row " +
        "reads as todo — this page never invents a result."));
    }
    var list = el("div", "exrows");
    (l.exercises || []).forEach(function (e) { list.appendChild(exerciseRow(l, e, false)); });
    box.appendChild(list);

    var note = el("div", "notebox");
    note.appendChild(el("span", "notebox-k", "The constraints are the lesson"));
    var p = el("p");
    p.appendChild(document.createTextNode(
      "The tests inspect your source, not just your return value. Where a row says "));
    p.appendChild(el("code", null, "no numpy"));
    p.appendChild(document.createTextNode(
      ", you are meant to build the mechanism before you are allowed to call it. Where it says "));
    p.appendChild(el("code", null, "no loops"));
    p.appendChild(document.createTextNode(
      ", a Python loop over a NumPy array costs roughly 200× in speed."));
    note.appendChild(p);
    box.appendChild(note);
    return box;
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
      pane.appendChild(l ? buildLesson(l) : buildOverview());
    } else if (view.kind === "path") {
      pane.appendChild(buildPath());
    } else if (view.kind === "phase") {
      var ph = phaseById(view.id);
      pane.appendChild(ph ? buildPhase(ph) : buildPath());
    } else if (view.kind === "practice") {
      pane.appendChild(buildPractice());
    } else if (view.kind === "library") {
      pane.appendChild(buildLibrary());
    } else if (view.kind === "setup") {
      pane.appendChild(buildSetup());
    } else {
      pane.appendChild(buildOverview());
    }

    var totals = testTotals();
    if (totals && totals.total) {
      document.getElementById("stat-count").textContent =
        totals.passed + " / " + totals.total + " tests";
      document.getElementById("stat-bar").style.width = (totals.passed / totals.total * 100) + "%";
    } else {
      var n = writtenLessons().filter(isComplete).length;
      document.getElementById("stat-count").textContent = n + " / " + TOTAL + " lessons";
      document.getElementById("stat-bar").style.width = (n / TOTAL * 100) + "%";
    }
    buildRail();

    if (window.matchMedia("(max-width: 940px)").matches) {
      rail.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  /* ---------- navigation chrome ---------- */
  var rail = document.getElementById("rail");
  var toggle = document.getElementById("railtoggle");

  document.getElementById("brand").addEventListener("click", goOverview);
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

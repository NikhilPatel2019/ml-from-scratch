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
  var TAB_LABELS = {
    overview: "Overview",
    lesson: "Lesson",
    exercises: "Exercises",
    walkthrough: "Walkthrough",
    resources: "Resources"
  };

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

  /* ---------- rail ---------- */
  var railNav = document.getElementById("rail-nav");
  var railAreas = document.getElementById("rail-areas");

  /* Four doors instead of one. Everything used to hang off whichever lesson you
     happened to be in, so a resource spanning four lessons had nowhere to live. */
  var AREAS = [
    { kind: "continue", label: "Continue", meta: function () { return ""; } },
    { kind: "path", label: "Path", meta: function () { return String(TOTAL); } },
    { kind: "practice", label: "Practice", meta: function () { return String(allExercises().length); } },
    { kind: "library", label: "Library", meta: function () { return String(LIBRARY.length); } }
  ];

  function buildAreas() {
    railAreas.textContent = "";
    AREAS.forEach(function (a) {
      var active = view.kind === a.kind ||
                   (a.kind === "continue" && view.kind === "setup") ||
                   (a.kind === "path" && (view.kind === "phase" || view.kind === "lesson"));
      var b = button("area" + (active ? " current" : ""), null, function () { go(a.kind); });
      b.setAttribute("aria-current", active ? "page" : "false");
      b.appendChild(el("span", "area-label", a.label));
      var m = a.meta();
      if (m) b.appendChild(el("span", "area-meta", m));
      railAreas.appendChild(b);
    });
  }

  function buildRail() {
    buildAreas();
    railNav.textContent = "";

    /* Two zones. Everything in the first opens real content; the second is a
       phase-level summary with nothing clickable, because there is nothing
       behind it yet. Written-ness comes from build.py reading the disk, so
       adding site/src/lessons/1.2/ moves 1.2 across on the next build with no
       other edit. */
    var written = allLessons.filter(function (l) { return l.written; });
    var planned = allLessons.length - written.length;

    railNav.appendChild(zoneHead("Available now", String(written.length)));

    if (written.length) {
      var list = el("ul", "lesson-list");
      written.forEach(function (l) {
        var row = el("li", "lesson-row" +
          (view.kind === "lesson" && view.id === l.id ? " current" : "") +
          (isComplete(l) ? " is-done" : ""));

        var box = el("input", "tickbox");
        box.type = "checkbox";
        box.checked = isComplete(l);
        box.disabled = completionIsDerived(l);
        box.title = box.disabled
          ? "Set by the test runner"
          : "Mark lesson " + l.id + " complete by hand";
        box.setAttribute("aria-label", box.title);
        box.addEventListener("change", function () { toggleDone(l.id); });
        row.appendChild(box);

        var link = button("lesson-link", null, function () { goLesson(l.id); });
        link.appendChild(el("span", "lid", l.id));
        link.appendChild(el("span", "ltitle", l.title));
        row.appendChild(link);

        list.appendChild(row);
      });
      railNav.appendChild(list);
    } else {
      railNav.appendChild(el("div", "rail-empty", "Nothing written yet."));
    }

    if (!planned) return;

    railNav.appendChild(zoneHead("Ahead", planned + " planned"));
    phases.forEach(function (p) {
      var count = p.lessons.filter(function (l) { return !l.written; }).length;
      if (!count) return;
      var row = el("div", "ahead-row");
      row.title = "Milestone: " + p.milestone;
      var top = el("div", "ahead-top");
      top.appendChild(el("span", "ahead-num", String(p.number)));
      top.appendChild(el("span", "ahead-title", p.title));
      top.appendChild(el("span", "ahead-count", String(count)));
      row.appendChild(top);
      row.appendChild(el("div", "ahead-sub", p.subtitle));
      railNav.appendChild(row);
    });
  }

  function zoneHead(label, meta) {
    var h = el("div", "rail-zone");
    h.appendChild(el("span", "eyebrow", label));
    h.appendChild(el("span", "eyebrow", meta));
    return h;
  }

  /* The ruler moved off the landing page: a 55-tick chart of the whole
     curriculum belongs where the curriculum is the subject. `only` limits it to
     one phase for a phase page. */
  function rulerCard(only) {
    var shown = only ? [only] : phases;
    /* the ruler */
    var card = el("div", "ruler-card");
    var top = el("div", "ruler-top");
    var big = el("div", "bignum");
    big.appendChild(document.createTextNode(totalDone() + " "));
    big.appendChild(el("span", null, "/ " + TOTAL + " lessons complete"));
    top.appendChild(big);
    top.appendChild(el("div", "eyebrow", "phases 1–5, drawn to scale"));
    card.appendChild(top);

    var ruler = el("div", "ruler");
    shown.forEach(function (p) {
      var g = el("div", "rgroup");
      g.style.flex = p.lessons.length + " 1 0";
      var ticks = el("div", "ticks");
      p.lessons.forEach(function (l) {
        var t = el("span", "tick");
        t.setAttribute("data-state", isComplete(l) ? "done" : (l.written ? "ready" : "planned"));
        t.title = l.id + " — " + l.title;
        ticks.appendChild(t);
      });
      g.appendChild(ticks);
      var lab = el("div", "rlabel", String(p.number));
      lab.title = "Phase " + p.number + " · " + p.title + " (" + p.lessons.length + " lessons)";
      g.appendChild(lab);
      ruler.appendChild(g);
    });
    card.appendChild(ruler);

    var legend = el("div", "legend");
    [["complete", "var(--done)"], ["written and ready", "var(--accent)"], ["still to be written", "var(--rule)"]]
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

  /* ---------- continue (landing) ---------- */
  /* ---------- continue: the one thing to do next ----------
     This page used to explain the curriculum three times at three levels of
     zoom, with "how this works" sitting permanently between the reader and the
     only thing they came for. That material moved to Setup, which is one click
     away and never in the way twice. */

  function copyButton(text, target) {
    var b = button("copybtn", "copy", function () {
      var reset = function () { b.textContent = "copy"; b.classList.remove("ok", "warn"); };

      /* Clipboard access needs a secure context and a real user gesture, and can
         still be refused by embedder policy. When it is, select the command so
         Ctrl+C works — a fallback that only changes a label helps nobody. */
      var fallback = function () {
        b.textContent = "press Ctrl+C";
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

  function buildOverview() {
    var wrap = el("div", "wrap");
    var next = nextLesson();

    if (!next) {
      var doneHero = el("div", "hero");
      doneHero.appendChild(el("div", "eyebrow", "nothing outstanding"));
      doneHero.appendChild(el("h1", null, "You are up to date."));
      doneHero.appendChild(el("p", "lede",
        "Everything written so far is complete. The rest of the curriculum is on Path."));
      wrap.appendChild(doneHero);
      wrap.appendChild(smallCards(null));
      wrap.appendChild(setupFooter());
      return wrap;
    }

    var lt = lessonTests(next.id);
    var red = [];
    var remaining = 0;
    if (lt) {
      lt.exercises.forEach(function (e) {
        if (e.status === "pass") return;
        remaining++;
        if (e.status === "fail") red.push(e.name);
      });
    }

    /* The headline is the state, not a slogan. */
    var hero = el("div", "hero");
    hero.appendChild(el("div", "eyebrow",
      "continue · phase " + next.phase.number + " · lesson " + next.id));
    if (lt && remaining) {
      hero.appendChild(el("h1", null,
        remaining + (remaining === 1 ? " exercise left in " : " exercises left in ") + next.id + "."));
    } else if (lt) {
      hero.appendChild(el("h1", null, next.id + " is passing. Close it out."));
    } else {
      hero.appendChild(el("h1", null, next.title + "."));
    }
    hero.appendChild(el("p", "lede", next.summary));
    wrap.appendChild(hero);

    /* the one card that matters */
    var card = el("div", "continue-card");

    var tabIdx = activeTab[next.id] || 0;
    var names = SECTIONS[next.id] || [];
    var where = names.length ? (TAB_LABELS[names[tabIdx]] || names[tabIdx]) : null;
    var resumed = activeTab[next.id] != null;

    var top = el("div", "continue-top");
    var info = el("div");
    info.appendChild(el("div", "continue-title", next.title));
    info.appendChild(el("div", "continue-where",
      where ? (resumed ? "you left off in " + where : "start with the " + where) : "open the lesson"));
    top.appendChild(info);
    top.appendChild(button("btn", where ? (resumed ? "Resume " + where : "Open " + where) : "Open lesson",
      function () { goLesson(next.id); }));
    card.appendChild(top);

    if (lt) {
      var stat = el("div", "continue-stat");
      var bar = el("div", "cbar");
      var fill = el("i");
      fill.style.width = (lt.tests_total ? lt.tests_passed / lt.tests_total * 100 : 0) + "%";
      bar.appendChild(fill);
      stat.appendChild(bar);
      stat.appendChild(el("span", "cstat-num", lt.tests_passed + " / " + lt.tests_total + " tests passing"));
      card.appendChild(stat);

      if (red.length) {
        var redrow = el("div", "continue-red");
        redrow.appendChild(el("span", "eyebrow", "still red"));
        var names2 = el("div", "redlist");
        red.forEach(function (n) { names2.appendChild(el("code", "redname", n)); });
        redrow.appendChild(names2);
        card.appendChild(redrow);
      }
    } else {
      var hint = el("div", "continue-hint");
      hint.appendChild(document.createTextNode(
        "Run this in the repository to see which exercises pass. Nothing here is guessed."));
      card.appendChild(hint);
    }

    card.appendChild(commandRow("progress " + next.id));
    wrap.appendChild(card);

    wrap.appendChild(smallCards(next));
    wrap.appendChild(setupFooter());
    return wrap;
  }

  /* Two small cards, and nothing else. */
  function smallCards(next) {
    var row = el("div", "smallcards");

    var a = button("scard", null, function () { go("path"); });
    a.appendChild(el("div", "eyebrow", "where you are"));
    var totals = testTotals();
    var doneCount = writtenLessons().filter(isComplete).length;
    a.appendChild(el("div", "scard-line", totals && totals.total
      ? totals.passed + " of " + totals.total + " tests passing"
      : doneCount + " of " + writtenLessons().length + " written lessons complete"));
    var ph = next ? next.phase : phases[0];
    a.appendChild(el("p", "scard-sub", "Phase " + ph.number + " · " + ph.milestone));
    row.appendChild(a);

    var b = button("scard", null, function () { go("library"); });
    b.appendChild(el("div", "eyebrow", next ? "library, for " + next.id : "in your library"));
    var picked = LIBRARY.filter(function (it) {
      return next && (it.lessons || []).indexOf(next.id) > -1;
    });
    if (picked.length < 3) {
      LIBRARY.forEach(function (it) {
        if (picked.length < 3 && picked.indexOf(it) < 0) picked.push(it);
      });
    }
    picked.slice(0, 3).forEach(function (it) {
      b.appendChild(el("div", "scard-item", it.title));
    });
    b.appendChild(el("p", "scard-sub", LIBRARY.length + " items in all"));
    row.appendChild(b);

    return row;
  }

  function setupFooter() {
    var foot = el("div", "foot");
    foot.appendChild(el("span", null, "First time here, or on a new machine?"));
    foot.appendChild(button("linkbtn", "Setup and how this works", function () { go("setup"); }));
    return foot;
  }

  /* ---------- setup: read once, then out of the way ---------- */
  function buildSetup() {
    var wrap = el("div", "wrap");
    var hero = el("div", "hero");
    hero.appendChild(el("div", "eyebrow", "read this once"));
    hero.appendChild(el("h1", null, "How this works, and where the code lives"));
    hero.appendChild(el("p", "lede",
      "This page is the curriculum and your progress. The code lives in a repository " +
      "on your machine, because writing it is the part that actually teaches you."));
    wrap.appendChild(hero);

    var steps = el("div", "steps");
    [
      ["01", "Read the lesson here",
        "Each lesson explains the idea from nothing, with the maths introduced only at the moment it becomes necessary. The diagrams and demos are there to be poked at, not admired."],
      ["02", "Write the code in the repo",
        "Every lesson ships function stubs and a test suite. You implement the stubs. Nobody hands you the answer — recognising correct code is a different skill from producing it, and only one of them transfers."],
      ["03", "Run the tests",
        "progress 1.1 tells you exactly which exercises pass. Some tests check how you solved it, rejecting NumPy where you should be building the mechanism, and rejecting loops where you should be thinking in arrays."],
      ["04", "Let the runner report it",
        "progress --json writes the results next to this page, and the site reads them. Nothing here is self-reported unless the runner has said nothing, and then it says so."]
    ].forEach(function (row) {
      var st = el("div", "step");
      st.appendChild(el("div", "step-n", row[0]));
      var bd = el("div");
      bd.appendChild(el("h3", null, row[1]));
      bd.appendChild(el("p", null, row[2]));
      st.appendChild(bd);
      steps.appendChild(st);
    });
    wrap.appendChild(steps);

    var sec = el("div", "section");
    sec.appendChild(el("h2", null, "Getting set up"));
    sec.appendChild(el("p", "sub",
      "In-browser Python is deliberately not offered. You learn the toolchain by using it — " +
      "a real virtual environment, a real test runner, a real terminal."));
    [
      "git clone git@github.com:NikhilPatel2019/ml-from-scratch.git",
      "python -m venv .venv",
      "pip install -e \".[dev]\"",
      "progress",
      "progress --json"
    ].forEach(function (c) { sec.appendChild(commandRow(c)); });
    wrap.appendChild(sec);

    var foot = el("div", "foot");
    foot.appendChild(button("linkbtn", "← Back to Continue", function () { go("continue"); }));
    foot.appendChild(button("linkbtn", "Clear my progress", function () {
      if (window.confirm("Clear ticked lessons and any pasted results on this device?")) {
        done = {};
        saveDone();
        try { localStorage.removeItem(PROG_KEY); } catch (e) {}
        progressData = null;
        render();
      }
    }));
    wrap.appendChild(foot);
    return wrap;
  }

  /* ---------- path: the shape of the whole thing ---------- */
  function buildPath() {
    var wrap = el("div", "wrap");
    var hero = el("div", "hero");
    hero.appendChild(el("div", "eyebrow", "the whole curriculum"));
    hero.appendChild(el("h1", null, "Five phases, " + TOTAL + " lessons"));
    hero.appendChild(el("p", "lede",
      "Ordered so that each phase assumes exactly what came before it, and nothing more."));
    wrap.appendChild(hero);
    wrap.appendChild(rulerCard());

    var cards = el("div", "phase-cards");
    cards.style.marginTop = "30px";
    phases.forEach(function (ph) {
      var written = ph.lessons.filter(function (l) { return l.written; }).length;
      var c = button("pcard", null, function () { goPhase(ph.id); });
      var head = el("div", "pcard-top");
      head.appendChild(el("span", "phase-num", String(ph.number)));
      head.appendChild(el("h3", null, ph.title));
      c.appendChild(head);
      c.appendChild(el("p", null, ph.blurb));
      var meta = el("div", "meta");
      meta.appendChild(el("span", null, ph.lessons.length + " lessons"));
      if (written) meta.appendChild(el("span", null, written + " written"));
      c.appendChild(meta);
      cards.appendChild(c);
    });
    wrap.appendChild(cards);
    return wrap;
  }

  /* ---------- one phase ---------- */
  function buildPhase(ph) {
    var wrap = el("div", "wrap");
    var head = el("div", "lesson-head");
    var crumbs = el("div", "crumbs");
    crumbs.appendChild(button("crumb", "Path", function () { go("path"); }));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    crumbs.appendChild(el("span", "chip", "Phase " + ph.number));
    head.appendChild(crumbs);
    head.appendChild(el("h1", null, ph.title));
    head.appendChild(el("p", "lede", ph.subtitle));
    wrap.appendChild(head);

    var intro = el("div", "prose");
    intro.appendChild(el("p", null, ph.blurb));
    wrap.appendChild(intro);

    var mile = el("div", "callout");
    mile.appendChild(el("span", "lbl", "Milestone"));
    mile.appendChild(el("p", null, ph.milestone));
    wrap.appendChild(mile);

    var idx = phases.indexOf(ph);
    var assumes = el("div", "assumes");
    assumes.appendChild(el("span", "eyebrow", "assumes"));
    assumes.appendChild(el("p", null, idx === 0
      ? "Nothing. You can program; no maths is taken for granted."
      : "Phase " + phases[idx - 1].number + ": " + phases[idx - 1].milestone));
    wrap.appendChild(assumes);

    wrap.appendChild(rulerCard(ph));

    var sec = el("div", "section");
    sec.appendChild(el("h2", null, "Lessons"));
    var list = el("div", "phase-lessons");
    ph.lessons.forEach(function (l) {
      var row = l.written
        ? button("plesson", null, function () { goLesson(l.id); })
        : el("div", "plesson is-planned");
      var top = el("div", "plesson-top");
      top.appendChild(el("span", "lid", l.id));
      top.appendChild(el("span", "plesson-title", l.title));
      top.appendChild(el("span", "chip " + (l.written ? "ready" : "plan"),
        l.written ? "ready" : "planned"));
      row.appendChild(top);
      row.appendChild(el("p", "plesson-sum", l.summary));
      list.appendChild(row);
    });
    sec.appendChild(list);
    wrap.appendChild(sec);
    return wrap;
  }

  /* ---------- practice: every exercise in one view ---------- */
  var practiceFilter = "all";

  function buildPractice() {
    var wrap = el("div", "wrap");
    var rows = allExercises();
    var totals = testTotals();

    var hero = el("div", "hero");
    hero.appendChild(el("div", "eyebrow",
      rows.length + " exercises across " + writtenLessons().length + " written lessons"));
    hero.appendChild(el("h1", null, "Every exercise, and what the tests say"));
    hero.appendChild(el("p", "lede",
      "The exercises are the work. This is all of them in one place, without having to " +
      "remember which lesson they belong to."));
    wrap.appendChild(hero);

    if (!progressData) {
      var note = el("div", "callout");
      note.appendChild(el("span", "lbl", "No results yet"));
      note.appendChild(el("p", null,
        "Pass and fail come from the test runner, never from this page. Run " +
        "progress --json in the repository and reload; until then every exercise " +
        "below reads as not run."));
      var cmd = el("div", "codeblock");
      cmd.appendChild(el("pre", null, "progress --json"));
      note.appendChild(cmd);
      note.appendChild(pasteBox());
      wrap.appendChild(note);
    } else {
      var bar = el("div", "nextup");
      var b = el("div", "body");
      b.appendChild(el("div", "t", totals.passed + " of " + totals.total + " tests passing"));
      b.appendChild(el("div", "s", "From the runner at " +
        String(progressData.generated || "").replace("T", " ").replace("+00:00", " UTC")));
      bar.appendChild(b);
      bar.appendChild(button("btn ghost", "Forget results", function () {
        try { localStorage.removeItem(PROG_KEY); } catch (e) {}
        progressData = null;
        render();
      }));
      wrap.appendChild(bar);

      var ctrls = el("div", "ctrls");
      ctrls.style.marginTop = "20px";
      [["all", "all"], ["fail", "failing"], ["not_run", "not run"], ["pass", "passing"]]
        .forEach(function (f) {
          ctrls.appendChild(button("pill" + (practiceFilter === f[0] ? " on" : ""), f[1],
            function () { practiceFilter = f[0]; render(); }));
        });
      wrap.appendChild(ctrls);
    }

    var shown = 0;
    writtenLessons().forEach(function (l) {
      if (!l.exercises || !l.exercises.length) return;

      var visible = l.exercises.filter(function (e) {
        if (practiceFilter === "all" || !progressData) return true;
        var r = exerciseResult(l.id, e.name);
        return (r ? r.status : "not_run") === practiceFilter;
      });
      if (!visible.length) return;
      shown += visible.length;

      var sec = el("div", "section");
      var h = el("div", "practice-head");
      h.appendChild(el("span", "lid", l.id));
      h.appendChild(button("practice-lesson", l.title, function () { goLesson(l.id); }));
      var lt = lessonTests(l.id);
      h.appendChild(el("span", "practice-count", lt
        ? lt.tests_passed + "/" + lt.tests_total + " passing"
        : l.exercises.length + " exercises"));
      sec.appendChild(h);

      var list = el("div", "exrows");
      visible.forEach(function (e) {
        var r = exerciseResult(l.id, e.name);
        var status = r ? r.status : "not_run";
        var row = el("div", "exrow" + (e.optional ? " is-optional" : ""));
        var mark = el("span", "exmark");
        mark.setAttribute("data-status", status);
        row.appendChild(mark);

        var body = el("div", "exbody");
        body.appendChild(el("div", "exname", e.name));
        body.appendChild(el("div", "exsum", e.summary));
        if (r && r.message) body.appendChild(el("div", "exmsg", r.message));
        row.appendChild(body);

        row.appendChild(el("span", "exstat is-" + status,
          status === "pass" ? "pass" : status === "fail" ? "fail" : "not run"));
        list.appendChild(row);
      });
      sec.appendChild(list);
      wrap.appendChild(sec);
    });

    if (!shown && progressData) {
      wrap.appendChild(el("div", "rail-empty", "Nothing matches that filter."));
    }
    return wrap;
  }

  /* ---------- library ---------- */
  var libKind = "all";

  function buildLibrary() {
    var wrap = el("div", "wrap");
    var hero = el("div", "hero");
    hero.appendChild(el("div", "eyebrow", LIBRARY.length + " items"));
    hero.appendChild(el("h1", null, "Everything you have collected"));
    hero.appendChild(el("p", "lede",
      "Every resource the curriculum cites, browsable on its own. Six months in, the " +
      "question is where did I read that, not which lesson cited it."));
    wrap.appendChild(hero);

    var kinds = ["all"];
    LIBRARY.forEach(function (it) { if (kinds.indexOf(it.kind) < 0) kinds.push(it.kind); });
    var ctrls = el("div", "ctrls");
    ctrls.style.marginTop = "22px";
    kinds.forEach(function (k) {
      ctrls.appendChild(button("pill" + (libKind === k ? " on" : ""), k, function () {
        libKind = k;
        render();
      }));
    });
    wrap.appendChild(ctrls);

    var list = el("div", "libitems");
    LIBRARY.filter(function (it) { return libKind === "all" || it.kind === libKind; })
      .forEach(function (it) {
        var row = el("div", "libitem");
        var top = el("div", "libtop");
        top.appendChild(el("span", "chip", it.kind));
        var a = el("a", "libtitle", it.title);
        a.href = it.url;
        a.target = "_blank";
        a.rel = "noopener";
        top.appendChild(a);
        row.appendChild(top);

        var tags = el("div", "libtags");
        (it.lessons || []).forEach(function (lid) {
          var l = lessonById(lid);
          if (!l) return;
          tags.appendChild(l.written
            ? button("libtag is-link", lid + " " + l.title, function () { goLesson(lid); })
            : el("span", "libtag", lid + " " + l.title));
        });
        (it.phases || []).forEach(function (n) {
          var ph = phases.filter(function (x) { return x.number === n; })[0];
          if (ph) tags.appendChild(button("libtag", "Phase " + n, function () { goPhase(ph.id); }));
        });
        if (tags.children.length) row.appendChild(tags);
        list.appendChild(row);
      });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- lesson ---------- */
  function buildLesson(l) {
    var wrap = el("div", "wrap");

    var head = el("div", "lesson-head");
    var crumbs = el("div", "crumbs");
    crumbs.appendChild(button("crumb", "Path", function () { go("path"); }));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    crumbs.appendChild(button("crumb", "Phase " + l.phase.number + " · " + l.phase.title,
      function () { goPhase(l.phase.id); }));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    if (done[l.id]) crumbs.appendChild(el("span", "chip done", "Complete"));
    else if (l.status === "available") crumbs.appendChild(el("span", "chip ready", "Ready"));
    else crumbs.appendChild(el("span", "chip plan", "Not written yet"));
    head.appendChild(crumbs);
    head.appendChild(el("h1", null, l.id + " — " + l.title));
    head.appendChild(el("p", "lede", l.summary));
    wrap.appendChild(head);

    var names = SECTIONS[l.id] || [];
    if (names.length) {
      if (activeTab[l.id] == null || activeTab[l.id] >= names.length) activeTab[l.id] = 0;

      var tabbar = el("div", "tabs");
      tabbar.setAttribute("role", "tablist");
      var panels = el("div", "panels");
      var entries = [];

      var slug = l.id.replace(/\./g, "-");

      names.forEach(function (name, i) {
        var tpl = document.getElementById("lesson-" + l.id + "-" + name);
        if (!tpl) return;

        var tabId = "tab-" + slug + "-" + name;
        var panelId = "panel-" + slug + "-" + name;

        var panel = el("section", "panel");
        panel.id = panelId;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tabId);
        /* A scrollable panel needs to be focusable, or keyboard users can tab
           to the tablist and then have no way to scroll the content. */
        panel.tabIndex = 0;
        panel.appendChild(tpl.content.cloneNode(true));
        panel.hidden = i !== activeTab[l.id];
        panels.appendChild(panel);

        var tb = button("tab", TAB_LABELS[name] || name, function () { show(i); });
        tb.id = tabId;
        tb.setAttribute("role", "tab");
        tb.setAttribute("aria-controls", panelId);
        tb.setAttribute("aria-selected", i === activeTab[l.id] ? "true" : "false");
        /* Roving tabindex: one stop for the whole tablist, arrows move within it. */
        tb.tabIndex = i === activeTab[l.id] ? 0 : -1;
        tb.addEventListener("keydown", function (evt) {
          var delta = { ArrowRight: 1, ArrowLeft: -1 }[evt.key];
          var target = null;
          if (delta != null) target = (i + delta + entries.length) % entries.length;
          else if (evt.key === "Home") target = 0;
          else if (evt.key === "End") target = entries.length - 1;
          if (target == null) return;
          evt.preventDefault();
          show(target);
          entries[target].btn.focus();
        });
        tabbar.appendChild(tb);
        entries.push({ btn: tb, panel: panel });
      });

      /* Switching tabs only toggles visibility — no re-render, so the vector lab
         keeps whatever position you dragged it to. */
      function show(i) {
        activeTab[l.id] = i;
        entries.forEach(function (e, j) {
          e.panel.hidden = j !== i;
          e.btn.classList.toggle("on", j === i);
          e.btn.setAttribute("aria-selected", j === i ? "true" : "false");
          e.btn.tabIndex = j === i ? 0 : -1;
        });
        saveView();
        wrap.scrollIntoView({ block: "start" });
        buildToc(entries[i].panel);
      }
      entries.forEach(function (e, j) { e.btn.classList.toggle("on", j === activeTab[l.id]); });

      wrap.appendChild(tabbar);
      wrap.appendChild(panels);
      highlight(panels);
      if (typeof Widgets !== "undefined") Widgets.mount(panels);

      var mark = el("div", "nextup");
      mark.style.marginTop = "44px";
      var mb = el("div", "body");
      mb.appendChild(el("div", "t", done[l.id] ? "Marked complete" : "Finished this lesson?"));
      mb.appendChild(el("div", "s", done[l.id]
        ? "You can untick it in the curriculum rail if you want another pass."
        : "Tick it off once the tests pass and you can answer the questions above without looking them up."));
      mark.appendChild(mb);
      mark.appendChild(button("btn", done[l.id] ? "Mark as not done" : "Mark complete",
        function () { toggleDone(l.id); }));
      wrap.appendChild(mark);
    } else {
      var ph = el("div", "placeholder");
      ph.appendChild(el("div", "eyebrow", "Not written yet"));
      ph.appendChild(el("h3", null, "This lesson is planned, not published."));
      ph.appendChild(el("p", null,
        "Lessons are written one at a time, in order, so that each one can assume exactly what came " +
        "before it. Writing all fifty-five up front would produce a worse curriculum than writing each " +
        "in response to how the previous one actually went."));
      ph.appendChild(el("p", null,
        "When it exists, it will cover: " + l.summary.charAt(0).toLowerCase() + l.summary.slice(1)));
      wrap.appendChild(ph);

      var mile = el("div", "callout");
      mile.style.marginTop = "24px";
      mile.appendChild(el("span", "lbl", "Phase " + l.phase.number + " milestone"));
      mile.appendChild(el("p", null, l.phase.milestone));
      wrap.appendChild(mile);
    }

    var pool = writtenLessons();
    var idx = pool.indexOf(l);
    var foot = el("div", "foot");
    foot.appendChild(button("linkbtn", "← Overview", goOverview));
    if (idx > 0) {
      var pv = pool[idx - 1];
      foot.appendChild(button("linkbtn", "← " + pv.id + " " + pv.title, function () { goLesson(pv.id); }));
    }
    if (idx > -1 && idx + 1 < pool.length) {
      var nx = pool[idx + 1];
      foot.appendChild(button("linkbtn", "Next: " + nx.id + " " + nx.title + " →", function () { goLesson(nx.id); }));
    }
    wrap.appendChild(foot);

    return wrap;
  }

  /* ---------- on-this-page rail ----------
     Built from whatever is currently visible, so it follows the active tab
     rather than listing the whole lesson. */
  var tocCleanup = null;

  function buildToc(scope) {
    var toc = document.getElementById("toc");
    if (tocCleanup) { tocCleanup(); tocCleanup = null; }
    toc.textContent = "";

    var heads = [].slice.call(scope.querySelectorAll("h2"));
    if (heads.length < 2) { toc.hidden = true; return; }

    var head = el("div", "toc-head");
    head.appendChild(el("span", "eyebrow", "On this page"));
    toc.appendChild(head);

    var list = el("div", "toc-list");
    var links = heads.map(function (h) {
      var link = button("toc-link", h.textContent, function () {
        h.scrollIntoView({ block: "start", behavior: "smooth" });
      });
      list.appendChild(link);
      return link;
    });
    toc.appendChild(list);
    toc.hidden = false;

    /* Highlight whichever heading you have most recently scrolled past. */
    var ticking = false;
    function sync() {
      ticking = false;
      var line = 140, best = 0;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= line) best = i;
      }
      links.forEach(function (a, i) { a.classList.toggle("on", i === best); });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    tocCleanup = function () { window.removeEventListener("scroll", onScroll); };
    sync();
  }

  /* ---------- render ---------- */
  function render() {
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

    var live = pane.querySelector(".panel:not([hidden])") || pane.querySelector(".wrap");
    if (live) buildToc(live);

    var totals = testTotals();
    var words = document.querySelector(".topstat .words");
    if (totals && totals.total) {
      document.getElementById("stat-count").textContent = totals.passed + "/" + totals.total;
      document.getElementById("stat-bar").style.width = (totals.passed / totals.total * 100) + "%";
      if (words) words.textContent = "tests passing";
    } else {
      var n = writtenLessons().filter(isComplete).length;
      var w = writtenLessons().length || 1;
      document.getElementById("stat-count").textContent = n + "/" + TOTAL;
      document.getElementById("stat-bar").style.width = (n / w * 100) + "%";
      if (words) words.textContent = "lessons complete";
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
  loadProgress();
  render();
})();

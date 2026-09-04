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
  var view = { kind: "overview", id: null };
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
  function phaseDone(p) { return p.lessons.filter(function (l) { return done[l.id]; }).length; }
  function totalDone() { return Object.keys(done).length; }
  function writtenLessons() { return allLessons.filter(function (l) { return l.written; }); }
  function nextLesson() {
    var pool = writtenLessons();
    for (var i = 0; i < pool.length; i++) if (!done[pool[i].id]) return pool[i];
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
        id: view.kind === "lesson" ? view.id : null,
        tab: view.kind === "lesson" ? (activeTab[view.id] || 0) : 0
      }));
    } catch (e) {}
  }

  function restoreView() {
    try {
      var saved = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
      if (!saved || !saved.id) return;
      var lesson = lessonById(saved.id);
      if (!lesson || !lesson.written) return;   // stale id, or no longer written
      view = { kind: "lesson", id: saved.id };
      activeTab[saved.id] = typeof saved.tab === "number" ? saved.tab : 0;
    } catch (e) {}
  }

  function goOverview() { view = { kind: "overview", id: null }; saveView(); render(); window.scrollTo(0, 0); }
  function goLesson(id) { view = { kind: "lesson", id: id }; saveView(); render(); window.scrollTo(0, 0); }
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

  /* ---------- rail ---------- */
  var railNav = document.getElementById("rail-nav");
  var railHome = document.getElementById("rail-home");

  function buildRail() {
    railHome.classList.toggle("current", view.kind === "overview");
    railNav.textContent = "";

    /* Two zones. Everything in the first opens real content; the second is a
       phase-level summary with nothing clickable, because there is nothing
       behind it yet. Written-ness comes from build.py reading the disk, so
       adding site/src/lessons/0.2/ moves 0.2 across on the next build with no
       other edit. */
    var written = allLessons.filter(function (l) { return l.written; });
    var planned = allLessons.length - written.length;

    railNav.appendChild(zoneHead("Available now", String(written.length)));

    if (written.length) {
      var list = el("ul", "lesson-list");
      written.forEach(function (l) {
        var row = el("li", "lesson-row" +
          (view.kind === "lesson" && view.id === l.id ? " current" : "") +
          (done[l.id] ? " is-done" : ""));

        var box = el("input", "tickbox");
        box.type = "checkbox";
        box.checked = !!done[l.id];
        box.setAttribute("aria-label", "Mark lesson " + l.id + " complete");
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

  /* ---------- overview ---------- */
  function buildOverview() {
    var wrap = el("div", "wrap");

    var hero = el("div", "hero");
    hero.appendChild(el("div", "eyebrow", TOTAL + " lessons · 5 phases · no prior maths"));
    hero.appendChild(el("h1", null, "Learn machine learning by building it"));
    hero.appendChild(el("p", "lede",
      "A ground-up curriculum for engineers whose maths is rusty, weak or absent. " +
      "Every idea is built once by hand before you are allowed the library that does it for you."));
    wrap.appendChild(hero);

    /* the ruler */
    var card = el("div", "ruler-card");
    var top = el("div", "ruler-top");
    var big = el("div", "bignum");
    big.appendChild(document.createTextNode(totalDone() + " "));
    big.appendChild(el("span", null, "/ " + TOTAL + " lessons complete"));
    top.appendChild(big);
    top.appendChild(el("div", "eyebrow", "phases 0–4, drawn to scale"));
    card.appendChild(top);

    var ruler = el("div", "ruler");
    phases.forEach(function (p) {
      var g = el("div", "rgroup");
      g.style.flex = p.lessons.length + " 1 0";
      var ticks = el("div", "ticks");
      p.lessons.forEach(function (l) {
        var t = el("span", "tick");
        t.setAttribute("data-state", done[l.id] ? "done" : (l.status === "available" ? "ready" : "planned"));
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
    wrap.appendChild(card);

    var nxt = nextLesson();
    if (nxt) {
      var nu = el("div", "nextup");
      var body = el("div", "body");
      body.appendChild(el("div", "t", "Next up — " + nxt.id + " · " + nxt.title));
      body.appendChild(el("div", "s", nxt.summary));
      nu.appendChild(body);
      nu.appendChild(button("btn", nxt.status === "available" ? "Open lesson" : "Preview",
        function () { goLesson(nxt.id); }));
      wrap.appendChild(nu);
    }

    var s1 = el("div", "section");
    s1.appendChild(el("h2", null, "How this works"));
    s1.appendChild(el("p", "sub",
      "This page is the curriculum and your progress. The code lives in a repository on your machine, " +
      "because writing it is the part that actually teaches you."));
    var steps = el("div", "steps");
    [
      ["01", "Read the lesson here",
        "Each lesson explains the idea from nothing, in plain language, with the maths introduced only at the moment it becomes necessary to explain something. Diagrams and interactive demos are there to be poked at, not admired."],
      ["02", "Write the code in the repo",
        "Every lesson ships function stubs and a test suite. You implement the stubs. Nobody hands you the answer — recognising correct code is a different skill from producing it, and only one of them transfers."],
      ["03", "Run the tests",
        "progress 0.1 tells you exactly which exercises pass. Some tests check how you solved it, rejecting NumPy where you should be building the mechanism, and rejecting loops where you should be thinking in arrays."],
      ["04", "Tick it off",
        "Progress here is self-reported and stored in this browser. Progress in the repo is measured by passing tests, which is the definition worth trusting."]
    ].forEach(function (row) {
      var st = el("div", "step");
      st.appendChild(el("div", "step-n", row[0]));
      var bd = el("div");
      bd.appendChild(el("h3", null, row[1]));
      bd.appendChild(el("p", null, row[2]));
      st.appendChild(bd);
      steps.appendChild(st);
    });
    s1.appendChild(steps);
    wrap.appendChild(s1);

    var s2 = el("div", "section");
    s2.appendChild(el("h2", null, "The five phases"));
    s2.appendChild(el("p", "sub", "Ordered so that each phase assumes exactly what came before it, and nothing more."));
    var cards = el("div", "phase-cards");
    phases.forEach(function (p) {
      var first = p.lessons.filter(function (l) { return l.written; })[0];
      var c = first
        ? button("pcard", null, function () { goLesson(first.id); })
        : el("div", "pcard is-planned");
      var head = el("div", "pcard-top");
      head.appendChild(el("span", "phase-num", String(p.number)));
      head.appendChild(el("h3", null, p.title));
      c.appendChild(head);
      c.appendChild(el("p", null, p.blurb));
      var meta = el("div", "meta");
      meta.appendChild(el("span", null, p.lessons.length + " lessons"));
      meta.appendChild(el("span", null, phaseDone(p) + " complete"));
      c.appendChild(meta);
      cards.appendChild(c);
    });
    s2.appendChild(cards);
    wrap.appendChild(s2);

    var s3 = el("div", "section");
    s3.appendChild(el("h2", null, "Where the code lives"));
    s3.appendChild(el("p", "sub",
      "In-browser Python is deliberately not offered here. You learn the toolchain by using it — a real " +
      "virtual environment, a real test runner, a real terminal."));
    var cb = el("div", "codeblock");
    cb.style.marginTop = "20px";
    cb.appendChild(el("div", "cap", "getting set up"));
    var pre = el("pre");
    var code = el("code");
    code.textContent =
      "python -m venv .venv\n" +
      "pip install -e \".[dev]\"\n\n" +
      "progress        # the dashboard: where you stand\n" +
      "progress 0.1    # run one lesson's tests";
    pre.appendChild(code);
    cb.appendChild(pre);
    s3.appendChild(cb);
    wrap.appendChild(s3);

    var foot = el("div", "foot");
    foot.appendChild(el("span", null,
      "Progress is stored in this browser only — it is not shared, and it does not follow you to another device."));
    foot.appendChild(button("linkbtn", "Clear my progress", function () {
      if (window.confirm("Clear all ticked lessons on this device? This cannot be undone.")) {
        done = {};
        saveDone();
        render();
      }
    }));
    wrap.appendChild(foot);

    return wrap;
  }

  /* ---------- lesson ---------- */
  function buildLesson(l) {
    var wrap = el("div", "wrap");

    var head = el("div", "lesson-head");
    var crumbs = el("div", "crumbs");
    crumbs.appendChild(button("crumb", "Overview", goOverview));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    /* Step 2 gives phases real pages; until then this is a label, not a link
       that quietly lands you somewhere else. */
    crumbs.appendChild(el("span", "crumb-static", "Phase " + l.phase.number + " · " + l.phase.title));
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
    } else {
      pane.appendChild(buildOverview());
    }

    var live = pane.querySelector(".panel:not([hidden])") || pane.querySelector(".wrap");
    if (live) buildToc(live);

    var n = totalDone();
    document.getElementById("stat-count").textContent = n + "/" + TOTAL;
    document.getElementById("stat-bar").style.width = (n / TOTAL * 100) + "%";
    document.getElementById("rail-total").textContent = TOTAL + " lessons";
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
  railHome.addEventListener("click", goOverview);
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
  restoreView();
  render();
})();

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
  var collapsed = {};

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
  function nextLesson() {
    for (var i = 0; i < allLessons.length; i++) {
      if (allLessons[i].status === "available" && !done[allLessons[i].id]) return allLessons[i];
    }
    for (var j = 0; j < allLessons.length; j++) if (!done[allLessons[j].id]) return allLessons[j];
    return null;
  }
  function goOverview() { view = { kind: "overview", id: null }; render(); window.scrollTo(0, 0); }
  function goLesson(id) { view = { kind: "lesson", id: id }; render(); window.scrollTo(0, 0); }
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

    phases.forEach(function (p) {
      var block = el("div", "phase-block" + (collapsed[p.id] ? " collapsed" : ""));

      var btn = button("phase-btn", null, function () {
        collapsed[p.id] = !collapsed[p.id];
        buildRail();
      });
      btn.setAttribute("aria-expanded", collapsed[p.id] ? "false" : "true");
      btn.appendChild(el("span", "chev"));
      btn.appendChild(el("span", "phase-num", String(p.number)));
      btn.appendChild(el("span", "phase-name", p.title));
      btn.appendChild(el("span", "phase-count", phaseDone(p) + "/" + p.lessons.length));
      block.appendChild(btn);

      var prog = el("div", "phase-progress");
      var fill = el("i");
      fill.style.width = (p.lessons.length ? phaseDone(p) / p.lessons.length * 100 : 0) + "%";
      prog.appendChild(fill);
      block.appendChild(prog);

      var list = el("ul", "lesson-list");
      p.lessons.forEach(function (l) {
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
        if (l.status === "available") link.appendChild(el("span", "dot-ready"));
        row.appendChild(link);

        list.appendChild(row);
      });
      block.appendChild(list);
      railNav.appendChild(block);
    });
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
      var c = button("pcard", null, function () {
        collapsed[p.id] = false;
        goLesson(p.lessons[0].id);
      });
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
    crumbs.appendChild(button("crumb", "Phase " + l.phase.number + " · " + l.phase.title, function () {
      collapsed[l.phase.id] = false;
      goLesson(l.phase.lessons[0].id);
    }));
    crumbs.appendChild(el("span", "crumb-sep", "/"));
    if (done[l.id]) crumbs.appendChild(el("span", "chip done", "Complete"));
    else if (l.status === "available") crumbs.appendChild(el("span", "chip ready", "Ready"));
    else crumbs.appendChild(el("span", "chip plan", "Not written yet"));
    head.appendChild(crumbs);
    head.appendChild(el("h1", null, l.id + " — " + l.title));
    head.appendChild(el("p", "lede", l.summary));
    wrap.appendChild(head);

    var tpl = document.getElementById("lesson-" + l.id);
    if (tpl) {
      wrap.appendChild(tpl.content.cloneNode(true));
      highlight(wrap);
      if (typeof Widgets !== "undefined") Widgets.mount(wrap);

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

    var idx = allLessons.indexOf(l);
    var foot = el("div", "foot");
    foot.appendChild(button("linkbtn", "← Overview", goOverview));
    if (idx > 0) {
      var pv = allLessons[idx - 1];
      foot.appendChild(button("linkbtn", "← " + pv.id + " " + pv.title, function () { goLesson(pv.id); }));
    }
    if (idx + 1 < allLessons.length) {
      var nx = allLessons[idx + 1];
      foot.appendChild(button("linkbtn", "Next: " + nx.id + " " + nx.title + " →", function () { goLesson(nx.id); }));
    }
    wrap.appendChild(foot);

    return wrap;
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

  if (narrow.matches) rail.hidden = true;
  render();
})();

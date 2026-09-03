/* Interactive lesson widgets.
 *
 * A lesson mounts one by placing <div data-widget="name"></div> in its content.
 * After the app inserts lesson HTML it calls Widgets.mount(scope), which finds
 * every such node and hands it to the matching builder below.
 *
 * All colour comes from CSS custom properties so widgets follow the page theme.
 */
var Widgets = (function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      n.setAttribute(k, attrs[k]);
    }
    return n;
  }
  function frame(title, hint) {
    var w = el("div", "widget");
    var h = el("div", "widget-head");
    h.appendChild(el("span", "wt", title));
    if (hint) h.appendChild(el("span", "wh", hint));
    var b = el("div", "widget-body");
    w.appendChild(h);
    w.appendChild(b);
    return { root: w, body: b };
  }
  function foot(w, nodes) {
    var f = el("div", "widget-foot");
    nodes.forEach(function (n) { f.appendChild(typeof n === "string" ? document.createTextNode(n) : n); });
    w.appendChild(f);
    return f;
  }
  function b(text) { return el("b", null, text); }
  function fmt(n, dp) {
    var v = Number(n.toFixed(dp == null ? 2 : dp));
    return (Object.is(v, -0) ? 0 : v).toFixed(dp == null ? 2 : dp);
  }

  /* ==========================================================
     1. vector lab — drag two vectors, watch the dot product
     ========================================================== */
  function vectorLab(mount) {
    var S = 340, O = S / 2, U = 30;              // size, origin, pixels per unit
    var LIM = 5;
    var a = { x: 3, y: 1 }, bb = { x: 1, y: 2.5 };

    var f = frame("Drag the arrows", "the dot product responds live");
    var lab = el("div", "veclab");

    /* ---- plot ---- */
    var plot = svg("svg", {
      viewBox: "0 0 " + S + " " + S,
      role: "img",
      "aria-label": "Two vectors on a grid. Their dot product, magnitudes and cosine similarity update as they move."
    });

    for (var i = -LIM; i <= LIM; i++) {
      var p = O + i * U;
      plot.appendChild(svg("line", { x1: p, y1: 8, x2: p, y2: S - 8, class: "g-line" }));
      plot.appendChild(svg("line", { x1: 8, y1: p, x2: S - 8, y2: p, class: "g-line" }));
    }
    plot.appendChild(svg("line", { x1: 8, y1: O, x2: S - 8, y2: O, class: "g-axis" }));
    plot.appendChild(svg("line", { x1: O, y1: 8, x2: O, y2: S - 8, class: "g-axis" }));

    var arc = svg("polyline", { class: "g-arc" });
    plot.appendChild(arc);

    function vecParts(key) {
      var line = svg("line", { class: "ln-" + key });
      var head = svg("polygon", { class: "fl-" + key });
      var grip = svg("circle", {
        r: 9, class: "fl-" + key + " grip vec-handle", tabindex: "0", role: "button"
      });
      var tag = svg("text", { class: "fl-" + key + " vtag" });
      plot.appendChild(line); plot.appendChild(head); plot.appendChild(grip); plot.appendChild(tag);
      return { line: line, head: head, grip: grip, tag: tag };
    }
    var va = vecParts("a");
    var vb = vecParts("b");
    va.grip.setAttribute("aria-label", "Vector a. Use arrow keys to move.");
    vb.grip.setAttribute("aria-label", "Vector b. Use arrow keys to move.");
    va.tag.textContent = "a";
    vb.tag.textContent = "b";

    /* ---- readouts ---- */
    var reads = el("div", "readouts");
    function readout(key, cls) {
      var r = el("div", "ro" + (cls ? " " + cls : ""));
      r.appendChild(el("span", "k", key));
      var v = el("span", "v", "0");
      r.appendChild(v);
      reads.appendChild(r);
      return v;
    }
    var roA = readout("a"), roB = readout("b");
    var roDot = readout("a · b", "hero-ro");
    var roCos = readout("cosine similarity", "hero-ro");
    var roMag = readout("|a| , |b|");
    var roAng = readout("angle between");

    lab.appendChild(plot);
    lab.appendChild(reads);
    f.body.appendChild(lab);

    /* ---- controls ---- */
    var ctrls = el("div", "ctrls");
    ctrls.appendChild(el("span", "ctrl-label", "set b"));
    [
      ["same direction", function () { var m = mag(a) || 1; return { x: a.x / m * 3, y: a.y / m * 3 }; }],
      ["perpendicular", function () { var m = mag(a) || 1; return { x: -a.y / m * 3, y: a.x / m * 3 }; }],
      ["opposite", function () { var m = mag(a) || 1; return { x: -a.x / m * 3, y: -a.y / m * 3 }; }],
      ["45°", function () {
        var m = mag(a) || 1, c = Math.SQRT1_2;
        return { x: (a.x * c - a.y * c) / m * 3, y: (a.x * c + a.y * c) / m * 3 };
      }]
    ].forEach(function (row) {
      var btn = el("button", "pill", row[0]);
      btn.type = "button";
      btn.addEventListener("click", function () { bb = snapVec(row[1]()); draw(); });
      ctrls.appendChild(btn);
    });

    var lenLabel = el("span", "ctrl-label", "length of b");
    lenLabel.style.marginLeft = "6px";
    ctrls.appendChild(lenLabel);
    [["× 2", 2], ["÷ 2", 0.5]].forEach(function (row) {
      var btn = el("button", "pill", row[0]);
      btn.type = "button";
      btn.addEventListener("click", function () {
        var n = { x: bb.x * row[1], y: bb.y * row[1] };
        if (Math.abs(n.x) <= LIM && Math.abs(n.y) <= LIM && mag(n) > 0.2) { bb = snapVec(n); draw(); }
      });
      ctrls.appendChild(btn);
    });
    f.body.appendChild(ctrls);

    var explain = el("span");
    foot(f.root, [b("Try this: "),
      "drag b until the dot product reads 0. The arrows are now at a right angle — that is what " +
      "“unrelated” looks like. Then press × 2 and watch which number changes and which does not. ",
      explain]);

    /* ---- maths ---- */
    function mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
    function dot(u, v) { return u.x * v.x + u.y * v.y; }
    function snap(n) { return Math.round(n * 4) / 4; }
    function snapVec(v) {
      return {
        x: Math.max(-LIM, Math.min(LIM, snap(v.x))),
        y: Math.max(-LIM, Math.min(LIM, snap(v.y)))
      };
    }
    function sx(x) { return O + x * U; }
    function sy(y) { return O - y * U; }

    function drawVec(parts, v) {
      var m = mag(v);
      var tx = sx(v.x), ty = sy(v.y);
      parts.line.setAttribute("x1", O); parts.line.setAttribute("y1", O);
      parts.line.setAttribute("x2", tx); parts.line.setAttribute("y2", ty);

      if (m > 0.01) {
        var ux = (tx - O) / (m * U), uy = (ty - O) / (m * U);
        var hl = 11, hw = 5;
        var pts = [
          [tx, ty],
          [tx - hl * ux + hw * -uy, ty - hl * uy + hw * ux],
          [tx - hl * ux - hw * -uy, ty - hl * uy - hw * ux]
        ];
        parts.head.setAttribute("points", pts.map(function (q) { return q[0] + "," + q[1]; }).join(" "));
        parts.head.style.display = "";
      } else {
        parts.head.style.display = "none";
      }

      parts.grip.setAttribute("cx", tx);
      parts.grip.setAttribute("cy", ty);
      parts.tag.setAttribute("x", tx + (v.x >= 0 ? 13 : -21));
      parts.tag.setAttribute("y", ty + (v.y >= 0 ? -11 : 21));
    }

    function draw() {
      drawVec(va, a);
      drawVec(vb, bb);

      var d = dot(a, bb), ma = mag(a), mb = mag(bb);
      var cos = (ma > 0 && mb > 0) ? d / (ma * mb) : 0;
      var ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;

      roA.textContent = "[" + fmt(a.x) + ", " + fmt(a.y) + "]";
      roB.textContent = "[" + fmt(bb.x) + ", " + fmt(bb.y) + "]";
      roDot.textContent = fmt(d);
      roCos.textContent = fmt(cos);
      roMag.textContent = fmt(ma) + " , " + fmt(mb);
      roAng.textContent = fmt(ang, 1) + "°";

      roDot.className = "v " + (d > 0.005 ? "pos" : d < -0.005 ? "neg" : "");
      roCos.className = "v " + (cos > 0.005 ? "pos" : cos < -0.005 ? "neg" : "");

      /* angle arc, sampled so no arc-flag arithmetic is needed */
      if (ma > 0.3 && mb > 0.3) {
        var t0 = Math.atan2(a.y, a.x), t1 = Math.atan2(bb.y, bb.x);
        var delta = t1 - t0;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        var pts = [];
        for (var k = 0; k <= 24; k++) {
          var t = t0 + delta * (k / 24);
          pts.push(sx(Math.cos(t) * 1.35) + "," + sy(Math.sin(t) * 1.35));
        }
        arc.setAttribute("points", pts.join(" "));
        arc.style.display = "";
      } else {
        arc.style.display = "none";
      }

      explain.textContent =
        Math.abs(cos) < 0.06 ? "Right now: perpendicular — no shared direction at all."
        : cos > 0.94 ? "Right now: pointing the same way."
        : cos < -0.94 ? "Right now: pointing exactly opposite."
        : cos > 0 ? "Right now: partly agreeing."
        : "Right now: partly disagreeing.";
    }

    /* ---- interaction ---- */
    var dragging = null;
    function pointAt(evt) {
      var r = plot.getBoundingClientRect();
      var scale = S / r.width;
      return {
        x: (evt.clientX - r.left) * scale,
        y: (evt.clientY - r.top) * scale
      };
    }
    plot.addEventListener("pointerdown", function (evt) {
      var p = pointAt(evt);
      var da = Math.hypot(p.x - sx(a.x), p.y - sy(a.y));
      var db = Math.hypot(p.x - sx(bb.x), p.y - sy(bb.y));
      if (Math.min(da, db) > 34) return;
      dragging = da <= db ? "a" : "b";
      plot.setPointerCapture(evt.pointerId);
      evt.preventDefault();
    });
    plot.addEventListener("pointermove", function (evt) {
      if (!dragging) return;
      var p = pointAt(evt);
      var v = snapVec({ x: (p.x - O) / U, y: (O - p.y) / U });
      if (dragging === "a") a = v; else bb = v;
      draw();
    });
    function endDrag() { dragging = null; }
    plot.addEventListener("pointerup", endDrag);
    plot.addEventListener("pointercancel", endDrag);

    [[va.grip, "a"], [vb.grip, "b"]].forEach(function (row) {
      row[0].addEventListener("keydown", function (evt) {
        var map = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] };
        var d = map[evt.key];
        if (!d) return;
        evt.preventDefault();
        var t = row[1] === "a" ? a : bb;
        var v = snapVec({ x: t.x + d[0], y: t.y + d[1] });
        if (row[1] === "a") a = v; else bb = v;
        draw();
      });
    });

    draw();
    mount.appendChild(f.root);
  }

  /* ==========================================================
     2. step through the dot product one multiplication at a time
     ========================================================== */
  function dotSteps(mount) {
    var A = [1, 2, 3], B = [4, 5, 6];
    var step = -1, timer = null;

    var f = frame("One multiplication at a time", "the algorithm, slowly");
    var grid = el("div", "grid-steps");

    function row(label, values, cls) {
      var r = el("div", "srow");
      r.appendChild(el("span", "rlab", label));
      var cells = [];
      values.forEach(function (v, i) {
        if (i) r.appendChild(el("span", "op", cls === "prod" ? "+" : ""));
        var c = el("div", "cell", v == null ? "?" : String(v));
        if (v == null) c.classList.add("blank");
        r.appendChild(c);
        cells.push(c);
      });
      grid.appendChild(r);
      return cells;
    }

    var cellsA = row("a", A);
    var cellsB = row("b", B);
    var cellsP = row("aᵢ × bᵢ", [null, null, null], "prod");

    f.body.appendChild(grid);

    var total = el("div", "total-line");
    total.appendChild(el("span", "lbl", "running total"));
    var eq = el("span", "eq", "—");
    total.appendChild(eq);
    var sum = el("span", "sum", "0");
    total.appendChild(sum);
    f.body.appendChild(total);

    var ctrls = el("div", "ctrls");
    var stepBtn = el("button", "pill", "Step");
    var playBtn = el("button", "pill", "Play");
    var resetBtn = el("button", "pill", "Reset");
    [stepBtn, playBtn, resetBtn].forEach(function (x) { x.type = "button"; ctrls.appendChild(x); });
    f.body.appendChild(ctrls);

    foot(f.root, [
      "Three multiplications and two additions. That is the whole operation — and a modern GPU runs " +
      "trillions of them per second. ", b("Everything else in this field is scale and arrangement.")
    ]);

    function render() {
      [cellsA, cellsB].forEach(function (cells) {
        cells.forEach(function (c, i) {
          c.classList.toggle("live", i === step);
          c.classList.toggle("settled", i < step);
        });
      });
      cellsP.forEach(function (c, i) {
        var on = i <= step;
        c.textContent = on ? String(A[i] * B[i]) : "?";
        c.classList.toggle("blank", !on);
        c.classList.toggle("live", i === step);
        c.classList.toggle("settled", i < step);
      });

      var parts = [], acc = 0;
      for (var i = 0; i <= step && i < A.length; i++) {
        parts.push(A[i] + "×" + B[i]);
        acc += A[i] * B[i];
      }
      eq.textContent = parts.length ? parts.join(" + ") : "—";
      sum.textContent = String(acc);
      playBtn.classList.toggle("on", timer !== null);
      playBtn.textContent = timer !== null ? "Pause" : "Play";
    }

    function advance() {
      if (step >= A.length - 1) { stop(); return; }
      step++;
      render();
      if (step >= A.length - 1) stop();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } render(); }

    stepBtn.addEventListener("click", function () { stop(); advance(); });
    playBtn.addEventListener("click", function () {
      if (timer) { stop(); return; }
      if (step >= A.length - 1) step = -1;
      advance();
      timer = setInterval(advance, 950);
      render();
    });
    resetBtn.addEventListener("click", function () { stop(); step = -1; render(); });

    render();
    mount.appendChild(f.root);
  }

  /* ==========================================================
     3. a working similarity search, on three dimensions
     ========================================================== */
  function searchDemo(mount) {
    var DIMS = ["programming", "cooking", "learning"];
    var LIB = [
      { name: "Python tutorial for beginners", v: [0.90, 0.05, 0.85] },
      { name: "How the Rust borrow checker works", v: [0.95, 0.05, 0.40] },
      { name: "Sourdough starter, day by day", v: [0.05, 0.95, 0.55] },
      { name: "Knife skills every cook needs", v: [0.05, 0.90, 0.60] },
      { name: "Restaurant menu, autumn", v: [0.02, 0.90, 0.03] },
      { name: "Teaching yourself to draw", v: [0.08, 0.10, 0.90] }
    ];
    var q = [0.8, 0.1, 0.7];

    var f = frame("Similarity search, for real", "exercise 7, made visible");
    var grid = el("div", "searchgrid");

    var left = el("div");
    left.appendChild(el("div", "ctrl-label", "your query vector"));
    var sliders = el("div", "sliders");
    sliders.style.marginTop = "10px";
    var vals = [];
    DIMS.forEach(function (name, i) {
      var rw = el("div", "slider-row");
      var top = el("div", "top");
      top.appendChild(el("span", "nm", name));
      var vl = el("span", "vl", q[i].toFixed(2));
      top.appendChild(vl);
      rw.appendChild(top);
      var input = document.createElement("input");
      input.type = "range";
      input.min = "0"; input.max = "1"; input.step = "0.01";
      input.value = String(q[i]);
      input.setAttribute("aria-label", name);
      input.addEventListener("input", function () {
        q[i] = parseFloat(input.value);
        vl.textContent = q[i].toFixed(2);
        render();
      });
      vals.push({ input: input, label: vl });
      rw.appendChild(input);
      sliders.appendChild(rw);
    });
    left.appendChild(sliders);

    var presets = el("div", "ctrls");
    [
      ["learn to code", [0.9, 0.05, 0.9]],
      ["cook something", [0.05, 0.95, 0.3]],
      ["just learning", [0.1, 0.1, 0.95]]
    ].forEach(function (row) {
      var btn = el("button", "pill", row[0]);
      btn.type = "button";
      btn.addEventListener("click", function () {
        q = row[1].slice();
        vals.forEach(function (s, i) { s.input.value = String(q[i]); s.label.textContent = q[i].toFixed(2); });
        render();
      });
      presets.appendChild(btn);
    });
    left.appendChild(presets);

    var results = el("div", "results");
    grid.appendChild(left);
    grid.appendChild(results);
    f.body.appendChild(grid);

    foot(f.root, [
      "Six items, three dimensions, ranked by cosine similarity — the function you write in exercise 6. " +
      "Real systems differ only in scale: ", b("millions of items and 1536 dimensions"),
      ", produced by a model instead of chosen by hand."
    ]);

    function cos(u, v) {
      var d = 0, mu = 0, mv = 0;
      for (var i = 0; i < u.length; i++) { d += u[i] * v[i]; mu += u[i] * u[i]; mv += v[i] * v[i]; }
      return (mu && mv) ? d / (Math.sqrt(mu) * Math.sqrt(mv)) : 0;
    }

    function render() {
      var scored = LIB.map(function (item) {
        return { name: item.name, s: cos(q, item.v) };
      }).sort(function (m, n) { return n.s - m.s; });

      results.textContent = "";
      scored.forEach(function (item, idx) {
        var r = el("div", "result" + (idx === 0 ? " top" : ""));
        var col = el("div");
        col.appendChild(el("div", "nm", item.name));
        var track = el("div", "track");
        var fill = el("i");
        fill.style.width = Math.max(0, item.s * 100).toFixed(1) + "%";
        track.appendChild(fill);
        col.appendChild(track);
        r.appendChild(col);
        r.appendChild(el("div", "sc", item.s.toFixed(3)));
        results.appendChild(r);
      });
    }

    render();
    mount.appendChild(f.root);
  }

  /* ========================================================== */
  var BUILDERS = {
    vectorlab: vectorLab,
    dotsteps: dotSteps,
    search: searchDemo
  };

  return {
    mount: function (scope) {
      scope.querySelectorAll("[data-widget]").forEach(function (node) {
        var build = BUILDERS[node.getAttribute("data-widget")];
        if (!build || node.dataset.mounted) return;
        node.dataset.mounted = "1";
        try { build(node); } catch (e) { node.remove(); }
      });
    }
  };
})();

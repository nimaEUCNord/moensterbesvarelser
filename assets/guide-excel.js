// Tegner de falske Excel-ark og minigrafer i guiden "Graf i Excel" (data fra Hookes lov-journalen).
(function () {
  "use strict";
  var g = 9.82, L0 = 12.3;
  var masses = [0, 50, 100, 150, 200, 250, 300], positions = [12.3, 14.8, 17.1, 19.7, 22.2, 24.5, 27.1];
  var pts = masses.map(function (m, i) { return { m: m, dx: Math.round((positions[i] - L0) * 10) / 1000, F: m / 1000 * g }; });
  var fmt = function (v, d) { return v.toFixed(d).replace(".", ","); };
  var FIT = (function () {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.dx; sy += p.F; sxx += p.dx * p.dx; sxy += p.dx * p.F; });
    var a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n, mean = sy / n, sst = 0, s1 = 0;
    pts.forEach(function (p) { sst += Math.pow(p.F - mean, 2); s1 += Math.pow(p.F - (a * p.dx + b), 2); });
    return { a: a, b: b, r2: 1 - s1 / sst };
  })();
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  var cols = ["", "A", "B", "C", "D"];
  document.querySelectorAll(".xl-grid").forEach(function (gEl) {
    var selected = gEl.getAttribute("data-sheet") === "selected";
    var html = cols.map(function (c, ci) { return "<div class=\"h" + (selected && (ci === 1 || ci === 2) ? " selh" : "") + "\">" + c + "</div>"; }).join("");
    var rows = [["Δx (m)", "F (N)"]].concat(pts.map(function (p) { return [fmt(p.dx, 3), fmt(p.F, 3)]; }));
    rows.forEach(function (r, ri) {
      html += "<div class=\"h" + (selected ? " selh" : "") + "\">" + (ri + 1) + "</div>";
      for (var ci = 0; ci < 4; ci++) {
        var v = ci < 2 ? r[ci] : "", cls = [];
        if (ri === 0 && ci < 2) cls.push("b"); else if (ci < 2) cls.push("n");
        if (selected && ci < 2) cls.push("sel");
        if (!selected && ri === 2 && ci === 0) cls.push("cur");
        html += "<div class=\"" + cls.join(" ") + "\">" + v + "</div>";
      }
    });
    gEl.innerHTML = html;
  });
  document.querySelectorAll("svg[data-mini]").forEach(function (s) {
    var kind = s.getAttribute("data-mini");
    var w = 300, h = 200, m = { l: 44, r: 12, t: 16, b: 38 };
    var x = function (v) { return m.l + v / 0.16 * (w - m.l - m.r); };
    var y = function (v) { return h - m.b - v / 3.5 * (h - m.t - m.b); };
    for (var a = 0; a <= 3.5; a += 0.5) {
      el("line", { x1: x(0), x2: x(0.16), y1: y(a), y2: y(a), stroke: "var(--rule-soft)", "stroke-width": 1 }, s);
      el("text", { x: x(0) - 5, y: y(a) + 3, "text-anchor": "end", "font-size": 9 }, s).textContent = fmt(a, 1);
    }
    for (var b = 0; b <= 0.16001; b += 0.04) {
      el("text", { x: x(b), y: y(0) + 12, "text-anchor": "middle", "font-size": 9 }, s).textContent = fmt(b, 2);
    }
    el("line", { x1: x(0), x2: x(0.16), y1: y(0), y2: y(0), stroke: "var(--muted)", "stroke-width": 1 }, s);
    if (kind === "final") {
      el("line", { x1: x(0), y1: y(FIT.b), x2: x(0.16), y2: y(FIT.a * 0.16 + FIT.b), stroke: "var(--ink-2)", "stroke-width": 1.2, "stroke-dasharray": "4 3" }, s);
      el("text", { x: x(0.105), y: y(1.1), "font-size": 10.5, fill: "var(--ink)" }, s).textContent = "y = " + fmt(FIT.a, 2) + "x + " + fmt(FIT.b, 4);
      el("text", { x: x(0.105), y: y(1.1) + 13, "font-size": 10.5, fill: "var(--ink)" }, s).textContent = "R² = " + fmt(FIT.r2, 4);
    }
    pts.forEach(function (p, k) {
      var hit = kind === "click" && k === 3;
      el("circle", { cx: x(p.dx), cy: y(p.F), r: hit ? 4.5 : 3.5, fill: "#4472C4", stroke: hit ? "var(--teacher)" : "none", "stroke-width": 2 }, s);
    });
    var at = el("text", { x: (x(0) + x(0.16)) / 2, y: h - 8, "text-anchor": "middle", "font-size": 10.5, "font-weight": 600 }, s);
    var bt = el("text", { transform: "translate(12 " + y(1.75) + ") rotate(-90)", "text-anchor": "middle", "font-size": 10.5, "font-weight": 600 }, s);
    at.textContent = kind === "axes" ? "Aksetitel" : "Forlængelse Δx (m)";
    bt.textContent = kind === "axes" ? "Aksetitel" : "Kraft F (N)";
    if (kind === "axes") { at.setAttribute("fill", "var(--teacher)"); bt.setAttribute("fill", "var(--teacher)"); }
  });
})();

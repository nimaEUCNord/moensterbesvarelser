// Guidesider: viser ét trin ad gangen med Forrige/Næste, trinprikker og en knap til at vise alle trin.
// Trinnet står i #hash (fx #aksetitler), så links direkte til et trin virker. Valget "Vis alle trin"
// huskes i localStorage. Uden JS vises alle trin under hinanden.
(function () {
  var wrap = document.querySelector(".steps");
  if (!wrap) return;
  var steps = [].slice.call(wrap.querySelectorAll(".step"));
  if (steps.length < 2) return;
  var KEY = "guide-vis-alle", cur = 0, all = false;
  try { all = localStorage.getItem(KEY) === "1"; } catch (e) {}
  var title = function (s) { return s.querySelector("h3").textContent.replace(/^\d+/, "").trim(); };

  var bar = document.createElement("div");
  bar.className = "stepper";
  var dots = document.createElement("ol");
  dots.className = "stepper-dots";
  dots.setAttribute("aria-label", "Trin");
  var links = steps.map(function (s, i) {
    var li = document.createElement("li"), a = document.createElement("a");
    a.href = "#" + s.id; a.textContent = i + 1; a.title = title(s);
    a.setAttribute("aria-label", "Trin " + (i + 1) + ": " + title(s));
    a.addEventListener("click", function (e) { if (!all) { e.preventDefault(); go(i, true); } });
    li.appendChild(a); dots.appendChild(li);
    return a;
  });
  var label = document.createElement("span");
  label.className = "stepper-label";
  label.setAttribute("aria-live", "polite");
  var toggle = document.createElement("button");
  toggle.type = "button"; toggle.className = "gbtn view-toggle";
  toggle.addEventListener("click", function () {
    all = !all;
    try { localStorage.setItem(KEY, all ? "1" : "0"); } catch (e) {}
    render();
    if (!all) bar.scrollIntoView({ block: "nearest" });
  });
  bar.appendChild(dots); bar.appendChild(label); bar.appendChild(toggle);
  wrap.parentNode.insertBefore(bar, wrap);

  var nav = document.createElement("div");
  nav.className = "step-nav";
  var prev = document.createElement("button"), next = document.createElement("button");
  prev.type = next.type = "button";
  prev.className = "gbtn"; next.className = "gbtn primary";
  prev.addEventListener("click", function () { go(cur - 1, true); });
  next.addEventListener("click", function () { go(cur + 1, true); });
  nav.appendChild(prev); nav.appendChild(next);
  wrap.parentNode.insertBefore(nav, wrap.nextSibling);

  function render() {
    wrap.classList.toggle("one-at-a-time", !all);
    nav.hidden = all;
    dots.hidden = label.hidden = all;
    toggle.textContent = all ? "Vis ét trin ad gangen" : "Vis alle trin";
    steps.forEach(function (s, i) { s.classList.toggle("active", i === cur); });
    links.forEach(function (a, i) {
      if (i === cur) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
      a.classList.toggle("done", i < cur);
    });
    label.textContent = "Trin " + (cur + 1) + " af " + steps.length;
    prev.disabled = cur === 0;
    prev.innerHTML = cur > 0 ? "← Forrige<small>" + title(steps[cur - 1]) + "</small>" : "";
    next.innerHTML = cur < steps.length - 1 ? "Næste →<small>" + title(steps[cur + 1]) + "</small>" : "Færdig ✓<small>Tilbage til trin 1</small>";
  }
  function go(i, user) {
    cur = (i + steps.length) % steps.length;
    render();
    if (user) {
      history.replaceState(null, "", "#" + steps[cur].id);
      if (bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: "start" });
    }
  }
  function fromHash(scroll) {
    var i = steps.findIndex(function (s) { return "#" + s.id === location.hash; });
    if (i < 0) return;
    go(i, false);
    if (scroll) steps[i].scrollIntoView({ block: "start" });
  }
  document.addEventListener("keydown", function (e) {
    if (all || e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight" && cur < steps.length - 1) go(cur + 1, true);
    if (e.key === "ArrowLeft" && cur > 0) go(cur - 1, true);
  });
  window.addEventListener("hashchange", function () { fromHash(all); });
  render();
  fromHash(all);
})();

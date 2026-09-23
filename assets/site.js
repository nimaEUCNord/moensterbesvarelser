// Temaknapper (Auto/Lys/Mørk). Samme localStorage-nøgle som journalsiderne, så valget følger med.
(function () {
  var root = document.documentElement, btns = document.querySelectorAll("[data-theme-set]");
  function setTheme(t) {
    if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-theme-set") === t); });
    try { localStorage.setItem("hooke-theme", t); } catch (e) {}
  }
  btns.forEach(function (b) { b.addEventListener("click", function () { setTheme(b.getAttribute("data-theme-set")); }); });
  setTheme(root.getAttribute("data-theme") || "auto");
})();

// Typefelter på fag- og værktøjssiden: kun den valgte types kort vises, styret af #hash,
// så tilbage-knappen og links som "fysik/#journal" virker. Uden JS vises alle sektioner.
(function () {
  var nav = document.querySelector(".types");
  if (!nav) return;
  var noun = (nav.getAttribute("data-noun") || "dokument|dokumenter").split("|");
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  links.forEach(function (a, i) {
    var n = secs[i].querySelectorAll("a.card").length;
    a.querySelector("span").textContent = n ? n + " " + noun[n === 1 ? 0 : 1] : "Kommer snart";
    a.classList.toggle("empty", !n);
  });
  function show(scroll) {
    var id = location.hash.slice(1);
    secs.forEach(function (s, i) {
      var on = s.id === id;
      s.hidden = !on;
      links[i].setAttribute("aria-current", on ? "true" : "false");
      if (on && scroll) s.scrollIntoView({ block: "nearest" });
    });
  }
  window.addEventListener("hashchange", function () { show(true); });
  show(false);
})();

// "Tilbage til dokumentet" på guidesider: vises, når man kom fra en anden side på sitet end guideoversigten.
(function () {
  var b = document.getElementById("back-ref");
  if (!b || !document.referrer) return;
  try {
    var r = new URL(document.referrer);
    if (r.origin !== location.origin || /\/vaerktoejer\/(index\.html)?$/.test(r.pathname) || r.pathname === location.pathname) return;
  } catch (e) { return; }
  b.href = document.referrer;
  b.hidden = false;
  b.addEventListener("click", function (e) { if (history.length > 1) { e.preventDefault(); history.back(); } });
})();

// Til toppen-knap, når man har scrollet mere end en skærmhøjde ned.
(function () {
  var a = document.createElement("a");
  a.href = "#top"; a.className = "to-top"; a.textContent = "↑ Til toppen"; a.hidden = true;
  a.addEventListener("click", function (e) { e.preventDefault(); window.scrollTo({ top: 0 }); });
  document.body.appendChild(a);
  function upd() { a.hidden = window.scrollY < window.innerHeight * 1.2; }
  window.addEventListener("scroll", upd, { passive: true });
  upd();
})();

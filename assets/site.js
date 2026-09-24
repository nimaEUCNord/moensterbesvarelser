// Temaknap i topbjælken: skifter Auto → Lys → Mørk. Samme localStorage-nøgle som journalsiderne, så valget følger med.
(function () {
  var root = document.documentElement, btn = document.getElementById("theme");
  if (!btn) return;
  var ICONS = {
    auto: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.3 4.3l1.6 1.6M14.1 14.1l1.6 1.6M4.3 15.7l1.6-1.6M14.1 5.9l1.6-1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
    dark: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 12.6A6.6 6.6 0 0 1 7.4 4a6.6 6.6 0 1 0 8.6 8.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  };
  var NAMES = { auto: "Auto (følger enheden)", light: "Lys", dark: "Mørk" }, NEXT = { auto: "light", light: "dark", dark: "auto" };
  var theme = root.getAttribute("data-theme") || "auto";
  function setTheme(t) {
    theme = t;
    if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    btn.innerHTML = ICONS[t];
    btn.title = "Tema: " + NAMES[t] + ". Klik for at skifte.";
    btn.setAttribute("aria-label", btn.title);
    try { localStorage.setItem("hooke-theme", t); } catch (e) {}
  }
  btn.addEventListener("click", function () { setTheme(NEXT[theme]); });
  setTheme(theme);
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
  // Klik på den valgte type fravælger den igen, så kun felterne vises.
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (a.getAttribute("aria-current") !== "true") return;
      e.preventDefault();
      history.pushState(null, "", location.pathname + location.search);
      show(false);
    });
  });
  window.addEventListener("hashchange", function () { show(true); });
  window.addEventListener("popstate", function () { show(false); });
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

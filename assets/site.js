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

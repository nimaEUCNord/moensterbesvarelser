// Tjekliste: fluebenene gemmes i browseren under data-key på .checklist.
// data-legacy er en gammel nøgle, som fluebenene hentes fra første gang (fra før tjeklisten fik sin egen side).
(function () {
  var box = document.querySelector(".checklist[data-key]");
  if (!box) return;
  var key = box.getAttribute("data-key"), legacy = box.getAttribute("data-legacy");
  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  var saved = load(key) || (legacy && load(legacy)) || {};
  var inputs = [];
  box.querySelectorAll(".cl-group").forEach(function (g, gi) {
    g.querySelectorAll("input[type=checkbox]").forEach(function (b, ii) {
      b.id = "cl-" + gi + "-" + ii;
      b.checked = !!saved[b.id];
      inputs.push(b);
    });
  });
  var count = box.querySelector(".cl-count"), bar = box.querySelector(".bar i");
  function update() {
    var n = 0, state = {};
    inputs.forEach(function (b) { if (b.checked) { n++; state[b.id] = true; } });
    count.textContent = n + " af " + inputs.length + " tjekket";
    bar.style.width = (n / inputs.length * 100) + "%";
    return state;
  }
  box.addEventListener("change", function () { save(update()); });
  box.querySelector("[data-reset]").addEventListener("click", function () {
    inputs.forEach(function (b) { b.checked = false; });
    save(update());
  });
  box.querySelector("[data-print]").addEventListener("click", function () { window.print(); });
  update();
})();

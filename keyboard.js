let kbRowIdx = 0;
let kbColIdx = 0;
let kbVisible = false;
let kbLast = {};

function kbRows() {
  return Array.from(document.querySelectorAll("#gp-kb .kb_row"));
}

function kbRender() {
  document.querySelectorAll("#gp-kb .key").forEach(k => k.classList.remove("gp-sel"));
  const rows = kbRows();
  const row = rows[kbRowIdx];
  if (!row) return;
  const keys = row.querySelectorAll(".key");
  const key = keys[Math.min(kbColIdx, keys.length - 1)];
  if (key) key.classList.add("gp-sel");
}

function kbPressCurrent() {
  const rows = kbRows();
  const row = rows[kbRowIdx];
  if (!row) return;
  const keys = row.querySelectorAll(".key");
  const key = keys[Math.min(kbColIdx, keys.length - 1)];
  if (key) key.click();
}

function kbLoop() {
  if (!kbVisible) return;
  const gp = navigator.getGamepads()[0];
  if (gp) {
    const s = {
      u: gp.buttons[12]?.pressed || gp.axes[7] < -0.5,
      d: gp.buttons[13]?.pressed || gp.axes[7] > 0.5,
      l: gp.buttons[14]?.pressed || gp.axes[6] < -0.5,
      r: gp.buttons[15]?.pressed || gp.axes[6] > 0.5,
      a: gp.buttons[0]?.pressed,
      b: gp.buttons[1]?.pressed,
    };
    const rows = kbRows();
    if (s.d && !kbLast.d) { kbRowIdx = Math.min(kbRowIdx + 1, rows.length - 1); kbColIdx = Math.min(kbColIdx, rows[kbRowIdx].querySelectorAll(".key").length - 1); kbRender(); }
    if (s.u && !kbLast.u) { kbRowIdx = Math.max(kbRowIdx - 1, 0); kbColIdx = Math.min(kbColIdx, rows[kbRowIdx].querySelectorAll(".key").length - 1); kbRender(); }
    if (s.r && !kbLast.r) { kbColIdx = Math.min(kbColIdx + 1, rows[kbRowIdx].querySelectorAll(".key").length - 1); kbRender(); }
    if (s.l && !kbLast.l) { kbColIdx = Math.max(kbColIdx - 1, 0); kbRender(); }
    if (s.a && !kbLast.a) kbPressCurrent();
    if (s.b && !kbLast.b) closeKeyboard();
    kbLast = s;
  }
  requestAnimationFrame(kbLoop);
}

let kbHtml = "";

// Chargement du fichier au démarrage
(async () => {
  const url = chrome.runtime.getURL("keyboard.html");
  const response = await fetch(url);
  kbHtml = await response.text();
})();

function createKeyboard() {
  if (document.getElementById("gp-kb")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "gp-kb";
  wrapper.innerHTML = kbHtml;
  document.body.appendChild(wrapper);

  // Positionne sous la search bar
  const rect = search_bar.getBoundingClientRect();
  wrapper.style.display = "block";
  wrapper.style.position = "fixed";
  wrapper.style.top = (rect.bottom + 8) + "px";
  wrapper.style.left = rect.left + "px";
  wrapper.style.transform = "none";

  // Gestion des clics
  wrapper.querySelectorAll(".key").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.value;
      if (val === "BACKSPACE") {
        search_bar.value = search_bar.value.slice(0, -1);
      } else {
        search_bar.value += val;
      }
      search_bar.dispatchEvent(new InputEvent("input", { bubbles: true }));
      search_bar.focus();
    });
  });
  kbRowIdx = 0;
  kbColIdx = 0;
  kbVisible = true;
  kbLast = {};
  kbRender();
  kbLoop();
}

function closeKeyboard() {
  kbVisible = false;
  document.getElementById("gp-kb")?.remove();
}
let kbRowIdx = 0;
let kbColIdx = 0;
let kbVisible = false;
let kbLast = {};
let kbLoopRunning = false;

function kbRows() {
  return Array.from(document.querySelectorAll("#gp-kb .kb_row"));
}

function getConnectedGamepad() {
  return Array.from(navigator.getGamepads()).find(g => g && g.connected) || null;
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
  if (!kbVisible) {
    kbLoopRunning = false;
    return;
  }

  kbLoopRunning = true;
  const gp = getConnectedGamepad();

  if (gp) {
    const s = {
      u: gp.buttons[12]?.pressed || gp.axes[1] < -0.5,
      d: gp.buttons[13]?.pressed || gp.axes[1] > 0.5,
      l: gp.buttons[14]?.pressed || gp.axes[0] < -0.5,
      r: gp.buttons[15]?.pressed || gp.axes[0] > 0.5,
      a: gp.buttons[0]?.pressed,
      b: gp.buttons[1]?.pressed,
    };

    const rows = kbRows();
    if (rows.length === 0) {
      if (kbVisible) requestAnimationFrame(kbLoop);
      return;
    }

    if (s.d && !kbLast.d) { kbRowIdx = Math.min(kbRowIdx + 1, rows.length - 1); kbColIdx = Math.min(kbColIdx, rows[kbRowIdx].querySelectorAll(".key").length - 1); kbRender(); }
    if (s.u && !kbLast.u) { kbRowIdx = Math.max(kbRowIdx - 1, 0); kbColIdx = Math.min(kbColIdx, rows[kbRowIdx].querySelectorAll(".key").length - 1); kbRender(); }
    if (s.r && !kbLast.r) { kbColIdx = Math.min(kbColIdx + 1, rows[kbRowIdx].querySelectorAll(".key").length - 1); kbRender(); }
    if (s.l && !kbLast.l) { kbColIdx = Math.max(kbColIdx - 1, 0); kbRender(); }
    if (s.a && !kbLast.a) kbPressCurrent();
    if (s.b && !kbLast.b) closeKeyboard();
    kbLast = s;
  }

  if (kbVisible) requestAnimationFrame(kbLoop);
}


let kbHtml = "";

// Chargement du fichier au démarrage
(async () => {
  const url = chrome.runtime.getURL("keyboard.html");
  const response = await fetch(url);
  kbHtml = await response.text();
})();

function createKeyboard() {
  const searchBar = document.querySelector(".ytSearchboxComponentInput");
  if (!searchBar || !kbHtml) return;

  kbVisible = true;

  const existing = document.getElementById("gp-kb");
  if (existing) {
    existing.remove();
  }

  const wrapper = document.createElement("div");
  wrapper.id = "gp-kb";
  wrapper.innerHTML = kbHtml;
  document.body.appendChild(wrapper);

  const rect = searchBar.getBoundingClientRect();
  wrapper.style.display = "block";
  wrapper.style.position = "fixed";
  wrapper.style.top = (rect.bottom + 8) + "px";
  wrapper.style.left = rect.left + "px";
  wrapper.style.transform = "none";

  wrapper.addEventListener("click", (event) => {
    const btn = event.target.closest(".key");
    if (!btn) return;

    const val = btn.dataset.value;

    if (val === "ENTER") {
      console.log("SUBMIT SEARCH");

      const form = searchBar.closest("form") || searchBar.form;

      if (typeof beginNavigationLock === "function") {
        beginNavigationLock(1500);
      }

      if (form?.requestSubmit) {
        form.requestSubmit();
      }

      closeKeyboard();
      return;
    }

    if (val === "BACKSPACE") {
      searchBar.value = searchBar.value.slice(0, -1);
    } else if (val === "SPACE") {
      searchBar.value += " ";
    } else {
      searchBar.value += val;
    }

    searchBar.dispatchEvent(new InputEvent("input", { bubbles: true }));
    searchBar.focus();
  });

  kbRowIdx = 0;
  kbColIdx = 0;
  kbVisible = true;
  kbLast = {};
  kbRender();
  if (!kbLoopRunning) kbLoop();
}

function closeKeyboard() {
  kbVisible = false;
  kbLast = {};
  kbLoopRunning = false;
  document.getElementById("gp-kb")?.remove();
  console.log("Keyboard closed");
}
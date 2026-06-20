const buttons = {
    PLAY_PAUSE: document.getElementById("select_btn"),
    FULLSCREEN: document.getElementById("fullscreen_btn"),
    BACK: document.getElementById("homepage_btn"),
    SEARCH: document.getElementById("search_btn")
};

let bindings = {
    PLAY_PAUSE: 0,
    BACK: 1,
    FULLSCREEN: 2,
    SEARCH: 3
};

chrome.storage.sync.get("bindings", (data) => {
    if (data.bindings) {
        bindings = data.bindings;
    }
    refreshUI();
});

function refreshUI() {
    buttons.PLAY_PAUSE.textContent = `Button ${bindings.PLAY_PAUSE}`;
    buttons.FULLSCREEN.textContent = `Button ${bindings.FULLSCREEN}`;
    buttons.BACK.textContent = `Button ${bindings.BACK}`;
    buttons.SEARCH.textContent = `Button ${bindings.SEARCH}`;
}
function waitForButton(action) {
  buttons[action].textContent = "Press a button...";

  const interval = setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    for (let i = 0; i < gp.buttons.length; i++) {
      const btn = gp.buttons[i];

      if (btn.pressed && !btn._prev) {
        btn._prev = true;

        bindings[action] = i;
        chrome.storage.sync.set({ bindings });

        refreshUI();
        clearInterval(interval);
        return;
      }

      if (!btn.pressed) {
        btn._prev = false;
      }
    }
  }, 50);
}
buttons.PLAY_PAUSE.addEventListener("click", () => {
    waitForButton("PLAY_PAUSE");
});

buttons.FULLSCREEN.addEventListener("click", () => {
    waitForButton("FULLSCREEN");
});

buttons.BACK.addEventListener("click", () => {
    waitForButton("BACK");
});

buttons.SEARCH.addEventListener("click", () => {
    waitForButton("SEARCH")
})

console.log("POPUP LOAD", bindings);

let gamepad_p = document.getElementById("connected_gamepad")
let switch_btn = document.getElementById("switch")
let isActivated = true;

chrome.storage.sync.get(["enabled"], (data) => {
  isActivated = data.enabled ?? true;
  
  updateToggleUI();
});
function updateToggleUI() {
  switch_btn.textContent = isActivated ? "OFF" : "ON";
  if(switch_btn.textContent == "ON"){
    switch_btn.style.background = "green"
  }
  else if(switch_btn.textContent == "OFF"){
        switch_btn.style.background = "red"

  }
}

switch_btn.addEventListener("click", () => {
  isActivated = !isActivated;

  chrome.storage.sync.set({
    enabled: isActivated
  });

  updateToggleUI();
});
chrome.storage.local.get("gamepad", (data) => {
  document.getElementById("connected_gamepad").textContent = "Connected gamepad : " +
    data.gamepad?.name || "No gamepad";
});


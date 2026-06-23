let thumbnails = [];
let selectedThumbnailIndex = 0
let search_bar;
let domLocked = false;

function getThumbnails() {
  const path = location.pathname;

  if (path.includes("/results")) {
    thumbnails = Array.from(
      document.querySelectorAll("ytd-video-renderer")
    );

  } else if (path.includes("/watch")) {
    thumbnails = Array.from(
      document.querySelectorAll("yt-lockup-view-model")
    );

  } else {
    thumbnails = Array.from(
      document.querySelectorAll(
        "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer"
      )
    );
  }

  search_bar = document.querySelector(".ytSearchboxComponentInput");
}
let observerTimeout = null;

const observer = new MutationObserver(() => {
  if (domLocked) return;

  clearTimeout(observerTimeout);

  observerTimeout = setTimeout(() => {
    getThumbnails();
  }, 150);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Gestion de la connexion de la manette.
let gamepadIndex = null;
let gamepad = null;

let bindings = {
  PLAY_PAUSE: 0,
  BACK: 1,
  FULLSCREEN: 2,
  SEARCH: 3
};

chrome.storage.sync.get("bindings", (data) => {
  if (data.bindings) bindings = data.bindings;
});
function loadGamepadInfo(){
  const gamepads = navigator.getGamepads();
  if(gamepads[0]){
    gamepad = gamepads[0];
  }
  else{
    gamepad = null;
  }

}
async function showConnectedAlert() {
  const url = chrome.runtime.getURL("connected.html");
  const res = await fetch(url);
  const html = await res.text();

  // inject CSS
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = chrome.runtime.getURL("connectedAlert.css");
  document.head.appendChild(css);

  document.getElementById("connectedIndicator")?.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "connectedIndicatorWrapper";

  wrapper.innerHTML = html;
  const p = wrapper.querySelector("#connectedIndicatorP");
  if (p && gamepad) {
   p.textContent = "🎮" + gamepad.id + " connected";
  }
  document.body.appendChild(wrapper);

  // Faire disparaitre la notification
  setTimeout(() => {
    wrapper.style = "display: none;"
  }, 2500);
}
window.addEventListener("gamepadconnected", (event) => {
  gamepadIndex = event.gamepad.index;
  console.log("Gamepad connected:", event.gamepad.id);
  showConnectedAlert()
});



// Fonction pour séléctionner la vidéo 

let lastAxisX = 0;
let lastAxisY = 0;
function SelectVideo(){
  if(kbVisible) return;
  if(!gamepad) return;

  const path = location.pathname;

  // HOME / SEARCH
  if (!path.includes("/watch") && !path.includes("/results")) {

    if (thumbnails.length === 0) return;

    const axisX = gamepad.axes[0];

    if (axisX > 0.6 && lastAxisX <= 0.6) {
      selectedThumbnailIndex = Math.min(selectedThumbnailIndex + 1, thumbnails.length - 1);
    }

    if (axisX < -0.6 && lastAxisX >= -0.6) {
      selectedThumbnailIndex = Math.max(selectedThumbnailIndex - 1, 0);
    }


    
    lastAxisX = axisX;

  }


  // RESULTS PAGE
  if (path.includes("/results")) {

    if (gamepad && thumbnails.length > 0) {

      const axisY = gamepad.axes[1];

      if (axisY > 0.6 && lastAxisY <= 0.6) {
        selectedThumbnailIndex = Math.min(selectedThumbnailIndex + 1, thumbnails.length - 1);
      }

      if (axisY < -0.6 && lastAxisY >= -0.6) {
        selectedThumbnailIndex = Math.max(selectedThumbnailIndex - 1, 0);
      }

      lastAxisY = axisY;
    }
  }
  if (path.includes("/watch")) {
    if (gamepad && thumbnails.length > 0) {
      const axisY = gamepad.axes[1];
      const axisX = gamepad.axes[0];

      if (axisY > 0.6 && lastAxisY <= 0.6) {
        selectedThumbnailIndex = Math.min(selectedThumbnailIndex + 1, thumbnails.length - 1);
      }

      if (axisY < -0.6 && lastAxisY >= -0.6) {
        selectedThumbnailIndex = Math.max(selectedThumbnailIndex - 1, 0);
      }

      if (axisX > 0.6 && lastAxisX <= 0.6) {
        selectedThumbnailIndex = Math.min(selectedThumbnailIndex + 1, thumbnails.length - 1);
      }

      if (axisX < -0.6 && lastAxisX >= -0.6) {
        selectedThumbnailIndex = Math.max(selectedThumbnailIndex - 1, 0);
      }

      lastAxisX = axisX;
      lastAxisY = axisY;
    }
  }
}

function getSelected() {
  return thumbnails[selectedThumbnailIndex] || null;
}

function getSelectedLink(){
    const el = getSelected();
  if (!el) return null;

  return (
    el.querySelector("a#video-title-link") ||
    el.querySelector("a#video-title") ||
    el.querySelector("a")
  );
}

function applySelectedStyle(el) {
  if (!el) return;

  el.style.transform = "scale(1.15)";
  el.style.transition = "transform 0.2s ease";
  el.style.zIndex = "999";
  el.style.boxShadow = "0 0 12px rgba(255, 0, 0, 0.6)";
  el.style.borderRadius = "12px";
}

function clearSelectedStyle(el) {
  if (!el) return;

  el.style.transform = "";
  el.style.boxShadow = "";
  el.style.zIndex = "";
}

function updateSelectionUI() {
  if (domLocked) return;
  if (thumbnails.length === 0) return;

  thumbnails.forEach(t => clearSelectedStyle(t));

  const el = getSelected();
  if (!el) return;

  applySelectedStyle(el);

  el.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

// Anti spam des boutons

function isPressed(gp, index){
  if (!gp || !gp.buttons[index]) return false;

  const btn = gp.buttons[index];

  const prev = btn._prev || false;
  btn._prev = btn.pressed;

  return btn.pressed && !prev;
}

// Modifier le CSS de la thumbnail séléctionnée


// Loop principale

let isVideoPaused = true
let isNavigating = false;
let lastPath = location.pathname;
const watchState = {
  VIDEO: "VIDEO",
  LIST: "LIST"
};
let lastWatchAxisX = 0;
let currentWatchState = watchState.VIDEO



function beginNavigationLock(ms = 1200) {
  isNavigating = true;
  domLocked = true;

  setTimeout(() => {
    domLocked = false;

    if (location.pathname === lastPath) {
      isNavigating = false;
    }
  }, ms);
}

function checkNavigation() {
  if (domLocked) return;

  if (location.pathname !== lastPath) {

    lastPath = location.pathname;

    isNavigating = false;

    if (typeof closeKeyboard === "function") {
      closeKeyboard();
    }

    selectedThumbnailIndex = 0;
    lastAxisX = 0;
    lastAxisY = 0;

    getThumbnails();
  }
}

function selectWatchVideos() {
  if (!gamepad || thumbnails.length === 0) return;

  const axisY = gamepad.axes[1];

  if (axisY > 0.6 && lastAxisY <= 0.6) {
    selectedThumbnailIndex = Math.min(
      selectedThumbnailIndex + 1,
      thumbnails.length - 1
    );
  }

  if (axisY < -0.6 && lastAxisY >= -0.6) {
    selectedThumbnailIndex = Math.max(
      selectedThumbnailIndex - 1,
      0
    );
  }

  lastAxisY = axisY;
}
function mainLoop() {
  if (gamepadIndex !== null) {
    gamepad = navigator.getGamepads()[gamepadIndex];
  }

  checkNavigation();

  if (!gamepad || domLocked || isNavigating) {
    requestAnimationFrame(mainLoop);
    return;
  }

  const isWatch = location.pathname.includes("/watch");

  // =========================
  // HOME + RESULTS
  // =========================
  if (!isWatch) {
    SelectVideo();
    updateSelectionUI();

    if (
      isPressed(gamepad, bindings.PLAY_PAUSE) &&
      !kbVisible &&
      !isNavigating
    ) {
      const link = getSelectedLink();

      if (link) {
        beginNavigationLock(900);
        link.click();
      }
    }

    if (
      isPressed(gamepad, bindings.SEARCH) &&
      !kbVisible &&
      search_bar &&
      !isNavigating
    ) {
      createKeyboard();
    }

    if (
      isPressed(gamepad, bindings.BACK) &&
      !isNavigating
    ) {
      beginNavigationLock(900);
      history.back();
    }

    requestAnimationFrame(mainLoop);
    return;
  }

  // =========================
  // WATCH PAGE
  // =========================
  const video = document.querySelector("video");

  if (!video) {
    requestAnimationFrame(mainLoop);
    return;
  }

  const axisX = gamepad.axes[0] ?? 0;

  // VIDEO -> LIST
  if (
    currentWatchState === watchState.VIDEO &&
    axisX > 0.6 &&
    lastWatchAxisX <= 0.6
  ) {
    currentWatchState = watchState.LIST;

    getThumbnails();
    updateSelectionUI();
  }

  // LIST -> VIDEO
  if (
    currentWatchState === watchState.LIST &&
    axisX < -0.6 &&
    lastWatchAxisX >= -0.6
  ) {
    currentWatchState = watchState.VIDEO;

    thumbnails.forEach(clearSelectedStyle);
  }

  lastWatchAxisX = axisX;

  // =========================
  // VIDEO MODE
  // =========================
  if (currentWatchState === watchState.VIDEO) {

    if (isPressed(gamepad, bindings.PLAY_PAUSE)) {
      video.paused
        ? video.play()
        : video.pause();
    }

    if (isPressed(gamepad, bindings.FULLSCREEN)) {
      document.fullscreenElement
        ? document.exitFullscreen?.()
        : video.requestFullscreen?.();
    }
  }

  // =========================
  // LIST MODE
  // =========================
  if (currentWatchState === watchState.LIST) {

    SelectVideo(); // uniquement Y pour /watch
    updateSelectionUI();

    if (isPressed(gamepad, bindings.PLAY_PAUSE)) {
      const link = getSelectedLink();

      if (link) {
        beginNavigationLock(900);
        link.click();
      }
    }
  }

  // =========================
  // BACK
  // =========================
  if (
    isPressed(gamepad, bindings.BACK) &&
    !isNavigating
  ) {
    beginNavigationLock(900);
    history.back();
  }

  requestAnimationFrame(mainLoop);
}
mainLoop()
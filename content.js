let thumbnails = [];
let selectedThumbnailIndex = 0
let search_bar;
let domLocked = false;

function getThumbnails() {
  if(!location.pathname.includes("/results")){
    thumbnails = Array.from(
      document.querySelectorAll(
        'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer'
      )
    );
  }
  else if(location.pathname.includes("/results")){
    thumbnails = Array.from(
      document.querySelectorAll(
        "ytd-video-renderer"
      )
    )
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


window.addEventListener("gamepadconnected", (event) => {
  gamepadIndex = event.gamepad.index;
  console.log("Gamepad connected:", event.gamepad.id);
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
function mainLoop() {
  // Toujours refresh gamepad proprement
  if (gamepadIndex !== null) {
    gamepad = navigator.getGamepads()[gamepadIndex];
  }

  // check navigation YouTube
  checkNavigation();

  if (!gamepad || domLocked || isNavigating) {
    requestAnimationFrame(mainLoop);
    return;
  }

  const isWatch = location.pathname.includes("/watch");
  const isResults = location.pathname.includes("/results");

  // =========================
  // THUMBNAILS NAVIGATION
  // =========================
  if (!isWatch) {

    SelectVideo();
    updateSelectionUI();

    // éviter double click / spam navigation
    if (isPressed(gamepad, bindings.PLAY_PAUSE) && !kbVisible && !isNavigating) {

      const link = getSelectedLink();

      if (link) {
        beginNavigationLock(900);
        link.click();
      }
    }
  }

  // =========================
  // WATCH PAGE (VIDEO)
  // =========================
if (isWatch) {

  const video = document.querySelector("video");

  if (!video) return;

  // PLAY / PAUSE
  if (isPressed(gamepad, bindings.PLAY_PAUSE)) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  // FULLSCREEN
  if (isPressed(gamepad, bindings.FULLSCREEN)) {

    if (!document.fullscreenElement) {
      video.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
}
  // =========================
  // BACK BUTTON (global safe)
  // =========================
  if (isPressed(gamepad, bindings.BACK) && !isNavigating) {

    beginNavigationLock(900);
    history.back();
  }

  // =========================
  // SEARCH KEYBOARD
  // =========================
  if (
    isPressed(gamepad, bindings.SEARCH) &&
    !kbVisible &&
    search_bar &&
    !isNavigating
  ) {
    createKeyboard();
  }

  requestAnimationFrame(mainLoop);
}
mainLoop()
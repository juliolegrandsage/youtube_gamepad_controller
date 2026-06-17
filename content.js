let thumbnails = [];
let selectedIndex = 0;
let lastAxis = 0;
let isPlayingAVideo = false;
let lastButton0 = false;
let lastButton1 = false;
let lastButton2 = false;
let isFullScreen = false;

function scanThumbnails() {
  thumbnails = Array.from(document.querySelectorAll("ytd-rich-item-renderer"));
}

const observer = new MutationObserver(() => {
  const items = document.querySelectorAll("ytd-rich-item-renderer");
  if (items.length > 0) {
    thumbnails = Array.from(items);
    console.log("vidéos : " + thumbnails.length);
    observer.disconnect();
    selectThumbnail(0);
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("gamepadconnected", function(e) {
  console.log("manette co");
  document.body.style.zoom = "80%";
  let gp = navigator.getGamepads()[e.gamepad.index];
  console.log(gp.id);
});

function selectThumbnail(index) {
  if (thumbnails[selectedIndex]) {
    thumbnails[selectedIndex].style.outline = "";
    thumbnails[selectedIndex].style.transform = "";
    thumbnails[selectedIndex].style.zIndex = "";
  }
  selectedIndex = index;
  thumbnails[selectedIndex].style.transform = "scale(1.3)";
  thumbnails[selectedIndex].style.zIndex = "999"; // passe par-dessus les voisins
  thumbnails[selectedIndex].style.transition = "transform 0.15s ease";
  thumbnails[selectedIndex].scrollIntoView({ behavior: "smooth", block: "center" });

  if (selectedIndex >= thumbnails.length - 4) {
    scanThumbnails();
    console.log("rescan : " + thumbnails.length);
  }
}

let bindings = {
  PLAY_PAUSE: 0,
  BACK: 1,
  FULLSCREEN: 2
};

chrome.storage.sync.get("bindings", (data) => {
  if (data.bindings) {
    bindings = data.bindings;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.bindings) {
    bindings = changes.bindings.newValue;
    console.log("Bindings updated:", bindings);
  }
});
function isPressed(gp, index) {
  if (!gp.buttons[index]) return false;

  const current = gp.buttons[index].pressed;
  const previous = gp.buttons[index]._prev || false;

  gp.buttons[index]._prev = current;

  return current && !previous;
}
console.log("CONTENT SCRIPT LOAD", bindings);
function gameLoop() {
  const gp = navigator.getGamepads()[0];

  if (gp && thumbnails.length > 0) {

    const onHome = location.pathname !== "/watch";

    if (onHome) {

      const axisX = gp.axes[0];

      if (axisX > 0.5 && lastAxis <= 0.5) {
        selectThumbnail(Math.min(selectedIndex + 1, thumbnails.length - 1));
      } 
      else if (axisX < -0.5 && lastAxis >= -0.5) {
        selectThumbnail(Math.max(selectedIndex - 1, 0));
      }

      lastAxis = axisX;

      if (isPressed(gp, bindings.PLAY_PAUSE)) {
        thumbnails[selectedIndex]?.querySelector("a")?.click();
        isPlayingAVideo = true;
      }
    } 
    else {

      const video = document.querySelector("video");

      if (!video) {
        requestAnimationFrame(gameLoop);
        return;
      }

      if (isPressed(gp, bindings.PLAY_PAUSE)) {
        video.paused ? video.play() : video.pause();
      }

      if (isPressed(gp, bindings.BACK)) {
        history.back();
        isPlayingAVideo = false;
      }

      if (isPressed(gp, bindings.FULLSCREEN)) {
        if (!document.fullscreenElement) {
          video.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    }
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

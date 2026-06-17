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
  }
  selectedIndex = index;
  thumbnails[selectedIndex].style.outline = "3px solid red";
  thumbnails[selectedIndex].scrollIntoView({ behavior: "smooth", block: "center" });

  // rescanner quand on approche de la fin
  if (selectedIndex >= thumbnails.length - 4) {
    scanThumbnails();
    console.log("rescan : " + thumbnails.length);
  }
}

function gameLoop() {
  const gp = navigator.getGamepads()[0];
  if (gp && thumbnails.length > 0) {
    const button0 = gp.buttons[0]?.pressed;
    const button1 = gp.buttons[1]?.pressed;
    const button2 = gp.buttons[2]?.pressed;

    if (!isPlayingAVideo && location.href == "https://www.youtube.com/") {
      const axisX = gp.axes[0];
      if (axisX > 0.5 && lastAxis <= 0.5) {
        selectThumbnail(Math.min(selectedIndex + 1, thumbnails.length - 1));
      } else if (axisX < -0.5 && lastAxis >= -0.5) {
        selectThumbnail(Math.max(selectedIndex - 1, 0));
      }
      lastAxis = axisX;
      if (button0 && !lastButton0) {
        thumbnails[selectedIndex].querySelector("a").click();
        isPlayingAVideo = true;
      }
    } else {
      const video = document.querySelector("video");
      if (video && button0 && !lastButton0) {
        video.paused ? video.play() : video.pause();
      }
      if (isPlayingAVideo && button1 && !lastButton1) {
        isPlayingAVideo = false;
        history.go(-1);
      }
      if (isPlayingAVideo && button2 && !lastButton2) {
        if (!isFullScreen) {
          video.requestFullscreen();
          isFullScreen = true;
        } else {
          document.exitFullscreen();
          isFullScreen = false;
        }
      }
    }

    lastButton0 = button0;
    lastButton1 = button1;
    lastButton2 = button2;
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
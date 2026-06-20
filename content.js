let thumbnails = [];
let search_bar;
let selectedIndex = 0;
let lastAxis = 0;
let isPlayingAVideo = false;
let isFullScreen = false;
let gamepad_name = "";
let lastCount = 0;

function scanThumbnails() {
  if (isSearchPage()) {
    thumbnails = Array.from(document.querySelectorAll("ytd-thumbnail"));
  } else {
    thumbnails = Array.from(document.querySelectorAll("ytd-rich-item-renderer"));
  }
  search_bar = document.querySelector(
    "input#search, input[name='search_query'], .ytSearchboxComponentInput"
  );

  search_btn = document.querySelector(".ytSearchboxComponentSearchButton");
}
const observer = new MutationObserver(() => {

  if (isSearchPage()) {
    items = document.querySelectorAll("ytd-video-renderer");
    console.log("is search page")
  } else {
    items = document.querySelectorAll("ytd-rich-item-renderer");
  }

  if (thumbnails.length > 0) {
    console.log("thumbnails :", thumbnails.length);
    selectThumbnail(0);
  }
  if (items.length === lastCount) return;

  lastCount = items.length;   
});

observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("gamepadconnected", (e) => {
  const gp = navigator.getGamepads()[e.gamepad.index];
  document.body.style.zoom = "80%";
  console.log("manette co:", gp.id);

  chrome.storage.local.set({
    gamepad: {
      name: gp.id,
      index: e.gamepad.index
    }
  });
});

document.body.style.zoom = "80%";

function selectThumbnail(index) {
  if (thumbnails[selectedIndex]) {
    thumbnails[selectedIndex].style.outline = "";
    thumbnails[selectedIndex].style.transform = "";
    thumbnails[selectedIndex].style.zIndex = "";
  }
  selectedIndex = index;
  thumbnails[selectedIndex].style.transform = "scale(1.3)";
  thumbnails[selectedIndex].style.zIndex = "999";
  thumbnails[selectedIndex].style.transition = "transform 0.15s ease";
  thumbnails[selectedIndex].scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest"
  });

  if (selectedIndex >= thumbnails.length - 4) {
    scanThumbnails();
    console.log("rescan : " + thumbnails.length);
  }
}

let bindings = {
  PLAY_PAUSE: 0,
  BACK: 1,
  FULLSCREEN: 2,
  SEARCH: 3
};

chrome.storage.sync.get("bindings", (data) => {
  if (data.bindings) bindings = data.bindings;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.bindings) {
    bindings = changes.bindings.newValue;
    console.log("Bindings updated:", bindings);
  }
});

function isPressed(gp, index) {
  if (!gp || !gp.buttons || !gp.buttons[index]) return false;

  const current = gp.buttons[index].pressed;
  const previous = gp.buttons[index]._prev || false;

  gp.buttons[index]._prev = current;

  return current && !previous;
}
let enabled = true;

chrome.storage.sync.get("enabled", (data) => {
  enabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});
function playSelectedVideo() {
  const el = thumbnails[selectedIndex];
  if (!el) return;

  const link = el.querySelector("a#video-title") || el.querySelector("a");

  if (!link) return;

  link.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );
}
let hasBeenRefreshed = false 
function gameLoop() {
  const gp = navigator.getGamepads()[0];

  const backPressed = isPressed(gp, bindings.BACK);

  
  if (gp && enabled) {
    const onHome = location.pathname !== "/watch" && location.pathname !== "/results";

    if (kbVisible) {
      requestAnimationFrame(gameLoop);
      return;
    }

    if (isPressed(gp, bindings.SEARCH)) {
      if (search_bar) {
        search_bar.focus();
        createKeyboard();
      }
    }

    if (onHome) {
      if (thumbnails.length > 0) {
      const axis = isSearchPage() ? gp.axes[1] : gp.axes[0];
          if (axis > 0.5 && lastAxis <= 0.5) {
            selectThumbnail(Math.min(selectedIndex + 1, thumbnails.length - 1));
          } 
          else if (axis < -0.5 && lastAxis >= -0.5) {
            selectThumbnail(Math.max(selectedIndex - 1, 0));
          }
          console.log("axis:", axis, "lastAxis:", lastAxis);
          lastAxis = axis;

      if (isPressed(gp, bindings.PLAY_PAUSE) && !kbVisible) {
        console.log("PLAY VIDEO");
        playSelectedVideo();
      }

      }
      
    } else {
      if (video) {
        if(!kbVisible && !isPlayingAVideo) {
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
            document.body.style.zoom = "100%";
          } else {
            document.exitFullscreen();
            document.body.style.zoom = "80%";

            
          }}
        }

      }
    }
    if (backPressed) {
      if (!kbVisible && isSearchPage()) {
        history.back();
      } else if (!kbVisible && !isSearchPage()) {
        history.back();
        isPlayingAVideo = false;
      }
    }
  if (isSearchPage() && !hasBeenRefreshed) {
    closeKeyboard();
    scanThumbnails();
    selectThumbnail(0);
    hasBeenRefreshed = true;
    
  }
  }

  requestAnimationFrame(gameLoop);
}


function submitSearch() {
  console.log("submitSearch()");
  search_btn?.focus();
  search_btn?.click();
}
function isSearchPage() {
  return location.pathname === "/results";
}
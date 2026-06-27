(function () {
  window.__skidPendingEnter = false;
  window.__skidMainDone = false;

  var enterBtn = document.getElementById("enter-btn");
  var introCross = document.getElementById("intro-cross");
  var introSecret = document.getElementById("intro-secret");
  var cursorCross = document.getElementById("cursor-cross");
  var cursorTrail = document.getElementById("cursor-trail");

  function coverVideo(video) {
    if (!video || !video.videoWidth) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var videoRatio = video.videoWidth / video.videoHeight;
    var windowRatio = vw / vh;

    if (windowRatio > videoRatio) {
      video.style.width = vw + "px";
      video.style.height = Math.ceil(vw / videoRatio + 2) + "px";
    } else {
      video.style.height = vh + "px";
      video.style.width = Math.ceil(vh * videoRatio + 2) + "px";
    }

    video.style.transform = "translate(-50%, -50%)";
  }

  function runEnterShell() {
    if (window.__skidMainDone) return;
    window.__skidMainDone = true;

    var intro = document.getElementById("intro");
    var main = document.getElementById("main");
    var visitorPanel = document.getElementById("visitor-panel");
    var hudTop = document.getElementById("hud-top");
    var bgVideo = document.getElementById("bg-video");
    var videoShade = document.querySelector(".video-shade");

    if (intro) intro.classList.add("fade-out");

    setTimeout(function () {
      if (intro) intro.style.display = "none";
      if (main) {
        main.classList.remove("hidden");
        main.classList.add("visible");
      }
      if (visitorPanel) visitorPanel.classList.add("visible");
      if (hudTop) hudTop.classList.add("visible");

      if (bgVideo) {
        coverVideo(bgVideo);
        bgVideo.classList.add("active");
        if (videoShade) videoShade.classList.add("active");
        bgVideo.removeAttribute("muted");
        bgVideo.muted = false;
        bgVideo.volume = 1;
        bgVideo.play().catch(function () {});
      }

      if (typeof window.__skidAfterEnter === "function") {
        window.__skidAfterEnter();
      }
    }, 1200);
  }

  function tryEnter() {
    if (typeof window.__skidEnter === "function") {
      window.__skidEnter();
      return;
    }

    if (window.__skidMainDone) return;

    window.__skidPendingEnter = true;
    runEnterShell();
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", tryEnter);
    enterBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tryEnter();
      }
    });
  }

  if (introCross) {
    introCross.addEventListener("click", function () {
      if (introSecret) introSecret.classList.add("visible");
    });
  }

  function initCursor() {
    if (!cursorCross || !cursorTrail || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    cursorCross.style.display = "block";
    cursorTrail.style.display = "block";

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var tx = mx;
    var ty = my;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function tick() {
      tx += (mx - tx) * 0.18;
      ty += (my - ty) * 0.18;
      cursorCross.style.transform = "translate(" + mx + "px, " + my + "px) translate(-50%, -50%)";
      cursorTrail.style.transform = "translate(" + tx + "px, " + ty + "px) translate(-50%, -50%)";
      requestAnimationFrame(tick);
    }

    tick();
  }

  initCursor();

  var attempts = 0;
  var poll = setInterval(function () {
    attempts += 1;
    if (typeof window.__skidAppReady === "boolean" && window.__skidAppReady) {
      if (window.__skidPendingEnter && typeof window.__skidEnter === "function") {
        window.__skidPendingEnter = false;
        window.__skidEnter();
      }
      clearInterval(poll);
      return;
    }
    if (attempts >= 240) clearInterval(poll);
  }, 250);
})();

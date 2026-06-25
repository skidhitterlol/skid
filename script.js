const INTRO_HOLD_MS = 800;
const CROSS_FADE_MS = 2000;
const TYPE_SPEED_MS = 65;

const intro = document.getElementById("intro");
const main = document.getElementById("main");
const bgVideo = document.getElementById("bg-video");
const videoShade = document.querySelector(".video-shade");
const titleEl = document.getElementById("title-text");
const quoteEl = document.getElementById("quote-text");
const visitorPanel = document.getElementById("visitor-panel");
const visitorIp = document.getElementById("visitor-ip");
const visitorLocation = document.getElementById("visitor-location");
const visitorProvider = document.getElementById("visitor-provider");
const menuToggle = document.querySelector(".menu-toggle");
const menuList = document.querySelector(".menu-list");

function coverVideo() {
  if (!bgVideo?.videoWidth) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const videoRatio = bgVideo.videoWidth / bgVideo.videoHeight;
  const windowRatio = vw / vh;

  if (windowRatio > videoRatio) {
    bgVideo.style.width = `${Math.ceil(vw)}px`;
    bgVideo.style.height = `${Math.ceil(vw / videoRatio + 2)}px`;
  } else {
    bgVideo.style.height = `${Math.ceil(vh)}px`;
    bgVideo.style.width = `${Math.ceil(vh * videoRatio + 2)}px`;
  }

  bgVideo.style.transform = "translate(-50%, -50%)";
}

async function startVideo() {
  if (!bgVideo) return;

  bgVideo.muted = false;
  bgVideo.volume = 0.6;

  try {
    await bgVideo.play();
  } catch {
    bgVideo.muted = true;
    try {
      await bgVideo.play();
    } catch {
      /* blocked until user interacts */
    }
  }

  coverVideo();
  bgVideo.classList.add("active");
  videoShade.classList.add("active");
}

function unmuteOnInteraction() {
  if (!bgVideo || !bgVideo.muted) return;
  bgVideo.muted = false;
  bgVideo.volume = 0.6;
  bgVideo.play().catch(() => {});
}

document.addEventListener("click", unmuteOnInteraction, { once: true });
window.addEventListener("resize", coverVideo);
bgVideo?.addEventListener("loadedmetadata", coverVideo);

async function loadVisitorInfo() {
  try {
    const res = await fetch("https://ipwho.is/");
    if (!res.ok) throw new Error("lookup failed");
    const data = await res.json();
    if (!data.success) throw new Error("lookup failed");

    visitorIp.textContent = data.ip || "unknown";
    visitorLocation.textContent = [data.city, data.region, data.country]
      .filter(Boolean)
      .join(", ") || "unknown";
    visitorProvider.textContent = data.connection?.isp || "unknown";
  } catch {
    visitorIp.textContent = "unavailable";
    visitorLocation.textContent = "unavailable";
    visitorProvider.textContent = "unavailable";
  }
}

loadVisitorInfo();

function typeText(element, text, speed) {
  return new Promise((resolve) => {
    element.classList.add("active");
    element.innerHTML = '<span class="cursor">|</span>';

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent = text.slice(0, i + 1);
        element.innerHTML =
          element.textContent + '<span class="cursor">|</span>';
        i++;
      } else {
        clearInterval(interval);
        element.innerHTML = text;
        resolve();
      }
    }, speed);
  });
}

function showMain() {
  intro.classList.add("fade-out");

  setTimeout(() => {
    intro.style.display = "none";
    main.classList.remove("hidden");
    startVideo();

    requestAnimationFrame(() => {
      main.classList.add("visible");
      visitorPanel.classList.add("visible");
    });

    setTimeout(async () => {
      await typeText(titleEl, "[ skid]", TYPE_SPEED_MS);
      await new Promise((r) => setTimeout(r, 500));
      await typeText(
        quoteEl,
        '"The memory of everything is very soon overwhelmed in time."',
        TYPE_SPEED_MS - 10
      );
    }, 2000);
  }, 1200);
}

setTimeout(showMain, CROSS_FADE_MS + INTRO_HOLD_MS);

menuToggle.addEventListener("click", () => {
  const isOpen = menuList.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "≡";
});

menuList.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    menuList.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "≡";
  });
});

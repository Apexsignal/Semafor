"use strict";

// Stejne HSV rozsahy a prah jako v detector.py - viz README pro vysvetleni.
const COLOR_RANGES = {
  cervena: [[[0, 100, 100], [10, 255, 255]], [[160, 100, 100], [179, 255, 255]]],
  oranzova: [[[11, 100, 100], [25, 255, 255]]],
  zelena: [[[40, 70, 70], [90, 255, 255]]],
};
const MIN_FILL_RATIO = 0.35;

const STOP_SPEED_KMH = 5; // pod touhle rychlosti se auto povazuje za stojici
const DETECT_INTERVAL_MS = 500;
const DEBOUNCE_MS = 1000;
const MAX_FRAME_SIDE = 480; // downscale snimku pred zpracovanim kvuli rychlosti

const CS_HLAS = {
  cervena: "Cervena",
  oranzova: "Oranzova, pripravit",
  zelena: "Zelena, jed",
};

const els = {
  video: document.getElementById("video"),
  overlay: document.getElementById("overlay"),
  stav: document.getElementById("stav"),
  banner: document.getElementById("banner"),
  rychlost: document.getElementById("rychlost"),
  detekceStav: document.getElementById("detekce-stav"),
  vzdyDetekovat: document.getElementById("vzdy-detekovat"),
  start: document.getElementById("start"),
};

let cvReady = false;
let lastSpeedKmh = null;
let geoAvailable = false;
let lastState = null;
let lastChangeTs = 0;
let colorMats = null;
let colorMatsSize = null;
let processing = false;

function waitForCv() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.cv && cv.Mat) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
  els.video.srcObject = stream;
  await new Promise((resolve) => {
    els.video.onloadedmetadata = resolve;
  });
  await els.video.play();
}

function setupGeolocation() {
  if (!("geolocation" in navigator)) {
    els.detekceStav.textContent = "GPS nedostupne v prohlizeci";
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      geoAvailable = true;
      const speedMs = pos.coords.speed;
      lastSpeedKmh = speedMs === null || Number.isNaN(speedMs) ? null : speedMs * 3.6;
      els.rychlost.textContent = lastSpeedKmh === null ? "--" : Math.round(lastSpeedKmh);
    },
    () => {
      geoAvailable = false;
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
  );
}

function shouldDetectNow() {
  if (els.vzdyDetekovat.checked) return true;
  if (!geoAvailable || lastSpeedKmh === null) {
    els.banner.textContent = "GPS rychlost nedostupna - detekuji porad";
    return true;
  }
  els.banner.textContent = "";
  return lastSpeedKmh <= STOP_SPEED_KMH;
}

function ensureColorMats(rows, cols) {
  if (colorMatsSize && colorMatsSize.rows === rows && colorMatsSize.cols === cols) return;
  if (colorMats) {
    for (const ranges of Object.values(colorMats)) {
      for (const { low, high } of ranges) {
        low.delete();
        high.delete();
      }
    }
  }
  colorMats = {};
  for (const [name, ranges] of Object.entries(COLOR_RANGES)) {
    colorMats[name] = ranges.map(([lo, hi]) => ({
      low: new cv.Mat(rows, cols, cv.CV_8UC3, new cv.Scalar(lo[0], lo[1], lo[2], 0)),
      high: new cv.Mat(rows, cols, cv.CV_8UC3, new cv.Scalar(hi[0], hi[1], hi[2], 0)),
    }));
  }
  colorMatsSize = { rows, cols };
}

// Zrcadli detector.py: Houghovy kruznice + podil HSV barevne masky uvnitr kruhu.
function detect(srcRGBA) {
  const gray = new cv.Mat();
  cv.cvtColor(srcRGBA, gray, cv.COLOR_RGBA2GRAY);
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 2, 2, cv.BORDER_DEFAULT);

  const rgb = new cv.Mat();
  cv.cvtColor(srcRGBA, rgb, cv.COLOR_RGBA2RGB);
  const hsv = new cv.Mat();
  cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
  rgb.delete();

  ensureColorMats(hsv.rows, hsv.cols);

  const circles = new cv.Mat();
  cv.HoughCircles(
    blurred,
    circles,
    cv.HOUGH_GRADIENT,
    1,
    Math.max(Math.floor(blurred.rows / 8), 1),
    100,
    22,
    5,
    Math.max(Math.floor(Math.min(blurred.rows, blurred.cols) / 4), 10)
  );

  let best = null;

  for (let i = 0; i < circles.cols; i++) {
    const x = circles.data32F[i * 3];
    const y = circles.data32F[i * 3 + 1];
    const r = circles.data32F[i * 3 + 2];

    const mask = cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1);
    cv.circle(mask, new cv.Point(x, y), r, new cv.Scalar(255, 255, 255, 255), -1);
    const circleArea = cv.countNonZero(mask);
    if (circleArea === 0) {
      mask.delete();
      continue;
    }

    for (const [colorName, ranges] of Object.entries(colorMats)) {
      const colorMask = cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1);
      for (const { low, high } of ranges) {
        const partial = new cv.Mat();
        cv.inRange(hsv, low, high, partial);
        cv.bitwise_or(colorMask, partial, colorMask);
        partial.delete();
      }
      const overlap = new cv.Mat();
      cv.bitwise_and(colorMask, mask, overlap);
      const match = cv.countNonZero(overlap);
      colorMask.delete();
      overlap.delete();

      const ratio = match / circleArea;
      if (ratio >= MIN_FILL_RATIO && (!best || ratio > best.confidence)) {
        best = { color: colorName, confidence: ratio, x, y, r };
      }
    }
    mask.delete();
  }

  gray.delete();
  blurred.delete();
  hsv.delete();
  circles.delete();

  return best;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "cs-CZ";
  window.speechSynthesis.speak(u);
}

function drawOverlay(result, width, height) {
  const canvas = els.overlay;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!result) return;
  const colorCss = { cervena: "#ff4d4d", oranzova: "#ffa500", zelena: "#37d67a" }[result.color];
  ctx.strokeStyle = colorCss;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(result.x, result.y, result.r, 0, Math.PI * 2);
  ctx.stroke();
}

function updateStav(result) {
  const now = performance.now();
  const state = result ? result.color : null;

  if (state !== lastState && now - lastChangeTs > DEBOUNCE_MS) {
    lastState = state;
    lastChangeTs = now;
    if (state) speak(CS_HLAS[state]);
  }

  els.stav.textContent = state || "-";
  els.stav.className = state || "zadna";
  els.stav.dataset.color = state || "";
}

function tick() {
  if (processing || !cvReady || els.video.readyState < 2) return;

  if (!shouldDetectNow()) {
    const speedTxt = lastSpeedKmh === null ? "?" : Math.round(lastSpeedKmh);
    els.detekceStav.textContent = `jede se (${speedTxt} km/h) - detekce pauzne`;
    drawOverlay(null, els.overlay.width || 1, els.overlay.height || 1);
    updateStav(null);
    return;
  }

  els.detekceStav.textContent = "detekuji";
  processing = true;
  try {
    const w = els.video.videoWidth;
    const h = els.video.videoHeight;
    const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));

    const tmp = document.createElement("canvas");
    tmp.width = cw;
    tmp.height = ch;
    tmp.getContext("2d").drawImage(els.video, 0, 0, cw, ch);
    const src = cv.imread(tmp);

    const result = detect(src);
    src.delete();

    drawOverlay(result, cw, ch);
    updateStav(result);
  } finally {
    processing = false;
  }
}

els.start.addEventListener("click", async () => {
  els.start.disabled = true;
  els.start.textContent = "Nacitam...";
  await waitForCv();
  cvReady = true;
  await setupCamera();
  setupGeolocation();
  els.start.style.display = "none";
  setInterval(tick, DETECT_INTERVAL_MS);
});

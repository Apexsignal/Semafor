"use strict";

/* ---------- Czech labels for the 80 COCO-SSD classes ---------- */
const CZ_LABELS = {
  person: "osoba", bicycle: "kolo", car: "auto", motorcycle: "motorka",
  airplane: "letadlo", bus: "autobus", train: "vlak", truck: "náklaďák",
  boat: "loď", "traffic light": "semafor", "fire hydrant": "hydrant",
  "stop sign": "značka stop", "parking meter": "parkovací automat",
  bench: "lavička", bird: "pták", cat: "kočka", dog: "pes", horse: "kůň",
  sheep: "ovce", cow: "kráva", elephant: "slon", bear: "medvěd",
  zebra: "zebra", giraffe: "žirafa", backpack: "batoh", umbrella: "deštník",
  handbag: "kabelka", tie: "kravata", suitcase: "kufr", frisbee: "frisbee",
  skis: "lyže", snowboard: "snowboard", "sports ball": "míč", kite: "drak",
  "baseball bat": "baseballová pálka", "baseball glove": "baseballová rukavice",
  skateboard: "skateboard", surfboard: "surf", "tennis racket": "tenisová raketa",
  bottle: "láhev", "wine glass": "sklenice na víno", cup: "hrnek",
  fork: "vidlička", knife: "nůž", spoon: "lžíce", bowl: "miska",
  banana: "banán", apple: "jablko", sandwich: "sendvič", orange: "pomeranč",
  broccoli: "brokolice", carrot: "mrkev", "hot dog": "hot dog", pizza: "pizza",
  donut: "donut", cake: "dort", chair: "židle", couch: "pohovka",
  "potted plant": "květina v květináči", bed: "postel",
  "dining table": "jídelní stůl", toilet: "záchod", tv: "televize",
  laptop: "notebook", mouse: "myš", remote: "dálkový ovladač",
  keyboard: "klávesnice", "cell phone": "mobil", microwave: "mikrovlnka",
  oven: "trouba", toaster: "toustovač", sink: "dřez", refrigerator: "lednička",
  book: "kniha", clock: "hodiny", vase: "váza", scissors: "nůžky",
  "teddy bear": "plyšák", "hair drier": "fén", toothbrush: "kartáček na zuby",
};
function czLabel(cls) { return CZ_LABELS[cls] || cls; }

/* ---------- Named colors (Czech) for nearest-color lookup ---------- */
const NAMED_COLORS = [
  { name: "černá", rgb: [15, 15, 15] },
  { name: "bílá", rgb: [245, 245, 245] },
  { name: "šedá", rgb: [130, 130, 130] },
  { name: "červená", rgb: [214, 40, 40] },
  { name: "oranžová", rgb: [235, 130, 30] },
  { name: "žlutá", rgb: [235, 210, 40] },
  { name: "zelená", rgb: [45, 165, 70] },
  { name: "tyrkysová", rgb: [35, 185, 185] },
  { name: "modrá", rgb: [35, 95, 215] },
  { name: "fialová", rgb: [140, 65, 195] },
  { name: "růžová", rgb: [225, 110, 170] },
  { name: "hnědá", rgb: [110, 70, 40] },
  { name: "béžová", rgb: [215, 195, 165] },
];
function nearestColorName({ r, g, b }) {
  let best = null, bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const [cr, cg, cb] = c.rgb;
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best.name;
}

/* ---------- Global state ---------- */
const state = {
  video: null, canvas: null, ctx: null,
  model: null,
  running: false,
  mode: "objects", // 'objects' | 'color' | 'measure' | 'walk'
  settings: { voice: true, sensitivity: 0.45, detectIntervalMs: 300 },
  calibration: { pxPerCm: null, refWidthCm: 8.56 },
  calibrating: false,
  calibratePoints: [],
  measurePoints: [],
  lastMeasurement: null,
  colorMarker: null,
  lastPredictions: [],
  lastAnnounced: new Map(),
  lastWalkWarnAt: 0,
  _hintTimer: null,
};

const LS_SETTINGS_KEY = "vision_assistant_settings_v1";
const LS_API_KEY = "vision_assistant_api_key";

/* ---------- Speech ---------- */
let czVoice = null;
function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  czVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("cs")) || null;
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
}
function speak(text, { interrupt = false } = {}) {
  if (!("speechSynthesis" in window) || !state.settings.voice) return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (czVoice) u.voice = czVoice;
  u.lang = "cs-CZ";
  u.rate = 1.02;
  speechSynthesis.speak(u);
}

/* ---------- Camera & model boot ---------- */
async function startCamera() {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
    throw new Error("NO_MEDIA_DEVICES");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  state.video.srcObject = stream;
  await state.video.play();
}

function errMessage(err) {
  if (err && err.message === "NO_MEDIA_DEVICES") {
    return "Appka potřebuje zabezpečené připojení (HTTPS) nebo localhost a prohlížeč s podporou kamery.";
  }
  const name = err && err.name;
  if (name === "NotAllowedError") return "Appka nemá povolení ke kameře — povol ho v nastavení prohlížeče a obnov stránku.";
  if (name === "NotFoundError") return "Appka nenašla žádnou kameru.";
  if (name === "NotReadableError") return "Kamera je obsazená jinou appkou.";
  return "Něco se nepovedlo: " + (err && err.message ? err.message : String(err));
}

async function boot() {
  try {
    setBootMsg("Spouštím kameru…");
    await startCamera();
    setBootMsg("Načítám model rozpoznávání…");
    state.model = await cocoSsd.load();
    hideBootScreen();
    setStatus("ready", "Připraveno");
    state.running = true;
    requestAnimationFrame(drawLoop);
    detectTick();
  } catch (err) {
    console.error(err);
    showBootError(errMessage(err));
    setStatus("error", "Chyba");
  }
}

function setBootMsg(t) { document.getElementById("boot-msg").textContent = t; }
function hideBootScreen() { document.getElementById("boot-screen").classList.add("hidden"); }
function showBootError(msg) {
  document.getElementById("boot-msg").textContent = "Appka se nemohla spustit";
  const el = document.getElementById("boot-error");
  el.textContent = msg;
  el.hidden = false;
}
function setStatus(kind, text) {
  document.getElementById("status-dot").className = kind;
  document.getElementById("status-text").textContent = text;
}

/* ---------- Canvas sizing ---------- */
function resizeCanvas() {
  const v = state.video;
  if (!v.videoWidth) return;
  state.canvas.width = v.videoWidth;
  state.canvas.height = v.videoHeight;
}

/* ---------- Coordinate mapping (inverts CSS object-fit:cover) ---------- */
function clientToCanvasCoords(evt, canvas) {
  const rect = canvas.getBoundingClientRect();
  const cssX = evt.clientX - rect.left;
  const cssY = evt.clientY - rect.top;
  const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
  const dispW = canvas.width * scale, dispH = canvas.height * scale;
  const offX = (rect.width - dispW) / 2, offY = (rect.height - dispH) / 2;
  return { x: (cssX - offX) / scale, y: (cssY - offY) / scale };
}

/* ---------- Detection loop (throttled, independent of draw) ---------- */
function detectTick() {
  if (!state.running) return;
  const start = performance.now();
  state.model.detect(state.video).then(preds => {
    state.lastPredictions = preds;
    handleMode(preds);
    const elapsed = performance.now() - start;
    const wait = Math.max(0, state.settings.detectIntervalMs - elapsed);
    setTimeout(detectTick, wait);
  }).catch(err => {
    console.error("detect error", err);
    setTimeout(detectTick, state.settings.detectIntervalMs);
  });
}

function handleMode(preds) {
  if (state.mode === "objects") narrateNewObjects(preds);
  else if (state.mode === "walk") walkAssistCheck(preds);
}

function narrateNewObjects(preds) {
  const now = Date.now();
  preds.forEach(p => {
    if (p.score < 0.55) return;
    const last = state.lastAnnounced.get(p.class) || 0;
    if (now - last > 8000) {
      state.lastAnnounced.set(p.class, now);
      speak(czLabel(p.class));
    }
  });
}

function walkAssistCheck(preds) {
  const now = Date.now();
  if (now - state.lastWalkWarnAt < 2500) return;
  const cw = state.canvas.width, ch = state.canvas.height;
  const threshold = 0.85 - state.settings.sensitivity; // higher sensitivity -> warns earlier
  let closest = null;
  preds.forEach(p => {
    if (p.score < 0.5) return;
    const [x, y, w, h] = p.bbox;
    const heightFrac = h / ch;
    const centerX = x + w / 2;
    const inCenterZone = centerX > cw * 0.2 && centerX < cw * 0.8;
    if (inCenterZone && heightFrac > threshold) {
      if (!closest || heightFrac > closest.heightFrac) closest = { p, heightFrac, centerX };
    }
  });
  if (closest) {
    state.lastWalkWarnAt = now;
    const side = closest.centerX < cw * 0.4 ? "vlevo" : closest.centerX > cw * 0.6 ? "vpravo" : "přímo před tebou";
    speak(`Pozor, překážka ${side}: ${czLabel(closest.p.class)}`, { interrupt: true });
  }
}

/* ---------- Drawing ---------- */
function drawLoop() {
  if (!state.running) return;
  const ctx = state.ctx;
  ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  if (state.mode === "objects" || state.mode === "walk") {
    drawBoxes(state.lastPredictions);
  } else if (state.mode === "color") {
    if (state.colorMarker && Date.now() - state.colorMarker.ts < 4000) drawColorSwatch(state.colorMarker);
  } else if (state.mode === "measure") {
    drawBoxes(state.lastPredictions, { dim: true });
    drawCalibrationOrMeasurement();
  }
  requestAnimationFrame(drawLoop);
}

function drawBoxes(preds, opts = {}) {
  const ctx = state.ctx;
  preds.forEach(p => {
    if (p.score < 0.5) return;
    const [x, y, w, h] = p.bbox;
    ctx.strokeStyle = opts.dim ? "rgba(46,230,198,.35)" : "#2ee6c6";
    ctx.lineWidth = Math.max(2, state.canvas.width / 400);
    ctx.strokeRect(x, y, w, h);
    if (!opts.dim) drawLabel(x, y, `${czLabel(p.class)} ${Math.round(p.score * 100)}%`);
  });
}

function drawPoint(p, color) {
  const ctx = state.ctx;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(4, state.canvas.width / 250), 0, Math.PI * 2);
  ctx.fill();
}

function drawColorSwatch(m) {
  const ctx = state.ctx;
  drawPoint(m, `rgb(${m.rgb.r},${m.rgb.g},${m.rgb.b})`);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(m.x, m.y, Math.max(4, state.canvas.width / 250), 0, Math.PI * 2);
  ctx.stroke();
  drawLabel(m.x + 14, m.y - 14, m.label, {});
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLabel(x, y, text, opts = {}) {
  const ctx = state.ctx;
  const fontSize = Math.max(13, state.canvas.width / 55);
  ctx.font = `600 ${fontSize}px -apple-system, sans-serif`;
  const paddingX = 6, paddingY = 4;
  const w = ctx.measureText(text).width + paddingX * 2;
  const h = fontSize + paddingY * 2;
  let lx = x, ly = y - h - 4;
  if (opts.center) { lx = x - w / 2; ly = y - h - 8; }
  if (ly < 0) ly = y + 6;
  ctx.fillStyle = "rgba(8,9,11,.8)";
  roundRect(ctx, lx, ly, w, h, 6);
  ctx.fill();
  ctx.fillStyle = "#f4f4f2";
  ctx.fillText(text, lx + paddingX, ly + h - paddingY - 3);
}

function drawCalibrationOrMeasurement() {
  const ctx = state.ctx;
  const pts = state.calibrating ? state.calibratePoints : state.measurePoints;
  pts.forEach(p => drawPoint(p, state.calibrating ? "#ffb020" : "#2ee6c6"));
  if (state.lastMeasurement && !state.calibrating && state.measurePoints.length === 0) {
    const { a, b, cm } = state.lastMeasurement;
    ctx.strokeStyle = "#2ee6c6";
    ctx.lineWidth = Math.max(2, state.canvas.width / 300);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    drawPoint(a, "#2ee6c6"); drawPoint(b, "#2ee6c6");
    drawLabel((a.x + b.x) / 2, (a.y + b.y) / 2, `${cm.toFixed(1)} cm (odhad)`, { center: true });
  }
}

/* ---------- Canvas taps: color sampling & measurement ---------- */
function sampleColorAt(xNative, yNative) {
  const cap = document.getElementById("capture-canvas");
  cap.width = state.video.videoWidth;
  cap.height = state.video.videoHeight;
  const cctx = cap.getContext("2d");
  cctx.drawImage(state.video, 0, 0, cap.width, cap.height);
  const px = Math.max(0, Math.min(cap.width - 1, Math.round(xNative)));
  const py = Math.max(0, Math.min(cap.height - 1, Math.round(yNative)));
  const d = cctx.getImageData(px, py, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2] };
}

function onCanvasClick(evt) {
  const { x, y } = clientToCanvasCoords(evt, state.canvas);
  if (state.mode === "color") {
    const rgb = sampleColorAt(x, y);
    const name = nearestColorName(rgb);
    state.colorMarker = { x, y, rgb, ts: Date.now(), label: name };
    showHint(`Barva: ${name}`);
    speak(`Barva: ${name}`, { interrupt: true });
  } else if (state.mode === "measure") {
    handleMeasureTap(x, y);
  }
}

function handleMeasureTap(x, y) {
  if (state.calibrating) {
    state.calibratePoints.push({ x, y });
    if (state.calibratePoints.length === 2) {
      const [a, b] = state.calibratePoints;
      const distPx = Math.hypot(b.x - a.x, b.y - a.y);
      const refCm = parseFloat(document.getElementById("ref-width").value) || 8.56;
      state.calibration.pxPerCm = distPx / refCm;
      state.calibration.refWidthCm = refCm;
      state.calibrating = false;
      state.calibratePoints = [];
      persistSettings();
      updateCalibStatus();
      showHint("Kalibrace hotová. Teď ťukni na dva krajní body měřeného předmětu.");
      speak("Kalibrace hotová", { interrupt: true });
    } else {
      showHint("Teď ťukni na druhý okraj reference.", 0);
    }
    return;
  }
  if (!state.calibration.pxPerCm) {
    showHint("Appka ještě není kalibrovaná — otevři nastavení (ozubené kolo) a klikni na Kalibrovat.");
    return;
  }
  state.measurePoints.push({ x, y });
  if (state.measurePoints.length === 2) {
    const [a, b] = state.measurePoints;
    const distPx = Math.hypot(b.x - a.x, b.y - a.y);
    const cm = distPx / state.calibration.pxPerCm;
    state.lastMeasurement = { a, b, cm };
    state.measurePoints = [];
    showHint(`Odhad: ${cm.toFixed(1)} cm`);
    speak(`Přibližně ${cm.toFixed(0)} centimetrů`, { interrupt: true });
  } else {
    showHint("Ťukni na druhý bod, který chceš změřit.", 0);
  }
}

/* ---------- Hints ---------- */
function showHint(text, ms = 5000) {
  const el = document.getElementById("hint-bar");
  el.innerHTML = "";
  const span = document.createElement("span");
  span.textContent = text;
  el.appendChild(span);
  clearTimeout(state._hintTimer);
  if (ms > 0) state._hintTimer = setTimeout(() => { el.innerHTML = ""; }, ms);
}

/* ---------- Mode switching ---------- */
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-btn[data-mode]").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  state.measurePoints = [];
  if (mode !== "measure") { state.calibrating = false; state.calibratePoints = []; }
  const hints = {
    objects: "Appka nahlas řekne, co pozná (auto, osoba, pes…).",
    color: "Ťukni kamkoliv na obraz — appka řekne barvu.",
    measure: state.calibration.pxPerCm
      ? "Ťukni na dva krajní body předmětu, který chceš změřit."
      : "Appka ještě není kalibrovaná — otevři nastavení (ozubené kolo) a klikni na Kalibrovat.",
    walk: "Appka bude nahlas upozorňovat na překážky v cestě.",
  };
  showHint(hints[mode] || "");
}

/* ---------- AI "describe what I see" (uses user's own Anthropic key) ---------- */
function captureFrameDataUrl() {
  const cap = document.getElementById("capture-canvas");
  cap.width = state.video.videoWidth;
  cap.height = state.video.videoHeight;
  const cctx = cap.getContext("2d");
  cctx.drawImage(state.video, 0, 0, cap.width, cap.height);
  return cap.toDataURL("image/jpeg", 0.85);
}

async function askAI() {
  const key = (localStorage.getItem(LS_API_KEY) || "").trim();
  if (!key) {
    document.getElementById("settings-overlay").hidden = false;
    showHint("Nejdřív appce zadej Anthropic API klíč v nastavení.");
    return;
  }
  const panel = document.getElementById("ai-panel");
  const textEl = document.getElementById("ai-text");
  panel.hidden = false;
  textEl.textContent = "Analyzuju obraz…";
  try {
    const base64 = captureFrameDataUrl().split(",")[1];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            {
              type: "text",
              text: "Popiš česky a věcně, co je na fotce vidět — konkrétní věci (např. druh stromu, značka/typ auta, co teče v řece, název ulice pokud je čitelný z cedule). Piš krátce, 2-4 věty, jako pro člověka, co se dívá poprvé.",
            },
          ],
        }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API chyba ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = (data.content || []).map(c => c.text || "").join(" ").trim() || "Appka nedostala žádnou odpověď.";
    textEl.textContent = text;
    speak(text, { interrupt: true });
  } catch (err) {
    console.error(err);
    textEl.textContent = "Nepodařilo se získat popis: " + (err.message || err);
  }
}

/* ---------- Settings persistence ---------- */
function persistSettings() {
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify({
    settings: state.settings,
    calibration: state.calibration,
  }));
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(state.settings, saved.settings || {});
      if (saved.calibration) state.calibration = saved.calibration;
    }
  } catch (e) { /* ignore corrupt storage */ }
  document.getElementById("api-key").value = localStorage.getItem(LS_API_KEY) || "";
}
function updateCalibStatus() {
  const el = document.getElementById("calib-status");
  el.textContent = state.calibration.pxPerCm
    ? `Kalibrováno (referenční šířka ${state.calibration.refWidthCm} cm)`
    : "Nekalibrováno";
}

/* ---------- Wiring ---------- */
function wireUI() {
  document.querySelectorAll(".mode-btn[data-mode]").forEach(b => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });
  document.getElementById("btn-ai").addEventListener("click", askAI);
  document.getElementById("ai-close").addEventListener("click", () => {
    document.getElementById("ai-panel").hidden = true;
  });

  document.getElementById("btn-settings").addEventListener("click", () => {
    document.getElementById("settings-overlay").hidden = false;
  });
  document.getElementById("settings-close").addEventListener("click", closeSettings);
  document.getElementById("settings-overlay").addEventListener("click", e => {
    if (e.target.id === "settings-overlay") closeSettings();
  });

  const voiceEl = document.getElementById("toggle-voice");
  voiceEl.checked = state.settings.voice;
  voiceEl.addEventListener("change", () => { state.settings.voice = voiceEl.checked; persistSettings(); });

  const sensEl = document.getElementById("sensitivity");
  sensEl.value = state.settings.sensitivity;
  sensEl.addEventListener("input", () => { state.settings.sensitivity = parseFloat(sensEl.value); persistSettings(); });

  const fpsEl = document.getElementById("detect-fps");
  fpsEl.value = String(state.settings.detectIntervalMs);
  fpsEl.addEventListener("change", () => { state.settings.detectIntervalMs = parseInt(fpsEl.value, 10); persistSettings(); });

  document.getElementById("ref-width").value = state.calibration.refWidthCm;

  document.getElementById("btn-calibrate").addEventListener("click", () => {
    state.calibrating = true;
    state.calibratePoints = [];
    closeSettings();
    setMode("measure");
    showHint("Ťukni na levý okraj reference, pak na pravý.", 0);
  });

  document.getElementById("api-key").addEventListener("change", e => {
    localStorage.setItem(LS_API_KEY, e.target.value.trim());
  });

  state.canvas.addEventListener("click", onCanvasClick);
  state.video.addEventListener("loadedmetadata", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);

  updateCalibStatus();
}
function closeSettings() { document.getElementById("settings-overlay").hidden = true; }

/* ---------- Init ---------- */
function init() {
  state.video = document.getElementById("video");
  state.canvas = document.getElementById("overlay");
  state.ctx = state.canvas.getContext("2d");
  loadSettings();
  wireUI();
  setMode("objects");
  boot();
}
document.addEventListener("DOMContentLoaded", init);

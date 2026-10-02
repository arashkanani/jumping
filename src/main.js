import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createArena, COLUMN_TOP_Y, PLAYER_SLOTS, slotPosition } from "./arena.js";
import { createJumpling } from "./jumpling.js";
import { ParticleBurst } from "./particles.js";
import { createMetalRope } from "./rope.js";
import { createSkyWorld } from "./sky.js";
import { createFootPadClient } from "./footpads.js";

const canvas = document.getElementById("game");
const hint = document.getElementById("hint");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const surviveEl = document.getElementById("survive-time");
const ropeSpeedEl = document.getElementById("rope-speed");
const circleCountEl = document.getElementById("circle-count");
const stickWidthEl = document.getElementById("stick-width");
const stickTierEl = document.getElementById("stick-tier");
const upgradeToast = document.getElementById("upgrade-toast");
const upgradeToastText = document.getElementById("upgrade-toast-text");

const JUMP_MIN = 8.5;
const JUMP_MAX = 15.5;
const CHARGE_MS = 380;
const GRAVITY = -28;
const PLATFORM_Y = COLUMN_TOP_Y + 0.12;
const MAX_LIVES = 3;
const FALL_GRAVITY = -38;
const PLAYER_KEYS = PLAYER_SLOTS.map((s) => s.key);

const state = {
  clock: new THREE.Clock(),
  keys: Object.fromEntries(PLAYER_KEYS.map((k) => [k, false])),
  padHold: Object.fromEntries(PLAYER_KEYS.map((k) => [k, 0])),
  started: false,
  running: false,
  gameOver: false,
  surviveTime: 0,
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xffd8a8, 42, 95);

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  220
);
camera.position.set(0, COLUMN_TOP_Y + 7.5, 18);
camera.lookAt(0, COLUMN_TOP_Y - 0.2, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.16,
  0.35,
  0.9
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

createLights(scene);
const skyWorld = createSkyWorld(scene);
const arena = createArena(scene);
const particles = new ParticleBurst(scene);
const rope = createMetalRope(scene);
let arenaUpgradePulse = 0;
let toastTimer = 0;

rope.onUpgrade((info) => {
  arena.pulseUpgrade();
  arenaUpgradePulse = 1;
  showUpgradeToast(info);
  refreshRopeHud();
});

function showUpgradeToast(info) {
  upgradeToast.classList.remove("hidden", "speed");
  void upgradeToast.offsetWidth;
  if (info.type === "tier") {
    upgradeToastText.textContent = `Circle ${info.circles} — ${info.label}  (${info.name})`;
    if (info.upgrades % 2 === 0) upgradeToast.classList.add("speed");
  } else if (info.type === "width") {
    upgradeToastText.textContent = `Circle ${info.circles} — Stick thicker!`;
  } else {
    upgradeToast.classList.add("speed");
    upgradeToastText.textContent = `Speed +20%!  (${(info.speed / rope.baseSpeed).toFixed(1)}x)`;
  }
  toastTimer = 1.8;
}

function refreshRopeHud() {
  circleCountEl.textContent = String(rope.circles);
  stickWidthEl.textContent = rope.radiusScale.toFixed(1);
  ropeSpeedEl.textContent = (rope.speed / rope.baseSpeed).toFixed(1);
  if (stickTierEl) {
    const name = rope.tierName;
    stickTierEl.textContent = name.length > 14 ? name.slice(0, 12) + "…" : name;
  }
}

const players = {};
PLAYER_SLOTS.forEach((slot, index) => {
  const pos = slotPosition(slot, PLATFORM_Y);
  const jumpling = createJumpling({
    name: slot.name,
    bodyColor: slot.bodyColor,
    accentColor: 0xffffff,
    eyeColor: 0x1a2030,
    hat: slot.hat,
    position: pos,
  });
  scene.add(jumpling.group);
  players[slot.key] = makePlayer(jumpling, slot.key, `p${index + 1}`, index);
});

window.addEventListener("resize", onResize);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

for (const p of Object.values(players)) refreshLives(p);
animate();

function makePlayer(jumpling, key, cardClass, index) {
  return {
    jumpling,
    key,
    index,
    card: document.querySelector(`.${cardClass}`),
    jumpsEl: document.getElementById(`jumps-p${index + 1}`),
    livesEl: document.getElementById(`lives-p${index + 1}`),
    badge: document.querySelector(`.${cardClass} .key-badge`),
    jumps: 0,
    lives: MAX_LIVES,
    peak: 0,
    vy: 0,
    grounded: true,
    squash: 1,
    chargeStart: 0,
    alive: true,
    falling: false,
    fallDone: false,
    hitFlash: 0,
    spawn: jumpling.group.position.clone(),
  };
}

function livesText(n) {
  return "●".repeat(Math.max(0, n)) + "○".repeat(Math.max(0, MAX_LIVES - n));
}

function refreshLives(p) {
  p.livesEl.textContent = livesText(p.lives);
}

function createLights(scene) {
  scene.add(new THREE.AmbientLight(0xfff0dd, 0.7));

  const hemi = new THREE.HemisphereLight(0xa8d8ff, 0xe08a40, 0.75);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff5e0, 1.35);
  sun.position.set(-12, COLUMN_TOP_Y + 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffc080, 0.35);
  fill.position.set(8, 6, -6);
  scene.add(fill);

  const bounce = new THREE.PointLight(0xffcc88, 1.0, 35, 2);
  bounce.position.set(0, COLUMN_TOP_Y + 2, 4);
  scene.add(bounce);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
}

function onKeyDown(e) {
  if (e.code === "Space") {
    e.preventDefault();
    if (state.gameOver) resetRound();
    return;
  }

  const k = e.key.toLowerCase();
  if (!PLAYER_KEYS.includes(k)) return;
  if (e.repeat) return;
  pressPlayer(k);
}

function onKeyUp(e) {
  const k = e.key.toLowerCase();
  if (!PLAYER_KEYS.includes(k)) return;
  releasePlayer(k);
}

function pressPlayer(k) {
  const p = players[k];
  if (!p || !p.alive || p.falling || state.gameOver) return;

  if (!state.started) {
    state.started = true;
    state.running = true;
    hint.classList.add("hidden");
  }

  state.padHold[k] = (state.padHold[k] || 0) + 1;
  if (state.padHold[k] > 1) {
    // second foot already charging — keep held
    state.keys[k] = true;
    p.badge.classList.add("pressed");
    return;
  }

  state.keys[k] = true;
  p.badge.classList.add("pressed");
  p.chargeStart = performance.now();

  if (p.grounded) {
    p.squash = 0.82;
  }
}

function releasePlayer(k) {
  const p = players[k];
  if (!p) return;

  state.padHold[k] = Math.max(0, (state.padHold[k] || 0) - 1);
  if (state.padHold[k] > 0) {
    // other foot still down
    return;
  }

  state.keys[k] = false;
  p.badge.classList.remove("pressed");

  if (!p.alive || p.falling || state.gameOver || !p.grounded) return;

  const held = Math.min(1, (performance.now() - p.chargeStart) / CHARGE_MS);
  const power = JUMP_MIN + (JUMP_MAX - JUMP_MIN) * (0.35 + 0.65 * held);
  jump(p, power);
}

// Foot pads via ESP32 WebSocket (0→A, 1→S, 2→K, 3→L)
const padsStatusEl = document.getElementById("pads-status");
const padsUrlInput = document.getElementById("pads-url");
const padsConnectBtn = document.getElementById("pads-connect-btn");

const footPads = createFootPadClient({
  onDown: (key) => pressPlayer(key),
  onUp: (key) => releasePlayer(key),
  onStatus: ({ status, detail, url }) => {
    if (!padsStatusEl) return;
    padsStatusEl.dataset.status = status;
    const labels = {
      connecting: "Pads connecting…",
      connected: "Pads online",
      disconnected: "Pads offline",
      error: "Pads error",
    };
    padsStatusEl.textContent =
      status === "connected"
        ? `Pads online`
        : status === "connecting"
          ? `Pads connecting…`
          : labels[status] || status;
    if (padsUrlInput && url && document.activeElement !== padsUrlInput) {
      padsUrlInput.value = url;
    }
    if (detail && status !== "connected") {
      padsStatusEl.title = detail;
    } else if (url) {
      padsStatusEl.title = url;
    }
  },
});

if (padsUrlInput) {
  padsUrlInput.value = footPads.getUrl();
}
if (padsConnectBtn && padsUrlInput) {
  padsConnectBtn.addEventListener("click", () => {
    const next = padsUrlInput.value.trim();
    if (!next) return;
    footPads.setUrl(next);
  });
  padsUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      padsConnectBtn.click();
    }
  });
}

function jump(p, power) {
  p.grounded = false;
  p.vy = power;
  p.peak = 0;
  p.jumps += 1;
  p.jumpsEl.textContent = String(p.jumps);
  p.squash = 1.35;
  p.jumpling.playJump();

  const pos = p.jumpling.group.position;
  particles.burst(pos.x, PLATFORM_Y + 0.05, pos.z, p.jumpling.bodyColor);
  arena.pulsePad(p.index);
}

function hitPlayer(p) {
  if (p.falling || !p.alive) return;

  p.lives -= 1;
  refreshLives(p);
  p.hitFlash = 1;
  p.card.classList.remove("hit");
  void p.card.offsetWidth;
  p.card.classList.add("hit");
  rope.onHitFlash();

  const pos = p.jumpling.group.position;
  particles.burst(pos.x, pos.y + 0.6, pos.z, new THREE.Color(0xff3355));

  if (p.lives <= 0) {
    // Knocked off the column — dramatic fall
    p.alive = false;
    p.falling = true;
    p.fallDone = false;
    p.grounded = false;
    p.vy = 3 + Math.random() * 2;
    p.card.classList.add("out");
    arena.burstDebris(pos.x, PLATFORM_Y, pos.z);
    particles.burst(pos.x, PLATFORM_Y, pos.z, new THREE.Color(0xffaa44));
    return;
  }

  // Still alive — knock up so they don't instantly re-hit
  if (p.grounded) {
    p.grounded = false;
    p.vy = 6;
  } else {
    p.vy = Math.max(p.vy, 5);
  }
}

function endRound(title) {
  state.gameOver = true;
  state.running = false;
  overlay.classList.remove("hidden");
  overlayTitle.textContent = title;
  overlayMsg.textContent = `You survived ${state.surviveTime.toFixed(1)}s on the columns.`;
}

function resetRound() {
  state.gameOver = false;
  state.started = false;
  state.running = false;
  state.surviveTime = 0;
  overlay.classList.add("hidden");
  hint.classList.remove("hidden");
  rope.reset();
  surviveEl.textContent = "0.0";
  refreshRopeHud();
  upgradeToast.classList.add("hidden");
  toastTimer = 0;
  arenaUpgradePulse = 0;

  for (const k of PLAYER_KEYS) {
    state.keys[k] = false;
    state.padHold[k] = 0;
  }

  for (const p of Object.values(players)) {
    p.lives = MAX_LIVES;
    p.jumps = 0;
    p.alive = true;
    p.falling = false;
    p.fallDone = false;
    p.grounded = true;
    p.vy = 0;
    p.squash = 1;
    p.peak = 0;
    p.hitFlash = 0;
    p.chargeStart = 0;
    p.jumpling.group.visible = true;
    p.jumpling.group.rotation.set(0, 0, 0);
    p.jumpling.group.position.copy(p.spawn);
    p.jumpling.group.position.y = PLATFORM_Y;
    p.jumpsEl.textContent = "0";
    refreshLives(p);
    p.card.classList.remove("out", "hit");
    p.badge.classList.remove("pressed");
  }
}

function updatePlayer(p, dt, time) {
  const g = p.jumpling.group;

  // Falling off the column after losing
  if (p.falling) {
    p.vy += FALL_GRAVITY * dt;
    g.position.y += p.vy * dt;
    const outward = Math.hypot(g.position.x, g.position.z) || 1;
    g.position.x += (g.position.x / outward) * 2.4 * dt;
    g.position.z += (g.position.z / outward) * 2.4 * dt;
    g.rotation.z += dt * 3.5 * Math.sign(g.position.x || 1);
    g.rotation.x += dt * 2.2;
    p.squash = 1.15;

    if (g.position.y < -6 && !p.fallDone) {
      p.fallDone = true;
      g.visible = false;
      particles.burst(g.position.x, -5, g.position.z, new THREE.Color(0x88aacc));
      if (Object.values(players).every((pl) => !pl.alive && pl.fallDone)) {
        endRound("Everyone fell!");
      }
    }

    p.jumpling.update(dt, time, { grounded: false, squash: p.squash, vy: p.vy });
    return;
  }

  if (!p.alive) return;

  if (!p.grounded) {
    p.vy += GRAVITY * dt;
    g.position.y += p.vy * dt;

    const height = Math.max(0, g.position.y - PLATFORM_Y);
    if (height > p.peak) p.peak = height;

    if (g.position.y <= PLATFORM_Y) {
      g.position.y = PLATFORM_Y;
      p.grounded = true;
      p.vy = 0;
      p.squash = 0.72;
      particles.land(g.position.x, PLATFORM_Y + 0.05, g.position.z, p.jumpling.bodyColor);
      p.jumpling.playLand();
      arena.pulsePad(p.index);
    }
  } else if (state.keys[p.key]) {
    const held = Math.min(1, (performance.now() - p.chargeStart) / CHARGE_MS);
    p.squash = 0.82 - held * 0.12;
  } else {
    p.squash += (1 - p.squash) * Math.min(1, dt * 10);
  }

  if (p.hitFlash > 0) p.hitFlash -= dt;

  p.jumpling.update(dt, time, {
    grounded: p.grounded,
    squash: p.squash,
    vy: p.vy,
  });
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, state.clock.getDelta());
  const time = state.clock.elapsedTime;

  for (const p of Object.values(players)) updatePlayer(p, dt, time);
  particles.update(dt);
  skyWorld.update(time, dt);
  arenaUpgradePulse *= 0.9;
  arena.update(time, { upgradePulse: arenaUpgradePulse });
  rope.update(dt, time, state.running);

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) upgradeToast.classList.add("hidden");
  }

  if (state.running && !state.gameOver) {
    state.surviveTime += dt;
    surviveEl.textContent = state.surviveTime.toFixed(1);
    refreshRopeHud();

    for (const [key, p] of Object.entries(players)) {
      if (!p.alive) continue;
      const pos = p.jumpling.group.position;
      if (rope.checkHit(key, pos)) {
        hitPlayer(p);
      }
    }
  }

  // Camera framed on elevated columns
  const punch = arenaUpgradePulse * 0.4;
  const maxPeak = Math.max(0, ...Object.values(players).map((p) => p.peak));
  camera.position.x = Math.sin(time * 0.25) * 0.4;
  camera.position.y = COLUMN_TOP_Y + 7.5 + Math.sin(time * 0.4) * 0.15 + punch;
  camera.position.z = 18 - punch * 1.5;
  camera.lookAt(0, COLUMN_TOP_Y - 0.2 + maxPeak * 0.1, 0);

  composer.render();
}

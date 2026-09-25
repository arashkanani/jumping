import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createArena } from "./arena.js";
import { createJumpling } from "./jumpling.js";
import { ParticleBurst } from "./particles.js";
import { createMetalRope } from "./rope.js";
import { createSkyWorld } from "./sky.js";

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
const PLATFORM_Y = 0.35;
const MAX_LIVES = 3;

const state = {
  clock: new THREE.Clock(),
  keys: { a: false, l: false },
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
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb8dff5, 28, 70);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 6.2, 14.5);
camera.lookAt(0, 1.6, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.22,
  0.4,
  0.88
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

const bunnyBlue = createJumpling({
  name: "Bunny Blue",
  furColor: 0x9aa3ad,
  bellyColor: 0xf2f4f6,
  jerseyColor: 0x2f7bff,
  shortsColor: 0xff7a1a,
  shoeColor: 0x2f7bff,
  number: "7",
  eyeColor: 0x2a5fd4,
  position: new THREE.Vector3(-4.15, PLATFORM_Y, 0.2),
});
const bunnyOrange = createJumpling({
  name: "Bunny Dash",
  furColor: 0xb8a090,
  bellyColor: 0xfff5ea,
  jerseyColor: 0xff7a1a,
  shortsColor: 0x2f7bff,
  shoeColor: 0xff7a1a,
  number: "3",
  eyeColor: 0x3d7a40,
  position: new THREE.Vector3(4.15, PLATFORM_Y, 0.2),
});

scene.add(bunnyBlue.group, bunnyOrange.group);

const players = {
  a: makePlayer(bunnyBlue, "a", "p1"),
  l: makePlayer(bunnyOrange, "l", "p2"),
};

window.addEventListener("resize", onResize);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

refreshLives(players.a);
refreshLives(players.l);
animate();

function makePlayer(jumpling, key, cardClass) {
  return {
    jumpling,
    key,
    card: document.querySelector(`.${cardClass}`),
    jumpsEl: document.getElementById(`jumps-${cardClass === "p1" ? "p1" : "p2"}`),
    livesEl: document.getElementById(`lives-${cardClass === "p1" ? "p1" : "p2"}`),
    badge: document.querySelector(`.${cardClass} .key-badge`),
    jumps: 0,
    lives: MAX_LIVES,
    peak: 0,
    vy: 0,
    grounded: true,
    squash: 1,
    chargeStart: 0,
    alive: true,
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
  scene.add(new THREE.AmbientLight(0xfff6e8, 0.55));

  const hemi = new THREE.HemisphereLight(0xb8e0ff, 0x8fbf60, 0.85);
  scene.add(hemi);

  // Warm sun from upper-left (like the reference photo)
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.55);
  sun.position.set(-10, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xa8d8ff, 0.4);
  fill.position.set(8, 6, -6);
  scene.add(fill);

  const bounce = new THREE.PointLight(0xffe0a0, 1.2, 30, 2);
  bounce.position.set(0, 4, 4);
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
  if (k !== "a" && k !== "l") return;
  if (e.repeat) return;

  const p = players[k];
  if (!p.alive || state.gameOver) return;

  if (!state.started) {
    state.started = true;
    state.running = true;
    hint.classList.add("hidden");
  }

  state.keys[k] = true;
  p.badge.classList.add("pressed");
  p.chargeStart = performance.now();

  if (p.grounded) {
    p.squash = 0.82;
  }
}

function onKeyUp(e) {
  const k = e.key.toLowerCase();
  if (k !== "a" && k !== "l") return;

  state.keys[k] = false;
  const p = players[k];
  p.badge.classList.remove("pressed");

  if (!p.alive || state.gameOver || !p.grounded) return;

  const held = Math.min(1, (performance.now() - p.chargeStart) / CHARGE_MS);
  const power = JUMP_MIN + (JUMP_MAX - JUMP_MIN) * (0.35 + 0.65 * held);
  jump(p, power);
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
  arena.pulsePad(p.jumpling.group.position.x > 0 ? 1 : 0);
}

function hitPlayer(p) {
  p.lives -= 1;
  refreshLives(p);
  p.hitFlash = 1;
  p.card.classList.remove("hit");
  void p.card.offsetWidth;
  p.card.classList.add("hit");
  rope.onHitFlash();

  const pos = p.jumpling.group.position;
  particles.burst(pos.x, pos.y + 0.6, pos.z, new THREE.Color(0xff3355));

  // Knock upward slightly so they don't instantly re-hit
  if (p.grounded) {
    p.grounded = false;
    p.vy = 6;
  } else {
    p.vy = Math.max(p.vy, 5);
  }

  if (p.lives <= 0) {
    p.alive = false;
    p.card.classList.add("out");
    p.jumpling.group.visible = false;
  }

  const aliveCount = Object.values(players).filter((pl) => pl.alive).length;
  if (aliveCount === 0) {
    endRound("Both out!");
  } else if (!p.alive) {
    // one player eliminated — keep going until both out or optional end
  }
}

function endRound(title) {
  state.gameOver = true;
  state.running = false;
  overlay.classList.remove("hidden");
  overlayTitle.textContent = title;
  overlayMsg.textContent = `You survived ${state.surviveTime.toFixed(1)}s against the metal rope.`;
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

  for (const p of Object.values(players)) {
    p.lives = MAX_LIVES;
    p.jumps = 0;
    p.alive = true;
    p.grounded = true;
    p.vy = 0;
    p.squash = 1;
    p.peak = 0;
    p.hitFlash = 0;
    p.jumpling.group.visible = true;
    p.jumpling.group.position.copy(p.spawn);
    p.jumpling.group.position.y = PLATFORM_Y;
    p.jumpsEl.textContent = "0";
    refreshLives(p);
    p.card.classList.remove("out", "hit");
  }
}

function updatePlayer(p, dt, time) {
  if (!p.alive) return;

  const g = p.jumpling.group;

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
      arena.pulsePad(g.position.x > 0 ? 1 : 0);
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

  updatePlayer(players.a, dt, time);
  updatePlayer(players.l, dt, time);
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

  // Gentle camera breathe + slight punch on upgrades
  const punch = arenaUpgradePulse * 0.35;
  camera.position.x = Math.sin(time * 0.25) * 0.35;
  camera.position.y = 6.2 + Math.sin(time * 0.4) * 0.12 + punch;
  camera.position.z = 14.5 - punch * 1.5;
  camera.lookAt(0, 1.8 + Math.max(players.a.peak, players.l.peak) * 0.15, 0);

  composer.render();
}

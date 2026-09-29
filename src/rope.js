import * as THREE from "three";
import { COLUMN_TOP_Y } from "./arena.js";

const ROPE_LENGTH = 5.5;
const BASE_RADIUS = 0.055;
export const ROPE_HEIGHT = COLUMN_TOP_Y + 0.42;
export const BASE_CLEAR_Y = COLUMN_TOP_Y + 0.62;
const BASE_HIT_ANGLE = 0.22;
const HIT_COOLDOWN = 1.1;
const CIRCLES_PER_UPGRADE = 5;
const WIDTH_GROWTH = 1.2;
const SPEED_GROWTH = 1.15;
const BASE_SPEED = 1.15;

/** Visual + gameplay tiers unlocked every 5 circles */
const TIERS = [
  {
    name: "Iron Spikes",
    label: "Spikes added!",
    color: 0xc0c8d4,
    emissive: 0xff3344,
    danger: 0xff3355,
    tip: 0xff4466,
    widthMul: 1.2,
    speedMul: 1.15,
    clearBoost: 0.08,
    hitBoost: 1.12,
    build(extras, scale) {
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.08 * scale, 0.28 * scale, 8),
          metal(0xe8ecf2, 0xff2244, 0.45)
        );
        spike.position.set(1.0 + i * 0.75, 0.16 * scale, 0);
        spike.rotation.z = Math.PI;
        spike.castShadow = true;
        extras.add(spike);
        const spike2 = spike.clone();
        spike2.position.y = -0.16 * scale;
        spike2.rotation.z = 0;
        extras.add(spike2);
      }
    },
  },
  {
    name: "Heavy Weights",
    label: "Heavy weights!",
    color: 0xb87333,
    emissive: 0xff8800,
    danger: 0xff8800,
    tip: 0xffaa33,
    widthMul: 1.2,
    speedMul: 1.15,
    clearBoost: 0.12,
    hitBoost: 1.18,
    build(extras, scale) {
      for (let i = 0; i < 3; i++) {
        const link = new THREE.Mesh(
          new THREE.TorusGeometry(0.07 * scale, 0.025 * scale, 8, 14),
          metal(0x888888, 0x444444, 0.2)
        );
        link.position.set(1.4 + i * 1.2, -0.12 * scale, 0);
        link.rotation.y = Math.PI / 2;
        extras.add(link);
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.18 * scale, 16, 12),
          metal(0x5a5a5a, 0xff6600, 0.35)
        );
        ball.position.set(1.4 + i * 1.2, -0.32 * scale, 0);
        ball.castShadow = true;
        extras.add(ball);
      }
    },
  },
  {
    name: "Spin Blades",
    label: "Spin blades!",
    color: 0x88ccee,
    emissive: 0x22aaff,
    danger: 0x33ccff,
    tip: 0x66e0ff,
    widthMul: 1.18,
    speedMul: 1.18,
    clearBoost: 0.1,
    hitBoost: 1.28,
    build(extras, scale) {
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28 * scale, 0.28 * scale, 0.04 * scale, 6),
          metal(0xd8f0ff, 0x33bbff, 0.55)
        );
        blade.position.set(1.2 + i * 0.95, 0, 0);
        blade.rotation.x = Math.PI / 2;
        blade.castShadow = true;
        blade.userData.spin = true;
        extras.add(blade);
      }
    },
  },
  {
    name: "Fire Rings",
    label: "Fire rings!",
    color: 0xff5522,
    emissive: 0xff3300,
    danger: 0xff4400,
    tip: 0xffaa00,
    widthMul: 1.22,
    speedMul: 1.15,
    clearBoost: 0.14,
    hitBoost: 1.22,
    build(extras, scale) {
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.2 * scale, 0.045 * scale, 10, 24),
          new THREE.MeshStandardMaterial({
            color: 0xff6622,
            emissive: 0xff3300,
            emissiveIntensity: 0.9,
            metalness: 0.4,
            roughness: 0.35,
          })
        );
        ring.position.set(1.3 + i * 0.9, 0, 0);
        ring.rotation.y = Math.PI / 2;
        ring.userData.spin = true;
        extras.add(ring);
        const glow = new THREE.PointLight(0xff5500, 0.8, 2.5, 2);
        glow.position.copy(ring.position);
        extras.add(glow);
      }
    },
  },
  {
    name: "Crystal Barbs",
    label: "Crystal barbs!",
    color: 0xaa66ff,
    emissive: 0x8844ff,
    danger: 0xcc66ff,
    tip: 0xff66ee,
    widthMul: 1.2,
    speedMul: 1.15,
    clearBoost: 0.16,
    hitBoost: 1.3,
    build(extras, scale) {
      for (let i = 0; i < 6; i++) {
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14 * scale, 0),
          new THREE.MeshStandardMaterial({
            color: 0xcc99ff,
            emissive: 0x8822ff,
            emissiveIntensity: 0.7,
            metalness: 0.6,
            roughness: 0.2,
          })
        );
        const side = i % 2 === 0 ? 1 : -1;
        crystal.position.set(0.9 + i * 0.65, side * 0.2 * scale, side * 0.05);
        crystal.rotation.set(0.4, i, 0.3);
        crystal.castShadow = true;
        extras.add(crystal);
      }
    },
  },
  {
    name: "Chaos Chain",
    label: "Chaos mode!",
    color: 0x222830,
    emissive: 0xffd166,
    danger: 0xffd166,
    tip: 0xffee88,
    widthMul: 1.25,
    speedMul: 1.2,
    clearBoost: 0.2,
    hitBoost: 1.4,
    build(extras, scale) {
      for (let i = 0; i < 5; i++) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.22 * scale, 0.22 * scale, 0.22 * scale),
          metal(0x333840, 0xffd166, 0.5)
        );
        block.position.set(1.1 + i * 0.75, 0, 0);
        block.rotation.set(0.5, i * 0.7, 0.3);
        block.castShadow = true;
        block.userData.spin = true;
        extras.add(block);
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.07 * scale, 0.22 * scale, 6),
          metal(0xffd166, 0xffaa00, 0.4)
        );
        spike.position.set(1.1 + i * 0.75, 0.22 * scale, 0);
        spike.rotation.z = Math.PI;
        extras.add(spike);
      }
    },
  },
];

function metal(color, emissive, emissiveIntensity = 0.3) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.95,
    roughness: 0.22,
    emissive,
    emissiveIntensity,
  });
}

/**
 * Stick upgrades every 5 circles: new color, thicker, hazard parts, harder clear.
 */
export function createMetalRope(scene) {
  const pivot = new THREE.Group();
  pivot.position.set(0, ROPE_HEIGHT, 0);
  scene.add(pivot);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.18, 20),
    metal(0xb8c0cc, 0x445566, 0.15)
  );
  hub.castShadow = true;
  pivot.add(hub);

  const cableMat = metal(0xd0d6e0, 0x223044, 0.15);
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 0.85, ROPE_LENGTH, 20),
    cableMat
  );
  cable.rotation.z = Math.PI / 2;
  cable.position.x = ROPE_LENGTH / 2;
  cable.castShadow = true;
  cable.receiveShadow = true;
  pivot.add(cable);

  const strandMat = metal(0x8a93a3, 0x334455, 0.1);
  const strand = new THREE.Mesh(
    new THREE.CylinderGeometry(BASE_RADIUS * 0.45, BASE_RADIUS * 0.4, ROPE_LENGTH * 0.98, 12),
    strandMat
  );
  strand.rotation.z = Math.PI / 2;
  strand.position.set(ROPE_LENGTH / 2, BASE_RADIUS * 0.7, 0);
  pivot.add(strand);

  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 18),
    metal(0xe8ecf2, 0xff4466, 0.35)
  );
  tip.position.x = ROPE_LENGTH;
  tip.castShadow = true;
  pivot.add(tip);

  const danger = new THREE.Mesh(
    new THREE.PlaneGeometry(ROPE_LENGTH, 0.35),
    new THREE.MeshBasicMaterial({
      color: 0xff3355,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  danger.rotation.x = -Math.PI / 2;
  danger.position.set(ROPE_LENGTH / 2, -0.45, 0);
  pivot.add(danger);

  const tipLight = new THREE.PointLight(0xff4466, 1.6, 6, 2);
  tipLight.position.copy(tip.position);
  pivot.add(tipLight);

  // Hazard attachments group (cleared/rebuilt each upgrade)
  const extras = new THREE.Group();
  pivot.add(extras);
  const attachedTiers = []; // cumulative builds

  const fxRoot = new THREE.Group();
  scene.add(fxRoot);
  const upgradeRing = makeFxRing(0xffd166);
  fxRoot.add(upgradeRing.mesh);

  const sparkGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const sparks = [];
  for (let i = 0; i < 56; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const m = new THREE.Mesh(sparkGeo, mat);
    m.visible = false;
    fxRoot.add(m);
    sparks.push({ mesh: m, vel: new THREE.Vector3(), life: 0, max: 1 });
  }

  let angle = Math.PI * 0.5;
  let speed = BASE_SPEED;
  let flash = 0;
  let radiusScale = 1;
  let visualRadius = 1;
  let circles = 0;
  let angleAccum = 0;
  let upgrades = 0;
  let clearY = BASE_CLEAR_Y;
  let hitMul = 1;
  let pendingUpgrade = null;
  let pulse = 0;
  let themeColor = 0xff4466;
  const hitCooldown = new Map();
  const listeners = { onUpgrade: null };

  function applyRadiusVisual(scale) {
    cable.scale.set(scale, 1, scale);
    strand.scale.set(scale, 1, scale);
    strand.position.y = BASE_RADIUS * 0.7 * scale;
    tip.scale.setScalar(0.85 + scale * 0.4);
    danger.scale.set(1, 0.9 + scale * 0.6, 1);
    extras.scale.setScalar(Math.max(0.85, scale * 0.75));
  }

  function applyTheme(tier) {
    cableMat.color.setHex(tier.color);
    cableMat.emissive.setHex(tier.emissive);
    cableMat.emissiveIntensity = 0.35;
    strandMat.color.setHex(tier.color);
    strandMat.emissive.setHex(tier.emissive);
    tip.material.color.setHex(tier.color);
    tip.material.emissive.setHex(tier.tip);
    tip.material.emissiveIntensity = 0.7;
    tipLight.color.setHex(tier.tip);
    danger.material.color.setHex(tier.danger);
    themeColor = tier.tip;
    upgradeRing.mat.color.setHex(tier.tip);
  }

  function rebuildExtras() {
    while (extras.children.length) {
      const c = extras.children[0];
      extras.remove(c);
      if (c.geometry) c.geometry.dispose();
    }
    for (const tier of attachedTiers) {
      tier.build(extras, visualRadius);
    }
  }

  function spawnSparks(color, count, burstSpeed) {
    let spawned = 0;
    for (const s of sparks) {
      if (spawned >= count) break;
      if (s.life > 0) continue;
      s.mesh.visible = true;
      s.mesh.material.color.setHex(color);
      s.mesh.material.opacity = 1;
      s.mesh.position.set(0, ROPE_HEIGHT, 0);
      const a = Math.random() * Math.PI * 2;
      s.vel.set(
        Math.cos(a) * burstSpeed * (0.5 + Math.random()),
        (0.3 + Math.random()) * burstSpeed,
        Math.sin(a) * burstSpeed * (0.5 + Math.random())
      );
      s.life = 0.01;
      s.max = 0.55 + Math.random() * 0.45;
      s.mesh.scale.setScalar(0.7 + Math.random() * 1.4);
      spawned++;
    }
  }

  function applyTierUpgrade() {
    const tierIndex = Math.min(upgrades - 1, TIERS.length - 1);
    const tier = TIERS[tierIndex];

    radiusScale = Math.min(3.5, radiusScale * tier.widthMul);
    speed *= tier.speedMul;
    clearY += tier.clearBoost;
    hitMul *= tier.hitBoost;

    // Stack new parts (cap so the scene stays performant)
    if (attachedTiers.length < 8) {
      if (upgrades <= TIERS.length) {
        attachedTiers.push(tier);
      } else {
        attachedTiers.push(TIERS[TIERS.length - 1]);
      }
    }

    applyTheme(tier);
    rebuildExtras();

    pulse = 1;
    upgradeRing.mesh.visible = true;
    upgradeRing.mesh.scale.setScalar(0.25);
    upgradeRing.mat.opacity = 1;
    spawnSparks(tier.tip, 28, 7);

    if (listeners.onUpgrade) {
      listeners.onUpgrade({
        type: "tier",
        name: tier.name,
        label: tier.label,
        upgrades,
        circles,
        radiusScale,
        speed,
        clearY,
        color: tier.tip,
      });
    }
  }

  function triggerUpgrade() {
    upgrades += 1;
    pendingUpgrade = { t: 0 };
    pulse = 1;
    spawnSparks(0xffffff, 12, 4);
  }

  applyRadiusVisual(1);

  return {
    pivot,
    get angle() {
      return angle;
    },
    get speed() {
      return speed;
    },
    get baseSpeed() {
      return BASE_SPEED;
    },
    get circles() {
      return circles;
    },
    get upgrades() {
      return upgrades;
    },
    get radiusScale() {
      return radiusScale;
    },
    get height() {
      return ROPE_HEIGHT;
    },
    get clearY() {
      return clearY;
    },
    get tierName() {
      if (upgrades <= 0) return "Plain Stick";
      const i = Math.min(upgrades - 1, TIERS.length - 1);
      return TIERS[i].name;
    },
    onUpgrade(fn) {
      listeners.onUpgrade = fn;
    },

    update(dt, time, running) {
      if (running) {
        const step = speed * dt;
        angle += step;
        angleAccum += step;
        while (angle > Math.PI * 2) angle -= Math.PI * 2;

        while (angleAccum >= Math.PI * 2) {
          angleAccum -= Math.PI * 2;
          circles += 1;
          if (circles > 0 && circles % CIRCLES_PER_UPGRADE === 0 && !pendingUpgrade) {
            triggerUpgrade();
          }
        }
      }

      if (pendingUpgrade) {
        pendingUpgrade.t += dt;
        if (pendingUpgrade.t > 0.28) {
          applyTierUpgrade();
          pendingUpgrade = null;
        }
      }

      visualRadius += (radiusScale - visualRadius) * Math.min(1, dt * 5);
      applyRadiusVisual(visualRadius);

      pivot.rotation.y = angle;
      const wobble = Math.sin(time * 18 + angle * 4) * 0.012;
      cable.position.y = wobble;
      tip.position.y = wobble;
      tipLight.position.y = tip.position.y;
      tipLight.intensity = 1.2 + Math.sin(time * 8) * 0.4 + flash * 2 + pulse * 2.5;
      tipLight.color.setHex(themeColor);

      // Spin attached blades / rings
      for (const child of extras.children) {
        if (child.userData.spin) {
          child.rotation.z += dt * (2.5 + upgrades * 0.4);
        }
      }

      flash *= 0.9;
      pulse *= 0.93;
      danger.material.opacity = 0.12 + 0.1 * Math.sin(time * 6) + flash * 0.25 + pulse * 0.3;
      cableMat.emissiveIntensity = 0.2 + pulse * 0.6 + Math.sin(time * 5) * 0.05;

      updateFxRing(upgradeRing, pulse, dt, 16);

      for (const s of sparks) {
        if (s.life <= 0) continue;
        s.life += dt;
        s.vel.y -= 14 * dt;
        s.mesh.position.addScaledVector(s.vel, dt);
        const t = s.life / s.max;
        s.mesh.material.opacity = Math.max(0, 1 - t);
        s.mesh.scale.multiplyScalar(0.98);
        if (t >= 1) {
          s.life = 0;
          s.mesh.visible = false;
        }
      }

      for (const [key, t] of hitCooldown) {
        const next = t - dt;
        if (next <= 0) hitCooldown.delete(key);
        else hitCooldown.set(key, next);
      }
    },

    checkHit(playerKey, playerPos) {
      if (hitCooldown.has(playerKey)) return false;

      const playerAngle = Math.atan2(playerPos.z, playerPos.x);
      let delta = angle - playerAngle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;

      const radial = Math.hypot(playerPos.x, playerPos.z);
      if (radial < 0.8 || radial > ROPE_LENGTH + 0.25) return false;

      const hitAngle = BASE_HIT_ANGLE * (0.85 + visualRadius * 0.35) * hitMul;
      if (Math.abs(delta) > hitAngle) return false;
      if (playerPos.y >= clearY) return false;

      hitCooldown.set(playerKey, HIT_COOLDOWN);
      flash = 1;
      tip.material.emissiveIntensity = 1.2;
      return true;
    },

    onHitFlash() {
      flash = 1;
    },

    reset() {
      angle = Math.PI * 0.5;
      speed = BASE_SPEED;
      radiusScale = 1;
      visualRadius = 1;
      circles = 0;
      angleAccum = 0;
      upgrades = 0;
      clearY = BASE_CLEAR_Y;
      hitMul = 1;
      pendingUpgrade = null;
      pulse = 0;
      flash = 0;
      themeColor = 0xff4466;
      attachedTiers.length = 0;
      hitCooldown.clear();
      applyRadiusVisual(1);
      rebuildExtras();
      cableMat.color.setHex(0xd0d6e0);
      cableMat.emissive.setHex(0x223044);
      cableMat.emissiveIntensity = 0.15;
      strandMat.color.setHex(0x8a93a3);
      tip.material.color.setHex(0xe8ecf2);
      tip.material.emissive.setHex(0xff4466);
      tip.material.emissiveIntensity = 0.35;
      tipLight.color.setHex(0xff4466);
      danger.material.color.setHex(0xff3355);
      upgradeRing.mesh.visible = false;
      for (const s of sparks) {
        s.life = 0;
        s.mesh.visible = false;
      }
    },
  };
}

function makeFxRing(color) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.95, 64), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.4;
  mesh.visible = false;
  return { mesh, mat };
}

function updateFxRing(ring, pulse, dt, expand) {
  if (pulse > 0.02) {
    ring.mesh.visible = true;
    ring.mesh.scale.setScalar(ring.mesh.scale.x + expand * dt);
    ring.mat.opacity = Math.min(0.95, pulse * 1.1);
  } else if (ring.mesh.visible) {
    ring.mat.opacity *= 0.88;
    ring.mesh.scale.multiplyScalar(1.04);
    if (ring.mat.opacity < 0.03) {
      ring.mesh.visible = false;
      ring.mesh.scale.setScalar(0.25);
    }
  }
}

// Keep export name used by main for clear height reference
export const ROPE_CLEAR_Y = BASE_CLEAR_Y;

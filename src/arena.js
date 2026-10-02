import * as THREE from "three";

/** Pedestal tops where players stand */
export const COLUMN_TOP_Y = 5.4;
export const PED_RADIUS = 4.95; // +10% spacing between player columns
/** @deprecated use PED_RADIUS / PLAYER_SLOTS */
export const PAD_X = PED_RADIUS;

/** 4 player slots around the totem (angle 0 = toward camera +Z) */
export const PLAYER_SLOTS = [
  {
    key: "a",
    label: "A",
    name: "Cyan Bean",
    bodyColor: 0x3dcfff,
    emissive: 0x1a8ab8,
    angle: -1.05,
    hat: false,
  },
  {
    key: "s",
    label: "S",
    name: "Lime Bean",
    bodyColor: 0x6dff5a,
    emissive: 0x2a9a28,
    angle: -0.38,
    hat: true,
  },
  {
    key: "k",
    label: "K",
    name: "Violet Bean",
    bodyColor: 0xb06bff,
    emissive: 0x6020a8,
    angle: 0.38,
    hat: false,
  },
  {
    key: "l",
    label: "L",
    name: "Pink Bean",
    bodyColor: 0xff6bcb,
    emissive: 0xc02080,
    angle: 1.05,
    hat: true,
  },
];

export function slotPosition(slot, y = 0) {
  return new THREE.Vector3(
    Math.sin(slot.angle) * PED_RADIUS,
    y,
    Math.cos(slot.angle) * PED_RADIUS
  );
}

/**
 * Desert canyon arena — Jumplings / Fall Guys vibe.
 */
export function createArena(scene) {
  const root = new THREE.Group();
  scene.add(root);

  // Cracked orange desert floor
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(42, 72),
    new THREE.MeshStandardMaterial({
      map: makeCrackTexture(),
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  root.add(ground);

  // Soft warm ground glow
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(18, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffb84d,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.01;
  root.add(glow);

  // Low-poly rock mountains ring — keep camera front ( +Z ) clear
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + 0.05;
    const r = 15.5 + (i % 4) * 2.2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // Skip anything toward / near the camera
    if (z > 4) continue;
    const rock = makeLowPolyRock(2.2 + (i % 5) * 1.05, {
      snow: i % 3 !== 0,
      warm: i % 2 === 0,
    });
    rock.position.set(x, -0.4, z);
    rock.rotation.y = a + Math.random() * 0.4;
    root.add(rock);
  }

  // Extra backdrop cliffs — only behind the arena
  for (let i = 0; i < 10; i++) {
    const rock = makeLowPolyRock(2.8 + i * 0.45, {
      snow: true,
      warm: i % 2 === 0,
      wide: true,
    });
    rock.position.set((i - 4.5) * 4.2, -0.6, -20 - (i % 3) * 2.8);
    rock.rotation.y = (Math.random() - 0.5) * 0.6;
    root.add(rock);
  }

  // Cacti
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 9 + Math.random() * 12;
    if (r < 7) continue;
    const cactus = makeCactus();
    cactus.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (Math.sin(a) * r > 8) continue; // keep camera front clearer
    root.add(cactus);
  }

  // Wooden rail fence arcs
  buildFenceArc(root, 12, -Math.PI * 0.15, Math.PI * 1.15, 14);

  // Central totem / sweeper tower
  const totem = makeTotem(COLUMN_TOP_Y + 1.6);
  root.add(totem);

  // 4 player pedestals + pads
  const padMats = [];
  const padMeshes = [];
  const pulse = [0, 0, 0, 0];

  PLAYER_SLOTS.forEach((slot, i) => {
    const pos = slotPosition(slot, 0);
    const ped = makePedestal(COLUMN_TOP_Y);
    ped.position.copy(pos);
    root.add(ped);

    const mat = new THREE.MeshStandardMaterial({
      color: slot.bodyColor,
      emissive: slot.emissive,
      emissiveIntensity: 0.25,
      roughness: 0.45,
    });
    padMats.push(mat);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 6), mat);
    pad.position.set(pos.x, COLUMN_TOP_Y + 0.08, pos.z);
    pad.castShadow = true;
    root.add(pad);
    padMeshes.push(pad);

    addPadLabel(root, slot.label, pos.x, COLUMN_TOP_Y + 0.16, pos.z);
  });

  let upgradeFlash = 0;
  const fallingBits = [];

  return {
    COLUMN_TOP_Y,
    update(time, opts = {}) {
      const { upgradePulse = 0 } = opts;
      upgradeFlash = Math.max(upgradeFlash * 0.92, upgradePulse);
      glow.material.opacity = 0.1 + 0.04 * Math.sin(time * 0.8) + upgradeFlash * 0.12;

      for (let i = 0; i < pulse.length; i++) {
        pulse[i] *= 0.92;
        padMats[i].emissiveIntensity = 0.25 + pulse[i] * 0.9;
        padMeshes[i].scale.setScalar(1 + pulse[i] * 0.08);
      }

      for (let i = fallingBits.length - 1; i >= 0; i--) {
        const b = fallingBits[i];
        b.life -= 0.016;
        b.mesh.position.addScaledVector(b.vel, 0.016);
        b.vel.y -= 18 * 0.016;
        b.mesh.rotation.x += 0.1;
        if (b.life <= 0) {
          root.remove(b.mesh);
          fallingBits.splice(i, 1);
        }
      }
    },
    pulsePad(index) {
      if (index >= 0 && index < pulse.length) pulse[index] = 1;
    },
    pulseUpgrade() {
      upgradeFlash = 1;
    },
    burstDebris(x, y, z) {
      for (let i = 0; i < 12; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.12, 0.15),
          new THREE.MeshStandardMaterial({ color: 0xc4a574, flatShading: true, roughness: 0.85 })
        );
        mesh.position.set(x, y, z);
        root.add(mesh);
        fallingBits.push({
          mesh,
          vel: new THREE.Vector3((Math.random() - 0.5) * 5, 2 + Math.random() * 3, (Math.random() - 0.5) * 5),
          life: 1 + Math.random(),
        });
      }
    },
  };
}

function makePedestal(height) {
  const g = new THREE.Group();
  // Hexagonal wooden pillar
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.15, height, 6),
    new THREE.MeshStandardMaterial({
      map: makeWoodTexture(),
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    })
  );
  shaft.position.y = height / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Top cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 0.95, 0.28, 6),
    new THREE.MeshStandardMaterial({
      color: 0xd4b896,
      roughness: 0.7,
      flatShading: true,
    })
  );
  cap.position.y = height;
  cap.castShadow = true;
  g.add(cap);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.4, 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xa88860, roughness: 0.9, flatShading: true })
  );
  base.position.y = 0.15;
  base.receiveShadow = true;
  g.add(base);

  return g;
}

function makeTotem(height) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.95, height, 8),
    new THREE.MeshStandardMaterial({
      color: 0xcbb089,
      roughness: 0.75,
      flatShading: true,
      map: makeWoodTexture(),
    })
  );
  body.position.y = height / 2;
  body.castShadow = true;
  g.add(body);

  // Red rings
  for (let i = 1; i <= 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.08, 8, 20),
      new THREE.MeshStandardMaterial({
        color: 0xe23d3d,
        emissive: 0x881111,
        emissiveIntensity: 0.2,
        roughness: 0.5,
        flatShading: true,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = (height / 4) * i;
    g.add(ring);
  }

  const top = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: 0xe23d3d, flatShading: true, roughness: 0.55 })
  );
  top.position.y = height + 0.25;
  g.add(top);

  return g;
}

function makeLowPolyRock(scale, opts = {}) {
  const { snow = true, warm = false, wide = false } = opts;
  const g = new THREE.Group();

  // Palette like the reference: warm sand base → cool grey mid → bright white peaks
  const sand = warm ? 0xe8c090 : 0xd8c8a8;
  const mid = warm ? 0xc8b8a0 : 0xb8b4b0;
  const midDark = warm ? 0xa89880 : 0x9a9690;
  const peak = snow ? 0xf7f4ef : 0xe4e0d8;
  const peakBright = 0xffffff;

  const matSand = rockMat(sand);
  const matMid = rockMat(mid);
  const matDark = rockMat(midDark);
  const matPeak = rockMat(peak);
  const matSnow = rockMat(peakBright, 0.82);

  const w = wide ? 1.45 : 1.15;
  const hMul = 1.5 + Math.random() * 0.9;

  // Base mound (warm / sandy)
  const base = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.95, 0), matSand);
  base.scale.set(w * 1.35, 0.7, w * 1.2);
  base.position.y = scale * 0.25;
  base.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.2);
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Main cliff body
  const main = new THREE.Mesh(new THREE.IcosahedronGeometry(scale, 0), matMid);
  main.scale.set(w * 1.05, hMul, w * 0.95);
  main.position.y = scale * (0.55 + hMul * 0.25);
  main.rotation.y = Math.random() * Math.PI;
  main.castShadow = true;
  g.add(main);

  // Darker face / overhang
  const face = new THREE.Mesh(new THREE.TetrahedronGeometry(scale * 0.7, 0), matDark);
  face.scale.set(1.1, 1.4, 0.7);
  face.position.set(scale * 0.55 * (Math.random() > 0.5 ? 1 : -1), scale * 0.7, scale * 0.15);
  face.rotation.set(0.3, Math.random(), 0.2);
  face.castShadow = true;
  g.add(face);

  // Side boulder
  const side = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.48, 0), matMid);
  side.scale.set(1.2, 1.5, 1.0);
  side.position.set(-scale * 0.75, scale * 0.45, scale * 0.2);
  side.castShadow = true;
  g.add(side);

  // Upper pale ridge
  const ridge = new THREE.Mesh(new THREE.OctahedronGeometry(scale * 0.55, 0), matPeak);
  ridge.scale.set(1.3, 1.8, 1.0);
  ridge.position.y = scale * (0.9 + hMul * 0.45);
  ridge.rotation.y = Math.random();
  ridge.castShadow = true;
  g.add(ridge);

  // Bright white snow / chalk tip
  if (snow) {
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(scale * 0.35, 0), matSnow);
    tip.scale.set(1.2, 1.6, 1.1);
    tip.position.y = scale * (1.15 + hMul * 0.55);
    tip.castShadow = true;
    g.add(tip);

    // Extra snow patch on ledge
    const patch = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.22, 0), matSnow);
    patch.scale.set(1.4, 0.5, 1.1);
    patch.position.set(scale * 0.35, scale * (0.85 + hMul * 0.35), scale * 0.25);
    g.add(patch);
  }

  // Small rubble chips at foot
  for (let i = 0; i < 3; i++) {
    const chip = new THREE.Mesh(
      new THREE.TetrahedronGeometry(scale * (0.12 + Math.random() * 0.1), 0),
      i % 2 === 0 ? matSand : matDark
    );
    chip.position.set(
      (Math.random() - 0.5) * scale * 1.6,
      scale * 0.08,
      (Math.random() - 0.5) * scale * 1.2
    );
    chip.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(chip);
  }

  return g;
}

function rockMat(color, roughness = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
    flatShading: true,
  });
}

function makeCactus() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3d9a4a,
    roughness: 0.7,
    flatShading: true,
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 6), mat);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6), mat);
  arm.position.set(0.35, 1.1, 0);
  arm.rotation.z = -Math.PI / 2.5;
  g.add(arm);
  const armTip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 6), mat);
  armTip.position.set(0.55, 1.35, 0);
  g.add(armTip);
  return g;
}

function buildFenceArc(root, radius, a0, a1, posts) {
  const wood = new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.85, flatShading: true });
  for (let i = 0; i < posts; i++) {
    const t = i / (posts - 1);
    const a = a0 + (a1 - a0) * t;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    if (z > radius * 0.55) continue;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), wood);
    post.position.set(x, 0.5, z);
    post.castShadow = true;
    root.add(post);
    if (i < posts - 1) {
      const a2 = a0 + (a1 - a0) * ((i + 1) / (posts - 1));
      const x2 = Math.cos(a2) * radius;
      const z2 = Math.sin(a2) * radius;
      if (z2 > radius * 0.55) continue;
      const dx = x2 - x;
      const dz = z2 - z;
      const len = Math.hypot(dx, dz);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.06), wood);
      rail.position.set((x + x2) / 2, 0.65, (z + z2) / 2);
      rail.rotation.y = -Math.atan2(dz, dx);
      root.add(rail);
    }
  }
}

function makeCrackTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
  g.addColorStop(0, "#f0a84a");
  g.addColorStop(0.5, "#e08a30");
  g.addColorStop(1, "#c46a22");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(120,60,20,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makeWoodTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#c4a06a";
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 6) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(90,50,20,0.12)" : "rgba(255,220,160,0.1)";
    ctx.fillRect(0, y, 128, 3 + Math.random() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function addPadLabel(parent, text, x, y, z) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 78px Fredoka, Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 8;
  ctx.strokeText(text, 64, 70);
  ctx.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.55),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
}

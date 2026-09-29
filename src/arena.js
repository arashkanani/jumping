import * as THREE from "three";

/** Column tops where players stand */
export const COLUMN_TOP_Y = 6.2;
export const COLUMN_RADIUS = 4.2;
export const PAD_X = 4.2;

/**
 * Elevated column arena — players stand high; dense scenic world below.
 */
export function createArena(scene) {
  const root = new THREE.Group();
  scene.add(root);

  // Deep canyon / mist floor far below
  const abyss = new THREE.Mesh(
    new THREE.CircleGeometry(55, 64),
    new THREE.MeshStandardMaterial({
      color: 0x1a2840,
      roughness: 1,
      metalness: 0.05,
      emissive: 0x0a1528,
      emissiveIntensity: 0.3,
    })
  );
  abyss.rotation.x = -Math.PI / 2;
  abyss.position.y = -8;
  abyss.receiveShadow = true;
  root.add(abyss);

  // Fog layers / mist discs
  for (let i = 0; i < 6; i++) {
    const mist = new THREE.Mesh(
      new THREE.CircleGeometry(12 + i * 4, 48),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xa8d4ff : 0xc8e8ff,
        transparent: true,
        opacity: 0.06 + i * 0.015,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mist.rotation.x = -Math.PI / 2;
    mist.position.y = -6 + i * 1.2;
    root.add(mist);
  }

  // Water / lava-glow river far below
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 14),
    new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      emissive: 0x0a4a8a,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    })
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, -7.5, 0);
  root.add(river);

  // Floating rock islands densely packed
  for (let i = 0; i < 28; i++) {
    const island = makeRockIsland(0.8 + Math.random() * 1.8);
    const a = (i / 28) * Math.PI * 2 + Math.random() * 0.2;
    const r = 8 + Math.random() * 22;
    island.position.set(Math.cos(a) * r, -3 + Math.random() * 5, Math.sin(a) * r);
    // Keep clear of play columns
    if (Math.hypot(island.position.x, island.position.z) < 6.5) {
      island.position.x *= 1.8;
      island.position.z *= 1.8;
    }
    root.add(island);
  }

  // Decorative ancient pillars around
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 9 + (i % 3) * 1.5;
    const h = 3 + (i % 4) * 1.2;
    const pillar = makeRuinPillar(h);
    pillar.position.set(Math.cos(a) * r, -2, Math.sin(a) * r);
    if (Math.hypot(pillar.position.x, pillar.position.z) < 6) continue;
    root.add(pillar);
  }

  // Trees & crystal clusters on islands
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 18;
    const tree = makeFancyTree(0.7 + Math.random() * 0.6);
    tree.position.set(Math.cos(a) * r, -1 + Math.random() * 3, Math.sin(a) * r);
    root.add(tree);
  }

  for (let i = 0; i < 18; i++) {
    const crystal = makeCrystal();
    const a = Math.random() * Math.PI * 2;
    const r = 7 + Math.random() * 16;
    crystal.position.set(Math.cos(a) * r, -2 + Math.random() * 4, Math.sin(a) * r);
    root.add(crystal);
  }

  // Floating lanterns
  const lanterns = [];
  for (let i = 0; i < 24; i++) {
    const lantern = makeLantern();
    const a = (i / 24) * Math.PI * 2;
    const r = 6 + Math.random() * 14;
    lantern.position.set(
      Math.cos(a) * r,
      2 + Math.random() * 6,
      Math.sin(a) * r
    );
    root.add(lantern);
    lanterns.push({
      mesh: lantern,
      baseY: lantern.position.y,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Torches / braziers around play ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const torch = makeTorch();
    torch.position.set(Math.cos(a) * 6.8, COLUMN_TOP_Y - 1.2, Math.sin(a) * 6.8);
    root.add(torch);
  }

  // Central hub column (rope pivot base)
  const hub = makePlayColumn(1.1, COLUMN_TOP_Y + 0.4, 0x6a5a4a, 0xffd166);
  hub.position.set(0, 0, 0);
  root.add(hub);

  // Player columns
  const colA = makePlayColumn(1.05, COLUMN_TOP_Y, 0x3d6bbf, 0x5c9aff);
  colA.position.set(-PAD_X, 0, 0.15);
  root.add(colA);

  const colB = makePlayColumn(1.05, COLUMN_TOP_Y, 0xc45a18, 0xff9a4a);
  colB.position.set(PAD_X, 0, 0.15);
  root.add(colB);

  // Pads on column tops
  const padMatA = new THREE.MeshStandardMaterial({
    color: 0x3d8bff,
    emissive: 0x1a5fd0,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9,
  });
  const padMatB = new THREE.MeshStandardMaterial({
    color: 0xff8a3d,
    emissive: 0xd45a10,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9,
  });

  const padA = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 40), padMatA);
  padA.position.set(-PAD_X, COLUMN_TOP_Y + 0.06, 0.15);
  padA.castShadow = true;
  root.add(padA);

  const padB = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 40), padMatB);
  padB.position.set(PAD_X, COLUMN_TOP_Y + 0.06, 0.15);
  padB.castShadow = true;
  root.add(padB);

  // Pad glow rings
  for (const [pad, col] of [
    [padA, 0x66b0ff],
    [padB, 0xffb070],
  ]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.05, 10, 40),
      new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(pad.position);
    ring.position.y += 0.08;
    root.add(ring);
  }

  addPadLabel(root, "A", -PAD_X, COLUMN_TOP_Y + 0.14, 0.15);
  addPadLabel(root, "L", PAD_X, COLUMN_TOP_Y + 0.14, 0.15);

  // Center gem on hub
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffaa00,
      emissiveIntensity: 0.75,
      roughness: 0.18,
      metalness: 0.65,
    })
  );
  gem.position.y = COLUMN_TOP_Y + 0.55;
  root.add(gem);

  const gemHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 14),
    new THREE.MeshBasicMaterial({
      color: 0xffe08a,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  gemHalo.position.copy(gem.position);
  root.add(gemHalo);

  const gemLight = new THREE.PointLight(0xffd166, 2.8, 14, 2);
  gemLight.position.set(0, COLUMN_TOP_Y + 1.2, 0);
  root.add(gemLight);

  // Bridge beams between hub and player columns (visual only)
  for (const x of [-PAD_X / 2, PAD_X / 2]) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(PAD_X * 0.85, 0.12, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x8a7a60,
        roughness: 0.7,
        metalness: 0.15,
      })
    );
    beam.position.set(x, COLUMN_TOP_Y - 0.35, 0.15);
    beam.castShadow = true;
    root.add(beam);
  }

  // Waterfalls from floating rocks
  for (let i = 0; i < 5; i++) {
    const fall = makeWaterfall();
    const a = (i / 5) * Math.PI * 2 + 0.5;
    fall.position.set(Math.cos(a) * 14, 1, Math.sin(a) * 14);
    root.add(fall);
  }

  // Banners hanging from sky hooks
  for (let i = 0; i < 6; i++) {
    const banner = makeBanner(i % 2 === 0 ? 0x2f7bff : 0xff7a1a);
    const a = (i / 6) * Math.PI * 2;
    banner.position.set(Math.cos(a) * 11, COLUMN_TOP_Y + 2, Math.sin(a) * 11);
    root.add(banner);
  }

  // Sparkle dust around columns
  const sparkCount = 120;
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 8;
    sparkPos[i * 3] = Math.cos(a) * r;
    sparkPos[i * 3 + 1] = COLUMN_TOP_Y - 2 + Math.random() * 5;
    sparkPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const sparks = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(sparkPos, 3)),
    new THREE.PointsMaterial({
      color: 0xffe8a0,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  root.add(sparks);

  const pulse = [0, 0];
  let upgradeFlash = 0;
  const fallingBits = [];

  return {
    COLUMN_TOP_Y,
    update(time, opts = {}) {
      const { upgradePulse = 0 } = opts;
      upgradeFlash = Math.max(upgradeFlash * 0.92, upgradePulse);

      gem.rotation.y = time * 0.9;
      gem.rotation.x = Math.sin(time * 0.7) * 0.2;
      gem.position.y = COLUMN_TOP_Y + 0.55 + Math.sin(time * 2.2) * 0.06;
      gemHalo.position.copy(gem.position);
      gemHalo.scale.setScalar(1 + Math.sin(time * 3) * 0.08 + upgradeFlash * 0.4);
      gemHalo.material.opacity = 0.2 + upgradeFlash * 0.45;
      gemLight.intensity = 2.4 + Math.sin(time * 4) * 0.4 + upgradeFlash * 3;

      for (const L of lanterns) {
        L.mesh.position.y = L.baseY + Math.sin(time * 1.1 + L.phase) * 0.45;
        L.mesh.rotation.y = time * 0.4 + L.phase;
      }

      // Drift sparkles
      const arr = sparks.geometry.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        arr[i * 3 + 1] += Math.sin(time * 2 + i) * 0.004;
      }
      sparks.geometry.attributes.position.needsUpdate = true;

      pulse[0] *= 0.92;
      pulse[1] *= 0.92;
      padMatA.emissiveIntensity = 0.45 + pulse[0] * 1.1;
      padMatB.emissiveIntensity = 0.45 + pulse[1] * 1.1;
      padA.scale.setScalar(1 + pulse[0] * 0.1);
      padB.scale.setScalar(1 + pulse[1] * 0.1);

      river.material.emissiveIntensity = 0.45 + Math.sin(time * 1.5) * 0.1;

      for (let i = fallingBits.length - 1; i >= 0; i--) {
        const b = fallingBits[i];
        b.life -= 0.016;
        b.mesh.position.addScaledVector(b.vel, 0.016);
        b.vel.y -= 18 * 0.016;
        b.mesh.rotation.x += 0.08;
        if (b.life <= 0) {
          root.remove(b.mesh);
          fallingBits.splice(i, 1);
        }
      }
    },
    pulsePad(index) {
      pulse[index] = 1;
    },
    pulseUpgrade() {
      upgradeFlash = 1;
    },
    // Debris when someone falls
    burstDebris(x, y, z) {
      for (let i = 0; i < 14; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          new THREE.MeshStandardMaterial({
            color: 0x8a7a60,
            roughness: 0.8,
          })
        );
        mesh.position.set(x, y, z);
        root.add(mesh);
        fallingBits.push({
          mesh,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            2 + Math.random() * 4,
            (Math.random() - 0.5) * 6
          ),
          life: 1.2 + Math.random(),
        });
      }
    },
  };
}

function makePlayColumn(radius, height, stoneColor, glowColor) {
  const g = new THREE.Group();

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.85, radius * 1.15, height, 20),
    new THREE.MeshStandardMaterial({
      color: stoneColor,
      roughness: 0.72,
      metalness: 0.12,
      map: makeStoneTexture(stoneColor),
    })
  );
  shaft.position.y = height / 2 - 0.05;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Ring bands
  for (let i = 1; i <= 4; i++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.9, 0.06, 8, 32),
      new THREE.MeshStandardMaterial({
        color: glowColor,
        emissive: glowColor,
        emissiveIntensity: 0.35,
        metalness: 0.5,
        roughness: 0.35,
      })
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = (height / 5) * i;
    g.add(band);
  }

  // Capital
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.25, radius * 0.95, 0.35, 20),
    new THREE.MeshStandardMaterial({
      color: 0xd8c8a8,
      roughness: 0.55,
      metalness: 0.2,
    })
  );
  cap.position.y = height;
  cap.castShadow = true;
  g.add(cap);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.35, radius * 1.5, 0.5, 20),
    new THREE.MeshStandardMaterial({ color: 0x4a4035, roughness: 0.85 })
  );
  base.position.y = 0.1;
  base.receiveShadow = true;
  g.add(base);

  return g;
}

function makeRockIsland(scale) {
  const g = new THREE.Group();
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    new THREE.MeshStandardMaterial({
      color: 0x6a7a68,
      roughness: 0.9,
      flatShading: true,
    })
  );
  rock.scale.set(1.4, 0.55, 1.2);
  rock.castShadow = true;
  rock.receiveShadow = true;
  g.add(rock);

  const grass = new THREE.Mesh(
    new THREE.SphereGeometry(scale * 0.7, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x5faf3c, roughness: 0.85 })
  );
  grass.scale.set(1.3, 0.35, 1.2);
  grass.position.y = scale * 0.25;
  g.add(grass);
  return g;
}

function makeRuinPillar(h) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.35, h, 8),
    new THREE.MeshStandardMaterial({
      color: 0x9a8a78,
      roughness: 0.85,
      flatShading: true,
    })
  );
  p.position.y = h / 2;
  p.castShadow = true;
  g.add(p);
  if (Math.random() > 0.4) {
    const broken = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.9 })
    );
    broken.position.set(0.2, h + 0.1, 0);
    broken.rotation.z = 0.4;
    g.add(broken);
  }
  return g;
}

function makeFancyTree(s) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 1.2 * s, 8),
    new THREE.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.9 })
  );
  trunk.position.y = 0.6 * s;
  trunk.castShadow = true;
  g.add(trunk);
  const leafCols = [0x4caf50, 0x66bb6a, 0x2e7d32];
  for (let i = 0; i < 3; i++) {
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55 * s * (1 - i * 0.12), 0),
      new THREE.MeshStandardMaterial({
        color: leafCols[i],
        roughness: 0.75,
        flatShading: true,
      })
    );
    canopy.position.y = 1.3 * s + i * 0.35 * s;
    canopy.castShadow = true;
    g.add(canopy);
  }
  return g;
}

function makeCrystal() {
  const colors = [0x66f0ff, 0xff66ee, 0xffd166, 0x88ff88];
  const c = colors[(Math.random() * colors.length) | 0];
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.25 + Math.random() * 0.35, 0),
    new THREE.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.9,
    })
  );
  mesh.rotation.set(Math.random(), Math.random(), Math.random());
  mesh.castShadow = true;
  return mesh;
}

function makeLantern() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      emissive: 0xff7700,
      emissiveIntensity: 0.8,
      roughness: 0.35,
      transparent: true,
      opacity: 0.85,
    })
  );
  g.add(body);
  const light = new THREE.PointLight(0xffaa44, 0.7, 5, 2);
  g.add(light);
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  string.position.y = 0.5;
  g.add(string);
  return g;
}

function makeTorch() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.85 })
  );
  pole.position.y = 0.8;
  g.add(pole);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.4, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff6622,
      emissive: 0xff4400,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9,
    })
  );
  flame.position.y = 1.75;
  g.add(flame);
  const light = new THREE.PointLight(0xff6622, 1.2, 6, 2);
  light.position.y = 1.8;
  g.add(light);
  return g;
}

function makeWaterfall() {
  const g = new THREE.Group();
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 5),
    new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );
  sheet.position.y = -1;
  g.add(sheet);
  return g;
}

function makeBanner(color) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
  );
  g.add(pole);
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.8),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      side: THREE.DoubleSide,
      emissive: color,
      emissiveIntensity: 0.15,
    })
  );
  cloth.position.set(0.6, -0.3, 0);
  g.add(cloth);
  return g;
}

function makeStoneTexture(base) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#" + new THREE.Color(base).getHexString();
  ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)";
    ctx.fillRect(Math.random() * 128, Math.random() * 256, 8 + Math.random() * 30, 4 + Math.random() * 12);
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
  ctx.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
}

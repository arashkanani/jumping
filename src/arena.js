import * as THREE from "three";

/** Sunny park meadow arena — grass, flowers, fence, trees. */
export function createArena(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const grassTex = makeGrassTexture();
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(28, 96),
    new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.92,
      metalness: 0.02,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  root.add(ground);

  const meadowGlow = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshBasicMaterial({
      color: 0xb8f080,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  meadowGlow.rotation.x = -Math.PI / 2;
  meadowGlow.position.y = 0.01;
  root.add(meadowGlow);

  scatterFlowers(root, 180);

  const platformGroup = new THREE.Group();
  root.add(platformGroup);

  const dirtRing = new THREE.Mesh(
    new THREE.CylinderGeometry(5.7, 5.95, 0.35, 72),
    new THREE.MeshStandardMaterial({
      color: 0xc4a574,
      roughness: 0.85,
      metalness: 0.05,
    })
  );
  dirtRing.position.y = 0.05;
  dirtRing.castShadow = true;
  dirtRing.receiveShadow = true;
  platformGroup.add(dirtRing);

  const turfTex = makeTurfTexture();
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.2, 0.16, 72),
    new THREE.MeshStandardMaterial({
      map: turfTex,
      roughness: 0.7,
      metalness: 0.05,
    })
  );
  top.position.y = 0.28;
  top.receiveShadow = true;
  platformGroup.add(top);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const outerLine = new THREE.Mesh(new THREE.TorusGeometry(5.05, 0.04, 8, 96), lineMat);
  outerLine.rotation.x = Math.PI / 2;
  outerLine.position.y = 0.37;
  platformGroup.add(outerLine);

  const midLine = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.035, 8, 80), lineMat);
  midLine.rotation.x = Math.PI / 2;
  midLine.position.y = 0.37;
  platformGroup.add(midLine);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
  );
  post.position.y = 0.55;
  post.castShadow = true;
  platformGroup.add(post);

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd54a,
      emissive: 0xffaa00,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.55,
    })
  );
  gem.position.y = 0.92;
  platformGroup.add(gem);

  const gemHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 20, 14),
    new THREE.MeshBasicMaterial({
      color: 0xffe08a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  gemHalo.position.y = 0.92;
  platformGroup.add(gemHalo);

  const padMatA = new THREE.MeshStandardMaterial({
    color: 0x3d8bff,
    emissive: 0x1a5fd0,
    emissiveIntensity: 0.25,
    roughness: 0.5,
    transparent: true,
    opacity: 0.75,
  });
  const padMatB = new THREE.MeshStandardMaterial({
    color: 0xff8a3d,
    emissive: 0xd45a10,
    emissiveIntensity: 0.25,
    roughness: 0.5,
    transparent: true,
    opacity: 0.75,
  });

  const padA = new THREE.Mesh(new THREE.CircleGeometry(0.95, 40), padMatA);
  padA.rotation.x = -Math.PI / 2;
  padA.position.set(-4.15, 0.37, 0.2);
  platformGroup.add(padA);

  const padB = new THREE.Mesh(new THREE.CircleGeometry(0.95, 40), padMatB);
  padB.rotation.x = -Math.PI / 2;
  padB.position.set(4.15, 0.37, 0.2);
  platformGroup.add(padB);

  addPadLabel(platformGroup, "A", -4.15, 0.38, 0.2);
  addPadLabel(platformGroup, "L", 4.15, 0.38, 0.2);

  buildFence(root, 12.5, 18);

  // Trees only in the background / sides — never in front of the camera
  const trees = [];
  for (let i = 0; i < 12; i++) {
    // Place on rear arc (away from camera at +Z)
    const t = i / 11;
    const a = Math.PI * 0.15 + t * Math.PI * 0.7; // roughly -X to +X through -Z
    const angle = Math.PI + a; // flip to back half
    const r = 18 + (i % 3) * 2.2;
    const tree = makeTree(0.95 + (i % 3) * 0.2);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    // Extra safety: skip anything near the camera side
    if (z > -6) continue;
    tree.position.set(x, 0, z);
    tree.rotation.y = angle;
    root.add(tree);
    trees.push(tree);
  }

  // Soft distant hills — far behind only
  for (let i = 0; i < 4; i++) {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(3.5 + i * 0.6, 20, 14),
      new THREE.MeshStandardMaterial({
        color: 0x6fbf5a,
        roughness: 0.95,
      })
    );
    hill.scale.y = 0.28;
    hill.position.set((i - 1.5) * 8, -1.8, -26 - (i % 2) * 2);
    root.add(hill);
  }

  const pulse = [0, 0];
  let upgradeFlash = 0;

  return {
    update(time, opts = {}) {
      const { upgradePulse = 0 } = opts;
      upgradeFlash = Math.max(upgradeFlash * 0.92, upgradePulse);

      gem.rotation.y = time * 0.9;
      gem.position.y = 0.92 + Math.sin(time * 2.2) * 0.04;
      gemHalo.position.y = gem.position.y;
      gemHalo.scale.setScalar(1 + Math.sin(time * 3) * 0.06 + upgradeFlash * 0.35);
      gemHalo.material.opacity = 0.18 + upgradeFlash * 0.4;
      meadowGlow.material.opacity = 0.1 + 0.04 * Math.sin(time * 0.7) + upgradeFlash * 0.15;

      for (let i = 0; i < trees.length; i++) {
        trees[i].rotation.z = Math.sin(time * 0.6 + i) * 0.015;
      }

      pulse[0] *= 0.92;
      pulse[1] *= 0.92;
      padMatA.emissiveIntensity = 0.25 + pulse[0] * 0.9;
      padMatB.emissiveIntensity = 0.25 + pulse[1] * 0.9;
      padA.scale.setScalar(1 + pulse[0] * 0.1);
      padB.scale.setScalar(1 + pulse[1] * 0.1);
    },
    pulsePad(index) {
      pulse[index] = 1;
    },
    pulseUpgrade() {
      upgradeFlash = 1;
    },
  };
}

function makeTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, 1.4 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a4a28, roughness: 0.9 })
  );
  trunk.position.y = 0.7 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.1 * scale, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.75 })
  );
  canopy.position.y = 2.0 * scale;
  canopy.scale.set(1.1, 0.95, 1.1);
  canopy.castShadow = true;
  g.add(canopy);

  const canopy2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.75 * scale, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.7 })
  );
  canopy2.position.set(0.35 * scale, 2.35 * scale, 0.1 * scale);
  canopy2.castShadow = true;
  g.add(canopy2);

  return g;
}

function buildFence(root, radius, posts) {
  const wood = new THREE.MeshStandardMaterial({ color: 0xa06a3a, roughness: 0.85 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xb87a45, roughness: 0.8 });

  for (let i = 0; i < posts; i++) {
    const a0 = (i / posts) * Math.PI * 2;
    const a1 = ((i + 1) / posts) * Math.PI * 2;
    const x = Math.cos(a0) * radius;
    const z = Math.sin(a0) * radius;

    // Leave the camera-facing front open so the court stays fully visible
    if (z > radius * 0.35) continue;

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), wood);
    post.position.set(x, 0.52, z);
    post.castShadow = true;
    root.add(post);

    const x1 = Math.cos(a1) * radius;
    const z1 = Math.sin(a1) * radius;
    if (z1 > radius * 0.35) continue;

    const dx = x1 - x;
    const dz = z1 - z;
    const len = Math.hypot(dx, dz);
    const midX = (x + x1) / 2;
    const midZ = (z + z1) / 2;
    const ang = Math.atan2(dz, dx);

    for (const y of [0.35, 0.7]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.08), railMat);
      rail.position.set(midX, y, midZ);
      rail.rotation.y = -ang;
      rail.castShadow = true;
      root.add(rail);
    }
  }
}

function scatterFlowers(root, count) {
  const colors = [0xffe066, 0xff8fab, 0xc77dff, 0xffffff, 0xffb347];
  const petalGeo = new THREE.SphereGeometry(0.06, 8, 6);
  const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.18, 5);

  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 6.2 + Math.random() * 16;
    // Keep flowers off the court
    if (r < 6.1) continue;

    const flower = new THREE.Group();
    const stem = new THREE.Mesh(
      stemGeo,
      new THREE.MeshStandardMaterial({ color: 0x3d8b40, roughness: 0.9 })
    );
    stem.position.y = 0.09;
    flower.add(stem);

    const col = colors[i % colors.length];
    const head = new THREE.Mesh(
      petalGeo,
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.55,
        emissive: col,
        emissiveIntensity: 0.12,
      })
    );
    head.position.y = 0.2;
    head.scale.set(1.2, 0.7, 1.2);
    flower.add(head);

    flower.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    flower.rotation.y = Math.random() * Math.PI;
    root.add(flower);
  }
}

function makeGrassTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
  g.addColorStop(0, "#7ec850");
  g.addColorStop(0.5, "#5faf3c");
  g.addColorStop(1, "#4a9430");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,200,0.08)" : "rgba(30,80,20,0.12)";
    ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

function makeTurfTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 30, 256, 256, 260);
  g.addColorStop(0, "#8fd45a");
  g.addColorStop(0.6, "#6fbf45");
  g.addColorStop(1, "#5aa838");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2;
    const a1 = ((i + 0.5) / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.arc(256, 256, 250, a0, a1);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,60,0,0.06)";
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
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
    new THREE.PlaneGeometry(0.65, 0.65),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
}

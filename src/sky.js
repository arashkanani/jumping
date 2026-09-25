import * as THREE from "three";

/**
 * Sunny park sky with sun, clouds, balloons, birds, kite, plane.
 */
export function createSkyWorld(scene) {
  // Gradient sky dome
  const skyGeo = new THREE.SphereGeometry(90, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x4da6ff) },
      midColor: { value: new THREE.Color(0x87ceeb) },
      bottomColor: { value: new THREE.Color(0xd8f0ff) },
      offset: { value: 12 },
      exponent: { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.4, t));
        col = mix(col, topColor, smoothstep(0.3, 1.0, t));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const anim = [];

  // —— Bright sun disc (upper-left) ——
  const sunGroup = new THREE.Group();
  sunGroup.position.set(-22, 22, -28);
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff2a8 })
  );
  sunGroup.add(sunCore);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  sunGroup.add(sunGlow);
  const sunHalo = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0xfff0c0,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  sunGroup.add(sunHalo);
  scene.add(sunGroup);
  anim.push({
    update(t) {
      const s = 1 + Math.sin(t * 1.2) * 0.03;
      sunGlow.scale.setScalar(s);
      sunHalo.scale.setScalar(1 + Math.sin(t * 0.8) * 0.05);
    },
  });

  // —— Fluffy clouds ——
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe8f4ff,
    emissiveIntensity: 0.18,
    roughness: 1,
    transparent: true,
    opacity: 0.94,
  });

  for (let i = 0; i < 16; i++) {
    const cloud = makeCloud(cloudMat);
    const side = i % 2 === 0 ? -1 : 1;
    cloud.position.set(
      side * (8 + Math.random() * 28) + (Math.random() - 0.5) * 10,
      9 + Math.random() * 10,
      -10 - Math.random() * 35
    );
    cloud.scale.setScalar(0.9 + Math.random() * 1.1);
    scene.add(cloud);
    const baseX = cloud.position.x;
    const speed = 0.15 + Math.random() * 0.25;
    const phase = Math.random() * Math.PI * 2;
    anim.push({
      update(t) {
        cloud.position.x = baseX + Math.sin(t * speed + phase) * 2.5;
        cloud.position.y += Math.sin(t * 0.4 + phase) * 0.002;
      },
    });
  }

  // —— Colorful balloons ——
  const balloonColors = [0xff6b6b, 0x4dabff, 0xffd166, 0xb388ff, 0x69f0ae, 0xff8fab];
  for (let i = 0; i < 8; i++) {
    const balloon = makeBalloon(balloonColors[i % balloonColors.length]);
    const x = (Math.random() - 0.5) * 40;
    const z = -8 - Math.random() * 28;
    balloon.position.set(x, 6 + Math.random() * 8, z);
    balloon.scale.setScalar(0.7 + Math.random() * 0.5);
    scene.add(balloon);
    const baseY = balloon.position.y;
    const baseX = balloon.position.x;
    const phase = Math.random() * 10;
    anim.push({
      update(t) {
        balloon.position.y = baseY + Math.sin(t * 0.7 + phase) * 0.6;
        balloon.position.x = baseX + Math.sin(t * 0.35 + phase) * 1.2;
        balloon.rotation.z = Math.sin(t * 0.5 + phase) * 0.12;
      },
    });
  }

  // —— Birds (simple V silhouettes flying across) ——
  for (let i = 0; i < 5; i++) {
    const flock = new THREE.Group();
    const count = 3 + (i % 3);
    for (let j = 0; j < count; j++) {
      flock.add(makeBird());
      flock.children[j].position.set(j * 1.2, (j % 2) * 0.4, j * 0.3);
    }
    const startX = -35 - Math.random() * 10;
    flock.position.set(startX, 12 + Math.random() * 8, -15 - Math.random() * 20);
    flock.scale.setScalar(0.7 + Math.random() * 0.4);
    scene.add(flock);
    const speed = 2.2 + Math.random() * 1.5;
    const y0 = flock.position.y;
    const z0 = flock.position.z;
    anim.push({
      update(t, dt) {
        flock.position.x += speed * dt;
        flock.position.y = y0 + Math.sin(t * 1.5 + i) * 0.5;
        if (flock.position.x > 40) {
          flock.position.x = -40;
          flock.position.z = z0 + (Math.random() - 0.5) * 6;
        }
        for (let j = 0; j < flock.children.length; j++) {
          const bird = flock.children[j];
          const flap = Math.sin(t * 12 + j * 1.7) * 0.45;
          if (bird.userData.wingL) {
            bird.userData.wingL.rotation.z = flap;
            bird.userData.wingR.rotation.z = -flap;
          }
        }
      },
    });
  }

  // —— Kite ——
  const kite = makeKite();
  kite.position.set(14, 11, -18);
  scene.add(kite);
  anim.push({
    update(t) {
      kite.position.y = 11 + Math.sin(t * 1.1) * 0.8;
      kite.position.x = 14 + Math.sin(t * 0.4) * 1.5;
      kite.rotation.z = Math.sin(t * 0.9) * 0.25;
      kite.rotation.y = Math.sin(t * 0.5) * 0.15;
    },
  });

  // —— Small airplane ——
  const plane = makePlane();
  plane.position.set(-30, 16, -25);
  plane.scale.setScalar(0.85);
  scene.add(plane);
  anim.push({
    update(t, dt) {
      plane.position.x += 3.5 * dt;
      plane.position.y = 16 + Math.sin(t * 0.8) * 0.4;
      if (plane.position.x > 38) plane.position.x = -38;
      plane.rotation.z = Math.sin(t * 0.6) * 0.08;
      if (plane.userData.prop) plane.userData.prop.rotation.x += dt * 25;
    },
  });

  // —— Floating soap bubbles / sparkles ——
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0,
    transmission: 0.6,
    thickness: 0.3,
  });
  // Fallback if physical unsupported well — use basic transparent
  const simpleBubbleMat = new THREE.MeshStandardMaterial({
    color: 0xccf0ff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0xaaddff,
    emissiveIntensity: 0.15,
  });
  for (let i = 0; i < 14; i++) {
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 12, 10),
      simpleBubbleMat.clone()
    );
    bubble.position.set(
      (Math.random() - 0.5) * 30,
      4 + Math.random() * 12,
      -5 - Math.random() * 20
    );
    scene.add(bubble);
    const base = bubble.position.clone();
    const phase = Math.random() * 10;
    const rise = 0.3 + Math.random() * 0.5;
    anim.push({
      update(t) {
        const u = (t * rise + phase) % 14;
        bubble.position.y = 3 + u;
        bubble.position.x = base.x + Math.sin(t * 0.8 + phase) * 1.5;
        bubble.material.opacity = 0.15 + Math.sin(t * 2 + phase) * 0.12;
        if (bubble.position.y > 16) bubble.position.y = 3;
      },
    });
  }

  void bubbleMat;

  return {
    update(time, dt) {
      for (const a of anim) a.update(time, dt);
    },
  };
}

function makeCloud(mat) {
  const cloud = new THREE.Group();
  const layout = [
    [0, 0, 0, 1.2],
    [1.1, 0.15, 0.2, 1],
    [-1.0, 0.1, -0.15, 0.95],
    [0.3, 0.45, -0.1, 0.85],
    [1.8, 0, 0.1, 0.7],
  ];
  for (const [x, y, z, s] of layout) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat);
    puff.position.set(x, y, z);
    puff.scale.setScalar(s);
    cloud.add(puff);
  }
  return cloud;
}

function makeBalloon(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 16),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.05,
      emissive: color,
      emissiveIntensity: 0.15,
    })
  );
  body.scale.set(1, 1.15, 1);
  g.add(body);
  const knot = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.18, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
  );
  knot.position.y = -0.6;
  knot.rotation.x = Math.PI;
  g.add(knot);
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 1.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  string.position.y = -1.3;
  g.add(string);
  return g;
}

function makeBird() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x2a3038 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), bodyMat);
  body.scale.set(1.4, 0.7, 0.8);
  g.add(body);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.18), bodyMat);
  wingL.position.set(-0.25, 0, 0);
  g.add(wingL);
  const wingR = wingL.clone();
  wingR.position.x = 0.25;
  g.add(wingR);
  g.userData.wingL = wingL;
  g.userData.wingR = wingR;
  return g;
}

function makeKite() {
  const g = new THREE.Group();
  const sail = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.7, 0),
    new THREE.MeshStandardMaterial({
      color: 0xff4d6d,
      emissive: 0xff2244,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      flatShading: true,
    })
  );
  sail.scale.set(1, 1.3, 0.15);
  g.add(sail);
  const cross = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.5, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );
  g.add(cross);
  const cross2 = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );
  g.add(cross2);
  // Tail bows
  const colors = [0xffd166, 0x4dabff, 0x69f0ae];
  for (let i = 0; i < 5; i++) {
    const bow = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.12, 0.02),
      new THREE.MeshStandardMaterial({ color: colors[i % 3] })
    );
    bow.position.set((i % 2) * 0.15 - 0.05, -0.9 - i * 0.28, 0);
    bow.rotation.z = (i % 2) * 0.4 - 0.2;
    g.add(bow);
  }
  return g;
}

function makePlane() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.2,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0x2f7bff,
    roughness: 0.4,
    metalness: 0.15,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.4, 6, 12), bodyMat);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.45), accent);
  g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.3), accent);
  tail.position.set(-0.85, 0.15, 0);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.05), accent);
  fin.position.set(-0.9, 0.3, 0);
  g.add(fin);
  const prop = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.7, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  prop.position.set(1.0, 0, 0);
  g.add(prop);
  g.userData.prop = prop;
  return g;
}

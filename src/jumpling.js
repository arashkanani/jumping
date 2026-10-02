import * as THREE from "three";

/**
 * Bean / blob Jumpling — Fall Guys / SisyFox style.
 */
export function createJumpling({
  name,
  bodyColor = 0x3dcfff,
  accentColor = 0xffffff,
  eyeColor = 0x1a2030,
  position,
  hat = false,
}) {
  const group = new THREE.Group();
  group.position.copy(position);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.45,
    metalness: 0.05,
    flatShading: false,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.55,
  });

  // Soft bean body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 22), bodyMat);
  body.scale.set(0.95, 1.2, 0.9);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  // Belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), bellyMat);
  belly.scale.set(0.85, 1.0, 0.55);
  belly.position.set(0, 0.85, 0.38);
  group.add(belly);

  // Legs stubs
  const legMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor).multiplyScalar(0.85),
    roughness: 0.5,
  });
  const legL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), legMat);
  legL.scale.set(1, 0.7, 1.15);
  legL.position.set(-0.22, 0.2, 0.05);
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.22;
  group.add(legR);

  // Arms
  const armL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), bodyMat);
  armL.scale.set(0.7, 1.1, 0.7);
  armL.position.set(-0.7, 0.95, 0.05);
  armL.castShadow = true;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.7;
  group.add(armR);

  // Face
  const face = new THREE.Group();
  face.position.set(0, 1.05, 0.55);
  group.add(face);

  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.3 });

  function makeEye(ox) {
    const eye = new THREE.Group();
    eye.position.x = ox;
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), white);
    w.scale.set(1, 1.15, 0.6);
    eye.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), pupilMat);
    p.position.set(0, -0.01, 0.1);
    eye.add(p);
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(0.04, 0.04, 0.14);
    eye.add(shine);
    face.add(eye);
    return { eye, pupil: p };
  }
  const leftEye = makeEye(-0.18);
  const rightEye = makeEye(0.18);

  // Smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2a1830, roughness: 0.5 })
  );
  smile.position.set(0, -0.18, 0.12);
  smile.rotation.set(Math.PI, 0, Math.PI);
  face.add(smile);

  // Cheeks
  const cheekMat = new THREE.MeshStandardMaterial({
    color: 0xff8fab,
    transparent: true,
    opacity: 0.55,
    roughness: 0.6,
  });
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), cheekMat);
  cheekL.position.set(-0.35, -0.05, 0.08);
  cheekL.scale.set(1, 0.7, 0.5);
  face.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.35;
  face.add(cheekR);

  // Optional hat
  let hatMesh = null;
  if (hat) {
    hatMesh = new THREE.Group();
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0x2a2030, roughness: 0.6 })
    );
    hatMesh.add(brim);
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0x3a3040, roughness: 0.55 })
    );
    top.position.y = 0.2;
    hatMesh.add(top);
    hatMesh.position.y = 1.75;
    group.add(hatMesh);
  }

  // Contact shadow
  const blobShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 20),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  blobShadow.rotation.x = -Math.PI / 2;
  blobShadow.position.y = 0.02;
  group.add(blobShadow);

  let blinkT = 2 + Math.random() * 3;
  let armPhase = Math.random() * Math.PI * 2;

  return {
    name,
    group,
    bodyColor: new THREE.Color(bodyColor),
    playJump() {
      armL.position.y = 1.25;
      armR.position.y = 1.25;
    },
    playLand() {
      armL.position.y = 0.95;
      armR.position.y = 0.95;
    },
    update(dt, time, { grounded, squash, vy }) {
      const stretchY = grounded ? squash : THREE.MathUtils.clamp(1 + vy * 0.012, 0.8, 1.35);
      const stretchXZ = grounded
        ? 1 + (1 - squash) * 0.75
        : THREE.MathUtils.clamp(1 / stretchY, 0.75, 1.22);

      body.scale.set(0.95 * stretchXZ, 1.2 * stretchY, 0.9 * stretchXZ);
      body.position.y = 0.95 * stretchY;
      belly.position.y = 0.85 * stretchY;
      face.position.y = 1.05 * stretchY;
      armL.position.y = (grounded ? 0.95 : 1.2) * stretchY;
      armR.position.y = armL.position.y;
      if (hatMesh) hatMesh.position.y = 1.55 + 0.2 * stretchY;

      armPhase += dt;
      if (grounded) {
        const idle = Math.sin(time * 3 + armPhase) * 0.06;
        armL.position.x = -0.7;
        armR.position.x = 0.7;
        armL.rotation.z = 0.2 + idle;
        armR.rotation.z = -0.2 - idle;
        legL.rotation.z = idle * 0.3;
        legR.rotation.z = -idle * 0.3;
      } else {
        armL.rotation.z = 0.9;
        armR.rotation.z = -0.9;
      }

      blinkT -= dt;
      if (blinkT < 0) {
        leftEye.eye.scale.y = 0.12;
        rightEye.eye.scale.y = 0.12;
        if (blinkT < -0.1) {
          leftEye.eye.scale.y = 1;
          rightEye.eye.scale.y = 1;
          blinkT = 2 + Math.random() * 4;
        }
      }

      const h = Math.max(0, group.position.y - position.y);
      const s = THREE.MathUtils.clamp(1 - h * 0.18, 0.35, 1);
      blobShadow.scale.setScalar(s);
      blobShadow.material.opacity = 0.22 * s;
      blobShadow.position.y = 0.02 - h;
    },
  };
}

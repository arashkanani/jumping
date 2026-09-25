import * as THREE from "three";

/**
 * High-detail anthropomorphic rabbit athlete — Pixar / sports-mascot vibe.
 */
export function createJumpling({
  name,
  furColor = 0x9aa3ad,
  bellyColor = 0xf2f4f6,
  jerseyColor = 0x2f7bff,
  shortsColor = 0xff7a1a,
  shoeColor = 0x2f7bff,
  number = "7",
  eyeColor = 0x2a5fd4,
  position,
}) {
  const group = new THREE.Group();
  group.position.copy(position);

  const furMat = furMaterial(furColor);
  const furDark = furMaterial(new THREE.Color(furColor).multiplyScalar(0.78).getHex());
  const bellyMat = softMat(bellyColor, 0.62);
  const jerseyMat = fabricMat(jerseyColor);
  const jerseyDark = fabricMat(new THREE.Color(jerseyColor).multiplyScalar(0.72).getHex());
  const shortsMat = fabricMat(shortsColor);
  const shoeMat = softMat(shoeColor, 0.4, 0.12);
  const pinkMat = softMat(0xf5b8c8, 0.5);
  const pinkDeep = softMat(0xe890a8, 0.48);
  const whiteMat = softMat(0xffffff, 0.35);
  const gumMat = softMat(0xffc8c0, 0.55);

  // ——— Legs ———
  const thighL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.18, 8, 14), furMat);
  thighL.position.set(-0.17, 0.48, 0.02);
  thighL.castShadow = true;
  group.add(thighL);
  const thighR = thighL.clone();
  thighR.position.x = 0.17;
  group.add(thighR);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 8, 12), furMat);
  legL.position.set(-0.18, 0.28, 0.04);
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.18;
  group.add(legR);

  // ——— Sneakers (detailed) ———
  const shoeL = makeSneaker(shoeMat, whiteMat, gumMat, shoeColor);
  shoeL.position.set(-0.18, 0.02, 0.06);
  group.add(shoeL);
  const shoeR = makeSneaker(shoeMat, whiteMat, gumMat, shoeColor);
  shoeR.position.set(0.18, 0.02, 0.06);
  group.add(shoeR);

  // ——— Shorts ———
  const shorts = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 20), shortsMat);
  shorts.scale.set(1.08, 0.52, 0.92);
  shorts.position.y = 0.64;
  shorts.castShadow = true;
  group.add(shorts);

  const waistband = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.035, 10, 36),
    whiteMat
  );
  waistband.rotation.x = Math.PI / 2;
  waistband.position.y = 0.82;
  waistband.scale.set(1.05, 1, 0.85);
  group.add(waistband);

  const stripeMat = softMat(0xffffff, 0.4);
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.32, 0.025), stripeMat);
  stripeL.position.set(-0.4, 0.64, 0.22);
  group.add(stripeL);
  const stripeR = stripeL.clone();
  stripeR.position.x = 0.4;
  group.add(stripeR);
  // second thin stripe
  const stripeL2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.02), stripeMat);
  stripeL2.position.set(-0.34, 0.64, 0.24);
  group.add(stripeL2);
  const stripeR2 = stripeL2.clone();
  stripeR2.position.x = 0.34;
  group.add(stripeR2);

  // ——— Jersey torso ———
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 36, 28), jerseyMat);
  torso.scale.set(0.92, 1.08, 0.72);
  torso.position.y = 1.08;
  torso.castShadow = true;
  group.add(torso);

  // Jersey hem
  const hem = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.03, 8, 32),
    jerseyDark
  );
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.86;
  hem.scale.set(1.05, 1, 0.78);
  group.add(hem);

  // Collar / neckline
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.035, 8, 24, Math.PI * 1.2),
    whiteMat
  );
  collar.position.set(0, 1.42, 0.22);
  collar.rotation.x = 0.9;
  group.add(collar);

  // Sleeve caps
  const sleeveL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), jerseyDark);
  sleeveL.scale.set(0.9, 0.7, 0.85);
  sleeveL.position.set(-0.42, 1.2, 0.05);
  group.add(sleeveL);
  const sleeveR = sleeveL.clone();
  sleeveR.position.x = 0.42;
  group.add(sleeveR);

  // Soft belly peek under jersey
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 22, 16), bellyMat);
  belly.scale.set(0.85, 1.05, 0.5);
  belly.position.set(0, 0.98, 0.3);
  group.add(belly);

  // Jersey number with glow backing
  const numberBack = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 24),
    softMat(0xffffff, 0.5)
  );
  numberBack.position.set(0, 1.12, 0.365);
  numberBack.scale.set(1, 1.15, 1);
  group.add(numberBack);
  const numberMesh = makeNumberPlane(number, shortsColor);
  numberMesh.position.set(0, 1.12, 0.38);
  group.add(numberMesh);

  // ——— Head ———
  const head = new THREE.Group();
  head.position.y = 1.68;
  group.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.44, 40, 32), furMat);
  skull.scale.set(0.96, 1.02, 0.92);
  skull.castShadow = true;
  head.add(skull);

  // Forehead fluff tuft
  const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), furMat);
  tuft.position.set(0, 0.38, 0.12);
  tuft.scale.set(1.3, 0.7, 0.9);
  head.add(tuft);

  // Cheek fluff
  const fluffL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), furMat);
  fluffL.position.set(-0.34, -0.02, 0.18);
  fluffL.scale.set(1.1, 0.85, 0.9);
  head.add(fluffL);
  const fluffR = fluffL.clone();
  fluffR.position.x = 0.34;
  head.add(fluffR);

  // Brow ridges
  const browL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), furDark);
  browL.scale.set(1.4, 0.45, 0.7);
  browL.position.set(-0.16, 0.2, 0.34);
  browL.rotation.z = 0.15;
  head.add(browL);
  const browR = browL.clone();
  browR.position.x = 0.16;
  browR.rotation.z = -0.15;
  head.add(browR);

  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), bellyMat);
  muzzle.scale.set(1.08, 0.82, 1.0);
  muzzle.position.set(0, -0.12, 0.3);
  head.add(muzzle);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), pinkDeep);
  nose.scale.set(1.15, 0.85, 0.9);
  nose.position.set(0, -0.06, 0.5);
  head.add(nose);
  const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), softMat(0xc07080, 0.6));
  nostrilL.position.set(-0.02, -0.07, 0.54);
  head.add(nostrilL);
  const nostrilR = nostrilL.clone();
  nostrilR.position.x = 0.02;
  head.add(nostrilR);

  // Happy open mouth
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    softMat(0x4a2030, 0.55)
  );
  mouth.scale.set(1.25, 0.75, 0.85);
  mouth.position.set(0, -0.2, 0.4);
  mouth.rotation.x = 0.35;
  head.add(mouth);

  // Tongue
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), softMat(0xff6b8a, 0.45));
  tongue.scale.set(1.2, 0.4, 1.4);
  tongue.position.set(0, -0.24, 0.42);
  head.add(tongue);

  // Buck teeth
  const toothMat = softMat(0xffffff, 0.28);
  const toothL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.035), toothMat);
  toothL.position.set(-0.038, -0.2, 0.46);
  toothL.castShadow = true;
  head.add(toothL);
  const toothR = toothL.clone();
  toothR.position.x = 0.038;
  head.add(toothR);

  // Rosy cheeks
  const cheekMat = softMat(0xff9ab0, 0.55);
  cheekMat.transparent = true;
  cheekMat.opacity = 0.55;
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), cheekMat);
  cheekL.position.set(-0.3, -0.06, 0.34);
  cheekL.scale.set(1.1, 0.7, 0.6);
  head.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.3;
  head.add(cheekR);

  // Whiskers
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.28, 4), whiskerMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(side * 0.28, -0.1 + i * 0.04, 0.38);
      w.rotation.y = side * (0.35 + i * 0.12);
      w.rotation.x = (i - 1) * 0.15;
      head.add(w);
    }
  }

  // ——— Big expressive eyes ———
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.08, 0.34);
  head.add(eyes);

  function makeEye(ox) {
    const eye = new THREE.Group();
    eye.position.x = ox;

    // Eye socket shadow
    const socket = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 18, 14),
      softMat(0x6a7078, 0.7)
    );
    socket.scale.set(1.05, 1.15, 0.45);
    socket.position.z = -0.02;
    eye.add(socket);

    const white = new THREE.Mesh(new THREE.SphereGeometry(0.145, 22, 16), whiteMat);
    white.scale.set(1, 1.18, 0.7);
    white.castShadow = true;
    eye.add(white);

    // Iris with slight depth
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 20, 14),
      softMat(eyeColor, 0.28, 0.08)
    );
    iris.position.set(0, -0.01, 0.085);
    eye.add(iris);

    // Inner iris ring
    const irisRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.012, 8, 20),
      softMat(new THREE.Color(eyeColor).multiplyScalar(0.55).getHex(), 0.35)
    );
    irisRing.position.copy(iris.position);
    irisRing.position.z += 0.03;
    eye.add(irisRing);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 14, 10),
      softMat(0x120818, 0.25)
    );
    pupil.position.set(0, -0.012, 0.145);
    eye.add(pupil);

    // Dual catchlights
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(0.035, 0.045, 0.17);
    eye.add(shine);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(-0.03, -0.02, 0.165);
    eye.add(shine2);

    // Upper eyelid
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
      furMat
    );
    lid.scale.set(1.02, 0.55, 0.75);
    lid.position.set(0, 0.06, 0.02);
    lid.rotation.x = 0.15;
    eye.add(lid);

    eyes.add(eye);
    return { eye, pupil, lid };
  }
  const leftEye = makeEye(-0.155);
  const rightEye = makeEye(0.155);

  // ——— Long rabbit ears ———
  function makeEar(side) {
    const ear = new THREE.Group();

    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.62, 8, 14), furMat);
    outer.castShadow = true;
    ear.add(outer);

    // Soft tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), furMat);
    tip.position.y = 0.42;
    tip.scale.set(1.05, 0.7, 0.9);
    ear.add(tip);

    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.48, 6, 10), pinkMat);
    inner.position.set(0, 0.02, 0.045);
    ear.add(inner);

    // Inner ear detail line
    const crease = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.015, 0.35, 4, 6),
      pinkDeep
    );
    crease.position.set(0, 0.02, 0.06);
    ear.add(crease);

    ear.position.set(side * 0.2, 0.45, -0.06);
    ear.rotation.z = side * 0.22;
    ear.rotation.x = -0.28;
    ear.rotation.y = side * -0.12;
    head.add(ear);
    return ear;
  }
  const earL = makeEar(-1);
  const earR = makeEar(1);

  // ——— Arms + hands with fingers ———
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.34, 8, 12), furMat);
  armL.position.set(-0.55, 1.08, 0.06);
  armL.rotation.z = 0.55;
  armL.castShadow = true;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.55;
  armR.rotation.z = -0.55;
  group.add(armR);

  const handL = makeHand(furMat, pinkMat);
  handL.position.set(-0.72, 0.82, 0.14);
  group.add(handL);
  const handR = makeHand(furMat, pinkMat);
  handR.position.set(0.72, 0.82, 0.14);
  handR.scale.x = -1;
  group.add(handR);

  // Fluffy tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), furMat);
  tail.position.set(0, 0.72, -0.42);
  tail.scale.set(1.1, 1, 1.1);
  tail.castShadow = true;
  group.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), bellyMat);
  tailTip.position.set(0, 0.72, -0.52);
  group.add(tailTip);

  // Contact shadow
  const blobShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 28),
    new THREE.MeshBasicMaterial({
      color: 0x1a3020,
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
    bodyColor: new THREE.Color(jerseyColor),
    playJump() {
      armL.rotation.z = 1.25;
      armR.rotation.z = -1.25;
      earL.rotation.x = -0.55;
      earR.rotation.x = -0.55;
    },
    playLand() {
      armL.rotation.z = 0.4;
      armR.rotation.z = -0.4;
      earL.rotation.x = -0.15;
      earR.rotation.x = -0.15;
    },
    update(dt, time, { grounded, squash, vy }) {
      const stretchY = grounded ? squash : THREE.MathUtils.clamp(1 + vy * 0.012, 0.8, 1.35);
      const stretchXZ = grounded
        ? 1 + (1 - squash) * 0.7
        : THREE.MathUtils.clamp(1 / stretchY, 0.78, 1.2);

      torso.scale.set(0.92 * stretchXZ, 1.08 * stretchY, 0.72 * stretchXZ);
      torso.position.y = 1.08 * stretchY;
      shorts.scale.set(1.08 * stretchXZ, 0.52 * stretchY, 0.92 * stretchXZ);
      shorts.position.y = 0.64 * stretchY;
      waistband.position.y = 0.82 * stretchY;
      hem.position.y = 0.86 * stretchY;
      collar.position.y = 1.42 * stretchY;
      sleeveL.position.y = 1.2 * stretchY;
      sleeveR.position.y = 1.2 * stretchY;
      head.position.y = 1.4 + 0.28 * stretchY;
      head.scale.set(stretchXZ, stretchY, stretchXZ);
      belly.position.y = 0.98 * stretchY;
      numberMesh.position.y = 1.12 * stretchY;
      numberBack.position.y = 1.12 * stretchY;
      armL.position.y = 1.08 * stretchY;
      armR.position.y = 1.08 * stretchY;
      handL.position.y = 0.82 * stretchY;
      handR.position.y = 0.82 * stretchY;
      tail.position.y = 0.72 * stretchY;
      tailTip.position.y = 0.72 * stretchY;
      stripeL.position.y = 0.64 * stretchY;
      stripeR.position.y = 0.64 * stretchY;
      stripeL2.position.y = 0.64 * stretchY;
      stripeR2.position.y = 0.64 * stretchY;

      armPhase += dt;
      if (grounded) {
        const idle = Math.sin(time * 3 + armPhase) * 0.08;
        armL.rotation.z = 0.5 + idle;
        armR.rotation.z = -0.5 - idle;
        earL.rotation.z = -0.22 + idle * 0.45;
        earR.rotation.z = 0.22 - idle * 0.45;
        earL.rotation.x = -0.28 + Math.sin(time * 2.2 + armPhase) * 0.04;
        earR.rotation.x = -0.28 + Math.sin(time * 2.2 + armPhase + 1) * 0.04;
        legL.rotation.x = idle * 0.2;
        legR.rotation.x = -idle * 0.2;
        thighL.rotation.x = idle * 0.1;
        thighR.rotation.x = -idle * 0.1;
        tail.rotation.y = idle * 0.5;
        browL.rotation.z = 0.15 + idle * 0.2;
        browR.rotation.z = -0.15 - idle * 0.2;
      } else {
        armL.rotation.z += (1.2 - armL.rotation.z) * 0.15;
        armR.rotation.z += (-1.2 - armR.rotation.z) * 0.15;
        earL.rotation.x += (-0.65 - earL.rotation.x) * 0.12;
        earR.rotation.x += (-0.65 - earR.rotation.x) * 0.12;
      }

      // Soft eye look / blink
      blinkT -= dt;
      if (blinkT < 0) {
        leftEye.eye.scale.y = 0.12;
        rightEye.eye.scale.y = 0.12;
        leftEye.lid.scale.y = 1.4;
        rightEye.lid.scale.y = 1.4;
        if (blinkT < -0.12) {
          leftEye.eye.scale.y = 1;
          rightEye.eye.scale.y = 1;
          leftEye.lid.scale.y = 0.55;
          rightEye.lid.scale.y = 0.55;
          blinkT = 2.2 + Math.random() * 3.5;
        }
      }

      const look = Math.sin(time * 0.7) * 0.012;
      leftEye.pupil.position.x = look;
      rightEye.pupil.position.x = look;

      const h = Math.max(0, group.position.y - position.y);
      const s = THREE.MathUtils.clamp(1 - h * 0.18, 0.35, 1);
      blobShadow.scale.setScalar(s);
      blobShadow.material.opacity = 0.22 * s;
      blobShadow.position.y = 0.02 - h;
    },
  };
}

function makeSneaker(shoeMat, whiteMat, gumMat, accentHex) {
  const g = new THREE.Group();

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 12), shoeMat);
  body.scale.set(1.15, 0.55, 1.55);
  body.position.set(0, 0.09, 0.08);
  body.castShadow = true;
  g.add(body);

  // Toe cap
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), whiteMat);
  toe.scale.set(1.05, 0.55, 0.9);
  toe.position.set(0, 0.08, 0.22);
  g.add(toe);

  // Sole layers
  const sole = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), whiteMat);
  sole.scale.set(1.25, 0.28, 1.6);
  sole.position.set(0, 0.025, 0.06);
  g.add(sole);
  const gum = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), gumMat);
  gum.scale.set(1.2, 0.18, 1.55);
  gum.position.set(0, 0.005, 0.06);
  g.add(gum);

  // Tongue
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), whiteMat);
  tongue.position.set(0, 0.14, 0.02);
  tongue.rotation.x = -0.4;
  g.add(tongue);

  // Laces
  const laceMat = softMat(0xffffff, 0.4);
  for (let i = 0; i < 3; i++) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.02), laceMat);
    lace.position.set(0, 0.13 + i * 0.025, 0.06 - i * 0.02);
    g.add(lace);
  }

  // Side swoosh
  const swoosh = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.06, 0.12),
    softMat(0xffffff, 0.35)
  );
  swoosh.position.set(0.14, 0.1, 0.06);
  swoosh.rotation.y = 0.3;
  g.add(swoosh);

  // Heel tab
  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.04), softMat(accentHex, 0.4));
  heel.position.set(0, 0.12, -0.1);
  g.add(heel);

  return g;
}

function makeHand(furMat, padMat) {
  const g = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), furMat);
  palm.scale.set(1.05, 0.75, 0.9);
  palm.castShadow = true;
  g.add(palm);

  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), padMat);
  pad.scale.set(1.1, 0.5, 0.9);
  pad.position.set(0, -0.02, 0.05);
  g.add(pad);

  for (let i = 0; i < 3; i++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.06, 4, 8), furMat);
    finger.position.set((i - 1) * 0.055, 0.02, 0.1);
    finger.rotation.x = 0.6;
    g.add(finger);
  }
  return g;
}

function furMaterial(color) {
  const map = makeFurTexture(color);
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness: 0.78,
    metalness: 0.02,
  });
}

function fabricMat(color) {
  const map = makeFabricTexture(color);
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness: 0.58,
    metalness: 0.05,
  });
}

function softMat(color, roughness, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function makeFurTexture(baseColor) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  const hex = "#" + new THREE.Color(baseColor).getHexString();
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.strokeStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y + 3 + Math.random() * 5);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeFabricTexture(baseColor) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  const hex = "#" + new THREE.Color(baseColor).getHexString();
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 2) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, y, 64, 1);
  }
  for (let x = 0; x < 64; x += 2) {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(x, 0, 1, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makeNumberPlane(text, accentColor = 0xff7a1a) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  ctx.font = "900 170px Fredoka, Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 22;
  ctx.lineJoin = "round";
  ctx.strokeText(text, 128, 140);
  ctx.fillStyle = "#" + new THREE.Color(accentColor).getHexString();
  ctx.fillText(text, 128, 140);
  // inner highlight
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "900 170px Fredoka, Nunito, sans-serif";
  ctx.fillText(text, 128, 132);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.38),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
}

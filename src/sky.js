import * as THREE from "three";

/**
 * Bright desert sky — simple clouds, soft sun (Jumplings vibe).
 */
export function createSkyWorld(scene) {
  const skyGeo = new THREE.SphereGeometry(90, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x5eb0ff) },
      midColor: { value: new THREE.Color(0x9ad0ff) },
      bottomColor: { value: new THREE.Color(0xffe0b8) },
      offset: { value: 10 },
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

  // Sun disc
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0 })
  );
  sun.position.set(-20, 20, -30);
  scene.add(sun);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);
  anim.push({
    update(t) {
      sunGlow.scale.setScalar(1 + Math.sin(t * 1.1) * 0.04);
    },
  });

  // Soft white clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    transparent: true,
    opacity: 0.9,
    flatShading: true,
  });
  for (let i = 0; i < 10; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), cloudMat);
      p.position.set(j * 1.2 - 1.2, Math.random() * 0.3, (Math.random() - 0.5) * 0.8);
      p.scale.set(1.2, 0.7, 1);
      cloud.add(p);
    }
    cloud.position.set((Math.random() - 0.5) * 40, 12 + Math.random() * 6, -14 - Math.random() * 20);
    cloud.scale.setScalar(1.2 + Math.random());
    scene.add(cloud);
    const baseX = cloud.position.x;
    const phase = Math.random() * 10;
    anim.push({
      update(t) {
        cloud.position.x = baseX + Math.sin(t * 0.15 + phase) * 2;
      },
    });
  }

  return {
    update(time) {
      for (const a of anim) a.update(time);
    },
  };
}

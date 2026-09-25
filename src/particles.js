import * as THREE from "three";

export class ParticleBurst {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.pool = [];

    this.geo = new THREE.SphereGeometry(0.08, 8, 6);
  }

  _spawn(x, y, z, color, count, speed) {
    for (let i = 0; i < count; i++) {
      let p = this.pool.pop();
      if (!p) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.6,
          roughness: 0.4,
          transparent: true,
        });
        p = {
          mesh: new THREE.Mesh(this.geo, mat),
          vel: new THREE.Vector3(),
          life: 0,
          maxLife: 1,
        };
        this.scene.add(p.mesh);
      }

      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      p.mesh.material.color.copy(color);
      p.mesh.material.emissive.copy(color);
      p.mesh.material.opacity = 1;
      p.mesh.scale.setScalar(0.6 + Math.random() * 1.2);

      const angle = Math.random() * Math.PI * 2;
      const up = 0.4 + Math.random() * 0.8;
      p.vel.set(
        Math.cos(angle) * speed * (0.4 + Math.random()),
        up * speed,
        Math.sin(angle) * speed * (0.4 + Math.random())
      );
      p.life = 0;
      p.maxLife = 0.45 + Math.random() * 0.45;
      this.particles.push(p);
    }
  }

  burst(x, y, z, color) {
    this._spawn(x, y, z, color, 18, 3.2);
  }

  land(x, y, z, color) {
    this._spawn(x, y, z, color, 22, 2.4);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.vel.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = Math.max(0, 1 - t);
      p.mesh.scale.multiplyScalar(0.985);

      if (t >= 1) {
        p.mesh.visible = false;
        this.particles.splice(i, 1);
        this.pool.push(p);
      }
    }
  }
}

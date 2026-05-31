import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';
import { VoxelWorld } from './voxel-world.js';

// ---------------------------------------------------------------------------
//  PETALS + CLOUDS - animated drifting cherry petals and slow voxel clouds.
//  Returns the petal mesh, the per-frame update fn, a visibility toggle and
//  the cloud group (so the render loop can drift it).
// ---------------------------------------------------------------------------
export function createPetals({ scene, R }) {
  //  FALLING PETALS — animated InstancedMesh of tiny drifting voxels
  // ---------------------------------------------------------------------------
  const PETAL_COUNT = 900;
  const petalGeo = new THREE.BoxGeometry(0.5, 0.18, 0.42);
  const petalMat = new THREE.MeshStandardMaterial({ roughness: 0.7, transparent: true, opacity: 0.95 });
  const petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, PETAL_COUNT);
  petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  petalMesh.frustumCulled = false;
  scene.add(petalMesh);

  const petals = [];
  const SPAWN_Y = 55, FLOOR_Y = -2, AREA = R + 6;
  const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pe = new THREE.Euler(), _pp = new THREE.Vector3(), _ps = new THREE.Vector3(1, 1, 1);
  function resetPetal(p, randomY = true) {
    p.x = (Math.random() * 2 - 1) * AREA;
    p.z = (Math.random() * 2 - 1) * AREA;
    p.y = randomY ? Math.random() * SPAWN_Y : SPAWN_Y;
    p.vy = 1.6 + Math.random() * 1.8;
    p.sway = 0.6 + Math.random() * 1.4;
    p.swayFreq = 0.6 + Math.random() * 1.2;
    p.phase = Math.random() * Math.PI * 2;
    p.rot = Math.random() * Math.PI * 2;
    p.rotSpd = (Math.random() * 2 - 1) * 2.2;
    p.spin = (Math.random() * 2 - 1) * 2.0;
  }
  for (let i = 0; i < PETAL_COUNT; i++) {
    const p = {};
    resetPetal(p, true);
    petals.push(p);
    petalMesh.setColorAt(i, new THREE.Color(pick(PAL.petal)));
  }
  petalMesh.instanceColor.needsUpdate = true;

  let petalsOn = true;
  function updatePetals(dt, t) {
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petals[i];
      if (petalsOn) {
        p.y -= p.vy * dt;
        p.rot += p.rotSpd * dt;
        p.spinPhase = (p.spinPhase || 0) + p.spin * dt;
        if (p.y < FLOOR_Y) resetPetal(p, false);
      }
      const sx = p.x + Math.sin(t * p.swayFreq + p.phase) * p.sway;
      const sz = p.z + Math.cos(t * p.swayFreq * 0.8 + p.phase) * p.sway;
      _pp.set(sx, p.y, sz);
      _pe.set(p.spinPhase || 0, p.rot, p.rot * 0.6);
      _pq.setFromEuler(_pe);
      _pm.compose(_pp, _pq, _ps);
      petalMesh.setMatrixAt(i, _pm);
    }
    petalMesh.instanceMatrix.needsUpdate = true;
  }

  // drifting soft clouds (flat billboard-ish voxel slabs up high)
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);
  const cloudWorld = new VoxelWorld();
  function makeCloud(cx, cy, cz) {
    const w = 6 + (Math.random() * 6 | 0), d = 4 + (Math.random() * 4 | 0);
    for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) {
      const dx = (x - w / 2) / (w / 2), dz = (z - d / 2) / (d / 2);
      if (dx * dx + dz * dz > 1) continue;
      const h = 1 + (Math.random() * 2 | 0);
      for (let y = 0; y < h; y++)
        cloudWorld.add(cx + x, cy + y, cz + z, Math.random() < 0.5 ? '#ffffff' : '#f0f4ff',
          { rough: 1, jitter: 0.1 });
    }
  }
  for (let i = 0; i < 6; i++) makeCloud(-80 + i * 30 + (Math.random() * 10 | 0), 60 + (Math.random() * 14 | 0), -60 + (Math.random() * 120 | 0));
  cloudWorld.commit(cloudGroup);


  function setPetalsOn(on) { petalsOn = on; petalMesh.visible = on; }
  return { petalMesh, updatePetals, setPetalsOn, cloudGroup };
}
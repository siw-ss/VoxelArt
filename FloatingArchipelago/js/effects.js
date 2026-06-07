import * as THREE from '../vendor/three.module.js';
import { PAL, pick } from './palette.js';
import { VoxelWorld } from './voxel-world.js';

// ---------------------------------------------------------------------------
//  EFFECTS — Waterfalls, ambient particles, cloud systems
// ---------------------------------------------------------------------------
export function createEffects({ scene, root, islands }) {

    // ---- WATERFALL PARTICLES ----
    const WATERFALL_COUNT = 250;
    const waterfallGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    const waterfallMat = new THREE.MeshStandardMaterial({
        color: 0x00FFFF, roughness: 0.3, transparent: true, opacity: 0.7,
        emissive: 0x00E5FF, emissiveIntensity: 0.3
    });
    const waterfallMesh = new THREE.InstancedMesh(waterfallGeo, waterfallMat, WATERFALL_COUNT);
    waterfallMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    waterfallMesh.frustumCulled = false;
    root.add(waterfallMesh);

    // Waterfall sources (from higher islands to lower)
    const waterfallSources = [
        { x: 0, y: 15, z: -30, targetY: 0 },    // north -> central
        { x: 25, y: 8, z: 5, targetY: 0 },       // east edge
        { x: -25, y: 5, z: 5, targetY: -8 },     // west -> south direction
    ];

    const particles = [];
    const _wm = new THREE.Matrix4(), _wq = new THREE.Quaternion(), _wp = new THREE.Vector3(), _ws = new THREE.Vector3(1, 1, 1);

    function resetParticle(p) {
        const src = waterfallSources[Math.floor(Math.random() * waterfallSources.length)];
        p.x = src.x + (Math.random() - 0.5) * 3;
        p.y = src.y;
        p.z = src.z + (Math.random() - 0.5) * 3;
        p.vy = 8 + Math.random() * 4;
        p.vx = (Math.random() - 0.5) * 0.5; // lateral drift (wind)
        p.vz = (Math.random() - 0.5) * 0.5;
        p.life = 3 + Math.random() * 2;
        p.age = 0;
        p.targetY = src.targetY;
    }

    for (let i = 0; i < WATERFALL_COUNT; i++) {
        const p = {};
        resetParticle(p);
        p.age = Math.random() * p.life; // stagger start
        p.y -= p.vy * p.age;
        particles.push(p);
    }

    // ---- MIST PARTICLES at waterfall bases ----
    const MIST_COUNT = 80;
    const mistGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const mistMat = new THREE.MeshStandardMaterial({
        color: 0xB0FFFF, roughness: 1.0, transparent: true, opacity: 0.3
    });
    const mistMesh = new THREE.InstancedMesh(mistGeo, mistMat, MIST_COUNT);
    mistMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mistMesh.frustumCulled = false;
    root.add(mistMesh);

    const mistParticles = [];
    for (let i = 0; i < MIST_COUNT; i++) {
        const src = waterfallSources[Math.floor(Math.random() * waterfallSources.length)];
        mistParticles.push({
            x: src.x + (Math.random() - 0.5) * 6,
            y: src.targetY + Math.random() * 2,
            z: src.z + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.3,
            vz: (Math.random() - 0.5) * 0.3,
            phase: Math.random() * Math.PI * 2,
            life: 2 + Math.random() * 3,
            age: Math.random() * 3,
            srcIdx: Math.floor(Math.random() * waterfallSources.length),
        });
    }

    // ---- AMBIENT POLLEN / DUST ----
    const POLLEN_COUNT = 50;
    const pollenGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const pollenMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFE0, roughness: 0.5, transparent: true, opacity: 0.6,
        emissive: 0xFFFFE0, emissiveIntensity: 0.4
    });
    const pollenMesh = new THREE.InstancedMesh(pollenGeo, pollenMat, POLLEN_COUNT);
    pollenMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    pollenMesh.frustumCulled = false;
    root.add(pollenMesh);

    const pollenParticles = [];
    for (let i = 0; i < POLLEN_COUNT; i++) {
        pollenParticles.push({
            x: (Math.random() - 0.5) * 80,
            y: Math.random() * 30,
            z: (Math.random() - 0.5) * 80,
            phase: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.4,
        });
    }

    // ---- CLOUDS ----
    const cloudGroup = new THREE.Group();
    root.add(cloudGroup);
    const cloudWorld = new VoxelWorld();
    function makeCloud(cx, cy, cz) {
        const w = 8 + (Math.random() * 8 | 0), d = 5 + (Math.random() * 5 | 0);
        for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) {
            const dx = (x - w / 2) / (w / 2), dz = (z - d / 2) / (d / 2);
            if (dx * dx + dz * dz > 1) continue;
            const h = 1 + (Math.random() * 2 | 0);
            for (let y = 0; y < h; y++)
                cloudWorld.add(cx + x, cy + y, cz + z, Math.random() < 0.5 ? '#ffffff' : '#e8f4ff',
                    { rough: 1, jitter: 0.1 });
        }
    }
    for (let i = 0; i < 5; i++) {
        makeCloud(-60 + i * 28 + (Math.random() * 10 | 0), -20 + (Math.random() * 8 | 0), -50 + (Math.random() * 100 | 0));
    }
    cloudWorld.commit(cloudGroup);

    let waterfallsOn = true;

    // ---- UPDATE FUNCTION ----
    function updateEffects(dt, t) {
        // Waterfalls
        for (let i = 0; i < WATERFALL_COUNT; i++) {
            const p = particles[i];
            if (waterfallsOn) {
                p.age += dt;
                p.y -= p.vy * dt;
                p.x += p.vx * dt;
                p.z += p.vz * dt;
                if (p.age > p.life || p.y < p.targetY - 10) resetParticle(p);
            }
            _wp.set(p.x, p.y, p.z);
            _wq.identity();
            const fade = 1 - Math.min(1, p.age / p.life);
            _ws.set(0.4 * fade + 0.2, 0.6, 0.4 * fade + 0.2);
            _wm.compose(_wp, _wq, _ws);
            waterfallMesh.setMatrixAt(i, _wm);
        }
        waterfallMesh.instanceMatrix.needsUpdate = true;

        // Mist
        for (let i = 0; i < MIST_COUNT; i++) {
            const m = mistParticles[i];
            m.age += dt * 0.5;
            m.x += Math.sin(t * 0.3 + m.phase) * 0.01;
            m.z += Math.cos(t * 0.3 + m.phase) * 0.01;
            m.y += Math.sin(t * 0.5 + m.phase) * 0.005;
            if (m.age > m.life) {
                const src = waterfallSources[m.srcIdx];
                m.x = src.x + (Math.random() - 0.5) * 6;
                m.y = src.targetY + Math.random() * 2;
                m.z = src.z + (Math.random() - 0.5) * 6;
                m.age = 0;
            }
            _wp.set(m.x, m.y, m.z);
            _wq.identity();
            _ws.set(1.5, 0.5, 1.5);
            _wm.compose(_wp, _wq, _ws);
            mistMesh.setMatrixAt(i, _wm);
        }
        mistMesh.instanceMatrix.needsUpdate = true;

        // Pollen
        for (let i = 0; i < POLLEN_COUNT; i++) {
            const p = pollenParticles[i];
            _wp.set(
                p.x + Math.sin(t * p.speed + p.phase) * 3,
                p.y + Math.sin(t * 0.3 + p.phase * 2) * 1.5,
                p.z + Math.cos(t * p.speed * 0.7 + p.phase) * 3
            );
            _wq.identity();
            _ws.set(1, 1, 1);
            _wm.compose(_wp, _wq, _ws);
            pollenMesh.setMatrixAt(i, _wm);
        }
        pollenMesh.instanceMatrix.needsUpdate = true;
    }

    function setWaterfallsOn(on) {
        waterfallsOn = on;
        waterfallMesh.visible = on;
        mistMesh.visible = on;
    }

    return { updateEffects, setWaterfallsOn, cloudGroup };
}

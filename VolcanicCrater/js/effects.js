import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  EFFECTS — Lava flow particles, steam vents, ash drift, seismic rumble
// ---------------------------------------------------------------------------
export function createEffects({ scene, root, lavaChannels, ventPositions }) {

    const _m = new THREE.Matrix4();
    const _q = new THREE.Quaternion();
    const _p = new THREE.Vector3();
    const _s = new THREE.Vector3(1, 1, 1);

    // ---- LAVA FLOW PARTICLES ----
    const LAVA_COUNT = 400;
    const lavaGeo = new THREE.BoxGeometry(0.6, 0.3, 0.6);
    const lavaMat = new THREE.MeshStandardMaterial({
        color: 0xFF4500, roughness: 0.3, transparent: true, opacity: 0.9,
        emissive: 0xFF4500, emissiveIntensity: 0.8
    });
    const lavaMesh = new THREE.InstancedMesh(lavaGeo, lavaMat, LAVA_COUNT);
    lavaMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    lavaMesh.frustumCulled = false;
    root.add(lavaMesh);

    const lavaParticles = [];
    let lavaSpeedMultiplier = 1.0;

    function resetLavaParticle(p) {
        const ch = lavaChannels[Math.floor(Math.random() * lavaChannels.length)];
        const startT = Math.random() * 0.1;
        p.x = ch.startX + (ch.endX - ch.startX) * startT + (Math.random() - 0.5) * 2;
        p.z = ch.startZ + (ch.endZ - ch.startZ) * startT + (Math.random() - 0.5) * 2;
        p.y = -2 + Math.random() * 0.5;
        p.vx = (ch.endX - ch.startX) * 0.02;
        p.vz = (ch.endZ - ch.startZ) * 0.02;
        p.life = 6 + Math.random() * 4;
        p.age = 0;
        p.channel = ch;
    }

    for (let i = 0; i < LAVA_COUNT; i++) {
        const p = {};
        resetLavaParticle(p);
        p.age = Math.random() * p.life;
        // Advance position based on age
        p.x += p.vx * p.age * 60;
        p.z += p.vz * p.age * 60;
        lavaParticles.push(p);
    }

    // ---- STEAM VENT PARTICLES ----
    const STEAM_COUNT = 180;
    const steamGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const steamMat = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0, roughness: 1.0, transparent: true, opacity: 0.4
    });
    const steamMesh = new THREE.InstancedMesh(steamGeo, steamMat, STEAM_COUNT);
    steamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    steamMesh.frustumCulled = false;
    root.add(steamMesh);

    const steamParticles = [];

    function resetSteamParticle(p) {
        const vent = ventPositions[Math.floor(Math.random() * ventPositions.length)];
        p.x = vent.x + (Math.random() - 0.5) * 1.5;
        p.z = vent.z + (Math.random() - 0.5) * 1.5;
        p.y = 8 + Math.random() * 3;
        p.vy = 4 + Math.random() * 3;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vz = (Math.random() - 0.5) * 0.5;
        p.life = 2 + Math.random() * 1.5;
        p.age = 0;
        p.phase = Math.random() * Math.PI * 2;
    }

    for (let i = 0; i < STEAM_COUNT; i++) {
        const p = {};
        resetSteamParticle(p);
        p.age = Math.random() * p.life;
        p.y += p.vy * p.age;
        steamParticles.push(p);
    }

    // ---- ASH PARTICLES ----
    const ASH_COUNT = 100;
    const ashGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const ashMat = new THREE.MeshStandardMaterial({
        color: 0x444444, roughness: 1.0, transparent: true, opacity: 0.5
    });
    const ashMesh = new THREE.InstancedMesh(ashGeo, ashMat, ASH_COUNT);
    ashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    ashMesh.frustumCulled = false;
    root.add(ashMesh);

    const ashParticles = [];
    for (let i = 0; i < ASH_COUNT; i++) {
        ashParticles.push({
            x: (Math.random() - 0.5) * 70,
            y: 5 + Math.random() * 30,
            z: (Math.random() - 0.5) * 70,
            vx: 0.3 + Math.random() * 0.4,
            vy: -0.1 - Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
        });
    }

    // ---- SEISMIC STATE ----
    let seismicActive = false;
    let seismicTimer = 0;
    const SEISMIC_DURATION = 3.0;

    // ---- CONTROLS ----
    let lavaOn = true;
    let steamOn = true;

    function triggerSeismic() {
        seismicActive = true;
        seismicTimer = 0;
    }

    function setLavaOn(on) { lavaOn = on; lavaMesh.visible = on; }
    function setSteamOn(on) { steamOn = on; steamMesh.visible = on; }
    function setLavaSpeed(mult) { lavaSpeedMultiplier = mult; }

    // ---- UPDATE ----
    function updateEffects(dt, t, camera) {
        // Lava flow
        if (lavaOn) {
            for (let i = 0; i < LAVA_COUNT; i++) {
                const p = lavaParticles[i];
                p.age += dt;
                p.x += p.vx * dt * 60 * lavaSpeedMultiplier;
                p.z += p.vz * dt * 60 * lavaSpeedMultiplier;
                // Slight lateral wobble
                p.x += Math.sin(t * 2 + i) * 0.005;
                p.z += Math.cos(t * 1.5 + i * 0.7) * 0.005;

                if (p.age > p.life) resetLavaParticle(p);

                const fade = Math.min(1, (p.life - p.age) / 2);
                _p.set(p.x, p.y, p.z);
                _q.identity();
                _s.set(0.6 * fade + 0.3, 0.3, 0.6 * fade + 0.3);
                _m.compose(_p, _q, _s);
                lavaMesh.setMatrixAt(i, _m);
            }
            lavaMesh.instanceMatrix.needsUpdate = true;
        }

        // Steam vents (intermittent bursts)
        if (steamOn) {
            const steamCycle = t % 5; // 3s on, 2s off
            const steamActive = steamCycle < 3;
            const steamIntensity = seismicActive ? 1.5 : 1.0;

            for (let i = 0; i < STEAM_COUNT; i++) {
                const p = steamParticles[i];
                if (steamActive || p.age < p.life * 0.5) {
                    p.age += dt * steamIntensity;
                    p.y += p.vy * dt * steamIntensity;
                    p.x += p.vx * dt + Math.sin(t + p.phase) * 0.02;
                    p.z += p.vz * dt + Math.cos(t + p.phase) * 0.02;
                }
                if (p.age > p.life) resetSteamParticle(p);

                const fade = 1 - p.age / p.life;
                const scale = 0.8 + (1 - fade) * 1.5;
                _p.set(p.x, p.y, p.z);
                _q.identity();
                _s.set(scale, scale, scale);
                _m.compose(_p, _q, _s);
                steamMesh.setMatrixAt(i, _m);
            }
            steamMesh.instanceMatrix.needsUpdate = true;
        }

        // Ash drift
        for (let i = 0; i < ASH_COUNT; i++) {
            const p = ashParticles[i];
            const ax = p.x + Math.sin(t * 0.3 + p.phase) * 2 + p.vx * t * 0.5;
            const ay = p.y + p.vy * t + Math.sin(t * 0.5 + p.phase * 2) * 0.5;
            const az = p.z + Math.cos(t * 0.25 + p.phase) * 2;
            // Wrap around
            const wx = ((ax % 70) + 70) % 70 - 35;
            const wy = ((ay % 30) + 30) % 30 + 5;
            const wz = ((az % 70) + 70) % 70 - 35;
            _p.set(wx, wy, wz);
            _q.identity();
            _s.set(1, 1, 1);
            _m.compose(_p, _q, _s);
            ashMesh.setMatrixAt(i, _m);
        }
        ashMesh.instanceMatrix.needsUpdate = true;

        // Seismic rumble
        let seismicShake = { x: 0, y: 0 };
        if (seismicActive) {
            seismicTimer += dt;
            if (seismicTimer >= SEISMIC_DURATION) {
                seismicActive = false;
                seismicTimer = 0;
            } else {
                const intensity = 1 - seismicTimer / SEISMIC_DURATION;
                seismicShake.x = (Math.random() - 0.5) * 0.3 * intensity;
                seismicShake.y = (Math.random() - 0.5) * 0.2 * intensity;
            }
        }

        return { seismicShake, seismicActive };
    }

    return {
        updateEffects,
        triggerSeismic,
        setLavaOn,
        setSteamOn,
        setLavaSpeed,
    };
}

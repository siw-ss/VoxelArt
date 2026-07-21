import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  LANTERNS — Sky lantern particle system + boat release mechanic
// ---------------------------------------------------------------------------

const LANTERN_CONFIG = {
    maxCount: 150,
    defaultCount: 80,
    spawnRadius: 38,
    minY: 15,
    maxY: 80,
    fadeY: 90,
    driftSpeedMin: 0.3,
    driftSpeedMax: 0.8,
    lateralDriftMax: 0.3,
    swayAmplitude: 0.5,
    glowMin: 0.4,
    glowMax: 0.8,
    releaseInterval: 10,
    releaseRiseSpeed: 2.0,
    releaseRiseEnd: 8,
};

export function createLanternSystem({ root }) {
    const config = { ...LANTERN_CONFIG };
    let activeCount = config.defaultCount;
    let releaseTimer = config.releaseInterval;
    let releasingLantern = null;

    // Lantern geometry: small cube per lantern
    const geo = new THREE.BoxGeometry(1.2, 1.6, 1.2);
    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffe4a0'),
        emissive: new THREE.Color('#ffcc44'),
        emissiveIntensity: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 1.0,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, config.maxCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    root.add(mesh);

    // Per-lantern state
    const particles = [];
    for (let i = 0; i < config.maxCount; i++) {
        particles.push({
            x: 0, y: 0, z: 0,
            vy: 0, vx: 0, vz: 0,
            swayPhase: 0, glowPhase: 0,
            active: false, opacity: 1,
        });
    }

    function resetParticle(i, fromBoat = false) {
        const p = particles[i];
        if (fromBoat) {
            p.x = (Math.random() - 0.5) * 2;
            p.y = 2;
            p.z = (Math.random() - 0.5) * 2;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * config.spawnRadius;
            p.x = Math.cos(angle) * r;
            p.z = Math.sin(angle) * r;
            p.y = config.minY + Math.random() * (config.maxY - config.minY);
        }
        p.vy = config.driftSpeedMin + Math.random() * (config.driftSpeedMax - config.driftSpeedMin);
        p.vx = (Math.random() - 0.5) * config.lateralDriftMax * 2;
        p.vz = (Math.random() - 0.5) * config.lateralDriftMax * 2;
        p.swayPhase = Math.random() * Math.PI * 2;
        p.glowPhase = Math.random() * Math.PI * 2;
        p.active = true;
        p.opacity = 1;
    }

    // Initialize active lanterns
    for (let i = 0; i < activeCount; i++) {
        resetParticle(i);
    }

    const _mat4 = new THREE.Matrix4();
    const _pos = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _scale = new THREE.Vector3(1, 1, 1);
    const _color = new THREE.Color();

    function update(dt, elapsed) {
        // Boat release mechanic
        releaseTimer -= dt;
        if (releaseTimer <= 0 && !releasingLantern) {
            releaseTimer = config.releaseInterval;
            // Find an inactive slot or reuse one at top
            let slot = -1;
            for (let i = 0; i < config.maxCount; i++) {
                if (!particles[i].active) { slot = i; break; }
            }
            if (slot === -1) slot = Math.floor(Math.random() * activeCount);
            resetParticle(slot, true);
            releasingLantern = { index: slot, progress: 0 };
        }

        // Update releasing lantern
        if (releasingLantern) {
            const p = particles[releasingLantern.index];
            releasingLantern.progress += dt / 3; // 3 seconds to rise
            if (releasingLantern.progress >= 1) {
                releasingLantern = null;
            } else {
                p.y = 2 + releasingLantern.progress * (config.releaseRiseEnd - 2);
                p.vy = 0; // Hold until fully released
            }
        }

        // Update all particles
        for (let i = 0; i < config.maxCount; i++) {
            if (i < activeCount || particles[i].active) {
                const p = particles[i];
                if (!p.active) { resetParticle(i); }

                // Skip rising lanterns
                if (releasingLantern && releasingLantern.index === i) {
                    // Just position it, don't drift
                } else {
                    p.y += p.vy * dt;
                    p.x += p.vx * dt + Math.sin(elapsed + p.swayPhase) * 0.02;
                    p.z += p.vz * dt + Math.cos(elapsed * 0.7 + p.swayPhase) * 0.02;
                }

                // Fade out at top
                if (p.y > config.fadeY) {
                    p.opacity -= dt * 0.5;
                    if (p.opacity <= 0) {
                        resetParticle(i);
                    }
                }

                // Sway
                const sway = Math.sin(elapsed * 0.8 + p.swayPhase) * config.swayAmplitude;
                _pos.set(p.x + sway * 0.3, p.y, p.z);
                _mat4.compose(_pos, _quat, _scale);
            } else {
                _mat4.makeScale(0, 0, 0);
            }

            mesh.setMatrixAt(i, _mat4);

            // Glow color variation
            const glowT = (Math.sin(elapsed * 0.6 + (particles[i].glowPhase || 0)) + 1) * 0.5;
            const intensity = config.glowMin + glowT * (config.glowMax - config.glowMin);
            _color.setRGB(1, 0.75 + glowT * 0.15, 0.2 + glowT * 0.3);
            mesh.setColorAt(i, _color);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    function setCount(n) {
        activeCount = Math.max(0, Math.min(config.maxCount, Math.round(n)));
    }

    function setSpeed(multiplier) {
        const clamped = Math.max(0.2, Math.min(2.0, multiplier));
        for (const p of particles) {
            p.vy = (config.driftSpeedMin + Math.random() * (config.driftSpeedMax - config.driftSpeedMin)) * clamped;
        }
    }

    function setReleaseInterval(seconds) {
        config.releaseInterval = Math.max(4, Math.min(20, seconds));
    }

    return { update, setCount, setSpeed, setReleaseInterval, mesh, _config: config };
}

import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  SNOW PARTICLE SYSTEM — animated InstancedMesh of small white cubes
//  drifting downward with wind. Follows the same pattern as PagodaGarden petals.
// ---------------------------------------------------------------------------

export const SNOW = {
    maxCount: 800,
    defaultCount: 300,
    spawnYMin: 40,
    spawnYMax: 60,
    spawnRadius: 40,
    fallSpeedMin: 1.0,
    fallSpeedMax: 3.0,
    driftMin: 0.5,
    driftMax: 2.0,
    sizeMin: 0.2,
    sizeMax: 0.5,
    opacityMin: 0.4,
    opacityMax: 0.9,
    floorY: 0,
    boundaryPadding: 10,
};

/**
 * Create the snow particle system.
 * @param {{ root: THREE.Object3D }} params
 * @returns {{ update: (dt: number) => void, setCount: (n: number) => void, mesh: THREE.InstancedMesh, particles: object[], _config: object, resetParticle: (i: number) => void }}
 */
export function createSnowSystem({ root }) {
    const config = { ...SNOW };

    // Geometry and material
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.7,
    });

    // InstancedMesh pre-allocated at max count
    const mesh = new THREE.InstancedMesh(geo, mat, config.maxCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    root.add(mesh);

    // Particle state array
    const particles = [];
    for (let i = 0; i < config.maxCount; i++) {
        particles.push({ x: 0, y: 0, z: 0, vy: 0, vx: 0, vz: 0, size: 0, opacity: 0 });
    }

    /**
     * Reset a single particle to a valid random spawn state.
     */
    function resetParticle(i) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * config.spawnRadius;
        particles[i].x = Math.cos(angle) * r;
        particles[i].z = Math.sin(angle) * r;
        particles[i].y = config.spawnYMin + Math.random() * (config.spawnYMax - config.spawnYMin);
        particles[i].vy = config.fallSpeedMin + Math.random() * (config.fallSpeedMax - config.fallSpeedMin);
        particles[i].vx = (Math.random() - 0.5) * 2 * config.driftMax;
        particles[i].vz = (Math.random() - 0.5) * 2 * config.driftMax;
        particles[i].size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
        particles[i].opacity = config.opacityMin + Math.random() * (config.opacityMax - config.opacityMin);
    }

    // Initialize all particles
    for (let i = 0; i < config.maxCount; i++) {
        resetParticle(i);
    }

    let activeCount = config.defaultCount;

    // Reusable matrix helpers
    const _mat4 = new THREE.Matrix4();
    const _pos = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _scale = new THREE.Vector3();

    /**
     * Per-frame update: move active particles, reset out-of-bounds, hide inactive.
     */
    function update(dt) {
        const boundary = config.spawnRadius + config.boundaryPadding;

        for (let i = 0; i < config.maxCount; i++) {
            if (i < activeCount) {
                const p = particles[i];

                // Update position
                p.y -= p.vy * dt;
                p.x += p.vx * dt;
                p.z += p.vz * dt;

                // Check bounds: below floor or beyond boundary
                const xzDist = Math.sqrt(p.x * p.x + p.z * p.z);
                if (p.y < config.floorY || xzDist > boundary) {
                    resetParticle(i);
                }

                // Set instance matrix with particle size
                _pos.set(p.x, p.y, p.z);
                _scale.set(p.size, p.size, p.size);
                _mat4.compose(_pos, _quat, _scale);
            } else {
                // Inactive: scale to 0 to hide
                _mat4.makeScale(0, 0, 0);
            }

            mesh.setMatrixAt(i, _mat4);
        }

        mesh.instanceMatrix.needsUpdate = true;
    }

    /**
     * Set active particle count, clamped to [0, maxCount].
     */
    function setCount(n) {
        activeCount = Math.max(0, Math.min(config.maxCount, Math.round(n)));
    }

    return {
        update,
        setCount,
        mesh,
        particles,
        _config: config,
        resetParticle,
    };
}

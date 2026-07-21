import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
//  EFFECTS — Fireflies, water reflection plane, clouds
// ---------------------------------------------------------------------------

// --- FIREFLIES ---
const FIREFLY_CONFIG = { count: 150, radius: 45, innerRadius: 33, yMin: 1, yMax: 12 };

export function createFireflies({ root }) {
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshBasicMaterial({
        color: '#ccff66',
        transparent: true,
        opacity: 0.8,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, FIREFLY_CONFIG.count);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh);

    const flies = [];
    for (let i = 0; i < FIREFLY_CONFIG.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = FIREFLY_CONFIG.innerRadius + Math.random() * (FIREFLY_CONFIG.radius - FIREFLY_CONFIG.innerRadius);
        flies.push({
            x: Math.cos(angle) * r,
            y: FIREFLY_CONFIG.yMin + Math.random() * (FIREFLY_CONFIG.yMax - FIREFLY_CONFIG.yMin),
            z: Math.sin(angle) * r,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.3,
            vz: (Math.random() - 0.5) * 0.5,
            blinkPhase: Math.random() * Math.PI * 2,
            blinkSpeed: 1.5 + Math.random() * 1.5,
        });
    }

    const _mat4 = new THREE.Matrix4();
    const _pos = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _scale = new THREE.Vector3();
    let visible = true;

    function update(dt, elapsed) {
        for (let i = 0; i < FIREFLY_CONFIG.count; i++) {
            const f = flies[i];

            if (visible) {
                // Brownian motion
                f.vx += (Math.random() - 0.5) * 0.8 * dt;
                f.vy += (Math.random() - 0.5) * 0.5 * dt;
                f.vz += (Math.random() - 0.5) * 0.8 * dt;
                f.vx *= 0.95; f.vy *= 0.95; f.vz *= 0.95;

                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.z += f.vz * dt;

                // Boundary
                const dist = Math.sqrt(f.x * f.x + f.z * f.z);
                if (dist > FIREFLY_CONFIG.radius) { f.vx *= -1; f.vz *= -1; }
                if (dist < FIREFLY_CONFIG.innerRadius) { f.vx *= -1; f.vz *= -1; }
                f.y = Math.max(FIREFLY_CONFIG.yMin, Math.min(FIREFLY_CONFIG.yMax, f.y));

                // Blink
                const blink = (Math.sin(elapsed * f.blinkSpeed + f.blinkPhase) + 1) * 0.5;
                const s = blink * 0.4 + 0.1;
                _pos.set(f.x, f.y, f.z);
                _scale.set(s, s, s);
                _mat4.compose(_pos, _quat, _scale);
            } else {
                _mat4.makeScale(0, 0, 0);
            }
            mesh.setMatrixAt(i, _mat4);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    function setVisible(on) { visible = on; }

    return { update, setVisible };
}

// --- WATER REFLECTION PLANE ---
export function createWaterReflection({ root }) {
    const geo = new THREE.CircleGeometry(35, 64);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.position.y = 0.55;
    plane.renderOrder = 1;
    root.add(plane);

    function update(dt, elapsed) { }

    function setTimeOfDay(t) {
        // Water stays blue at all times — just darkens from light blue to deep navy
        if (t < 0.2) {
            // Bright daytime — no overlay needed, voxels are light blue
            mat.opacity = 0;
        } else {
            // Progressively darken with deep blue overlay
            const s = (t - 0.2) / 0.8;
            mat.color.set('#0a1838');
            mat.opacity = s * 0.7;
        }
    }

    return { update, setTimeOfDay, mesh: plane };
}

// --- CLOUDS ---
export function createClouds({ root }) {
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.BoxGeometry(4, 1, 2);
    const cloudMat = new THREE.MeshBasicMaterial({
        color: '#7b4a8b',
        transparent: true,
        opacity: 0.25,
    });

    for (let i = 0; i < 4; i++) {
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 80,
            50 + Math.random() * 15,
            (Math.random() - 0.5) * 80,
        );
        cloud.scale.set(2 + Math.random() * 3, 0.5, 1 + Math.random());
        cloudGroup.add(cloud);
    }
    root.add(cloudGroup);

    function update(dt) {
        cloudGroup.position.x += 0.003;
        if (cloudGroup.position.x > 20) cloudGroup.position.x = -20;
    }

    return { update, cloudGroup };
}

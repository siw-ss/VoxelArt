// ---------------------------------------------------------------------------
//  DRAGONS — Animated ice dragons built from voxels, circling the palace
//  Two flight modes: soaring (orbiting above) and perched (landed on spires)
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';

const DRAGON_CONFIG = {
    count: 3,
    orbitRadius: 28,
    orbitHeight: 38,
    orbitSpeed: 0.3,
    wingFlapSpeed: 4.0,
    wingAmplitude: 0.4,
    bodyLength: 6,
    wingspan: 10,
    // Ice dragon palette
    bodyColors: ['#b0e0e6', '#87ceeb', '#aff0ef', '#e0ffff'],
    wingColors: ['#7fdbff', '#66ddff', '#88ccff'],
    eyeColor: '#00ffff',
    breathColor: '#aaeeff',
};

/**
 * Build a single voxel-style dragon mesh group.
 * Uses merged BoxGeometry for a chunky voxel aesthetic.
 */
function buildDragonMesh() {
    const group = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(DRAGON_CONFIG.bodyColors[0]),
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color('#88ccff'),
        emissiveIntensity: 0.15,
    });

    const wingMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(DRAGON_CONFIG.wingColors[0]),
        roughness: 0.2,
        metalness: 0.15,
        emissive: new THREE.Color('#7fdbff'),
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.85,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(DRAGON_CONFIG.eyeColor),
        emissive: new THREE.Color(DRAGON_CONFIG.eyeColor),
        emissiveIntensity: 1.0,
    });

    const voxSize = 0.7;
    const cubeGeo = new THREE.BoxGeometry(voxSize, voxSize, voxSize);

    // --- Body (elongated, 6 voxels long) ---
    const bodyVoxels = [
        // Spine (main body line)
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 4, y: 0.1, z: 0 },   // slight upward curve at tail
        { x: 5, y: 0.3, z: 0 },   // tail tip rises
        // Belly width
        { x: 0, y: -0.5, z: 0 },
        { x: 1, y: -0.5, z: 0 },
        { x: 2, y: -0.5, z: 0 },
        // Neck (front, rises up)
        { x: -1, y: 0.3, z: 0 },
        { x: -2, y: 0.7, z: 0 },
    ];

    // --- Head ---
    const headVoxels = [
        { x: -3, y: 1.0, z: 0 },
        { x: -3, y: 1.0, z: 0.4 },
        { x: -3, y: 1.0, z: -0.4 },
        { x: -3.5, y: 1.2, z: 0 },  // snout
    ];

    // --- Eyes ---
    const eyeVoxels = [
        { x: -3, y: 1.3, z: 0.3 },
        { x: -3, y: 1.3, z: -0.3 },
    ];

    // --- Tail (extends further back, tapering) ---
    const tailVoxels = [
        { x: 6, y: 0.5, z: 0 },
        { x: 7, y: 0.7, z: 0 },
        { x: 8, y: 0.8, z: 0.2 },
        { x: 8, y: 0.8, z: -0.2 },  // tail fork
    ];

    // --- Horns (on head) ---
    const hornVoxels = [
        { x: -2.5, y: 1.7, z: 0.3 },
        { x: -2.5, y: 1.7, z: -0.3 },
        { x: -2.2, y: 2.1, z: 0.2 },
        { x: -2.2, y: 2.1, z: -0.2 },
    ];

    // Build body instances
    function addVoxels(positions, material, parent) {
        for (const pos of positions) {
            const mesh = new THREE.Mesh(cubeGeo, material);
            mesh.position.set(pos.x * voxSize, pos.y * voxSize, pos.z * voxSize);
            mesh.castShadow = true;
            parent.add(mesh);
        }
    }

    const bodyGroup = new THREE.Group();
    addVoxels(bodyVoxels, bodyMat, bodyGroup);
    addVoxels(headVoxels, bodyMat, bodyGroup);
    addVoxels(tailVoxels, bodyMat, bodyGroup);
    addVoxels(hornVoxels, wingMat, bodyGroup);
    addVoxels(eyeVoxels, eyeMat, bodyGroup);
    group.add(bodyGroup);

    // --- Wings (separate groups for animation) ---
    const leftWing = new THREE.Group();
    const rightWing = new THREE.Group();

    const wingVoxels = [
        // Inner wing
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 },
        { x: 1, y: 0, z: 2 },
        { x: 2, y: 0, z: 2 },
        // Outer wing (larger)
        { x: 0, y: 0, z: 3 },
        { x: 1, y: 0, z: 3 },
        { x: 2, y: 0, z: 3 },
        { x: 3, y: 0, z: 3 },
        // Wing tip
        { x: 0, y: 0, z: 4 },
        { x: 1, y: 0, z: 4 },
        { x: 2, y: 0, z: 4 },
        // Extended tip
        { x: 0, y: 0, z: 5 },
        { x: 1, y: 0, z: 5 },
    ];

    addVoxels(wingVoxels, wingMat, leftWing);

    // Mirror for right wing
    const rightWingVoxels = wingVoxels.map(v => ({ x: v.x, y: v.y, z: -v.z }));
    addVoxels(rightWingVoxels, wingMat, rightWing);

    // Position wings at shoulder
    leftWing.position.set(0, 0.2 * voxSize, 0);
    rightWing.position.set(0, 0.2 * voxSize, 0);

    group.add(leftWing);
    group.add(rightWing);

    // Scale the whole dragon
    group.scale.setScalar(0.8);

    return { group, leftWing, rightWing, bodyGroup };
}

/**
 * Create the dragon system.
 * @param {{ root: THREE.Object3D }} params
 * @returns {{ update: (dt, elapsed) => void, setVisible: (on) => void }}
 */
export function createDragons({ root }) {
    const dragons = [];

    for (let i = 0; i < DRAGON_CONFIG.count; i++) {
        const { group, leftWing, rightWing } = buildDragonMesh();

        // Each dragon starts at a different phase in orbit
        const phaseOffset = (i / DRAGON_CONFIG.count) * Math.PI * 2;
        // Slight height variation
        const heightOffset = (Math.random() - 0.5) * 8;
        // Slight radius variation
        const radiusOffset = (Math.random() - 0.5) * 6;

        const dragon = {
            group,
            leftWing,
            rightWing,
            phaseOffset,
            heightOffset,
            radiusOffset,
            flapOffset: Math.random() * Math.PI * 2,
            orbitDirection: i % 2 === 0 ? 1 : -1, // alternate directions
            bobPhase: Math.random() * Math.PI * 2,
        };

        root.add(group);
        dragons.push(dragon);
    }

    const container = new THREE.Group();
    container.name = 'dragons';

    function update(dt, elapsed) {
        for (const dragon of dragons) {
            // Orbit position
            const angle = elapsed * DRAGON_CONFIG.orbitSpeed * dragon.orbitDirection + dragon.phaseOffset;
            const radius = DRAGON_CONFIG.orbitRadius + dragon.radiusOffset;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const bob = Math.sin(elapsed * 0.8 + dragon.bobPhase) * 1.5;
            const y = DRAGON_CONFIG.orbitHeight + dragon.heightOffset + bob;

            dragon.group.position.set(x, y, z);

            // Face direction of travel (tangent to orbit)
            const tangentAngle = angle + (dragon.orbitDirection > 0 ? -Math.PI / 2 : Math.PI / 2);
            dragon.group.rotation.y = tangentAngle;

            // Slight banking into the turn
            dragon.group.rotation.z = dragon.orbitDirection * 0.15;

            // Wing flap
            const flapAngle = Math.sin(elapsed * DRAGON_CONFIG.wingFlapSpeed + dragon.flapOffset) * DRAGON_CONFIG.wingAmplitude;
            dragon.leftWing.rotation.x = flapAngle;
            dragon.rightWing.rotation.x = -flapAngle;
        }
    }

    function setVisible(on) {
        for (const dragon of dragons) {
            dragon.group.visible = on;
        }
    }

    return { update, setVisible, dragons, _config: DRAGON_CONFIG };
}
